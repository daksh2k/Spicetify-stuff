import CFM from "./config";

// Perspective HUD: simulates the TV overlay on a screen curved inwards around a vertical axis, like
// a curved monitor or a HUD lens. Nothing is stretched sideways and nothing turns. Every point
// keeps its horizontal position and is pulled toward the screen's horizontal midline, more the
// closer it is to the middle of the screen, so rows of text, the progress bar and the artwork bend
// in one smooth arc: rows below the midline arch up toward the middle, rows above it dip down.
//
// A point (x, y) is drawn at (x, cy + (y - cy) h(x)) with h(x) = 1 - k (1 - u^2), where u is -1 at
// the HUD's left margin, 0 at the screen centre and 1 at its right margin. h is 1 at the margins,
// so the HUD's outer edges and their gaps to the screen edge are unchanged, and 1 - k in the
// middle. The arc is level in the middle (no sharp point) and keeps getting steeper all the way
// out to the edges, like a curved screen, rather than flattening off near them.
//
// Nothing on the HUD is resampled (that aliases edges and text). Every word, icon and the progress
// bar are sheared and scaled vertically to their slice of the arc: upright edges stay upright and
// horizontal ones follow the curve, the artwork included. Changing the strength or switching the
// effect eases the bend in and out instead of snapping. Text blocks are sheared as a whole first, so their
// clipping boxes follow the curve with their words. Buttons and icons move with the curve. Lyric
// lines stay where lyrics-plus puts them and their words bend around each line's middle, so the
// lyrics keep their usual height on screen. Only the blurred background is bent as an image.

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// At 100% strength the middle of the screen is drawn MAX_BEND closer to the midline (the user's
// chosen maximum, after trying 0.18 and 0.72).
const MAX_BEND = 0.36;
// How quickly the bend follows a change (time constant, ms): strength, switching it on or off, and
// a panel's bend flipping when it moves to the other half of the screen all ease instead of snap.
const EASE_MS = 250;
// Set while the curve is drawn, including while it eases out; the curve's CSS keys off it.
const CURVING = "hud-curving";

const LYRIC_LINES = "#fad-lyrics-plus-container .lyrics-lyricsContainer-LyricsLine";
// Text blocks bend as a whole and their words bend inside them. Lyric lines are placed by
// lyrics-plus's own transform, so they only move; the others are sheared.
const BLOCKS = [
    "#fsd-ctx-details",
    "#fsd-title > span",
    "#fsd-artist > span",
    "#fsd-album > span",
    "#fsd_up_next_text",
    LYRIC_LINES,
].join(", ");
const LINE = "fsd-curve-line";
const WORD = "fsd-curve-word";
// Small pieces that move with the curve as a whole. The perspective slider itself is left flat:
// bending it would move the track under the pointer while it is being dragged.
const PIECES = [
    "#fsd_next_tit_art",
    "#fsd-volume-container > *",
    // The clock card moves as a whole: moving its contents left them behind their card.
    "#fsd-overview-card",
].join(", ");
// Buttons are sheared about their centre, so their hover and active backgrounds bend with them.
// Their own hover zoom moves to the `scale` property while the curve is on (tvMode.scss).
const BUTTONS = [".fsd-controls button", ".extra-controls button", "#fad-lyrics-plus-container .lyrics-config-button"].join(", ");
// Images, icons and shapes without a transform of their own: sheared like words, so they bend
// with the curve too (the artwork, the disc icon, the progress bar and its times).
const BENT = [
    "#fsd-art",
    "#fsd-progress-bar",
    "#fsd_next_art",
    "#fsd-ctx-icon",
    "#fsd-title > svg",
    "#fsd-artist > svg",
    "#fsd-album > svg",
    "#fsd-elapsed",
    "#fsd-duration",
].join(", ");
// The HUD's side margins are read from these, which only move when the layout does.
const LEFT_EDGE = "#fsd-ctx-icon, #fsd-art";
const DEFS = "fsd-curve-defs";
// Each cluster of the HUD bends as one curved panel: everything in it is bent by the curve at the
// cluster's middle height, so its rows keep their spacing and letters keep their height (bending
// each row by its own height squashed text and crowded rows at high strength). Lyric lines are
// their own panels.
const GROUPS =
    "#fsd-foreground, #fsd-ctx-container, #fsd-upnext-container, #fsd-volume-container, #fsd-overview-card, #fad-lyrics-plus-container";
