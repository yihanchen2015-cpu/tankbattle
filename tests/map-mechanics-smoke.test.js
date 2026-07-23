const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');
const context = {
    console,
    Math,
    Date,
    performance: { now: () => 1000 },
    CONFIG: {
        mapWidth: 8000, mapHeight: 7000, tankSize: 35,
        helicopterAltitude: 240, helicopterMaxAltitude: 1000, helicopterClimbSpeed: 180
    },
    currentMap: 'volcano',
    terrainZones: [], obstacles: [], mapElements: [],
    player: null, allies: [], enemies: [],
    createParticles() {}, showDamageNumber() {}, showNotification() {}, showMessage() {},
    applyDirectDamage(tank, damage) { tank.hp -= damage; return damage; },
    removeTerrainObstacle(obs) { const index = context.obstacles.indexOf(obs); if(index >= 0) context.obstacles.splice(index, 1); },
    markTerrainStructureChanged() {}, spawnTerrainDebris() {}, playWorldSound() {},
    createRubblePiece(x, y, w, h) { const rubble = {x,y,w,h,type:'rubble'}; context.obstacles.push(rubble); return rubble; },
    checkObstacleCollision() { return false; }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'MapMechanics.js'), 'utf8'), context);

vm.runInContext('initializeMapMechanics()', context);
assert.strictEqual(vm.runInContext("terrainZones.filter(z => z.type === 'lava').length", context), 1, 'volcano should create one lava river');
assert.strictEqual(vm.runInContext("terrainZones.filter(z => z.type === 'crystal').length", context), 4, 'volcano should create four edge crystal zones');
assert(vm.runInContext('mapMechanicsState.lava.points.every((p, i) => { const q = getLavaPoint(p, i); return q.width >= 200 && q.width <= 400; })', context), 'dynamic lava width should stay within 200-400');

vm.runInContext(`(() => {
    const lavaPoint = getLavaPoint(mapMechanicsState.lava.points[2], 2);
    player = {x:lavaPoint.x, y:lavaPoint.y, z:0, hp:1000, maxHp:1000, dead:false, isFlying:false};
    updateMapMechanics(1);
})()`, context);
assert.strictEqual(vm.runInContext('player.hp', context), 900, 'lava should deal 100 HP per second');

vm.runInContext(`
    player = {x:300, y:500, z:0, hp:1000, maxHp:1000, dead:false, isFlying:false};
    updateMapMechanics(.1);
`, context);
assert.strictEqual(vm.runInContext('player.mapArmorBonus', context), 0.5, 'cooling crystal should grant +0.5 armor');

vm.runInContext(`(() => {
    const lavaPoint = getLavaPoint(mapMechanicsState.lava.points[3], 3);
    player = {x:lavaPoint.x, y:lavaPoint.y, z:240, hp:1000, maxHp:1000, dead:false, isFlying:true};
    updateMapMechanics(1);
})()`, context);
assert.strictEqual(vm.runInContext('player.z', context), 276, 'lava thermal lift should add 20% climb speed');

vm.runInContext(`
    currentMap = 'factory'; CONFIG.mapWidth = 3000; CONFIG.mapHeight = 3000;
    terrainZones.length = 0; obstacles.length = 0; mapElements.length = 0; player = null;
    initializeMapMechanics();
`, context);
assert.strictEqual(vm.runInContext("terrainZones.filter(z => z.type === 'factoryFloorSlab').length", context), 3, 'factory should have B1, 1F and 2F slabs');
assert.strictEqual(vm.runInContext("terrainZones.filter(z => z.type === 'factoryCeilingSlab').length", context), 1, '2F should have a roof ceiling above the shared floor slabs');
assert.strictEqual(vm.runInContext("terrainZones.filter(z => z.type === 'conveyor').length", context), 4, 'B1 should contain floor conveyors');
assert.strictEqual(vm.runInContext("terrainZones.filter(z => z.type === 'factoryElevator').length", context), 2, 'factory should contain two elevators');
assert.strictEqual(vm.runInContext("terrainZones.filter(z => z.type === 'factoryRamp').length", context), 2, 'factory should contain two physical inclined ramps');
assert.strictEqual(vm.runInContext("mapMechanicsState.factory.elevators.every(e => e.dwellTime === 5 && e.doorsOpen)", context), true, 'factory elevators should hold for five seconds with permanently open doors');
assert.strictEqual(vm.runInContext("mapMechanicsState.factory.ramps.every(r => r.guardrailHeight >= 60 && r.deckThickness >= 18)", context), true, 'factory ramps should have thick decks and protective guardrails');
assert.strictEqual(vm.runInContext("obstacles.filter(o => o.type === 'factoryBoundary').length", context), 4, 'the building should have four continuous outer walls');
assert.strictEqual(vm.runInContext("obstacles.filter(o => o.type === 'factoryElevatorShaft').length", context), 10, 'each hollow elevator shaft should have walls and a doorway');
assert.strictEqual(vm.runInContext("obstacles.filter(o => o.type === 'oilBarrel' && o.factoryFloor === 0).length", context), 24, 'B1 should contain many oil barrels');
assert.strictEqual(vm.runInContext("obstacles.filter(o => o.type === 'factoryFacility' && o.factoryFloor === 1).length", context), 12, '1F should be the main facility area');
assert.strictEqual(vm.runInContext('getFactoryFloorZ(0)', context), 0, 'B1 floor height should be zero');
assert.strictEqual(vm.runInContext('getFactoryFloorZ(1)', context), 500, '1F should be 500 units above B1');
assert.strictEqual(vm.runInContext('getFactoryFloorZ(2)', context), 1000, '2F should be 1000 units above B1');
assert.strictEqual(vm.runInContext('getFactoryFloorZ(3)', context), 1500, 'the top ceiling should be 1500 units above B1');
assert.strictEqual(vm.runInContext("areEntitiesOnSameFactoryFloor({z:0},{z:1000})", context), true, 'factory entities should share one continuous 3D space instead of logical floor isolation');
assert.strictEqual(vm.runInContext("isFactoryEntityOnVisibleFloor({factoryFloor:2})", context), true, 'upper-floor entities should remain rendered without floor visibility isolation');

