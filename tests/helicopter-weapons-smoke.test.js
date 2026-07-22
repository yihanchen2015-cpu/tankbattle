const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const sandbox = {
    console,
    window: {},
    AbortController,
    Math,
    createParticles() {},
    showDamageNumber() {},
    playWorldSound() {},
    recordShot() {},
    recordKill() {},
    recordBaseDestroy() {},
    recordPlayerDamageSource() {},
    getNearbyTanks() { return sandbox.targets; },
    normalizeAngle(value) {
        while(value > Math.PI) value -= Math.PI * 2;
        while(value < -Math.PI) value += Math.PI * 2;
        return value;
    }
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('Config.js', 'utf8'), sandbox, { filename:'Config.js' });
vm.runInContext(fs.readFileSync('Combat.js', 'utf8'), sandbox, { filename:'Combat.js' });

vm.runInContext(`
    obstacles = [];
    currentMap = 'classic';
    bases = {
        blue:{team:'blue',x:100,y:100,w:120,h:120,hp:50000,maxHp:50000},
        red:{team:'red',x:3500,y:3500,w:120,h:120,hp:50000,maxHp:50000}
    };
    player = {
        id:'heli', tankType:'niuniu_heli', team:'blue', isPlayer:true, isFlying:true,
        x:1000,y:1000,z:150,turretAngle:0,turretSize:22, shells:10,maxShells:32,
        mg:30,maxMG:220,aa:0,maxAA:0,fireRate:1.3,dead:false,stormActive:false,
        ghostActive:false,toxinActive:false,aiDamageMult:1
    };
    allies = [];
    enemies = [];
`, sandbox);

const ground = {
    id:'ground', team:'red', isFlying:false, x:1000,y:1000,z:0, hp:1000,maxHp:1000,
    dead:false,invincible:0,armor:1,armorBoost:0,apsCharges:0,apsCooldown:0,
    damageReduction:0,shieldActive:false,reflectActive:false,shieldProtected:false,color:'#f44'
};
const flying = {
    id:'flying', team:'red', isFlying:true, x:1050,y:1000,z:150, hp:600,maxHp:600,
    dead:false,invincible:0,armor:1,armorBoost:0,apsCharges:0,apsCooldown:0,
    damageReduction:0,shieldActive:false,reflectActive:false,shieldProtected:false,color:'#f44'
};
sandbox.targets = [ground, flying];
sandbox.ground = ground;
sandbox.flying = flying;

vm.runInContext(`fireBullet(player, 'bomb')`, sandbox);
let bombState = vm.runInContext(`({ type:bullets[0].type, vx:bullets[0].vx, vy:bullets[0].vy, vz:bullets[0].vz, z:bullets[0].z, shells:player.shells })`, sandbox);
assert.strictEqual(bombState.type, 'bomb');
assert.strictEqual(bombState.vx, 0);
assert.strictEqual(bombState.vy, 0);
assert(bombState.vz < 0 && bombState.z > 100, 'bomb should start high and travel vertically downward');
assert.strictEqual(bombState.shells, 9);
for(let i = 0; i < 80 && vm.runInContext(`bullets.length`, sandbox); i++) vm.runInContext(`updateBullets(.05)`, sandbox);
assert(ground.hp < 1000, 'vertical bomb should damage a ground target below it');

ground.hp = 1000; ground.x = 1076; ground.y = 1000; sandbox.targets = [ground];
vm.runInContext(`bullets = []; fireBullet(player, 'bomb')`, sandbox);
for(let i = 0; i < 100 && vm.runInContext(`bullets.length`, sandbox); i++) vm.runInContext(`updateBullets(.05)`, sandbox);
assert.strictEqual(ground.hp, 1000, '150x150 bomb area should end 75 units from its center');
ground.x = 1074; ground.y = 1074;
vm.runInContext(`bullets = []; fireBullet(player, 'bomb')`, sandbox);
for(let i = 0; i < 100 && vm.runInContext(`bullets.length`, sandbox); i++) vm.runInContext(`updateBullets(.05)`, sandbox);
assert(ground.hp < 1000, 'bomb should use a 150x150 square, including its diagonal corners');

ground.hp = 1000; ground.x = 1000; ground.y = 1000; sandbox.targets = [ground, flying];
flying.hp = 600;
vm.runInContext(`
    bullets = [];
    fireBullet(player, 'airmg');
    bullets[0].x = flying.x;
    bullets[0].y = flying.y;
    bullets[0].z = flying.z + 8;
    checkCollisions();
`, sandbox);
assert.strictEqual(ground.hp, 1000, 'air-to-air machine gun must not damage ground tanks');
assert(flying.hp < 600, 'air-to-air machine gun should damage a helicopter at matching altitude');
assert.strictEqual(vm.runInContext(`player.mg`, sandbox), 29);
assert.strictEqual(vm.runInContext(`CONFIG.helicopterMinAltitude`, sandbox), 100);
assert.strictEqual(vm.runInContext(`CONFIG.helicopterMaxAltitude`, sandbox), 1000);

console.log('Helicopter weapons smoke test passed:', { bombState, groundHp:ground.hp, flyingHp:flying.hp });