// Every panel bends by the same amount, as if it sat this far (a share of the screen height) from
// the screen's middle row: panels in the bottom half arc up toward the middle, panels in the top
// half arc down. Bending by each panel's real distance made the outer panels bend far harder
// than the lyrics near the middle.
const ARM = 0.3;
// Depth: on a screen curved inwards the sides are closer, so things there are drawn a little bigger
// and things toward the middle a little smaller, evenly in both directions, about their own centres.
// Without it, strong bends read as panels tilted up rather than a screen curving in. At 100% this
// is about 9% either way.
const DEPTH = 0.5;
let groupRefs = new Map<Element, number>();
// Each panel's bend lever, eased toward its target so a panel crossing the middle row turns its
// bend over smoothly.
const groupArms = new Map<Element, number>();
let easeStep = 1;
// Rows the curve leaves alone while the pointer is over them (app.tsx sets controls-held).
const HELD = "#fsd-status, #fsd-progress-parent";

// A sheared box: its top-left corner is lifted by `lift` screen px and each px to the right is
// lifted `shear` px more.
// `size` is the scale written to the element; for a button `base` is the curve's own scale before the
// hover zoom (see placeCentred).
type Shear = { shear: number; lift: number; size?: number; shift?: number; base?: number };
// A box on the flat layout, in screen px, and the scale its ancestors draw it at.
type Flat = { left: number; top: number; width: number; height: number; scale: number };
// A piece moved as a whole: vertical offset and vertical scale about its transform origin.
type Move = { dy: number; tall: number };

// The bend drawn now, the one it is easing toward, and the one the background was last built for.
let bend = 0;
let targetBend = 0;
let backgroundBend = 0;
let lastTime = 0;
let margins = { left: 0, right: 0 };
let container: HTMLElement | null = null;
let frame = 0;
let textObserver: MutationObserver | null = null;
const sheared = new WeakMap<Element, Shear>();
const moved = new WeakMap<Element, Move>();
const written = new WeakMap<Element, string>();

// Button hover zoom while the curve is on. A CSS `scale` sits on top of the curve's transform, so it
// also scaled the curve's lift: the button moved up as it grew, and was measured bigger, which fed
// back into the bend. The curve eases each button's zoom into its own matrix instead, about the
// button's centre, so it grows in place (its hit area only grows) over the same 0.15s as with the
// curve off.
const HOVER_ZOOM = 1.08;
const HOVER_MS = 50;
const zooms = new WeakMap<Element, number>();
let zoomStep = 1;

export function setHudPerspectiveStrength(element: HTMLElement, value: number) {
    container = element;
    const normalized = clamp(Number(value) || 0, 0, 100) / 100;
    const compactScale = window.innerWidth <= 800 ? 0.55 : 1;
    const enabled = element.classList.contains("hud-perspective");
    targetBend = enabled ? MAX_BEND * normalized * compactScale : 0;
    if (shown() && (targetBend > 0 || bend > 0)) start();
    else stop();
}

function shown() {
    return Boolean(container?.isConnected && document.body.classList.contains("fsd-activated"));
}

function start() {
    container?.classList.add(CURVING);
    splitWords();
    if (!textObserver && container) {
        // Song changes replace the text and lyric lines; split the new words as they arrive.
        textObserver = new MutationObserver(() => {
            splitWords();
            textObserver?.takeRecords();
        });
        textObserver.observe(container, { childList: true, characterData: true, subtree: true });
    }
    if (!frame) {
        lastTime = performance.now();
        frame = requestAnimationFrame(tick);
    }
}

function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    bend = 0;
    textObserver?.disconnect();
    textObserver = null;
    updateBackground();
    if (!container) return;
    for (const element of container.querySelectorAll<HTMLElement>(`${BLOCKS}, ${WORD}, ${PIECES}, ${BENT}, ${BUTTONS}`)) reset(element);
    container.querySelector("#fsd-progress-curve")?.remove();
    joinWords();
    container.classList.remove(CURVING);
}

function reset(element: HTMLElement) {
    for (const property of ["transform", "translate", "scale"]) element.style.removeProperty(property);
    if (element.tagName === WORD.toUpperCase()) {
        element.style.removeProperty("mask-image");
        element.style.removeProperty("-webkit-mask-image");
    }
    sheared.delete(element);
    moved.delete(element);
    written.delete(element);
    zooms.delete(element);
}

// How deep into the curve x is: 1 at the centre, 0 at the HUD's margins (and a little below 0
// past them, so the curve carries on smoothly to the screen edge), and its slope.
function depthAt(x: number) {
    const cx = window.innerWidth / 2;
    const half = x < cx ? cx - margins.left : margins.right - cx;
    if (half <= 0) return { depth: 0, slope: 0 };
    const u = (x - cx) / half;
    return { depth: 1 - u * u, slope: (-2 * u) / half };
}

