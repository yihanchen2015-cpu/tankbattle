// ==================== Three.js 真 3D 渲染 ====================
// 战场平面使用 (x, y)，实际高度使用 z；Three.js 中映射为 (x, z, y)。
const THREE_WORLD_SCALE = 0.08;
const threeView = {
    renderer: null,
    scene: null,
    camera: null,
    sun: null,
    worldRoot: null,
    dynamicRoot: null,
    modeRoot: null,
    tankMeshes: new Map(),
    bulletMeshes: new Map(),
    turretMeshes: new Map(),
    outpostMeshes: [],
    baseMeshes: [],
    flagMeshes: {},
    stormRing: null,
    snowLine: null,
    raycaster: null,
    groundPlane: null,
    initialized: false,
    worldReady: false,
    cameraReady: false,
    cameraAzimuth: null,
    lastFrame: performance.now(),
    lastSnowSync: 0,
    mapSignature: '',
    waterMaterials: [],
    tankLabels: new Map(),
    damageLabels: new Map(),
    captureLabels: new Map()
};

function initThreeRenderer() {
    if(threeView.initialized) return true;
    if(typeof THREE === 'undefined') return false;
    const targetCanvas = document.getElementById('threeCanvas');
    if(!targetCanvas) return false;
    try {
        const renderer = new THREE.WebGLRenderer({ canvas: targetCanvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, touchControlMode ? 1 : 1.25));
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        renderer.shadowMap.enabled = !touchControlMode;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        if(THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

        const scene = new THREE.Scene();
        const perspective = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.2, 800);
        scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x25351f, 1.35));
        const sun = new THREE.DirectionalLight(0xfff1d0, 2.1);
        sun.position.set(-85, 150, -65);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        sun.shadow.camera.left = -105;
        sun.shadow.camera.right = 105;
        sun.shadow.camera.top = 105;
        sun.shadow.camera.bottom = -105;
        sun.shadow.camera.near = 1;
        sun.shadow.camera.far = 420;
        scene.add(sun, sun.target);

        threeView.renderer = renderer;
        threeView.scene = scene;
        threeView.camera = perspective;
        threeView.sun = sun;
        threeView.raycaster = new THREE.Raycaster();
        threeView.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        threeView.initialized = true;
        resizeThreeRenderer();
        return true;
    } catch(error) {
        console.error('[THREE] WebGL renderer initialization failed:', error);
        return false;
    }
}

function resizeThreeRenderer() {
    if(!threeView.initialized) return;
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    threeView.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, touchControlMode ? 1 : 1.25));
    threeView.renderer.setSize(width, height, false);
    threeView.camera.aspect = width / height;
    threeView.camera.updateProjectionMatrix();
}

function threeWorldPosition(x, y, height = 0) {
    return new THREE.Vector3(
        (x - CONFIG.mapWidth / 2) * THREE_WORLD_SCALE,
        height,
        (y - CONFIG.mapHeight / 2) * THREE_WORLD_SCALE
    );
}

function setThreeWorldPosition(object, x, y, height = 0) {
    object.position.set(
        (x - CONFIG.mapWidth / 2) * THREE_WORLD_SCALE,
        height,
        (y - CONFIG.mapHeight / 2) * THREE_WORLD_SCALE
    );
    return object.position;
}

function clearThreeHudElements() {
    const layer = document.getElementById('threeHudLayer');
    if(layer && typeof layer.replaceChildren === 'function') layer.replaceChildren();
    threeView.tankLabels.clear();
    threeView.damageLabels.clear();
    threeView.captureLabels.clear();
    const warning = document.getElementById('threeThreatBorder');
    if(warning && warning.style) warning.style.display = 'none';
}

function projectThreeHudPoint(x, y, z) {
    const point = threeWorldPosition(x, y, z * THREE_WORLD_SCALE);
    point.project(threeView.camera);
    if(point.z < -1 || point.z > 1 || point.x < -1.15 || point.x > 1.15 || point.y < -1.15 || point.y > 1.15) return null;
    return {
        x: (point.x * 0.5 + 0.5) * window.innerWidth,
        y: (-point.y * 0.5 + 0.5) * window.innerHeight
    };
}

function positionThreeHudElement(element, point, opacity = 1) {
    if(!point) {
        element.style.display = 'none';
        return;
    }
    element.style.display = 'block';
    element.style.left = `${point.x}px`;
    element.style.top = `${point.y}px`;
    element.style.opacity = opacity;
}

function threeScreenToWorld(screenX, screenY) {
    if(!threeView.initialized || !threeView.cameraReady) return null;
    const targetCanvas = document.getElementById('threeCanvas');
    const rect = targetCanvas.getBoundingClientRect();
    const pointer = new THREE.Vector2(
        ((screenX / Math.max(1, rect.width)) * 2) - 1,
        -((screenY / Math.max(1, rect.height)) * 2) + 1
    );
    threeView.raycaster.setFromCamera(pointer, threeView.camera);
    const hit = new THREE.Vector3();
    if(!threeView.raycaster.ray.intersectPlane(threeView.groundPlane, hit)) return null;
    return {
        x: Math.max(0, Math.min(CONFIG.mapWidth, hit.x / THREE_WORLD_SCALE + CONFIG.mapWidth / 2)),
        y: Math.max(0, Math.min(CONFIG.mapHeight, hit.z / THREE_WORLD_SCALE + CONFIG.mapHeight / 2))
    };
}

