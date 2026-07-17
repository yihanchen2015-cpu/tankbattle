const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const sandbox = { console, performance, Math, Map, Set, window: {}, AbortController };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'Config.js'), 'utf8'), sandbox);
vm.runInContext(`
    var currentMap = 'classic';
    function recordShot() {}
    function createParticles() {}
    function normalizeAngle(angle) {
        while(angle > Math.PI) angle -= Math.PI * 2;
        while(angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    }
    function explodeRocket() {}
`, sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'Combat.js'), 'utf8'), sandbox);
vm.runInContext(`
    player = null; allies = []; enemies = []; obstacles = [];
    const testTank = {
        x: 1000, y: 1000, z: 0, turretAngle: 0, turretSize: 30,
        team: 'blue', aa: 2, shells: 0, mg: 0, fireRate: 1,
        tankType: 'duoduo_spat', isFlying: false, isPlayer: false,
        ghostActive: false, stormActive: false, aiDamageMult: 1
    };
    fireBullet(testTank, 'aa');
    const projectile = bullets[0];
    const startZ = projectile.z;
    const startVz = projectile.vz;
    for(let i = 0; i < 25; i++) updateBullets(0.05);
    const peakZ = projectile.z;
    const fallingVz = projectile.vz;
    for(let i = 0; i < 20; i++) updateBullets(0.05);
    globalThis.__ballistics = {
        startZ, startVz, peakZ, fallingVz,
        lateZ: projectile.z,
        altitudeAlias: projectile.altitude
    };
`, sandbox);

const result = sandbox.__ballistics;
assert.strictEqual(result.startZ, 18, 'AA projectile should start above the gun');
assert.strictEqual(result.startVz, 240, 'AA projectile should store vertical velocity');
assert(result.peakZ > 150, 'AA projectile should climb on the real z axis');
assert(result.fallingVz < 10, 'vertical velocity should be near the apex after half the flight');
assert(result.lateZ < result.peakZ, 'gravity should bring the AA projectile back down');
assert.strictEqual(result.altitudeAlias, result.lateZ, 'legacy altitude rendering should mirror real z');
console.log('3D ballistics smoke test passed:', result);
