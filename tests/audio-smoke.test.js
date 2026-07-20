const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

class FakeParam {
    constructor(value = 0) { this.value = value; this.events = []; }
    setValueAtTime(value) { this.value = value; this.events.push(['set', value]); }
    exponentialRampToValueAtTime(value) { this.value = value; this.events.push(['ramp', value]); }
    setTargetAtTime(value) { this.value = value; this.events.push(['target', value]); }
    cancelScheduledValues() { this.events.push(['cancel']); }
}

class FakeNode {
    constructor() { this.connections = []; }
    connect(target) { this.connections.push(target); return target; }
}

class FakeOscillator extends FakeNode {
    constructor() { super(); this.frequency = new FakeParam(); this.started = false; this.stopped = false; }
    start() { this.started = true; }
    stop() { this.stopped = true; }
}

class FakeGain extends FakeNode { constructor() { super(); this.gain = new FakeParam(); } }
class FakeFilter extends FakeNode {
    constructor() { super(); this.frequency = new FakeParam(); this.Q = new FakeParam(); }
}
class FakeSource extends FakeNode { start() { this.started = true; } }

class FakeAudioContext {
    constructor() { this.currentTime = 0; this.sampleRate = 8000; this.destination = new FakeNode(); this.state = 'running'; this.nodes = []; }
    remember(node) { this.nodes.push(node); return node; }
    createOscillator() { return this.remember(new FakeOscillator()); }
    createGain() { return this.remember(new FakeGain()); }
    createBiquadFilter() { return this.remember(new FakeFilter()); }
    createBufferSource() { return this.remember(new FakeSource()); }
    createStereoPanner() { const node = new FakeNode(); node.pan = new FakeParam(); return this.remember(node); }
    createBuffer(channels, length, sampleRate) {
        return { duration: length / sampleRate, getChannelData() { return new Float32Array(length); } };
    }
    resume() { this.state = 'running'; return Promise.resolve(); }
}

let now = 1000;
const sandbox = {
    console,
    Map,
    Math,
    performance: { now() { now += 100; return now; } },
    window: { AudioContext: FakeAudioContext, addEventListener() {} },
    player: { x: 100, y: 100 },
    gameState: 'playing'
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('Audio.js', 'utf8'), sandbox, { filename: 'Audio.js' });

vm.runInContext(`playWorldSound('shell', 100, 100, 1)`, sandbox);
const shellState = vm.runInContext(`({
    nodeCount: gameAudioContext.nodes.length,
    shake: screenShakeState.remaining,
    strength: screenShakeState.strength
})`, sandbox);
assert.ok(shellState.nodeCount >= 10, 'main cannon should create multiple layered audio nodes');
assert.ok(shellState.shake > 0 && shellState.strength >= 3.5, 'main cannon should trigger a small camera shake');

vm.runInContext(`
    playWorldSound('mg', 100, 100, 1);
    playWorldSound('aa', 100, 100, 1);
    playWorldSound('hit', 100, 100, 1);
    playWorldSound('kill', 100, 100, 1);
    updateEngineAudio({ dead:false, engineLoad:.8, hp:700, maxHp:800 });
`, sandbox);
const engineState = vm.runInContext(`({
    running: !!engineAudio,
    gain: engineAudio.master.gain.value,
    lowFrequency: engineAudio.low.frequency.value,
    shakeStrength: screenShakeState.strength
})`, sandbox);
assert.strictEqual(engineState.running, true);
assert.ok(engineState.gain > 0.04, 'engine gain should rise under load');
assert.ok(engineState.lowFrequency > 70, 'engine pitch should rise under load');
assert.ok(engineState.shakeStrength >= 8, 'kill sound should trigger a stronger shake');

vm.runInContext(`stopEngineAudio()`, sandbox);
assert.strictEqual(vm.runInContext(`engineAudio`, sandbox), null);

console.log('Audio smoke test passed.');
