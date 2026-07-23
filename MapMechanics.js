// ==================== 特殊地图机制 ====================
// 火山和工厂共用一个轻量状态容器，避免把地图事件混入坦克/武器主逻辑。
let mapMechanicsState = createEmptyMapMechanicsState();

function createEmptyMapMechanicsState() {
    return {
        time: 0,
        lava: null,
        crystals: [],
        lavaBalls: [],
        nextEruption: Infinity,
        fireZones: [],
        crane: null,
        factory: null
    };
}

function initializeMapMechanics() {
    if(typeof disposeFactoryPhysics === 'function') disposeFactoryPhysics();
    mapMechanicsState = createEmptyMapMechanicsState();
    if(currentMap === 'volcano') generateVolcanoMechanics();
    else if(currentMap === 'factory') generateFactoryMechanics();
}

function generateVolcanoMechanics() {
    const river = {
        type: 'lava',
        points: [
            {x: 3850, y: 420, width: 250},
            {x: 4180, y: 900, width: 330},
            {x: 3650, y: 1850, width: 285},
            {x: 4310, y: 2950, width: 390},
            {x: 3770, y: 4050, width: 310},
            {x: 4240, y: 5150, width: 355},
            {x: 3860, y: 6250, width: 270},
            {x: 4100, y: 6580, width: 320}
        ],
        flowPhase: Math.random() * Math.PI * 2
    };
    mapMechanicsState.lava = river;
    terrainZones.push(river);

    const crystals = [
        {type: 'crystal', x: 250, y: 450, w: 820, h: 920},
        {type: 'crystal', x: 6930, y: 450, w: 820, h: 920},
        {type: 'crystal', x: 250, y: 5630, w: 820, h: 920},
        {type: 'crystal', x: 6930, y: 5630, w: 820, h: 920}
    ];
    mapMechanicsState.crystals = crystals;
    terrainZones.push(...crystals);
    mapMechanicsState.nextEruption = 30 + Math.random() * 30;

    // 不让随机岩石完全堵住熔岩河与结晶防守区。
    obstacles = obstacles.filter(obs => {
        const cx = obs.x + obs.w / 2, cy = obs.y + obs.h / 2;
        return !isPointInLava(cx, cy, Math.max(obs.w, obs.h) * 0.35) && !isPointInCoolingCrystal(cx, cy);
    });
}

