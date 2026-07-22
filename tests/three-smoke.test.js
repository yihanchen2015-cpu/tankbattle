const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
class FakeElement {
    constructor() { this.style = {}; this.children = []; this.textContent = ''; this.className = ''; this._queries = new Map(); }
    appendChild(child) { this.children.push(child); child.parent = this; return child; }
    replaceChildren() { this.children = []; }
    remove() { if(this.parent) this.parent.children = this.parent.children.filter(child => child !== this); }
    querySelector(selector) {
        if(!this._queries.has(selector)) this._queries.set(selector, new FakeElement());
        return this._queries.get(selector);
    }
    set innerHTML(value) { this._innerHTML = value; }
    get innerHTML() { return this._innerHTML || ''; }
    getBoundingClientRect() { return { width: 1280, height: 720 }; }
}
const domElements = new Map();
const getDomElement = id => {
    if(!domElements.has(id)) domElements.set(id, new FakeElement());
    return domElements.get(id);
};
const sandbox = {
    console,
    performance,
    Math,
    Map,
    Set,
    window: null,
    document: { getElementById: getDomElement, createElement: () => new FakeElement() },
    CONFIG: { mapWidth: 3000, mapHeight: 2400, tankSize: 35, outpostCaptureTime: 5, helicopterAltitude: 120 },
    MAP_TEMPLATES: { classic: { groundColor: '#3d5c1e' } },
    currentMap: 'classic',
    gameConfig: { dayNight: 'day', viewMode: '3d' },
    camera: { zoom: 1 },
    TANKS: { test: { name: '测试坦克' }, heli: { name: '敌方直升机' } },
    obstacles: [
        { x: 800, y: 700, w: 180, h: 200, type: 'building', floors: 5 },
        { x: 1200, y: 900, w: 80, h: 80, type: 'tree' }
    ],
    terrainZones: [{ type:'bridge', centered:true, x:1500, y:900, w:700, h:180, angle:0, archHeight:72, deckThickness:18 }],
    bases: {
        blue: { x: 200, y: 1100, w: 120, h: 120, hp: 1000, maxHp: 1000 },
        red: { x: 2680, y: 1100, w: 120, h: 120, hp: 1000, maxHp: 1000 }
    },
    outposts: [{ x: 1500, y: 1200, radius: 240, owner: null }],
    mapElements: [{ type: 'mine', x: 1300, y: 1200, radius: 40, armed: true }],
    environmentState: { sandstormActive: false },
    stormData: { safeZone: { x: 1500, y: 1200, radius: 900 } },
    ctfFlags: {},
    gameMode: 'classic',
    snowTracks: [],
    bullets: [],
    supplyDrops: [],
    ammoRackFireballs: [{ x:1520, y:1180, z:28, life:.8, maxLife:1.15, seed:.4 }],
    terrainGeneration: 1,
    terrainRevision: 0,
    terrainDebris: [],
    damageNumbers: [],
    allies: [],
    enemies: [],
    isTankInWater: () => false
};
sandbox.currentWeapon = 'shell';
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'vendor/three.min.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'ThreeRender.js'), 'utf8'), sandbox);