// h(x): how far the screen at x is drawn from the midline, relative to flat.
function heightAt(x: number, k = bend) {
    return 1 - k * depthAt(x).depth;
}

// The depth size for something centred at x.
function sizeAt(x: number) {
    return 1 + DEPTH * bend * (0.5 - depthAt(x).depth);
}

// dh/dx.
function heightSlopeAt(x: number) {
    return -bend * depthAt(x).slope;
}

const midline = () => window.innerHeight / 2;
// The height a piece is bent at: its panel's middle, or its own middle outside any panel.
function refFor(element: Element, ownY: number) {
    const group = element.closest(GROUPS);
    return (group && groupRefs.get(group)) ?? ownY;
}

// The bend's lever for a panel whose middle is at `ref`: the same length for every panel, pointing
// toward the middle row from whichever half of the screen the panel is in.
function armFor(ref: number) {
    return (ref >= midline() ? 1 : -1) * ARM * window.innerHeight;
}

// The eased lever of the panel an element belongs to (or its own, outside any panel).
function armOf(element: Element, ownY: number) {
    const group = element.closest(GROUPS);
    return (group && groupArms.get(group)) ?? armFor(refFor(element, ownY));
}

function onScreen(box: Flat) {
    return box.left + box.width > 0 && box.left < window.innerWidth && box.top + box.height > 0 && box.top < window.innerHeight;
}

// A sheared box's flat layout: it never moves sideways, and its top-left corner was lifted by its
// own last lift plus whatever its block's shear and lift did at that point.
function shearedFlat(element: HTMLElement, parent: Shear | null, parentLeft: number): Flat | null {
    const box = element.getBoundingClientRect();
    const [layoutWidth, layoutHeight] = layoutSize(element);
    if (!box.width || !box.height || !layoutWidth) return null;
    const last = sheared.get(element) ?? { shear: 0, lift: 0 };
    const size = last.size ?? 1;
    const width = box.width / size;
    const left = box.left - (last.shift ?? 0);
    const scale = width / layoutWidth;
    const shear = last.shear + (parent?.shear ?? 0);
    const parentLift = parent ? parent.lift + parent.shear * (box.left - parentLeft) : 0;
    const top = box.top - Math.min(0, size * shear * width) - last.lift - parentLift;
    return { left, top, width, height: layoutHeight * scale, scale };
}

// An element's untransformed size. SVG icons have no offsetWidth/offsetHeight, so theirs is read
// from their CSS box instead (they would otherwise be skipped and stay put while the text beside
// them follows the curve).
function layoutSize(element: Element): [number, number] {
    if (element instanceof HTMLElement) return [element.offsetWidth, element.offsetHeight];
    const style = getComputedStyle(element);
    return [parseFloat(style.width) || 0, parseFloat(style.height) || 0];
}

// A piece's flat layout: undoes its last vertical move and scale about its transform origin.
function movedFlat(element: HTMLElement): (Flat & { origin: number }) | null {
    const box = element.getBoundingClientRect();
    if (!box.width || !box.height) return null;
    const last = moved.get(element) ?? { dy: 0, tall: 1 };
    const layoutWidth = layoutSize(element)[0];
    const scale = layoutWidth ? box.width / layoutWidth : 1;
    const originY = (parseFloat(getComputedStyle(element).transformOrigin.split(" ")[1]) || 0) * scale;
    const top = box.top - last.dy - originY * (1 - last.tall);
    return { left: box.left, top, width: box.width, height: box.height / last.tall, scale, origin: originY };
}

// How far the curve moves a point vertically.
// How far the curve moves a panel whose middle is at height `ref`, at x.
const liftAt = (x: number, arm: number) => arm * (heightAt(x) - 1);

// Shears a text block so its centre lands on the curve and its slope follows the curve there.
function placeBlock(block: HTMLElement, flat: Flat): Shear {
    const cx = flat.left + flat.width / 2;
    const cy = flat.top + flat.height / 2;
    const arm = armOf(block, cy);
    const shear = arm * heightSlopeAt(cx);
    const lift = liftAt(cx, arm) - shear * (flat.width / 2);
    sheared.set(block, { shear, lift });
    const key = `${shear.toFixed(4)}|${lift.toFixed(1)}`;
    if (written.get(block) !== key) {
        written.set(block, key);
        block.style.transform = `matrix(1, ${shear.toFixed(4)}, 0, 1, 0, ${(lift / flat.scale).toFixed(2)})`;
    }
    return { shear, lift };
}

