// ==================== 游戏初始化 ====================
function startGame() {
    console.log('[START_GAME] Starting game, selectedTank:', selectedTank, 'gameMode:', gameMode);
    if(!selectedTank) {
        console.error('[START_GAME] No tank selected!');
        return;
    }
    resetMatchStats();
    if(typeof resetTeamScores === 'function') resetTeamScores();
    if(typeof resetCombatReplay === 'function') resetCombatReplay();
    if(typeof resetBattleSystems === 'function') resetBattleSystems();
    recordTankUsed(selectedTank);
    const tankData = TANKS[selectedTank];
    const ammo = parseInt(document.getElementById('ammoSlider').value);
    const mg = parseInt(document.getElementById('mgSlider').value);
    const aa = parseInt(document.getElementById('aaSlider').value);
    let dayNight = 'day';
    if(gameMode === 'sneak') dayNight = 'night';
    else if(['ctf', 'infection', 'storm'].includes(gameMode)) dayNight = 'day';
    else dayNight = document.getElementById('dayNight').value;
    const difficulty = document.getElementById('difficulty').value;
    const viewMode = document.getElementById('viewMode') ? document.getElementById('viewMode').value : '2d';
    gameConfig = { dayNight, difficulty, ammo, mg, aa, mode: gameMode, viewMode };
    lastMatchSetup = { selectedTank, currentMap, gameMode, ammo, mg, aa, dayNight, difficulty, viewMode };
    currentWeapon = selectedTank === 'niuniu_heli' ? 'bomb' : 'shell';
    document.getElementById('menu').classList.remove('active');
    document.getElementById('menu').style.display = 'none';
    document.getElementById('gameUI').classList.add('active');
    document.getElementById('gameUI').style.display = 'block';
    document.getElementById('ultimateBar').style.display = 'block';
    document.getElementById('defenseWaveInfo').style.display = gameMode === 'defense' ? 'block' : 'none';
    document.getElementById('sneakModeInfo').style.display = gameMode === 'sneak' ? 'block' : 'none';
    const specialModeInfo = document.getElementById('specialModeInfo');
    if(specialModeInfo) {
        const labels = {
            ctf: '🏴 夺旗模式 - 率先获得 3 分',
            infection: '🧟 感染模式 - 生存或感染所有敌人',
            storm: '🌪 风暴模式 - 留在安全区并活到最后'
        };
        specialModeInfo.textContent = labels[gameMode] || '';
        specialModeInfo.style.display = labels[gameMode] ? 'block' : 'none';
    }
    resizeCanvas();
    generateMap();
    initPathGrid();
    spawnTanks(tankData, ammo, mg, aa);
    if(typeof distributeFactoryInitialTanks === 'function') distributeFactoryInitialTanks();
    if(typeof initializeSneakRescueMechanic === 'function') initializeSneakRescueMechanic();
    if(typeof updateWeaponHudMode === 'function') updateWeaponHudMode(player);
    initOutposts();
    initSpatialGrid();
    camera.zoom = (MAP_TEMPLATES[currentMap] || MAP_TEMPLATES.classic).cameraZoom || 1;
    setViewMode(viewMode, false);
    const initialView = getCameraViewSize();
    camera.x = player.x - initialView.width / 2;
    camera.y = player.y - initialView.height / 2;

    if(gameMode === 'ctf') initCTFMode();
    else if(gameMode === 'infection') initInfectionMode();
    else if(gameMode === 'storm') initStormMode();

    gameState = 'playing';
    if(gameMode === 'defense') gameTime = 180;
    else if(['ctf', 'infection', 'storm'].includes(gameMode)) gameTime = 300;
    else gameTime = CONFIG.gameTime;
    lastTime = performance.now();
    exhaustTrails = [];
    trailEffects = [];
    damageNumbers = [];
    updateHUD();
    updateOutpostInfo();
}

function setViewMode(mode, notify = true) {
    const use3D = mode === '3d';
    if(use3D && (typeof THREE === 'undefined' || typeof initThreeRenderer !== 'function' || !initThreeRenderer())) {
        gameConfig.viewMode = '2d';
        const failedSelect = document.getElementById('viewMode');
        if(failedSelect) failedSelect.value = '2d';
        if(notify) showMessage('当前浏览器无法启动 WebGL 3D，已回到 2D', '#ff9f43');
        return;
    }
    gameConfig.viewMode = use3D ? '3d' : '2d';
    const gameCanvas = document.getElementById('gameCanvas');
    const threeCanvas = document.getElementById('threeCanvas');
    const threeHudLayer = document.getElementById('threeHudLayer');
    const threeThreatBorder = document.getElementById('threeThreatBorder');
    if(gameCanvas) gameCanvas.style.display = use3D ? 'none' : 'block';
    if(threeCanvas) threeCanvas.style.display = use3D ? 'block' : 'none';
    if(threeHudLayer) threeHudLayer.style.display = use3D ? 'block' : 'none';
    if(threeThreatBorder && !use3D) threeThreatBorder.style.display = 'none';
    if(use3D && typeof rebuildThreeWorld === 'function') rebuildThreeWorld(true);
    const select = document.getElementById('viewMode');
    if(select) select.value = gameConfig.viewMode;
    const indicator = document.getElementById('viewModeIndicator');
    if(indicator) {
        indicator.textContent = use3D ? '◈ Three.js 真3D · V切换' : '🗺 2D俯视 · V切换';
        indicator.style.color = use3D ? '#ffd37a' : '#8ee8ff';
    }
    if(notify && gameState === 'playing') showMessage(use3D ? '◈ 已进入 Three.js 真3D战场' : '🗺 已切换到2D俯视', use3D ? '#ffd37a' : '#8ee8ff');
}

function toggleViewMode() {
    setViewMode(gameConfig.viewMode === '3d' ? '2d' : '3d');
}

function getCameraViewSize() {
    const zoom = camera.zoom || 1;
    return { width: canvas.width / zoom, height: canvas.height / zoom };
}

function screenToWorld(screenX, screenY) {
    if(gameConfig.viewMode === '3d' && typeof threeScreenToWorld === 'function') {
        const point = threeScreenToWorld(screenX, screenY);
        if(point) return point;
    }
    const zoom = camera.zoom || 1;
    return { x: camera.x + screenX / zoom, y: camera.y + screenY / zoom };
}

function worldToScreen(worldX, worldY) {
    const zoom = camera.zoom || 1;
    return { x: zoom * (worldX - camera.x), y: zoom * (worldY - camera.y) };
}

// 地图模板配置
const MAP_TEMPLATES = {
    classic: {
        name: '经典战场', width: 9000, height: 9000,
        obstacles: 150, outposts: [
            {x: 1500, y: 1500}, {x: 3500, y: 2000}, {x: 5500, y: 3000},
            {x: 2500, y: 5000}, {x: 4500, y: 4500}, {x: 7000, y: 3500}, {x: 6500, y: 6500}
        ],
        baseOffset: 500, description: '标准据点争夺战'
    },
    desert: {
        name: '沙漠风暴', width: 8000, height: 8000,
        obstacles: 38, cameraZoom: 0.82, groundColor: '#c9923f', obstacleType: 'rock', outposts: [
            {x: 2000, y: 2000}, {x: 4000, y: 1500}, {x: 6000, y: 2000},
            {x: 3000, y: 4000}, {x: 5000, y: 4000}
        ],
        baseOffset: 400, description: '橙黄沙漠，大视野与随机沙尘暴'
    },
    city: {
        name: '城市巷战', width: 6000, height: 6000,
        obstacles: 0, groundColor: '#30343a', obstacleType: 'building', outposts: [
            {x: 1500, y: 1500}, {x: 3000, y: 1200}, {x: 4500, y: 1500},
            {x: 1500, y: 3000}, {x: 4500, y: 3000}, {x: 1500, y: 4500},
            {x: 3000, y: 4800}, {x: 4500, y: 4500}
        ],
        baseOffset: 300, description: '街区、十字路口与密集建筑组成的真正城市战'
    },
    snow: {
        name: '雪地突袭', width: 10000, height: 10000,
        obstacles: 48, groundColor: '#dce8ee', obstacleType: 'ice', outposts: [
            {x: 2500, y: 2500}, {x: 5000, y: 2000}, {x: 7500, y: 2500},
            {x: 2500, y: 5000}, {x: 7500, y: 5000}, {x: 5000, y: 7500}
        ],
        baseOffset: 600, description: '雪地留痕，久停会冻结引擎'
    },
    island: {
        name: '海岛争夺', width: 7000, height: 7000,
        obstacles: 72, groundColor: '#6f9b55', obstacleType: 'tree', outposts: [
            {x: 900, y: 1000}, {x: 3500, y: 900}, {x: 6100, y: 1100},
            {x: 900, y: 3500}, {x: 3500, y: 3500}, {x: 6100, y: 3500},
            {x: 3500, y: 6100}
        ],
        baseOffset: 350, description: '水域分割岛屿，桥梁要道与树林'
    },
    volcano: {
        name: '火山熔岩', width: 8000, height: 7000,
        obstacles: 62, groundColor: '#292625', obstacleType: 'volcanicRock', outposts: [
            {x: 1500, y: 1450}, {x: 6500, y: 1450}, {x: 1900, y: 3500},
            {x: 4000, y: 3500}, {x: 6100, y: 3500}, {x: 1500, y: 5550}, {x: 6500, y: 5550}
        ],
        baseOffset: 420, description: '动态熔岩河、随机喷发与边缘冷却结晶'
    },
    factory: {
        name: '废弃工厂', width: 3000, height: 3000,
        obstacles: 0, groundColor: '#44474a', obstacleType: 'factoryWall', outposts: [
            {x: 1500, y: 2200, floor: 0, name: 'B1'},
            {x: 1500, y: 1500, floor: 1, name: '1F'},
            {x: 1500, y: 800, floor: 2, name: '2F'}
        ],
        baseOffset: 220, description: '室内 B1/1F/2F 三层战场，传送带、维修机器人与起重机'
    }
};

