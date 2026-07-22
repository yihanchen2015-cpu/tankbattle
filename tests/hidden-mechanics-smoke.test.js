const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

// 基地：常态随机目标；30% 血量自动狂暴并锁定最近目标。
const baseMath = Object.create(Math);
baseMath.random = () => 0.99;
const baseSandbox = {
    console,
    Math: baseMath,
    performance: { now: () => 0 },
    window: {},
    init() {},
    CONFIG: {
        mapWidth: 1000, mapHeight: 1000, baseHp: 50000, baseSize: 120,
        baseDefenseRange: 400, baseDefenseDamage: 120, baseDefenseCooldown: 2,
        baseRageThreshold: 0.3, baseRageDamageMultiplier: 2, baseRageFireRateMultiplier: 2
    },
    bases: { blue: { x:-60, y:-60, w:120, h:120, hp:50000, maxHp:50000, team:'blue', defenseCooldown:0 }, red:null },
    enemies: [
        { id:'near', x:100, y:0, dead:false },
        { id:'far', x:0, y:200, dead:false }
    ],
    allies: [], player:null, bullets: [],
    createParticles() {}, playWorldSound() {}, addBattleAnnouncement() {}
};
vm.createContext(baseSandbox);
vm.runInContext(fs.readFileSync('GameCore.js', 'utf8'), baseSandbox);
vm.runInContext('updateBaseDefense(0)', baseSandbox);
assert.strictEqual(baseSandbox.bullets[0].damage, 120, 'healthy base should deal 120 damage');
assert(Math.abs(baseSandbox.bullets[0].vx) < 0.01 && baseSandbox.bullets[0].vy > 0, 'healthy base should be able to pick a non-nearest random target');
baseSandbox.bullets.length = 0;
baseSandbox.bases.blue.hp = 15000;
baseSandbox.bases.blue.defenseCooldown = 0;
vm.runInContext('updateBaseDefense(0)', baseSandbox);
assert.strictEqual(baseSandbox.bases.blue.rageActive, true, 'base should enrage automatically at 30% HP');
assert.strictEqual(baseSandbox.bullets[0].damage, 240, 'enraged base should deal double damage');
assert.strictEqual(baseSandbox.bases.blue.defenseCooldown, 1, 'enraged base should fire every second');
assert(baseSandbox.bullets[0].vx > 0 && Math.abs(baseSandbox.bullets[0].vy) < 0.01, 'enraged base should target the nearest enemy');

// 跳弹：只接受小于 15° 的擦边入射，伤害减半并获得一次额外穿透。
const combatSandbox = {
    console,
    Math,
    CONFIG: {
        ricochetMaxGrazingAngle: 15, ricochetDamageMultiplier: 0.5,
        ricochetFriendlySpeedBoost: 0.1, ricochetFriendlyBoostDuration: 5,
        tankSize: 35, mgPenetration: 3, apsCooldown: 15,
        aaHitHeightTolerance: 62, aaExplosionRadius: 60, bulletDamage: 180
    },
    obstacles: [], bullets: [], currentMap:'classic',
    bases: { blue:{x:-500,y:-500,w:20,h:20,team:'blue'}, red:{x:500,y:500,w:20,h:20,team:'red'} },
    player:null, allies:[], enemies:[],
    createParticles() {}, playWorldSound() {}, showMessage() {}, showDamageNumber() {},
    getNearbyTanks() { return [combatSandbox.player, ...combatSandbox.allies, ...combatSandbox.enemies].filter(Boolean); }
};
vm.createContext(combatSandbox);
vm.runInContext(fs.readFileSync('Combat.js', 'utf8'), combatSandbox);
combatSandbox.graze = { type:'shell', canRicochet:true, ricocheted:false, prevX:95, prevY:110, x:105, y:160, vx:1, vy:5, damage:180, hitTanks:new Set(), team:'blue' };
assert.strictEqual(vm.runInContext('tryRicochetBullet(graze, {x:100,y:100,w:100,h:100})', combatSandbox), true);
assert.strictEqual(combatSandbox.graze.damage, 90);
assert.strictEqual(combatSandbox.graze.maxTargetHits, 2);
assert(combatSandbox.graze.vx < 0 && combatSandbox.graze.vy > 0, 'ricochet should reflect velocity around the surface normal');
combatSandbox.steep = { type:'shell', canRicochet:true, ricocheted:false, prevX:95, prevY:130, x:105, y:132, vx:5, vy:1, damage:180 };
assert.strictEqual(vm.runInContext('tryRicochetBullet(steep, {x:100,y:100,w:100,h:100})', combatSandbox), false, 'steep impacts must not ricochet');