function generateFactoryMechanics() {
    const floorSlabs = [0, 1, 2].map(factoryFloor => ({
        type: 'factoryFloorSlab', x: 0, y: 0, w: CONFIG.mapWidth, h: CONFIG.mapHeight,
        factoryFloor, z: getFactoryFloorZ(factoryFloor)
    }));
    const roofSlab = {
        type:'factoryCeilingSlab', x:0, y:0, w:CONFIG.mapWidth, h:CONFIG.mapHeight,
        factoryFloor:2, z:getFactoryFloorZ(3)
    };
    terrainZones.push(...floorSlabs, roofSlab);

    const conveyors = [
        {type:'conveyor', x:600, y:480, w:1980, h:220, factoryFloor:0, dirX:1, dirY:0, speed:82},
        {type:'conveyor', x:2300, y:700, w:220, h:1550, factoryFloor:0, dirX:0, dirY:1, speed:68},
        {type:'conveyor', x:500, y:2250, w:1800, h:220, factoryFloor:0, dirX:-1, dirY:0, speed:76},
        {type:'conveyor', x:520, y:850, w:220, h:1200, factoryFloor:0, dirX:0, dirY:-1, speed:62}
    ];
    terrainZones.push(...conveyors);

    const elevators = [
        {type:'factoryElevator', id:'E-A', x:220, y:220, w:320, h:320, platformZ:0, currentFloor:0, targetFloor:0, direction:1, dwell:5, dwellTime:5, speed:240, doorsOpen:true},
        {type:'factoryElevator', id:'E-B', x:2460, y:2460, w:320, h:320, platformZ:getFactoryFloorZ(2), currentFloor:2, targetFloor:2, direction:-1, dwell:5, dwellTime:5, speed:240, doorsOpen:true}
    ];
    const ramps = [
        {type:'factoryRamp', id:'R-B1-1F', x:180, y:1050, w:230, h:900, axis:'y', reverse:false, fromFloor:0, toFloor:1, fromZ:getFactoryFloorZ(0), toZ:getFactoryFloorZ(1), deckThickness:18, guardrailHeight:64, guardrailWidth:14},
        {type:'factoryRamp', id:'R-1F-2F', x:2590, y:1050, w:230, h:900, axis:'y', reverse:true, fromFloor:1, toFloor:2, fromZ:getFactoryFloorZ(1), toZ:getFactoryFloorZ(2), deckThickness:18, guardrailHeight:64, guardrailWidth:14}
    ];
    terrainZones.push(...elevators, ...ramps);

    // 一整座建筑的连续外墙，从 B1 地面延伸到 2F 天花板。
    [
        [0,0,3000,110], [0,2890,3000,110], [0,0,110,3000], [2890,0,110,3000]
    ].forEach(rect => obstacles.push({
        x:rect[0], y:rect[1], w:rect[2], h:rect[3], type:'factoryBoundary',
        z:0, worldHeight:getFactoryFloorZ(3), indestructible:true,
        maxTerrainHp:Infinity, terrainHp:Infinity
    }));

    // 电梯井是贯穿三层的空心柱，南侧留门；平台在井内真实升降。
    elevators.forEach(elevator => {
        const t = 34, door = 130, side = (elevator.w - door) / 2;
        [
            [elevator.x,elevator.y,t,elevator.h],
            [elevator.x+elevator.w-t,elevator.y,t,elevator.h],
            [elevator.x+t,elevator.y,elevator.w-t*2,t],
            [elevator.x,elevator.y+elevator.h-t,side,t],
            [elevator.x+side+door,elevator.y+elevator.h-t,side,t]
        ].forEach(rect => obstacles.push({
            x:rect[0],y:rect[1],w:rect[2],h:rect[3],type:'factoryElevatorShaft',
            z:0,worldHeight:getFactoryFloorZ(3),indestructible:true,
            maxTerrainHp:Infinity,terrainHp:Infinity
        }));
    });

    // B1：密集油桶、可搬运木箱和传送带。
    const barrelPositions = [
        [620,585],[820,585],[1050,585],[1280,585],[1510,585],[1740,585],[1980,585],[2220,585],
        [2410,900],[2410,1120],[2410,1360],[2410,1600],[2410,1840],[2410,2070],
        [2050,2360],[1800,2360],[1540,2360],[1280,2360],[1020,2360],[760,2360],
        [620,1050],[620,1320],[620,1600],[620,1880]
    ];
    barrelPositions.forEach(([x,y], index) => obstacles.push({
        x:x-24, y:y-24, w:48, h:48, type:'oilBarrel', factoryFloor:0, z:getFactoryFloorZ(0),
        conveyorMovable:true, conveyorSeed:index, maxTerrainHp:1, terrainHp:1
    }));
    [[930,1120],[1250,1870],[1880,1080],[2050,1880],[1450,850],[920,2120]].forEach(([x,y], index) => obstacles.push({
        x:x-34, y:y-34, w:68, h:68, type:'factoryCrate', factoryFloor:0, z:getFactoryFloorZ(0),
        conveyorMovable:true, conveyorSeed:index, maxTerrainHp:260, terrainHp:260
    }));

    // 1F：主厂房设施与维修机器人。
    const facilities = [
        [650,420,300,250],[1120,360,300,460],[1640,380,620,240],[2390,410,300,520],
        [430,1120,380,500],[980,1050,300,280],[1740,1050,330,300],[2300,1120,360,480],
        [420,2180,540,300],[1120,2050,300,520],[1650,2150,570,300],[2150,1750,300,300]
    ];
    facilities.forEach((rect,index) => obstacles.push({
        x:rect[0], y:rect[1], w:rect[2], h:rect[3], type:'factoryFacility', factoryFloor:1,
        z:getFactoryFloorZ(1), facilityKind:index%3, maxTerrainHp:700, terrainHp:700
    }));
    const repairRobots = [[900,900],[1500,850],[2150,900],[900,1900],[1500,1950],[2150,1900]].map(([x,y],index) => ({
        type:'repairRobot', id:`repair-robot-${index}`, x,y,z:getFactoryFloorZ(1), factoryFloor:1,
        hp:300, maxHp:300, armor:0, speed:95, dead:false, repairRate:45, repairRadius:150,
        angle:Math.random()*Math.PI*2, target:null
    }));

    // 2F：起重机轨道和少量维护间，保留开阔吊装区。
    [[650,420,300,220],[2050,420,550,220],[420,2300,420,260],[1900,2300,400,260]]
        .forEach((rect,index) => obstacles.push({
            x:rect[0], y:rect[1], w:rect[2], h:rect[3], type:'factoryFacility', factoryFloor:2,
            z:getFactoryFloorZ(2), facilityKind:index+3, maxTerrainHp:700, terrainHp:700
        }));

    mapMechanicsState.factory = {floorHeight:FACTORY_FLOOR_HEIGHT, ceilingHeight:FACTORY_FLOOR_HEIGHT, conveyors, elevators, ramps, repairRobots};
    if(typeof initializeFactoryPhysics === 'function') initializeFactoryPhysics();
    mapMechanicsState.crane = {
        x: CONFIG.mapWidth / 2,
        y: CONFIG.mapHeight / 2,
        factoryFloor: 2,
        z: getFactoryFloorZ(2),
        range: 1050,
        phase: 'idle',
        timer: 10 + Math.random() * 10,
        hookX: CONFIG.mapWidth / 2,
        hookY: CONFIG.mapHeight / 2,
        target: null,
        lockX: 0,
        lockY: 0,
        destination: null
    };
}

function finalizeMapMechanicsElements() {
    if(currentMap === 'volcano') {
        mapElements = mapElements.filter(el => !isPointInLava(el.x, el.y, el.radius || 50));
    }
    if(currentMap === 'factory') {
        // 室内工厂不生成户外灌木、加速带或通用地雷。
        mapElements = mapMechanicsState.factory ? mapMechanicsState.factory.repairRobots.slice() : [];
    }
}

function getLavaPoint(point, index) {
    const state = mapMechanicsState;
    const phase = (state.lava && state.lava.flowPhase || 0) + state.time * 0.08;
    return {
        x: point.x + Math.sin(phase + index * 1.37) * 42,
        y: point.y,
        width: Math.max(200, Math.min(400, point.width + Math.sin(phase * 1.7 + index) * 24))
    };
}

function distanceToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const lengthSq = dx * dx + dy * dy;
    const t = lengthSq <= 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq));
    return {distance: Math.hypot(px - (ax + dx * t), py - (ay + dy * t)), t};
}

function isPointInLava(x, y, padding = 0) {
    const lava = mapMechanicsState.lava;
    if(!lava || !lava.points || lava.points.length < 2) return false;
    for(let i = 0; i < lava.points.length - 1; i++) {
        const a = getLavaPoint(lava.points[i], i), b = getLavaPoint(lava.points[i + 1], i + 1);
        const hit = distanceToSegment(x, y, a.x, a.y, b.x, b.y);
        const width = a.width + (b.width - a.width) * hit.t;
        if(hit.distance <= width / 2 + padding) return true;
    }
    return false;
}

function isPointInCoolingCrystal(x, y, padding = 0) {
    return mapMechanicsState.crystals.some(zone => x >= zone.x - padding && x <= zone.x + zone.w + padding && y >= zone.y - padding && y <= zone.y + zone.h + padding);
}

