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
    supplyMeshes: new Map(),
    fireballMeshes: new Map(),
    obstacleMeshes: new Map(),
    debrisMeshes: new Map(),
    mechanicMeshes: new Map(),
    outpostMeshes: [],
    baseMeshes: [],
    flagMeshes: {},
    stormRing: null,
    hiddenOutpostMesh: null,
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
    lastTerrainRevision: -1,
    waterMaterials: [],
    lavaMeshes: [],
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
    const generation = typeof terrainGeneration !== 'undefined' ? terrainGeneration : obstacles.length;
    return [currentMap, CONFIG.mapWidth, CONFIG.mapHeight, generation, terrainZones.length, outposts.length, gameConfig.dayNight].join(':');
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
    threeView.supplyMeshes.clear();
    threeView.fireballMeshes.clear();
    threeView.obstacleMeshes.clear();
    threeView.debrisMeshes.clear();
    threeView.mechanicMeshes.clear();
    threeView.outpostMeshes = [];
    threeView.baseMeshes = [];
    threeView.flagMeshes = {};
    threeView.stormRing = null;
    threeView.hiddenOutpostMesh = null;
    threeView.snowLine = null;
    threeView.waterMaterials = [];
    threeView.lavaMeshes = [];
    threeView.lastTerrainRevision = -1;
    threeView.cameraReady = false;
    threeView.cameraAzimuth = null;
    clearThreeHudElements();

    configureThreeEnvironment();
    buildThreeGround();
    buildThreeTerrain();
    buildThreeObstacles();
    buildThreeBasesAndOutposts();
    buildThreeMapElements();
    if(typeof buildThreeMapMechanics === 'function') buildThreeMapMechanics();
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
    else if(currentMap === 'volcano') sky = night ? 0x180405 : 0x5d211b;
    else if(currentMap === 'factory') sky = night ? 0x111416 : 0x252a2d;
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

function getFactorySlabOpenings(zone) {
    if(currentMap!=='factory'||zone.type!=='factoryFloorSlab'||zone.z<=0||
        zone.z>=getFactoryFloorZ(3)||!mapMechanicsState.factory)return [];
    const openings=mapMechanicsState.factory.elevators.map(elevator=>({
        x:elevator.x,y:elevator.y,w:elevator.w,h:elevator.h
    }));
    mapMechanicsState.factory.ramps.forEach(ramp=>{
        if(Math.abs(ramp.toZ-zone.z)>1)return;
        const portion=.3;
        if(ramp.axis==='x'){
            openings.push(ramp.reverse
                ? {x:ramp.x,y:ramp.y,w:ramp.w*portion,h:ramp.h}
                : {x:ramp.x+ramp.w*(1-portion),y:ramp.y,w:ramp.w*portion,h:ramp.h});
        }else{
            openings.push(ramp.reverse
                ? {x:ramp.x,y:ramp.y,w:ramp.w,h:ramp.h*portion}
                : {x:ramp.x,y:ramp.y+ramp.h*(1-portion),w:ramp.w,h:ramp.h*portion});
        }
    });
    return openings;
}

function splitFactorySlabAroundOpenings(zone,openings) {
    let pieces=[{x:zone.x,y:zone.y,w:zone.w,h:zone.h}];
    openings.forEach(hole=>{
        const next=[];
        pieces.forEach(piece=>{
            const left=Math.max(piece.x,hole.x),right=Math.min(piece.x+piece.w,hole.x+hole.w);
            const top=Math.max(piece.y,hole.y),bottom=Math.min(piece.y+piece.h,hole.y+hole.h);
            if(right<=left||bottom<=top){next.push(piece);return;}
            if(top>piece.y)next.push({x:piece.x,y:piece.y,w:piece.w,h:top-piece.y});
            if(bottom<piece.y+piece.h)next.push({x:piece.x,y:bottom,w:piece.w,h:piece.y+piece.h-bottom});
            if(left>piece.x)next.push({x:piece.x,y:top,w:left-piece.x,h:bottom-top});
            if(right<piece.x+piece.w)next.push({x:right,y:top,w:piece.x+piece.w-right,h:bottom-top});
        });
        pieces=next;
    });
    return pieces.filter(piece=>piece.w>1&&piece.h>1);
}

