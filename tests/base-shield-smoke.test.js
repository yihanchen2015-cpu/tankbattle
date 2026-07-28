const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const announcements = [];
const notifications = [];
const context = {
    console,
    Math,
    Date,
    Map,
    Set,
    AbortController,
    performance: {now:() => 1000},
    navigator: {},
    window: {},
    document: {
        getElementById() { return null; },
        createElement() { return {className:'',innerHTML:'',addEventListener(){},appendChild(){}}; }
    },
    init() {},
    createParticles() {},
    addExhaustTrail() {},
    playWorldSound() {},
    showDamageNumber() {},
    showMessage() {},
    showNotification(text) { notifications.push(text); },
    addBattleAnnouncement(team, text) { announcements.push({team,text}); },
    stopEngineAudio() {},
    recordShot() {},
    recordKill() {},
    recordPlayerDamageSource() {}
};

vm.createContext(context);
for(const file of ['Config.js','GameCore.js','Combat.js','Pathfinding.js','AI.js']) {
    vm.runInContext(fs.readFileSync(file,'utf8'), context, {filename:file});
}

const result = vm.runInContext(`(() => {
    currentMap='classic';
    gameMode='classic';
    generateMap();
    obstacles=[];
    terrainZones=[];
    mapElements=[];
    outposts=[];
    const centerX=bases.blue.x+bases.blue.w/2;
    const centerY=bases.blue.y+bases.blue.h/2;

    player=createTank(TANKS.zuoyan29,centerX,centerY,'blue',true);
    player.invincible=0;
    player.hp=player.maxHp/2;
    const outsideAlly=createTank(TANKS.xingchen27a,centerX+CONFIG.baseShieldRange+20,centerY,'blue',false);
    outsideAlly.invincible=0;
    outsideAlly.hp=outsideAlly.maxHp;
    allies=[outsideAlly];
    enemies=Array.from({length:3},(_,index)=>{
        const red=createTank(TANKS.xingchen27a,centerX+80+index*45,centerY,'red',false);
        red.invincible=0;
        return red;
    });

    updateBlueBaseShield(1);
    const activeAtThree=bases.blue.shieldActive;
    const fourth=createTank(TANKS.xingchen27a,centerX,centerY+180,'red',false);
    fourth.invincible=0;
    enemies.push(fourth);
    const hpBeforeHeal=player.hp;
    updateBlueBaseShield(1);
    const activeAtFour=bases.blue.shieldActive;
    const protectedInside=player.baseShieldProtected;
    const healed=player.hp-hpBeforeHeal;
    const insideDamage=applyDirectDamage(player,100,enemies[0],'测试');
    const outsideDamage=applyDirectDamage(outsideAlly,100,enemies[0],'测试');

    enemies.forEach(red=>{red.x=centerX+CONFIG.baseShieldRange+100;});
    updateBlueBaseShield(CONFIG.baseShieldLingerDuration-.1);
    const activeDuringLinger=bases.blue.shieldActive;
    updateBlueBaseShield(.2);
    const activeAfterLinger=bases.blue.shieldActive;
    const unshieldedDamage=applyDirectDamage(player,100,enemies[0],'测试');

    return {
        activeAtThree,activeAtFour,protectedInside,healed,playerMaxHp:player.maxHp,
        insideDamage,outsideDamage,activeDuringLinger,activeAfterLinger,
        unshieldedDamage,enemyCount:bases.blue.shieldEnemyCount
    };
})()`, context);

assert.strictEqual(result.activeAtThree, false, 'three nearby red AI should not trigger the shield');
assert.strictEqual(result.activeAtFour, true, 'more than three nearby red AI should trigger the shield');
assert.strictEqual(result.protectedInside, true, 'a blue tank inside the base radius should be protected');
assert(Math.abs(result.healed / result.playerMaxHp - .06) < 1e-9, 'the shield should restore 6% of the player maximum HP per second');
assert(Math.abs(result.insideDamage - 70) < 1e-9, 'the base shield should reduce damage by 30%');
assert.strictEqual(result.outsideDamage, 100, 'blue tanks outside the radius should take normal damage');
assert.strictEqual(result.activeDuringLinger, true, 'the shield should linger briefly after the blockade clears');
assert.strictEqual(result.activeAfterLinger, false, 'the shield should expire after its linger time');
assert.strictEqual(result.unshieldedDamage, 100, 'damage reduction should stop when the shield expires');
assert.strictEqual(result.enemyCount, 0, 'the base should expose the current nearby attacker count');
assert.strictEqual(announcements.filter(entry => entry.text.includes('基地护盾')).length, 1, 'shield activation should be announced once');
assert.strictEqual(notifications.length, 1, 'shield activation should show one notification');

const render = fs.readFileSync('Render.js', 'utf8');
const threeRender = fs.readFileSync('ThreeRender.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
assert(render.includes('基地护盾 · 敌军'), '2D mode should render the base shield range and attacker count');
assert(threeRender.includes('shieldField') && threeRender.includes('shieldRing'), '3D mode should render a shield field and ring');
assert(html.includes('Config.js?v=new-modes-20') && html.includes('ThreeRender.js?v=new-modes-20'), 'changed scripts should use fresh cache keys');

console.log('Base shield smoke test passed:', result);