const FACTORY_FLOOR_HEIGHT = 500;
const FACTORY_FLOOR_LABELS = ['B1', '1F', '2F'];

function getFactoryFloorZ(factoryFloor) {
    return Math.max(0, Math.min(3, factoryFloor || 0)) * FACTORY_FLOOR_HEIGHT;
}

function getFactoryFloorFromZ(z) {
    return Math.max(0, Math.min(2, Math.round((z || 0) / FACTORY_FLOOR_HEIGHT)));
}

function getFactoryEntityFloor(entity) {
    if(!entity) return currentMap === 'factory' && player ? getFactoryFloorFromZ(player.z) : null;
    return getFactoryFloorFromZ(entity.z || 0);
}

function getFactoryViewFloor() {
    return currentMap === 'factory' && player ? getFactoryEntityFloor(player) : 1;
}

function getFactoryFloorLabel(factoryFloor) {
    return FACTORY_FLOOR_LABELS[Math.max(0, Math.min(2, factoryFloor || 0))];
}

function areEntitiesOnSameFactoryFloor(a, b) {
    return true;
}

function isFactoryEntityOnVisibleFloor(entity) {
    return true;
}

function factoryObstacleMatchesFloor(obstacle, factoryFloor) {
    if(currentMap !== 'factory' || !obstacle) return true;
    const z = Number.isFinite(factoryFloor) ? getFactoryFloorZ(factoryFloor) : 0;
    return factoryObstacleOverlapsHeight(obstacle, z, 58);
}

function factoryObstacleMatchesProjectile(obstacle, projectile) {
    if(currentMap !== 'factory' || !obstacle) return true;
    const z = projectile && projectile.z || 0;
    const baseZ = Number.isFinite(obstacle.z) ? obstacle.z :
        (Number.isInteger(obstacle.factoryFloor) ? getFactoryFloorZ(obstacle.factoryFloor) : 0);
    const topZ = Number.isFinite(obstacle.worldHeight) ? baseZ + obstacle.worldHeight :
        (typeof getObstacleWorldHeight === 'function' ? getObstacleWorldHeight(obstacle) : baseZ + 80);
    return z >= baseZ - 6 && z <= topZ + 6;
}

function getFactorySurfaceHeightAt(x, y, currentZ = null) {
    if(currentMap !== 'factory') return 0;
    const z = currentZ === null ? (player ? player.z || 0 : getFactoryFloorZ(1)) : currentZ;
    const factory = mapMechanicsState.factory;
    if(factory) {
        let closestRamp = null;
        factory.ramps.forEach(ramp => {
            if(!pointInFactoryZone(x,y,ramp,CONFIG.tankSize*.15)) return;
            const rampZ = getFactoryRampHeightAt(ramp,x,y);
            const distance = Math.abs(rampZ-z);
            if(!closestRamp || distance < closestRamp.distance) closestRamp={z:rampZ,distance};
        });
        if(closestRamp && closestRamp.distance <= 72) return closestRamp.z;
        const elevator = factory.elevators.find(item => pointInFactoryElevatorPlatform(x,y,item,CONFIG.tankSize*.15) &&
            Math.abs(item.platformZ-z) <= 72);
        if(elevator) return elevator.platformZ;
    }
    return getFactoryFloorZ(getFactoryFloorFromZ(z));
}

function getFactoryRampHeightAt(ramp,x,y) {
    const coordinate = ramp.axis === 'x' ? (x-ramp.x)/ramp.w : (y-ramp.y)/ramp.h;
    const progress = Math.max(0,Math.min(1,ramp.reverse ? 1-coordinate : coordinate));
    return ramp.fromZ+(ramp.toZ-ramp.fromZ)*progress;
}

function pointInFactoryElevatorPlatform(x,y,elevator,padding=0) {
    const wall=34;
    return x>=elevator.x+wall-padding && x<=elevator.x+elevator.w-wall+padding &&
        y>=elevator.y+wall-padding && y<=elevator.y+elevator.h-wall+padding;
}

function factoryObstacleOverlapsHeight(obstacle,z,height=58) {
    if(currentMap!=='factory' || !obstacle) return true;
    const baseZ=Number.isFinite(obstacle.z)?obstacle.z:
        (Number.isInteger(obstacle.factoryFloor)?getFactoryFloorZ(obstacle.factoryFloor):0);
    const topZ=Number.isFinite(obstacle.worldHeight)?baseZ+obstacle.worldHeight:
        (typeof getObstacleWorldHeight==='function'?getObstacleWorldHeight(obstacle):baseZ+80);
    return z+height>baseZ+4 && z-8<topZ;
}

function isFactorySurfaceReachable(x,y,currentZ) {
    const factory=mapMechanicsState.factory;
    if(!factory) return true;
    const ramp=factory.ramps.find(item=>pointInFactoryZone(x,y,item,CONFIG.tankSize*.15) &&
        Math.abs(getFactoryRampHeightAt(item,x,y)-currentZ)<=72);
    if(ramp)return true;
    const elevator=factory.elevators.find(item=>pointInFactoryZone(x,y,item,CONFIG.tankSize*.2));
    if(elevator) {
        const centeredDoor=Math.abs(x-(elevator.x+elevator.w/2))<=55 &&
            y>=elevator.y+elevator.h-85;
        return pointInFactoryElevatorPlatform(x,y,elevator,CONFIG.tankSize*.1)||centeredDoor;
    }
    return true;
}