function buildThreeGround() {
    const night = gameConfig.dayNight === 'night';
    const template = MAP_TEMPLATES[currentMap] || MAP_TEMPLATES.classic;
    let groundColor = template.groundColor || '#3d5c1e';
    if(currentMap === 'snow') groundColor = '#dbe8ec';
    if(currentMap === 'city') groundColor = '#555d61';
    if(currentMap === 'island') groundColor = '#0b6f98';
    if(currentMap === 'volcano') groundColor = '#292625';
    if(currentMap === 'factory') groundColor = '#44474a';
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
    } else if(currentMap !== 'island' && currentMap !== 'factory') {
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
        const bridge = new THREE.Group();
        bridge.position.copy(threeWorldPosition(zone.centered ? zone.x : zone.x + zone.w / 2, zone.centered ? zone.y : zone.y + zone.h / 2, 0));
        bridge.rotation.y = -(zone.angle || 0);
        const segments = 18;
        const segmentLength = zone.w * THREE_WORLD_SCALE / segments;
        const deckWidth = zone.h * THREE_WORLD_SCALE;
        const material = makeStandardMaterial(0x805936, { roughness: 0.9 });
        for(let i = 0; i < segments; i++) {
            const localX = -zone.w / 2 + zone.w * (i + .5) / segments;
            const normalized = Math.min(1, Math.abs(localX) / (zone.w / 2));
            const height = (zone.archHeight || 72) * (1 - normalized * normalized);
            const nextX = Math.min(zone.w / 2, localX + zone.w / segments * .5);
            const prevX = Math.max(-zone.w / 2, localX - zone.w / segments * .5);
            const curve = x => (zone.archHeight || 72) * (1 - Math.min(1, Math.abs(x) / (zone.w / 2)) ** 2);
            const slope = Math.atan2((curve(nextX) - curve(prevX)) * THREE_WORLD_SCALE, segmentLength);
            const deck = new THREE.Mesh(new THREE.BoxGeometry(segmentLength * 1.06, (zone.deckThickness || 18) * THREE_WORLD_SCALE, deckWidth), material.clone());
            deck.position.set(localX * THREE_WORLD_SCALE, height * THREE_WORLD_SCALE, 0);
            deck.rotation.z = slope;
            deck.receiveShadow = true; deck.castShadow = true;
            bridge.add(deck);
        }
        threeView.worldRoot.add(bridge);
    });

    terrainZones.filter(zone => zone.type === 'lava' && zone.points).forEach(zone => {
        for(let i = 0; i < zone.points.length - 1; i++) {
            const a = typeof getLavaPoint === 'function' ? getLavaPoint(zone.points[i], i) : zone.points[i];
            const b = typeof getLavaPoint === 'function' ? getLavaPoint(zone.points[i + 1], i + 1) : zone.points[i + 1];
            const length = Math.hypot(b.x - a.x, b.y - a.y);
            const width = (a.width + b.width) * .5;
            const material = makeStandardMaterial(0xff3d0b, {roughness:.32, emissive:0xff2200, emissiveIntensity:2.4});
            const river = addStaticMesh(new THREE.PlaneGeometry(length * THREE_WORLD_SCALE, width * THREE_WORLD_SCALE), material, threeWorldPosition((a.x + b.x) / 2, (a.y + b.y) / 2, .08));
            river.rotation.x = -Math.PI / 2;
            river.rotation.y = -Math.atan2(b.y - a.y, b.x - a.x);
            threeView.waterMaterials.push(material);
            threeView.lavaMeshes.push({mesh:river, index:i, baseLength:length, baseWidth:width, zone});
        }
    });

    terrainZones.filter(zone => zone.type === 'crystal').forEach(zone => {
        const pad = addStaticMesh(new THREE.BoxGeometry(zone.w * THREE_WORLD_SCALE, .22, zone.h * THREE_WORLD_SCALE), makeStandardMaterial(0x4b8989, {emissive:0x164f54, emissiveIntensity:.65, transparent:true, opacity:.72}), threeWorldPosition(zone.x + zone.w / 2, zone.y + zone.h / 2, .08));
        for(let i = 0; i < 10; i++) {
            const crystal = new THREE.Mesh(new THREE.ConeGeometry(.42 + (i % 3) * .18, 2.5 + (i % 4), 5), makeStandardMaterial(i % 2 ? 0x8ee9df : 0x4bb7b6, {emissive:0x1d7774, emissiveIntensity:.8}));
            crystal.position.set(((i * 1.71) % (zone.w * THREE_WORLD_SCALE - 2)) - zone.w * THREE_WORLD_SCALE / 2 + 1, 1.2, ((i * 2.37) % (zone.h * THREE_WORLD_SCALE - 2)) - zone.h * THREE_WORLD_SCALE / 2 + 1);
            pad.add(crystal);
        }
    });

    terrainZones.filter(zone => zone.type === 'factoryRamp').forEach(zone => {
        const length = (zone.axis === 'y' ? zone.h : zone.w) * THREE_WORLD_SCALE;
        const width = (zone.axis === 'y' ? zone.w : zone.h) * THREE_WORLD_SCALE;
        const rise = (zone.toZ - zone.fromZ) * THREE_WORLD_SCALE;
        const rampLength = Math.hypot(length, rise);
        const deckThickness=(zone.deckThickness||18)*THREE_WORLD_SCALE;
        const railHeight=(zone.guardrailHeight||64)*THREE_WORLD_SCALE;
        const railWidth=(zone.guardrailWidth||14)*THREE_WORLD_SCALE;
        const slope = Math.atan2(rise, length) * (zone.reverse ? -1 : 1);
        const ramp=new THREE.Group();
        ramp.position.copy(threeWorldPosition(zone.x+zone.w/2,zone.y+zone.h/2,(zone.fromZ+zone.toZ)*.5*THREE_WORLD_SCALE));
        if(zone.axis==='y')ramp.rotation.x=-slope;
        else ramp.rotation.z=slope;
        const deck=new THREE.Mesh(
            new THREE.BoxGeometry(zone.axis==='y'?width:rampLength,deckThickness,zone.axis==='y'?rampLength:width),
            makeStandardMaterial(0x6a6f72,{roughness:.78,metalness:.22})
        );
        deck.position.y=-deckThickness/2;
        deck.receiveShadow=true;
        const railMaterial=makeStandardMaterial(0x30363a,{roughness:.72,metalness:.58});
        [-1,1].forEach(side=>{
            const rail=new THREE.Mesh(
                new THREE.BoxGeometry(zone.axis==='y'?railWidth:rampLength,railHeight,zone.axis==='y'?rampLength:railWidth),
                railMaterial.clone()
            );
            rail.position.y=railHeight/2;
            if(zone.axis==='y')rail.position.x=side*(width/2-railWidth/2);
            else rail.position.z=side*(width/2-railWidth/2);
            rail.castShadow=true;
            ramp.add(rail);
        });
        ramp.add(deck);
        threeView.worldRoot.add(ramp);
    });
    terrainZones.filter(zone => zone.type === 'factoryFloorSlab' || zone.type === 'factoryCeilingSlab').forEach(zone => {
        const colors = [0x34383b,0x4a4e51,0x555a5e];
        const color=zone.type==='factoryCeilingSlab'?0x6b7276:(colors[zone.factoryFloor]||0x44484b);
        splitFactorySlabAroundOpenings(zone,getFactorySlabOpenings(zone)).forEach(piece=>{
            const slab=addStaticMesh(
                new THREE.BoxGeometry(piece.w*THREE_WORLD_SCALE,1.2,piece.h*THREE_WORLD_SCALE),
                makeStandardMaterial(color,{roughness:.88}),
                threeWorldPosition(piece.x+piece.w/2,piece.y+piece.h/2,zone.z*THREE_WORLD_SCALE)
            );
            slab.position.y-=.62;
            slab.userData.factoryStructure=true;
            slab.userData.factorySlabZ=zone.z;
            slab.userData.factoryCeiling=zone.type==='factoryCeilingSlab';
        });
    });
    terrainZones.filter(zone => zone.type === 'conveyor').forEach(zone => {
        const belt=addStaticMesh(new THREE.BoxGeometry(zone.w*THREE_WORLD_SCALE,.35,zone.h*THREE_WORLD_SCALE),makeStandardMaterial(0x24282a,{metalness:.28,roughness:.65}),threeWorldPosition(zone.x+zone.w/2,zone.y+zone.h/2,(getFactoryFloorZ(zone.factoryFloor)+2)*THREE_WORLD_SCALE));
        belt.userData.factoryFloor=zone.factoryFloor;
        const stripe=new THREE.Mesh(new THREE.BoxGeometry((Math.abs(zone.dirX)>0?zone.w*.75:18)*THREE_WORLD_SCALE,.08,(Math.abs(zone.dirY)>0?zone.h*.75:18)*THREE_WORLD_SCALE),makeStandardMaterial(0xd0a13e,{emissive:0x5a3900,emissiveIntensity:.35}));
        stripe.position.y=.22;belt.add(stripe);
    });
}