let currentMap = 'classic';

function generateMap() {
    const template = MAP_TEMPLATES[currentMap] || MAP_TEMPLATES.classic;
    CONFIG.mapWidth = template.width;
    CONFIG.mapHeight = template.height;
    obstacles = [];
    terrainZones = [];
    snowTracks = [];
    environmentState = {
        sandstormActive: false, sandstormTimer: 0,
        nextSandstorm: 12 + Math.random() * 18,
        windAngle: Math.random() * Math.PI * 2, windStrength: 0
    };
    const numObstacles = template.obstacles;
    const outpostPositions = template.outposts;
    for(let i=0; i<numObstacles; i++) {
        let w = template.obstacleType === 'tree' ? 55 + Math.random() * 55 : 80 + Math.random() * 200;
        let h = template.obstacleType === 'tree' ? 55 + Math.random() * 55 : 80 + Math.random() * 200;
        let x = 500 + Math.random() * (CONFIG.mapWidth - w - 1000);
        let y = 500 + Math.random() * (CONFIG.mapHeight - h - 1000);
        const distBlue = Math.hypot(x - 800, y - CONFIG.mapHeight/2);
        const distRed = Math.hypot(x - (CONFIG.mapWidth - 800), y - CONFIG.mapHeight/2);
        if(distBlue < 600 || distRed < 600) continue;
        let overlapsOutpost = false;
        for(let op of outpostPositions) {
            if(x < op.x + CONFIG.outpostRadius && x + w > op.x - CONFIG.outpostRadius &&
               y < op.y + CONFIG.outpostRadius && y + h > op.y - CONFIG.outpostRadius) {
                overlapsOutpost = true; break;
            }
        }
        if(overlapsOutpost) continue;
        obstacles.push({ x, y, w, h, type: template.obstacleType || 'block' });
    }
    if(currentMap === 'city') generateCityObstacles(outpostPositions);
    const baseOffset = template.baseOffset || 500;
    bases.blue = {
        x: baseOffset, y: CONFIG.mapHeight/2 - CONFIG.baseSize/2,
        w: CONFIG.baseSize, h: CONFIG.baseSize,
        hp: CONFIG.baseHp, maxHp: CONFIG.baseHp, team: 'blue',
        defenseCooldown: 0, rageActive: false, rageAnnounced: false
    };
    bases.red = {
        x: CONFIG.mapWidth - baseOffset - CONFIG.baseSize, y: CONFIG.mapHeight/2 - CONFIG.baseSize/2,
        w: CONFIG.baseSize, h: CONFIG.baseSize,
        hp: CONFIG.baseHp, maxHp: CONFIG.baseHp, team: 'red',
        defenseCooldown: 0, rageActive: false, rageAnnounced: false
    };
    if(currentMap === 'factory') {
        const floorZ = typeof getFactoryFloorZ === 'function' ? getFactoryFloorZ(1) : 500;
        bases.blue.x = 650;
        bases.blue.y = 150;
        bases.red.x = CONFIG.mapWidth - 650 - CONFIG.baseSize;
        bases.red.y = CONFIG.mapHeight - 150 - CONFIG.baseSize;
        bases.blue.factoryFloor = 1; bases.blue.z = floorZ;
        bases.red.factoryFloor = 1; bases.red.z = floorZ;
    }
    outposts = outpostPositions.map((pos, i) => ({
        x: pos.x, y: pos.y, name: pos.name || String.fromCharCode(65 + i),
        factoryFloor: Number.isInteger(pos.floor) ? pos.floor : null,
        z: Number.isInteger(pos.floor) && typeof getFactoryFloorZ === 'function' ? getFactoryFloorZ(pos.floor) : 0,
        owner: null, captureProgress: 0, capturingTeam: null, radius: CONFIG.outpostRadius
    }));
    if(gameMode === 'defense') outposts.forEach(op => op.owner = 'red');
    if(['sneak', 'ctf', 'infection', 'storm'].includes(gameMode)) outposts = [];

    if(currentMap === 'island') generateIslandTerrain();

    if(typeof initializeMapMechanics === 'function') initializeMapMechanics();

    if(typeof initializeDestructibleTerrain === 'function') initializeDestructibleTerrain();
    generateMapElements();
    if(typeof finalizeMapMechanicsElements === 'function') finalizeMapMechanicsElements();
}

function generateIslandTerrain() {
    // 整张地图以海水为底，七座独立小岛各自承载一个据点。
    terrainZones.push({ type: 'water', x: 0, y: 0, w: 7000, h: 7000 });
    const islands = [
        {x: 900, y: 1000, rx: 720, ry: 610}, {x: 3500, y: 900, rx: 760, ry: 580},
        {x: 6100, y: 1100, rx: 720, ry: 610}, {x: 900, y: 3500, rx: 800, ry: 700},
        {x: 3500, y: 3500, rx: 850, ry: 720}, {x: 6100, y: 3500, rx: 800, ry: 700},
        {x: 3500, y: 6100, rx: 820, ry: 650}
    ];
    islands.forEach((island, index) => terrainZones.push({ type: 'land', shape: 'ellipse', island: index + 1, ...island }));
    const links = [[0,1], [1,2], [0,3], [3,4], [4,5], [1,4], [4,6], [2,5]];
    links.forEach(([a, b]) => addIslandBridge(islands[a], islands[b]));
    // 避免树生成在水面或桥面上。
    obstacles = obstacles.filter(obs => !rectTouchesBlockingWater(obs.x, obs.y, obs.w, obs.h));
}

function addIslandBridge(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const distance = Math.hypot(dx, dy);
    terrainZones.push({
        type: 'bridge', centered: true,
        x: (a.x + b.x) / 2, y: (a.y + b.y) / 2,
        w: Math.max(420, distance - 1050), h: 210,
        angle: Math.atan2(dy, dx),
        archHeight: 72,
        deckThickness: 18
    });
}

function getBridgeHeightAt(x, y) {
    let height = 0;
    terrainZones.filter(zone => zone.type === 'bridge' && pointInTerrainZone(x, y, zone)).forEach(zone => {
        const cos = Math.cos(-(zone.angle || 0)), sin = Math.sin(-(zone.angle || 0));
        const dx = x - zone.x, dy = y - zone.y;
        const localX = dx * cos - dy * sin;
        const normalized = Math.min(1, Math.abs(localX) / Math.max(1, zone.w / 2));
        height = Math.max(height, (zone.archHeight || 0) * (1 - normalized * normalized));
    });
    return height;
}

function generateCityObstacles(outpostPositions) {
    const blockSize = 600, roadWidth = 170;
    for(let gx = 300; gx < CONFIG.mapWidth - 300; gx += blockSize) {
        for(let gy = 300; gy < CONFIG.mapHeight - 300; gy += blockSize) {
            const inset = roadWidth / 2;
            const x = gx + inset, y = gy + inset;
            const w = blockSize - roadWidth - 25, h = blockSize - roadWidth - 25;
            const nearBase = Math.hypot(x - 500, y - CONFIG.mapHeight / 2) < 650 ||
                Math.hypot(x - (CONFIG.mapWidth - 500), y - CONFIG.mapHeight / 2) < 650;
            const nearOutpost = outpostPositions.some(op => x < op.x + CONFIG.outpostRadius && x + w > op.x - CONFIG.outpostRadius && y < op.y + CONFIG.outpostRadius && y + h > op.y - CONFIG.outpostRadius);
            if(nearBase || nearOutpost) continue;
            obstacles.push({ x, y, w, h, type: 'building', floors: 3 + Math.floor(Math.random() * 8) });
        }
    }
}

function rectTouchesBlockingWater(x, y, w, h) {
    return isPositionInWater(x + w / 2, y + h / 2, Math.min(w, h) * 0.4);
}

