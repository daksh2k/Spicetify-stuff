const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function setup() {
    const frames = [], paints = [];
    const ctx = { drawImage: (...args) => paints.push(args), fillRect: () => paints.push(ctx.fillStyle) };
    const canvas = { dataset: {}, getContext: () => ctx };
    const module = { exports: {} };
    const source = fs.readFileSync(path.join(__dirname, '../src/utils/animation.ts'), 'utf8');
    vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
        module, exports: module.exports, performance, document: { createElement: () => ({ getContext: () => ctx }) },
        require: () => ({ default: { get: key => ({backAnimationTime: 1, blurSize: 20, backgroundBrightness: 0.7, animationSpeed: 1})[key] } }),
        window: { innerWidth: 1920, innerHeight: 1080 },
        requestAnimationFrame: callback => frames.push(callback),
    });
    return { ...module.exports, canvas, frames, paints };
}
const image = { complete: true, naturalWidth: 640, width: 640, height: 640 };

test('first artwork frame paints immediately instead of fading from an empty canvas', () => {
    const s = setup();
    s.animateCanvas(image, image, s.canvas);
    assert.equal(s.paints.length, 1);
    assert.equal(s.frames.length, 0);
    assert.equal(s.canvas.width, 1920);
});
test('resizing paints decoded artwork synchronously', () => {
    const s = setup();
    s.canvas.dataset.fsdPainted = 'true';
    s.animateCanvas(image, image, s.canvas, true);
    assert.equal(s.paints.length, 1);
    assert.equal(s.frames.length, 0);
});
test('normal song changes retain the configured crossfade', () => {
    const s = setup();
    s.canvas.dataset.fsdPainted = 'true';
    s.animateCanvas(image, image, s.canvas);
    assert.equal(s.frames.length, 1);
});
test('first solid-color frame does not animate from black', async () => {
    const s = setup();
    await s.animateColor('#345678', s.canvas);
    assert.equal(s.paints[0], '#345678');
    assert.equal(s.frames.length, 0);
});
