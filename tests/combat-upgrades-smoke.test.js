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
    performance: {now:() => 1000},
    navigator: {},
    window: {},
    document: {
        getElementById() { return null; },
        createElement() {
            return {className:'',innerHTML:'',addEventListener(){},appendChild(){}};
        }
    },
    init() {},
    createParticles() {},
    addExhaustTrail() {},
    playWorldSound() {},
    showDamageNumber() {},
    showMessage() {},
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

    player=createTank(TANKS.zuoyan29,1000,1000,'blue',true);
    player.invincible=0;
    player.aa=3;
    player.aaElevation=10;
    const airTarget=createTank(TANKS.niuniu_heli,1450,1000,'red',false);
    airTarget.z=700;
    airTarget.invincible=0;
    allies=[];
    enemies=[airTarget];
    bullets=[];
    fireBullet(player,'aa');
    const aa=bullets[0];
    aa.trackingTarget=airTarget;
    aa.trackingLocked=true;
    aa.age=CONFIG.aaTrackingDelay;
    updateBullets(.1);
    const flightAngle=Math.atan2(aa.vz,Math.hypot(aa.vx,aa.vy)*60);

    const target=createTank(TANKS.xingchen27a,1200,1200,'red',false);
    target.invincible=0;
    const turretZone=applyTankHitReaction(target,{type:'shell',x:1200,y:1200,z:31});
    const turretJam=target.turretJamTimer;
    const trackZone=applyTankHitReaction(target,{type:'shell',x:1200,y:1200,z:10});
    const trackSlow=target.trackDamageTimer;
    const fuelZone=applyTankHitReaction(target,{type:'shell',x:1200,y:1230,z:22});
    const fuelFire=target.fuelFireTimer;

    smokeClouds=[];
    player.smoke=2;
    player.smokeCooldown=0;
    player.turretAngle=0;
    const smokeDeployed=deploySmokeGrenade(player);
    const smokeBlocks=!lineOfSight(1000,1000,1300,1000);
    const smokeRemainingAfterDeploy=player.smoke;

    const directChance=getTankArmorRicochetChance(target,{type:'shell',x:1165,y:1200,vx:18,vy:0,ricocheted:false},2.5);
    const glancingChance=getTankArmorRicochetChance(target,{type:'shell',x:1200,y:1165,vx:18,vy:0,ricocheted:false},2.5);

    enemies=[];
    player.hp=10;
    player.dead=false;
    player.goldenShieldReady=false;
    const attacker=createTank(TANKS.xingchen27a,1400,1000,'red',false);
    applyDirectDamage(player,100,attacker,'主炮',{type:'shell'});
    const upgradeState=gameState;
    damageUpgradeState.offered=['speed'];
    const speedBefore=player.damageUpgradeSpeedBoost;
    const selected=chooseDamageUpgrade('speed');
    attacker.x=player.x+40;
    attacker.y=player.y;
    attacker.dead=false;
    attacker.hp=attacker.maxHp;
    enemies=[attacker];
    updateSpatialGrid();
    player.goldenShieldReady=true;
    const shieldHpBefore=player.hp;
    const attackerHpBefore=attacker.hp;
    const shieldDamage=applyDirectDamage(player,100,attacker,'主炮',{type:'shell'});

    return {
        launchElevation:10*Math.PI/180,
        flightAngle,
        turretZone,turretJam,trackZone,trackSlow,fuelZone,fuelFire,
        smokeDeployed,smokeBlocks,smokeRemaining:smokeRemainingAfterDeploy,
        directChance,glancingChance,
        upgradeState,selected,respawned:!player.dead,
        speedGain:player.damageUpgradeSpeedBoost-speedBefore,
        respawnHp:player.hp,
        shieldDamage,
        shieldBlocked:player.hp===shieldHpBefore && !player.goldenShieldReady,
        shieldExplosionDamage:attackerHpBefore-attacker.hp
    };
})()`, context);

assert(result.flightAngle <= result.launchElevation + 1e-9,
    'AA tracking must never climb above the elevation selected at launch');
assert.strictEqual(result.turretZone,'turret');
assert(result.turretJam > 2,'upper hits should jam the turret');
assert.strictEqual(result.trackZone,'track');
assert(result.trackSlow > 4,'low hits should damage the tracks');
assert.strictEqual(result.fuelZone,'fuel');
assert(result.fuelFire > 3,'side hits should ignite the fuel tank');
assert.strictEqual(result.smokeDeployed,true,'a ground tank should deploy smoke');
assert.strictEqual(result.smokeBlocks,true,'smoke must block line of sight');
assert.strictEqual(result.smokeRemaining,1,'deploying smoke should consume one charge');
assert(result.glancingChance > result.directChance,'oblique armor impacts should ricochet more often');
assert(result.glancingChance < 1,'armor ricochet must remain probabilistic');
assert.strictEqual(result.upgradeState,'damageUpgrade','player death should enter the damage-upgrade screen');
assert.strictEqual(result.selected,true,'a presented damage upgrade should be selectable');
assert.strictEqual(result.respawned,true,'selecting an upgrade should respawn the player');
assert(Math.abs(result.speedGain-.15)<1e-9,'speed upgrade should add 15% maximum speed');
assert(result.respawnHp>0,'respawn should restore player HP');
assert.strictEqual(result.shieldDamage,0,'golden shield should fully block the next hit');
assert.strictEqual(result.shieldBlocked,true,'golden shield should be consumed without damaging the player');
assert(result.shieldExplosionDamage>0,'golden shield should produce a damaging short-range blast');

console.log('Combat upgrades smoke test passed:',result);
