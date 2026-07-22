const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

class FakeElement {
    constructor() {
        this.classes = new Set();
        this.classList = {
            add: value => this.classes.add(value),
            remove: value => this.classes.delete(value)
        };
    }
}

const banner = new FakeElement();
const announcements = [];
const damageEvents = [];
const sandbox = {
    console,
    Math,
    Date,
    CONFIG: { mapWidth: 4000, mapHeight: 4000, tankSize: 35, apsCharges: 4 },
    currentMap: 'classic',
    gameTime: 0,
    bullets: [],
    document: { getElementById(id) { return id === 'suddenDeathBanner' ? banner : null; } },
    checkObstacleCollision() { return false; },
    isPositionInWater() { return false; },
    createParticles() {},
    showDamageNumber() {},
    playWorldSound() {},
    showMessage() {},
    showNotification() {},
    getReplayTankName(tank) { return tank.name || tank.tankType; },
    addBattleAnnouncement(team, text) { announcements.push({ team, text }); },
    getWinningScoreTeam() { return 'draw'; },
    getNearbyTanks() { return [sandbox.player, ...sandbox.allies, ...sandbox.enemies]; },
    applyDirectDamage(tank, damage, source, cause) {
        tank.hp -= damage;
        damageEvents.push({ tank:tank.id, damage, cause });
        if(tank.hp <= 0) tank.dead = true;
        return damage;
    }
};
sandbox.player = {
    id:'player', name:'工程车', tankType:'duoduo_eng', team:'blue', isPlayer:true, dead:false,
    x:800, y:800, hp:1500, maxHp:1800, shells:10, maxShells:100, mg:20, maxMG:140, aa:2, maxAA:15,
    apsCharges:2, ultimateCooldown:20, invincible:0
};
sandbox.allies = [
    { id:'ally', name:'队友', tankType:'zuoyan29', team:'blue', dead:false, x:880, y:800, hp:180, maxHp:800, shells:5, maxShells:80, mg:5, maxMG:200, aa:0, maxAA:15, ultimateCooldown:12, invincible:0 },
    { id:'dead', name:'阵亡队友', tankType:'zuoyan30', team:'blue', dead:true, x:900, y:800, hp:0, maxHp:650, shells:20, maxShells:60, mg:30, maxMG:170, aa:3, maxAA:15, ultimateCooldown:10, invincible:0 }
];
sandbox.enemies = [
    { id:'enemy', name:'敌人', tankType:'duoduo', team:'red', dead:false, x:930, y:800, hp:900, maxHp:2000, shells:30, maxShells:60, mg:40, maxMG:120, aa:4, maxAA:15, ultimateCooldown:30, invincible:0 }
];

vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('BattleSystems.js', 'utf8'), sandbox, { filename:'BattleSystems.js' });

const allyHpBefore = sandbox.allies[0].hp;
assert.strictEqual(vm.runInContext('attemptEngineerRepair(player, true)', sandbox), true);
assert(sandbox.allies[0].hp > allyHpBefore, 'engineer should repair the most damaged nearby teammate');
assert.strictEqual(sandbox.player.hp, 1500, 'engineer must not repair itself');

vm.runInContext(`
    const drop = spawnAirSupply(player.x, player.y);
    drop.z = 0; drop.landed = true;
    updateAirSupplies(.1);
`, sandbox);
assert(sandbox.player.hp > 1500, 'air supply should repair the collector');
assert(sandbox.player.shells > 10 && sandbox.player.mg > 20, 'air supply should replenish ammunition');
assert.strictEqual(sandbox.player.apsCharges, 3, 'air supply should restore one APS charge');

assert.strictEqual(vm.runInContext(`shouldAmmoRackExplode({ shells:100,maxShells:100,mg:100,maxMG:100,aa:10,maxAA:10 }, .5)`, sandbox), true);
assert.strictEqual(vm.runInContext(`shouldAmmoRackExplode({ shells:0,maxShells:100,mg:0,maxMG:100,aa:0,maxAA:10 }, 0)`, sandbox), false);
const friendlyHp = sandbox.allies[0].hp;
const enemyHp = sandbox.enemies[0].hp;
vm.runInContext(`triggerAmmoRackExplosion({ id:'wreck', name:'殉爆坦克', team:'blue', x:850, y:800, shells:60,maxShells:60,mg:100,maxMG:120,aa:10,maxAA:15 })`, sandbox);
assert(sandbox.allies[0].hp < friendlyHp, 'ammo-rack blast must damage friendly units');
assert(sandbox.enemies[0].hp < enemyHp, 'ammo-rack blast must damage enemy units');
assert(damageEvents.every(event => event.cause === '弹药架殉爆'));
assert.strictEqual(vm.runInContext(`ammoRackFireballs.length`, sandbox), 1, 'ammo-rack detonation should create a persistent fireball effect');

const deadHp = sandbox.allies[1].hp;
assert.strictEqual(vm.runInContext('handleBattleTimeExpired()', sandbox), true, 'tied regulation time should trigger sudden death');
assert.strictEqual(sandbox.gameTime, 60);
assert.strictEqual(sandbox.player.hp, sandbox.player.maxHp);
assert.strictEqual(sandbox.enemies[0].hp, sandbox.enemies[0].maxHp);
assert.strictEqual(sandbox.allies[1].hp, deadHp, 'dead tanks must not revive');
assert.strictEqual(sandbox.player.ultimateCooldown, 0);
assert.strictEqual(sandbox.player.suddenDeathInfiniteAmmo, true);
assert.strictEqual(sandbox.player.shells, sandbox.player.maxShells);
assert(Math.hypot(sandbox.player.x - 2000, sandbox.player.y - 2000) < 400, 'survivors should gather near map center');
assert(banner.classes.has('active'));

console.log('Battle systems smoke test passed:', {
    announcements: announcements.length,
    friendlyFireEvents: damageEvents.length,
    suddenDeathTime: sandbox.gameTime
});