function circleIntersectsRect(x, y, radius, rect) {
    const closestX = Math.max(rect.x, Math.min(x, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(y, rect.y + rect.h));
    return Math.hypot(x - closestX, y - closestY) < radius;
}

function isPositionInWater(x, y, radius = 0) {
    const inWater = terrainZones.some(z => z.type === 'water' && circleIntersectsRect(x, y, radius, z));
    if(!inWater) return false;
    const onLand = terrainZones.some(z => z.type === 'land' && pointInTerrainZone(x, y, z, radius));
    const onBridge = terrainZones.some(z => z.type === 'bridge' && pointInTerrainZone(x, y, z, radius));
    return !onLand && !onBridge;
}

function pointInTerrainZone(x, y, zone, padding = 0) {
    if(zone.shape === 'ellipse') {
        const nx = (x - zone.x) / Math.max(1, zone.rx + padding);
        const ny = (y - zone.y) / Math.max(1, zone.ry + padding);
        return nx * nx + ny * ny <= 1;
    }
    if(zone.centered) {
        const cos = Math.cos(-(zone.angle || 0)), sin = Math.sin(-(zone.angle || 0));
        const dx = x - zone.x, dy = y - zone.y;
        const localX = dx * cos - dy * sin, localY = dx * sin + dy * cos;
        return Math.abs(localX) <= zone.w / 2 + padding && Math.abs(localY) <= zone.h / 2 + padding;
    }
    return x >= zone.x - padding && x <= zone.x + zone.w + padding && y >= zone.y - padding && y <= zone.y + zone.h + padding;
}

function canTankCrossWater(tank) {
    return !!tank;
}

function isTankInWater(tank) {
    return !!tank && !tank.isFlying && isPositionInWater(tank.x, tank.y, CONFIG.tankSize * 0.55);
}

function generateMapElements() {
    mapElements = [];

    for(let i=0; i<20; i++) {
        let x = 800 + Math.random() * (CONFIG.mapWidth - 1600);
        let y = 800 + Math.random() * (CONFIG.mapHeight - 1600);
        if(isPositionInWater(x, y, 50)) continue;
        const distBlue = Math.hypot(x - bases.blue.x - bases.blue.w/2, y - bases.blue.y - bases.blue.h/2);
        const distRed = Math.hypot(x - bases.red.x - bases.red.w/2, y - bases.red.y - bases.red.h/2);
        if(distBlue < 500 || distRed < 500) continue;
        let overlapsObs = false;
        for(let obs of obstacles) {
            if(x + 30 > obs.x && x - 30 < obs.x + obs.w && y + 30 > obs.y && y - 30 < obs.y + obs.h) {
                overlapsObs = true; break;
            }
        }
        if(overlapsObs) continue;
        mapElements.push({
            type: 'mine', x, y, radius: 40 + Math.random() * 30,
            armed: true, triggerRadius: 25, damage: 300,
            blinkTimer: Math.random() * 2
        });
    }

    for(let i=0; i<15; i++) {
        let x = 600 + Math.random() * (CONFIG.mapWidth - 1200);
        let y = 600 + Math.random() * (CONFIG.mapHeight - 1200);
        if(isPositionInWater(x, y, 80)) continue;
        let overlapsObs = false;
        for(let obs of obstacles) {
            if(x + 80 > obs.x && x - 80 < obs.x + obs.w && y + 40 > obs.y && y - 40 < obs.y + obs.h) {
                overlapsObs = true; break;
            }
        }
        if(overlapsObs) continue;
        const angle = Math.random() * Math.PI;
        mapElements.push({
            type: 'boost', x, y, width: 120, height: 40,
            angle, speedMult: 1.5, duration: 3,
            color: '#00aaff'
        });
    }

    for(let i=0; i<25; i++) {
        let x = 500 + Math.random() * (CONFIG.mapWidth - 1000);
        let y = 500 + Math.random() * (CONFIG.mapHeight - 1000);
        if(isPositionInWater(x, y, 60)) continue;
        let overlap = false;
        for(let obs of obstacles) {
            if(x > obs.x - 50 && x < obs.x + obs.w + 50 && 
               y > obs.y - 50 && y < obs.y + obs.h + 50) {
                overlap = true; break;
            }
        }
        if(overlap) continue;
        mapElements.push({
            type: 'bush', x, y, radius: 60 + Math.random() * 40,
            stealthFactor: 0.4, color: '#2d5a1e'
        });
    }
}

function spawnTanks(tankData, ammo, mg, aa) {
    let blueCount = 10;
    let redCount = gameMode === 'sneak' ? 30 : 10;
    let blueBaseX = 800, blueBaseY = CONFIG.mapHeight / 2;
    if(gameMode === 'sneak') {
        const angle = Math.random() * Math.PI * 2;
        blueBaseX = CONFIG.mapWidth - 500 - CONFIG.baseSize - 1000 + Math.cos(angle) * 300;
        blueBaseY = CONFIG.mapHeight / 2 + Math.sin(angle) * 300;
    }
    player = createTank(tankData, blueBaseX, blueBaseY, 'blue', true);
    console.log('[SPAWN] Player created:', player ? 'success' : 'failed', 'x:', player ? player.x : 'N/A', 'y:', player ? player.y : 'N/A');
    player.shells = ammo; player.mg = mg; player.aa = aa;
    console.log('[SPAWN] Player ammo set - shells:', player.shells, 'mg:', player.mg, 'aa:', player.aa);
    player.maxShells = ammo; player.maxMG = mg; player.maxAA = aa;
    player.apsCharges = CONFIG.apsCharges;
    allies = [];
    const allyTypes = ['zuoyan29', 'zuoyan30', 'zuoyan31', 'zuoyan32', 'zuoyan33', 'zuoyan1', 'zuoyan_x', 'xingchen27a', 'xingchen27b', 'xingchen27c', 'xingchen27d', 'xingchen27e', 'xingchen27s', 'duoduo', 'duoduo_ifv', 'duoduo_spat', 'duoduo_eng', 'duoduo_rocket', 'duoduo_emp'];
    const allyCount = blueCount - 1;
    for(let i=0; i<allyCount; i++) {
        const type = allyTypes[i % allyTypes.length];
        const t = TANKS[type];
        let aAmmo, aMG;
        if(gameMode === 'defense') {
            aAmmo = Math.floor(t.maxShells * 3 * 0.6);
            aMG = Math.floor(t.maxMG * 3 * 0.6);
        } else {
            aAmmo = Math.floor(t.maxShells * 0.6);
            aMG = Math.floor(t.maxMG * 0.6);
        }
        const tank = createTank(t, blueBaseX + (Math.random()-0.5)*300, blueBaseY + (Math.random()-0.5)*300, 'blue', false);
        tank.shells = aAmmo; tank.mg = aMG; 
        tank.aa = Math.floor((t.maxAA ?? 15) * 0.5);
        tank.apsCharges = CONFIG.apsCharges;
        tank.aiAggro = 0.4 + Math.random() * 0.4;
        tank.aiDodgeTimer = 0;
        tank.aiDodgeDir = 0;
        tank.aiFocusFireTarget = null;
        tank.aiAmmoSaveMode = false;
        tank.aiLastState = '';
        tank.aiTeamCoord = Math.random() * Math.PI * 2;
        tank.aiReactionDelay = 0.15 + Math.random() * 0.3;
        tank.aiSkillLevel = gameConfig.difficulty === 'easy' ? 0.4 : gameConfig.difficulty === 'hard' ? 1.1 : 0.75;
        tank.aiBehavior = 0;
        tank.aiBehaviorTimer = 0;
        tank.aiFlankTarget = null;
        allies.push(tank);
    }
    enemies = [];
    const enemyTypes = ['xingchen27a', 'xingchen27b', 'xingchen27c', 'xingchen27d', 'xingchen27e', 'xingchen27s', 'duoduo', 'duoduo_ifv', 'duoduo_spat', 'duoduo_eng', 'duoduo_rocket', 'duoduo_emp', 'zuoyan29', 'zuoyan30', 'zuoyan31', 'zuoyan32', 'zuoyan33', 'zuoyan1', 'zuoyan_x'];
    const diffMult = gameConfig.difficulty === 'easy' ? 0.7 : gameConfig.difficulty === 'hard' ? 1.4 : 1.0;
    let redBaseX = CONFIG.mapWidth - 800;
    let redBaseY = CONFIG.mapHeight / 2;
    for(let i=0; i<redCount; i++) {
        const type = enemyTypes[i % enemyTypes.length];
        const t = TANKS[type];
        const eAmmo = Math.floor(t.maxShells * 0.95);
        const eMG = Math.floor(t.maxMG * 0.95);
        let ex, ey;
        if(gameMode === 'sneak') {
            const layer = Math.floor(i / 10);
            const idxInLayer = i % 10;
            const angle = (idxInLayer / 10) * Math.PI * 2 + layer * 0.3;
            const dist = 300 + layer * 400 + Math.random() * 200;
            ex = redBaseX + Math.cos(angle) * dist;
            ey = redBaseY + Math.sin(angle) * dist;
            let attempts = 0;
            while(attempts < 10) {
                let overlap = false;
                for(let existing of enemies) {
                    if(Math.hypot(existing.x - ex, existing.y - ey) < CONFIG.aiTankMinDistance) { overlap = true; break; }
                }
                if(!overlap) break;
                ex += (Math.random() - 0.5) * 200; ey += (Math.random() - 0.5) * 200;
                attempts++;
            }
        } else {
            ex = redBaseX - i*80;
            ey = redBaseY - 300 + i*200;
        }
        const tank = createTank(t, ex, ey, 'red', false);
        tank.hp = Math.floor(tank.hp * diffMult);
        tank.maxHp = tank.hp;
        tank.shells = eAmmo; tank.mg = eMG; 
        tank.aa = Math.floor((t.maxAA ?? 15) * 0.85);
        tank.apsCharges = CONFIG.apsCharges;
        tank.aiAggro = 0.8 + Math.random() * 0.4;
        tank.aiDodgeTimer = 0;
        tank.aiDodgeDir = 0;
        tank.aiFocusFireTarget = null;
        tank.aiAmmoSaveMode = false;
        tank.aiLastState = '';
        tank.aiTeamCoord = Math.random() * Math.PI * 2;
        tank.aiReactionDelay = 0.05 + Math.random() * 0.2;
        const baseSkill = gameConfig.difficulty === 'easy' ? 0.6 : gameConfig.difficulty === 'hard' ? 1.5 : 1.0;
        let redSkillMult = 1.4;
        if (gameMode === 'sneak') redSkillMult = 1.6;
        else if (gameMode === 'defense') redSkillMult = 1.5;
        else if (gameMode === 'ctf') redSkillMult = 1.3;
        else if (gameMode === 'infection') redSkillMult = 1.8;
        else if (gameMode === 'storm') redSkillMult = 1.2;
        tank.aiSkillLevel = baseSkill * redSkillMult;
        tank.aiDamageMult = gameConfig.difficulty === 'easy' ? 1.03 : gameConfig.difficulty === 'hard' ? 1.16 : 1.10;
        tank.hp = Math.floor(tank.hp * 1.25);
        tank.maxHp = tank.hp;
        tank.aiBehavior = AI_BEHAVIOR.NONE;
        tank.aiBehaviorTimer = 0;
        tank.aiFlankTarget = null;
        enemies.push(tank);
    }
    aiTanks = [...allies, ...enemies];
}

function createTank(data, x, y, team, isPlayer) {
    console.log('[CREATE_TANK] Creating tank:', data.name, 'at x:', x, 'y:', y, 'team:', team, 'isPlayer:', isPlayer);
    if(x === undefined || y === undefined || isNaN(x) || isNaN(y)) {
        console.error('[CREATE_TANK] Invalid position! x:', x, 'y:', y);
    }
    const id = Math.random().toString(36).substr(2, 9);
    return {
        x, y, z: data.isFlying ? CONFIG.helicopterAltitude : (currentMap === 'factory' && typeof getFactoryFloorZ === 'function' ? getFactoryFloorZ(1) : 0),
        factoryFloor: currentMap === 'factory' ? 1 : null,
        factoryElevatorRide: null,
        angle: team === 'blue' ? 0 : Math.PI,
        turretAngle: team === 'blue' ? 0 : Math.PI,
        gunElevation: data.isFlying ? 0 : CONFIG.shellDefaultElevation,
        shellElevation: CONFIG.shellDefaultElevation,
        aaElevation: CONFIG.aaDefaultElevation,
        muzzleFlashTimer: 0,
        muzzleFlashType: null,
        hp: data.hp, maxHp: data.maxHp,
        speed: data.speed, turnSpeed: data.turnSpeed,
        armor: data.armor, fireRate: data.fireRate,
        color: data.color, accent: data.accent, shape: data.shape,
        weight: data.weight || 1.0,
        isFlying: !!data.isFlying,
        canPassObstacles: !!data.canPassObstacles,
        helicopterCollisionHits: 0,
        helicopterCollisionReset: 0,
        helicopterCollisionCooldown: 0,
        helicopterOnFire: false,
        helicopterFireTimer: 0,
        team, isPlayer,
        shells: 0, mg: 0, aa: 0,
        maxShells: data.maxShells, maxMG: data.maxMG, maxAA: data.maxAA ?? 15,
        apsCharges: CONFIG.apsCharges, apsCooldown: 0,
        aaCooldown: 0,
        fireCooldown: 0, mgCooldown: 0,
        repairCooldown: 0,
        ammoRackExploded: false,
        suddenDeathInfiniteAmmo: false,
        ricochetSpeedBoost: 0,
        ricochetSpeedBoostTimer: 0,
        turretSize: data.turretSize,
        dead: false, invincible: 3,
        target: null, pathTimer: 0, moveTarget: null, lastShotTime: 0,
        aiState: 'combat', aiStateTimer: 0, aiCaptureTarget: null,
        aiStayTimer: 0, aiLastPos: {x, y},
        exhaustColor: data.exhaustColor, id: id,
        path: null, 
        pathRefreshTimer: 0,
        stuckTimer: 0, lastPos: {x, y}, patrolCenter: null,
        tankType: Object.keys(TANKS).find(key => TANKS[key].name === data.name) || 'xingchen27a',
        ultimateData: data.ultimate,
        ultimateCooldown: isPlayer ? 0 : (data.ultimate ? data.ultimate.cooldown : 0),
        ultimateActive: false, ultimateTimer: 0,
        ultimateCharging: false, ultimateChargeTimer: 0,
        speedBoost: 0, turnBoost: 0,
        shieldActive: false, shieldHp: 0, armorBoost: 0,
        rescueShieldActive: false,
        canMove: true, trailDebuff: 0, turretSpeedMult: 1.0,
        shieldProtected: false, shieldOwner: null,
        ghostActive: false, ghostTimer: 0, ghostRevealed: false,
        overheatActive: false, overheatTimer: 0,
        fortressActive: false, fortressTimer: 0, reflectActive: false,
        teleportCooldown: 0,
        stormActive: false, stormTimer: 0, stormOriginalMgCooldown: 0,
        nailLocking: false, nailLockTimer: 0, nailTarget: null, nailLaserAngle: 0,
        aiDodgeTimer: 0, aiDodgeDir: 0, aiFocusFireTarget: null,
        aiAmmoSaveMode: false, aiLastState: '', aiTeamCoord: 0,
        aiReactionDelay: 0.1, aiSkillLevel: 0.85,
        aiBehavior: AI_BEHAVIOR.NONE,
        aiBehaviorTimer: 0,
        aiFlankTarget: null,
        mapSpeedBoost: 0,
        mapBoostTimer: 0,
        mapArmorBonus: 0,
        mapSlow: 0,
        mapSlowTimer: 0,
        prevPos: {x: x, y: y},
        autoAimTimer: 0,
        autoAimTarget: null,
        autoAimActive: false,
        autoAimLockOn: false,
        lastManualAimTime: 0,
        speedBuffFromCommander: 0,
        fireRateBuff: 0,
        commanderBuffOwner: null,
        minimapJammed: false,
        minimapJamTimer: 0,
        isInfected: false,
        infectionLevel: 0,
        originalTeam: null,
        isClone: false,
        cloneOwner: null,
        cloneTimer: 0,
        toxinActive: false,
        toxinTimer: 0,
        revealActive: false,
        revealTimer: 0,
        linkActive: false,
        linkTimer: 0,
        linkedAlly: null,
        linkedTo: null,
        damageReduction: 0,
        judgeActive: false,
        judgeTimer: 0,
        judgeTarget: null,
        judged: false,
        judgeOwner: null,
        toxinDebuffTimer: 0, toxinTickTimer: 0, toxinDamage: 0, toxinSlow: 0,
        burnTimer: 0, burnTickTimer: 0, burnDamage: 0,
        snowIdleTimer: 0, freezeLevel: 0, freezeDamageTimer: 1, waterDamageTimer: 1,
        environmentLastPos: {x, y}, lastSnowTrackPos: {x, y}
    };
}

function initOutposts() {
    outposts.forEach(op => { outpostSpawnTimers[op.name] = CONFIG.outpostSpawnInterval; });
}

function initSpatialGrid() {
    spatialGrid.clear();
    spatialGridKeys.length = 0;
}

function getSpatialKey(x, y) {
    const gx = Math.floor(x / CONFIG.spatialGridSize);
    const gy = Math.floor(y / CONFIG.spatialGridSize);
    return `${gx},${gy}`;
}

function updateSpatialGrid() {
    spatialGrid.clear();
    spatialGridKeys.length = 0;
    const allTanks = [player, ...allies, ...enemies].filter(t => t && !t.dead);
    allTanks.forEach(tank => {
        const key = getSpatialKey(tank.x, tank.y);
        if(!spatialGrid.has(key)) {
            spatialGrid.set(key, []);
            spatialGridKeys.push(key);
        }
        spatialGrid.get(key).push(tank);
    });
}

function getNearbyTanks(x, y, radius) {
    const results = [];
    const rCells = Math.ceil(radius / CONFIG.spatialGridSize);
    const centerGx = Math.floor(x / CONFIG.spatialGridSize);
    const centerGy = Math.floor(y / CONFIG.spatialGridSize);
    
    for(let dx = -rCells; dx <= rCells; dx++) {
        for(let dy = -rCells; dy <= rCells; dy++) {
            const key = `${centerGx + dx},${centerGy + dy}`;
            const cell = spatialGrid.get(key);
            if(cell) {
                cell.forEach(tank => {
                    if(Math.hypot(tank.x - x, tank.y - y) <= radius) {
                        results.push(tank);
                    }
                });
            }
        }
    }
    return results;
}


// ==================== 游戏主循环 ====================
function gameLoop(timestamp) {
    try {
        // 渲染帧率下降时使用多个最大 50ms 的逻辑子步，避免游戏速度跟着 FPS 一起变慢。
        const frameDt = Math.min(Math.max(0, (timestamp - lastTime) / 1000), 0.12);
        lastTime = timestamp;

        // 帧率监控（每60帧显示一次）
        if (!window._fpsCounter) window._fpsCounter = 0;
        if (!window._fpsTime) window._fpsTime = timestamp;
        window._fpsCounter++;
        if (window._fpsCounter >= 60) {
            const fps = Math.round(60000 / (timestamp - window._fpsTime));
            if (fps < 30) console.warn('[FPS] 帧率过低:', fps);
            window._fpsCounter = 0;
            window._fpsTime = timestamp;
        }
        if(gameState === 'playing') { 
            if(player && (isNaN(player.x) || isNaN(player.y))) {
                console.error('[GAME_LOOP] Player NaN detected before update! x:', player.x, 'y:', player.y);
            }
            let remainingDt = frameDt;
            while(remainingDt > 0 && gameState === 'playing') {
                const stepDt = Math.min(remainingDt, 0.05);
                update(stepDt);
                remainingDt -= stepDt;
            }
            if(player && (isNaN(player.x) || isNaN(player.y))) {
                console.error('[GAME_LOOP] Player NaN detected after update! x:', player.x, 'y:', player.y);
            }
            render(); 
        }
        else if(gameState === 'menu' || gameState === 'start') {
            ctx.fillStyle = '#0a0a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    } catch(e) {
        console.error('Game loop error:', e);
    }
    requestAnimationFrame(gameLoop);
}


// ==================== 更新逻辑 ====================
function update(dt) {
    if(!player) {
        console.log('[UPDATE] Player not found, skipping update');
        return;
    }

    // 清理死亡坦克，防止内存泄漏和卡顿
    const beforeClean = allies.length + enemies.length;
    allies = allies.filter(t => t && !t.dead);
    enemies = enemies.filter(t => t && !t.dead);
    const afterClean = allies.length + enemies.length;
    if (beforeClean !== afterClean) {
        console.log('[CLEANUP] 清理死亡坦克:', beforeClean - afterClean, '辆');
    }

    gameTime -= dt;
    if(gameTime <= 0) {
        if(typeof handleBattleTimeExpired === 'function' && handleBattleTimeExpired()) {
            updateTimer();
            return;
        }
        if(gameMode === 'defense') endGame('defenseVictory');
        else if(gameMode === 'ctf') endGame(ctfScores.blue >= ctfScores.red ? 'victory' : 'playerDead');
        else if(gameMode === 'storm') {
            const blueAlive = [player, ...allies].filter(t => t && !t.dead).length;
            const redAlive = enemies.filter(t => t && !t.dead).length;
            endGame(blueAlive >= redAlive && player && !player.dead ? 'victory' : 'playerDead');
        }
        else if(gameMode === 'infection') {
            const survivors = [player, ...allies].filter(t => t && !t.dead && !t.isInfected).length;
            endGame(survivors > 0 || (player && player.isInfected && !player.dead) ? 'victory' : 'playerDead');
        }
        else endGame('time');
        return;
    }
    
    updateSpatialGrid();
    
    updateOutposts(dt);
    updateOutpostSpawns(dt);
    if(!['ctf', 'infection', 'storm'].includes(gameMode)) updateBaseDefense(dt);
    
    updateMinimapJam(dt);

    updateTank(player, dt);
    if(typeof updateEngineAudio === 'function') updateEngineAudio(player);
    if(typeof updateScreenShake === 'function') updateScreenShake(dt);
    recordSurvivalState(player, dt);
    allies.forEach(t => { if(!t.dead) updateAITank(t, dt); });
    enemies.forEach(t => { if(!t.dead) updateAITank(t, dt); });
    updateEnvironment(dt);
    if(typeof updateMapMechanics === 'function') updateMapMechanics(dt);
    if(typeof updateBattleSystems === 'function') updateBattleSystems(dt);
    if(typeof updateTerrainDestruction === 'function') updateTerrainDestruction(dt);
    updateBullets(dt);
    updateParticles(dt);
    updateExhaustTrails(dt);
    updateTrailEffects(dt);
    updateDamageNumbers(dt);
    resolveTankCollisions();
    checkCollisions();
    if(typeof updateCombatReplayBuffer === 'function') updateCombatReplayBuffer(dt);
    updateMapElements(dt);
    checkWinCondition();
    if(gameState !== 'playing') return;
    updateUltimates(dt);
    updateHUD();
    updateTimer();
    updateCoordDisplay();
    updateUltimateUI();
    updateGameModes(dt);
}

function updateMinimapJam(dt) {
    const allTanks = [player, ...allies, ...enemies].filter(t => t && !t.dead);
    allTanks.forEach(tank => {
        if(tank.minimapJamTimer > 0) {
            tank.minimapJamTimer -= dt;
            if(tank.minimapJamTimer <= 0) {
                tank.minimapJammed = false;
                tank.minimapJamTimer = 0;
            }
        }
    });
}


// ==================== 自动瞄准系统 ====================
function updateAutoAim(tank, dt) {
    if (tank.dead) return;
    tank.autoAimTimer = (tank.autoAimTimer || 0) - dt;

    if (tank.isPlayer) {
        const now = Date.now();
        if (now - tank.lastManualAimTime < 2000) {
            tank.autoAimActive = false;
            tank.autoAimLockOn = false;
            return;
        }
    }

    if (tank.autoAimTimer <= 0) {
        tank.autoAimTimer = CONFIG.autoAimInterval;
        findAutoAimTarget(tank);
    }

    const autoAimRange = getMapVisionRange(tank);
    if (tank.autoAimTarget && (tank.autoAimTarget.dead ||
        Math.hypot(tank.autoAimTarget.x - tank.x, tank.autoAimTarget.y - tank.y) > autoAimRange)) {
        tank.autoAimTarget = null;
        tank.autoAimActive = false;
        tank.autoAimLockOn = false;
    }

    if (tank.autoAimTarget && !tank.autoAimTarget.dead) {
        performAutoAimRotation(tank, dt);
    }
}

function findAutoAimTarget(tank) {
    const enemyList = tank.team === 'blue' ? enemies.filter(e => !e.dead) : 
                      [...allies.filter(a => !a.dead), ...(player && !player.dead ? [player] : [])];

    let bestTarget = null;
    let bestScore = -Infinity;

    const autoAimRange = getMapVisionRange(tank);
    enemyList.forEach(enemy => {
        if(typeof areEntitiesOnSameFactoryFloor === 'function' && !areEntitiesOnSameFactoryFloor(tank, enemy)) return;
        const dist = Math.hypot(enemy.x - tank.x, enemy.y - tank.y);
        if (dist > autoAimRange) return;
        const hasLOS = lineOfSight(tank.x, tank.y, enemy.x, enemy.y, tank.factoryFloor);
        let score = 1000 - dist;
        if (hasLOS) score += 500;
        if (enemy.isPlayer) score += 300;
        if (enemy.hp < enemy.maxHp * 0.3) score += 200;
        if (enemy.armor > 1.5) score -= 100;
        if (score > bestScore) {
            bestScore = score;
            bestTarget = enemy;
        }
    });

    tank.autoAimTarget = bestTarget;
    tank.autoAimActive = !!bestTarget;
    tank.autoAimLockOn = !!bestTarget;
}

function performAutoAimRotation(tank, dt) {
    if (!tank.autoAimTarget || tank.autoAimTarget.dead) return;
    const target = tank.autoAimTarget;
    const dist = Math.hypot(target.x - tank.x, target.y - tank.y);
    const predictTime = dist / CONFIG.bulletSpeed * CONFIG.autoAimPredictFactor;
    const targetVelX = target.x - (target.prevPos ? target.prevPos.x : target.x);
    const targetVelY = target.y - (target.prevPos ? target.prevPos.y : target.y);
    const predictedX = target.x + targetVelX * predictTime;
    const predictedY = target.y + targetVelY * predictTime;
    const targetAngle = Math.atan2(predictedY - tank.y, predictedX - tank.x);
    let angleDiff = targetAngle - tank.turretAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    const maxRotateSpeed = CONFIG.autoAimSmoothSpeed * 60 * dt;
    const rotateAmount = Math.max(-maxRotateSpeed, Math.min(maxRotateSpeed, angleDiff));
    tank.turretAngle += rotateAmount;
    tank.autoAimLockOn = Math.abs(angleDiff) < 0.15;
}

function getNearestEnemy(tank) {
    const enemyList = tank.team === 'blue' ? enemies.filter(e => !e.dead) : 
                      [...allies.filter(a => !a.dead), ...(player && !player.dead ? [player] : [])];
    let nearest = null;
    let minDist = Infinity;
    const autoAimRange = getMapVisionRange(tank);
    enemyList.forEach(enemy => {
        if(typeof areEntitiesOnSameFactoryFloor === 'function' && !areEntitiesOnSameFactoryFloor(tank, enemy)) return;
        const dist = Math.hypot(enemy.x - tank.x, enemy.y - tank.y);
        if (dist < minDist && dist < autoAimRange) {
            minDist = dist;
            nearest = enemy;
        }
    });
    return nearest;
}

function getMapVisionRange(tank = null) {
    if(currentMap === 'desert') return environmentState.sandstormActive ? 520 : 1800;
    return CONFIG.autoAimRange;
}

function updateBaseDefense(dt) {
    [bases.blue, bases.red].forEach(base => {
        if(!base || base.hp <= 0) return;
        if(base.defenseCooldown > 0) base.defenseCooldown -= dt;
        const enemyList = base.team === 'blue' ? enemies.filter(e => !e.dead) : [...allies.filter(a => !a.dead), ...(player && !player.dead ? [player] : [])];
        const rageThreshold = base.maxHp * CONFIG.baseRageThreshold;
        if(!base.rageActive && base.hp <= rageThreshold) {
            base.rageActive = true;
            base.rageAnnounced = true;
            base.defenseCooldown = Math.min(base.defenseCooldown, 0.25);
            const centerX = base.x + base.w / 2, centerY = base.y + base.h / 2;
            createParticles(centerX, centerY, 36, base.team === 'blue' ? '#44aaff' : '#ff3322', 2.4);
            if(typeof addBattleAnnouncement === 'function') addBattleAnnouncement(base.team, `⚠ ${base.team === 'blue' ? '蓝方' : '红方'}基地进入残血狂暴！`);
            if(typeof playWorldSound === 'function') playWorldSound('ammoRack', centerX, centerY, 0.72);
        }
        const candidates = [];
        enemyList.forEach(e => {
            if(currentMap === 'factory' && typeof areEntitiesOnSameFactoryFloor === 'function' && !areEntitiesOnSameFactoryFloor(base, e)) return;
            const d = Math.hypot(e.x - (base.x + base.w/2), e.y - (base.y + base.h/2));
            if(d < CONFIG.baseDefenseRange) candidates.push({ tank: e, distance: d });
        });
        if(candidates.length && base.defenseCooldown <= 0) {
            const target = base.rageActive
                ? candidates.reduce((nearest, entry) => entry.distance < nearest.distance ? entry : nearest).tank
                : candidates[Math.floor(Math.random() * candidates.length)].tank;
            const angle = Math.atan2(target.y - (base.y + base.h/2), target.x - (base.x + base.w/2));
            const damage = CONFIG.baseDefenseDamage * (base.rageActive ? CONFIG.baseRageDamageMultiplier : 1);
            bullets.push({
                x: base.x + base.w/2 + Math.cos(angle) * 60,
                y: base.y + base.h/2 + Math.sin(angle) * 60,
                z: (base.z || 0) + 24,
                vx: Math.cos(angle) * 15, vy: Math.sin(angle) * 15,
                damage, team: base.team, baseDefense: true, baseRage: !!base.rageActive,
                type: 'shell', owner: null, life: 2.0, hitTanks: new Set(), maxTargetHits: 1
            });
            base.turretAngle = angle;
            base.defenseCooldown = CONFIG.baseDefenseCooldown / (base.rageActive ? CONFIG.baseRageFireRateMultiplier : 1);
        }
    });
}

function updateTank(tank, dt) {
    if(tank.dead) return;
    if(tank.isPlayer && (isNaN(tank.x) || isNaN(tank.y))) {
        console.error('[UPDATE_TANK] Player position is NaN at start of updateTank! x:', tank.x, 'y:', tank.y, 'angle:', tank.angle);
    }
    if(tank.invincible > 0) tank.invincible -= dt;
    if(tank.fireCooldown > 0) tank.fireCooldown -= dt;
    if(tank.mgCooldown > 0) tank.mgCooldown -= dt;
    if(tank.aaCooldown > 0) tank.aaCooldown -= dt;
    updateStatusEffects(tank, dt);
    if(tank.isFlying && typeof updateHelicopterFlight === 'function') updateHelicopterFlight(tank, dt);
    if(tank.dead) return;
    if(tank.trailDebuff > 0) {
        tank.trailDebuff -= dt;
        if(tank.trailDebuff <= 0) tank.turretSpeedMult = 1.0;
    }
    let moveX = 0, moveY = 0;
    if(tank.isPlayer) {
        if(keys['KeyW'] || keys['ArrowUp']) moveY = -1;
        if(keys['KeyS'] || keys['ArrowDown']) moveY = 1;
        if(keys['KeyA'] || keys['ArrowLeft']) moveX = -1;
        if(keys['KeyD'] || keys['ArrowRight']) moveX = 1;
        if(joystick.active) { moveX = joystick.dx; moveY = joystick.dy; }
        tank.engineLoad = Math.min(1, Math.hypot(moveX, moveY));
        const worldMouse = screenToWorld(mouse.x, mouse.y);
        const worldMouseX = worldMouse.x;
        const worldMouseY = worldMouse.y;
        tank.turretAngle = Math.atan2(worldMouseY - tank.y, worldMouseX - tank.x);
        if(mouse.down) {
            if(currentWeapon === 'shell') {
                if(tank.fireCooldown <= 0 && (tank.shells > 0 || tank.suddenDeathInfiniteAmmo)) {
                    fireBullet(tank, 'shell');
                    tank.fireCooldown = CONFIG.fireCooldown / (tank.fireRate * (1 + (tank.fireRateBuff || 0)));
                    if(navigator.vibrate) navigator.vibrate(30);
                }
            } else if(currentWeapon === 'mg') {
                if(tank.mgCooldown <= 0 && (tank.mg > 0 || tank.suddenDeathInfiniteAmmo)) {
                    fireBullet(tank, 'mg');
                    tank.mgCooldown = CONFIG.mgCooldown / (tank.fireRate * (1 + (tank.fireRateBuff || 0)));
                }
            } else if(currentWeapon === 'aa') {
                if((tank.aaCooldown || 0) <= 0 && ((tank.aa || 0) > 0 || tank.suddenDeathInfiniteAmmo)) {
                    fireBullet(tank, 'aa');
                    tank.aaCooldown = CONFIG.aaCooldown / tank.fireRate;
                    if(navigator.vibrate) navigator.vibrate(20);
                }
            } else if(currentWeapon === 'bomb') {
                if(tank.fireCooldown <= 0 && (tank.shells > 0 || tank.suddenDeathInfiniteAmmo)) {
                    fireBullet(tank, 'bomb');
                    tank.fireCooldown = 0.95 / tank.fireRate;
                    if(navigator.vibrate) navigator.vibrate(24);
                }
            } else if(currentWeapon === 'airmg') {
                if(tank.mgCooldown <= 0 && (tank.mg > 0 || tank.suddenDeathInfiniteAmmo)) {
                    fireBullet(tank, 'airmg');
                    tank.mgCooldown = 0.095 / tank.fireRate;
                }
            }
        }
    }
    updateAutoAim(tank, dt);

    if(!tank.canMove) return;
    const canPassObstacles = !tank.isFlying && (tank.canPassObstacles || (tank.ghostActive && tank.ultimateData && tank.ultimateData.canPassObstacles));
    if(moveX !== 0 || moveY !== 0) {
        const len = Math.sqrt(moveX*moveX + moveY*moveY);
        if(len > 0) { moveX /= len; moveY /= len; }
        const actualSpeed = getActualSpeed(tank);
        const targetAngle = Math.atan2(moveY, moveX);
        let diff = targetAngle - tank.angle;
        while(diff > Math.PI) diff -= Math.PI*2;
        while(diff < -Math.PI) diff += Math.PI*2;
        const turnSpeed = tank.turnSpeed * (tank.turnBoost || 1) * tank.turretSpeedMult;
        tank.angle += diff * turnSpeed * 60 * dt;
        const moveSpeed = actualSpeed * 60 * dt;
        const newX = tank.x + Math.cos(tank.angle) * moveSpeed;
        const newY = tank.y + Math.sin(tank.angle) * moveSpeed;
        if(tank.isPlayer && (isNaN(newX) || isNaN(newY))) {
            console.error('[UPDATE_TANK] newX/newY is NaN! tank.x:', tank.x, 'tank.y:', tank.y, 'tank.angle:', tank.angle, 'moveSpeed:', moveSpeed, 'actualSpeed:', actualSpeed);
        }
        if(canPassObstacles || !checkObstacleCollision(newX, newY, CONFIG.tankSize, tank)) {
            tank.x = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapWidth - CONFIG.tankSize, newX));
            tank.y = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapHeight - CONFIG.tankSize, newY));
            if(tank.isPlayer && (isNaN(tank.x) || isNaN(tank.y))) {
                console.error('[UPDATE_TANK] Player position became NaN after movement! newX:', newX, 'newY:', newY);
            }
        } else if(tank.isFlying && typeof registerHelicopterCollision === 'function') registerHelicopterCollision(tank);
        if(Math.random() < 0.3) addExhaustTrail(tank);
    }
}