function disposeThreeObject(object) {
    if(!object) return;
    object.traverse(child => {
        if(child.geometry) child.geometry.dispose();
        if(child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach(material => {
                if(material.map) material.map.dispose();
                material.dispose();
            });
        }
    });
    if(object.parent) object.parent.remove(object);
}

function clearThreeMap(map) {
    map.forEach(mesh => disposeThreeObject(mesh));
    map.clear();
}

function getThreeMapSignature() {
    return [currentMap, CONFIG.mapWidth, CONFIG.mapHeight, obstacles.length, terrainZones.length, outposts.length, gameConfig.dayNight].join(':');
}

function rebuildThreeWorld(force = false) {
    if(!initThreeRenderer()) return false;
    const signature = getThreeMapSignature();
    if(!force && threeView.worldReady && signature === threeView.mapSignature) return true;

    disposeThreeObject(threeView.worldRoot);
    disposeThreeObject(threeView.dynamicRoot);
    disposeThreeObject(threeView.modeRoot);
    threeView.worldRoot = new THREE.Group();
    threeView.dynamicRoot = new THREE.Group();
    threeView.modeRoot = new THREE.Group();
    threeView.scene.add(threeView.worldRoot, threeView.dynamicRoot, threeView.modeRoot);
    threeView.tankMeshes.clear();
    threeView.bulletMeshes.clear();
    threeView.turretMeshes.clear();
    threeView.outpostMeshes = [];
    threeView.baseMeshes = [];
    threeView.flagMeshes = {};
    threeView.stormRing = null;
    threeView.snowLine = null;
    threeView.waterMaterials = [];
    threeView.cameraReady = false;
    threeView.cameraAzimuth = null;
    clearThreeHudElements();

    configureThreeEnvironment();
    buildThreeGround();
    buildThreeTerrain();
    buildThreeObstacles();
    buildThreeBasesAndOutposts();
    buildThreeMapElements();
    buildThreeBoundary();
    threeView.mapSignature = signature;
    threeView.worldReady = true;
    return true;
}

function configureThreeEnvironment() {
    const night = gameConfig.dayNight === 'night';
    let sky = night ? 0x050916 : 0x99c9e8;
    if(!night && currentMap === 'desert') sky = 0xe3b66f;
    else if(!night && currentMap === 'snow') sky = 0xcfe6ef;
    else if(!night && currentMap === 'city') sky = 0x82909b;
    else if(!night && currentMap === 'island') sky = 0x75b8df;
    threeView.scene.background = new THREE.Color(sky);
    threeView.scene.fog = new THREE.Fog(sky, night ? 45 : 70, night ? 145 : 210);
}

function makeStandardMaterial(color, options = {}) {
    return new THREE.MeshStandardMaterial({
        color,
        roughness: options.roughness === undefined ? 0.76 : options.roughness,
        metalness: options.metalness || 0,
        transparent: !!options.transparent,
        opacity: options.opacity === undefined ? 1 : options.opacity,
        emissive: options.emissive || 0x000000,
        emissiveIntensity: options.emissiveIntensity || 0
    });
}

function addStaticMesh(geometry, material, position, root = threeView.worldRoot) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    root.add(mesh);
    return mesh;
}