function createThreeObstacleObject(obs, index) {
    if(typeof initializeObstacleDurability === 'function') initializeObstacleDurability(obs);
    if(!obs.terrainId) obs.terrainId = `legacy-obstacle-${index}`;
    const factoryBaseZ = currentMap === 'factory'
        ? (Number.isFinite(obs.z) ? obs.z : (Number.isInteger(obs.factoryFloor) && typeof getFactoryFloorZ === 'function' ? getFactoryFloorZ(obs.factoryFloor) : 0)) : 0;
    const worldTop = typeof getObstacleWorldHeight === 'function' ? getObstacleWorldHeight(obs)
        : (obs.type === 'building' ? 52 + (obs.floors || 4) * 18 : Math.max(35, Math.min(obs.w, obs.h) * 0.58));
    const height = Math.max(12, worldTop - factoryBaseZ) * THREE_WORLD_SCALE;
    const center = threeWorldPosition(obs.x + obs.w / 2, obs.y + obs.h / 2, factoryBaseZ * THREE_WORLD_SCALE);
    const obstacleColors = {
        tree:0x2f7434, ice:0x9fc7d8, rock:0x8a633a, rubble:0x625b54,
        volcanicRock:0x433936, oilBarrel:0xa43a1c, factoryFacility:0x69737a,
        factoryCrate:0x8b6542, factoryBoundary:0x303438, factoryElevatorShaft:0x454b4f
    };
    const color = obs.type === 'building' ? (index % 2 ? 0x58616a : 0x6b737b) : (obstacleColors[obs.type] || 0x555b5e);
    center.y += height / 2;
    let object;
    if(obs.type === 'oilBarrel') {
        object = new THREE.Group();
        object.position.copy(threeWorldPosition(obs.x + obs.w / 2, obs.y + obs.h / 2, factoryBaseZ * THREE_WORLD_SCALE));
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 3.7, 16), makeStandardMaterial(color, {roughness:.55, metalness:.42}));
        barrel.position.y = 1.85;
        const bandMaterial = makeStandardMaterial(0x2c2522, {metalness:.6});
        [-1.1, 1.1].forEach(y => { const band = new THREE.Mesh(new THREE.TorusGeometry(1.48, .11, 7, 18), bandMaterial); band.rotation.x = Math.PI / 2; band.position.y = y; barrel.add(band); });
        object.add(barrel);
        object.userData.physicsBodyMesh=barrel;
    } else if(obs.type === 'factoryPlatform') {
        object = new THREE.Group();
        object.position.copy(threeWorldPosition(obs.x + obs.w / 2, obs.y + obs.h / 2, 0));
        const deck = new THREE.Mesh(new THREE.BoxGeometry(obs.w * THREE_WORLD_SCALE, 1.15, obs.h * THREE_WORLD_SCALE), makeStandardMaterial(obs.level === 3 ? 0x666d70 : 0x555b5e, {roughness:.72, metalness:.3}));
        deck.position.y = (obs.platformHeight || 120) * THREE_WORLD_SCALE;
        object.add(deck);
        const legMaterial = makeStandardMaterial(0x34383a, {metalness:.42});
        [[-.46,-.44],[.46,-.44],[-.46,.44],[.46,.44]].forEach(([lx,lz]) => {
            const legHeight = (obs.platformHeight || 120) * THREE_WORLD_SCALE;
            const leg = new THREE.Mesh(new THREE.BoxGeometry(.8, legHeight, .8), legMaterial);
            leg.position.set(obs.w * THREE_WORLD_SCALE * lx, legHeight / 2, obs.h * THREE_WORLD_SCALE * lz); object.add(leg);
        });
    } else if(obs.type === 'rubble') {
        object = new THREE.Group();
        object.position.copy(center);
        const chunks = [
            { x: -0.22, z: -0.14, w: 0.46, h: 0.58, r: -0.14 },
            { x: 0.2, z: 0.16, w: 0.42, h: 0.48, r: 0.2 },
            { x: 0.02, z: -0.02, w: 0.28, h: 0.3, r: 0.48 }
        ];
        chunks.forEach((chunk, chunkIndex) => {
            const blockHeight = height * (chunkIndex === 2 ? 0.72 : 0.5);
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(obs.w * THREE_WORLD_SCALE * chunk.w, blockHeight, obs.h * THREE_WORLD_SCALE * chunk.h),
                makeStandardMaterial(chunkIndex === 1 ? 0x776d64 : color, { roughness: 0.97 })
            );
            mesh.position.set(obs.w * THREE_WORLD_SCALE * chunk.x, blockHeight / 2 - height / 2, obs.h * THREE_WORLD_SCALE * chunk.z);
            mesh.rotation.y = chunk.r + ((obs.rubbleSeed || 0) % 0.18);
            mesh.userData.isObstacle = true;
            mesh.receiveShadow = true;
            object.add(mesh);
        });
    } else {
        const transparentFactoryWall=obs.type==='factoryBoundary';
        const wallOpacity=obs.type==='factoryBoundary'?.10:1;
        const obstacleMaterial=makeStandardMaterial(color, { roughness: 0.9, metalness: obs.type === 'building' || obs.type === 'factoryWall' ? 0.16 : 0, transparent:transparentFactoryWall, opacity:wallOpacity });
        if(transparentFactoryWall)obstacleMaterial.depthWrite=false;
        object = new THREE.Mesh(
            new THREE.BoxGeometry(obs.w * THREE_WORLD_SCALE, height, obs.h * THREE_WORLD_SCALE),
            obstacleMaterial
        );
        object.position.copy(center);
        object.userData.isObstacle = true;
        object.castShadow = obs.type === 'building' && index % 2 === 0;
        object.receiveShadow = true;
    }
    object.userData.terrainId = obs.terrainId;
    object.userData.visualRevision = obs.visualRevision || 0;
    if(obs.conveyorMovable&&!object.userData.physicsBodyMesh)object.userData.physicsBodyMesh=object;
    if(Number.isInteger(obs.factoryFloor)) object.userData.factoryFloor = obs.factoryFloor;
    threeView.worldRoot.add(object);
    threeView.obstacleMeshes.set(obs.terrainId, object);
    return object;
}