function updateEnvironment(dt) {
    const allTanks = [player, ...allies, ...enemies].filter(t => t && !t.dead);

    if(currentMap === 'desert') {
        if(environmentState.sandstormActive) {
            environmentState.sandstormTimer -= dt;
            if(environmentState.sandstormTimer <= 0) {
                environmentState.sandstormActive = false;
                environmentState.nextSandstorm = 25 + Math.random() * 35;
                environmentState.windStrength = 0;
                showNotification('沙尘暴已经散去，视野恢复', '#e2b66f');
            }
        } else {
            environmentState.nextSandstorm -= dt;
            if(environmentState.nextSandstorm <= 0) {
                environmentState.sandstormActive = true;
                environmentState.sandstormTimer = 10 + Math.random() * 8;
                environmentState.windAngle = Math.random() * Math.PI * 2;
                environmentState.windStrength = 1;
                showNotification('⚠ 沙尘暴来袭：视野降低，直升机受侧风影响', '#c47a2c');
            }
        }
        if(environmentState.sandstormActive) {
            allTanks.filter(t => t.isFlying).forEach(tank => {
                const drift = 42 * environmentState.windStrength * dt;
                tank.x = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapWidth - CONFIG.tankSize, tank.x + Math.cos(environmentState.windAngle) * drift));
                tank.y = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapHeight - CONFIG.tankSize, tank.y + Math.sin(environmentState.windAngle) * drift));
            });
        }
    }

    if(currentMap === 'island') {
        allTanks.forEach(tank => {
            if(!tank.isFlying) tank.z = getBridgeHeightAt(tank.x, tank.y);
            if(tank.isFlying || tank.tankType === 'duoduo_ifv' || !isTankInWater(tank)) {
                tank.waterDamageTimer = 1;
                return;
            }
            tank.waterDamageTimer = (tank.waterDamageTimer || 1) - dt;
            if(tank.waterDamageTimer <= 0) {
                const waterDamage = 34;
                applyDirectDamage(tank, waterDamage, null, '车体进水');
                showDamageNumber(tank.x, tank.y - 32, waterDamage);
                tank.waterDamageTimer = 1;
            }
        });
    }

    if(currentMap === 'snow') {
        allTanks.filter(tank => tank.isFlying).forEach(tank => {
            tank.freezeDamageTimer = (tank.freezeDamageTimer || 1) - dt;
            if(tank.freezeDamageTimer <= 0) {
                applyDirectDamage(tank, 8, null, '旋翼结冰');
                if(tank === player) showDamageNumber(tank.x, tank.y - 35, 8);
                tank.freezeDamageTimer = 1;
            }
        });
    }

    for(let i = snowTracks.length - 1; i >= 0; i--) {
        snowTracks[i].life -= dt;
        if(snowTracks[i].life <= 0) snowTracks.splice(i, 1);
    }
    if(currentMap !== 'snow') return;
    allTanks.forEach(tank => {
        if(tank.isFlying) return;
        const last = tank.environmentLastPos || {x: tank.x, y: tank.y};
        const moved = Math.hypot(tank.x - last.x, tank.y - last.y);
        if(moved > 1.5) {
            tank.snowIdleTimer = 0;
            tank.freezeLevel = Math.max(0, (tank.freezeLevel || 0) - dt * 0.28);
            addSnowTrack(tank);
        } else {
            tank.snowIdleTimer = (tank.snowIdleTimer || 0) + dt;
            if(tank.snowIdleTimer > 5) {
                tank.freezeLevel = Math.min(1, (tank.freezeLevel || 0) + dt * 0.16);
                tank.freezeDamageTimer = (tank.freezeDamageTimer || 1) - dt;
                if(tank.freezeDamageTimer <= 0) {
                    const coldDamage = Math.round(6 + tank.freezeLevel * 14);
                    applyDirectDamage(tank, coldDamage, null, '引擎冻结');
                    if(tank === player) showDamageNumber(tank.x, tank.y - 35, coldDamage);
                    tank.freezeDamageTimer = 1;
                }
            }
        }
        tank.environmentLastPos.x = tank.x;
        tank.environmentLastPos.y = tank.y;
    });
}