vm.runInContext(`
    player = {
        id: 'player', x: 1500, y: 1200, angle: 0, turretAngle: 0,
        color: '#4488ff', accent: '#88ccff', shape: 'medium', team: 'blue',
        tankType: 'test', turretSize: 30, isPlayer: true, dead: false, isFlying: false,
        shellElevation: 18, aaElevation: 30, muzzleFlashTimer:.1, muzzleFlashType:'shell'
    };
    threeView.initialized = true;
    threeView.scene = new THREE.Scene();
    threeView.camera = new THREE.PerspectiveCamera(52, 1280 / 720, 0.2, 2400);
    threeView.raycaster = new THREE.Raycaster();
    threeView.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    threeView.renderer = {
        render(scene, camera) { scene.updateMatrixWorld(true); camera.updateMatrixWorld(true); },
        setPixelRatio() {}, setSize() {}
    };
    rebuildThreeWorld(true);
    bullets.push({ x: 700, y: 1200, z: 100, vz: 120, vx: 10, vy: 0, type: 'aa', altitude: 100, age: 0.5, owner: player });
    renderThreeScene();
    const firstDirection = new THREE.Vector3();
    threeView.camera.getWorldDirection(firstDirection);
    const aaBullet = bullets[0];
    aaBullet.x = 760; aaBullet.age = 0.6; aaBullet.z = 170; aaBullet.altitude = 170;
    damageNumbers.push({ x: 1500, y: 1200, z: 55, text: '-180', life: 0.8, maxLife: 1 });
    outposts[0].captureProgress = 2.5; outposts[0].capturingTeam = 'blue';
    enemies.push({
        id: 'enemy-heli', x: 1600, y: 1200, z: 120, angle: Math.PI, turretAngle: Math.PI,
        color: '#ff4444', accent: '#ffaaaa', shape: 'helicopter', team: 'red',
        tankType: 'heli', turretSize: 25, isPlayer: false, dead: false, isFlying: true
    });
    supplyDrops.push({ id:'supply-test', x:1450, y:1160, z:180, landed:false, pulse:0 });
    const preservedObstacleId = obstacles[0].terrainId;
    const preservedObstacleMesh = threeView.obstacleMeshes.get(preservedObstacleId);
    obstacles.push({ terrainId:'rubble-test', x:1300, y:1040, w:120, h:80, type:'rubble', rubbleHeight:28, rubbleSeed:0.42 });
    terrainDebris.push({ id:'debris-test', x:1400, y:1100, z:35, size:12, rotation:0.4, color:'#716961', material:'stone', life:3 });
    terrainRevision++;
    player.rescueShieldActive = true; player.shieldActive = true; player.shieldHp = 200;
    gameMode = 'sneak';
    sneakHiddenOutpost = { x:1500, y:1200, discovered:true, triggered:false, signalTimer:0, contested:false, progress:3, captureTime:6 };
    player.angle = Math.PI / 2;
    renderThreeScene();
    const secondDirection = new THREE.Vector3();
    threeView.camera.getWorldDirection(secondDirection);
    for(let i = 0; i < 80; i++) updateThreeCamera(0.05);
    threeView.camera.updateMatrixWorld(true);
    const settledDirection = new THREE.Vector3();
    threeView.camera.getWorldDirection(settledDirection);
    settledDirection.y = 0; settledDirection.normalize();
    const expectedForward = new THREE.Vector3(0, 0, -1);
    let pointLights = 0;
    threeView.dynamicRoot.traverse(child => { if(child.isPointLight) pointLights++; });
    const obstacleMeshes = [];
    threeView.worldRoot.traverse(child => { if(child.userData.isObstacle) obstacleMeshes.push(child); });
    const aaMesh = threeView.bulletMeshes.get(aaBullet);
    const helicopterMesh = threeView.tankMeshes.get('enemy-heli');
    const viewTop = threeScreenToWorld(640, 0);
    const viewBottom = threeScreenToWorld(640, 720);
    const viewLeft = threeScreenToWorld(0, 360);
    const viewRight = threeScreenToWorld(1280, 360);
    globalThis.__threeResult = {
        worldChildren: threeView.worldRoot.children.length,
        tanks: threeView.tankMeshes.size,
        bullets: threeView.bulletMeshes.size,
        cameraReady: threeView.cameraReady,
        aim: threeScreenToWorld(640, 360),
        aaHeight: aaMesh.userData.projectile.position.y,
        aaTrailPoints: aaMesh.userData.trailPoints.length,
        helicopterTurret: !!helicopterMesh.userData.turretPivot,
        tankGunPitch: !!threeView.tankMeshes.get('player').userData.gunPitch,
        tankGunPitchAngle: threeView.tankMeshes.get('player').userData.gunPitch.rotation.z,
        muzzleFlashVisible: threeView.tankMeshes.get('player').userData.muzzleFlash.visible,
        archedBridge: threeView.worldRoot.children.some(child => child.isGroup && child.children.length === 18),
        fireballMeshes: threeView.fireballMeshes.size,
        supplyMeshes: threeView.supplyMeshes.size,
        rubbleMesh: threeView.obstacleMeshes.has('rubble-test'),
        preservedObstacleMesh: threeView.obstacleMeshes.get(preservedObstacleId) === preservedObstacleMesh,
        debrisMeshes: threeView.debrisMeshes.size,
        rescueShieldVisible: threeView.tankMeshes.get('player').userData.rescueShield.visible,
        hiddenOutpostVisible: !!threeView.hiddenOutpostMesh && threeView.hiddenOutpostMesh.visible,
        pointLights,
        fixedCameraDelta: firstDirection.distanceTo(secondDirection),
        worldAxisAlignment: settledDirection.dot(expectedForward),
        obstacleTypes: obstacleMeshes.map(mesh => mesh.geometry.type),
        hudChildren: document.getElementById('threeHudLayer').children.length,
        tankLabelCount: threeView.tankLabels.size,
        damageLabelCount: threeView.damageLabels.size,
        captureLabelCount: threeView.captureLabels.size,
        threatVisible: document.getElementById('threeThreatBorder').style.display,
        visibleDepth: Math.hypot(viewTop.x - viewBottom.x, viewTop.y - viewBottom.y),
        visibleWidth: Math.hypot(viewLeft.x - viewRight.x, viewLeft.y - viewRight.y)
    };
`, sandbox);

