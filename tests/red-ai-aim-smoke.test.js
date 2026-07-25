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
    playWorldSound() {}
};

vm.createContext(context);
for(const file of ['Config.js','GameCore.js','Combat.js','Pathfinding.js','AI.js']) {
    vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
}

vm.runInContext(`
    currentMap='classic';
    gameMode='classic';
    generateMap();
    obstacles=[];
    terrainZones=[];
    mapElements=[];
    player=createTank(TANKS.zuoyan29,1000,2700,'blue',true);
    player.hp=player.maxHp;
    allies=[];
    const red=createTank(TANKS.xingchen27a,1400,2700,'red',false);
    red.hp=red.maxHp;
    red.shells=red.maxShells;
    red.mg=red.maxMG;
    red.aa=red.maxAA;
    red.invincible=0;
    red.aiTrackedTarget=player;
    red.aiTargetLockTimer=CONFIG.aiTargetLockTime;
    red.aiReactionDelay=0;
    enemies=[red];
    aiTanks=[red];
    bullets=[];
    updateSpatialGrid();
    updateAITank(red,1/60);
`,context);

const result=vm.runInContext(`({
    targetAngle:Math.atan2(player.y-enemies[0].y,player.x-enemies[0].x),
    turretAngle:enemies[0].turretAngle,
    bullets:bullets.map(b=>({vx:b.vx,vy:b.vy,type:b.type}))
})`,context);

assert(result.bullets.length>0,'red AI should fire when a visible blue target is in range');
assert(result.bullets.every(b=>b.vx<0),'red AI projectiles should travel left toward a target on its left');
assert(Math.abs(normalize(result.turretAngle-result.targetAngle))<0.3,'red AI turret should face its target before firing');

const staleAimResult=vm.runInContext(`(() => {
    bullets=[];
    const red=enemies[0];
    red.turretAngle=0;
    red.aiAimAngle=Math.PI;
    red.shells=2;
    fireBullet(red,'shell');
    return {vx:bullets[0].vx,vy:bullets[0].vy};
})()`,context);
assert(staleAimResult.vx<0,'red AI fire should use its current target intent instead of a stale right-facing turret angle');

const salvoResult=vm.runInContext(`(() => {
    bullets=[];
    const red=createTank(TANKS.duoduo,1400,2700,'red',false);
    red.turretAngle=0;
    red.aiAimAngle=Math.PI;
    fireUltimateSalvo(red);
    return bullets.map(b=>b.vx);
})()`,context);
assert(salvoResult.length>0&&salvoResult.every(vx=>vx<0),'red AI salvo should also follow the current target intent');

const accumulatedMotionResult=vm.runInContext(`(() => {
    bullets=[];
    player.x=1300;
    player.y=2700;
    player.prevPos={x:1000,y:2700};
    const red=enemies[0];
    red.x=1400;
    red.y=2700;
    red.turretAngle=0;
    red.aiState='combat';
    red.aiStateTimer=2;
    red.aiBehavior=AI_BEHAVIOR.NONE;
    red.aiBehaviorTimer=2;
    red.fireCooldown=0;
    red.mgCooldown=0;
    red.shells=red.maxShells;
    red.mg=red.maxMG;
    red.aa=0;
    updateSpatialGrid();
    updateAITank(red,1/60);
    return {
        aim:red.aiAimAngle,
        shots:bullets.map(b=>({vx:b.vx,vy:b.vy,type:b.type})),
        predicted:getPredictedAimPoint(red,player,CONFIG.bulletSpeed,CONFIG.autoAimPredictFactor)
    };
})()`,context);
assert(accumulatedMotionResult.predicted.x<1400,'stale cumulative player movement must not push the predicted target past the red shooter');
assert(Math.cos(accumulatedMotionResult.aim)<0,'red AI should still aim left when the player is immediately to its left');
assert(accumulatedMotionResult.shots.length===0||accumulatedMotionResult.shots.every(shot=>shot.vx<0),'red AI must never fire right because of accumulated player movement');

function normalize(angle) {
    while(angle>Math.PI) angle-=Math.PI*2;
    while(angle<-Math.PI) angle+=Math.PI*2;
    return angle;
}

console.log('Red AI aim smoke test passed:',{...result,staleAimResult,salvoResult,accumulatedMotionResult});