function addSnowTrack(tank) {
    const last = tank.lastSnowTrackPos || {x: tank.x, y: tank.y};
    if(Math.hypot(tank.x - last.x, tank.y - last.y) < 18) return;
    const sideX = Math.cos(tank.angle + Math.PI / 2) * CONFIG.tankSize * 0.62;
    const sideY = Math.sin(tank.angle + Math.PI / 2) * CONFIG.tankSize * 0.62;
    snowTracks.push({ x1: tank.x + sideX, y1: tank.y + sideY, x2: tank.x - sideX, y2: tank.y - sideY, angle: tank.angle, life: 14, maxLife: 14 });
    if(snowTracks.length > 420) snowTracks.splice(0, snowTracks.length - 420);
    tank.lastSnowTrackPos.x = tank.x;
    tank.lastSnowTrackPos.y = tank.y;
}

function updateStatusEffects(tank, dt) {
    if(!tank || tank.dead) return;
    if(tank.muzzleFlashTimer > 0) tank.muzzleFlashTimer = Math.max(0, tank.muzzleFlashTimer - dt);
    if(tank.apsCooldown > 0) tank.apsCooldown -= dt;
    if(tank.ricochetSpeedBoostTimer > 0) {
        tank.ricochetSpeedBoostTimer -= dt;
        if(tank.ricochetSpeedBoostTimer <= 0) tank.ricochetSpeedBoost = 0;
    }
    if(tank.isClone && tank.cloneTimer > 0) {
        tank.cloneTimer -= dt;
        if(tank.cloneTimer <= 0) tank.dead = true;
    }
    if(tank.toxinDebuffTimer > 0) {
        tank.toxinDebuffTimer -= dt;
        tank.toxinTickTimer -= dt;
        if(tank.toxinTickTimer <= 0) {
            tank.toxinTickTimer += 1;
            applyDirectDamage(tank, tank.toxinDamage || 0, null, '毒素伤害');
        }
        if(tank.toxinDebuffTimer <= 0) tank.toxinSlow = 0;
    }
    if(tank.burnTimer > 0) {
        tank.burnTimer -= dt;
        tank.burnTickTimer -= dt;
        if(tank.burnTickTimer <= 0) {
            tank.burnTickTimer += 1;
            applyDirectDamage(tank, tank.burnDamage || 0, null, '燃烧伤害');
        }
    }
}


