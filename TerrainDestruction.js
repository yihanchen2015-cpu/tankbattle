// ==================== 可破坏地形与轻量碎片物理 ====================
// 战术掩体仍使用原有 AABB 碰撞；飞散碎块只做重力、旋转、反弹和阻尼模拟，避免密集战时引入昂贵的通用刚体求解。
const TERRAIN_DEBRIS_GRAVITY = 360;
const TERRAIN_DEBRIS_LIMIT = 180;
const TERRAIN_PATH_REFRESH_DELAY = 0.18;

let terrainDebris = [];
let terrainRevision = 0;
let terrainGeneration = 0;
let terrainObstacleSerial = 1;
let terrainDebrisSerial = 1;
let terrainPathDirty = false;
let terrainPathRefreshTimer = 0;

function getTerrainObstacleColor(obs) {
    if(obs.type === 'oilBarrel') return '#9a3f20';
    if(['factoryPlatform','factoryWall','factoryBoundary','factoryElevatorShaft','factoryFacility','factoryCrate'].includes(obs.type)) return '#6f7478';
    if(obs.type === 'volcanicRock') return '#423b38';
    if(obs.type === 'tree') return '#416f32';
    if(obs.type === 'rock') return '#8a633a';
    if(obs.type === 'ice') return '#9fc7d8';
    if(obs.type === 'building') return '#5d6670';
    if(obs.type === 'rubble') return '#625b54';
    return '#5a4328';
}

function getTerrainObstacleDurability(obs) {
    if(!obs || obs.type === 'rubble') return Infinity;
    if(obs.type === 'tree') return 95;
    if(obs.type === 'rock') return 260;
    if(obs.type === 'ice') return 210;
    if(obs.type === 'building') return 520 + (obs.floors || 4) * 55;
    if(obs.type === 'factoryPlatform') return 1000;
    if(obs.type === 'factoryWall') return 780;
    if(obs.type === 'factoryFacility') return 700;
    if(obs.type === 'factoryCrate') return 260;
    if(obs.type === 'factoryBoundary' || obs.type === 'factoryElevatorShaft') return Infinity;
    if(obs.type === 'oilBarrel') return 1;
    if(obs.type === 'volcanicRock') return 310;
    return 320;
}

function initializeObstacleDurability(obs) {
    if(!obs) return obs;
    if(!obs.terrainId) obs.terrainId = `terrain-${terrainGeneration}-${terrainObstacleSerial++}`;
    if(obs.type === 'rubble') {
        obs.destructible = false;
        obs.terrainHp = Infinity;
        obs.maxTerrainHp = Infinity;
        obs.rubbleSeed = obs.rubbleSeed === undefined ? Math.random() : obs.rubbleSeed;
        obs.rubbleHeight = obs.rubbleHeight || Math.max(18, Math.min(42, Math.min(obs.w, obs.h) * 0.42));
        return obs;
    }
    obs.destructible = true;
    obs.visualRevision = obs.visualRevision || 0;
    obs.maxTerrainHp = Number.isFinite(obs.maxTerrainHp) ? obs.maxTerrainHp : getTerrainObstacleDurability(obs);
    obs.terrainHp = Number.isFinite(obs.terrainHp) ? obs.terrainHp : obs.maxTerrainHp;
    obs.collapseStage = obs.collapseStage || 0;
    return obs;
}

function initializeDestructibleTerrain() {
    terrainGeneration++;
    terrainRevision++;
    terrainObstacleSerial = 1;
    terrainDebrisSerial = 1;
    terrainDebris = [];
    terrainPathDirty = false;
    terrainPathRefreshTimer = 0;
    obstacles.forEach(initializeObstacleDurability);
}

function markTerrainStructureChanged() {
    terrainRevision++;
    terrainPathDirty = true;
    terrainPathRefreshTimer = TERRAIN_PATH_REFRESH_DELAY;
}

function refreshTerrainNavigation() {
    if(typeof initPathGrid === 'function') initPathGrid();
    const tanks = [typeof player !== 'undefined' ? player : null,
        ...(typeof allies !== 'undefined' ? allies : []),
        ...(typeof enemies !== 'undefined' ? enemies : [])];
    tanks.forEach(tank => {
        if(!tank) return;
        tank.path = null;
        tank.pathRefreshTimer = 0;
    });
}