function buildThreeObstacles() {
    obstacles.forEach(createThreeObstacleObject);
    threeView.lastTerrainRevision = typeof terrainRevision !== 'undefined' ? terrainRevision : 0;
}

function syncThreeTerrainDestruction() {
    const revision = typeof terrainRevision !== 'undefined' ? terrainRevision : 0;
    if(threeView.lastTerrainRevision !== revision) {
        const aliveObstacleIds = new Set();
        obstacles.forEach((obs, index) => {
            if(typeof initializeObstacleDurability === 'function') initializeObstacleDurability(obs);
            if(!obs.terrainId) obs.terrainId = `legacy-obstacle-${index}`;
            aliveObstacleIds.add(obs.terrainId);
            const existing = threeView.obstacleMeshes.get(obs.terrainId);
            if(existing && existing.userData.visualRevision === (obs.visualRevision || 0)) return;
            if(existing) disposeThreeObject(existing);
            createThreeObstacleObject(obs, index);
        });
        threeView.obstacleMeshes.forEach((object, id) => {
            if(aliveObstacleIds.has(id)) return;
            disposeThreeObject(object);
            threeView.obstacleMeshes.delete(id);
        });
        threeView.lastTerrainRevision = revision;
    }
    const debris = typeof terrainDebris !== 'undefined' ? terrainDebris : [];
    const alive = new Set();
    debris.forEach(piece => {
        alive.add(piece.id);
        let mesh = threeView.debrisMeshes.get(piece.id);
        if(!mesh) {
            const size = Math.max(0.18, piece.size * THREE_WORLD_SCALE);
            mesh = new THREE.Mesh(
                new THREE.BoxGeometry(size, size * 0.62, size * (piece.material === 'wood' ? 1.45 : 0.86)),
                makeStandardMaterial(piece.color || 0x716961, { roughness: 0.95 })
            );
            mesh.castShadow = !(typeof touchControlMode !== 'undefined' && touchControlMode);
            threeView.dynamicRoot.add(mesh);
            threeView.debrisMeshes.set(piece.id, mesh);
        }
        setThreeWorldPosition(mesh, piece.x, piece.y, Math.max(0.08, piece.z * THREE_WORLD_SCALE));
        mesh.rotation.set(piece.rotation * 0.7, piece.rotation, piece.rotation * 0.35);
        mesh.material.opacity = Math.max(0, Math.min(1, piece.life / 0.7));
        mesh.material.transparent = mesh.material.opacity < 0.99;
    });
    threeView.debrisMeshes.forEach((mesh, id) => {
        if(alive.has(id)) return;
        disposeThreeObject(mesh);
        threeView.debrisMeshes.delete(id);
    });
}

