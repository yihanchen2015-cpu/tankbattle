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
    const profileAfterResult = getTankMasteryProfile(selectedTank);
    const matchesAfterResult = profileAfterResult.matches;
    endMatchStats('defeat');
    const profileAfterDuplicateResult = getTankMasteryProfile(selectedTank);
    const matchesAfterDuplicateResult = profileAfterDuplicateResult.matches;
    const performanceXp = calculateTankMasteryMatchXp({
        victory:true, kills:3, survivalSeconds:120
    });

    for(let i = matchesAfterResult; i < 110; i++) recordTankMasteryMatch(selectedTank);
    const maxProfile = getTankMasteryProfile(selectedTank);
    const maxVisual = getTankMasteryVisual(selectedTank);
    currentMap = 'classic';
    const maxTank = createTank(TANKS[selectedTank], 100, 100, 'blue', true);
    playerStats.tankMastery.kimi_tank = { matches:15, kills:0, wins:0, xp:1500 };
    const kimiVisual = getTankMasteryVisual('kimi_tank');
    const kimiTank = createTank(TANKS.kimi_tank, 150, 100, 'blue', true);
    Math.random = () => .999;
    const maxAiTank = createTank(TANKS[selectedTank], 200, 100, 'red', false);
    const maxAiTankStats = {
        level:maxAiTank.masteryLevel,
        levelColor:maxAiTank.masteryLevelColor,
        hp:maxAiTank.hp,
        speed:maxAiTank.speed,
        armor:maxAiTank.armor,
        aura:maxAiTank.masteryAura,
        weaponDamageMult:maxAiTank.masteryWeaponDamageMult
    };
    const aiLevelSamples = [0, .3, .52, .68, .8, .88, .94, .999].map(rollAIMasteryLevel);

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
        aiDamageMult:1,masteryAuraDamageMult:1,masteryWeaponDamageMult:1.2,
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
        team:'blue', owner, damagePerSecond:75, color:'#ffd85a'
    }];
    damageNumbers = [];
    updateTrailEffects(.5);
    const trailDamage = 100 - victim.hp;

    trailEffects = [];
    maxAiTank.x = 0;
    maxAiTank.y = 0;
    maxAiTank.hp = 1;
    maxAiTank.dead = false;
    maxAiTank.invincible = 0;
    maxAiTank.masteryDeathFlameSpawned = false;
    player = null;
    applyDirectDamage(maxAiTank, 10, null, '测试击毁');
    const deathFlame = trailEffects[0];
    const flameVictim = {
        id:'flame-victim', team:'blue', dead:false, isPlayer:false, x:20, y:0,
        hp:1000, maxHp:1000, invincible:0, armor:1, damageReduction:0,
        masteryAuraDefenseMult:1, shieldActive:false, shieldHp:0
    };
    const flameFriendly = {
        id:'flame-friendly', team:'red', dead:false, isPlayer:false, x:20, y:0,
        hp:1000, maxHp:1000, invincible:0, armor:1, damageReduction:0,
        masteryAuraDefenseMult:1, shieldActive:false, shieldHp:0
    };
    player = null;
    allies = [flameVictim];
    enemies = [flameFriendly];
    updateTrailEffects(.5);
    const deathFlameDamage = 1000 - flameVictim.hp;
    const friendlyDeathFlameDamage = 1000 - flameFriendly.hp;

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
    player = { id:'ace', team:'blue', dead:false, x:0, y:0, masteryAura:true, masteryLevel:5, masteryAuraRadius:300 };
    allies = [inspired, outside];
    enemies = [hostile];
    updateMasteryBattleEffects();
    const quotaRoster=[];
    const quotaLevels=Array.from({length:10},()=>{
        const level=chooseAIMasteryLevelForTeam('blue',8,quotaRoster);
        quotaRoster.push({team:'blue',dead:false,isClone:false,masteryLevel:level});
        return level;
    });

    return {
        matchesAfterStart,
        matchesAfterResult,
        matchesAfterDuplicateResult,
        xpAfterResult: profileAfterResult.xp,
        xpAfterDuplicateResult: profileAfterDuplicateResult.xp,
        performanceXp,
        auraColors: [5,6,7,8].map(getMasteryAuraColor),
        auraConfigs: [5,6,7,8].map(getMasteryAuraConfig),
        quotaLevels,
        quotaHigh:quotaLevels.filter(level=>level>=5).length,
        quotaLow:quotaLevels.filter(level=>level<=2).length,
        deathFlameConfigs: [5,6,7,8].map(getMasteryDeathFlameConfig),
        kimiBinaryVisual: kimiVisual.binaryCode,
        kimiBinaryTank: kimiTank.masteryBinaryCode,
        maxLevel: maxProfile.level,
        maxVisual,
        maxTankStats: {
            hp:maxTank.hp,
            maxHp:maxTank.maxHp,
            speed:maxTank.speed,
            turnSpeed:maxTank.turnSpeed,
            armor:maxTank.armor,
            weaponDamageMult:maxTank.masteryWeaponDamageMult,
            rangeMult:maxTank.masteryRangeMult,
            projectileSpeedMult:maxTank.masteryProjectileSpeedMult
        },
        maxAiTankStats,
        aiLevelSamples,
        camoAvoided,
        normalTargetAccepted,
        golden: goldenBullet.masteryGolden,
        goldenDamage: goldenBullet.damage,
        baseShellDamage: CONFIG.bulletDamage,
        trailDamage,
        deathFlame: {
            kind:deathFlame.kind,
            color:deathFlame.color,
            duration:deathFlame.maxLife,
            radius:deathFlame.radius,
            damagePerSecond:deathFlame.damagePerSecond,
            damage:deathFlameDamage,
            friendlyDamage:friendlyDeathFlameDamage
        },
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
assert.strictEqual(result.xpAfterResult, 100, 'a completed defeat should grant the base 100 XP');
assert.strictEqual(result.xpAfterDuplicateResult, 100, 'duplicate settlement must not grant XP again');
assert.deepStrictEqual(JSON.parse(JSON.stringify(result.performanceXp)), {
    completion:100, victory:150, kills:90, survival:60, total:400
}, 'match XP should combine completion, victory, kills, and survival performance');
assert.deepStrictEqual(JSON.parse(JSON.stringify(result.auraColors)), [
    '#a000ff', '#ff7a00', '#ff1744', '#ffd700'
], 'level-five-to-eight battle auras should come from independent pure-color constants');
assert.deepStrictEqual(JSON.parse(JSON.stringify(result.auraConfigs)), [
    {radius:300,attackMult:1.22,defenseMult:.78},
    {radius:340,attackMult:1.27,defenseMult:.73},
    {radius:380,attackMult:1.32,defenseMult:.68},
    {radius:430,attackMult:1.40,defenseMult:.60}
], 'higher mastery auras should grow in both radius and combat strength');
assert.strictEqual(result.quotaHigh, 3, 'Lv.5+ tanks should occupy no more than 30% of a ten-tank team');
assert.strictEqual(result.quotaLow, 3, 'Lv.1-2 tanks should occupy at least 30% of a ten-tank team');
result.quotaLevels.forEach((level, index) => {
    const prefix=result.quotaLevels.slice(0,index+1);
    assert(prefix.filter(item=>item>=5).length<=Math.floor(prefix.length*.3),
        'the high-level cap should hold during incremental spawns');
    assert(prefix.filter(item=>item<=2).length>=Math.ceil(prefix.length*.3),
        'the low-level floor should hold during incremental spawns');
});
assert.strictEqual(result.maxVisual.auraRadius, 430, 'level-eight aura should be larger than level five');
assert.deepStrictEqual(JSON.parse(JSON.stringify(result.deathFlameConfigs)), [
    {color:'#a000ff',damagePerSecond:70,duration:5,radius:100},
    {color:'#ff7a00',damagePerSecond:100,duration:6,radius:120},
    {color:'#ff1744',damagePerSecond:140,duration:7,radius:140},
    {color:'#ffd700',damagePerSecond:190,duration:9,radius:165}
], 'death flames should have distinct level-five-to-eight colors, damage, duration, and radius');
assert.strictEqual(result.kimiBinaryVisual, true, 'level-four Kimi should unlock the binary-code visual');
assert.strictEqual(result.kimiBinaryTank, true, 'the created Kimi tank should carry the binary-code visual flag');
assert.strictEqual(result.maxLevel, 8, 'mastery should have eight levels');
assert(result.maxVisual.camouflage && result.maxVisual.goldenProjectiles && result.maxVisual.trailColor && result.maxVisual.aura,
    'maximum mastery should expose all four cumulative effects');
assert.strictEqual(result.maxTankStats.hp, 1000);
assert.strictEqual(result.maxTankStats.maxHp, 1000);
assert(Math.abs(result.maxTankStats.speed - 6.325) < 1e-9);
assert(Math.abs(result.maxTankStats.turnSpeed - .1062) < 1e-9);
assert(Math.abs(result.maxTankStats.armor - 1.0) < 1e-9);
assert.strictEqual(result.maxTankStats.weaponDamageMult, 1.2,
    'levels six through eight should apply cumulative mobility, durability, and weapon bonuses');
assert.strictEqual(result.maxTankStats.rangeMult, 1.7, 'level eight should accumulate seventy percent extra range');
assert.strictEqual(result.maxTankStats.projectileSpeedMult, 1.42, 'level eight should accumulate forty-two percent extra projectile speed');
const normalizedMaxAiTankStats = JSON.parse(JSON.stringify(result.maxAiTankStats));
normalizedMaxAiTankStats.speed = Number(normalizedMaxAiTankStats.speed.toFixed(3));
assert.deepStrictEqual(normalizedMaxAiTankStats, {
    level:8, levelColor:'#ffd84a', hp:1000, speed:6.325, armor:1,
    aura:true, weaponDamageMult:1.2
}, 'randomly generated AI levels should apply the same combat bonuses and level color');
assert.deepStrictEqual(JSON.parse(JSON.stringify(result.aiLevelSamples)), [1,2,3,4,5,6,7,8],
    'the weighted AI level roll should be able to produce every level');
assert.strictEqual(result.camoAvoided, true, 'the ten-percent camouflage roll should reject target acquisition');
assert.strictEqual(result.normalTargetAccepted, true, 'non-camouflaged targets should not be rejected');
assert.strictEqual(result.golden, true, 'mastery shells should be marked golden for both renderers');
assert(Math.abs(result.goldenDamage - result.baseShellDamage * 1.35 * 1.2) < 1e-9,
    'level-eight golden shells should combine the thirty-five-percent gold bonus with twenty-percent weapon damage');
assert(Math.abs(result.trailDamage - 37.5) < 0.001, 'hot mastery trail should deal 75 damage per second');
assert.deepStrictEqual(JSON.parse(JSON.stringify(result.deathFlame)), {
    kind:'mastery-death-flame', color:'#ffd700', duration:9, radius:165,
    damagePerSecond:190, damage:95, friendlyDamage:0
}, 'level-eight death fire should persist after owner death and damage enemies only');
assert.deepStrictEqual(JSON.parse(JSON.stringify(result.inspired)), {
    state:'combat', attack:1.22, defense:.78, active:true
}, 'AI within 300 should gain attack, defense, and attack-mode inspiration');
assert.strictEqual(result.hostileInspired, true, 'the ace aura should affect every AI in range, regardless of team');
assert.strictEqual(result.outsideInspired, false, 'AI outside the 300 radius should not be inspired');

console.log('Mastery effects smoke test passed:', result);