function spawnTerrainDebris(x, y, color, power = 1, count = 12, material = 'stone') {
    const mobileLimit = typeof touchControlMode !== 'undefined' && touchControlMode ? 70 : TERRAIN_DEBRIS_LIMIT;
    const actualCount = Math.max(2, Math.min(count, typeof touchControlMode !== 'undefined' && touchControlMode ? 9 : 22));
    for(let i = 0; i < actualCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const planarSpeed = (34 + Math.random() * 92) * power;
        terrainDebris.push({
            id: `debris-${terrainGeneration}-${terrainDebrisSerial++}`,
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            z: 5 + Math.random() * 18,
            vx: Math.cos(angle) * planarSpeed,
            vy: Math.sin(angle) * planarSpeed,
            vz: (85 + Math.random() * 135) * power,
            rotation: Math.random() * Math.PI * 2,
            angularVelocity: (Math.random() - 0.5) * 10,
            size: 5 + Math.random() * (material === 'wood' ? 13 : 18),
            color, material,
            bounce: material === 'wood' ? 0.28 : 0.2,
            life: 4.2 + Math.random() * 2.2,
            maxLife: 6.4
        });
    }
    if(terrainDebris.length > mobileLimit) terrainDebris.splice(0, terrainDebris.length - mobileLimit);
}

function updateTerrainDestruction(dt) {
    for(let i = terrainDebris.length - 1; i >= 0; i--) {
        const piece = terrainDebris[i];
        piece.life -= dt;
        piece.vz -= TERRAIN_DEBRIS_GRAVITY * dt;
        piece.x += piece.vx * dt;
        piece.y += piece.vy * dt;
        piece.z += piece.vz * dt;
        piece.rotation += piece.angularVelocity * dt;
        const drag = Math.pow(piece.z <= 0 ? 0.05 : 0.76, dt);
        piece.vx *= drag;
        piece.vy *= drag;
        piece.angularVelocity *= Math.pow(0.64, dt);
        if(piece.z <= 0) {
            piece.z = 0;
            if(Math.abs(piece.vz) > 38) piece.vz = -piece.vz * piece.bounce;
            else piece.vz = 0;
        }
        if(piece.life <= 0) terrainDebris.splice(i, 1);
    }
    if(terrainPathDirty) {
        terrainPathRefreshTimer -= dt;
        if(terrainPathRefreshTimer <= 0) {
            terrainPathDirty = false;
            refreshTerrainNavigation();
        }
    }
}

function removeTerrainObstacle(obs) {
    const index = obstacles.indexOf(obs);
    if(index >= 0) obstacles.splice(index, 1);
}

function createRubblePiece(x, y, w, h, source, seedOffset = 0) {
    if(w < 18 || h < 18) return null;
    const rubble = {
        x, y, w, h, type: 'rubble',
        sourceType: source && source.type,
        rubbleSeed: ((source && source.rubbleSeed) || Math.random()) + seedOffset,
        rubbleHeight: Math.max(18, Math.min(42, Math.min(w, h) * (0.32 + Math.random() * 0.18)))
    };
    initializeObstacleDurability(rubble);
    obstacles.push(rubble);
    return rubble;
}

function createRubbleCover(zone, source, fullCollapse = false) {
    const pieces = [];
    const horizontal = zone.w >= zone.h;
    if(horizontal) {
        const pieceW = zone.w * (fullCollapse ? 0.3 : 0.38);
        pieces.push(createRubblePiece(zone.x + zone.w * 0.05, zone.y + zone.h * 0.12, pieceW, zone.h * 0.7, source, 0.17));
        pieces.push(createRubblePiece(zone.x + zone.w * 0.58, zone.y + zone.h * 0.28, zone.w * 0.34, zone.h * 0.58, source, 0.53));
    } else {
        const pieceH = zone.h * (fullCollapse ? 0.3 : 0.38);
        pieces.push(createRubblePiece(zone.x + zone.w * 0.12, zone.y + zone.h * 0.05, zone.w * 0.7, pieceH, source, 0.29));
        pieces.push(createRubblePiece(zone.x + zone.w * 0.28, zone.y + zone.h * 0.58, zone.w * 0.58, zone.h * 0.34, source, 0.71));
    }
    return pieces.filter(Boolean);
}

function getClosestCollapseSide(obs, hitX, hitY) {
    const distances = [
        { side: 'left', value: Math.abs(hitX - obs.x) / Math.max(1, obs.w) },
        { side: 'right', value: Math.abs(obs.x + obs.w - hitX) / Math.max(1, obs.w) },
        { side: 'top', value: Math.abs(hitY - obs.y) / Math.max(1, obs.h) },
        { side: 'bottom', value: Math.abs(obs.y + obs.h - hitY) / Math.max(1, obs.h) }
    ];
    distances.sort((a, b) => a.value - b.value);
    return distances[0].side;
}

