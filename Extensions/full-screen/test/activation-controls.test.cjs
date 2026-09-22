const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { JSDOM } = require('jsdom');

function setup(t, html = '') {
    const dom = new JSDOM(`<body>${html}</body>`, { pretendToBeVisual: true });
    const { window } = dom;
    const cache = new Map();
    const api = { CosmosAsync: {}, Mousetrap: {}, Player: {}, Platform: {} };
    function load(file) {
        file = path.resolve(__dirname, '../src', file);
        if (cache.has(file)) return cache.get(file);
        const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
        }).outputText;
        const module = { exports: {} };
        const sandbox = { module, exports: module.exports, window, document: window.document, Spicetify: api,
            MutationObserver: window.MutationObserver, setTimeout, clearTimeout,
            require: name => ['../constants', '../services/web-api'].includes(name)
                ? {} : load(path.resolve(path.dirname(file), `${name}.ts`)) };
        vm.runInNewContext(code, sandbox, { filename: file });
        cache.set(file, module.exports);
        return module.exports;
    }
    const { mountActivationControls } = load('ui/activation-controls.ts');
    let clicks = 0, menus = 0;
    const button = { label: 'TV mode', icon: '<svg></svg>', activate: () => clicks++, configure: () => menus++ };
    let cleanup;
    t.after(() => { cleanup?.(); window.close(); });
    return { document: window.document, window, button,
        mount: options => cleanup = mountActivationControls({ tv: button, default: button, hideOriginal: false, ...options }),
        counts: () => [clicks, menus], api, utils: () => load('utils/utils.ts').default };
}
const settle = () => new Promise(resolve => setTimeout(resolve, 330));

test('missing toolbars do not block startup or keyboard activation', t => {
    const s = setup(t);
    assert.equal(s.utils().allNotExist().length, 0);
    delete s.api.Player;
    assert.equal(s.utils().allNotExist()[0][0], 'Spicetify Player');
});

test('Spotify 1.3 top bar gets a clickable TV button independent of Spotify styles', t => {
    const s = setup(t, '<div class="main-globalNav-contentRight"></div>');
    s.mount();
    const button = s.document.querySelector('.main-globalNav-contentRight > #fullscreen-tv-button');
    assert.ok(button);
    assert.equal(button.type, 'button');
    assert.equal(button.getAttribute('aria-label'), 'TV mode');
    assert.match(button.getAttribute('style'), /-webkit-app-region:\s*no-drag/);
    button.click();
    const event = new s.window.MouseEvent('contextmenu', { cancelable: true });
    button.dispatchEvent(event);
    assert.equal(event.defaultPrevented, true);
    assert.deepEqual(s.counts(), [1, 1]);
});

test('legacy toolbar selectors still work', t => {
    const s = setup(t, '<div class="main-globalNav-navRight"></div>');
    s.mount();
    assert.ok(s.document.querySelector('.main-globalNav-navRight > #fullscreen-tv-button'));
});

test('Spotify 1.3 uses the existing action group so native spacing is shared', t => {
    const s = setup(t, '<div class="main-globalNav-contentRight"><div class="main-actionButtons"><button data-testid="user-widget-link"></button></div><div class="spacer"></div></div>');
    s.mount();
    assert.ok(s.document.querySelector('.main-actionButtons > #fullscreen-tv-button'));
    assert.equal(s.document.querySelector('.main-globalNav-contentRight > #fullscreen-tv-button'), null);
});

test('unknown class names use the profile test ID', t => {
    const s = setup(t, '<div id="renamed"><button data-testid="user-widget-link"></button></div>');
    s.mount();
    assert.ok(s.document.querySelector('#renamed > #fullscreen-tv-button'));
});

test('missing top bar falls back to player controls and skips whitespace text nodes', t => {
    const s = setup(t, '<div class="main-nowPlayingBar-right">\n <div id="extra"></div></div>');
    s.mount();
    assert.ok(s.document.querySelector('#extra > #fullscreen-tv-button'));
    assert.ok(s.document.querySelector('#extra > #fullscreen-default-button'));
});