function factoryProjectileCrossedSlab(projectile) {
    if(currentMap!=='factory'||!projectile||!Number.isFinite(projectile.prevZ)||!Number.isFinite(projectile.z))return false;
    const low=Math.min(projectile.prevZ,projectile.z),high=Math.max(projectile.prevZ,projectile.z);
    for(const slabZ of [1,2,3].map(getFactoryFloorZ)){
        if(low>slabZ||high<slabZ)continue;
        if(isFactorySlabOpeningAt(projectile.x,projectile.y,slabZ))continue;
        return true;
    }
    return false;
}

function isFactorySlabOpeningAt(x,y,slabZ) {
    const factory=mapMechanicsState.factory;
    if(!factory)return false;
    if(slabZ<getFactoryFloorZ(3)&&factory.elevators.some(elevator=>pointInFactoryElevatorPlatform(x,y,elevator,0)))return true;
    return factory.ramps.some(ramp=>{
        if(Math.abs(ramp.toZ-slabZ)>1)return false;
        const coordinate=ramp.axis==='x'?(x-ramp.x)/ramp.w:(y-ramp.y)/ramp.h;
        const upperProgress=ramp.reverse?1-coordinate:coordinate;
        return pointInFactoryZone(x,y,ramp,0)&&upperProgress>.72;
    });
}

function factoryFlightHitsSlab(x,y,z,halfHeight=24) {
    if(currentMap!=='factory')return false;
    return [1,2,3].map(getFactoryFloorZ).some(slabZ=>Math.abs(z-slabZ)<=halfHeight+6&&!isFactorySlabOpeningAt(x,y,slabZ));
}

function pointInFactoryZone(x, y, zone, padding = 0) {
    return x >= zone.x - padding && x <= zone.x + zone.w + padding && y >= zone.y - padding && y <= zone.y + zone.h + padding;
}

function updateMapMechanics(dt) {
    mapMechanicsState.time += dt;
    const tanks = [player, ...allies, ...enemies].filter(tank => tank && !tank.dead);
    tanks.forEach(tank => {
        tank.mapArmorBonus = 0;
        if(tank.mapSlowTimer > 0) {
            tank.mapSlowTimer = Math.max(0, tank.mapSlowTimer - dt);
            if(tank.mapSlowTimer <= 0) tank.mapSlow = 0;
        }
    });
    if(currentMap === 'volcano') updateVolcanoMechanics(dt, tanks);
    else if(currentMap === 'factory') updateFactoryMechanics(dt, tanks);
}

function updateVolcanoMechanics(dt, tanks) {
    tanks.forEach(tank => {
        const overLava = isPointInLava(tank.x, tank.y, CONFIG.tankSize * 0.45);
        if(tank.isFlying && overLava) {
            tank.z = Math.min(CONFIG.helicopterMaxAltitude, (tank.z || CONFIG.helicopterAltitude) + CONFIG.helicopterClimbSpeed * 0.2 * dt);
            tank.thermalLiftTimer = 0.25;
        } else if(!tank.isFlying && overLava) {
            tank.lavaDamageAccumulator = (tank.lavaDamageAccumulator || 0) + dt;
            if(tank.lavaDamageAccumulator >= 0.25) {
                const ticks = Math.floor(tank.lavaDamageAccumulator / 0.25);
                const damage = ticks * 25;
                tank.lavaDamageAccumulator -= ticks * 0.25;
                applyDirectDamage(tank, damage, null, '熔岩灼烧');
                if(tank === player) showDamageNumber(tank.x, tank.y - 34, damage);
            }
        } else tank.lavaDamageAccumulator = 0;

        const inCrystal = !tank.isFlying && isPointInCoolingCrystal(tank.x, tank.y, CONFIG.tankSize * 0.35);
        if(inCrystal) tank.mapArmorBonus = 0.5;
        if(tank === player && inCrystal && !tank.wasInCoolingCrystal) showMessage('💎 冷却结晶：装甲 +0.5', '#8ee6dd');
        tank.wasInCoolingCrystal = inCrystal;
    });

    mapMechanicsState.nextEruption -= dt;
    if(mapMechanicsState.nextEruption <= 0) triggerLavaEruption();
    updateLavaBalls(dt, tanks);
}

function triggerLavaEruption() {
    const lava = mapMechanicsState.lava;
    if(!lava) return;
    const segment = Math.floor(Math.random() * (lava.points.length - 1));
    const a = getLavaPoint(lava.points[segment], segment), b = getLavaPoint(lava.points[segment + 1], segment + 1);
    const t = Math.random();
    const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
    const count = 9 + Math.floor(Math.random() * 5);
    for(let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 180 + Math.random() * 260;
        mapMechanicsState.lavaBalls.push({
            x, y, z: 35, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            vz: 245 + Math.random() * 155, radius: 18, life: 4
        });
    }
    mapMechanicsState.nextEruption = 30 + Math.random() * 30;
    createParticles(x, y, 45, '#ff4a12', 3.2);
    showNotification('⚠ 熔岩河喷发：注意飞散的熔岩球！', '#ff5a18');
    if(typeof playWorldSound === 'function') playWorldSound('ammoRack', x, y, 1.1);
}

function updateLavaBalls(dt, tanks) {
    for(let i = mapMechanicsState.lavaBalls.length - 1; i >= 0; i--) {
        const ball = mapMechanicsState.lavaBalls[i];
        ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.z += ball.vz * dt;
        ball.vz -= 330 * dt; ball.life -= dt;
        if(ball.z > 0 && ball.life > 0 && ball.x > 0 && ball.x < CONFIG.mapWidth && ball.y > 0 && ball.y < CONFIG.mapHeight) continue;
        tanks.forEach(tank => {
            if(tank.isFlying || tank.dead || Math.hypot(tank.x - ball.x, tank.y - ball.y) > 90) return;
            applyDirectDamage(tank, 150, null, '熔岩球');
            tank.mapSlow = Math.max(tank.mapSlow || 0, 0.35);
            tank.mapSlowTimer = Math.max(tank.mapSlowTimer || 0, 3);
            showDamageNumber(tank.x, tank.y - 35, 150);
        });
        createParticles(ball.x, ball.y, 20, '#ff5a12', 2.1);
        mapMechanicsState.lavaBalls.splice(i, 1);
    }
}