// Shears and scales a box (a word, the artwork, the progress bar) vertically to its slice of the
// curve, on top of what its block already does to it. `pin` is subtracted from the curve's lift:
// lyric words use their line's own lift there, so each line bends around its middle and stays at
// its usual height.
// A button sheared about its centre: the shear and vertical scale leave the centre where it is,
// so the centre only moves by the curve's lift there. `lift` is that move, in screen px.
function centredFlat(button: HTMLElement): Flat | null {
    const box = button.getBoundingClientRect();
    const [layoutWidth, layoutHeight] = layoutSize(button);
    if (!box.width || !box.height || !layoutWidth) return null;
    const last = sheared.get(button);
    const size = last?.size ?? 1;
    const width = box.width / size;
    const scale = width / layoutWidth;
    const height = layoutHeight * scale;
    const cx = (box.left + box.right) / 2;
    const cy = (box.top + box.bottom) / 2 - (last?.lift ?? 0);
    return { left: cx - width / 2, top: cy - height / 2, width, height, scale };
}

// A held button (controls-held: the pointer is on its row) keeps its bend and only its zoom moves.
function placeCentred(button: HTMLElement, flat: Flat, held = false) {
    const target = button.matches(":hover") ? HOVER_ZOOM : 1;
    const current = zooms.get(button) ?? 1;
    const zoom = Math.abs(target - current) < 0.0005 ? target : current + (target - current) * zoomStep;
    zooms.set(button, zoom);
    const last = sheared.get(button);
    let shear: number;
    let lift: number;
    let base: number;
    if (held && last) {
        ({ shear, lift } = last);
        base = last.base ?? last.size ?? 1;
    } else {
        const cx = flat.left + flat.width / 2;
        const cy = flat.top + flat.height / 2;
        const arm = armOf(button, cy);
        shear = arm * heightSlopeAt(cx);
        lift = liftAt(cx, arm);
        base = sizeAt(cx);
    }
    const size = base * zoom;
    sheared.set(button, { shear, lift, size, base });
    const key = `${shear.toFixed(4)}|${lift.toFixed(1)}|${size.toFixed(3)}`;
    if (written.get(button) !== key) {
        written.set(button, key);
        button.style.transform = `matrix(${size.toFixed(3)}, ${(size * shear).toFixed(4)}, 0, ${size.toFixed(3)}, 0, ${(lift / flat.scale).toFixed(2)})`;
    }
}

// Lyric words fade out toward the top and bottom of the lyrics area by where they sit before the
// curve moves them, so the fade follows the curve (a flat mask cut curved lines straight across).
let lyricsArea: { top: number; height: number } | null = null;
const smooth = (t: number) => {
    const c = clamp(t, 0, 1);
    return c * c * (3 - 2 * c);
};

function lyricFadeAt(y: number) {
    if (!lyricsArea || !lyricsArea.height) return 1;
    const t = (y - lyricsArea.top) / lyricsArea.height;
    return Math.min(smooth(t / 0.14), smooth((1 - t) / 0.2));
}

// Each word gets a vertical gradient mask from the fade at its unbent top to the fade at its
// unbent bottom, so the fade runs smoothly through words and along a line (a single opacity per
// word left lines blotchy where they crossed the fade).
function fadeWord(word: HTMLElement, flat: Flat) {
    const top = lyricFadeAt(flat.top).toFixed(2);
    const bottom = lyricFadeAt(flat.top + flat.height).toFixed(2);
    const mask = top === "1.00" && bottom === "1.00" ? "" : `linear-gradient(rgba(0,0,0,${top}), rgba(0,0,0,${bottom}))`;
    if (word.style.maskImage === mask || (mask === "" && !word.style.maskImage)) return;
    word.style.maskImage = mask;
    word.style.webkitMaskImage = mask;
}

// Where depth sizing moves the centre `cx` of something anchored at `anchor` (the edge of its row
// nearest the screen edge): distances from the anchor grow and shrink with the size, so spacing
// between words keeps its proportions and the gap to the screen edge stays the same.
function depthCentre(cx: number, anchor: number) {
    return anchor + (cx - anchor) * sizeAt((anchor + cx) / 2);
}

// The anchor for a row or an element: its edge nearest the screen edge.
function outerEdge(flat: Flat) {
    return flat.left + flat.width / 2 < window.innerWidth / 2 ? flat.left : flat.left + flat.width;
}