const result = sandbox.__threeResult;
assert(result.worldChildren > 0, '3D world should contain terrain and props');
assert.strictEqual(result.tanks, 2, 'player and hostile helicopter meshes should be synchronized');
assert.strictEqual(result.bullets, 1, 'AA projectile mesh should be synchronized');
assert.strictEqual(result.cameraReady, true, 'perspective camera should follow the player');
assert(result.aim && Number.isFinite(result.aim.x) && Number.isFinite(result.aim.y), 'camera ray should intersect the ground');
assert(result.aaHeight > 10, 'AA projectile should have an obvious visual arc height');
assert(result.aaTrailPoints >= 2, 'AA projectile should retain a curved flight trail');
assert.strictEqual(result.helicopterTurret, true, 'helicopter should have a visible rotating weapon turret');
assert.strictEqual(result.tankGunPitch, true, 'tank barrel should have an independent 3D elevation pivot');
assert(Math.abs(result.tankGunPitchAngle - 18 * Math.PI / 180) < 1e-9, '3D barrel pitch should mirror adjustable shell elevation');
assert.strictEqual(result.muzzleFlashVisible, true, '3D muzzle flash should appear while the flash timer is active');
assert.strictEqual(result.archedBridge, true, 'island bridge should be built from raised arch segments');
assert.strictEqual(result.fireballMeshes, 1, 'ammo-rack detonation should synchronize a 3D fireball');
assert.strictEqual(result.supplyMeshes, 1, 'air supply should be synchronized into the 3D scene');
assert.strictEqual(result.rubbleMesh, true, 'new rubble cover should be synchronized without rebuilding the whole scene');
assert.strictEqual(result.preservedObstacleMesh, true, 'unchanged obstacle meshes should be preserved during incremental terrain sync');
assert.strictEqual(result.debrisMeshes, 1, 'physical terrain debris should be synchronized into the 3D scene');
assert.strictEqual(result.rescueShieldVisible, true, 'rescue shield should be visible around the reinforced player');
assert.strictEqual(result.hiddenOutpostVisible, true, 'discovered sneak outpost should be visible in the 3D world');
assert.strictEqual(result.pointLights, 0, 'projectiles must not accumulate expensive dynamic lights');
assert(result.fixedCameraDelta < 1e-9, 'turning the tank must never rotate the world-aligned camera');
assert(result.worldAxisAlignment > 0.98, 'camera should remain aligned with map north');
assert(result.obstacleTypes.every(type => type === 'BoxGeometry'), 'all obstacle meshes should be simple boxes');
assert(result.hudChildren >= 3, `3D HUD overlays missing: ${JSON.stringify(result)}`);
assert.strictEqual(result.threatVisible, 'block', 'nearby hostile helicopter should enable the red warning border');
assert(result.visibleDepth > 600 && result.visibleDepth < 1800, '3D ground depth should stay close to the 2D tactical scale');
assert(result.visibleWidth > 800 && result.visibleWidth < 2200, '3D ground width should not reveal the whole map');
console.log('Three.js smoke test passed:', result);
