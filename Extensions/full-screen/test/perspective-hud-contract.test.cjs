const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const helper = readFileSync(join(root, 'src', 'utils', 'hud-perspective.ts'), 'utf8');
const app = readFileSync(join(root, 'src', 'app.tsx'), 'utf8');
const config = readFileSync(join(root, 'src', 'ui', 'components', 'Config', 'Config.tsx'), 'utf8');
const upNext = readFileSync(join(root, 'src', 'ui', 'components', 'UpNext', 'UpNext.ts'), 'utf8');
const htmlCreator = readFileSync(join(root, 'src', 'services', 'html-creator.ts'), 'utf8');
const baseStyles = readFileSync(join(root, 'src', 'styles', 'base.scss'), 'utf8');
const tvStyles = readFileSync(join(root, 'src', 'styles', 'tvMode.scss'), 'utf8');

test('perspective strength sets the bend and compact layouts keep a gentler one', () => {
  assert.match(helper, /clamp\(Number\(value\) \|\| 0, 0, 100\)/);
  assert.match(helper, /window\.innerWidth <= 800 \? 0\.55 : 1/);
  assert.match(helper, /const MAX_BEND = 0\.36;/);
  assert.match(app, /setHudPerspectiveStrength\(DOM\.container, Number\(CFM\.get\("hudPerspectiveStrength"\)\)\)/);
  assert.match(config, /input\.oninput = \(\) =>[\s\S]*?setHudPerspectiveStrength\(DOM\.container, strength\)/);
  assert.match(baseStyles, /#fsd-hud-layer\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?inset:\s*0;[\s\S]*?transform-style:\s*flat;/);
});

test('the HUD bends like a screen curved inwards: rows arc, nothing stretches sideways or turns', () => {
  // (x, y) -> (x, cy + (y - cy) h(x)), h = 1 - k (1 - u^2): 1 at the margins, level in the middle,
  // and steepest toward the edges instead of flattening off near them.
  assert.match(helper, /return \{ depth: 1 - u \* u, slope: \(-2 \* u\) \/ half \};/);
  assert.doesNotMatch(helper, /Math\.cos\(Math\.PI \* u\)/);
  assert.match(helper, /const liftAt = \(x: number, arm: number\) => arm \* \(heightAt\(x\) - 1\);/);
  // Panels ease their bend when they cross the middle row, and strength changes ease too.
  assert.match(helper, /groupArms\.set\(group, current === undefined \? target : current \+ \(target - current\) \* easeStep\);/);
  assert.match(helper, /const EASE_MS = 250;/);
  // Every panel bends by the same amount, whatever its distance from the middle row.
  assert.match(helper, /const ARM = 0\.3;/);
  // Clusters bend as one panel, so text keeps its height and rows keep their spacing.
  assert.match(helper, /const GROUPS =\s*"#fsd-foreground, #fsd-ctx-container/);
  // Pinned at the HUD's own margins, so the gap to the screen edge is the same on and off.
  assert.match(helper, /const half = x < cx \? cx - margins\.left : margins\.right - cx;/);
  // Words, the artwork and the progress bar are sheared (upright edges stay upright) and scaled
  // only vertically; no sideways scale, and nothing is resampled, so edges stay anti-aliased.
  assert.match(helper, /word\.style\.transform = `matrix\(\$\{s\}, \$\{\(size \* shear\)\.toFixed\(4\)\}, 0, \$\{s\}, /);
  // Depth: sides a little bigger, middle a little smaller, evenly (no squash).
  assert.match(helper, /return 1 \+ DEPTH \* bend \* \(0\.5 - depthAt\(x\)\.depth\);/);
  assert.match(helper, /piece\.style\.translate = `0 \$\{dy\.toFixed\(1\)\}px`/);
  assert.doesNotMatch(helper, /piece\.style\.scale =/, 'nothing is squashed');
  assert.match(helper, /placeSheared\(element, flat, null, 0\);/);
  assert.doesNotMatch(helper, /function bendRest|element\.style\.filter/, 'no displacement filter on HUD elements');
  assert.doesNotMatch(helper, /style\.rotate|rotate\(/, 'nothing turns');
  // Text blocks are sheared as a whole so their clipping follows the curve. Lyric lines stay where
  // lyrics-plus puts them and their words bend around the line's middle.
  assert.match(helper, /linePin\.set\(block, liftAt\(/);
  assert.doesNotMatch(helper, /block\.style\.translate/, 'lyric lines are not moved');
  assert.match(helper, /const BLOCKS = \[[\s\S]*?LYRIC_LINES,\s*\]\.join/);
  assert.match(helper, /function splitWords\(\)/);
  assert.match(helper, /function joinWords\(\)/);
  assert.match(tvStyles, /\.hud-curving \{\s*fsd-curve-word \{\s*display: inline-block;\s*transform-origin: 0 0;/);
  assert.match(helper, /const BENT = \[\s*"#fsd-art",\s*"#fsd-progress-bar",\s*"#fsd_next_art",\s*"#fsd-ctx-icon",/);
  // The artwork is warped whole, like before (the user wants it bent, not squared up).
  assert.doesNotMatch(helper, /function placeArt\(/);
  assert.doesNotMatch(tvStyles, /#fsd-art-image::after/);
  // The bend eases instead of snapping.
  assert.match(helper, /easeStep = 1 - Math\.exp\(-elapsed \/ EASE_MS\);\s*bend \+= \(targetBend - bend\) \* easeStep;/);
  assert.doesNotMatch(helper, /"#fsd-perspective-container > \*"/, 'the slider is not bent under the pointer');
  // The HUD layer itself is never transformed or filtered, so clicks land where things are drawn.
  assert.doesNotMatch(tvStyles, /#fsd-hud-layer\s*\{[^}]*(transform|filter|perspective):/);
  assert.doesNotMatch(tvStyles, /\.hud-perspective\s*\{[\s\S]*?#fsd-overview-card\s*\{\s*left: auto;/, 'the clock card stays where it is');
});

test('the blurred background bends too, never from outside the image, and it can be turned off', () => {
  assert.match(helper, /feDisplacementMap/);
  assert.match(helper, /xChannelSelector="R" yChannelSelector="G"/);
  assert.match(helper, /const lowest = 1 - backgroundBend;/);
  assert.match(helper, /CFM\.get\("hudPerspectiveBackground"\)/);
  assert.match(helper, /#fsd-background/);
});

test('the blur canvas stays outside the shared layer and every fullscreen HUD element stays inside it', () => {
  const canvasIndex = htmlCreator.indexOf('<canvas id="fsd-background"></canvas>');
  const layerIndex = htmlCreator.indexOf('<div id="fsd-hud-layer">');
  const layerEnd = htmlCreator.lastIndexOf('</div>');
  assert.ok(canvasIndex >= 0 && layerIndex > canvasIndex, 'the artwork canvas must precede the HUD layer');
  assert.ok(layerEnd > layerIndex, 'the HUD layer must close after its children');
  const hudMarkup = htmlCreator.slice(layerIndex, layerEnd);
  for (const id of [
    'fsd-ctx-container',
    'fsd-upnext-container',
    'fsd-volume-parent',
    'fsd-overview-card-parent',
    'fad-lyrics-plus-container',
    'fsd-foreground',
    'fsd-progress-parent',
  ]) {
    assert.ok(hudMarkup.includes(`id="${id}"`), `${id} must be inside the shared HUD layer`);
  }
});

test('the up-next overlay keeps its show and hide states while joining the shared warp', () => {
  assert.match(upNext, /classList\.add\("upnext-visible"\)/);
  assert.match(upNext, /classList\.remove\("upnext-visible"\)/);
  assert.match(baseStyles, /#fsd-upnext-container[\s\S]*?&\.upnext-visible[\s\S]*?translateX\(0px\)/);
});

test('phone lyrics get enough scroll viewport to keep the active line visible', () => {
  assert.match(tvStyles, /@media \(max-width: 480px\)[\s\S]*?\.lyrics-lyricsContainer-LyricsContainer\s*\{\s*height: calc\(95% \+ clamp\(64px, calc\(376px - 80vw\), 120px\)\) !important/);
  assert.match(tvStyles, /@media \(max-width: 360px\)[\s\S]*?\.lyrics-lyricsContainer-SyncedLyrics\s*\{\s*--lyrics-font-size: clamp\(14px, 4\.2vw, 15\.5px\)/);
  assert.match(tvStyles, /@media \(max-width: 340px\)[\s\S]*?\.lyrics-lyricsContainer-SyncedLyrics\s*\{\s*--lyrics-font-size: 13px/);
  assert.match(tvStyles, /@media \(max-width: 340px\)[\s\S]*?#fad-lyrics-plus-container\s*\{\s*top: -12px;[\s\S]*?height: calc\(95% \+ 160px\) !important/);
});

test('lyrics fade out at the top and bottom instead of being cut off', () => {
  // On the synced page (the box that clips the lines), not the container holding the buttons, and
  // not the zero-height lines wrapper, which would hide everything.
  assert.match(baseStyles, /\.lyrics-lyricsContainer-SyncedLyricsPage \{\s*-webkit-mask-image: linear-gradient\(to bottom, transparent 0%, #000 14%, #000 80%, transparent 100%\);/);
  assert.doesNotMatch(tvStyles, /\.lyrics-lyricsContainer-SyncedLyrics,|\.lyrics-lyricsContainer-SyncedLyrics \{[^}]*mask/);
});

test('control buttons bend with the curve, hover backgrounds included', () => {
  assert.match(helper, /const BUTTONS = \[".fsd-controls button", ".extra-controls button", "#fad-lyrics-plus-container \.lyrics-config-button"\]/);
  assert.match(helper, /button\.style\.transform = `matrix\(\$\{size\.toFixed\(3\)\}, \$\{\(size \* shear\)\.toFixed\(4\)\}, 0, \$\{size\.toFixed\(3\)\}, 0, /);
  assert.doesNotMatch(helper, /const PIECES = \[\s*"\.fsd-controls button"/);
  // Their transform is not eased behind the curve, and the transition outranks the glow rule's.
  assert.match(tvStyles, /\.fs-button,\s*\.lyrics-config-button,\s*#fsd-status button \{\s*transform-origin: 50% 50%;\s*transition:\s*background 0\.2s ease,\s*filter 0\.25s ease;/);
});

test('hovering a control grows it in place, smoothly, without moving it', () => {
  // A CSS `scale` on top of the curve's transform also scaled the curve's lift, so the button moved
  // up as it grew (and snapped, because the glow rule replaced its transition). The curve eases the
  // zoom into the button's own matrix about its centre instead; a held button keeps its bend.
  assert.doesNotMatch(tvStyles, /scale: 1\.08/);
  assert.match(helper, /const HOVER_ZOOM = 1\.08;/);
  assert.match(helper, /zoomStep = 1 - Math\.exp\(-elapsed \/ HOVER_MS\);/);
  assert.match(helper, /const target = button\.matches\(":hover"\) \? HOVER_ZOOM : 1;/);
  assert.match(helper, /if \(held && last\) \{\s*\(\{ shear, lift \} = last\);/);
  assert.match(helper, /const size = base \* zoom;/);
  assert.match(helper, /placeCentred\(button, flat, keep\);/);
  // With the curve off, the zoom's transition survives the glow rule too.
  assert.match(baseStyles, /filter: var\(--fsd-control-glow\);[\s\S]{0,200}transition:\s*filter 0\.25s ease,\s*transform 0\.15s ease-out,\s*background 0\.2s ease;/);
});

test('a panel bends at the middle of what it shows, not of its full-height box', () => {
  assert.match(helper, /for \(const child of Array\.from\(group\.children\)\) \{/);
});

test('the progress bar follows the curve point by point, not as a straight tilted line', () => {
  assert.match(helper, /function drawProgressCurve\(bar: HTMLElement, flat: Flat\)/);
  assert.match(helper, /const pointAt = \(x: number\) => \[x - origin\.left, cy \+ liftAt\(x, arm\) - origin\.top\];/);
  assert.match(tvStyles, /#fsd-progress-bar \{\s*position: relative;\s*background: transparent !important;\s*> \* \{\s*opacity: 0;/);
  assert.match(tvStyles, /#fsd-progress-curve \{\s*position: fixed;/);
});

test('the background warp hides its 8-bit steps', () => {
  assert.match(helper, /const BAYER = \[/);
  assert.match(helper, /<feGaussianBlur stdDeviation="\$\{Math\.max\(1, \(1\.5 \* range\) \/ 255\)\.toFixed\(1\)\}" edgeMode="duplicate" result="bent"\/>/);
});

test('depth sizing keeps word spacing in proportion and the edge padding unchanged', () => {
  assert.match(helper, /return anchor \+ \(cx - anchor\) \* sizeAt\(\(anchor \+ cx\) \/ 2\);/);
  assert.match(helper, /const shift = depthCentre\(cx, anchor\) - cx \+ \(\(1 - size\) \* flat\.width\) \/ 2;/);
});