// ==================== 检查胜利条件 ====================
function checkWinCondition() {
    if(gameMode === 'defense') {
        const blueAlive = !player.dead || allies.some(a => !a.dead);
        if(!blueAlive) { endGame('defenseFailAllDead'); return; }
        if(bases.blue.hp <= 0) { endGame('defenseFailBase'); return; }
        return;
    }
    if(gameMode === 'sneak') {
        if(player.dead) { endGame('playerDead'); return; }
        if(bases.blue.hp <= 0) { endGame('baseDestroyed'); return; }
        if(bases.red.hp <= 0) { endGame('victory'); return; }
        return;
    }
    // [修复] 感染模式：没有基地，胜利条件是消灭所有感染者或所有幸存者被感染
    if(gameMode === 'infection') {
        const blueSurvivors = [...allies, player].filter(t => t && !t.dead && !t.isInfected);
        const aliveInfected = [...enemies, ...allies].filter(t => t && !t.dead && t.isInfected);
        // 所有幸存者被感染或死亡
        if(blueSurvivors.length === 0) {
            if(player && player.isInfected && !player.dead) {
                endGame('victory'); // 玩家被感染且存活，感染者胜利
            } else {
                endGame('playerDead'); // 玩家死亡且未被感染
            }
            return;
        }
        // 所有感染者被消灭
        if(aliveInfected.length === 0) {
            endGame('victory'); // 幸存者胜利
            return;
        }
        return;
    }
    // [修复] 风暴模式：没有基地，胜利条件是活到最后
    if(gameMode === 'storm') {
        const aliveBlue = [player, ...allies].filter(t => t && !t.dead);
        const aliveRed = enemies.filter(t => t && !t.dead);
        // 玩家死亡
        if(player && player.dead) {
            endGame('playerDead');
            return;
        }
        // 只有玩家一方存活
        if(aliveRed.length === 0 && aliveBlue.length > 0) {
            endGame('victory');
            return;
        }
        // 时间到，按存活人数判断
        if(gameTime <= 0) {
            if(aliveBlue.length >= aliveRed.length) {
                endGame('victory');
            } else {
                endGame('playerDead');
            }
            return;
        }
        return;
    }
    // [修复] 夺旗模式：没有基地，胜利条件是先得3分
    if(gameMode === 'ctf') {
        if(player && player.dead) {
            endGame('playerDead');
            return;
        }
        if(ctfScores.blue >= 3) {
            endGame('victory');
            return;
        }
        if(ctfScores.red >= 3) {
            endGame('playerDead');
            return;
        }
        return;
    }
    // 经典模式
    if(player.dead) { endGame('playerDead'); return; }
    if(bases.blue.hp <= 0) { endGame('baseDestroyed'); return; }
    if(bases.red.hp <= 0) { endGame('victory'); return; }
}

