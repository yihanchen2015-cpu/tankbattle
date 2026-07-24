const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const announcements = [];
const context = {
    console,
    Math,
    Date,
    Map,
    Set,
    AbortController,
    window: {},
    document: { getElementById() { return null; } },
    init() {},
    addBattleAnnouncement(team,text) { announcements.push({team,text}); }
};

vm.createContext(context);
for(const file of ['Config.js','GameCore.js','Combat.js']) {
    vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
}

const expectedMaps = {
    classic:[5400,5400,3],
    desert:[4800,4800,3],
    city:[3600,3600,3],
    snow:[6000,6000,3],
    island:[4200,4200,5],
    volcano:[4800,4200,3],
    factory:[3000,3000,3]
};

for(const [map,[width,height,outpostCount]] of Object.entries(expectedMaps)) {
    vm.runInContext(`currentMap='${map}';gameMode='classic';generateMap();`,context);
    const result=vm.runInContext(`({
        width:CONFIG.mapWidth,
        height:CONFIG.mapHeight,
        outposts:outposts.length,
        lands:terrainZones.filter(zone=>zone.type==='land').length,
        blueBaseInWater:currentMap==='island'&&isPositionInWater(bases.blue.x+bases.blue.w/2,bases.blue.y+bases.blue.h/2,20),
        redBaseInWater:currentMap==='island'&&isPositionInWater(bases.red.x+bases.red.w/2,bases.red.y+bases.red.h/2,20)
    })`,context);
    assert.deepStrictEqual([result.width,result.height,result.outposts],[width,height,outpostCount],`${map} should use the requested compact size and outpost count`);
    if(map==='island'){
        assert.strictEqual(result.lands,5,'island map should contain exactly five islands');
        assert.strictEqual(result.blueBaseInWater,false,'blue island base should stand on land');
        assert.strictEqual(result.redBaseInWater,false,'red island base should stand on land');
    }
}

vm.runInContext(`bases={blue:null,red:null};currentMap='city';gameMode='classic';generateMap();`,context);
assert.strictEqual(vm.runInContext('obstacles.every(obs=>Number.isFinite(obs.x)&&Number.isFinite(obs.y))',context),true,'city map should generate cleanly without relying on stale base objects');

assert.strictEqual(vm.runInContext('typeof updateOutpostSpawns',context),'undefined','outpost reinforcement loop should be removed');
vm.runInContext(`
    currentMap='classic';gameMode='classic';generateMap();
    player={team:'blue',dead:false,x:bases.blue.x,y:bases.blue.y};
    allies=[];enemies=[];aiTanks=[];gameConfig={difficulty:'normal'};
    initBaseSpawns();
    updateBaseSpawns(9.9);
`,context);
assert.strictEqual(vm.runInContext('allies.length+enemies.length',context),0,'neither base should spawn before ten seconds');
vm.runInContext('updateBaseSpawns(.2)',context);
assert.strictEqual(vm.runInContext('enemies.length',context),1,'red base should spawn one tank every ten seconds');
assert.strictEqual(vm.runInContext('allies.length',context),0,'blue base should still be waiting for fifteen seconds');
vm.runInContext('updateBaseSpawns(4.9)',context);
assert.strictEqual(vm.runInContext('allies.length',context),1,'blue base should spawn one tank after fifteen seconds');
assert.strictEqual(vm.runInContext('enemies.length',context),1,'red base should not spawn a second tank before another ten seconds');

const spawnDistances=vm.runInContext(`({
    blue:Math.hypot(allies[0].x-(bases.blue.x+bases.blue.w/2),allies[0].y-(bases.blue.y+bases.blue.h/2)),
    red:Math.hypot(enemies[0].x-(bases.red.x+bases.red.w/2),enemies[0].y-(bases.red.y+bases.red.h/2))
})`,context);
assert(spawnDistances.blue<500&&spawnDistances.red<500,'reinforcements should deploy beside their own bases');
assert(announcements.some(item=>item.team==='blue')&&announcements.some(item=>item.team==='red'),'both base deployments should be announced');

console.log('Map scale and base spawn smoke test passed:',{
    maps:Object.keys(expectedMaps).length,
    islandCount:5,
    blueInterval:15,
    redInterval:10
});