function buildThreeGround() {
    const night = gameConfig.dayNight === 'night';
    const template = MAP_TEMPLATES[currentMap] || MAP_TEMPLATES.classic;
    let groundColor = template.groundColor || '#3d5c1e';
    if(currentMap === 'snow') groundColor = '#dbe8ec';
    if(currentMap === 'city') groundColor = '#555d61';
    if(currentMap === 'island') groundColor = '#0b6f98';
    if(night) groundColor = '#111827';
    const ground = addStaticMesh(
        new THREE.PlaneGeometry(CONFIG.mapWidth * THREE_WORLD_SCALE, CONFIG.mapHeight * THREE_WORLD_SCALE),
        makeStandardMaterial(groundColor, { roughness: currentMap === 'island' ? 0.22 : 0.92, metalness: currentMap === 'island' ? 0.12 : 0 }),
        new THREE.Vector3(0, -0.08, 0)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.castShadow = false;
    if(currentMap === 'island') threeView.waterMaterials.push(ground.material);

    if(currentMap === 'city') {
        const roadMaterial = makeStandardMaterial(0x20252a, { roughness: 0.96 });
        const stripeMaterial = makeStandardMaterial(0xd8b537, { emissive: 0x5a4100, emissiveIntensity: 0.2 });
        for(let x = 300; x < CONFIG.mapWidth; x += 600) {
            const road = addStaticMesh(new THREE.PlaneGeometry(170 * THREE_WORLD_SCALE, CONFIG.mapHeight * THREE_WORLD_SCALE), roadMaterial.clone(), threeWorldPosition(x, CONFIG.mapHeight / 2, 0.02));
            road.rotation.x = -Math.PI / 2;
            const stripe = addStaticMesh(new THREE.PlaneGeometry(4 * THREE_WORLD_SCALE, CONFIG.mapHeight * THREE_WORLD_SCALE), stripeMaterial.clone(), threeWorldPosition(x, CONFIG.mapHeight / 2, 0.035));
            stripe.rotation.x = -Math.PI / 2;
        }
        for(let y = 300; y < CONFIG.mapHeight; y += 600) {
            const road = addStaticMesh(new THREE.PlaneGeometry(CONFIG.mapWidth * THREE_WORLD_SCALE, 170 * THREE_WORLD_SCALE), roadMaterial.clone(), threeWorldPosition(CONFIG.mapWidth / 2, y, 0.021));
            road.rotation.x = -Math.PI / 2;
            const stripe = addStaticMesh(new THREE.PlaneGeometry(CONFIG.mapWidth * THREE_WORLD_SCALE, 4 * THREE_WORLD_SCALE), stripeMaterial.clone(), threeWorldPosition(CONFIG.mapWidth / 2, y, 0.036));
            stripe.rotation.x = -Math.PI / 2;
        }
    } else if(currentMap !== 'island') {
        const grid = new THREE.GridHelper(Math.max(CONFIG.mapWidth, CONFIG.mapHeight) * THREE_WORLD_SCALE, 40, 0x52614a, 0x52614a);
        grid.material.transparent = true;
        grid.material.opacity = gameConfig.dayNight === 'night' ? 0.12 : 0.18;
        grid.position.y = 0.01;
        threeView.worldRoot.add(grid);
    }
}

function buildThreeTerrain() {
    terrainZones.filter(zone => zone.type === 'land').forEach(zone => {
        const island = addStaticMesh(
            new THREE.CylinderGeometry(1, 1.06, 0.9, 64),
            makeStandardMaterial(0x719a52, { roughness: 0.93 }),
            threeWorldPosition(zone.x, zone.y, 0.37)
        );
        island.scale.set(zone.rx * THREE_WORLD_SCALE, 1, zone.ry * THREE_WORLD_SCALE);
    });
    terrainZones.filter(zone => zone.type === 'bridge').forEach(zone => {
        const bridge = addStaticMesh(
            new THREE.BoxGeometry(zone.w * THREE_WORLD_SCALE, 0.9, zone.h * THREE_WORLD_SCALE),
            makeStandardMaterial(0x805936, { roughness: 0.9 }),
            threeWorldPosition(zone.centered ? zone.x : zone.x + zone.w / 2, zone.centered ? zone.y : zone.y + zone.h / 2, 0.58)
        );
        bridge.rotation.y = -(zone.angle || 0);
    });
}

function buildThreeObstacles() {
    obstacles.forEach((obs, index) => {
        const center = threeWorldPosition(obs.x + obs.w / 2, obs.y + obs.h / 2, 0);
        const height = (typeof getObstacleWorldHeight === 'function' ? getObstacleWorldHeight(obs)
            : (obs.type === 'building' ? 52 + (obs.floors || 4) * 18 : Math.max(35, Math.min(obs.w, obs.h) * 0.58))) * THREE_WORLD_SCALE;
        const color = obs.type === 'building' ? (index % 2 ? 0x58616a : 0x6b737b)
            : (obs.type === 'tree' ? 0x2f7434 : (obs.type === 'ice' ? 0x9fc7d8 : (obs.type === 'rock' ? 0x8a633a : 0x5a4328)));
        center.y = height / 2;
        const block = addStaticMesh(
            new THREE.BoxGeometry(obs.w * THREE_WORLD_SCALE, height, obs.h * THREE_WORLD_SCALE),
            makeStandardMaterial(color, { roughness: 0.9, metalness: obs.type === 'building' ? 0.05 : 0 }), center
        );
        block.userData.isObstacle = true;
        block.castShadow = obs.type === 'building' && index % 2 === 0;
    });
}

function buildThreeBasesAndOutposts() {
    ['blue', 'red'].forEach(team => {
        const base = bases[team];
        if(!base) return;
        const color = team === 'blue' ? 0x2677d9 : 0xd93636;
        const position = threeWorldPosition(base.x + base.w / 2, base.y + base.h / 2, 2.0);
        const group = new THREE.Group();
        group.position.copy(position);
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(base.w * THREE_WORLD_SCALE * 0.55, base.w * THREE_WORLD_SCALE * 0.68, 1.4, 8), makeStandardMaterial(color, { metalness: 0.18 }));
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.3, 8, 8), makeStandardMaterial(0x3c4650, { metalness: 0.35 }));
        tower.position.y = 4.5;
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 8), makeStandardMaterial(color, { emissive: color, emissiveIntensity: 1.8 }));
        beacon.position.y = 9;
        group.add(pad, tower, beacon);
        group.traverse(child => { if(child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
        threeView.worldRoot.add(group);
        threeView.baseMeshes.push({ base, group, beacon });
    });

    outposts.forEach(op => {
        const group = new THREE.Group();
        group.position.copy(threeWorldPosition(op.x, op.y, 0.2));
        const material = makeStandardMaterial(0xbfc5cc, { emissive: 0x333333, emissiveIntensity: 0.5 });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(op.radius * THREE_WORLD_SCALE * 0.55, 0.48, 10, 48), material);
        ring.rotation.x = Math.PI / 2;
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 8, 10), makeStandardMaterial(0x8b939b, { metalness: 0.35 }));
        mast.position.y = 4;
        const orb = new THREE.Mesh(new THREE.SphereGeometry(1.1, 14, 10), material.clone());
        orb.position.y = 8.4;
        group.add(ring, mast, orb);
        group.traverse(child => { if(child.isMesh) child.castShadow = true; });
        threeView.worldRoot.add(group);
        threeView.outpostMeshes.push({ op, ring, orb });
    });
}