function updateFactoryMechanics(dt, tanks) {
    updateFactoryElevators(dt,tanks);
    updateFactoryTankSurfaces(dt,tanks);
    updateFactoryConveyors(dt, tanks);
    if(typeof updateFactoryPhysics === 'function') updateFactoryPhysics(dt,tanks);
    updateFactoryRepairRobots(dt);
    updateCrane(dt, tanks);
    updateFactoryFire(dt, tanks);
}

function distributeFactoryInitialTanks() {
    if(currentMap !== 'factory' || !player) return;
    const place = (tank, factoryFloor, index, team) => {
        if(!tank || tank.isFlying) return;
        tank.factoryFloor = factoryFloor;
        tank.z = getFactoryFloorZ(factoryFloor);
        const column = index % 8;
        tank.x = team === 'blue' ? 620 + column * 155 : CONFIG.mapWidth - 620 - column * 155;
        tank.y = team === 'blue' ? 220 + Math.floor(index / 8) * 125 : CONFIG.mapHeight - 220 - Math.floor(index / 8) * 125;
        tank.prevPos = {x:tank.x, y:tank.y};
    };
    place(player, 1, 0, 'blue');
    allies.forEach((tank,index) => place(tank, index % 3, index + 1, 'blue'));
    enemies.forEach((tank,index) => place(tank, index % 3, index + 1, 'red'));
}

function updateFactoryConveyors(dt, tanks) {
    const factory = mapMechanicsState.factory;
    if(!factory) return;
    tanks.forEach(tank=>{
        if(tank.isFlying)return;
        const conveyor=factory.conveyors.find(zone=>Math.abs((tank.z||0)-getFactoryFloorZ(zone.factoryFloor))<=65&&
            pointInFactoryZone(tank.x,tank.y,zone,CONFIG.tankSize*.35));
        const targetVX=conveyor?conveyor.dirX*conveyor.speed:0;
        const targetVY=conveyor?conveyor.dirY*conveyor.speed:0;
        const response=conveyor?1-Math.exp(-dt*5):1-Math.exp(-dt*1.8);
        tank.factoryConveyorVX=(tank.factoryConveyorVX||0)+(targetVX-(tank.factoryConveyorVX||0))*response;
        tank.factoryConveyorVY=(tank.factoryConveyorVY||0)+(targetVY-(tank.factoryConveyorVY||0))*response;
        const nx=Math.max(CONFIG.tankSize,Math.min(CONFIG.mapWidth-CONFIG.tankSize,tank.x+tank.factoryConveyorVX*dt));
        const ny=Math.max(CONFIG.tankSize,Math.min(CONFIG.mapHeight-CONFIG.tankSize,tank.y+tank.factoryConveyorVY*dt));
        if(typeof checkObstacleCollision!=='function'||!checkObstacleCollision(nx,ny,CONFIG.tankSize,tank)){
            tank.x=nx;tank.y=ny;
        }else{
            tank.factoryConveyorVX*=.3;tank.factoryConveyorVY*=.3;
        }
        tank.onConveyorTimer=conveyor ? .2 : Math.max(0,(tank.onConveyorTimer||0)-dt);
    });
    if(typeof isFactoryPhysicsReady !== 'function'||!isFactoryPhysicsReady()) {
        factory.conveyors.forEach(conveyor => {
        obstacles.filter(obs => obs.conveyorMovable && obs.factoryFloor === conveyor.factoryFloor && pointInFactoryZone(obs.x + obs.w / 2, obs.y + obs.h / 2, conveyor)).forEach(obs => {
            obs.x += conveyor.dirX * conveyor.speed * dt;
            obs.y += conveyor.dirY * conveyor.speed * dt;
            if(conveyor.dirX > 0 && obs.x > conveyor.x + conveyor.w - obs.w) obs.x = conveyor.x;
            if(conveyor.dirX < 0 && obs.x + obs.w < conveyor.x) obs.x = conveyor.x + conveyor.w - obs.w;
            if(conveyor.dirY > 0 && obs.y > conveyor.y + conveyor.h - obs.h) obs.y = conveyor.y;
            if(conveyor.dirY < 0 && obs.y + obs.h < conveyor.y) obs.y = conveyor.y + conveyor.h - obs.h;
        });
        });
    }
}

function updateFactoryElevators(dt,tanks) {
    const factory = mapMechanicsState.factory;
    if(!factory) return;
    factory.elevators.forEach(elevator=>{
        if(elevator.dwell>0){
            elevator.dwell=Math.max(0,elevator.dwell-dt);
            if(elevator.dwell<=0){
                let next=elevator.currentFloor+elevator.direction;
                if(next>2||next<0){elevator.direction*=-1;next=elevator.currentFloor+elevator.direction;}
                elevator.targetFloor=next;
            }
        }else{
            const targetZ=getFactoryFloorZ(elevator.targetFloor);
            const delta=targetZ-elevator.platformZ;
            const step=Math.sign(delta)*Math.min(Math.abs(delta),elevator.speed*dt);
            elevator.platformZ+=step;
            if(Math.abs(targetZ-elevator.platformZ)<.01){
                elevator.platformZ=targetZ;
                elevator.currentFloor=elevator.targetFloor;
                elevator.dwell=elevator.dwellTime||5;
            }
        }
    });
}

