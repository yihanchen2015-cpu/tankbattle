const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const context = {
    console,
    Math,
    Date,
    performance: { now: () => 1000 },
    touchControlMode: false,
    obstacles: [
        { x: 10, y: 10, w: 70, h: 70, type: 'tree' },
        { x: 140, y: 10, w: 100, h: 90, type: 'rock' },
        { x: 300, y: 200, w: 400, h: 380, type: 'building', floors: 6 }
    ],
    player: { id: 'player', path: [{ x: 1, y: 1 }], pathRefreshTimer: 2 },
    allies: [],
    enemies: [],
    pathRefreshes: 0,
    initPathGrid() { context.pathRefreshes++; },
    createParticles() {},
    playWorldSound() {},
    showMessage() {}
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('TerrainDestruction.js', 'utf8'), context);

vm.runInContext('initializeDestructibleTerrain()', context);
assert.ok(context.obstacles.every(obstacle => obstacle.terrainId), 'all map obstacles should receive stable terrain ids');

const tree = context.obstacles[0];
vm.runInContext('damageObstacleAtPoint(obstacles[0], 180, "shell", 45, 45, player)', context);
assert.ok(!context.obstacles.includes(tree), 'one main-cannon hit should destroy a tree');
assert.ok(vm.runInContext('terrainDebris.length > 0', context), 'destroyed terrain should emit physical debris');

const rock = context.obstacles.find(obstacle => obstacle.type === 'rock');
context.rock = rock;
vm.runInContext('damageObstacleAtPoint(rock, 180, "shell", 180, 45, player)', context);
assert.ok(context.obstacles.includes(rock), 'a rock should survive one main-cannon hit');
vm.runInContext('damageObstacleAtPoint(rock, 180, "shell", 180, 45, player)', context);
assert.ok(!context.obstacles.includes(rock), 'a rock should be destroyed by repeated main-cannon hits');

const building = context.obstacles.find(obstacle => obstacle.type === 'building');
const oldRect = { x: building.x, y: building.y, w: building.w, h: building.h };
context.building = building;
vm.runInContext('damageObstacleAtPoint(building, 300, "rocket", building.x + 4, building.y + building.h / 2, player)', context);
assert.strictEqual(building.collapseStage, 1, 'a strong rocket hit should collapse one building section');
assert.ok(building.w < oldRect.w || building.h < oldRect.h, 'partial collapse should shrink the standing building footprint');
const rubble = context.obstacles.filter(obstacle => obstacle.type === 'rubble');
assert.ok(rubble.length >= 2, 'collapsed building section should produce separated rubble cover');
assert.ok(rubble.every(piece => piece.rubbleHeight > 0 && piece.w > 0 && piece.h > 0), 'rubble should have collision geometry and cover height');
context.rubble = rubble[0];
assert.strictEqual(vm.runInContext('damageObstacleAtPoint(rubble, 9999, "rocket", rubble.x, rubble.y, player)', context), false, 'rubble should remain persistent cover');

const beforeZ = vm.runInContext('terrainDebris[0].z', context);
vm.runInContext('updateTerrainDestruction(0.1)', context);
const afterZ = vm.runInContext('terrainDebris[0].z', context);
assert.notStrictEqual(afterZ, beforeZ, 'debris physics should update fragment height');
vm.runInContext('updateTerrainDestruction(0.2)', context);
assert.ok(context.pathRefreshes >= 1, 'structural changes should rebuild AI navigation');
assert.strictEqual(context.player.path, null, 'cached AI/player paths should be invalidated after collapse');

console.log('Terrain destruction smoke test passed:', {
    rubblePieces: rubble.length,
    debris: vm.runInContext('terrainDebris.length', context),
    buildingStage: building.collapseStage,
    pathRefreshes: context.pathRefreshes
});
