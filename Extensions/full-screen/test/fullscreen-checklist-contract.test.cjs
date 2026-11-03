const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const read = (...parts) => readFileSync(join(root, 'src', ...parts), 'utf8');
const app = read('app.tsx');
const config = read('ui', 'components', 'Config', 'Config.tsx');
const baseStyles = read('styles', 'base.scss');
const tvStyles = read('styles', 'tvMode.scss');

test('perspective works in every fullscreen mode, not only TV', () => {
  assert.match(app, /classList\.toggle\("hud-perspective", Boolean\(CFM\.get\("hudPerspective"\)\)\)/);
  assert.match(config, /classList\.toggle\("hud-perspective", Boolean\(CFM\.get\("hudPerspective"\)\)\)/);
  assert.doesNotMatch(app, /if \(CFM\.getMode\(\) === "tv"\) \{\s*ReactDOM\.render\(<PerspectiveBar/);
  assert.doesNotMatch(config, /CFM\.getMode\(\) === "tv"\s*\?\s*\[\s*this\.createToggle\(\s*translations\[LOCALE\]\.settings\.hudPerspective,/);
  assert.match(tvStyles, /^#full-screen-display\.hud-curving \{/m);
});

test('the buttons row and the progress bar collapse on their own, in every mode', () => {
  assert.match(app, /classList\.toggle\("controls-collapsed", controlsHidden\)/);
  assert.match(app, /classList\.toggle\("progress-collapsed", progressHidden\)/);
  assert.match(baseStyles, /&\.controls-collapsed #fsd-status\.active,\s*&\.progress-collapsed #fsd-progress-parent \{\s*height: 0;/);
  assert.doesNotMatch(tvStyles, /&\.controls-collapsed \{/);
});

test('glows use the element\'s own colours', () => {
  assert.match(baseStyles, /--fsd-control-glow: drop-shadow\(0 0 2px var\(--fsd-own-glow\)\) drop-shadow\(0 0 8px var\(--fsd-own-glow\)\);/);
  assert.match(baseStyles, /&\.glow-art \{\s*#fsd-art \{[\s\S]*?&::before \{[\s\S]*?background-image: var\(--fsd-art-url\);[\s\S]*?filter: blur\(22px\)/);
  assert.match(app, /setProperty\("--fsd-art-url"/);
  assert.match(baseStyles, /#fsd-perspective-bar-inner,\s*#perspective-thumb \{/);
});

test('lyrics fade at their edges and their buttons sit in the corner, in every mode', () => {
  assert.match(baseStyles, /\.lyrics-lyricsContainer-SyncedLyricsPage \{\s*-webkit-mask-image: linear-gradient/);
  assert.match(baseStyles, /\.lyrics-config-button-container \{\s*position: fixed;\s*right: 16px;\s*bottom: 16px;/);
  assert.match(baseStyles, /\.lyrics-config-button \{\s*margin: 0 0 0 6px;\s*border-radius: 8px;\s*background-color: transparent;/);
});

test('split words underline themselves instead of underlining the spaces between them', () => {
  assert.match(tvStyles, /\.fsd-song-meta span:hover,\s*\.fsd-artist-list span:hover \{\s*text-decoration: none;\s*fsd-curve-word \{\s*text-decoration: underline;/);
});

test('title and detail icons glow in their own colour, not the text\'s white halo', () => {
  assert.match(baseStyles, /&\.glow-title #fsd-title > svg,\s*&\.glow-details #fsd-artist > svg,\s*&\.glow-details #fsd-album > svg \{\s*filter: drop-shadow\(0 0 2px var\(--fsd-own-glow\)\)/);
  // In TV mode the text's halo is on the clipped text, not the row holding the icon.
  assert.match(baseStyles, /&\[mode="tv"\]\.glow-title #fsd-title \{\s*text-shadow: none;\s*> span \{\s*filter: drop-shadow/);
  assert.match(baseStyles, /#fsd-artist > span,\s*#fsd-album > span,\s*#fsd-ctx-details \{\s*text-shadow: none;\s*filter: drop-shadow/);
});

test('controls under the pointer hold still through a song change', () => {
  const helper = read('utils', 'hud-perspective.ts');
  assert.match(app, /function holdControls\(hold: boolean\)[\s\S]*?row\.style\.width = `\$\{row\.offsetWidth\}px`/);
  assert.match(app, /function onStatusEnter\(\) \{[\s\S]*?holdWhenSettled\(\);\s*\}/);
  assert.match(app, /function holdWhenSettled\(\) \{[\s\S]*?else if \(pointerOnRows\(\)\) holdControls\(true\);/);
  assert.match(app, /function onStatusLeave\(\) \{\s*holdControls\(false\);/);
  assert.match(helper, /if \(!flat \|\| \(held && piece\.closest\(HELD\)\)\) return;/);
});

test('the perspective slider snaps to 10% steps and moves like the smart volume bar', () => {
  const bar = read('ui', 'components', 'PerspectiveBar', 'PerspectiveBar.tsx');
  const barStyles = read('ui', 'components', 'PerspectiveBar', 'styles.scss');
  assert.match(bar, /Math\.round\(clamp\(\(clientX - bounds\.left\) \/ bounds\.width\) \* 10\) \* 10/);
  assert.match(barStyles, /&\.p-hidden \{\s*transform: translateY\(100px\) scale\(0\.1\);/);
  assert.match(config, /hudPerspectiveStrengthDescription,\s*10,/);
});

test('controls hide as soon as the pointer leaves them, and 1.5s after the mouse stops', () => {
  const player = read('ui', 'components', 'PlayerControls', 'PlayerControls.ts');
  const extra = read('ui', 'components', 'ExtraControls', 'ExtraControls.ts');
  const progress = read('ui', 'components', 'ProgressBar', 'ProgressBar.tsx');
  assert.match(app, /function onStatusLeave\(\) \{[\s\S]*?PlayerControls\.hidePlayerControlsNow\(\);[\s\S]*?ExtraControls\.hideExtraControlsNow\(\);[\s\S]*?new Event\("fsd-controls-leave"\)/);
  assert.match(player, /static hidePlayerControls\(\) \{\s*this\.scheduleHide\(1500\);/);
  assert.match(extra, /static hideExtraControls\(\) \{\s*this\.scheduleHide\(1500\);/);
  assert.match(progress, /const hideProgressBar = \(timeout = 1500\) =>/);
  assert.match(progress, /document\.addEventListener\("fsd-controls-leave", onControlsLeave\)/);
});

test('the perspective control mirrors the smart volume bar, with an icon to switch it', () => {
  const bar = read('ui', 'components', 'PerspectiveBar', 'PerspectiveBar.tsx');
  const barStyles = read('ui', 'components', 'PerspectiveBar', 'styles.scss');
  assert.match(bar, /id="fsd-perspective-icon"[\s\S]*?onClick=\{onToggle\}/);
  assert.match(barStyles, /#fsd-perspective-label \{\s*width: 50px;\s*font-size: 18px;/);
  assert.match(barStyles, /#fsd-perspective-bar \{[\s\S]*?height: 8px;/);
});

test('the clock card moves as one piece, and lyrics fade along the curve', () => {
  const helper = read('utils', 'hud-perspective.ts');
  assert.match(helper, /"#fsd-overview-card",\s*\]\.join/);
  assert.doesNotMatch(helper, /"#fsd-overview-card > \*"/);
  assert.match(helper, /function fadeWord\(word: HTMLElement, flat: Flat\)/);
  assert.match(helper, /linear-gradient\(rgba\(0,0,0,\$\{top\}\), rgba\(0,0,0,\$\{bottom\}\)\)/);
  assert.match(tvStyles, /\.lyrics-lyricsContainer-SyncedLyricsPage \{\s*-webkit-mask-image: none;\s*mask-image: none;\s*overflow: visible;/);
});

test('nothing clips the curved lyrics with a straight edge', () => {
  assert.match(tvStyles, /\.lyrics-lyricsContainer-LyricsContainer:has\(\.lyrics-lyricsContainer-SyncedLyricsPage\) \{\s*overflow: visible !important;/);
});

test('fade animations do not knock elements off the curve', () => {
  const start = baseStyles.indexOf('@keyframes fadeUp');
  const block = baseStyles.slice(start, baseStyles.indexOf('.fade-do {'));
  assert.doesNotMatch(block, /transform:/);
  assert.match(block, /translate: 0 10px;/);
});

test('held control rows stay put on screen through a song change', () => {
  assert.match(app, /function keepRowsInPlace\(\)/);
  assert.match(app, /held\.row\.style\.translate = `\$\{x\.toFixed\(1\)\}px \$\{y\.toFixed\(1\)\}px`/);
});

test('reaching hidden controls shows them first and holds them where they are shown, not on the progress bar', () => {
  const enter = app.slice(app.indexOf('function onStatusEnter()'), app.indexOf('function hideAfterIdle()'));
  assert.ok(enter.indexOf('updateControlsCollapsed();') < enter.indexOf('holdWhenSettled();'));
  assert.match(enter, /const settling = REVEAL_SETTLE_MS - \(performance\.now\(\) - revealedAt\);\s*if \(settling > 0\) holdTimer = setTimeout\(holdWhenSettled, settling\);/);
  const collapse = app.slice(app.indexOf('function updateControlsCollapsed()'), app.indexOf('function handleMouseMoveActivation()'));
  assert.match(collapse, /revealedAt = performance\.now\(\);/);
  // Rows still growing back can slide out from under a still pointer: that falls back to the idle timer.
  const leave = app.slice(app.indexOf('function onStatusLeave()'), app.indexOf('const controlsObserver'));
  assert.match(leave, /if \(revealing\(\)\) \{\s*hideAfterIdle\(\);\s*holdWhenSettled\(\);\s*return;\s*\}/);
  assert.ok(leave.indexOf('return;') < leave.indexOf('hidePlayerControlsNow'));
});

test('player and mouse handlers are bound once, so closing fullscreen removes them', () => {
  // removeEventListener only removes the exact function added; a fresh .bind() at each call never matched,
  // so handlers piled up with every open/close and kept running after fullscreen closed.
  for (const name of ['onPlayPause', 'onExtraUpdate', 'onQueueUpdate', 'onUpNextShow', 'hideContextSoon', 'hideExtraSoon', 'hidePlayerSoon']) {
    assert.match(app, new RegExp("const " + name + " = \\w+\\.\\w+\\.bind\\(\\w+\\);"));
  }
  assert.doesNotMatch(app, /(add|remove)(Event)?Listener\([^)]*\.bind\(/, 'no listener is added or removed with a fresh .bind()');
  assert.match(app, /Spicetify\.Player\.addEventListener\("onplaypause", onPlayPause\);/);
  assert.match(app, /Spicetify\.Player\.removeEventListener\("onplaypause", onPlayPause\);/);
});

test('play/pause updates survive an event with no data (Spotify 1.3.6)', () => {
  const utils = read('utils', 'utils.ts');
  const controls = read('ui', 'components', 'PlayerControls', 'PlayerControls.ts');
  assert.match(utils, /static isPausedEvent\(evt: any\): boolean \{\s*const data = evt\?\.data;\s*return data \? Boolean\(data\.is_paused \|\| data\.isPaused\) : !Spicetify\.Player\.isPlaying\(\);/);
  assert.match(controls, /if \(Utils\.isPausedEvent\(evt\)\) \{/);
  assert.match(app, /function updatePlayingIcon\(evt: any\) \{\s*if \(Utils\.isPausedEvent\(evt\)\) \{/);
  assert.doesNotMatch(app + controls, /evt\.data\.is_paused/);
});

test('entering and leaving fullscreen closes tooltips without tearing out their content', () => {
  assert.equal((app.match(/Utils\.dismissTooltips\(\);/g) || []).length, 2);
  assert.doesNotMatch(app, /#context-menu[^"]*"\)\.forEach\(\(el\) => el\.remove\(\)\)/);
});
