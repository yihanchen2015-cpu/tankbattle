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
assert.strictEqual(vm.runInContext("terrainZones.filter(z => z.type === 'conveyor').length", context), 4, 'B1 should contain floor conveyors');
assert.strictEqual(vm.runInContext("terrainZones.filter(z => z.type === 'factoryElevator').length", context), 2, 'factory should contain two elevators');
assert.strictEqual(vm.runInContext("terrainZones.filter(z => z.type === 'factoryRampLink').length", context), 2, 'factory should contain two narrow ramp links');
assert.strictEqual(vm.runInContext("obstacles.filter(o => o.type === 'factoryBoundary').length", context), 12, 'each floor should have four building boundary walls');
assert.strictEqual(vm.runInContext("obstacles.filter(o => o.type === 'oilBarrel' && o.factoryFloor === 0).length", context), 24, 'B1 should contain many oil barrels');
assert.strictEqual(vm.runInContext("obstacles.filter(o => o.type === 'factoryFacility' && o.factoryFloor === 1).length", context), 12, '1F should be the main facility area');
assert.strictEqual(vm.runInContext('getFactoryFloorZ(0)', context), 0, 'B1 floor height should be zero');
assert.strictEqual(vm.runInContext('getFactoryFloorZ(1)', context), 160, '1F should use the middle slice');
assert.strictEqual(vm.runInContext('getFactoryFloorZ(2)', context), 320, '2F should use the upper slice');

vm.runInContext('finalizeMapMechanicsElements()', context);
assert.strictEqual(vm.runInContext("mapElements.filter(e => e.type === 'repairRobot').length", context), 6, '1F should contain repair robots');
assert(vm.runInContext("mapElements.every(e => e.hp === 300 && e.armor === 0)", context), 'repair robots should have 300 HP and no armor');

vm.runInContext(`(() => {
    player = {id:'belt-tank',x:800,y:585,z:0,factoryFloor:0,hp:1000,maxHp:1000,dead:false,isFlying:false,canMove:true};
    updateMapMechanics(.5);
})()`, context);
assert.strictEqual(vm.runInContext('player.x', context), 841, 'a B1 conveyor should automatically move a tank');

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
    player = {id:'elevator-tank',x:300,y:300,z:0,factoryFloor:0,hp:1000,maxHp:1000,dead:false,isFlying:false,canMove:true};
    updateMapMechanics(.01);
    updateMapMechanics(1.1);
})()`, context);
assert.strictEqual(vm.runInContext('player.factoryFloor', context), 1, 'elevators should quickly transfer tanks to the next floor');
assert.strictEqual(vm.runInContext('player.z', context), 160, 'elevator arrival should snap to the destination floor height');

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
