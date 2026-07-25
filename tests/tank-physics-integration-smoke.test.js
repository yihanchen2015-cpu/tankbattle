const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const AmmoFactory = require('../vendor/ammo.wasm.js');

(async () => {
    const Ammo = await AmmoFactory({
        locateFile: () => path.resolve(__dirname, '../vendor/ammo.wasm.wasm')
    });
    const context = {
        console,
        Math,
        Map,
        Set,
        Ammo,
        currentMap:'classic',
        obstacles:[],
        terrainZones:[],
        mapMechanicsState:{factory:null},
        CONFIG:{mapWidth:1200,mapHeight:800,tankSize:35},
        getActualSpeed:tank=>tank.speed,
        getObstacleWorldHeight:()=>70
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../FactoryPhysics.js'),'utf8'), context, {filename:'FactoryPhysics.js'});

    const result = vm.runInContext(`(() => {
        buildFactoryPhysicsWorld(Ammo);
        const light={
            x:300,y:400,z:0,angle:0,speed:5.5,weight:25,
            dead:false,isFlying:false,trackDamageTimer:0
        };
        const heavy={
            x:430,y:400,z:0,angle:Math.PI,speed:2,weight:65,
            dead:false,isFlying:false,trackDamageTimer:0
        };
        const heavyStart=heavy.x;
        let lightPeak=light.x;
        for(let frame=0;frame<150;frame++){
            light.x+=5.5*60/60;
            updateFactoryPhysics(1/60,[light,heavy]);
            lightPeak=Math.max(lightPeak,light.x);
        }
        const lightEntry=factoryPhysicsState.tankBodies.get(light);
        const heavyEntry=factoryPhysicsState.tankBodies.get(heavy);

        currentMap='factory';
        factoryPhysicsState.mapName='factory';
        const barrel={x:700,y:350,z:0,w:48,h:48,type:'oilBarrel'};
        const crate={x:800,y:350,z:0,w:68,h:68,type:'factoryCrate'};
        addFactoryPhysicsDynamicObstacle(barrel);
        addFactoryPhysicsDynamicObstacle(crate);
        return {
            lightX:light.x,
            lightPeak,
            heavyX:heavy.x,
            heavyDisplacement:Math.abs(heavy.x-heavyStart),
            lightMass:lightEntry.tankMass,
            heavyMass:heavyEntry.tankMass,
            heavySolverMass:heavyEntry.solverMass,
            barrelMass:barrel.physicsMass,
            crateMass:crate.physicsMass
        };
    })()`, context);

    assert.strictEqual(result.lightMass,25,'light tank should use its 25t Ammo.js mass');
    assert.strictEqual(result.heavyMass,65,'heavy tank should use its 65t Ammo.js mass');
    assert.strictEqual(result.barrelMass,.18,'oil barrels should weigh only 0.18t');
    assert.strictEqual(result.crateMass,.45,'crates should weigh no more than 0.5t');
    assert(result.heavyX-result.lightX>60,'a 25t light tank should not pass through a stationary 65t heavy tank');
    assert(result.heavyDisplacement < 35,'the heavy tank should barely react to sustained light-tank contact');
    assert(result.heavySolverMass>result.heavyMass,'Ammo.js should include heavy-track anchoring resistance');

    console.log('Tank Ammo.js integration smoke test passed:',result);
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