function endGame(reason) {
    if(gameState === 'ended' || gameState === 'replay') return;
    if(reason === 'playerDead' && typeof startCombatReplay === 'function' && startCombatReplay(reason)) return;
    finishEndGame(reason);
}

function finishEndGame(reason) {
    if(gameState === 'ended') return;
    const winner = typeof getWinningScoreTeam === 'function' ? getWinningScoreTeam() : (reason === 'victory' ? 'blue' : 'red');
    gameState = 'ended';
    if(typeof stopEngineAudio === 'function') stopEngineAudio();
    const overlay = document.getElementById('matchResultOverlay');
    const title = document.getElementById('matchResultTitle');
    const blueScore = document.getElementById('resultBlueScore');
    const redScore = document.getElementById('resultRedScore');
    if(blueScore) blueScore.textContent = teamScores.blue.toLocaleString('zh-CN');
    if(redScore) redScore.textContent = teamScores.red.toLocaleString('zh-CN');
    if(title) {
        title.textContent = winner === 'draw' ? '平局' : winner === 'blue' ? '蓝方胜利' : '红方胜利';
        title.style.color = winner === 'draw' ? '#ffd86b' : winner === 'blue' ? '#66b7ff' : '#ff7474';
    }
    if(overlay) overlay.classList.add('active');
    // 成就存档异常不应阻止胜负界面出现。
    try {
        endMatchStats(winner === 'blue' ? 'victory' : 'defeat');
    } catch(error) {
        console.warn('[RESULT] match statistics could not be saved:', error);
    }
}

function returnToHome() { resetGame(); }

function restartLastGame() {
    if(!lastMatchSetup) { resetGame(); return; }
    const setup = { ...lastMatchSetup };
    resetGame();
    currentMap = setup.currentMap;
    selectGameMode(setup.gameMode);
    selectedTank = setup.selectedTank;
    const values = { ammoSlider: setup.ammo, mgSlider: setup.mg, aaSlider: setup.aa };
    Object.entries(values).forEach(([id, value]) => { const element = document.getElementById(id); if(element) element.value = value; });
    const dayNight = document.getElementById('dayNight'); if(dayNight) dayNight.value = setup.dayNight;
    const difficulty = document.getElementById('difficulty'); if(difficulty) difficulty.value = setup.difficulty;
    const viewMode = document.getElementById('viewMode'); if(viewMode) viewMode.value = setup.viewMode;
    const mapSelect = document.getElementById('mapSelect'); if(mapSelect) mapSelect.value = setup.currentMap;
    ['ammo', 'mg', 'aa'].forEach(key => { const output = document.getElementById(`${key}Value`); if(output) output.textContent = setup[key]; });
    const startButton = document.getElementById('startBtn'); if(startButton) startButton.disabled = false;
    startGame();
}