function buildThreeMapElements() {
    mapElements.forEach((element, index) => {
        const position = threeWorldPosition(element.x, element.y, 0.1);
        if(element.type === 'mine') {
            const mine = addStaticMesh(new THREE.CylinderGeometry(1.2, 1.35, 0.35, 16), makeStandardMaterial(0x5b2020, { emissive: 0x9f0000, emissiveIntensity: 0.7 }), position);
            mine.userData.element = element;
        } else if(element.type === 'boost') {
            const pad = addStaticMesh(new THREE.BoxGeometry((element.width || 120) * THREE_WORLD_SCALE, 0.25, (element.height || 40) * THREE_WORLD_SCALE), makeStandardMaterial(element.color || 0x00aaff, { emissive: element.color || 0x00aaff, emissiveIntensity: 1.0 }), position);
            pad.rotation.y = -(element.angle || 0);
        } else if(element.type === 'bush') {
            const bush = addStaticMesh(new THREE.IcosahedronGeometry((element.radius || 60) * THREE_WORLD_SCALE * 0.55, 1), makeStandardMaterial(0x2d5a1e, { transparent: true, opacity: 0.75 }), new THREE.Vector3(position.x, 2.0, position.z));
            bush.scale.y = 0.52;
            bush.rotation.y = index;
        }
    });
}

function buildThreeBoundary() {
    const w = CONFIG.mapWidth * THREE_WORLD_SCALE;
    const h = CONFIG.mapHeight * THREE_WORLD_SCALE;
    const material = makeStandardMaterial(0x9b2535, { emissive: 0x5a0712, emissiveIntensity: 0.8, transparent: true, opacity: 0.68 });
    const walls = [
        [0, 1.2, -h / 2, w, 2.4, 0.5], [0, 1.2, h / 2, w, 2.4, 0.5],
        [-w / 2, 1.2, 0, 0.5, 2.4, h], [w / 2, 1.2, 0, 0.5, 2.4, h]
    ];
    walls.forEach(values => addStaticMesh(new THREE.BoxGeometry(values[3], values[4], values[5]), material.clone(), new THREE.Vector3(values[0], values[1], values[2])));
}

function createThreeTank(tank) {
    const group = new THREE.Group();
    const bodyColor = new THREE.Color(tank.color || (tank.team === 'blue' ? 0x4488ff : 0xff4444));
    const accentColor = new THREE.Color(tank.accent || 0xffffff);
    if(tank.shape === 'helicopter') {
        const bodyMaterial = makeStandardMaterial(bodyColor, { metalness: 0.28, roughness: 0.44 });
        const fuselage = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), bodyMaterial);
        fuselage.scale.set(4.8, 1.65, 1.65);
        const cockpit = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), makeStandardMaterial(0x79d8ff, { metalness: 0.15, roughness: 0.18, transparent: true, opacity: 0.72 }));
        cockpit.scale.set(1.8, 1.15, 1.45);
        cockpit.position.x = 3.15;
        const tail = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.45, 0.5), bodyMaterial.clone());
        tail.position.x = -4.6;
        const rotor = new THREE.Group();
        const bladeMaterial = makeStandardMaterial(0x242a2d, { metalness: 0.4 });
        rotor.add(new THREE.Mesh(new THREE.BoxGeometry(12, 0.12, 0.28), bladeMaterial));
        rotor.add(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 12), bladeMaterial.clone()));
        rotor.position.y = 2;
        const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.6, 0.25), bladeMaterial.clone());
        tailRotor.position.set(-7.2, 0.5, 0);
        const fire = new THREE.Group();
        const outerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.2, 9), makeStandardMaterial(0xff4b16, { emissive: 0xff2200, emissiveIntensity: 2.4 }));
        const innerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.2, 8), makeStandardMaterial(0xffdd42, { emissive: 0xff8a00, emissiveIntensity: 2.8 }));
        outerFlame.rotation.z = Math.PI / 2;
        innerFlame.rotation.z = Math.PI / 2;
        fire.position.set(-4.6, 1.0, 0);
        fire.add(outerFlame, innerFlame);
        fire.visible = false;
        group.add(fuselage, cockpit, tail, rotor, tailRotor, fire);
        group.userData.rotor = rotor;
        group.userData.fire = fire;
    } else {
        const bodyMaterial = makeStandardMaterial(bodyColor, { metalness: 0.3, roughness: 0.55 });
        const trackMaterial = makeStandardMaterial(0x171a1c, { metalness: 0.22, roughness: 0.8 });
        const hullLength = tank.shape === 'heavy' ? 6.8 : (tank.shape === 'light' ? 5.4 : 6.1);
        const hullWidth = tank.shape === 'heavy' ? 4.5 : 3.8;
        const leftTrack = new THREE.Mesh(new THREE.BoxGeometry(hullLength + 0.5, 1.0, 0.85), trackMaterial);
        const rightTrack = leftTrack.clone();
        leftTrack.position.set(0, 0.65, -hullWidth / 2);
        rightTrack.position.set(0, 0.65, hullWidth / 2);
        const hull = new THREE.Mesh(new THREE.BoxGeometry(hullLength, 1.35, hullWidth), bodyMaterial);
        hull.position.y = 1.25;
        const upperHull = new THREE.Mesh(new THREE.BoxGeometry(hullLength * 0.72, 0.72, hullWidth * 0.78), makeStandardMaterial(bodyColor.clone().offsetHSL(0, 0, 0.08), { metalness: 0.34, roughness: 0.48 }));
        upperHull.position.set(0.25, 2.08, 0);
        const turretPivot = new THREE.Group();
        turretPivot.position.y = 2.25;
        const turret = new THREE.Mesh(new THREE.CylinderGeometry(1.38, 1.72, 1.05, 8), makeStandardMaterial(accentColor, { metalness: 0.38, roughness: 0.42 }));
        const barrelLength = Math.max(3.8, (tank.turretSize || 28) * THREE_WORLD_SCALE + 2.2);
        const barrel = new THREE.Mesh(new THREE.BoxGeometry(barrelLength, 0.38, 0.42), makeStandardMaterial(0x30383d, { metalness: 0.48 }));
        barrel.position.set(barrelLength / 2 + 0.65, 0.18, 0);
        const muzzleBrake = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.62, 0.72), makeStandardMaterial(0x171c20, { metalness: 0.58, roughness: 0.38 }));
        muzzleBrake.position.set(barrelLength + 0.75, 0.18, 0);
        const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.25, 10), makeStandardMaterial(0x22292d, { metalness: 0.4 }));
        hatch.position.set(-0.25, 0.67, 0);
        turretPivot.add(turret, barrel, muzzleBrake, hatch);
        group.add(leftTrack, rightTrack, hull, upperHull, turretPivot);
        group.userData.turretPivot = turretPivot;
        const wash = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.35, 32), makeStandardMaterial(0x218fc0, { transparent: true, opacity: 0.58, roughness: 0.2 }));
        wash.position.y = 1.25;
        wash.visible = false;
        group.add(wash);
        group.userData.waterWash = wash;
    }
    const markerMaterial = new THREE.MeshBasicMaterial({ color: tank.isPlayer ? 0xffffff : (tank.team === 'blue' ? 0x36a0ff : 0xff3838), transparent: true, opacity: tank.isPlayer ? 0.85 : 0.35, side: THREE.DoubleSide });
    const marker = new THREE.Mesh(new THREE.RingGeometry(3.9, 4.35, 32), markerMaterial);
    marker.rotation.x = -Math.PI / 2;
    marker.position.y = 0.08;
    group.add(marker);
    group.traverse(child => {
        if(!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;
        child.userData.baseOpacity = child.material.opacity;
    });
    threeView.dynamicRoot.add(group);
    return group;
}

