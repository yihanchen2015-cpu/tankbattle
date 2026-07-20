const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const sandbox = {
    console,
    window: {},
    AbortController,
    Math,
    showDamageNumber() {},
    createParticles() {},
    playWorldSound() {},
    showMessage() {},
    recordKill() {}
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'Config.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'Combat.js'), 'utf8'), sandbox);

vm.runInContext(`
    obstacles = [{ x: 100, y: 100, w: 100, h: 100, type: 'building', floors: 6 }];
    player = {
        id: 1, x: 150, y: 150, z: 80, hp: 600, maxHp: 600, isFlying: true,
        isPlayer: true, dead: false, color: '#44ddff', damageReduction: 0,
        shieldActive: false, helicopterCollisionCooldown: 0, helicopterCollisionHits: 0
    };
`, sandbox);

assert.strictEqual(vm.runInContext('flyingTankHitsObstacle(150, 150, 80, 25)', sandbox), true, '低空应撞上高楼');
assert.strictEqual(vm.runInContext('flyingTankHitsObstacle(150, 150, 260, 25)', sandbox), false, '足够高度应越过高楼');

for(let i = 0; i < 4; i++) {
    vm.runInContext('player.helicopterCollisionCooldown = 0; registerHelicopterCollision(player);', sandbox);
}
assert.strictEqual(vm.runInContext('player.helicopterOnFire', sandbox), true, '连续四次撞击应起火');
const hpBeforeFire = vm.runInContext('player.hp', sandbox);
vm.runInContext('updateHelicopterFlight(player, 0.5)', sandbox);
assert(vm.runInContext('player.hp', sandbox) < hpBeforeFire, '起火应持续扣血');

console.log('Helicopter smoke test passed:', vm.runInContext(`({
    obstacleHeight: getObstacleWorldHeight(obstacles[0]),
    collisionHits: player.helicopterCollisionHits,
    onFire: player.helicopterOnFire,
    hp: player.hp
})`, sandbox));