function updateFactoryTankSurfaces(dt,tanks) {
    if(Array.isArray(dt)){tanks=dt;dt=1/60;}
    const factory=mapMechanicsState.factory;
    if(!factory)return;
    tanks.forEach(tank => {
        if(tank.isFlying) return;
        if(mapMechanicsState.crane&&mapMechanicsState.crane.target===tank&&mapMechanicsState.crane.phase==='carry')return;
        let elevator=tank.factoryElevatorRide?factory.elevators.find(item=>item.id===tank.factoryElevatorRide):null;
        if(elevator&&!pointInFactoryElevatorPlatform(tank.x,tank.y,elevator,CONFIG.tankSize*.2)){
            tank.factoryElevatorRide=null;
            elevator=null;
        }
        if(!elevator){
            elevator=factory.elevators.find(item=>pointInFactoryElevatorPlatform(tank.x,tank.y,item,CONFIG.tankSize*.15)&&
                Math.abs((tank.z||0)-item.platformZ)<=72);
            if(elevator)tank.factoryElevatorRide=elevator.id;
        }
        if(elevator){
            if(tank.factoryVerticalVelocity<0&&Number.isFinite(tank.factoryFallStartZ)){
                applyFactoryFallImpact(tank,Math.max(0,tank.factoryFallStartZ-elevator.platformZ));
            }
            tank.z=elevator.platformZ;
            tank.factoryFloor=getFactoryFloorFromZ(tank.z);
            tank.factoryVerticalVelocity=0;
            tank.factoryFallStartZ=null;
            return;
        }
        const ramp=factory.ramps.find(item=>pointInFactoryZone(tank.x,tank.y,item,CONFIG.tankSize*.12)&&
            Math.abs(getFactoryRampHeightAt(item,tank.x,tank.y)-(tank.z||0))<=90);
        if(ramp){
            tank.z=getFactoryRampHeightAt(ramp,tank.x,tank.y);
            tank.factoryVerticalVelocity=0;
            tank.factoryFallStartZ=null;
            tank.factoryFloor=getFactoryFloorFromZ(tank.z);
            return;
        }
        const support=getFactorySupportHeightAt(tank.x,tank.y,tank.z||0);
        if((tank.z||0)<=support+10&&!(tank.factoryVerticalVelocity<0)){
            tank.z=support;
            tank.factoryVerticalVelocity=0;
            tank.factoryFallStartZ=null;
        }else if(support<(tank.z||0)-10){
            if(!Number.isFinite(tank.factoryFallStartZ))tank.factoryFallStartZ=tank.z||0;
            tank.factoryVerticalVelocity=(tank.factoryVerticalVelocity||0)-980*dt;
            const nextZ=(tank.z||0)+tank.factoryVerticalVelocity*dt;
            if(nextZ<=support){
                const fallDistance=Math.max(0,(tank.factoryFallStartZ||support)-support);
                tank.z=support;
                tank.factoryVerticalVelocity=0;
                tank.factoryFallStartZ=null;
                applyFactoryFallImpact(tank,fallDistance);
            }else tank.z=nextZ;
        }else{
            tank.z=support;
            tank.factoryVerticalVelocity=0;
        }
        tank.factoryFloor=getFactoryFloorFromZ(tank.z);
    });
}

function applyFactoryFallImpact(tank,fallDistance) {
    if(fallDistance<=180||typeof applyDirectDamage!=='function')return;
    const damage=Math.min(600,Math.round((fallDistance-180)*.42));
    applyDirectDamage(tank,damage,null,'高处坠落');
    if(tank===player&&typeof showDamageNumber==='function')showDamageNumber(tank.x,tank.y-34,damage);
}

function getFactorySupportHeightAt(x,y,currentZ) {
    let support=0;
    [1,2].forEach(floor=>{
        const slabZ=getFactoryFloorZ(floor);
        if(slabZ<=currentZ+10&&!isFactorySlabOpeningAt(x,y,slabZ))support=Math.max(support,slabZ);
    });
    const factory=mapMechanicsState.factory;
    if(!factory)return support;
    factory.ramps.forEach(ramp=>{
        if(!pointInFactoryZone(x,y,ramp,CONFIG.tankSize*.12))return;
        const rampZ=getFactoryRampHeightAt(ramp,x,y);
        if(rampZ<=currentZ+90)support=Math.max(support,rampZ);
    });
    factory.elevators.forEach(elevator=>{
        if(pointInFactoryElevatorPlatform(x,y,elevator,0)&&elevator.platformZ<=currentZ+80){
            support=Math.max(support,elevator.platformZ);
        }
    });
    return support;
}

function isFactoryRampGuardrailCollision(x,y,z,radius=0) {
    const factory=mapMechanicsState.factory;
    if(!factory)return false;
    return factory.ramps.some(ramp=>{
        if(!pointInFactoryZone(x,y,ramp,radius))return false;
        const rampZ=getFactoryRampHeightAt(ramp,x,y);
        if(Math.abs((z||0)-rampZ)>ramp.guardrailHeight+35)return false;
        const rail=ramp.guardrailWidth||14;
        return ramp.axis==='y'
            ? x<=ramp.x+rail+radius||x>=ramp.x+ramp.w-rail-radius
            : y<=ramp.y+rail+radius||y>=ramp.y+ramp.h-rail-radius;
    });
}

function isFactoryElevatorExitBlocked(tank,x,y) {
    // 井门始终敞开；驶离运行中的平台会直接进入坠落状态，而不是撞上隐形门。
    return false;
}