function resetGame() {
    console.log('[RESET] 游戏重置开始');
    // 清理游戏状态
    gameState = 'start';
    helicopterLiftInput = 0;
    if(typeof resetCombatReplay === 'function') resetCombatReplay();
    if(typeof stopEngineAudio === 'function') stopEngineAudio();
    if(typeof resetBattleSystems === 'function') resetBattleSystems();
    selectedTank = null;
    allies = []; enemies = []; bullets = []; particles = []; exhaustTrails = [];
    trailEffects = []; damageNumbers = []; outposts = []; aiTanks = []; player = null;

    // 重置画布
    if(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // 切换界面
    document.getElementById('gameUI').classList.remove('active');
    document.getElementById('gameUI').style.display = 'none';
    document.getElementById('menu').classList.remove('active');
    document.getElementById('menu').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
    document.getElementById('message').style.display = 'none';
    const resultOverlay = document.getElementById('matchResultOverlay');
    if(resultOverlay) resultOverlay.classList.remove('active');
    document.getElementById('startBtn').disabled = true;
    const threeHudLayer = document.getElementById('threeHudLayer');
    const threeThreatBorder = document.getElementById('threeThreatBorder');
    const threeCanvas = document.getElementById('threeCanvas');
    if(threeHudLayer) threeHudLayer.style.display = 'none';
    if(threeThreatBorder) threeThreatBorder.style.display = 'none';
    if(threeCanvas) threeCanvas.style.display = 'none';
    if(canvas) canvas.style.display = 'block';
    if(typeof clearThreeHudElements === 'function') clearThreeHudElements();

    // 重新初始化
    setupStartScreen();
    setupMenu();
}


// ==================== 大招更新 ====================
function updateUltimates(dt) {
    if(player && !player.dead) {
        if(player.ultimateCooldown > 0) player.ultimateCooldown -= dt;
        if(player.tankType === 'zuoyan29' && player.ultimateActive) {
            player.ultimateTimer -= dt;
            if(Math.random() < 0.8) addTrailEffect(player);
            checkTrailDebuff(player);
            if(player.ultimateTimer <= 0) endUltimate(player);
        }
        if(player.tankType === 'zuoyan30' && player.ghostActive) {
            player.ghostTimer -= dt; player.ultimateTimer -= dt;
            if(player.ghostTimer <= 0 || player.ghostRevealed) {
                // 幽灵结束：如果卡在障碍物里，向后移动到安全位置
                if(checkObstacleCollision(player.x, player.y, CONFIG.tankSize, player)) {
                    const angle = player.angle + Math.PI;
                    for(let dist = 10; dist < 300; dist += 10) {
                        const nx = player.x + Math.cos(angle) * dist;
                        const ny = player.y + Math.sin(angle) * dist;
                        if(!checkObstacleCollision(nx, ny, CONFIG.tankSize, player)) {
                            player.x = nx; player.y = ny; break;
                        }
                    }
                }
                const enemyList = player.team === 'blue' ? enemies.filter(e => !e.dead) : [...allies.filter(a => !a.dead)];
                let nearest = null, minDist = Infinity;
                enemyList.forEach(e => { const d = Math.hypot(e.x - player.x, e.y - player.y); if(d < minDist && d < (player.ultimateData.stunRadius || 120)) { minDist = d; nearest = e; } });
                if(nearest) {
                    nearest.trailDebuff = player.ultimateData.stunDuration || 1.0;
                    nearest.turretSpeedMult = 0; nearest.canMove = false;
                    setTimeout(() => { if(nearest) { nearest.canMove = true; nearest.turretSpeedMult = 1.0; } }, (player.ultimateData.stunDuration || 1.0) * 1000);
                    createParticles(nearest.x, nearest.y, 15, '#00aaff', 1.5);
                }
                endUltimate(player);
            }
        }
        if(player.tankType === 'zuoyan1' && player.ultimateActive) {
            player.ultimateTimer -= dt;
            if(player.ultimateTimer <= 0) {
                player.overheatActive = true; player.overheatTimer = player.ultimateData.overheatDuration || 3;
                player.speedBoost = 0; player.canMove = false; player.ultimateActive = false;
                createParticles(player.x, player.y, 10, '#ff4400', 1);
            }
        }
        if(player.tankType === 'zuoyan1' && player.overheatActive) {
            player.overheatTimer -= dt;
            if(player.overheatTimer <= 0) { player.overheatActive = false; player.canMove = true; player.speedBoost = 0; }
        }
        if(player.tankType === 'xingchen27a' && player.ultimateActive) {
            player.ultimateTimer -= dt;
            if(player.shieldActive) redirectShieldDamage(player);
            if(player.ultimateTimer <= 0 || player.shieldHp <= 0) endUltimate(player);
        }
        if(player.tankType === 'xingchen27b' && player.fortressActive) {
            player.fortressTimer -= dt; player.ultimateTimer -= dt;
            if(player.fortressTimer <= 0) endUltimate(player);
        }
        if(player.tankType === 'xingchen27s' && player.ultimateActive) {
            player.ultimateTimer -= dt;
            if(player.ultimateTimer <= 0 || player.shieldHp <= 0) endUltimate(player);
        }
        if(player.tankType === 'duoduo' && player.ultimateCharging) {
            player.ultimateChargeTimer -= dt;
            if(player.ultimateChargeTimer <= 0) {
                fireUltimateSalvo(player);
                player.ultimateCharging = false; player.canMove = true; player.ultimateActive = false;
            }
        }
        if(player.tankType === 'duoduo_ifv' && player.stormActive) {
            player.stormTimer -= dt; player.ultimateTimer -= dt;
            if(player.stormTimer <= 0) endUltimate(player);
        }
        if(player.tankType === 'duoduo_spat' && player.nailLocking) {
            player.nailLockTimer -= dt;
            if(player.nailTarget && !player.nailTarget.dead) player.nailLaserAngle = Math.atan2(player.nailTarget.y - player.y, player.nailTarget.x - player.x);
            if(player.nailLockTimer <= 0) {
                fireNailShot(player); player.nailLocking = false; player.canMove = true;
                player.ultimateActive = false; player.nailTarget = null;
            }
        }
    }
    aiTanks.forEach(tank => { 
        if(!tank.dead && !tank.isPlayer) {
            updateAIActiveUltimate(tank, dt);
            updateAIUltimate(tank, dt); 
        }
    });

    // 玩家终极技能状态更新
    if(player && !player.dead) {
        if(player.tankType === 'duoduo_emp' && player.ultimateActive) {
            player.ultimateTimer -= dt;
            if(player.ultimateTimer <= 0) endUltimate(player);
        }
        if(player.tankType === 'zuoyan31' && player.ultimateActive) {
            player.ultimateTimer -= dt;
            if(player.ultimateTimer <= 0) endUltimate(player);
        }
        if(player.tankType === 'zuoyan32' && player.ultimateActive) {
            player.ultimateTimer -= dt;
            if(player.ultimateTimer <= 0) {
                const allTanks = [...allies, ...enemies];
                allTanks.forEach(t => { if(t.isClone && t.cloneOwner === player) t.dead = true; });
                endUltimate(player);
            }
        }
        if(player.tankType === 'zuoyan33' && player.toxinActive) {
            player.toxinTimer -= dt;
            if(player.toxinTimer <= 0) { player.toxinActive = false; endUltimate(player); }
        }
        if(player.tankType === 'xingchen27c' && player.revealActive) {
            player.revealTimer -= dt;
            if(player.revealTimer <= 0) { player.revealActive = false; endUltimate(player); }
        }
        if(player.tankType === 'xingchen27d' && player.linkActive) {
            player.linkTimer -= dt;
            if(player.linkTimer <= 0) {
                if(player.linkedAlly) { player.linkedAlly.linkedTo = null; player.linkedAlly.damageReduction = 0; }
                player.linkActive = false; player.linkedAlly = null; endUltimate(player);
            }
        }
        if(player.tankType === 'xingchen27e' && player.judgeActive) {
            player.judgeTimer -= dt;
            if(player.judgeTimer <= 0) {
                if(player.judgeTarget) { player.judgeTarget.judged = false; player.judgeTarget.judgeOwner = null; }
                player.judgeActive = false; player.judgeTarget = null; endUltimate(player);
            }
        }
        if(player.tankType === 'duoduo_eng' && player.ultimateActive) {
            player.ultimateTimer -= dt;
            if(player.ultimateTimer <= 0) endUltimate(player);
        }
        if(player.tankType === 'duoduo_rocket' && player.ultimateActive) {
            player.ultimateTimer -= dt;
            if(player.ultimateTimer <= 0) endUltimate(player);
        }
        if(player.tankType === 'zuoyan_x' && player.ultimateActive) {
            player.ultimateTimer -= dt;
            if(player.ultimateTimer <= 0) endUltimate(player);
        }
    }
}

function updateAIActiveUltimate(tank, dt) {
    if(tank.overheatActive) {
        tank.overheatTimer -= dt;
        if(tank.overheatTimer <= 0) { tank.overheatActive = false; tank.canMove = true; }
    }
    if(tank.ultimateCharging) {
        tank.ultimateChargeTimer -= dt;
        if(tank.ultimateChargeTimer <= 0) {
            fireUltimateSalvo(tank);
            tank.ultimateCharging = false;
            endUltimate(tank);
        }
        return;
    }
    if(tank.nailLocking) {
        tank.nailLockTimer -= dt;
        if(tank.nailTarget && !tank.nailTarget.dead) tank.nailLaserAngle = Math.atan2(tank.nailTarget.y - tank.y, tank.nailTarget.x - tank.x);
        if(tank.nailLockTimer <= 0) {
            fireNailShot(tank);
            endUltimate(tank);
        }
        return;
    }
    if(!tank.ultimateActive && !tank.ghostActive && !tank.fortressActive && !tank.stormActive) return;
    if(tank.tankType === 'xingchen27a' && tank.shieldActive) redirectShieldDamage(tank);
    if(!Number.isFinite(tank.ultimateTimer) || tank.ultimateTimer <= 0) tank.ultimateTimer = 0.1;
    tank.ultimateTimer -= dt;
    if(tank.ghostActive) tank.ghostTimer -= dt;
    if(tank.fortressActive) tank.fortressTimer -= dt;
    if(tank.stormActive) tank.stormTimer -= dt;
    if(tank.tankType === 'zuoyan1' && tank.ultimateTimer <= 0) {
        endUltimate(tank);
        tank.overheatActive = true;
        tank.overheatTimer = tank.ultimateData.overheatDuration || 3;
        tank.canMove = false;
        return;
    }
    if(tank.ultimateTimer <= 0 || (tank.ghostActive && tank.ghostTimer <= 0) ||
       (tank.fortressActive && tank.fortressTimer <= 0) || (tank.stormActive && tank.stormTimer <= 0)) {
        endUltimate(tank);
    }
}

function addTrailEffect(tank) {
    const ult = tank.ultimateData; if(!ult) return;
    trailEffects.push({ x: tank.x, y: tank.y, life: ult.trailDuration, maxLife: ult.trailDuration, team: tank.team, owner: tank, radius: 60 });
}

function checkTrailDebuff(tank) {
    const ult = tank.ultimateData; if(!ult) return;
    const enemyList = tank.team === 'blue' ? enemies : [...allies, ...(player && !player.dead ? [player] : [])];
    enemyList.forEach(enemy => {
        if(enemy.dead) return;
        const dist = Math.hypot(enemy.x - tank.x, enemy.y - tank.y);
        if(dist < 80) { enemy.trailDebuff = ult.debuffDuration; enemy.turretSpeedMult = ult.debuffTurretSlow; }
    });
}

function redirectShieldDamage(tank) {
    const ult = tank.ultimateData; if(!ult) return;
    const allyList = tank.team === 'blue' ? [...allies.filter(a => !a.dead), ...(player && !player.dead ? [player] : [])] : enemies.filter(e => !e.dead);
    allyList.forEach(ally => {
        if(ally === tank) return;
        const dist = Math.hypot(ally.x - tank.x, ally.y - tank.y);
        if(dist < ult.shieldRadius) { ally.shieldProtected = true; ally.shieldOwner = tank; }
        else { ally.shieldProtected = false; ally.shieldOwner = null; }
    });
}

function fireUltimateSalvo(tank) {
    const ult = tank.ultimateData; if(!ult) return;
    const angle = tank.turretAngle;
    const halfSpread = ult.spreadAngle / 2;
    for(let i = 0; i < ult.shellCount; i++) {
        const shellAngle = angle - halfSpread + (ult.spreadAngle / (ult.shellCount - 1)) * i;
        const damage = ult.damagePerShell;
        bullets.push({
            x: tank.x + Math.cos(shellAngle) * (tank.turretSize + 20),
            y: tank.y + Math.sin(shellAngle) * (tank.turretSize + 20),
            vx: Math.cos(shellAngle) * CONFIG.bulletSpeed,
            vy: Math.sin(shellAngle) * CONFIG.bulletSpeed,
            damage: damage, team: tank.team, type: 'shell', owner: tank, life: 2.0, hitTanks: new Set()
        });
    }
    createParticles(tank.x, tank.y, 20, '#ff8800', 2);
}


// ==================== 启动 ====================
window.onload = init;