function buildThreeBasesAndOutposts() {
    ['blue', 'red'].forEach(team => {
        const base = bases[team];
        if(!base) return;
        const color = team === 'blue' ? 0x2677d9 : 0xd93636;
        const position = threeWorldPosition(base.x + base.w / 2, base.y + base.h / 2, ((base.z || 0) * THREE_WORLD_SCALE) + 2.0);
        const group = new THREE.Group();
        group.position.copy(position);
        if(Number.isInteger(base.factoryFloor)) group.userData.factoryFloor = base.factoryFloor;
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
        group.position.copy(threeWorldPosition(op.x, op.y, ((op.z || 0) * THREE_WORLD_SCALE) + 0.2));
        if(Number.isInteger(op.factoryFloor)) group.userData.factoryFloor = op.factoryFloor;
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

function buildThreeMapMechanics() {
    if(typeof mapMechanicsState === 'undefined') return;
    if(currentMap === 'volcano') {
        const positions = [];
        for(let i = 0; i < 260; i++) {
            positions.push((Math.random() - .5) * CONFIG.mapWidth * THREE_WORLD_SCALE, 8 + Math.random() * 42, (Math.random() - .5) * CONFIG.mapHeight * THREE_WORLD_SCALE);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const ash = new THREE.Points(geometry, new THREE.PointsMaterial({color:0x8d817a, size:.32, transparent:true, opacity:.48, depthWrite:false}));
        threeView.worldRoot.add(ash); threeView.mechanicMeshes.set('volcano-ash', ash);
    }
    if(currentMap==='factory'&&mapMechanicsState.factory){
        mapMechanicsState.factory.elevators.forEach(elevator=>{
            const platform=new THREE.Group();
            const deck=new THREE.Mesh(new THREE.BoxGeometry((elevator.w-72)*THREE_WORLD_SCALE,1.1,(elevator.h-72)*THREE_WORLD_SCALE),makeStandardMaterial(0x3f474b,{metalness:.46,roughness:.55}));
            const stripe=new THREE.Mesh(new THREE.BoxGeometry((elevator.w-105)*THREE_WORLD_SCALE,.12,8*THREE_WORLD_SCALE),makeStandardMaterial(0xf0c34c,{emissive:0x5a4200,emissiveIntensity:.5}));
            stripe.position.y=.62;
            platform.add(deck,stripe);
            threeView.dynamicRoot.add(platform);
            threeView.mechanicMeshes.set(`elevator-platform-${elevator.id}`,platform);
        });
    }
    if(!mapMechanicsState.crane) return;
    const crane = mapMechanicsState.crane;
    const group = new THREE.Group();
    group.position.copy(threeWorldPosition(crane.x, crane.y, (crane.z || 0) * THREE_WORLD_SCALE));
    group.userData.factoryFloor = crane.factoryFloor;
    const steel = makeStandardMaterial(0x9a6c25, {metalness:.5, roughness:.54});
    const mast = new THREE.Mesh(new THREE.BoxGeometry(2.2, 32, 2.2), steel); mast.position.set(-35, 16, 0);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(72, 2, 2), steel.clone()); beam.position.set(0, 31, 0);
    group.add(mast, beam); threeView.worldRoot.add(group);
    threeView.mechanicMeshes.set('crane-structure', group);
}

function buildThreeBoundary() {
    if(currentMap === 'factory') return;
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
        const weaponPivot = new THREE.Group();
        weaponPivot.position.set(1.0, -1.35, 0);
        const gunPod = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.86, 1.1, 10), makeStandardMaterial(0x30383e, { metalness: .55, roughness: .34 }));
        const airGun = new THREE.Mesh(new THREE.BoxGeometry(4.6, .42, .5), makeStandardMaterial(0x151a1d, { metalness: .62, roughness: .3 }));
        airGun.position.set(2.45, -.1, 0);
        const muzzle = new THREE.Mesh(new THREE.BoxGeometry(.7, .72, .82), makeStandardMaterial(0x66eeff, { emissive: 0x167f99, emissiveIntensity: 1.2 }));
        muzzle.position.set(4.8, -.1, 0);
        weaponPivot.add(gunPod, airGun, muzzle);
        const muzzleFlash = new THREE.Mesh(new THREE.SphereGeometry(1.15, 10, 8), new THREE.MeshBasicMaterial({ color: 0x8ff6ff, transparent: true, opacity: .9, depthWrite: false }));
        muzzleFlash.scale.set(1.8, .65, .65); muzzleFlash.position.set(5.45, -.1, 0); muzzleFlash.visible = false;
        weaponPivot.add(muzzleFlash);
        const bombMaterial = makeStandardMaterial(0xff6238, { metalness: .32, roughness: .46 });
        const leftBomb = new THREE.Mesh(new THREE.CapsuleGeometry(.45, 1.4, 5, 10), bombMaterial);
        const rightBomb = leftBomb.clone();
        leftBomb.rotation.z = Math.PI / 2; rightBomb.rotation.z = Math.PI / 2;
        leftBomb.position.set(-.6, -1.35, -1.8); rightBomb.position.set(-.6, -1.35, 1.8);
        const fire = new THREE.Group();
        const outerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.2, 9), makeStandardMaterial(0xff4b16, { emissive: 0xff2200, emissiveIntensity: 2.4 }));
        const innerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.2, 8), makeStandardMaterial(0xffdd42, { emissive: 0xff8a00, emissiveIntensity: 2.8 }));
        outerFlame.rotation.z = Math.PI / 2;
        innerFlame.rotation.z = Math.PI / 2;
        fire.position.set(-4.6, 1.0, 0);
        fire.add(outerFlame, innerFlame);
        fire.visible = false;
        group.add(fuselage, cockpit, tail, rotor, tailRotor, weaponPivot, leftBomb, rightBomb, fire);
        group.userData.rotor = rotor;
        group.userData.fire = fire;
        group.userData.turretPivot = weaponPivot;
        group.userData.muzzleFlash = muzzleFlash;
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
        const gunPitch = new THREE.Group();
        gunPitch.add(barrel, muzzleBrake);
        const muzzleFlash = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffb02e, transparent: true, opacity: .95, depthWrite: false }));
        muzzleFlash.scale.set(2.1, .72, .72); muzzleFlash.position.set(barrelLength + 1.55, .18, 0); muzzleFlash.visible = false;
        gunPitch.add(muzzleFlash);
        turretPivot.add(turret, gunPitch, hatch);
        group.add(leftTrack, rightTrack, hull, upperHull, turretPivot);
        group.userData.turretPivot = turretPivot;
        group.userData.gunPitch = gunPitch;
        group.userData.muzzleFlash = muzzleFlash;
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
    const rescueShield = new THREE.Mesh(
        new THREE.SphereGeometry(tank.shape === 'helicopter' ? 5.8 : 4.8, 18, 12),
        new THREE.MeshBasicMaterial({ color: 0x5ee8ff, transparent: true, opacity: 0.18, wireframe: true, depthWrite: false })
    );
    rescueShield.position.y = tank.shape === 'helicopter' ? 0 : 1.6;
    rescueShield.visible = false;
    group.add(rescueShield);
    group.userData.rescueShield = rescueShield;
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
        mesh.visible = true;
        const flying = tank.shape === 'helicopter';
        const inWater = !flying && typeof isTankInWater === 'function' && isTankInWater(tank);
        const storedHeight = (tank.z || 0) * THREE_WORLD_SCALE;
        const baseHeight = storedHeight + (flying ? Math.sin(now * 0.003 + tank.x) * 0.55 : (inWater ? 0.15 : 0.08));
        setThreeWorldPosition(mesh, tank.x, tank.y, baseHeight);
        mesh.rotation.y = -tank.angle;
        if(mesh.userData.turretPivot) mesh.userData.turretPivot.rotation.y = -(tank.turretAngle - tank.angle);
        if(mesh.userData.gunPitch) {
            const activeWeapon = tank.isPlayer && typeof currentWeapon !== 'undefined' ? currentWeapon : tank.lastFiredWeapon;
            const elevation = activeWeapon === 'aa' ? tank.aaElevation : tank.shellElevation;
            mesh.userData.gunPitch.rotation.z = (elevation || 0) * Math.PI / 180;
        }
        if(mesh.userData.muzzleFlash) {
            const active = (tank.muzzleFlashTimer || 0) > 0;
            mesh.userData.muzzleFlash.visible = active;
            if(active) {
                const pulse = .78 + Math.sin(now * .065) * .22;
                mesh.userData.muzzleFlash.scale.set(2.1 + pulse, .62 + pulse * .25, .62 + pulse * .25);
                mesh.userData.muzzleFlash.material.color.setHex(tank.muzzleFlashType === 'aa' ? 0xff66ff : (tank.muzzleFlashType === 'mg' || tank.muzzleFlashType === 'airmg' ? 0xffff9a : 0xff9b22));
            }
        }
        if(mesh.userData.rotor) mesh.userData.rotor.rotation.y = now * 0.022;
        if(mesh.userData.fire) {
            mesh.userData.fire.visible = !!tank.helicopterOnFire;
            if(tank.helicopterOnFire) {
                const flicker = 0.82 + Math.sin(now * 0.032 + tank.x) * 0.22;
                mesh.userData.fire.scale.set(flicker, 0.85 + Math.random() * 0.3, flicker);
            }
        }
        if(mesh.userData.waterWash) mesh.userData.waterWash.visible = inWater;
        if(mesh.userData.rescueShield) {
            mesh.userData.rescueShield.visible = !!(tank.rescueShieldActive && tank.shieldActive && tank.shieldHp > 0);
            mesh.userData.rescueShield.material.opacity = 0.14 + Math.sin(now * 0.012 + tank.x) * 0.05;
        }
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
    const color = bullet.type === 'bomb' ? 0xff6136 : (bullet.type === 'airmg' ? 0x73f2ff : (bullet.type === 'aa' ? 0xff45ff : (bullet.type === 'shell' ? 0xff9a20 : 0xffef65)));
    const radius = bullet.type === 'bomb' ? .72 : (bullet.type === 'aa' ? 0.62 : (bullet.type === 'shell' ? 0.48 : 0.22));
    const material = makeStandardMaterial(color, { emissive: color, emissiveIntensity: bullet.type === 'mg' || bullet.type === 'airmg' ? 1.2 : 2.4, roughness: 0.25 });
    const group = new THREE.Group();
    const projectile = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 8), material);
    if(bullet.type === 'bomb') projectile.scale.set(.72, 1.7, .72);
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

