const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

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
    createParticles() {},
    addExhaustTrail() {},
    playWorldSound() {},
    showDamageNumber() {}
};

vm.createContext(context);
for(const file of ['Config.js','GameCore.js','Combat.js','Pathfinding.js','AI.js']) {
    vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
}

const damageResult=vm.runInContext(`(() => {
    gameMode='defense';
    currentMap='classic';
    generateMap();
    obstacles=[];
    player=createTank(TANKS.xingchen27b,1800,2700,'blue',true);
    const ally=createTank(TANKS.xingchen27a,1850,2700,'blue',false);
    const red=createTank(TANKS.xingchen27a,2200,2700,'red',false);
    player.hp=1000;
    ally.hp=1000;
    red.hp=1000;
    const playerTaken=applyDirectDamage(player,100,red,'测试');
    const aiTaken=applyDirectDamage(ally,100,red,'测试');
    const playerDealt=applyDirectDamage(red,100,player,'测试');
    return {playerTaken,aiTaken,playerDealt};
})()`,context);

assert.strictEqual(damageResult.playerTaken,62,'defense player should take only 62% damage from red AI');
assert.strictEqual(damageResult.aiTaken,60,'AI-vs-AI damage should be slowed to preserve player participation');
assert(Math.abs(damageResult.playerDealt-115)<1e-9,'player damage should receive a modest defense-mode spotlight bonus');

const targetingResult=vm.runInContext(`(() => {
    gameMode='defense';
    currentMap='classic';
    generateMap();
    obstacles=[];
    terrainZones=[];
    mapElements=[];
    player=createTank(TANKS.xingchen27b,1800,2700,'blue',true);
    player.invincible=0;
    allies=Array.from({length:5},(_,index)=>{
        const ally=createTank(TANKS.xingchen27a,1760+index*35,2450+index*100,'blue',false);
        ally.invincible=0;
        ally.shells=ally.maxShells;
        ally.mg=ally.maxMG;
        return ally;
    });
    enemies=Array.from({length:8},(_,index)=>{
        const red=createTank(TANKS.xingchen27a,2200+index*10,2400+index*80,'red',false);
        red.invincible=0;
        red.shells=red.maxShells;
        red.mg=red.maxMG;
        red.aa=0;
        red.aiState='combat';
        red.aiStateTimer=2;
        red.aiBehavior=AI_BEHAVIOR.NONE;
        red.aiBehaviorTimer=2;
        return red;
    });
    aiTanks=[...allies,...enemies];
    bullets=[];
    updateSpatialGrid();
    enemies.forEach(red=>updateAITank(red,1/60));
    return {
        playerAttackers:enemies.filter(red=>red.aiAimTarget===player).length,
        targetCount:new Set(enemies.map(red=>red.aiAimTarget).filter(Boolean)).size
    };
})()`,context);

assert(targetingResult.playerAttackers<=3,'defense mode should cap simultaneous red AI focus on the player');
assert(targetingResult.targetCount>=2,'red AI should distribute fire across multiple blue targets');

console.log('Defense balance smoke test passed:',{damageResult,targetingResult});