function placeSheared(word: HTMLElement, flat: Flat, parent: Shear | null, parentLeft: number, pin = 0, anchor = outerEdge(flat)) {
    const cx = flat.left + flat.width / 2;
    const cy = flat.top + flat.height / 2;
    const arm = armOf(word, cy);
    const totalShear = arm * heightSlopeAt(cx);
    // Scaled about its centre by the depth size, and moved with its row (see depthCentre).
    const size = sizeAt(cx);
    const shift = depthCentre(cx, anchor) - cx + ((1 - size) * flat.width) / 2;
    const targetTop = cy + liftAt(cx, arm) - pin - size * (totalShear * (flat.width / 2) + flat.height / 2);
    const shear = totalShear - (parent?.shear ?? 0);
    const parentLift = parent ? parent.lift + parent.shear * (flat.left + shift - parentLeft) : 0;
    const lift = targetTop - flat.top - parentLift;
    sheared.set(word, { shear, lift, size, shift });
    const key = `${shear.toFixed(4)}|${lift.toFixed(1)}|${size.toFixed(3)}`;
    if (written.get(word) !== key) {
        written.set(word, key);
        const s = size.toFixed(3);
        word.style.transform = `matrix(${s}, ${(size * shear).toFixed(4)}, 0, ${s}, ${(shift / flat.scale).toFixed(2)}, ${(lift / flat.scale).toFixed(2)})`;
    }
}

// Moves a piece so its centre lands on the curve (its panel's curve).
function placePiece(piece: HTMLElement, flat: Flat & { origin: number }): Move {
    const cx = flat.left + flat.width / 2;
    const cy = flat.top + flat.height / 2;
    const dy = liftAt(cx, armOf(piece, cy));
    const move = { dy, tall: 1 };
    moved.set(piece, move);
    const key = dy.toFixed(1);
    if (written.get(piece) !== key) {
        written.set(piece, key);
        piece.style.translate = `0 ${dy.toFixed(1)}px`;
    }
    return move;
}

// The HUD's side margin: the gap left of the context icon or artwork, or right of the lyrics,
// whichever is smaller, used on both sides so the curve stays centred on the screen.
function updateMargins(elements: HTMLElement[], flats: (Flat | null)[]) {
    const width = window.innerWidth;
    let margin = Infinity;
    elements.forEach((element, i) => {
        const flat = flats[i];
        if (!flat || !onScreen(flat)) return;
        if (element.matches(LEFT_EDGE)) margin = Math.min(margin, flat.left);
        else if (element.matches(LYRIC_LINES)) margin = Math.min(margin, width - flat.left - flat.width);
    });
    margin = Number.isFinite(margin) ? clamp(margin, 0, width / 4) : 0;
    margins = { left: margin, right: width - margin };
}

