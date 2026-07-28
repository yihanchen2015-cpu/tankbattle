const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const context = {
    console,
    Math,
    Date,
    Map,
    Set,
    AbortController,
    performance: {now: () => 1000},
    window: {},
    document: {getElementById() { return null; }},
    init() {},
    addBattleAnnouncement() {},
    createParticles() {},
    addExhaustTrail() {},
    playWorldSound() {},
    showDamageNumber() {}
};

vm.createContext(context);
for(const file of ['Config.js', 'Progression.js', 'GameCore.js', 'Combat.js', 'Pathfinding.js', 'AI.js']) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, {filename: file});
}

const result = vm.runInContext(`(() => {
    currentMap='classic';
    gameMode='classic';
    gameConfig={difficulty:'normal'};
    generateMap();
    obstacles=[];
    terrainZones=[];
    mapElements=[];
    outposts=[];
    initPathGrid();

    player=null;
    const leader=createTank(TANKS.xingchen27b,1000,2700,'blue',false);
    leader.masteryLevel=8;
    leader.masteryAura=true;
    leader.masteryAuraRadius=430;
    const followerA=createTank(TANKS.zuoyan29,1120,2650,'blue',false);
    const followerB=createTank(TANKS.zuoyan30,1200,2750,'blue',false);
    followerA.masteryLevel=2;
    followerA.masteryAura=false;
    followerB.masteryLevel=3;
    followerB.masteryAura=false;
    allies=[leader,followerA,followerB];
    enemies=[];
    aiTanks=[...allies];

    refreshAISquadMembership(leader,2);
    refreshAISquadMembership(followerA,2);
    refreshAISquadMembership(followerB,2);
    const slotA=getAISquadFormationTarget(followerA,leader);
    const slotB=getAISquadFormationTarget(followerB,leader);

    [leader,followerA,followerB].forEach(tank=>{
        tank.aiState='capturing';
        tank.aiBehavior=0;
        tank.aiFocusFireTarget=null;
    });
    updateSpatialGrid();
    resetAISharedPathCache();
    const sharedPathA=getSharedAIPath(followerA,{x:3900,y:2700});
    const sharedPathB=getSharedAIPath(followerB,{x:3960,y:2760});
    const sharedStats={...aiSharedPathStats};

    followerA.x=1000;
    followerA.y=2700;
    followerB.x=1250;
    followerB.y=2700;
    const nearbyEnemy=createTank(TANKS.xingchen27a,520,2700,'red',false);
    nearbyEnemy.masteryAura=false;
    enemies=[nearbyEnemy];
    aiTanks=[leader,followerA,followerB,nearbyEnemy];
    updateSpatialGrid();
    resetAISharedPathCache();
    getSharedAIPath(followerA,{x:3900,y:2700});
    getSharedAIPath(followerB,{x:3960,y:2760});
    const splitStats={...aiSharedPathStats};

    enemies=[];
    aiTanks=[leader,followerA,followerB];
    const reinforcement=spawnBaseTank('red');

    return {
        leaderSquadId:leader.aiSquadId,
        followerLeaderIds:[followerA.aiSquadLeaderId,followerB.aiSquadLeaderId],
        followerSlots:[followerA.aiSquadSlot,followerB.aiSquadSlot],
        formationName:leader.aiSquadName,
        formationSpacing:Math.hypot(slotA.x-slotB.x,slotA.y-slotB.y),
        sharedStats,
        sharedPathsReady:!!(sharedPathA&&sharedPathB),
        followerBReused:followerB.aiSharedPathReused,
        splitStats,
        redSkill:reinforcement.aiSkillLevel,
        redDamage:reinforcement.aiDamageMult
    };
})()`, context);

assert(result.leaderSquadId, 'a level-five-or-higher aura tank should establish a squad');
assert.deepStrictEqual(JSON.parse(JSON.stringify(result.followerLeaderIds)),
    [result.leaderSquadId.replace('squad-', ''), result.leaderSquadId.replace('squad-', '')],
    'lower-level AI should join the aura tank as followers');
assert.notStrictEqual(result.followerSlots[0], result.followerSlots[1], 'followers should occupy distinct formation slots');
assert(['铁三角','双风突袭','不死军团','天罚核心','三体自杀','闪电猎杀'].includes(result.formationName),
    'AI squads should use a formation from the game introduction');
assert(result.formationSpacing >= 70, 'formation slots should keep squad members visibly separated');
assert.strictEqual(result.sharedPathsReady, true);
assert.deepStrictEqual(JSON.parse(JSON.stringify(result.sharedStats)), {solved:1,reused:1},
    'nearby squad members in matching situations should share one A* result');
assert.deepStrictEqual(JSON.parse(JSON.stringify(result.splitStats)), {solved:2,reused:0},
    'different nearby-enemy context should prevent unsafe A* sharing');
assert(Math.abs(result.redSkill-1.08)<1e-9 && Math.abs(result.redDamage-1.05)<1e-9,
    'normal-mode red reinforcements should use roughly 1.0-1.1 multipliers');

const render=fs.readFileSync('Render.js','utf8');
const threeRender=fs.readFileSync('ThreeRender.js','utf8');
assert(render.includes('masteryAuraInspired') && render.includes("fillText('+', x, y)"),
    '2D aura recipients should show rising plus symbols and airflow');
assert(threeRender.includes('masteryBuffFx') && threeRender.includes('airflow'),
    '3D aura recipients should show the same buff feedback');

console.log('AI squad and shared path smoke test passed:',result);
