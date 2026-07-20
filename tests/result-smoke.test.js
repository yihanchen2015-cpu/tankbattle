const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

class FakeElement {
    constructor() {
        this.textContent = '';
        this.value = '';
        this.disabled = true;
        this.style = {};
        this.classes = new Set();
        this.classList = {
            add: value => this.classes.add(value),
            remove: value => this.classes.delete(value),
            toggle: (value, enabled) => enabled ? this.classes.add(value) : this.classes.delete(value)
        };
    }
}

const ids = [
    'matchResultOverlay', 'matchResultTitle', 'resultBlueScore', 'resultRedScore',
    'ammoSlider', 'mgSlider', 'aaSlider', 'ammoValue', 'mgValue', 'aaValue',
    'dayNight', 'difficulty', 'viewMode', 'mapSelect', 'startBtn'
];
const elements = Object.fromEntries(ids.map(id => [id, new FakeElement()]));
const stats = [];
const sandbox = {
    console,
    Map,
    Set,
    Math,
    Date,
    AbortController,
    window: {},
    document: { getElementById(id) { return elements[id] || null; } },
    init() {},
    endMatchStats(result) { stats.push(result); },
    stopEngineAudio() {}
};
vm.createContext(sandbox);
for(const file of ['Config.js', 'Score.js', 'GameCore.js']) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
}

vm.runInContext(`
    teamScores = { blue: 1250, red: 1750 };
    gameState = 'playing';
    finishEndGame('victory');
`, sandbox);
assert.strictEqual(elements.matchResultTitle.textContent, '红方胜利', '胜负应只由总分决定');
assert.strictEqual(elements.resultBlueScore.textContent, '1,250');
assert.strictEqual(elements.resultRedScore.textContent, '1,750');
assert.ok(elements.matchResultOverlay.classes.has('active'));
assert.strictEqual(stats[0], 'defeat');

vm.runInContext(`
    teamScores = { blue: 500, red: 500 };
    gameState = 'playing';
    finishEndGame('playerDead');
`, sandbox);
assert.strictEqual(elements.matchResultTitle.textContent, '平局');

const calls = [];
sandbox.calls = calls;
vm.runInContext(`
    resetGame = () => calls.push('reset');
    selectGameMode = mode => { gameMode = mode; calls.push('mode:' + mode); };
    startGame = () => calls.push('start');
    lastMatchSetup = {
        selectedTank:'niuniu', currentMap:'island', gameMode:'storm',
        ammo:72, mg:188, aa:21, dayNight:'night', difficulty:'hard', viewMode:'3d'
    };
    restartLastGame();
`, sandbox);
const restored = vm.runInContext(`({ selectedTank, currentMap, gameMode })`, sandbox);
assert.deepStrictEqual(JSON.parse(JSON.stringify(restored)), { selectedTank:'niuniu', currentMap:'island', gameMode:'storm' });
assert.deepStrictEqual(calls, ['reset', 'mode:storm', 'start']);
assert.strictEqual(elements.ammoSlider.value, 72);
assert.strictEqual(elements.mgSlider.value, 188);
assert.strictEqual(elements.aaSlider.value, 21);
assert.strictEqual(elements.dayNight.value, 'night');
assert.strictEqual(elements.difficulty.value, 'hard');
assert.strictEqual(elements.viewMode.value, '3d');
assert.strictEqual(elements.mapSelect.value, 'island');
assert.strictEqual(elements.startBtn.disabled, false);

console.log('Result and restart smoke test passed.');
