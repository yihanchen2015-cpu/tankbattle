const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const math = Object.create(Math);
math.random = () => .05;
const context = {
    console, Math: math, Date, Map, Set, performance: { now: () => 1000 },
    navigator: {}, window: {}, localStorage: { getItem() { return null; }, setItem() {} },
    document: { getElementById() { return null; }, querySelectorAll() { return []; }, createElement() { return { style:{}, classList:{ add(){}, remove(){} }, appendChild(){}, addEventListener(){} }; } },
    init() {}, saveStats() {}, showNotification() {}, showMessage() {}, showDamageNumber() {},
    createParticles() {}, playWorldSound() {}, recordKill() {}, recordShot() {}, recordSpeed() {},
    recordPlayerDamageSource() {}, getTankSkinVisual() { return null; }, areEntitiesOnSameFactoryFloor() { return true; }
};
context.normalizeAngle = angle => angle;
context.window = context;
vm.createContext(context);
for(const file of ['Config.js', 'Progression.js', 'TankEvolution.js', 'GameCore.js', 'Combat.js', 'BattleSystems.js']) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename:file });
}

const result = vm.runInContext(`(() => {
    playerStats = { tankMastery:{}, selectedTankSkins:{} };
    ['zuoyan31','zuoyan32','zuoyan33','xingchen27c','xingchen27d','xingchen27e','duoduo_eng','duoduo_rocket','duoduo_emp']
        .forEach(type => playerStats.tankMastery[type] = { xp:11000, matches:110, kills:0, wins:0 });
    currentMap='classic'; gameMode='classic'; gameConfig={}; obstacles=[]; allies=[]; enemies=[]; bullets=[]; mapElements=[]; trailEffects=[]; aiTanks=[]; player=null;

    const swarm = createTank(TANKS.zuoyan31,100,100,'blue',true);
    player=swarm;
    const droneCount = spawnEvolutionDroneSwarm(swarm);
    const drone = bullets[0];

    const phantom = createTank(TANKS.zuoyan32,200,100,'blue',true);
    player=phantom; allies=[]; enemies=[]; aiTanks=[];
    const phantomCount = spawnEvolutionPhantoms(phantom);
    const spawnedPhantom = allies[0];

    const toxin = createTank(TANKS.zuoyan33,300,100,'blue',true);
    const toxinShell={type:'shell',damage:100,maxTargetHits:1,explosionRadius:0,owner:toxin};
    applyTankEvolutionToProjectile(toxin,toxinShell);

    const anti = createTank(TANKS.xingchen27c,400,100,'blue',true);
    const stealthTarget={x:430,y:100,hp:200,maxHp:1000,shieldHp:0,dead:false,team:'red',ghostActive:true,evolutionStealthActive:false,evolutionEffects:{}};
    const antiShell={type:'shell',damage:100,maxTargetHits:1,explosionRadius:0,owner:anti};
    applyTankEvolutionToProjectile(anti,antiShell);
    enemies=[stealthTarget]; player=anti;
    handleTankEvolutionProjectileHit(antiShell,stealthTarget,100);

    const judge=createTank(TANKS.xingchen27e,500,100,'blue',true);
    const marked={x:540,y:100,hp:1000,maxHp:1000,dead:false,team:'red',evolutionEffects:{}};
    markEvolutionJudgment(judge,marked);

    const engineer=createTank(TANKS.duoduo_eng,600,100,'blue',true);
    mapElements=[]; deployEvolutionCovers(engineer);

    const rocket=createTank(TANKS.duoduo_rocket,700,100,'blue',true);
    rocket.shells=20; bullets=[]; fireBullet(rocket,'shell');

    const emp=createTank(TANKS.duoduo_emp,800,100,'blue',true);
    const empShell={type:'shell',damage:100,maxTargetHits:1,explosionRadius:0,owner:emp};
    applyTankEvolutionToProjectile(emp,empShell);

    return {
        droneCount, droneAuto:drone.autoTrack, droneInfinite:drone.life,
        phantomCount, phantomDamage:spawnedPhantom.cloneDamageMult, phantomLife:spawnedPhantom.cloneTimer,
        toxin:toxinShell.toxinData,
        executed:stealthTarget.dead,
        judgment:{timer:marked.evolutionJudgmentTimer,noUlt:marked.evolutionJudgmentNoUltimate},
        covers:mapElements.map(el=>({hp:el.hp,duration:el.duration,damage:el.damage,heal:el.healPerSecond})),
        burst:rocket.evolutionBurstRemaining,
        rocketOrb:{style:bullets[0].evolutionStyle,scale:bullets[0].evolutionScale,fire:bullets[0].fireData},
        teleportDistance:TANKS.xingchen27s.ultimate.teleportDist,
        emp:empShell.empData
    };
})()`, context);

assert.strictEqual(result.droneCount, 9);
assert.strictEqual(result.droneAuto, true);
assert.strictEqual(result.droneInfinite, Infinity);
assert.strictEqual(result.phantomCount, 4);
assert.strictEqual(result.phantomDamage, .7);
assert.strictEqual(result.phantomLife, Infinity);
assert.strictEqual(result.toxin.chance, .45);
assert.strictEqual(result.toxin.damage, 60);
assert.strictEqual(result.toxin.spreadRadius, 200);
assert.strictEqual(result.executed, true);
assert.strictEqual(result.judgment.timer, 6);
assert.strictEqual(result.judgment.noUlt, true);
assert.strictEqual(result.covers.length, 3);
assert(result.covers.every(cover => cover.hp === 1200 && cover.duration === Infinity && cover.damage === 80 && cover.heal === 10));
assert.strictEqual(result.burst, 3);
assert.strictEqual(result.rocketOrb.style, 'skyfire-orb');
assert.strictEqual(result.rocketOrb.scale, 1.5);
assert.strictEqual(result.rocketOrb.fire.chance, .48);
assert.strictEqual(result.teleportDistance, 500);
assert.deepStrictEqual({ ...result.emp }, { minimapJam:10, turretDisable:2, skillDisable:10 });

const three = fs.readFileSync('ThreeRender.js','utf8');
assert(three.includes("tank.tankType === 'xingchen27a'") && three.includes('guardianDome'));
assert(three.includes("tank.tankType === 'xingchen27b'") && three.includes('fortressBubble'));
console.log('Tank evolution wave-two smoke test passed:', result);