function createThreeSupplyDrop(drop) {
    const group = new THREE.Group();
    const crate = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.7, 3.5), makeStandardMaterial(0x477c5b, { metalness: .16, roughness: .72 }));
    const bandX = new THREE.Mesh(new THREE.BoxGeometry(.5, 2.82, 3.62), makeStandardMaterial(0xf1db55, { emissive: 0x5a4600, emissiveIntensity: .35 }));
    const bandZ = new THREE.Mesh(new THREE.BoxGeometry(3.62, 2.82, .5), bandX.material.clone());
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(4.7, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2), makeStandardMaterial(0xe8efe0, { transparent: true, opacity: .88, roughness: .9 }));
    canopy.scale.y = .5; canopy.position.y = 6.3;
    const cords = new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-3.5,5.5,-2),new THREE.Vector3(-1.4,1.5,-1.4),
            new THREE.Vector3(3.5,5.5,-2),new THREE.Vector3(1.4,1.5,-1.4),
            new THREE.Vector3(-3.5,5.5,2),new THREE.Vector3(-1.4,1.5,1.4),
            new THREE.Vector3(3.5,5.5,2),new THREE.Vector3(1.4,1.5,1.4)
        ]),
        new THREE.LineBasicMaterial({color:0xdce9e5,transparent:true,opacity:.8})
    );
    group.add(crate, bandX, bandZ, canopy, cords);
    group.userData.canopy = canopy; group.userData.cords = cords;
    group.traverse(child => { if(child.isMesh) child.castShadow = true; });
    threeView.dynamicRoot.add(group);
    return group;
}

function syncThreeSupplyDrops(now) {
    if(typeof supplyDrops === 'undefined') return;
    const active = new Set(supplyDrops);
    supplyDrops.forEach(drop => {
        let mesh = threeView.supplyMeshes.get(drop);
        if(!mesh) { mesh = createThreeSupplyDrop(drop); threeView.supplyMeshes.set(drop, mesh); }
        setThreeWorldPosition(mesh, drop.x, drop.y, Math.max(.3, (drop.z || 0) * THREE_WORLD_SCALE + 1.35));
        mesh.rotation.y = Math.sin(now * .0016 + drop.pulse) * .18;
        mesh.userData.canopy.visible = !drop.landed;
        mesh.userData.cords.visible = !drop.landed;
    });
    for(const [drop, mesh] of threeView.supplyMeshes) {
        if(!active.has(drop)) { disposeThreeObject(mesh); threeView.supplyMeshes.delete(drop); }
    }
}

function syncThreeAmmoRackFireballs(now) {
    if(typeof ammoRackFireballs === 'undefined') return;
    const active = new Set(ammoRackFireballs);
    ammoRackFireballs.forEach(effect => {
        let group = threeView.fireballMeshes.get(effect);
        if(!group) {
            group = new THREE.Group();
            const colors = [0xfff0a0, 0xff8a18, 0xe72b08];
            colors.forEach((color, index) => {
                const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .9 - index * .14, depthWrite: false }));
                sphere.position.set((index - 1) * .8, index * .45, (1 - index) * .7);
                group.add(sphere);
            });
            threeView.dynamicRoot.add(group);
            threeView.fireballMeshes.set(effect, group);
        }
        const progress = 1 - effect.life / effect.maxLife;
        setThreeWorldPosition(group, effect.x, effect.y, effect.z * THREE_WORLD_SCALE);
        const size = 2.2 + Math.sin(Math.min(1, progress) * Math.PI) * 7.4;
        group.scale.setScalar(size);
        group.rotation.y = effect.seed + now * .002;
        group.children.forEach((sphere, index) => { sphere.material.opacity = Math.max(0, (.95 - index * .12) * (1 - progress)); });
    });
    for(const [effect, mesh] of threeView.fireballMeshes) {
        if(!active.has(effect)) { disposeThreeObject(mesh); threeView.fireballMeshes.delete(effect); }
    }
}