function syncThreeTanks(now) {
    const living = [player, ...allies, ...enemies].filter(tank => tank && !tank.dead);
    const activeIds = new Set();
    living.forEach(tank => {
        activeIds.add(tank.id);
        let mesh = threeView.tankMeshes.get(tank.id);
        if(!mesh) {
            mesh = createThreeTank(tank);
            threeView.tankMeshes.set(tank.id, mesh);
        }
        const flying = tank.shape === 'helicopter';
        const inWater = !flying && typeof isTankInWater === 'function' && isTankInWater(tank);
        const storedHeight = (tank.z || 0) * THREE_WORLD_SCALE;
        const baseHeight = storedHeight + (flying ? Math.sin(now * 0.003 + tank.x) * 0.55 : (inWater ? 0.15 : 0.08));
        setThreeWorldPosition(mesh, tank.x, tank.y, baseHeight);
        mesh.rotation.y = -tank.angle;
        if(mesh.userData.turretPivot) mesh.userData.turretPivot.rotation.y = -(tank.turretAngle - tank.angle);
        if(mesh.userData.rotor) mesh.userData.rotor.rotation.y = now * 0.022;
        if(mesh.userData.fire) {
            mesh.userData.fire.visible = !!tank.helicopterOnFire;
            if(tank.helicopterOnFire) {
                const flicker = 0.82 + Math.sin(now * 0.032 + tank.x) * 0.22;
                mesh.userData.fire.scale.set(flicker, 0.85 + Math.random() * 0.3, flicker);
            }
        }
        if(mesh.userData.waterWash) mesh.userData.waterWash.visible = inWater;
        const opacity = tank.ghostActive && !tank.ghostRevealed ? 0.28 : 1;
        if(mesh.userData.lastOpacity !== opacity) {
            mesh.userData.lastOpacity = opacity;
            mesh.traverse(child => {
                if(!child.isMesh || child === mesh.userData.waterWash) return;
                const baseOpacity = child.userData.baseOpacity === undefined ? 1 : child.userData.baseOpacity;
                child.material.transparent = baseOpacity < 1 || opacity < 1;
                child.material.opacity = baseOpacity * opacity;
            });
        }
    });
    for(const [id, mesh] of threeView.tankMeshes) {
        if(!activeIds.has(id)) {
            disposeThreeObject(mesh);
            threeView.tankMeshes.delete(id);
        }
    }
}

function createThreeBullet(bullet) {
    const color = bullet.type === 'aa' ? 0xff45ff : (bullet.type === 'shell' ? 0xff9a20 : 0xffef65);
    const radius = bullet.type === 'aa' ? 0.62 : (bullet.type === 'shell' ? 0.48 : 0.22);
    const material = makeStandardMaterial(color, { emissive: color, emissiveIntensity: bullet.type === 'mg' ? 1.2 : 2.4, roughness: 0.25 });
    const group = new THREE.Group();
    const projectile = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 8), material);
    group.add(projectile);
    group.userData.projectile = projectile;
    if(bullet.type === 'aa') {
        const trailGeometry = new THREE.BufferGeometry();
        const trailPositions = new Float32Array(16 * 3);
        const trailAttribute = new THREE.BufferAttribute(trailPositions, 3);
        trailAttribute.setUsage(THREE.DynamicDrawUsage);
        trailGeometry.setAttribute('position', trailAttribute);
        trailGeometry.setDrawRange(0, 0);
        const trail = new THREE.Line(
            trailGeometry,
            new THREE.LineBasicMaterial({ color: 0xff72ff, transparent: true, opacity: 0.82, depthWrite: false })
        );
        group.add(trail);
        group.userData.trail = trail;
        group.userData.trailPoints = [];
        group.userData.lastTrailAge = -1;
    }
    threeView.dynamicRoot.add(group);
    return group;
}

