const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

class FakeElement {
    constructor() {
        this.textContent=''; this.innerHTML=''; this.style={}; this.classes=new Set();
        this.classList={add:value=>this.classes.add(value),remove:value=>this.classes.delete(value)};
    }
}
const ids=['resultRankedRating','seasonHomeSummary','rankedSeasonPanel','rankedSeasonContent','trainingControls','trainingHint'];
const elements=Object.fromEntries(ids.map(id=>[id,new FakeElement()]));
const saves=[];
const messages=[];
const context={
    console,Math,Date,Map,Set,performance:{now:()=>1000},
    document:{getElementById(id){return elements[id]||null;}},
    localStorage:{getItem(){return null;},setItem(){}},
    saveStats(){saves.push(true);},showMessage(message){messages.push(message);},
    closeInfoPanels(){},returnToHome(){},window:{}
};
context.window=context;
vm.createContext(context);
for(const file of ['Config.js','RankedTraining.js']) vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});

const result=vm.runInContext(`(() => {
    playerStats={currentMatchKills:4,rankedSeason:null,rankedHistory:[]};
    const season=getCurrentRankedSeason(Date.UTC(2026,6,1));
    const durationDays=(season.endAt-season.startAt)/86400000;
    ensureRankedSeasonState(Date.UTC(2026,6,1));
    gameMode='ranked'; teamScores={blue:1200,red:800};
    resetRankedMatchSettlement();
    const win=settleRankedMatch('victory');
    const duplicate=settleRankedMatch('victory');
    resetRankedMatchSettlement();
    playerStats.currentMatchKills=0; teamScores={blue:500,red:1500};
    const loss=settleRankedMatch('defeat');
    const rankedState={...playerStats.rankedSeason};
    renderRankedSeasonPanel();

    gameMode='training';
    player={x:300,y:300,dead:false,hp:600,maxHp:800,shells:0,maxShells:60,mg:0,maxMG:120,aa:0,maxAA:15,smoke:0,maxSmoke:4,ultimateCooldown:20};
    allies=[];
    enemies=Array.from({length:5},(_,index)=>({x:1200+index*50,y:900,maxHp:500+index*100,hp:100,dead:false}));
    aiTanks=[...enemies];
    bases={blue:{invulnerable:false},red:{invulnerable:false}};
    initializeTrainingMode();
    const initialized={
        infinite:player.suddenDeathInfiniteAmmo,invincible:player.invincible,
        dummyCount:enemies.filter(enemy=>enemy.trainingDummy).length,
        moving:enemies.filter(enemy=>enemy.trainingMoving).length,
        controls:document.getElementById('trainingControls').style.display
    };
    enemies[0].dead=true; enemies[0].hp=0; enemies[0].trainingRespawnTimer=.01;
    updateTrainingMode(.02);
    return {season,durationDays,win,duplicate,loss,rankedState,panel:document.getElementById('rankedSeasonContent').innerHTML,initialized,
        respawned:!enemies[0].dead&&enemies[0].hp===enemies[0].maxHp,
        ammo:{shells:player.shells,mg:player.mg,aa:player.aa,ultimate:player.ultimateCooldown}};
})()`,context);

assert.strictEqual(result.durationDays,56);
assert.strictEqual(result.win.delta,46);
assert.strictEqual(result.win.rating,46);
assert.strictEqual(result.duplicate,null,'one ranked match must settle only once');
assert.strictEqual(result.loss.delta,-18);
assert.strictEqual(result.rankedState.rating,28);
assert.strictEqual(result.rankedState.matches,2);
assert.strictEqual(result.rankedState.wins,1);
assert.strictEqual(result.rankedState.losses,1);
assert.strictEqual(result.rankedState.lastDelta,-18);
assert(result.panel.includes('段位阶梯')&&result.panel.includes('赛季目标')&&result.panel.includes('历届战绩'));
assert.deepStrictEqual(JSON.parse(JSON.stringify(result.initialized)),{infinite:true,invincible:null,dummyCount:5,moving:1,controls:'flex'});
assert.strictEqual(result.respawned,true);
assert.deepStrictEqual(JSON.parse(JSON.stringify(result.ammo)),{shells:60,mg:120,aa:15,ultimate:0});
assert(saves.length>=2);

const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('style.css','utf8');
assert(html.includes("selectMode('ranked')")&&html.includes("selectMode('training')"));
assert(html.includes('RankedTraining.js?v=ranked-training-36'));
assert(css.includes('.ranked-season-panel')&&css.includes('#trainingControls'));

console.log('Ranked season and training smoke test passed:',result);
