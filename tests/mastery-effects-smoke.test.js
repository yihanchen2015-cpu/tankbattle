const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const saved = new Map();
const context = {
    console,
    Date,
    Map,
    Set,
    performance: { now: () => 1000 },
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
                style: {},
                classList: { add() {}, remove() {} },
                appendChild() {},
                addEventListener() {}
            };
        }
    },
    window: {},
    init() {},
    showNotification() {},
    showMessage() {},
    playWorldSound() {},
    updateTeamScore() {},
    normalizeAngle(angle) { return angle; },
    areEntitiesOnSameFactoryFloor() { return true; }
};
context.window = context;
vm.createContext(context);
for(const file of ['Config.js', 'Achievement.js', 'Progression.js', 'Ultimate.js', 'GameCore.js', 'Combat.js']) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
}

const result = vm.runInContext(`(() => {
    playerStats.tankMastery = {};
    selectedTank = 'zuoyan29';
    gameMode = 'classic';
    outposts = [];
    player = { dead:false };
    allies = [];
    enemies = [];

    // 点开始时只登记“使用过”，不能提前增加熟练度场次。
    recordTankUsed(selectedTank);
    const matchesAfterStart = getTankMasteryProfile(selectedTank).matches;
    resetMatchStats();
    endMatchStats('defeat');
    const matchesAfterResult = getTankMasteryProfile(selectedTank).matches;
    endMatchStats('defeat');
    const matchesAfterDuplicateResult = getTankMasteryProfile(selectedTank).matches;

    for(let i = matchesAfterResult; i < 110; i++) recordTankMasteryMatch(selectedTank);
    const maxProfile = getTankMasteryProfile(selectedTank);
    const maxVisual = getTankMasteryVisual(selectedTank);

    const observer = { id:'observer', aiTrackedTarget:null };
    const camouflaged = { id:'camo', masteryCamouflage:true };
    Math.random = () => .05;
    const camoAvoided = !shouldAIAcquireMasteryTarget(observer, camouflaged, 1000);
    Math.random = () => .5;
    const normalTargetAccepted = shouldAIAcquireMasteryTarget(observer, { id:'normal' }, 1000);

    bullets = [];
    particles = [];
    touchControlMode = false;
    gameConfig = { dayNight:'day' };
    const shooter = {
        x:0,y:0,z:0,angle:0,turretAngle:0,turretSize:28,
        tankType:'zuoyan29',team:'blue',isPlayer:false,isFlying:false,
        shells:2,mg:0,aa:0,masteryGoldenProjectiles:true,
        aiDamageMult:1,masteryAuraDamageMult:1,
        shellElevation:0,aaElevation:0,suddenDeathInfiniteAmmo:false,
        ghostActive:false,recoilTimer:0,recoilStrength:0
    };
    fireBullet(shooter, 'shell');
    const goldenBullet = bullets[0];

    const owner = { id:'owner', team:'blue', dead:false, x:0, y:0 };
    const victim = {
        id:'victim', team:'red', dead:false, x:10, y:0, hp:100, maxHp:100,
        invincible:0, armor:1, damageReduction:0, masteryAuraDefenseMult:1,
        shieldActive:false, shieldHp:0
    };
    player = owner;
    allies = [];
    enemies = [victim];
    trailEffects = [{
        kind:'mastery', x:0, y:0, life:1, maxLife:1, radius:24,
        team:'blue', owner, damagePerSecond:55, color:'#ffd85a'
    }];
    damageNumbers = [];
    updateTrailEffects(.5);
    const trailDamage = 100 - victim.hp;

    const inspired = {
        id:'ally', team:'blue', dead:false, isPlayer:false, x:250, y:0,
        aiState:'capture', aiStateTimer:0
    };
    const outside = {
        id:'outside', team:'blue', dead:false, isPlayer:false, x:301, y:0,
        aiState:'capture', aiStateTimer:0
    };
    const hostile = {
        id:'hostile', team:'red', dead:false, isPlayer:false, x:200, y:0,
        aiState:'retreat', aiStateTimer:0
    };
    player = { id:'ace', team:'blue', dead:false, x:0, y:0, masteryAura:true };
    allies = [inspired, outside];
    enemies = [hostile];
    updateMasteryBattleEffects();

    return {
        matchesAfterStart,
        matchesAfterResult,
        matchesAfterDuplicateResult,
        maxLevel: maxProfile.level,
        maxVisual,
        camoAvoided,
        normalTargetAccepted,
        golden: goldenBullet.masteryGolden,
        goldenDamage: goldenBullet.damage,
        baseShellDamage: CONFIG.bulletDamage,
        trailDamage,
        inspired: {
            state: inspired.aiState,
            attack: inspired.masteryAuraDamageMult,
            defense: inspired.masteryAuraDefenseMult,
            active: inspired.masteryAuraInspired
        },
        hostileInspired: hostile.masteryAuraInspired,
        outsideInspired: outside.masteryAuraInspired
    };
})()`, context);

assert.strictEqual(result.matchesAfterStart, 0, 'starting a battle must not grant mastery progress');
assert.strictEqual(result.matchesAfterResult, 1, 'a completed result should grant exactly one match');
assert.strictEqual(result.matchesAfterDuplicateResult, 1, 'duplicate settlement must not grant another match');
assert.strictEqual(result.maxLevel, 8, 'mastery should have eight levels');
assert(result.maxVisual.camouflage && result.maxVisual.goldenProjectiles && result.maxVisual.trailColor && result.maxVisual.aura,
    'maximum mastery should expose all four cumulative effects');
assert.strictEqual(result.camoAvoided, true, 'the ten-percent camouflage roll should reject target acquisition');
assert.strictEqual(result.normalTargetAccepted, true, 'non-camouflaged targets should not be rejected');
assert.strictEqual(result.golden, true, 'mastery shells should be marked golden for both renderers');
assert.strictEqual(result.goldenDamage, result.baseShellDamage * 1.2, 'golden shells should deal twenty percent more damage');
assert(Math.abs(result.trailDamage - 27.5) < 0.001, 'hot mastery trail should deal 55 damage per second');
assert.deepStrictEqual(JSON.parse(JSON.stringify(result.inspired)), {
    state:'combat', attack:1.15, defense:.85, active:true
}, 'AI within 300 should gain attack, defense, and attack-mode inspiration');
assert.strictEqual(result.hostileInspired, true, 'the ace aura should affect every AI in range, regardless of team');
assert.strictEqual(result.outsideInspired, false, 'AI outside the 300 radius should not be inspired');

console.log('Mastery effects smoke test passed:', result);