function syncThreeBullets() {
    const active = new Set(bullets);
    bullets.forEach(bullet => {
        let mesh = threeView.bulletMeshes.get(bullet);
        if(!mesh) {
            mesh = createThreeBullet(bullet);
            threeView.bulletMeshes.set(bullet, mesh);
        }
        let height = Number.isFinite(bullet.z) ? bullet.z * THREE_WORLD_SCALE
            : (bullet.owner && bullet.owner.isFlying ? (bullet.owner.z || CONFIG.helicopterAltitude) * THREE_WORLD_SCALE : 2.2);
        if(bullet.isRocket && !Number.isFinite(bullet.z)) height = 4.2;
        const projectile = mesh.userData.projectile;
        setThreeWorldPosition(projectile, bullet.x, bullet.y, height);
        const angle = Math.atan2(bullet.vy || 0, bullet.vx || 1);
        projectile.rotation.y = -angle;
        const pulse = bullet.type === 'aa' ? 1 + Math.sin((bullet.age || 0) * 25) * 0.18 : 1;
        projectile.scale.setScalar(pulse);
        if(bullet.type === 'aa' && (bullet.age || 0) - mesh.userData.lastTrailAge >= 0.035) {
            mesh.userData.lastTrailAge = bullet.age || 0;
            const points = mesh.userData.trailPoints;
            points.push(projectile.position.clone());
            if(points.length > 16) points.shift();
            const attribute = mesh.userData.trail.geometry.getAttribute('position');
            points.forEach((point, index) => attribute.setXYZ(index, point.x, point.y, point.z));
            attribute.needsUpdate = true;
            mesh.userData.trail.geometry.setDrawRange(0, points.length);
        }
    });
    for(const [bullet, mesh] of threeView.bulletMeshes) {
        if(!active.has(bullet)) {
            disposeThreeObject(mesh);
            threeView.bulletMeshes.delete(bullet);
        }
    }
}

function createThreeTurret(element) {
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.1, 1.1, 10), makeStandardMaterial(0x4c5358, { metalness: 0.35 }));
    const gun = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.45, 0.55), makeStandardMaterial(0xff6633, { emissive: 0x7a1f00, emissiveIntensity: 0.7 }));
    gun.position.set(2.1, 1.0, 0);
    group.add(base, gun);
    group.position.copy(threeWorldPosition(element.x, element.y, 0.6));
    group.rotation.y = -(element.angle || 0);
    threeView.dynamicRoot.add(group);
    return group;
}

function syncThreeTurrets() {
    const active = new Set(mapElements.filter(element => element.type === 'turret'));
    active.forEach(element => {
        let mesh = threeView.turretMeshes.get(element);
        if(!mesh) {
            mesh = createThreeTurret(element);
            threeView.turretMeshes.set(element, mesh);
        }
        setThreeWorldPosition(mesh, element.x, element.y, 0.6);
        mesh.rotation.y = -(element.angle || 0);
    });
    for(const [element, mesh] of threeView.turretMeshes) {
        if(!active.has(element)) {
            disposeThreeObject(mesh);
            threeView.turretMeshes.delete(element);
        }
    }
}

function syncThreeSnowTracks(now) {
    if(currentMap !== 'snow') {
        if(threeView.snowLine) threeView.snowLine.visible = false;
        return;
    }
    if(now - threeView.lastSnowSync < 100) return;
    threeView.lastSnowSync = now;
    if(!threeView.snowLine) {
        const geometry = new THREE.BufferGeometry();
        const attribute = new THREE.BufferAttribute(new Float32Array(220 * 4 * 3), 3);
        attribute.setUsage(THREE.DynamicDrawUsage);
        geometry.setAttribute('position', attribute);
        geometry.setDrawRange(0, 0);
        const material = new THREE.LineBasicMaterial({ color: 0x4b5c64, transparent: true, opacity: 0.42 });
        threeView.snowLine = new THREE.LineSegments(geometry, material);
        threeView.dynamicRoot.add(threeView.snowLine);
    }
    const attribute = threeView.snowLine.geometry.getAttribute('position');
    let vertexIndex = 0;
    snowTracks.slice(-220).forEach(track => {
        const dx = Math.cos(track.angle) * 11;
        const dy = Math.sin(track.angle) * 11;
        [[track.x1 - dx, track.y1 - dy, track.x1 + dx, track.y1 + dy], [track.x2 - dx, track.y2 - dy, track.x2 + dx, track.y2 + dy]].forEach(line => {
            const a = threeWorldPosition(line[0], line[1], 0.04);
            const b = threeWorldPosition(line[2], line[3], 0.04);
            attribute.setXYZ(vertexIndex++, a.x, a.y, a.z);
            attribute.setXYZ(vertexIndex++, b.x, b.y, b.z);
        });
    });
    threeView.snowLine.visible = true;
    attribute.needsUpdate = true;
    threeView.snowLine.geometry.setDrawRange(0, vertexIndex);
    threeView.snowLine.frustumCulled = false;
}