vm.runInContext('finalizeMapMechanicsElements()', context);
assert.strictEqual(vm.runInContext("mapElements.filter(e => e.type === 'repairRobot').length", context), 6, '1F should contain repair robots');
assert(vm.runInContext("mapElements.every(e => e.hp === 300 && e.armor === 0)", context), 'repair robots should have 300 HP and no armor');

vm.runInContext(`(() => {
    player = {id:'belt-tank',x:800,y:585,z:0,factoryFloor:0,hp:1000,maxHp:1000,dead:false,isFlying:false,canMove:true};
    updateMapMechanics(.5);
})()`, context);
assert(vm.runInContext('player.x', context) > 830 && vm.runInContext('player.x', context) < 841, 'a B1 conveyor should accelerate a tank instead of moving it with an instant fixed offset');

vm.runInContext(`(() => {
    const facility = obstacles.find(o => o.type === 'factoryFacility' && o.factoryFloor === 1);
    const robot = mapElements.find(e => e.type === 'repairRobot');
    facility.terrainHp = 500;
    robot.x = facility.x + facility.w / 2;
    robot.y = facility.y + facility.h / 2;
    robot.target = facility;
    updateFactoryRepairRobots(1);
})()`, context);
assert.strictEqual(vm.runInContext("obstacles.find(o => o.type === 'factoryFacility' && o.factoryFloor === 1).terrainHp", context), 545, 'robots should repair damaged 1F facilities');

vm.runInContext(`(() => {
    const ramp=mapMechanicsState.factory.ramps[0];
    player={id:'ramp-tank',x:ramp.x+ramp.w/2,y:ramp.y,z:0,factoryFloor:0,hp:1000,maxHp:1000,dead:false,isFlying:false,canMove:true};
    for(let step=1;step<=9;step++){
        player.y=ramp.y+ramp.h*step/9;
        updateFactoryTankSurfaces([player]);
    }
})()`,context);
assert.strictEqual(vm.runInContext('player.z',context),500,'driving along the ramp should continuously raise the tank to 1F');

vm.runInContext(`(() => {
    const elevator=mapMechanicsState.factory.elevators[0];
    player={id:'elevator-tank',x:elevator.x+elevator.w/2,y:elevator.y+elevator.h/2,z:0,factoryFloor:0,hp:1000,maxHp:1000,dead:false,isFlying:false,canMove:true};
    updateMapMechanics(.01);
    updateMapMechanics(5);
    updateMapMechanics(1);
})()`, context);
assert.strictEqual(vm.runInContext('player.z', context), 240, 'a tank standing on the elevator platform should move with it');
assert.strictEqual(vm.runInContext('player.canMove', context), true, 'the elevator must not disable tank controls');
assert.strictEqual(vm.runInContext('player.factoryTransit', context), undefined, 'elevators should not use automatic floor-transition state');

vm.runInContext(`(() => {
    const elevator=mapMechanicsState.factory.elevators[0];
    elevator.platformZ=0;elevator.currentFloor=0;elevator.targetFloor=0;elevator.dwell=5;
    player={id:'falling-tank',x:elevator.x+elevator.w/2,y:elevator.y+elevator.h/2,z:500,factoryFloor:1,hp:1000,maxHp:1000,dead:false,isFlying:false,canMove:true};
    for(let step=0;step<20;step++)updateFactoryTankSurfaces(.1,[player]);
})()`, context);
assert.strictEqual(vm.runInContext('player.z', context), 0, 'an open elevator shaft should let a tank fall to the lower support');
assert(vm.runInContext('player.hp', context) < 1000, 'a 500-unit fall should cause impact damage');
assert.strictEqual(vm.runInContext('isFactoryElevatorExitBlocked(player,player.x,player.y+200)', context), false, 'open elevator doors must not create an invisible exit barrier');

vm.runInContext(`(() => {
    const robot = mapElements.find(e => e.type === 'repairRobot');
    handleMapMechanicProjectile({x:robot.x,y:robot.y,z:robot.z+18,damage:75});
})()`, context);
assert.strictEqual(vm.runInContext("mapElements.find(e => e.type === 'repairRobot').hp", context), 225, 'robot damage should bypass armor');

const barrelCountBefore = vm.runInContext("obstacles.filter(o => o.type === 'oilBarrel').length", context);
vm.runInContext("triggerOilBarrelExplosion(obstacles.find(o => o.type === 'oilBarrel'))", context);
const barrelCountAfter = vm.runInContext("obstacles.filter(o => o.type === 'oilBarrel').length", context);
assert(barrelCountAfter < barrelCountBefore, 'barrel explosion should remove and chain nearby barrels');
assert(vm.runInContext('mapMechanicsState.fireZones.length', context) >= 1, 'barrel explosion should leave five-second fire zones');

console.log('Map mechanics smoke test passed:', {
    lavaDamage: 100,
    crystalArmor: 0.5,
    helicopterLift: 36,
    chainedBarrels: barrelCountBefore - barrelCountAfter,
    factoryFloors: 3,
    repairRobots: 6
});
