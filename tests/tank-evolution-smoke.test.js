const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const math = Object.create(Math);
math.random = () => .2;
const context = {
    console,
    Math: math,
    Date,
    Map,
    Set,
    AbortController,
    performance: { now: () => 1000 },
    navigator: {},
    window: {},
    document: {
        getElementById() { return null; },
        querySelectorAll() { return []; },
        createElement() {
            return {
                className: '',
                innerHTML: '',
                style: {},
                classList: { add() {}, remove() {} },
                appendChild() {},
                addEventListener() {}
            };
        }
    },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    init() {},
    saveStats() {},
    showNotification() {},
    showMessage() {},
    showDamageNumber() {},
    createParticles() {},
    playWorldSound() {},
    recordKill() {},
    recordShot() {},
    recordSpeed() {},
    recordPlayerDamageSource() {},
    getTankSkinVisual() { return null; },
    areEntitiesOnSameFactoryFloor() { return true; }
};
context.window = context;
vm.createContext(context);

for(const file of ['Config.js', 'Progression.js', 'TankEvolution.js', 'GameCore.js', 'Combat.js']) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
}

const result = vm.runInContext(`(() => {
    playerStats = {
        tankMastery: {
            zuoyan29: { xp:11000, matches:110, kills:0, wins:0 },
            zuoyan_x: { xp:11000, matches:110, kills:0, wins:0 },
            xingchen27a: { xp:11000, matches:110, kills:0, wins:0 },
            kimi_tank: { xp:11000, matches:110, kills:0, wins:0 }
        },
        selectedTankSkins: {}
    };
    currentMap = 'classic';
    gameMode = 'classic';
    gameConfig = {};
    obstacles = [];
    allies = [];
    enemies = [];
    player = null;

    const stageCounts = EVOLUTION_TANK_TYPES.map(type => TANK_EVOLUTIONS[type].length);
    const stageEightNames = EVOLUTION_TANK_TYPES.map(type => TANK_EVOLUTIONS[type][7].name);
    const iceProfile = getTankMasteryProfile('zuoyan29');
    const kimiProfile = getTankMasteryProfile('kimi_tank');
    const iceTank = createTank(TANKS.zuoyan29, 100, 100, 'blue', true);
    const shieldTank = createTank(TANKS.xingchen27a, 200, 100, 'blue', true);
    const commandTank = createTank(TANKS.zuoyan_x, 240, 100, 'blue', true);
    const kimiTank = createTank(TANKS.kimi_tank, 300, 100, 'blue', true);

    const shell = {
        type:'shell', damage:100, maxTargetHits:1, explosionRadius:0,
        owner:iceTank
    };
    applyTankEvolutionToProjectile(iceTank, shell);
    const freezeTarget = {
        x:140, y:100, hp:1000, maxHp:1000, dead:false, team:'red',
        fortressActive:false, shieldActive:false, evolutionEffects:{}
    };
    handleTankEvolutionProjectileHit(shell, freezeTarget, 100);

    const toxinShell = { type:'shell', damage:100, maxTargetHits:1, explosionRadius:0, owner:shieldTank };
    applyTankEvolutionToProjectile(shieldTank, toxinShell);
    const toxinTarget = { x:230,y:100,hp:1000,maxHp:1000,dead:false,team:'red',evolutionEffects:{} };
    tryApplyProjectileElementalStatus(toxinShell, toxinTarget);

    allies = [{ hp:500, maxHp:1000, dead:false, team:'blue', x:260, y:100 }];
    player = commandTank;
    const commandCount = applyEvolutionCommandBuff(commandTank);

    const cloneSource = kimiTank.evolutionEffects;
    handleTankEvolutionKill(kimiTank);

    return {
        tankCount: EVOLUTION_TANK_TYPES.length,
        stageCounts,
        stageEightNames,
        iceProfile: { level:iceProfile.level, name:iceProfile.levelName, reward:iceProfile.reward },
        kimiProfile: { name:kimiProfile.levelName, reward:kimiProfile.reward },
        iceTank: {
            style:iceTank.evolutionBodyStyle,
            projectile:iceTank.evolutionProjectileStyle,
            genericAura:iceTank.masteryAura
        },
        shell: {
            damage:shell.damage,
            hits:shell.maxTargetHits,
            style:shell.evolutionStyle,
            trail:shell.evolutionTrail
        },
        freezeDuration:freezeTarget.elementalFreezeTimer,
        toxinOrb:{style:toxinShell.evolutionStyle,scale:toxinShell.evolutionScale,chance:toxinShell.toxinData.chance,duration:toxinTarget.toxinDebuffTimer},
        command:{count:commandCount,radius:commandTank.ultimateData.radius,duration:commandTank.ultimateData.duration,shield:allies[0].shieldHp,damage:allies[0].commanderDamageBoost},
        cloneRatio:cloneSource.cloneStatRatio,
        cloneCanFire:cloneSource.cloneCanFire,
        kimiDamageAfterKill:kimiTank.evolutionKillDamageMult
    };
})()`, context);

assert.strictEqual(result.tankCount, 21, 'all twenty-one requested vehicles should have bespoke evolution trees');
assert(result.stageCounts.every(count => count === 8), 'every evolution tree should contain exactly eight stages');
assert.deepStrictEqual(Array.from(result.stageEightNames), [
    '永冻战神', '虚空战神', '太阳战神', '统御战神', '无限蜂群', '千面幻影', '毒液魔王',
    '毒液圣神', '不朽战神', '雷霆战神', '裁决者', '命运共同体', '天罚太阳',
    '毁灭战神', '风暴战神', '死神战神', '移动基地', '天火太阳', '末日EMP',
    '空中战神', '超越战神'
]);
assert.strictEqual(result.iceProfile.level, 8);
assert.strictEqual(result.iceProfile.name, '永冻战神');
assert(result.iceProfile.reward.includes('冰冻 35%/1.5 秒'));
assert.strictEqual(result.kimiProfile.name, '超越战神');
assert(result.kimiProfile.reward.includes('克隆继承 50%'));
assert.strictEqual(result.iceTank.style, 'eternal-ice');
assert.strictEqual(result.iceTank.projectile, 'gold-ice-prism');
assert.strictEqual(result.iceTank.genericAura, false, 'bespoke tanks must not inherit the old generic mastery aura');
assert.strictEqual(result.shell.hits, 2, 'level-eight left-research 29 shells should penetrate one additional target');
assert.strictEqual(result.shell.style, 'gold-ice-prism');
assert.strictEqual(result.shell.trail, '#8defff');
assert.strictEqual(result.freezeDuration, 1.5, 'ice shells should apply the 1.5-second elemental freeze');
assert.deepStrictEqual({ ...result.toxinOrb }, {style:'divine-toxic-orb',scale:1.5,chance:.42,duration:6});
assert.deepStrictEqual({ ...result.command }, {count:2,radius:500,duration:10,shield:400,damage:.3});
assert.strictEqual(result.cloneRatio, .5);
assert.strictEqual(result.cloneCanFire, true);
assert(Math.abs(result.kimiDamageAfterKill - 1.005) < 1e-9, 'machine learning should add 0.5% damage per kill');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('style.css', 'utf8');
const progression = fs.readFileSync('Progression.js', 'utf8');
assert(html.includes('TankEvolution.js?v=tank-evolution-34-elemental-trees'));
assert(css.includes('.tank-evolution-track') && css.includes('.tank-evolution-stage.current'));
assert(progression.includes('evolutionStages.map'), 'the mastery panel should render all eight stages separately');

console.log('Tank evolution smoke test passed:', result);
