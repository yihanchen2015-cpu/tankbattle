const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const stored = new Map();
const unlockedPopups = [];
const killCues = [];
const context = {
    console,
    Date,
    Math,
    TANKS: {},
    localStorage: {
        getItem(key) { return stored.get(key) || null; },
        setItem(key, value) { stored.set(key, value); },
        removeItem(key) { stored.delete(key); }
    },
    document: {
        body: {appendChild() {}},
        createElement() { return {style:{},remove() {}}; },
        getElementById() { return null; }
    },
    setTimeout() {},
    showNotification() {},
    showJuiceCue(...args) { killCues.push(args); },
    awardKillScore() {},
    getReplayTankName(target) { return target.name; }
};

vm.createContext(context);
vm.runInContext(fs.readFileSync('Achievement.js', 'utf8'), context, {filename:'Achievement.js'});
context.showAchievementPopup = achievement => unlockedPopups.push(achievement.id);

const result = vm.runInContext(`(() => {
    playerStats.unlockedAchievements = [];
    playerStats.smokeGrenadesDeployed = 0;
    playerStats.quickSmokeDeploys = 0;
    playerStats.damageUpgradesChosen = 0;

    recordSmokeDeployment(true);
    const firstSmokeProgress = getAchievementProgress('smokeRookie');
    playerStats.quickSmokeDeploys = 19;
    recordSmokeDeployment(true);
    const quickSmokeProgress = getAchievementProgress('quickSmokeExpert');

    playerStats.damageUpgradesChosen = 2;
    recordDamageUpgrade();
    const fieldRefitProgress = getAchievementProgress('fieldRefit');
    playerStats.damageUpgradesChosen = 9;
    recordDamageUpgrade();
    const hardenedProgress = getAchievementProgress('battleHardened');

    return {
        unlocked: playerStats.unlockedAchievements.slice(),
        firstSmokeProgress,
        quickSmokeProgress,
        fieldRefitProgress,
        hardenedProgress
    };
})()`, context);

assert(result.unlocked.includes('smokeRookie'), 'the first deployed smoke grenade should unlock its achievement');
assert(result.unlocked.includes('quickSmokeExpert'), '20 quick smoke deployments should unlock the quick-smoke achievement');
assert(result.unlocked.includes('fieldRefit'), 'three damage upgrades should unlock the refit achievement');
assert(result.unlocked.includes('battleHardened'), 'ten damage upgrades should unlock the veteran refit achievement');
assert.strictEqual(result.firstSmokeProgress.current, 1);
assert.strictEqual(result.quickSmokeProgress.current, 20);
assert.strictEqual(result.fieldRefitProgress.current, 3);
assert.strictEqual(result.hardenedProgress.current, 10);
assert.deepStrictEqual(
    unlockedPopups,
    ['smokeRookie', 'quickSmokeExpert', 'fieldRefit', 'battleHardened'],
    'each new achievement should announce exactly once'
);
assert(stored.has('tankBattleStats'), 'new achievement counters should persist to local storage');

vm.runInContext(`
    resetMatchStats();
    const killer = {isPlayer:true, tankType:'test', hp:100, maxHp:100, ghostActive:false};
    recordKill(killer, {name:'目标一', maxHp:100, isPlayer:false});
    recordKill(killer, {name:'目标二', maxHp:100, isPlayer:false});
    recordKill(killer, {name:'目标三', maxHp:100, isPlayer:false});
`, context);
assert.strictEqual(killCues.length, 2, 'double and triple kills should each trigger a juice cue');
assert.strictEqual(killCues[0][0], '二 杀！');
assert.strictEqual(killCues[1][0], '三 杀！');
assert.strictEqual(killCues[1][4], '连续击杀 ×3');

console.log('Achievement progress smoke test passed:', result);