function syncThreeOwnership(now) {
    threeView.outpostMeshes.forEach(entry => {
        const owner = entry.op.owner;
        const color = owner === 'blue' ? 0x238bff : (owner === 'red' ? 0xff3434 : 0xc4c8cc);
        entry.ring.material.color.setHex(color);
        entry.ring.material.emissive.setHex(color);
        entry.ring.material.emissiveIntensity = owner ? 0.9 : 0.25;
        entry.orb.material.color.setHex(color);
        entry.orb.material.emissive.setHex(color);
        entry.orb.material.emissiveIntensity = 1.2 + Math.sin(now * 0.004) * 0.35;
    });
    threeView.baseMeshes.forEach(entry => {
        const ratio = Math.max(0, entry.base.hp / entry.base.maxHp);
        entry.beacon.scale.setScalar(0.55 + ratio * 0.45);
        entry.beacon.material.emissiveIntensity = 0.4 + ratio * 1.5;
    });
}

function syncThreeGameModes(now) {
    if(gameMode === 'storm' && stormData.safeZone && stormData.safeZone.radius > 0) {
        if(!threeView.stormRing) {
            const material = new THREE.MeshBasicMaterial({ color: 0x00e2b6, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false });
            threeView.stormRing = new THREE.Mesh(new THREE.RingGeometry(0.975, 1.025, 128), material);
            threeView.stormRing.rotation.x = -Math.PI / 2;
            threeView.modeRoot.add(threeView.stormRing);
        }
        const ringPosition = threeWorldPosition(stormData.safeZone.x, stormData.safeZone.y, 0.22);
        const radius = stormData.safeZone.radius * THREE_WORLD_SCALE;
        threeView.stormRing.position.copy(ringPosition);
        threeView.stormRing.scale.set(radius, radius, radius);
        threeView.stormRing.material.opacity = 0.55 + Math.sin(now * 0.006) * 0.18;
        threeView.stormRing.visible = true;
    } else if(threeView.stormRing) threeView.stormRing.visible = false;

    if(gameMode === 'ctf') {
        ['blue', 'red'].forEach(team => {
            const flag = ctfFlags[team];
            if(!flag) return;
            let group = threeView.flagMeshes[team];
            if(!group) {
                group = new THREE.Group();
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 6, 8), makeStandardMaterial(0x949b9f, { metalness: 0.5 }));
                pole.position.y = 3;
                const cloth = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 2), new THREE.MeshBasicMaterial({ color: team === 'blue' ? 0x168cff : 0xff3030, side: THREE.DoubleSide }));
                cloth.position.set(1.75, 5, 0);
                group.add(pole, cloth);
                threeView.modeRoot.add(group);
                threeView.flagMeshes[team] = group;
            }
            group.position.copy(threeWorldPosition(flag.x, flag.y, 0.1));
            group.rotation.y = Math.sin(now * 0.0015) * 0.12;
            group.visible = true;
        });
    } else {
        Object.values(threeView.flagMeshes).forEach(group => group.visible = false);
    }
}

function updateThreeEnvironment(now) {
    if(currentMap === 'desert' && environmentState.sandstormActive) {
        threeView.scene.background.setHex(0x9b652d);
        threeView.scene.fog.color.setHex(0x9b652d);
        threeView.scene.fog.near = player && player.isFlying ? 16 : 22;
        threeView.scene.fog.far = player && player.isFlying ? 90 : 125;
    } else {
        const night = gameConfig.dayNight === 'night';
        let sky = night ? 0x050916 : (currentMap === 'desert' ? 0xe3b66f : (currentMap === 'snow' ? 0xcfe6ef : (currentMap === 'city' ? 0x82909b : (currentMap === 'island' ? 0x75b8df : 0x99c9e8))));
        threeView.scene.background.setHex(sky);
        threeView.scene.fog.color.setHex(sky);
        threeView.scene.fog.near = night ? 45 : 70;
        threeView.scene.fog.far = night ? 145 : 210;
    }
    threeView.waterMaterials.forEach(material => {
        material.roughness = 0.18 + Math.sin(now * 0.0018) * 0.04;
    });
}

function updateThreeCamera(dt) {
    if(!player) return;
    const center = threeWorldPosition(player.x, player.y, 0);
    if(threeView.sun) {
        threeView.sun.position.set(center.x - 85, 150, center.z - 65);
        threeView.sun.target.position.set(center.x, 0, center.z);
        threeView.sun.target.updateMatrixWorld();
    }
    // 锁定世界方向：镜头始终从地图南侧朝北看，W/S/A/D 与屏幕上下左右恒定。
    // 坦克转弯只改车身方向，摄像机只平移跟随，绝不旋转。
    const zoomFactor = Math.max(0.75, camera.zoom || 1);
    const distance = (player.isFlying ? 440 : 390) * THREE_WORLD_SCALE / zoomFactor;
    const height = (player.isFlying ? 540 : 480) * THREE_WORLD_SCALE / zoomFactor;
    const azimuth = -Math.PI / 2;
    threeView.cameraAzimuth = azimuth;
    const vehicleHeight = (player.z || 0) * THREE_WORLD_SCALE;
    const desired = new THREE.Vector3(
        center.x - Math.cos(azimuth) * distance,
        vehicleHeight + height,
        center.z - Math.sin(azimuth) * distance
    );
    if(typeof getScreenShakeOffset === 'function') {
        const shake = getScreenShakeOffset(THREE_WORLD_SCALE * 0.75);
        desired.x += shake.x;
        desired.y += shake.y * 0.45;
    }
    const lookAhead = (player.isFlying ? 150 : 125) * THREE_WORLD_SCALE;
    const target = new THREE.Vector3(
        center.x + Math.cos(azimuth) * lookAhead,
        vehicleHeight + (player.isFlying ? 1.2 : 1.6),
        center.z + Math.sin(azimuth) * lookAhead
    );
    if(!threeView.cameraReady) {
        threeView.camera.position.copy(desired);
        threeView.cameraReady = true;
    } else {
        const smoothing = 1 - Math.pow(0.002, Math.min(0.05, dt));
        threeView.camera.position.lerp(desired, smoothing);
    }
    threeView.camera.lookAt(target);
}