// Lays every piece out on the curve. Pieces keep moving (lyrics scroll, controls collapse), so
// this runs each frame while the effect is on and only writes styles that changed.
function tick(now: number) {
    frame = 0;
    if (!shown() || !container) {
        stop();
        return;
    }
    const elapsed = Math.min(100, Math.max(0, now - lastTime));
    lastTime = now;
    easeStep = 1 - Math.exp(-elapsed / EASE_MS);
    bend += (targetBend - bend) * easeStep;
    zoomStep = 1 - Math.exp(-elapsed / HOVER_MS);
    if (Math.abs(targetBend - bend) < 0.0005) bend = targetBend;
    if (bend === 0 && targetBend === 0) {
        stop();
        return;
    }
    const blocks = Array.from(container.querySelectorAll<HTMLElement>(BLOCKS));
    const words = Array.from(container.querySelectorAll<HTMLElement>(WORD));
    const pieces = Array.from(container.querySelectorAll<HTMLElement>(PIECES));
    const bent = Array.from(container.querySelectorAll<HTMLElement>(BENT));

    // Read every position first, then write, so the frame lays out once.
    const blockFlats = blocks.map((block) => shearedFlat(block, null, 0));
    const blockIndex = new Map(blocks.map((block, i) => [block as Element, i]));
    const wordBlocks = words.map((word) => word.closest<HTMLElement>(BLOCKS));
    const wordFlats = words.map((word, i) => {
        const block = wordBlocks[i];
        const flat = block ? blockFlats[blockIndex.get(block) ?? -1] : null;
        // Words of blocks off screen (lyrics far from the current line) wait until they scroll in.
        if (block && (!flat || !onScreen(flat))) return null;
        return shearedFlat(word, (block && sheared.get(block)) || null, flat?.left ?? 0);
    });
    const pieceFlats = pieces.map((piece) => movedFlat(piece));
    const lyricsPage = container.querySelector("#fad-lyrics-plus-container .lyrics-lyricsContainer-SyncedLyricsPage");
    const lyricsBox = lyricsPage?.getBoundingClientRect();
    lyricsArea = lyricsBox && lyricsBox.height ? { top: lyricsBox.top, height: lyricsBox.height } : null;
    // A panel's middle is the middle of what it shows, not of its box: in TV mode #fsd-foreground
    // spans the whole screen height, so its box's middle sat on the midline and left the title,
    // controls and artwork flat.
    groupRefs = new Map();
    for (const group of container.querySelectorAll(GROUPS)) {
        let top = Infinity;
        let bottom = -Infinity;
        for (const child of Array.from(group.children)) {
            const box = child.getBoundingClientRect();
            if (!box.height || !box.width) continue;
            top = Math.min(top, box.top);
            bottom = Math.max(bottom, box.bottom);
        }
        if (!Number.isFinite(top)) {
            const box = group.getBoundingClientRect();
            if (!box.height) continue;
            top = box.top;
            bottom = box.bottom;
        }
        groupRefs.set(group, (top + bottom) / 2);
    }
    // The lyrics panel's box spans the whole height, so its middle is taken from the lines shown.
    const lyrics = container.querySelector("#fad-lyrics-plus-container");
    if (lyrics && lyricsArea) {
        let top = Infinity;
        let bottom = -Infinity;
        blocks.forEach((block, i) => {
            const flat = blockFlats[i];
            if (!flat || !block.matches(LYRIC_LINES)) return;
            const mid = flat.top + flat.height / 2;
            if (mid < lyricsArea!.top || mid > lyricsArea!.top + lyricsArea!.height) return;
            top = Math.min(top, flat.top);
            bottom = Math.max(bottom, flat.top + flat.height);
        });
        if (Number.isFinite(top)) groupRefs.set(lyrics, (top + bottom) / 2);
    }
    for (const [group, ref] of groupRefs) {
        const target = armFor(ref);
        const current = groupArms.get(group);
        groupArms.set(group, current === undefined ? target : current + (target - current) * easeStep);
    }
    const bentFlats = bent.map((element) => shearedFlat(element, null, 0));
    const previousMargins = margins.left;
    updateMargins([...pieces, ...bent, ...blocks], [...pieceFlats, ...bentFlats, ...blockFlats]);
    // The background is rebuilt in 0.01 steps of bend, so easing does not rebuild it every frame.
    if (Math.round(previousMargins) !== Math.round(margins.left) || Math.abs(bend - backgroundBend) >= 0.01 || bend === targetBend) {
        updateBackground();
    }

    // Lyric lines are left where lyrics-plus puts them; their words bend around the line's middle.
    const blockNow = new Map<Element, Shear>();
    const linePin = new Map<Element, number>();
    blocks.forEach((block, i) => {
        const flat = blockFlats[i];
        if (!flat || !onScreen(flat)) return;
        if (block.matches(LYRIC_LINES)) {
            linePin.set(block, liftAt(flat.left + flat.width / 2, armOf(block, flat.top + flat.height / 2)));
            blockNow.set(block, { shear: 0, lift: 0 });
        } else {
            blockNow.set(block, placeBlock(block, flat));
        }
    });
    words.forEach((word, i) => {
        const flat = wordFlats[i];
        const block = wordBlocks[i];
        if (!flat) return;
        const blockFlat = block ? blockFlats[blockIndex.get(block) ?? -1] : null;
        const pin = (block && linePin.get(block)) || 0;
        placeSheared(word, flat, (block && blockNow.get(block)) || null, blockFlat?.left ?? 0, pin, blockFlat ? outerEdge(blockFlat) : outerEdge(flat));
        if (block && linePin.has(block)) fadeWord(word, flat);
    });
    const held = container.classList.contains("controls-held");
    pieces.forEach((piece, i) => {
        const flat = pieceFlats[i];
        if (!flat || (held && piece.closest(HELD))) return;
        if (!onScreen(flat)) {
            if (moved.has(piece)) reset(piece);
            return;
        }
        placePiece(piece, flat);
    });
    bent.forEach((element, i) => {
        const flat = bentFlats[i];
        if (!flat || (held && element.closest(HELD))) return;
        if (!onScreen(flat)) {
            if (sheared.has(element)) reset(element);
            return;
        }
        placeSheared(element, flat, null, 0);
    });
    const bar = container.querySelector<HTMLElement>("#fsd-progress-bar");
    const barFlat = bar ? bentFlats[bent.indexOf(bar)] : null;
    if (bar && barFlat && onScreen(barFlat)) drawProgressCurve(bar, barFlat);
    for (const button of container.querySelectorAll<HTMLElement>(BUTTONS)) {
        const flat = centredFlat(button);
        if (!flat) continue;
        const keep = held && Boolean(button.closest(HELD));
        if (!keep && !onScreen(flat)) {
            if (sheared.has(button)) reset(button);
            continue;
        }
        placeCentred(button, flat, keep);
    }
    frame = requestAnimationFrame(tick);
}