const friendly = { id:'friend', x:150, y:150, hp:800, maxHp:800, team:'blue', dead:false, invincible:0 };
combatSandbox.player = friendly;
combatSandbox.bullets = [{ type:'shell', ricocheted:true, x:150, y:150, vx:1, vy:0, damage:90, team:'blue', owner:null, hitTanks:new Set(), maxTargetHits:2 }];
vm.runInContext('checkCollisions()', combatSandbox);
assert.strictEqual(friendly.hp, 800, 'ricochet must not damage a friendly unit');
assert.strictEqual(friendly.ricochetSpeedBoost, 0.1);
assert.strictEqual(friendly.ricochetSpeedBoostTimer, 5);
assert.strictEqual(combatSandbox.bullets.length, 1, 'friendly encouragement should consume only one of two penetration slots');

// 绝地偷袭：≤3 名蓝方发现并占领隐藏点后，召唤三辆边缘增援并给全员 20% 护盾。
const rescueAnnouncements = [];
const rescueSandbox = {
    console, Math, Date,
    CONFIG: { mapWidth:4000, mapHeight:4000, tankSize:35, apsCharges:4 },
    gameMode:'sneak', currentMap:'classic', gameConfig:{difficulty:'normal'},
    obstacles:[], aiTanks:[], enemies:[],
    player:{ id:'player', team:'blue', dead:false, x:0, y:0, maxHp:1000, hp:1000, shieldActive:false, shieldHp:0 },
    allies:[
        { id:'a1', team:'blue', dead:false, x:200, y:200, maxHp:800, hp:800, shieldActive:false, shieldHp:0 },
        { id:'a2', team:'blue', dead:false, x:300, y:300, maxHp:1200, hp:1200, shieldActive:false, shieldHp:0 }
    ],
    TANKS: {
        xingchen27a:{hp:1200,maxHp:1200,maxShells:60,maxMG:100,maxAA:15},
        duoduo_ifv:{hp:1500,maxHp:1500,maxShells:70,maxMG:180,maxAA:15},
        duoduo_eng:{hp:1800,maxHp:1800,maxShells:100,maxMG:140,maxAA:15}
    },
    checkObstacleCollision() { return false; }, isPositionInWater() { return false; },
    createTank(data,x,y,team) { return { id:`reinforcement-${x}-${y}`, team, dead:false, x,y, hp:data.hp, maxHp:data.maxHp, shieldActive:false, shieldHp:0, maxShells:data.maxShells, maxMG:data.maxMG, maxAA:data.maxAA }; },
    createParticles() {}, playWorldSound() {}, showNotification() {},
    addBattleAnnouncement(team,text) { rescueAnnouncements.push({team,text}); }
};
vm.createContext(rescueSandbox);
vm.runInContext(fs.readFileSync('BattleSystems.js', 'utf8'), rescueSandbox);
vm.runInContext('initializeSneakRescueMechanic(); player.x=sneakHiddenOutpost.x; player.y=sneakHiddenOutpost.y; updateSneakRescueMechanic(6.1)', rescueSandbox);
assert.strictEqual(rescueSandbox.allies.length, 5, 'hidden rescue signal should add exactly three AI tanks');
assert.strictEqual(rescueSandbox.aiTanks.length, 3);
assert.strictEqual(rescueSandbox.player.shieldHp, 200, 'player should receive a shield worth 20% max HP');
assert(rescueSandbox.allies.every(tank => tank.shieldHp >= tank.maxHp * 0.2), 'all surviving allies and reinforcements should receive shields');
assert.strictEqual(vm.runInContext('sneakHiddenOutpost.triggered', rescueSandbox), true);

console.log('Hidden mechanics smoke test passed:', {
    baseDamage: baseSandbox.bullets[0].damage,
    ricochetDamage: combatSandbox.graze.damage,
    reinforcements: rescueSandbox.aiTanks.length,
    announcements: rescueAnnouncements.length
});
