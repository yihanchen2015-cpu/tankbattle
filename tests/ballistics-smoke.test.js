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
    for(let i = 0; i < 36; i++) updateBullets(0.05);
    const peakZ = projectile.z;
    const fallingVz = projectile.vz;
    for(let i = 0; i < 20; i++) updateBullets(0.05);
    globalThis.__ballistics = {
        startZ, startVz, peakZ, fallingVz,
        lateZ: projectile.z,
        altitudeAlias: projectile.altitude,
        shellAtGroundHeight: projectileMatchesTargetHeight({type:'shell', z:22}, {z:0,isFlying:false}),
        shellAboveTarget: projectileMatchesTargetHeight({type:'shell', z:150}, {z:0,isFlying:false}),
        mgCannotHitAir: projectileMatchesTargetHeight({type:'mg', z:128}, {z:120,isFlying:true})
    };
`, sandbox);

const result = sandbox.__ballistics;
assert.strictEqual(result.startZ, 18, 'AA projectile should start above the gun');
const expectedVz = 28 * 60 * Math.sin(12 * Math.PI / 180);
assert(Math.abs(result.startVz - expectedVz) < 1e-9, 'AA vertical velocity should be derived from its adjustable elevation');
assert(result.peakZ > 150, 'AA projectile should climb on the real z axis');
assert(result.fallingVz < 10, 'vertical velocity should be near the apex after half the flight');
assert(result.lateZ < result.peakZ, 'gravity should bring the AA projectile back down');
assert.strictEqual(result.altitudeAlias, result.lateZ, 'legacy altitude rendering should mirror real z');
assert.strictEqual(result.shellAtGroundHeight, true, 'a shell at matching XYZ height should hit');
assert.strictEqual(result.shellAboveTarget, false, 'matching XY must not hit when Z differs');
assert.strictEqual(result.mgCannotHitAir, false, 'fixed-elevation machine guns must not hit helicopters');
console.log('3D ballistics smoke test passed:', result);