function syncThreeBullets() {
    const active = new Set(bullets);
    bullets.forEach(bullet => {
        let mesh = threeView.bulletMeshes.get(bullet);
        if(!mesh) {
            mesh = createThreeBullet(bullet);
            threeView.bulletMeshes.set(bullet, mesh);
        }
        mesh.visible = true;
        let height = Number.isFinite(bullet.z) ? bullet.z * THREE_WORLD_SCALE
            : (bullet.owner && bullet.owner.isFlying ? (bullet.owner.z || CONFIG.helicopterAltitude) * THREE_WORLD_SCALE : 2.2);
        if(bullet.isRocket && !Number.isFinite(bullet.z)) height = 4.2;
        const projectile = mesh.userData.projectile;
        if(bullet.ricocheted && !mesh.userData.ricocheted) {
            mesh.userData.ricocheted = true;
            projectile.material.color.setHex(0x8df8ff);
            projectile.material.emissive.setHex(0x24cde5);
        }
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
        const ragePulse = entry.base.rageActive ? 1 + Math.sin(now * 0.018) * 0.25 : 1;
        entry.beacon.scale.setScalar((0.55 + ratio * 0.45) * ragePulse);
        entry.beacon.material.emissiveIntensity = entry.base.rageActive ? 3.1 + Math.sin(now * 0.025) : 0.4 + ratio * 1.5;
        if(entry.base.rageActive) entry.beacon.material.color.setHex(0xff5a24);
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

    const hiddenPoint = typeof sneakHiddenOutpost !== 'undefined' ? sneakHiddenOutpost : null;
    const showHiddenPoint = gameMode === 'sneak' && hiddenPoint && hiddenPoint.discovered && (!hiddenPoint.triggered || hiddenPoint.signalTimer > 0);
    if(showHiddenPoint) {
        if(!threeView.hiddenOutpostMesh) {
            const group = new THREE.Group();
            const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x66dcff, transparent: true, opacity: 0.68, side: THREE.DoubleSide, depthWrite: false });
            const ring = new THREE.Mesh(new THREE.RingGeometry(11.2, 12.2, 48), ringMaterial);
            ring.rotation.x = -Math.PI / 2;
            const core = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 2.2, 1.1, 12), makeStandardMaterial(0x92eaff, { emissive: 0x28b9e8, emissiveIntensity: 1.7 }));
            core.position.y = 0.65;
            const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.45, 18, 10), new THREE.MeshBasicMaterial({ color: 0x75eaff, transparent: true, opacity: 0.28, depthWrite: false }));
            beam.position.y = 9;
            group.add(ring, core, beam);
            group.userData.ring = ring; group.userData.core = core; group.userData.beam = beam;
            threeView.modeRoot.add(group);
            threeView.hiddenOutpostMesh = group;
        }
        const mesh = threeView.hiddenOutpostMesh;
        setThreeWorldPosition(mesh, hiddenPoint.x, hiddenPoint.y, 0.12);
        mesh.visible = true;
        const color = hiddenPoint.contested ? 0xff9b38 : (hiddenPoint.triggered ? 0x65ffb2 : 0x66dcff);
        mesh.userData.ring.material.color.setHex(color);
        mesh.userData.core.material.color.setHex(color);
        mesh.userData.core.material.emissive.setHex(color);
        const progress = hiddenPoint.progress / hiddenPoint.captureTime;
        mesh.userData.ring.material.opacity = 0.35 + progress * 0.55;
        mesh.userData.beam.scale.y = hiddenPoint.triggered ? 1.8 : 0.55 + progress * 0.75;
        mesh.userData.beam.material.opacity = 0.16 + progress * 0.38;
        mesh.rotation.y = now * 0.0007;
    } else if(threeView.hiddenOutpostMesh) threeView.hiddenOutpostMesh.visible = false;

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
        let sky = currentMap === 'factory' ? (night ? 0x111416 : 0x252a2d) : (night ? (currentMap === 'volcano' ? 0x180405 : 0x050916) : (currentMap === 'desert' ? 0xe3b66f : (currentMap === 'snow' ? 0xcfe6ef : (currentMap === 'city' ? 0x82909b : (currentMap === 'island' ? 0x75b8df : (currentMap === 'volcano' ? 0x5d211b : 0x99c9e8))))));
        threeView.scene.background.setHex(sky);
        threeView.scene.fog.color.setHex(sky);
        threeView.scene.fog.near = currentMap === 'factory' ? 55 : (night ? 45 : 70);
        threeView.scene.fog.far = currentMap === 'factory' ? 170 : (night ? 145 : 210);
    }
    threeView.waterMaterials.forEach(material => {
        material.roughness = currentMap === 'volcano' ? 0.28 + Math.sin(now * 0.0032) * 0.07 : 0.18 + Math.sin(now * 0.0018) * 0.04;
        if(currentMap === 'volcano' && material.emissiveIntensity !== undefined) material.emissiveIntensity = 2.1 + Math.sin(now * .004) * .55;
    });
}

