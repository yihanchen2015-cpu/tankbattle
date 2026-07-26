const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const saved = new Map();
const context = {
    console,
    Math,
    Date,
    Map,
    Set,
    AbortController,
    performance: { now: () => 1000 },
    window: {},
    localStorage: {
        getItem(key) { return saved.get(key) || null; },
        setItem(key, value) { saved.set(key, value); },
        removeItem(key) { saved.delete(key); }
    },
    document: {
        getElementById() { return null; },
        querySelectorAll() { return []; },
        createElement() {
            return {
                className: '',
                innerHTML: '',
                style: {},
                addEventListener() {},
                appendChild() {},
                querySelector() { return null; }
            };
        }
    },
    init() {},
    createParticles() {},
    showNotification() {},
    showMessage() {},
    stopEngineAudio() {}
};

vm.createContext(context);
for(const file of ['Config.js', 'Achievement.js', 'Progression.js', 'GameCore.js']) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
}

const result = vm.runInContext(`(() => {
    playerStats.tankMastery = {};
    recordTankMasteryMatch('zuoyan29');
    recordTankMasteryMatch('zuoyan29');
    recordTankMasteryMatch('zuoyan29');
    recordTankMasteryKill('zuoyan29');
    const noviceUnlock = getTankMasteryProfile('zuoyan29');
    for(let i = 3; i < 15; i++) recordTankMasteryMatch('zuoyan29');
    const veteran = getTankMasteryProfile('zuoyan29');
    const visual = getTankMasteryVisual('zuoyan29');

    const sanitized = sanitizeCustomRoomConfig({
        rule: 'score', blueCount: 99, redCount: -5, durationMinutes: 7,
        outpostCount: 5, reinforcements: false, scoreTarget: 7500,
        baseHp: 18000, aiAmmoPercent: 135, tankPool: ['zuoyan29', 'xingchen27b', 'bad-type']
    });
    customRoomConfig = sanitized;
    gameMode = 'custom';
    currentMap = 'classic';
    CONFIG.mapWidth = 3000;
    CONFIG.mapHeight = 3000;
    bases = {
        blue: { hp: 1, maxHp: 1 },
        red: { hp: 1, maxHp: 1 }
    };
    outposts = [{x:100,y:100,name:'A',owner:null,captureProgress:0,capturingTeam:null,radius:100}];
    applyCustomRoomMapRules();
    const playerTank = createTank(TANKS.zuoyan29, 500, 500, 'blue', true);

    return {
        noviceUnlock,
        veteran,
        visual,
        sanitized,
        outpostCount: outposts.length,
        baseHp: bases.blue.hp,
        baseInvulnerable: bases.blue.invulnerable,
        playerMasteryLevel: playerTank.masteryLevel,
        playerTrail: playerTank.masteryTrailColor,
        spawnTimer: playerTank.spawnAnimationTimer
    };
})()`, context);

assert.strictEqual(result.noviceUnlock.level, 2, 'three matches should unlock level-two camouflage');
assert.strictEqual(result.noviceUnlock.kills, 1, 'mastery should retain per-tank kills');
assert.strictEqual(result.veteran.level, 4, 'fifteen matches should unlock the mastery trail');
assert(result.visual.trailColor, 'veteran mastery should expose a tank-specific trail color');
assert.notStrictEqual(result.visual.color, '#3388ff', 'mastery paint should visibly alter the base color');
assert.strictEqual(result.sanitized.rule, 'score');
assert.strictEqual(result.sanitized.blueCount, 20, 'custom team size should clamp to the supported maximum');
assert.strictEqual(result.sanitized.redCount, 1, 'custom team size should clamp to the supported minimum');
assert.deepStrictEqual(JSON.parse(JSON.stringify(result.sanitized.tankPool)), ['zuoyan29', 'xingchen27b']);
assert.strictEqual(result.outpostCount, 5, 'custom room should create the requested number of outposts');
assert.strictEqual(result.baseHp, 18000, 'custom room base HP should be applied to the generated map');
assert.strictEqual(result.baseInvulnerable, true, 'score rooms should keep bases as indestructible map anchors');
assert.strictEqual(result.playerMasteryLevel, 4, 'player tank should receive its saved mastery cosmetics');
assert(result.playerTrail, 'player tank should carry its unlocked mastery trail');
assert(result.spawnTimer > 1, 'newly spawned tanks should start with a spawn animation');

console.log('Mastery and custom room smoke test passed:', result);