function syncThreeHud() {
    const layer = document.getElementById('threeHudLayer');
    if(!layer || typeof document.createElement !== 'function') return;

    const livingTanks = [player, ...allies, ...enemies].filter(tank => tank && !tank.dead);
    const livingIds = new Set(livingTanks.map(tank => tank.id));
    livingTanks.forEach(tank => {
        let label = threeView.tankLabels.get(tank.id);
        if(!label) {
            label = document.createElement('div');
            label.className = 'three-tank-label';
            layer.appendChild(label);
            threeView.tankLabels.set(tank.id, label);
        }
        const tankData = TANKS[tank.tankType];
        label.textContent = tankData ? tankData.name : tank.tankType;
        label.style.color = tank.team === 'blue' ? '#55a7ff' : '#ff5555';
        const hiddenGhost = tank.team !== player.team && tank.ghostActive && !tank.ghostRevealed;
        const point = hiddenGhost ? null : projectThreeHudPoint(tank.x, tank.y, (tank.z || 0) + (tank.isFlying ? 76 : 68));
        positionThreeHudElement(label, point, tank === player ? 1 : 0.9);
    });
    for(const [id, label] of threeView.tankLabels) {
        if(!livingIds.has(id)) {
            label.remove();
            threeView.tankLabels.delete(id);
        }
    }

    const activeDamage = new Set(damageNumbers);
    damageNumbers.forEach(number => {
        let label = threeView.damageLabels.get(number);
        if(!label) {
            label = document.createElement('div');
            label.className = 'three-damage-label';
            layer.appendChild(label);
            threeView.damageLabels.set(number, label);
        }
        label.textContent = number.text;
        positionThreeHudElement(label, projectThreeHudPoint(number.x, number.y, number.z || 42), Math.max(0, number.life / number.maxLife));
    });
    for(const [number, label] of threeView.damageLabels) {
        if(!activeDamage.has(number)) {
            label.remove();
            threeView.damageLabels.delete(number);
        }
    }

    const activeCaptures = new Set(outposts.filter(op => op.captureProgress > 0 && op.captureProgress < CONFIG.outpostCaptureTime));
    activeCaptures.forEach(op => {
        let label = threeView.captureLabels.get(op);
        if(!label) {
            label = document.createElement('div');
            label.className = 'three-capture-label';
            label.innerHTML = '<span></span><div class="three-capture-track"><div class="three-capture-fill"></div></div>';
            layer.appendChild(label);
            threeView.captureLabels.set(op, label);
        }
        const percent = Math.max(0, Math.min(100, op.captureProgress / CONFIG.outpostCaptureTime * 100));
        label.querySelector('span').textContent = `据点 ${op.name} ${Math.floor(percent)}%`;
        const fill = label.querySelector('.three-capture-fill');
        fill.style.width = `${percent}%`;
        fill.style.background = op.capturingTeam === 'blue' ? '#4488ff' : '#ff4444';
        positionThreeHudElement(label, projectThreeHudPoint(op.x, op.y, 38));
    });
    for(const [op, label] of threeView.captureLabels) {
        if(!activeCaptures.has(op)) {
            label.remove();
            threeView.captureLabels.delete(op);
        }
    }

    const hostileHelicopters = livingTanks.filter(tank => tank.team !== player.team && tank.isFlying);
    let nearestHelicopter = null;
    let nearestDistance = 1800;
    hostileHelicopters.forEach(tank => {
        const distance = Math.hypot(tank.x - player.x, tank.y - player.y);
        if(distance < nearestDistance) {
            nearestDistance = distance;
            nearestHelicopter = tank;
        }
    });
    const warning = document.getElementById('threeThreatBorder');
    if(warning) {
        warning.style.display = nearestHelicopter ? 'block' : 'none';
        const text = warning.querySelector('span');
        if(text && nearestHelicopter) text.textContent = `⚠ 敌方直升机来袭 · ${Math.round(nearestDistance)}m`;
    }
    if(nearestHelicopter && typeof playWorldSound === 'function') {
        playWorldSound('heliWarning', nearestHelicopter.x, nearestHelicopter.y, 1);
    }
}

function renderThreeScene() {
    if(!initThreeRenderer()) return;
    if(!threeView.worldReady || threeView.mapSignature !== getThreeMapSignature()) rebuildThreeWorld(true);
    const now = performance.now();
    const dt = Math.min(0.05, Math.max(0.001, (now - threeView.lastFrame) / 1000));
    threeView.lastFrame = now;
    syncThreeTanks(now);
    syncThreeBullets();
    syncThreeTurrets();
    syncThreeSnowTracks(now);
    syncThreeOwnership(now);
    syncThreeGameModes(now);
    updateThreeEnvironment(now);
    updateThreeCamera(dt);
    threeView.renderer.render(threeView.scene, threeView.camera);
    syncThreeHud();
}