function syncThreeMapMechanics(now) {
    if(typeof mapMechanicsState === 'undefined') return;
    const aliveKeys = new Set();
    threeView.lavaMeshes.forEach(entry => {
        const a = typeof getLavaPoint === 'function' ? getLavaPoint(entry.zone.points[entry.index], entry.index) : entry.zone.points[entry.index];
        const b = typeof getLavaPoint === 'function' ? getLavaPoint(entry.zone.points[entry.index + 1], entry.index + 1) : entry.zone.points[entry.index + 1];
        const length = Math.hypot(b.x - a.x, b.y - a.y), width = (a.width + b.width) * .5;
        entry.mesh.position.copy(threeWorldPosition((a.x + b.x) / 2, (a.y + b.y) / 2, .08));
        entry.mesh.rotation.y = -Math.atan2(b.y - a.y, b.x - a.x);
        entry.mesh.scale.set(length / entry.baseLength, width / entry.baseWidth, 1);
    });
    if(currentMap === 'volcano') {
        aliveKeys.add('volcano-ash');
        const ash = threeView.mechanicMeshes.get('volcano-ash');
        if(ash) { ash.rotation.y = now * .000018; ash.position.y = Math.sin(now * .00035) * 3; }
    }
    mapMechanicsState.lavaBalls.forEach(ball => {
        aliveKeys.add(ball);
        let mesh = threeView.mechanicMeshes.get(ball);
        if(!mesh) {
            mesh = new THREE.Mesh(new THREE.SphereGeometry(1.25, 12, 8), makeStandardMaterial(0xff6a12, {emissive:0xff2600, emissiveIntensity:2.8}));
            threeView.dynamicRoot.add(mesh); threeView.mechanicMeshes.set(ball, mesh);
        }
        setThreeWorldPosition(mesh, ball.x, ball.y, Math.max(.2, ball.z * THREE_WORLD_SCALE));
        mesh.scale.setScalar(.85 + Math.sin(now * .01) * .12);
    });
    mapMechanicsState.fireZones.forEach(fire => {
        aliveKeys.add(fire);
        let mesh = threeView.mechanicMeshes.get(fire);
        if(!mesh) {
            mesh = new THREE.Mesh(new THREE.CylinderGeometry(fire.radius * THREE_WORLD_SCALE, fire.radius * THREE_WORLD_SCALE * .7, .35, 24), makeStandardMaterial(0xff5312, {emissive:0xff2500, emissiveIntensity:2, transparent:true, opacity:.62}));
            threeView.dynamicRoot.add(mesh); threeView.mechanicMeshes.set(fire, mesh);
        }
        setThreeWorldPosition(mesh, fire.x, fire.y, ((fire.z || 0) * THREE_WORLD_SCALE) + .18);
        mesh.userData.factoryFloor = fire.factoryFloor;
        mesh.visible = true;
        mesh.material.opacity = Math.max(0, Math.min(.7, fire.life / fire.maxLife));
        mesh.scale.y = .8 + Math.sin(now * .009) * .25;
    });
    const crane = mapMechanicsState.crane;
    if(crane) {
        aliveKeys.add('crane-structure');
        aliveKeys.add('crane-hook');
        let hook = threeView.mechanicMeshes.get('crane-hook');
        if(!hook) {
            hook = new THREE.Group();
            const cable = new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,1,6), makeStandardMaterial(0x282828, {metalness:.7}));
            const claw = new THREE.Mesh(new THREE.TorusGeometry(.85,.18,8,16,Math.PI * 1.5), makeStandardMaterial(0xd0a43d, {metalness:.55}));
            claw.rotation.z = Math.PI / 2; hook.add(cable, claw); hook.userData.cable = cable; hook.userData.claw = claw;
            threeView.dynamicRoot.add(hook); threeView.mechanicMeshes.set('crane-hook', hook);
        }
        const craneBase = (crane.z || 0) * THREE_WORLD_SCALE;
        const hookZ = crane.phase === 'carry' && crane.target ? (crane.target.z || 0) * THREE_WORLD_SCALE + 4 : craneBase + 3;
        setThreeWorldPosition(hook, crane.hookX, crane.hookY, hookZ);
        hook.userData.factoryFloor = crane.factoryFloor;
        hook.visible = true;
        const craneTop = craneBase + 31;
        hook.userData.cable.position.y = (craneTop - hookZ) / 2;
        hook.userData.cable.scale.y = Math.max(.2, craneTop - hookZ);
        hook.userData.claw.position.y = 0;
        hook.userData.claw.rotation.y = now * .001;
    }
    if(currentMap === 'factory' && mapMechanicsState.factory) {
        mapMechanicsState.factory.elevators.forEach(elevator=>{
            const key=`elevator-platform-${elevator.id}`;
            aliveKeys.add(key);
            const mesh=threeView.mechanicMeshes.get(key);
            if(mesh)setThreeWorldPosition(mesh,elevator.x+elevator.w/2,elevator.y+elevator.h/2,elevator.platformZ*THREE_WORLD_SCALE);
        });
        obstacles.filter(obs => obs.conveyorMovable).forEach(obs => {
            const mesh = threeView.obstacleMeshes.get(obs.terrainId);
            if(!mesh)return;
            const baseZ=obs.z||0;
            if(obs.type==='oilBarrel'){
                setThreeWorldPosition(mesh,obs.x+obs.w/2,obs.y+obs.h/2,baseZ*THREE_WORLD_SCALE);
            }else{
                const top=typeof getObstacleWorldHeight==='function'?getObstacleWorldHeight(obs):baseZ+Math.max(obs.w,obs.h);
                setThreeWorldPosition(mesh,obs.x+obs.w/2,obs.y+obs.h/2,(baseZ+(top-baseZ)/2)*THREE_WORLD_SCALE);
            }
            const bodyMesh=mesh.userData.physicsBodyMesh;
            if(bodyMesh&&obs.physicsQuaternion){
                bodyMesh.quaternion.set(obs.physicsQuaternion.x,obs.physicsQuaternion.y,obs.physicsQuaternion.z,obs.physicsQuaternion.w);
            }
        });
        mapMechanicsState.factory.repairRobots.forEach(robot => {
            aliveKeys.add(robot);
            let mesh = threeView.mechanicMeshes.get(robot);
            if(!mesh) {
                mesh = new THREE.Group();
                const body = new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.8,2.3,10), makeStandardMaterial(0x67cbd3,{metalness:.42,emissive:0x103f45,emissiveIntensity:.6}));
                body.position.y=1.45;
                const head = new THREE.Mesh(new THREE.BoxGeometry(2.1,1.1,1.5), makeStandardMaterial(0xb8edf0,{metalness:.3}));
                head.position.y=3.15;
                const arm = new THREE.Mesh(new THREE.BoxGeometry(3.4,.42,.42),makeStandardMaterial(0xf2b84b,{metalness:.4}));
                arm.position.set(1.7,2.25,0);
                mesh.add(body,head,arm);
                mesh.userData.factoryFloor=robot.factoryFloor;
                threeView.dynamicRoot.add(mesh);
                threeView.mechanicMeshes.set(robot,mesh);
            }
            mesh.visible=!robot.dead;
            setThreeWorldPosition(mesh,robot.x,robot.y,((robot.z||0)*THREE_WORLD_SCALE)+.1);
            mesh.rotation.y=-robot.angle;
        });
    }
    threeView.mechanicMeshes.forEach((mesh, key) => {
        if(aliveKeys.has(key)) return;
        disposeThreeObject(mesh); threeView.mechanicMeshes.delete(key);
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
    threeView.camera.up.set(0,1,0);
    threeView.groundPlane.constant = -(player.z||0)*THREE_WORLD_SCALE;
    // 锁定世界方向：镜头始终从地图南侧朝北看，W/S/A/D 与屏幕上下左右恒定。
    // 坦克转弯只改车身方向，摄像机只平移跟随，绝不旋转。
    const zoomFactor = Math.max(0.75, camera.zoom || 1);
    const distance = (currentMap==='factory'&&!player.isFlying?280:(player.isFlying ? 440 : 390)) * THREE_WORLD_SCALE / zoomFactor;
    const height = (currentMap==='factory'&&!player.isFlying?340:(player.isFlying ? 540 : 480)) * THREE_WORLD_SCALE / zoomFactor;
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
    const lookAhead = (currentMap==='factory'&&!player.isFlying?95:(player.isFlying ? 150 : 125)) * THREE_WORLD_SCALE;
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

    const activeCaptures = new Set(outposts.filter(op => op.captureProgress > 0 && op.captureProgress < CONFIG.outpostCaptureTime &&
        (currentMap !== 'factory' || isFactoryEntityOnVisibleFloor(op))));
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
    syncThreeTerrainDestruction();
    syncThreeTanks(now);
    syncThreeBullets();
    syncThreeTurrets();
    syncThreeSupplyDrops(now);
    syncThreeAmmoRackFireballs(now);
    syncThreeSnowTracks(now);
    syncThreeOwnership(now);
    syncThreeGameModes(now);
    syncThreeMapMechanics(now);
    updateThreeEnvironment(now);
    updateThreeCamera(dt);
    threeView.renderer.render(threeView.scene, threeView.camera);
    syncThreeHud();
}
