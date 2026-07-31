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
    neutralNPCs: [{
        id:'neutral-sniper-tower', type:'neutralSniperTower', name:'中立狙击塔',
        team:'neutral', x:1500, y:1200, z:0, radius:52, angle:0,
        muzzleFlashTimer:.2, currentTargetName:'测试坦克', currentTargetScore:500
    }],
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
    smokeClouds: [{ x: 1480, y: 1190, z: 0, radius: 135, life: 9, maxLife: 10 }],
    trailEffects: [],
    apsInterceptEffects: [],
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
        hp:600, maxHp:800, masteryLevel:5, masteryLevelColor:'#a768ff', masteryAuraColor:'#a000ff',
        masteryBinaryCode:true,
        shellElevation: 18, aaElevation: 30, muzzleFlashTimer:.1, muzzleFlashType:'shell',
        masteryCamouflage:true, masteryTrailColor:'#ffd85a', masteryAura:true, masteryAuraRadius:300
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
        tankType: 'heli', turretSize: 25, isPlayer: false, dead: false, isFlying: true,
        hp:450, maxHp:600, masteryLevel:2, masteryLevelColor:'#78ad57'
    });
    player.nailLocking = true;
    player.nailLockTimer = 1.5;
    player.nailTarget = enemies[0];
    player.nailLaserAngle = 0;
    player.ultimateData = { lockTime:3, range:5000 };
    apsInterceptEffects.push({
        x1:player.x, y1:player.y, z1:34,
        x2:enemies[0].x - 30, y2:enemies[0].y, z2:24,
        life:.2, maxLife:.28
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
    threeView.tankMeshes.get('player').userData.lastTankX = player.x - 2;
    trailEffects.push({
        kind:'mastery', x:1490, y:1200, z:0, radius:24, life:1, maxLife:1,
        team:'blue', owner:player, color:'#ffd85a'
    });
    const deathFlameEffect = {
        kind:'mastery-death-flame', x:1510, y:1200, z:0, radius:90, life:4, maxLife:4,
        team:'blue', owner:player, color:'#a000ff', seed:.42
    };
    trailEffects.push(deathFlameEffect);
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
    const playerHudLabel = threeView.tankLabels.get('player');
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
        smokeMeshes: threeView.smokeMeshes.size,
        rescueShieldVisible: threeView.tankMeshes.get('player').userData.rescueShield.visible,
        masteryExhaustVisible: threeView.tankMeshes.get('player').userData.masteryExhaust.visible,
        masteryAuraRadius: threeView.tankMeshes.get('player').userData.masteryAuraRing.geometry.parameters.outerRadius,
        masteryAuraColor: threeView.tankMeshes.get('player').userData.masteryAuraRing.material.color.getHexString(),
        masteryAuraLayers: {
            field:!!threeView.tankMeshes.get('player').userData.masteryAuraField,
            inner:!!threeView.tankMeshes.get('player').userData.masteryAuraInnerRing,
            nodes:threeView.tankMeshes.get('player').userData.masteryAuraNodes.children.length
        },
        binaryDigits: threeView.tankMeshes.get('player').userData.binaryCodeField.children.length,
        playerMarkerColor: threeView.tankMeshes.get('player').userData.marker.material.color.getHexString(),
        playerBeaconParts: threeView.tankMeshes.get('player').userData.playerBeacon.children.length,
        targetingLaserCount: threeView.targetingLaserMeshes.size,
        apsInterceptMeshCount: threeView.apsInterceptMeshes.size,
        nailLaserColor: threeView.targetingLaserMeshes.get('nail-player').userData.line.material.color.getHexString(),
        nailTargetRingVisible: threeView.targetingLaserMeshes.get('nail-player').userData.targetRing.visible,
        masteryTrailMeshes: threeView.trailEffectMeshes.size,
        deathFlameMesh: !!threeView.trailEffectMeshes.get(deathFlameEffect).userData.flames,
        masteryCamouflage: !!threeView.tankMeshes.get('player').userData.camouflage,
        hiddenOutpostVisible: !!threeView.hiddenOutpostMesh && threeView.hiddenOutpostMesh.visible,
        neutralSniperMesh: threeView.turretMeshes.has(neutralNPCs[0]),
        neutralSniperParts: threeView.turretMeshes.get(neutralNPCs[0]).children.length,
        pointLights,
        fixedCameraDelta: firstDirection.distanceTo(secondDirection),
        worldAxisAlignment: settledDirection.dot(expectedForward),
        obstacleTypes: obstacleMeshes.map(mesh => mesh.geometry.type),
        hudChildren: document.getElementById('threeHudLayer').children.length,
        tankLabelCount: threeView.tankLabels.size,
        playerLevelLabel: playerHudLabel.querySelector('.three-tank-level').textContent,
        playerLevelColor: playerHudLabel.querySelector('.three-tank-level').style.color,
        playerLabelClass: playerHudLabel.className,
        playerPinText: playerHudLabel.querySelector('.three-player-pin').textContent,
        playerNameText: playerHudLabel.querySelector('.three-tank-name').textContent,
        playerHpWidth: playerHudLabel.querySelector('.three-tank-hp-fill').style.width,
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
assert.strictEqual(result.smokeMeshes, 1, 'smoke grenades should synchronize a volumetric 3D cloud');
assert.strictEqual(result.rescueShieldVisible, true, 'rescue shield should be visible around the reinforced player');
assert.strictEqual(result.masteryExhaustVisible, true, 'moving mastery tanks should show a 3D exhaust flame');
assert(Math.abs(result.masteryAuraRadius - 24) < .001, '3D ace aura should use the real 300-unit radius');
assert.strictEqual(result.masteryAuraColor, 'a000ff', '3D aura should use the independent pure-purple constant');
assert.deepStrictEqual(JSON.parse(JSON.stringify(result.masteryAuraLayers)), {field:true,inner:true,nodes:12},
    '3D battle aura should include a field, inner ring, and orbiting energy nodes');
assert.strictEqual(result.binaryDigits, 10, '3D Kimi effect should contain floating binary digits');
assert.strictEqual(result.playerMarkerColor, '42efff', 'the player marker should use a unique high-visibility cyan');
assert.strictEqual(result.playerBeaconParts, 3, 'the player should have an outer ring, vertical beam, and hovering pointer');
assert.strictEqual(result.targetingLaserCount, 1, 'the 3D scene should synchronize an active lock-on laser');
assert.strictEqual(result.apsInterceptMeshCount, 1, 'APS interception should render a visible 3D counter-projectile collision');
assert.strictEqual(result.nailLaserColor, 'ff1712', 'the Nail of Judgment should use a clear red 3D targeting line');
assert.strictEqual(result.nailTargetRingVisible, true, 'the locked target should receive a pulsing 3D target ring');
assert.strictEqual(result.masteryTrailMeshes, 2, 'hot trail and death-flame zones should both be visible in 3D');
assert.strictEqual(result.deathFlameMesh, true, 'death-flame zone should use animated 3D flame meshes');
assert.strictEqual(result.masteryCamouflage, true, '3D tanks should carry visible camouflage patches');
assert.strictEqual(result.hiddenOutpostVisible, true, 'discovered sneak outpost should be visible in the 3D world');
assert.strictEqual(result.neutralSniperMesh, true, 'the neutral sniper tower should synchronize into the 3D world');
assert(result.neutralSniperParts >= 5, 'the 3D neutral sniper should include its base, energy ring, turret, gun, and lens');
assert.strictEqual(result.pointLights, 0, 'projectiles must not accumulate expensive dynamic lights');
assert(result.fixedCameraDelta < 1e-9, 'turning the tank must never rotate the world-aligned camera');
assert(result.worldAxisAlignment > 0.98, 'camera should remain aligned with map north');
assert(result.obstacleTypes.every(type => type === 'BoxGeometry'), 'all obstacle meshes should be simple boxes');
assert(result.hudChildren >= 3, `3D HUD overlays missing: ${JSON.stringify(result)}`);
assert.strictEqual(result.playerLevelLabel, '★ Lv.5', '3D HUD should show the tank mastery level above its head');
assert.strictEqual(result.playerLevelColor, '#f2f4f7', '3D level label should stay neutral; only the battle aura uses level color');
assert(result.playerLabelClass.includes('three-player-label'), 'the player HUD should receive the high-priority locator style');
assert.strictEqual(result.playerPinText, '▼ 你的位置', 'the player locator should use an explicit self-position label');
assert.strictEqual(result.playerNameText, '你 · 测试坦克', 'the player nameplate should be unmistakably self-referential');
assert.strictEqual(result.playerHpWidth, '75%', '3D HUD should synchronize the tank health bar');
assert.strictEqual(result.threatVisible, 'block', 'nearby hostile helicopter should enable the red warning border');
assert(result.visibleDepth > 600 && result.visibleDepth < 1800, '3D ground depth should stay close to the 2D tactical scale');
assert(result.visibleWidth > 800 && result.visibleWidth < 2200, '3D ground width should not reveal the whole map');
console.log('Three.js smoke test passed:', result);