test('unknown player class names use the native fullscreen test ID', t => {
    const s = setup(t, '<div id="extra"><button data-testid="fullscreen-mode-button"></button></div>');
    s.mount();
    assert.ok(s.document.querySelector('#extra > #fullscreen-default-button'));
});

test('both toolbars absent still produces usable controls', t => {
    const s = setup(t);
    s.mount();
    assert.equal(s.document.querySelector('#fullscreen-activation-dock').children.length, 2);
    s.document.querySelector('#fullscreen-tv-button').click();
    assert.deepEqual(s.counts(), [1, 0]);
});

test('late toolbar arrival moves existing buttons out of the fallback', async t => {
    const s = setup(t);
    s.mount();
    const original = s.document.querySelector('#fullscreen-tv-button');
    s.document.body.insertAdjacentHTML('beforeend', '<div class="main-globalNav-contentRight"></div><div class="main-nowPlayingBar-right"><div id="extra"></div></div>');
    await settle();
    assert.equal(s.document.querySelector('.main-globalNav-contentRight > button'), original);
    assert.equal(s.document.querySelector('#fullscreen-activation-dock'), null);
});

test('Spotify replacing a toolbar reattaches the same button and handler once', async t => {
    const s = setup(t, '<div class="main-globalNav-contentRight"></div>');
    s.mount();
    const original = s.document.querySelector('#fullscreen-tv-button');
    s.document.querySelector('.main-globalNav-contentRight').outerHTML = '<div class="main-globalNav-contentRight"></div>';
    await settle();
    assert.equal(s.document.querySelector('.main-globalNav-contentRight > button'), original);
    original.click();
    assert.deepEqual(s.counts(), [1, 0]);
    assert.equal(s.document.querySelectorAll('#fullscreen-tv-button').length, 1);
});

test('removed toolbars recover into the independent dock', async t => {
    const s = setup(t, '<div class="main-globalNav-contentRight"></div>');
    s.mount();
    s.document.querySelector('.main-globalNav-contentRight').remove();
    await settle();
    assert.equal(s.document.querySelector('#fullscreen-activation-dock').children.length, 2);
});

test('unrelated mutations neither duplicate nor reorder attached buttons', async t => {
    const s = setup(t, '<div class="main-globalNav-contentRight"></div>');
    s.mount();
    const bar = s.document.querySelector('.main-globalNav-contentRight');
    bar.prepend(s.document.createElement('span'));
    for (let i = 0; i < 20; i++) s.document.body.append(s.document.createElement('p'));
    await settle();
    assert.equal(bar.firstElementChild.tagName, 'SPAN');
    assert.equal(s.document.querySelectorAll('#fullscreen-tv-button').length, 1);
});

test('activation preferences can disable either or both buttons', t => {
    const s = setup(t);
    let cleanup = s.mount({ default: undefined });
    assert.ok(s.document.querySelector('#fullscreen-tv-button'));
    assert.equal(s.document.querySelector('#fullscreen-default-button'), null);
    cleanup();
    cleanup = s.mount({ tv: undefined, default: undefined });
    assert.equal(s.document.querySelector('#fullscreen-activation-dock'), null);
});

test('native fullscreen is reversibly hidden, including replacement controls', async t => {
    const s = setup(t, '<div id="extra"><button data-testid="fullscreen-mode-button"></button></div>');
    const cleanup = s.mount({ hideOriginal: true });
    const original = s.document.querySelector('[data-testid="fullscreen-mode-button"]');
    assert.ok(original.isConnected);
    assert.ok(original.classList.contains('fsd-native-fullscreen-hidden'));
    original.outerHTML = '<button data-testid="fullscreen-mode-button"></button>';
    await settle();
    const replacement = s.document.querySelector('[data-testid="fullscreen-mode-button"]');
    assert.ok(replacement.classList.contains('fsd-native-fullscreen-hidden'));
    cleanup();
    assert.equal(replacement.classList.contains('fsd-native-fullscreen-hidden'), false);
    s.document.body.append(s.document.createElement('p'));
    await settle();
    assert.equal(s.document.querySelector('#fullscreen-tv-button'), null);
});
