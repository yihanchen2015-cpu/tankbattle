const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

class FakeElement {
    constructor() {
        this.textContent = '';
        this.offsetWidth = 640;
        this.classes = new Set();
        this.properties = {};
        this.classList = {
            add: value => this.classes.add(value),
            remove: value => this.classes.delete(value)
        };
        this.style = {
            setProperty: (name, value) => { this.properties[name] = value; }
        };
    }
}

const ids = ['juiceCue', 'juiceCueKicker', 'juiceCueTitle', 'juiceCueSubtitle'];
const elements = Object.fromEntries(ids.map(id => [id, new FakeElement()]));
let now = 1000;
let timerId = 0;
const timers = new Map();
const shakes = [];
const context = {
    console,
    Math,
    Date,
    performance: { now: () => now },
    gameState: 'playing',
    window: { addEventListener() {}, matchMedia() { return { matches:false }; } },
    document: {
        getElementById(id) { return elements[id] || null; },
        querySelectorAll() { return []; },
        querySelector() { return null; }
    },
    setTimeout(callback) { timers.set(++timerId, callback); return timerId; },
    clearTimeout(id) { timers.delete(id); },
    triggerScreenShake(strength, duration) { shakes.push({strength, duration}); }
};

vm.createContext(context);
vm.runInContext(fs.readFileSync('UI.js', 'utf8'), context, { filename:'UI.js' });

assert.strictEqual(vm.runInContext("showJuiceCue('压 成 铁 饼！','电梯碾压','#ff713c',1.2)", context), true);
assert(elements.juiceCue.classes.has('active'), 'cue should become visible');
assert.strictEqual(elements.juiceCueTitle.textContent, '压 成 铁 饼！');
assert.strictEqual(elements.juiceCueKicker.textContent, '工厂暴力美学');
assert.strictEqual(elements.juiceCue.properties['--juice-color'], '#ff713c');
assert(shakes[0].strength > 6, 'high-intensity cue should shake the screen');

now += 800;
vm.runInContext("showJuiceCue('一 压 就 爆！','3 桶连锁','#ff6537',1.1)", context);
assert.strictEqual(elements.juiceCueKicker.textContent, '物理连击 ×2', 'nearby cues should form a physics combo');

vm.runInContext('resetJuiceCue()', context);
assert(!elements.juiceCue.classes.has('active'), 'reset should hide the cue');

console.log('Juice cue smoke test passed:', {
    title: elements.juiceCueTitle.textContent,
    combo: '物理连击 ×2',
    shakes: shakes.length
});
