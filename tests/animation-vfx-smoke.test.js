const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const context = { console, Math, Date, performance:{ now:()=>1000 }, trailEffects:[] };
vm.createContext(context);
vm.runInContext(fs.readFileSync('TankEvolution.js','utf8'),context,{filename:'TankEvolution.js'});

const result = vm.runInContext(`(() => {
    const tank={x:100,y:100,z:0,team:'blue',tankType:'zuoyan29',turretSize:24,turretAngle:0,
        ultimateData:{radius:180},evolutionLastUltimateVisualAt:-Infinity};
    const projectile={x:140,y:100,z:24,vx:20,vy:0,type:'shell',owner:tank,evolutionStyle:'ice-prism',evolutionTrail:'#76e8ff'};
    spawnTankShotAnimation(tank,projectile,0);
    spawnTankImpactAnimation(projectile,{z:0});
    spawnTankUltimateAnimation(tank);
    return trailEffects.map(effect=>({kind:effect.kind,color:effect.color,accent:effect.accent,life:effect.life}));
})()`,context);

assert.deepStrictEqual(Array.from(result, item => item.kind), ['muzzle-ice','impact-ice','ultimate-ice']);
assert(result.every(item => item.life > 0));

const three=fs.readFileSync('ThreeRender.js','utf8');
assert(three.includes('function createThreeBipyramidGeometry'));
assert(three.includes("projectile.userData.isIcePrism = true"));
assert(three.includes("effect.kind.startsWith('muzzle-')"));
assert(three.includes("effect.kind.startsWith('impact-')"));
assert(three.includes("effect.kind.startsWith('ultimate-')"));
assert(three.includes("projectile.userData.empRings"));
assert(three.includes("projectile.userData.rocketFlame"));
assert(three.includes("projectile.userData.toxinHalo"));

console.log('Animation VFX smoke test passed:',result);