// The progress bar is one long element, so a shear could only tilt it as a straight line. While
// the curve is on, the bar itself is invisible (it stays under the curve for seeking, see
// tvMode.scss) and its track, fill and thumb are drawn as an SVG that follows the curve point by
// point, like the rows of text beside it.
function drawProgressCurve(bar: HTMLElement, flat: Flat) {
    const holder = bar.parentElement;
    if (!holder) return;
    let svg = holder.querySelector<SVGSVGElement>("#fsd-progress-curve");
    if (!svg) {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = "fsd-progress-curve";
        svg.innerHTML =
            '<path class="fsd-curve-track"/><path class="fsd-curve-fill"/><circle class="fsd-curve-thumb"/>';
        holder.appendChild(svg);
    }
    const origin = svg.getBoundingClientRect();
    const thickness = flat.height;
    const cy = flat.top + flat.height / 2;
    const arm = armOf(bar, cy);
    const start = flat.left + thickness / 2;
    const end = flat.left + flat.width - thickness / 2;
    const pointAt = (x: number) => [x - origin.left, cy + liftAt(x, arm) - origin.top];
    const pathTo = (stop: number) => {
        const steps = Math.max(2, Math.ceil((stop - start) / 12));
        let d = "";
        for (let i = 0; i <= steps; i++) {
            const [x, y] = pointAt(start + ((stop - start) * i) / steps);
            d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
        }
        return d;
    };
    const inner = bar.querySelector<HTMLElement>("#fsd-progress-bar-inner");
    const fraction = inner && bar.offsetWidth ? inner.offsetWidth / bar.offsetWidth : 0;
    const fillEnd = start + (end - start) * clamp(fraction, 0, 1);
    const active = bar.matches(":hover") || bar.classList.contains("dragging");
    const key = `${pathTo(end)}|${fillEnd.toFixed(1)}|${active}|${bar.classList.contains("dragging")}|${thickness}`;
    if (written.get(svg) === key) return;
    written.set(svg, key);
    svg.classList.toggle("active", active);
    svg.classList.toggle("dragging", bar.classList.contains("dragging"));
    svg.style.setProperty("--fsd-curve-thickness", `${thickness}px`);
    svg.querySelector(".fsd-curve-track")!.setAttribute("d", pathTo(end));
    svg.querySelector(".fsd-curve-fill")!.setAttribute("d", fraction > 0 ? pathTo(fillEnd) : "");
    const [tx, ty] = pointAt(fillEnd);
    const thumb = svg.querySelector(".fsd-curve-thumb")!;
    thumb.setAttribute("cx", tx.toFixed(1));
    thumb.setAttribute("cy", ty.toFixed(1));
}

function defs() {
    let svg = document.getElementById(DEFS) as SVGSVGElement | null;
    if (!svg) {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = DEFS;
        svg.setAttribute("width", "0");
        svg.setAttribute("height", "0");
        svg.style.position = "absolute";
        document.body.appendChild(svg);
    }
    return svg;
}