function collapseBuildingSection(obs, hitX, hitY, source) {
    if(!obs || obs.type !== 'building') return false;
    obs.collapseStage = (obs.collapseStage || 0) + 1;
    obs.visualRevision = (obs.visualRevision || 0) + 1;
    const old = { x: obs.x, y: obs.y, w: obs.w, h: obs.h };
    if(obs.collapseStage >= 3 || obs.w < 155 || obs.h < 155) {
        removeTerrainObstacle(obs);
        createRubbleCover(old, obs, true);
    } else {
        const side = getClosestCollapseSide(obs, hitX, hitY);
        let zone;
        if(side === 'left' || side === 'right') {
            const cut = Math.min(obs.w * 0.34, Math.max(88, obs.w * 0.27));
            zone = { x: side === 'left' ? obs.x : obs.x + obs.w - cut, y: obs.y, w: cut, h: obs.h };
            if(side === 'left') obs.x += cut;
            obs.w -= cut;
        } else {
            const cut = Math.min(obs.h * 0.34, Math.max(88, obs.h * 0.27));
            zone = { x: obs.x, y: side === 'top' ? obs.y : obs.y + obs.h - cut, w: obs.w, h: cut };
            if(side === 'top') obs.y += cut;
            obs.h -= cut;
        }
        obs.floors = Math.max(2, (obs.floors || 4) - 1);
        createRubbleCover(zone, obs, false);
    }
    spawnTerrainDebris(hitX, hitY, '#716961', 1.35, 20, 'stone');
    if(typeof createParticles === 'function') createParticles(hitX, hitY, 32, '#8b8178', 2.8);
    if(typeof playWorldSound === 'function') playWorldSound('ammoRack', hitX, hitY, 0.72);
    if(source && source.isPlayer && typeof showMessage === 'function') showMessage('🏚 建筑局部坍塌，废墟已形成新掩体', '#d7c0a6');
    markTerrainStructureChanged();
    return true;
}

function destroySmallTerrainObstacle(obs, hitX, hitY, source) {
    const material = obs.type === 'tree' ? 'wood' : 'stone';
    const color = getTerrainObstacleColor(obs);
    removeTerrainObstacle(obs);
    spawnTerrainDebris(hitX, hitY, color, obs.type === 'tree' ? 1.05 : 1.25, obs.type === 'tree' ? 15 : 18, material);
    if(typeof createParticles === 'function') createParticles(hitX, hitY, 18, color, 2);
    if(typeof playWorldSound === 'function') playWorldSound('hit', hitX, hitY, source && source.isPlayer ? 0.8 : 0.5);
    markTerrainStructureChanged();
    return true;
}

function getTerrainWeaponMultiplier(type) {
    return ({ shell: 1, rocket: 1.45, bomb: 1.3, ammoRack: 1.1 })[type] || 0;
}

function damageObstacleAtPoint(obs, rawDamage, weaponType, hitX, hitY, source = null) {
    if(!obs || obs.type === 'rubble') return false;
    if(obs.indestructible || obs.type === 'factoryBoundary') return false;
    if(obs.type === 'oilBarrel' && typeof triggerOilBarrelExplosion === 'function') return triggerOilBarrelExplosion(obs, source);
    initializeObstacleDurability(obs);
    const multiplier = getTerrainWeaponMultiplier(weaponType);
    if(multiplier <= 0) return false;
    const damage = Math.max(0, rawDamage * multiplier);
    if(damage <= 0) return false;
    obs.terrainHp -= damage;
    obs.lastTerrainHit = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if(obs.type === 'building') {
        const threshold = obs.maxTerrainHp * (1 - (obs.collapseStage + 1) * 0.27);
        if(obs.terrainHp <= 0 || obs.terrainHp <= threshold) return collapseBuildingSection(obs, hitX, hitY, source);
        if(typeof createParticles === 'function') createParticles(hitX, hitY, 9, '#948a80', 1.2);
        return true;
    }
    if(obs.type === 'factoryPlatform') {
        if(obs.terrainHp <= 0 && typeof collapseFactoryPlatform === 'function') return collapseFactoryPlatform(obs, hitX, hitY, source);
        if(typeof createParticles === 'function') createParticles(hitX, hitY, 10, '#a08b72', 1.25);
        return true;
    }
    if(obs.terrainHp <= 0) return destroySmallTerrainObstacle(obs, hitX, hitY, source);
    if(typeof createParticles === 'function') createParticles(hitX, hitY, 7, getTerrainObstacleColor(obs), 1);
    return true;
}