function updateFactoryRepairRobots(dt) {
    const robots = mapElements.filter(el => el.type === 'repairRobot' && !el.dead);
    const repairables = obstacles.filter(obs => obs.factoryFloor === 1 && ['factoryFacility','factoryWall'].includes(obs.type) && Number.isFinite(obs.terrainHp) && obs.terrainHp < obs.maxTerrainHp);
    robots.forEach(robot => {
        if(!robot.target || !repairables.includes(robot.target) || robot.target.terrainHp >= robot.target.maxTerrainHp) {
            robot.target = repairables.length ? repairables.reduce((best, obs) => {
                const distance = Math.hypot(obs.x + obs.w / 2 - robot.x, obs.y + obs.h / 2 - robot.y);
                return !best || distance < best.distance ? {obs,distance} : best;
            }, null).obs : null;
        }
        if(!robot.target) { robot.angle += dt * .35; return; }
        const tx = robot.target.x + robot.target.w / 2, ty = robot.target.y + robot.target.h / 2;
        const distance = Math.hypot(tx - robot.x, ty - robot.y);
        robot.angle = Math.atan2(ty - robot.y, tx - robot.x);
        if(distance > robot.repairRadius) {
            robot.x += Math.cos(robot.angle) * robot.speed * dt;
            robot.y += Math.sin(robot.angle) * robot.speed * dt;
        } else {
            robot.target.terrainHp = Math.min(robot.target.maxTerrainHp, robot.target.terrainHp + robot.repairRate * dt);
            if(Math.random() < dt * 7 && typeof createParticles === 'function') createParticles(tx, ty, 2, '#66e6ff', .45);
        }
    });
}

function handleMapMechanicProjectile(projectile) {
    if(currentMap !== 'factory' || !projectile) return false;
    const floor = getFactoryFloorFromZ(projectile.z || 0);
    const robot = mapElements.find(el => el.type === 'repairRobot' && !el.dead && el.factoryFloor === floor &&
        Math.hypot(projectile.x - el.x, projectile.y - el.y) <= 28 && Math.abs((projectile.z || 0) - (el.z + 18)) <= 34);
    if(!robot) return false;
    robot.hp -= projectile.damage || 0; // 机器人固定 0 护甲。
    createParticles(robot.x, robot.y, 10, '#72d8e8', 1);
    if(robot.hp <= 0) {
        robot.dead = true;
        createParticles(robot.x, robot.y, 24, '#ff8b38', 1.8);
    }
    return true;
}

function updateCrane(dt, tanks) {
    const crane = mapMechanicsState.crane;
    if(!crane) return;
    crane.timer -= dt;
    if(crane.phase === 'idle' && crane.timer <= 0) {
        const candidates = tanks.filter(tank => !tank.isFlying && Math.abs((tank.z||0)-crane.z)<=75 &&
            Math.hypot(tank.x - crane.x, tank.y - crane.y) <= crane.range);
        if(!candidates.length) {
            crane.timer = 2;
            return;
        }
        crane.target = candidates[Math.floor(Math.random() * candidates.length)];
        crane.lockX = crane.target.x; crane.lockY = crane.target.y;
        crane.phase = 'telegraph'; crane.timer = 1.45;
        if(crane.target === player) showMessage('⚠ 起重机锁定！立即离开黄色警示圈', '#ffd24a');
    } else if(crane.phase === 'telegraph') {
        const progress = 1 - Math.max(0, crane.timer) / 1.45;
        crane.hookX += (crane.lockX - crane.hookX) * Math.min(1, dt * (3 + progress * 5));
        crane.hookY += (crane.lockY - crane.hookY) * Math.min(1, dt * (3 + progress * 5));
        if(crane.timer <= 0) {
            const target = crane.target;
            if(!target || target.dead || Math.hypot(target.x - crane.lockX, target.y - crane.lockY) > 105) {
                if(target === player) showMessage('✓ 已躲开起重机吊钩', '#6dff9a');
                resetCrane(10 + Math.random() * 10);
                return;
            }
            crane.phase = 'carry'; crane.timer = 3;
            crane.startX = target.x; crane.startY = target.y;
            const angle = Math.random() * Math.PI * 2;
            const distance = 700 + Math.random() * 650;
            crane.destination = findFactoryDropPoint(crane.x + Math.cos(angle) * distance, crane.y + Math.sin(angle) * distance, crane.factoryFloor);
            target.cranePreviousCanMove = target.canMove;
            target.canMove = false;
            target.craneCaptured = true;
        }
    } else if(crane.phase === 'carry') {
        const target = crane.target;
        if(!target || target.dead) {
            resetCrane(10 + Math.random() * 10);
            return;
        }
        const progress = Math.max(0, Math.min(1, 1 - crane.timer / 3));
        const eased = progress * progress * (3 - 2 * progress);
        target.x = crane.startX + (crane.destination.x - crane.startX) * eased;
        target.y = crane.startY + (crane.destination.y - crane.startY) * eased;
        target.z = getFactoryFloorZ(crane.factoryFloor) + 70 + Math.sin(progress * Math.PI) * 100;
        crane.hookX = target.x; crane.hookY = target.y;
        if(crane.timer <= 0) {
            target.x = crane.destination.x; target.y = crane.destination.y;
            target.factoryFloor = crane.factoryFloor;
            target.z = getFactoryFloorZ(crane.factoryFloor);
            target.canMove = target.cranePreviousCanMove !== false;
            target.craneCaptured = false;
            delete target.cranePreviousCanMove;
            if(target === player) showMessage('起重机已将你重新部署', '#ffb347');
            resetCrane(10 + Math.random() * 10);
        }
    }
}

function findFactoryDropPoint(x, y, factoryFloor = 2) {
    const clamped = {
        x: Math.max(300, Math.min(CONFIG.mapWidth - 300, x)),
        y: Math.max(300, Math.min(CONFIG.mapHeight - 300, y))
    };
    if(!isFactoryPositionBlocked(clamped.x, clamped.y, CONFIG.tankSize, factoryFloor)) return clamped;
    for(let radius = 120; radius <= 700; radius += 100) {
        for(let i = 0; i < 12; i++) {
            const angle = i / 12 * Math.PI * 2;
            const px = Math.max(100, Math.min(CONFIG.mapWidth - 100, clamped.x + Math.cos(angle) * radius));
            const py = Math.max(100, Math.min(CONFIG.mapHeight - 100, clamped.y + Math.sin(angle) * radius));
            if(!isFactoryPositionBlocked(px, py, CONFIG.tankSize, factoryFloor)) return {x:px, y:py};
        }
    }
    return {x:craneSafeCoordinate(CONFIG.mapWidth / 2 - 700, CONFIG.mapWidth), y:craneSafeCoordinate(CONFIG.mapHeight / 2, CONFIG.mapHeight)};
}

