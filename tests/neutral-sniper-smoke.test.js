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
    performance: {now:() => 1000},
    navigator: {},
    window: {},
    document: {
        getElementById() { return null; },
        createElement() {
            return {
                style:{setProperty() {}},
                classList:{add(){},remove(){}},
                replaceChildren(){},
                appendChild(){}
            };
        }
    },
    init() {},
    createParticles() {},
    addExhaustTrail() {},
    playWorldSound() {},
    showDamageNumber() {},
    showMessage() {},
    showNotification() {},
    stopEngineAudio() {},
    recordShot() {},
    recordKill() {},
    recordPlayerDamageSource() {}
};

vm.createContext(context);
for(const file of ['Config.js','Replay.js','Score.js','GameCore.js','Combat.js','Pathfinding.js','AI.js','Ultimate.js']) {
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
    const tower=neutralNPCs[0];
    const centerX=CONFIG.mapWidth/2;
    const centerY=CONFIG.mapHeight/2;

    player=createTank(TANKS.zuoyan29,centerX+180,centerY,'blue',true);
    const leader=createTank(TANKS.xingchen27a,centerX+520,centerY,'blue',false);
    const red=createTank(TANKS.xingchen27b,centerX-420,centerY,'red',false);
    player.invincible=0;
    leader.invincible=0;
    red.invincible=0;
    player.battleScore=250;
    leader.battleScore=900;
    leader.lastBattleScoreAt=20;
    red.battleScore=500;
    allies=[leader];
    enemies=[red];
    aiTanks=[leader,red];
    bullets=[];

    updateNeutralNPCs(9.99);
    const shotsBeforeInterval=bullets.length;
    updateNeutralNPCs(.02);
    const shot=bullets[0];
    const leaderHpBefore=leader.hp;
    shot.x=leader.x;
    shot.y=leader.y;
    shot.z=(leader.z||0)+22;
    updateSpatialGrid();
    checkCollisions();
    bullets=[];
    fireNeutralSniperTower(tower,leader);
    obstacles=[{
        x:centerX+100,y:centerY-70,w:100,h:140,height:180,
        type:'building',hp:1000,maxHp:1000,destructible:false
    }];
    updateBullets(.04);
    const blockedByObstacle=bullets.length===0;

    const scoreTank={team:'blue',tankType:'zuoyan29',battleScore:0,lastBattleScoreAt:0};
    awardKillScore(scoreTank,{team:'red',tankType:'xingchen27a',isFlying:false});
    outposts=[{x:centerX,y:centerY,name:'B',owner:null,captureProgress:0,capturingTeam:null,radius:CONFIG.outpostRadius,z:0}];
    updateOutposts(1);

    return {
        towerCount:neutralNPCs.length,
        towerRadius:tower.radius,
        towerPassThrough:tower.capturePassThrough && tower.blocksMovement === false &&
            !obstacles.includes(tower) && !mapElements.includes(tower),
        bCaptureProgress:outposts[0].captureProgress,
        centerX:tower.x,
        centerY:tower.y,
        shotsBeforeInterval,
        targetId:tower.currentTargetId,
        leaderId:leader.id,
        bulletDamage:shot.damage,
        bulletType:shot.type,
        bulletLarge:shot.neutralSniper,
        bulletIgnoresArmor:shot.armorIgnore,
        bulletIgnoresObstacles:shot.ignoresObstacles,
        blockedByObstacle,
        damageTaken:leaderHpBefore-leader.hp,
        lowerScoreHp:player.hp,
        personalScoreAfterKill:scoreTank.battleScore,
        teamScoreAfterKill:teamScores.blue
    };
})()`, context);

assert.strictEqual(result.towerCount, 1, 'each map should contain exactly one neutral sniper tower');
assert(result.towerRadius <= 22 && result.towerPassThrough, 'the compact tower should not obstruct the B capture area');
assert.strictEqual(result.bCaptureProgress, 1, 'a tank standing beside the center tower should still capture B normally');
assert.strictEqual(result.centerX, 2700, 'the sniper tower should be fixed at the horizontal map center');
assert.strictEqual(result.centerY, 2700, 'the sniper tower should be fixed at the vertical map center');
assert.strictEqual(result.shotsBeforeInterval, 0, 'the sniper tower should wait ten seconds before firing');
assert.strictEqual(result.targetId, result.leaderId, 'the living tank with the highest personal score should be targeted');
assert.strictEqual(result.bulletDamage, 150, 'the neutral sniper shell should deal 150 damage');
assert.strictEqual(result.bulletType, 'sniper');
assert.strictEqual(result.bulletLarge, true);
assert.strictEqual(result.bulletIgnoresArmor, true, 'the listed 150 damage should not be divided by armor');
assert.strictEqual(result.bulletIgnoresObstacles, false, 'the neutral sniper shell should participate in obstacle collision');
assert.strictEqual(result.blockedByObstacle, true, 'a building between the tower and its target should absorb the purple shell');
assert.strictEqual(result.damageTaken, 150, 'the targeted leader should take exactly 150 damage');
assert.strictEqual(result.personalScoreAfterKill, 250, 'kills should contribute to the tank personal score');
assert.strictEqual(result.teamScoreAfterKill, 250, 'personal score tracking must preserve team scoring');

const render = fs.readFileSync('Render.js','utf8');
const threeRender = fs.readFileSync('ThreeRender.js','utf8');
const html = fs.readFileSync('index.html','utf8');
assert(render.includes('🎯 中立狙击塔') && render.includes('b.neutralSniper'), '2D mode should render the tower and its large purple shell');
assert(threeRender.includes("element.type === 'neutralSniperTower'") && threeRender.includes('bullet.neutralSniper'), '3D mode should render the tower and purple shell');
assert(html.includes('Config.js?v=new-modes-20') && html.includes('GameCore.js?v=escort-rush-21'), 'sniper scripts should use fresh cache keys');

console.log('Neutral sniper smoke test passed:', result);
