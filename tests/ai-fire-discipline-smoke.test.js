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
    vm.runInContext(fs.readFileSync(file,'utf8'), context, {filename:file});
}

const result = vm.runInContext(`(() => {
    currentMap='classic';
    gameMode='classic';
    generateMap();
    terrainZones=[];
    mapElements=[];
    outposts=[];

    const runMode = (mode, options={}) => {
        gameMode=mode;
        obstacles=options.blocked
            ? [{x:1160,y:2600,w:80,h:200,type:'building',floors:5}]
            : [];
        const distance=options.distance || 400;
        player=createTank(TANKS.zuoyan29,1000,2700,'blue',true);
        player.invincible=0;
        allies=[];
        const red=createTank(TANKS.xingchen27a,1000+distance,2700,'red',false);
        red.invincible=0;
        red.shells=red.maxShells;
        red.mg=red.maxMG;
        red.aa=red.maxAA;
        red.aiState='combat';
        red.aiStateTimer=99;
        red.aiBehavior=AI_BEHAVIOR.NONE;
        red.aiBehaviorTimer=99;
        enemies=[red];
        aiTanks=[red];
        bullets=[];

        updateSpatialGrid();
        updateAITank(red,1/60);
        const immediateShots=bullets.length;
        for(let i=0;i<42;i++) {
            updateSpatialGrid();
            updateAITank(red,1/60);
        }
        return {
            immediateShots,
            eventualShots:bullets.length,
            shellSpent:red.maxShells-red.shells,
            aaSpent:red.maxAA-red.aa
        };
    };

    const modes=['classic','defense','ctf','sneak','infection','storm'];
    const byMode=Object.fromEntries(modes.map(mode=>[mode,runMode(mode)]));
    const blocked=runMode('classic',{blocked:true});
    const distant=runMode('classic',{distance:1500});
    const human=createTank(TANKS.xingchen27a,500,500,'blue',true);
    const bot=createTank(TANKS.xingchen27a,700,500,'red',false);
    return {
        byMode,
        blocked,
        distant,
        humanFireRate:human.fireRate,
        botFireRate:bot.fireRate,
        baseFireRate:TANKS.xingchen27a.fireRate
    };
})()`, context);

for(const [mode, modeResult] of Object.entries(result.byMode)) {
    assert.strictEqual(modeResult.immediateShots, 0, `${mode} AI should not fire on the first sighting frame`);
    assert(modeResult.eventualShots > 0, `${mode} AI should fire after maintaining a valid lock`);
    assert.strictEqual(modeResult.aaSpent, 0, `${mode} AI should not waste AA ammunition on a ground target`);
}
assert.strictEqual(result.blocked.eventualShots, 0, 'AI should not blind-fire through an obstacle');
assert.strictEqual(result.distant.eventualShots, 0, 'AI should hold fire outside its conservative weapon range');
assert.strictEqual(result.humanFireRate, result.baseFireRate, 'player fire rate must remain unchanged');
assert.strictEqual(result.botFireRate, result.baseFireRate * 0.75, 'all AI modes should use the conservative fire-rate multiplier');

console.log('AI fire discipline smoke test passed:', result);
