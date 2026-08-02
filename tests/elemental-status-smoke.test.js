const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

let randomRoll = .99;
const controlledMath = Object.create(Math);
controlledMath.random = () => randomRoll;
const context = {console, Math:controlledMath, Date, performance:{now:()=>1000}, trailEffects:[], __setRoll(value){ randomRoll=value; }};
vm.createContext(context);
vm.runInContext(fs.readFileSync('TankEvolution.js','utf8'), context, {filename:'TankEvolution.js'});

const result = vm.runInContext(`(() => {
    const tank={dead:false};
    for(let index=0; index<11; index++) applyTankElementalStatus(tank,'ice',1.5);
    const frozen={duration:tank.elementalFreezeTimer,action:getTankActionSpeedMultiplier(tank)};
    for(let index=0; index<6; index++) applyTankElementalStatus(tank,'toxin',3,{interval:1,damage:20+index,slow:.15});
    for(let index=0; index<6; index++) applyTankElementalStatus(tank,'fire',3,{interval:1,damage:30+index});
    const toxinTarget={dead:false,team:'red',x:0,y:0};
    const fireTarget={dead:false,team:'red',x:0,y:0};
    const toxinProjectile={team:'blue',toxinData:{chance:.4,duration:3,damage:20}};
    const fireProjectile={team:'blue',fireData:{chance:.4,duration:3,damage:30}};
    for(let index=0;index<5;index++) {
        tryApplyProjectileElementalStatus(toxinProjectile,toxinTarget);
        tryApplyProjectileElementalStatus(fireProjectile,fireTarget);
    }
    const failedRolls={toxin:toxinTarget.toxinDebuffTimer||0,fire:fireTarget.burnTimer||0};
    __setRoll(.01);
    const toxinTriggered=tryApplyProjectileElementalStatus(toxinProjectile,toxinTarget);
    const fireTriggered=tryApplyProjectileElementalStatus(fireProjectile,fireTarget);
    return {frozen,toxin:tank.toxinDebuffTimer,fire:tank.burnTimer,toxinDamage:tank.toxinDamage,burnDamage:tank.burnDamage,
        failedRolls,toxinTriggered,fireTriggered,triggeredDurations:{toxin:toxinTarget.toxinDebuffTimer,fire:fireTarget.burnTimer}};
})()`, context);

assert.deepStrictEqual(JSON.parse(JSON.stringify(result.frozen)), {duration:15,action:.5});
assert.strictEqual(result.toxin, 15, 'toxin duration should stack up to the shared 15-second cap');
assert.strictEqual(result.fire, 15, 'burn duration should stack up to the shared 15-second cap');
assert.strictEqual(result.toxinDamage, 25);
assert.strictEqual(result.burnDamage, 35);
assert.deepStrictEqual(JSON.parse(JSON.stringify(result.failedRolls)), {toxin:0,fire:0}, 'repeated hits must not apply toxin or fire when the trigger roll fails');
assert.deepStrictEqual(Array.from(result.toxinTriggered), ['toxin']);
assert.deepStrictEqual(Array.from(result.fireTriggered), ['fire']);
assert.deepStrictEqual(JSON.parse(JSON.stringify(result.triggeredDurations)), {toxin:3,fire:3});

const three = fs.readFileSync('ThreeRender.js','utf8');
const game = fs.readFileSync('GameCore.js','utf8');
const pathfinding = fs.readFileSync('Pathfinding.js','utf8');
assert(three.includes('function createThreeTankElementalEffects'));
assert(three.includes('fx.userData.ice.visible = frozen'));
assert(three.includes('fx.userData.toxin.visible = poisoned'));
assert(three.includes('fx.userData.fire.visible = burning'));
assert(three.includes('projectile.rotation.x = 0'));
assert(!three.includes('projectile.rotation.x = (bullet.age || 0) * 7.5'), 'ice prisms must not spin in flight');
assert(three.includes('projectile.userData.isToxicOrb = true'));
assert(three.includes('projectile.userData.isFireOrb = true'));
assert(game.includes('const actionDt = dt * actionSpeed'));
assert(pathfinding.includes('statusSlow * elementalFreezeSlow'));

console.log('Elemental status smoke test passed:', result);