function isFactoryPositionBlocked(x, y, radius, factoryFloor) {
    return obstacles.some(obs => {
        if(!factoryObstacleMatchesFloor(obs, factoryFloor)) return false;
        const closestX = Math.max(obs.x, Math.min(x, obs.x + obs.w));
        const closestY = Math.max(obs.y, Math.min(y, obs.y + obs.h));
        return Math.hypot(x - closestX, y - closestY) < radius;
    });
}

function craneSafeCoordinate(value, max) {
    return Math.max(100, Math.min(max - 100, value));
}

function resetCrane(delay) {
    const crane = mapMechanicsState.crane;
    if(!crane) return;
    crane.phase = 'idle'; crane.timer = delay; crane.target = null; crane.destination = null;
    crane.hookX = crane.x; crane.hookY = crane.y;
}

function triggerOilBarrelExplosion(barrel, source = null, visited = new Set()) {
    if(!barrel || barrel.type !== 'oilBarrel' || barrel.exploded || visited.has(barrel)) return false;
    visited.add(barrel);
    barrel.exploded = true;
    const x = barrel.x + barrel.w / 2, y = barrel.y + barrel.h / 2;
    const factoryFloor = getFactoryEntityFloor(barrel), explosionZ=barrel.z||getFactoryFloorZ(factoryFloor);
    removeTerrainObstacle(barrel);
    const tanks = [player, ...allies, ...enemies].filter(tank => tank && !tank.dead);
    tanks.forEach(tank => {
        if(tank.isFlying || Math.abs((tank.z||0)-explosionZ)>90 || Math.hypot(tank.x - x, tank.y - y) > 175) return;
        applyDirectDamage(tank, 200, source, '油桶爆炸');
        showDamageNumber(tank.x, tank.y - 34, 200);
    });
    mapMechanicsState.fireZones.push({x, y, z:explosionZ, factoryFloor, radius:125, life:5, maxLife:5, tick:0});
    createParticles(x, y, 32, '#ff5b16', 2.8);
    if(typeof spawnTerrainDebris === 'function') spawnTerrainDebris(x, y, '#7d3d20', 1.2, 12, 'metal');
    if(typeof playWorldSound === 'function') playWorldSound('ammoRack', x, y, 0.9);

    obstacles.slice().forEach(other => {
        if(other.type !== 'oilBarrel' || other.factoryFloor !== factoryFloor || visited.has(other)) return;
        const ox = other.x + other.w / 2, oy = other.y + other.h / 2;
        if(Math.hypot(ox - x, oy - y) <= 240) triggerOilBarrelExplosion(other, source, visited);
    });
    if(typeof markTerrainStructureChanged === 'function') markTerrainStructureChanged();
    return true;
}

function updateFactoryFire(dt, tanks) {
    for(let i = mapMechanicsState.fireZones.length - 1; i >= 0; i--) {
        const fire = mapMechanicsState.fireZones[i];
        fire.life -= dt; fire.tick += dt;
        if(fire.tick >= 0.25) {
            const ticks = Math.floor(fire.tick / 0.25);
            fire.tick -= ticks * 0.25;
            tanks.forEach(tank => {
                if(tank.isFlying || Math.abs((tank.z||0)-(fire.z||0))>90 || Math.hypot(tank.x - fire.x, tank.y - fire.y) > fire.radius) return;
                applyDirectDamage(tank, ticks * 5, null, '工厂火灾');
            });
        }
        if(fire.life <= 0) mapMechanicsState.fireZones.splice(i, 1);
    }
}

function collapseFactoryPlatform(platform, hitX, hitY, source) {
    if(!platform || platform.type !== 'factoryPlatform') return false;
    const old = {x:platform.x, y:platform.y, w:platform.w, h:platform.h};
    removeTerrainObstacle(platform);
    [player, ...allies, ...enemies].filter(tank => tank && !tank.dead && !tank.isFlying).forEach(tank => {
        if(tank.x < old.x || tank.x > old.x + old.w || tank.y < old.y || tank.y > old.y + old.h) return;
        if((tank.z || 0) < (platform.platformHeight || 120) - 35) return;
        tank.z = 0;
        applyDirectDamage(tank, 100, source, '高架平台倒塌');
        showDamageNumber(tank.x, tank.y - 34, 100);
    });
    if(typeof createRubblePiece === 'function') {
        createRubblePiece(old.x + old.w * 0.12, old.y + old.h * 0.56, old.w * 0.30, old.h * 0.28, platform, 0.21);
        createRubblePiece(old.x + old.w * 0.58, old.y + old.h * 0.14, old.w * 0.26, old.h * 0.30, platform, 0.67);
    }
    if(typeof spawnTerrainDebris === 'function') spawnTerrainDebris(hitX, hitY, '#766f65', 1.65, 22, 'metal');
    createParticles(hitX, hitY, 42, '#8b8178', 3.1);
    if(typeof markTerrainStructureChanged === 'function') markTerrainStructureChanged();
    if(source && source.isPlayer) showMessage('🏗 高架平台局部倒塌，新通道已形成', '#d8b58b');
    return true;
}

function factoryPlatformMatchesProjectile(platform, projectile) {
    if(!platform || platform.type !== 'factoryPlatform') return true;
    const relativeHeight = (projectile.z || 0) - (platform.platformHeight || 120);
    return relativeHeight >= -28 && relativeHeight <= 10;
}