function damageTerrainInRadius(x, y, radius, rawDamage, weaponType, source = null) {
    let damaged = 0;
    const snapshot = obstacles.slice();
    snapshot.forEach(obs => {
        if(!obs || obs.type === 'rubble') return;
        const closestX = Math.max(obs.x, Math.min(x, obs.x + obs.w));
        const closestY = Math.max(obs.y, Math.min(y, obs.y + obs.h));
        const distance = Math.hypot(x - closestX, y - closestY);
        if(distance > radius) return;
        const falloff = Math.max(0.3, 1 - distance / Math.max(1, radius));
        if(damageObstacleAtPoint(obs, rawDamage * falloff, weaponType, closestX, closestY, source)) damaged++;
    });
    return damaged;
}

function drawRubbleObstacle(context, obs) {
    const seed = obs.rubbleSeed || 0.5;
    const insetA = 0.08 + (seed * 0.17) % 0.12;
    const insetB = 0.07 + (seed * 0.31) % 0.14;
    context.save();
    context.fillStyle = '#5c5650';
    context.strokeStyle = '#292724';
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(obs.x + obs.w * insetA, obs.y);
    context.lineTo(obs.x + obs.w, obs.y + obs.h * insetB);
    context.lineTo(obs.x + obs.w * (0.84 - insetB * 0.2), obs.y + obs.h);
    context.lineTo(obs.x, obs.y + obs.h * (0.72 + insetA * 0.3));
    context.closePath();
    context.fill(); context.stroke();
    context.fillStyle = '#81766c';
    context.fillRect(obs.x + obs.w * 0.18, obs.y + obs.h * 0.2, obs.w * 0.28, obs.h * 0.22);
    context.fillStyle = '#3e3b37';
    context.fillRect(obs.x + obs.w * 0.56, obs.y + obs.h * 0.5, obs.w * 0.25, obs.h * 0.18);
    context.restore();
}

function drawTerrainDamageOverlay(context, obs) {
    if(!obs || obs.type === 'rubble' || !Number.isFinite(obs.terrainHp) || !Number.isFinite(obs.maxTerrainHp)) return;
    const damageRatio = 1 - obs.terrainHp / Math.max(1, obs.maxTerrainHp);
    if(damageRatio < 0.18) return;
    const cx = obs.x + obs.w * 0.52, cy = obs.y + obs.h * 0.46;
    context.save();
    context.strokeStyle = `rgba(35,28,24,${Math.min(0.82, 0.25 + damageRatio * 0.7)})`;
    context.lineWidth = Math.max(2, Math.min(6, Math.min(obs.w, obs.h) * 0.035));
    context.beginPath();
    context.moveTo(cx, obs.y + obs.h * 0.08);
    context.lineTo(cx - obs.w * 0.08, cy);
    context.lineTo(cx + obs.w * 0.05, cy + obs.h * 0.13);
    context.lineTo(cx - obs.w * 0.12, obs.y + obs.h * 0.9);
    context.moveTo(cx - obs.w * 0.08, cy);
    context.lineTo(obs.x + obs.w * 0.12, cy + obs.h * 0.04);
    context.moveTo(cx + obs.w * 0.05, cy + obs.h * 0.13);
    context.lineTo(obs.x + obs.w * 0.9, obs.y + obs.h * 0.72);
    context.stroke();
    context.restore();
}

function drawTerrainDebris2D(context) {
    terrainDebris.forEach(piece => {
        const alpha = Math.max(0, Math.min(1, piece.life / 1.2));
        context.save();
        context.globalAlpha = alpha * 0.25;
        context.fillStyle = '#111';
        context.fillRect(piece.x - piece.size * 0.45, piece.y - piece.size * 0.22, piece.size, piece.size * 0.46);
        context.globalAlpha = alpha;
        context.translate(piece.x, piece.y - piece.z);
        context.rotate(piece.rotation);
        context.fillStyle = piece.color;
        context.fillRect(-piece.size / 2, -piece.size * 0.34, piece.size, piece.size * 0.68);
        context.restore();
    });
}