// A filter that only moves pixels vertically: the output at (x, y) shows the input at
// (x, y + shift(x, y)), over the region [x, x + width] x [y, y + height] of the element's own px.
function verticalShiftFilter(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    shift: (x: number, y: number) => number,
    className = "",
) {
    const mapWidth = Math.max(2, Math.round(width / 4));
    const mapHeight = Math.max(2, Math.round(height / 4));
    const shifts = new Float32Array(mapWidth * mapHeight);
    let most = 0;
    for (let j = 0; j < mapHeight; j++) {
        for (let i = 0; i < mapWidth; i++) {
            const value = shift(x + ((i + 0.5) / mapWidth) * width, y + ((j + 0.5) / mapHeight) * height);
            shifts[j * mapWidth + i] = value;
            most = Math.max(most, Math.abs(value));
        }
    }
    const range = Math.ceil(most * 2 * 1.02) || 1;
    const canvas = document.createElement("canvas");
    canvas.width = mapWidth;
    canvas.height = mapHeight;
    const context = canvas.getContext("2d")!;
    const image = context.createImageData(mapWidth, mapHeight);
    // An 8-bit map moves pixels in steps of range / 255 (several px at high strength), which shows
    // as bands. The map is dithered and the result lightly blurred (below) to hide the steps.
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    shifts.forEach((value, p) => {
        const dither = BAYER[((Math.floor(p / mapWidth) % 4) * 4 + ((p % mapWidth) % 4))] / 16 - 0.47;
        image.data[p * 4] = 128;
        image.data[p * 4 + 1] = clamp(Math.round(128 + (value / range) * 255 + dither), 0, 255);
        image.data[p * 4 + 2] = 128;
        image.data[p * 4 + 3] = 255;
    });
    context.putImageData(image, 0, 0);
    const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    filter.id = id;
    if (className) filter.setAttribute("class", className);
    for (const [name, value] of Object.entries({ x, y, width, height })) filter.setAttribute(name, String(value));
    filter.setAttribute("filterUnits", "userSpaceOnUse");
    filter.setAttribute("color-interpolation-filters", "sRGB");
    filter.innerHTML =
        `<feImage href="${canvas.toDataURL()}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="none" result="map"/>` +
        `<feDisplacementMap in="SourceGraphic" in2="map" scale="${range}" xChannelSelector="R" yChannelSelector="G"/>` +
        `<feGaussianBlur stdDeviation="${Math.max(1, (1.5 * range) / 255).toFixed(1)}" edgeMode="duplicate" result="bent"/>` +
        // 8 bits cannot say "no shift" exactly (128/255 is a fifth of a pixel past centre), so where
        // the bend is zero the last row and column sample just past the image and come out
        // transparent (a thin grey line along the bottom middle). The bent image is laid over
        // the original so those slivers show the picture instead.
        `<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="bent"/></feMerge>`;
    return filter;
}

// Wraps each run of text in one inline line element holding one box per word. The line keeps the
// block's own layout (line clamping counts it as a single child); the words can be transformed.
// Lyric lines hold a single text child, which React replaces whole when it changes, so splitting
// them is safe; the observer splits the new text again.
function splitWords() {
    if (!container) return;
    for (const block of container.querySelectorAll<HTMLElement>(BLOCKS)) {
        const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
        const texts: Text[] = [];
        while (walker.nextNode()) {
            const text = walker.currentNode as Text;
            if (!text.parentElement?.closest(LINE) && text.data.trim()) texts.push(text);
        }
        for (const text of texts) {
            const line = document.createElement(LINE);
            for (const part of text.data.split(/(\s+)/)) {
                if (!part) continue;
                if (/^\s+$/.test(part)) {
                    line.append(part);
                } else {
                    const word = document.createElement(WORD);
                    word.textContent = part;
                    line.append(word);
                }
            }
            text.replaceWith(line);
        }
    }
}

function joinWords() {
    if (!container) return;
    const parents = new Set<Node>();
    for (const line of container.querySelectorAll(LINE)) {
        if (line.parentNode) parents.add(line.parentNode);
        line.replaceWith(line.textContent ?? "");
    }
    parents.forEach((parent) => parent.normalize());
}

// The background is blurred, so bending it as an image looks clean. Its rows are pulled toward
// the midline like the HUD's, scaled so the flattest column keeps its full height and no pixel is
// taken from outside the image.
function updateBackground() {
    const canvas = container?.querySelector<HTMLCanvasElement>("#fsd-background");
    if (!canvas) return;
    backgroundBend = Math.round(bend * 100) / 100;
    if (!shown() || backgroundBend === 0 || !CFM.get("hudPerspectiveBackground")) {
        canvas.style.removeProperty("filter");
        document.querySelectorAll(`#${DEFS} .fsd-background-curve`).forEach((filter) => filter.remove());
        return;
    }
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    // The filter works in the canvas's own px; the animated background is drawn scaled up.
    const box = canvas.getBoundingClientRect();
    if (!width || !height || !box.width || !box.height) return;
    const scaleX = box.width / width;
    const scaleY = box.height / height;
    const place = [backgroundBend * 1000, margins.left, box.left, box.top, box.width, box.height].map(Math.round).join("-");
    const id = `fsd-background-curve-${place}-${width}x${height}`;
    if (!document.getElementById(id)) {
        document.querySelectorAll(`#${DEFS} .fsd-background-curve`).forEach((filter) => filter.remove());
        const lowest = 1 - backgroundBend;
        const shift = (x: number, y: number) => {
            const drawnY = box.top + y * scaleY;
            const flatY = midline() + ((drawnY - midline()) * lowest) / heightAt(box.left + x * scaleX, backgroundBend);
            return (flatY - box.top) / scaleY - y;
        };
        defs().appendChild(verticalShiftFilter(id, 0, 0, width, height, shift, "fsd-background-curve"));
    }
    canvas.style.filter = `url(#${id})`;
}
