// ==================== 废弃工厂 Ammo.js 轻量物理 ====================
// Ammo 使用米制缩放：地图 50 单位约等于物理世界 1 单位。
const FACTORY_PHYSICS_SCALE = 0.02;
let factoryAmmoModule = null;
let factoryAmmoPromise = null;
let factoryPhysicsGeneration = 0;
let factoryPhysicsState = createEmptyFactoryPhysicsState();

function createEmptyFactoryPhysicsState() {
    return {
        ready:false,
        loading:false,
        mapName:null,
        world:null,
        Ammo:null,
        bodies:[],
        dynamicBodies:new Map(),
        tankBodies:new Map(),
        elevatorBodies:new Map(),
        mechanismBodies:new Map(),
        constraints:new Map(),
        tempTransform:null
    };
}

function isFactoryPhysicsReady() {
    return factoryPhysicsState.mapName===currentMap&&factoryPhysicsState.ready&&!!factoryPhysicsState.world;
}

function getBattlePhysicsDiagnostics() {
    return {
        ready:isFactoryPhysicsReady(),
        mapName:factoryPhysicsState.mapName,
        currentMap,
        loading:factoryPhysicsState.loading,
        bodies:factoryPhysicsState.bodies.length,
        tanks:factoryPhysicsState.tankBodies.size
    };
}

function initializeFactoryPhysics() {
    const requestedMap=currentMap;
    const generation=++factoryPhysicsGeneration;
    factoryPhysicsState.loading=true;
    if(!factoryAmmoPromise){
        if(typeof Ammo!=='function'){
            console.warn('[FACTORY PHYSICS] Ammo.js 未加载，暂用基础地图物理');
            factoryPhysicsState.loading=false;
            return;
        }
        factoryAmmoPromise=Promise.resolve(Ammo({
            locateFile:path=>path.endsWith('.wasm')?'vendor/ammo.wasm.wasm':`vendor/${path}`
        })).then(module=>factoryAmmoModule=module);
    }
    factoryAmmoPromise.then(module=>{
        if(generation!==factoryPhysicsGeneration||currentMap!==requestedMap)return;
        buildFactoryPhysicsWorld(module);
    }).catch(error=>{
        factoryPhysicsState.loading=false;
        console.error('[FACTORY PHYSICS] Ammo.js 初始化失败:',error);
    });
}

function disposeFactoryPhysics() {
    factoryPhysicsGeneration++;
    const state=factoryPhysicsState;
    if(state.world&&state.Ammo){
        state.constraints.forEach(held=>{
            try{state.world.removeConstraint(held.constraint);}catch(error){}
        });
        state.bodies.forEach(entry=>{
            try{state.world.removeRigidBody(entry.body);}catch(error){}
        });
    }
    obstacles.forEach(obs=>{
        delete obs.physicsBody;
        delete obs.physicsQuaternion;
    });
    factoryPhysicsState=createEmptyFactoryPhysicsState();
}

function buildFactoryPhysicsWorld(A) {
    disposeFactoryPhysics();
    const collisionConfiguration=new A.btDefaultCollisionConfiguration();
    const dispatcher=new A.btCollisionDispatcher(collisionConfiguration);
    const broadphase=new A.btDbvtBroadphase();
    const solver=new A.btSequentialImpulseConstraintSolver();
    const world=new A.btDiscreteDynamicsWorld(dispatcher,broadphase,solver,collisionConfiguration);
    const gravity=new A.btVector3(0,-19.6,0);
    world.setGravity(gravity);
    A.destroy(gravity);
    factoryPhysicsState={
        ready:false,loading:false,mapName:currentMap,world,Ammo:A,bodies:[],dynamicBodies:new Map(),
        tankBodies:new Map(),elevatorBodies:new Map(),mechanismBodies:new Map(),constraints:new Map(),
        tempTransform:new A.btTransform(),
        collisionConfiguration,dispatcher,broadphase,solver
    };
    if(currentMap==='factory'&&mapMechanicsState.factory){
        addFactoryPhysicsFloors();
        addFactoryPhysicsRamps();
        addFactoryPhysicsObstacles();
        addFactoryPhysicsElevators();
        addFactoryPhysicsMechanisms();
    }else{
        addBattlePhysicsGroundAndObstacles();
    }
    factoryPhysicsState.ready=true;
    console.info('[BATTLE PHYSICS] Ammo.js 物理世界已启用');
    if(currentMap==='factory'&&typeof showFactoryJuiceCue==='function'){
        const cueTank=typeof player!=='undefined'&&player?player:null;
        showFactoryJuiceCue('物 理 工 厂！','Ammo 动态碰撞系统上线','#ffd447',.9,
            cueTank?cueTank.x:null,cueTank?cueTank.y:null,cueTank?cueTank.z:null,true);
    }
}

function addBattlePhysicsGroundAndObstacles() {
    addFactoryPhysicsBox(CONFIG.mapWidth,16,CONFIG.mapHeight,CONFIG.mapWidth/2,-8,CONFIG.mapHeight/2,0,null,{friction:1,kind:'ground'});
    obstacles.forEach(obs=>{
        const height=typeof getObstacleWorldHeight==='function'?Math.max(35,getObstacleWorldHeight(obs)):70;
        addFactoryPhysicsBox(obs.w,height,obs.h,obs.x+obs.w/2,height/2,obs.y+obs.h/2,0,null,{
            friction:.9,owner:obs,kind:'obstacle'
        });
    });
}

function addFactoryRigidBody(shape,mass,x,elevation,mapY,quaternion=null,options={}) {
    const A=factoryPhysicsState.Ammo;
    const transform=new A.btTransform();
    transform.setIdentity();
    const origin=new A.btVector3(x*FACTORY_PHYSICS_SCALE,elevation*FACTORY_PHYSICS_SCALE,mapY*FACTORY_PHYSICS_SCALE);
    transform.setOrigin(origin);
    if(quaternion)transform.setRotation(quaternion);
    const motionState=new A.btDefaultMotionState(transform);
    const inertia=new A.btVector3(0,0,0);
    if(mass>0)shape.calculateLocalInertia(mass,inertia);
    const info=new A.btRigidBodyConstructionInfo(mass,motionState,shape,inertia);
    const body=new A.btRigidBody(info);
    body.setFriction(options.friction===undefined?.72:options.friction);
    body.setRestitution(options.restitution||0);
    if(mass>0){
        body.setDamping(options.linearDamping===undefined?.12:options.linearDamping,options.angularDamping===undefined?.28:options.angularDamping);
        if(typeof body.setRollingFriction==='function')body.setRollingFriction(options.rollingFriction||.08);
    }
    factoryPhysicsState.world.addRigidBody(body);
    const entry={body,shape,motionState,info,mass,owner:options.owner||null,kind:options.kind||'static'};
    factoryPhysicsState.bodies.push(entry);
    A.destroy(origin);A.destroy(inertia);A.destroy(transform);
    return entry;
}

function addFactoryPhysicsBox(w,h,d,x,elevation,mapY,mass=0,quaternion=null,options={}) {
    const A=factoryPhysicsState.Ammo;
    const halfExtents=new A.btVector3(w*.5*FACTORY_PHYSICS_SCALE,h*.5*FACTORY_PHYSICS_SCALE,d*.5*FACTORY_PHYSICS_SCALE);
    const shape=new A.btBoxShape(halfExtents);
    A.destroy(halfExtents);
    return addFactoryRigidBody(shape,mass,x,elevation,mapY,quaternion,options);
}

function getFactoryPhysicsSlabOpenings(zone) {
    if(zone.type!=='factoryFloorSlab'||zone.z<=0||zone.z>=getFactoryFloorZ(3))return [];
    const openings=mapMechanicsState.factory.elevators.map(e=>({x:e.x,y:e.y,w:e.w,h:e.h}));
    mapMechanicsState.factory.ramps.forEach(ramp=>{
        if(Math.abs(ramp.toZ-zone.z)>1)return;
        const portion=.3;
        if(ramp.axis==='x')openings.push(ramp.reverse
            ?{x:ramp.x,y:ramp.y,w:ramp.w*portion,h:ramp.h}
            :{x:ramp.x+ramp.w*(1-portion),y:ramp.y,w:ramp.w*portion,h:ramp.h});
        else openings.push(ramp.reverse
            ?{x:ramp.x,y:ramp.y,w:ramp.w,h:ramp.h*portion}
            :{x:ramp.x,y:ramp.y+ramp.h*(1-portion),w:ramp.w,h:ramp.h*portion});
    });
    return openings;
}

function splitFactoryPhysicsRect(zone,openings) {
    let pieces=[{x:zone.x,y:zone.y,w:zone.w,h:zone.h}];
    openings.forEach(hole=>{
        const next=[];
        pieces.forEach(piece=>{
            const left=Math.max(piece.x,hole.x),right=Math.min(piece.x+piece.w,hole.x+hole.w);
            const top=Math.max(piece.y,hole.y),bottom=Math.min(piece.y+piece.h,hole.y+hole.h);
            if(right<=left||bottom<=top){next.push(piece);return;}
            if(top>piece.y)next.push({x:piece.x,y:piece.y,w:piece.w,h:top-piece.y});
            if(bottom<piece.y+piece.h)next.push({x:piece.x,y:bottom,w:piece.w,h:piece.y+piece.h-bottom});
            if(left>piece.x)next.push({x:piece.x,y:top,w:left-piece.x,h:bottom-top});
            if(right<piece.x+piece.w)next.push({x:right,y:top,w:piece.x+piece.w-right,h:bottom-top});
        });
        pieces=next;
    });
    return pieces.filter(piece=>piece.w>1&&piece.h>1);
}

function addFactoryPhysicsFloors() {
    terrainZones.filter(zone=>zone.type==='factoryFloorSlab'||zone.type==='factoryCeilingSlab').forEach(zone=>{
        splitFactoryPhysicsRect(zone,getFactoryPhysicsSlabOpenings(zone)).forEach(piece=>{
            addFactoryPhysicsBox(piece.w,16,piece.h,piece.x+piece.w/2,zone.z-8,piece.y+piece.h/2,0,null,{friction:.9,kind:'slab'});
        });
    });
}

function createFactoryPhysicsQuaternion(axisX,axisY,axisZ,angle) {
    const A=factoryPhysicsState.Ammo;
    const quaternion=new A.btQuaternion(0,0,0,1);
    const axis=new A.btVector3(axisX,axisY,axisZ);
    quaternion.setRotation(axis,angle);
    A.destroy(axis);
    return quaternion;
}

function addFactoryPhysicsRamps() {
    mapMechanicsState.factory.ramps.forEach(ramp=>{
        const horizontal=ramp.axis==='y'?ramp.h:ramp.w;
        const width=ramp.axis==='y'?ramp.w:ramp.h;
        const rise=ramp.toZ-ramp.fromZ;
        const length=Math.hypot(horizontal,rise);
        const slope=Math.atan2(rise,horizontal)*(ramp.reverse?-1:1);
        const quaternion=ramp.axis==='y'
            ?createFactoryPhysicsQuaternion(1,0,0,-slope)
            :createFactoryPhysicsQuaternion(0,0,1,slope);
        const centerX=ramp.x+ramp.w/2,centerY=ramp.y+ramp.h/2,centerZ=(ramp.fromZ+ramp.toZ)/2;
        if(ramp.axis==='y')addFactoryPhysicsBox(width,ramp.deckThickness,length,centerX,centerZ-ramp.deckThickness/2,centerY,0,quaternion,{friction:1,kind:'ramp'});
        else addFactoryPhysicsBox(length,ramp.deckThickness,width,centerX,centerZ-ramp.deckThickness/2,centerY,0,quaternion,{friction:1,kind:'ramp'});
        [-1,1].forEach(side=>{
            const railX=ramp.axis==='y'?centerX+side*(width-ramp.guardrailWidth)/2:centerX;
            const railY=ramp.axis==='x'?centerY+side*(width-ramp.guardrailWidth)/2:centerY;
            if(ramp.axis==='y')addFactoryPhysicsBox(ramp.guardrailWidth,ramp.guardrailHeight,length,railX,centerZ+ramp.guardrailHeight/2,railY,0,quaternion,{friction:.8,kind:'rail'});
            else addFactoryPhysicsBox(length,ramp.guardrailHeight,ramp.guardrailWidth,railX,centerZ+ramp.guardrailHeight/2,railY,0,quaternion,{friction:.8,kind:'rail'});
        });
        factoryPhysicsState.Ammo.destroy(quaternion);
    });
}

function addFactoryPhysicsObstacles() {
    obstacles.forEach(obs=>{
        if(obs.conveyorMovable){
            addFactoryPhysicsDynamicObstacle(obs);
            return;
        }
        if(!['factoryBoundary','factoryElevatorShaft','factoryFacility'].includes(obs.type))return;
        const base=Number.isFinite(obs.z)?obs.z:(Number.isInteger(obs.factoryFloor)?getFactoryFloorZ(obs.factoryFloor):0);
        const top=typeof getObstacleWorldHeight==='function'?getObstacleWorldHeight(obs):base+80;
        addFactoryPhysicsBox(obs.w,top-base,obs.h,obs.x+obs.w/2,base+(top-base)/2,obs.y+obs.h/2,0,null,{friction:.85,owner:obs,kind:'obstacle'});
    });
}

function addFactoryPhysicsDynamicObstacle(obs) {
    const A=factoryPhysicsState.Ammo;
    const height=obs.type==='oilBarrel'?48:(obs.type==='factorySkateboard'?14:54);
    // 场景轻物体严格控制在 0.5t 内：油桶 0.18t、货箱 0.45t。
    const mass=obs.type==='oilBarrel'?.18:(obs.type==='factorySkateboard'?.09:.45);
    let shape;
    if(obs.type==='oilBarrel'){
        const half=new A.btVector3(obs.w*.48*FACTORY_PHYSICS_SCALE,height*.5*FACTORY_PHYSICS_SCALE,obs.h*.48*FACTORY_PHYSICS_SCALE);
        shape=new A.btCylinderShape(half);
        A.destroy(half);
    }else{
        const half=new A.btVector3(obs.w*.5*FACTORY_PHYSICS_SCALE,height*.5*FACTORY_PHYSICS_SCALE,obs.h*.5*FACTORY_PHYSICS_SCALE);
        shape=new A.btBoxShape(half);
        A.destroy(half);
    }
    const entry=addFactoryRigidBody(shape,mass,obs.x+obs.w/2,(obs.z||0)+height/2,obs.y+obs.h/2,null,{
        friction:obs.physicsLowFriction?.12:(obs.type==='oilBarrel'?.62:.82),restitution:obs.type==='oilBarrel'?.18:.06,
        linearDamping:.08,angularDamping:.18,rollingFriction:obs.type==='oilBarrel'?.12:.05,
        owner:obs,kind:'dynamic'
    });
    obs.physicsBody=entry.body;
    obs.physicsMass=mass;
    obs.physicsHeight=height;
    factoryPhysicsState.dynamicBodies.set(obs,entry);
}

function addFactoryPhysicsElevators() {
    mapMechanicsState.factory.elevators.forEach(elevator=>{
        const entry=addFactoryPhysicsBox(elevator.w-72,10,elevator.h-72,elevator.x+elevator.w/2,elevator.platformZ-5,elevator.y+elevator.h/2,0,null,{friction:1,owner:elevator,kind:'elevator'});
        entry.body.setCollisionFlags(entry.body.getCollisionFlags()|2);
        entry.body.setActivationState(4);
        factoryPhysicsState.elevatorBodies.set(elevator,entry);
    });
}

function addFactoryPhysicsMechanisms() {
    const factory=mapMechanicsState.factory;
    if(factory.press){
        const press=factory.press;
        const entry=addFactoryPhysicsBox(press.w,16,press.h,press.x+press.w/2,press.plateZ-8,press.y+press.h/2,0,null,{friction:1,owner:press,kind:'press'});
        entry.body.setCollisionFlags(entry.body.getCollisionFlags()|2);
        entry.body.setActivationState(4);
        factoryPhysicsState.mechanismBodies.set(press,entry);
    }
    if(factory.forklift){
        const forklift=factory.forklift;
        const entry=addFactoryPhysicsBox(92,48,58,forklift.x,forklift.z+24,forklift.y,0,null,{friction:.9,owner:forklift,kind:'forklift'});
        entry.body.setCollisionFlags(entry.body.getCollisionFlags()|2);
        entry.body.setActivationState(4);
        factoryPhysicsState.mechanismBodies.set(forklift,entry);
    }
}

function syncFactoryKinematicBody(entry,x,elevation,mapY) {
    const A=factoryPhysicsState.Ammo;
    const transform=factoryPhysicsState.tempTransform;
    transform.setIdentity();
    const origin=new A.btVector3(x*FACTORY_PHYSICS_SCALE,elevation*FACTORY_PHYSICS_SCALE,mapY*FACTORY_PHYSICS_SCALE);
    transform.setOrigin(origin);
    entry.body.setWorldTransform(transform);
    if(entry.motionState)entry.motionState.setWorldTransform(transform);
    entry.body.activate();
    A.destroy(origin);
}

function syncFactoryPhysicsTanks(tanks,dt) {
    const A=factoryPhysicsState.Ammo;
    const alive=new Set();
    tanks.forEach(tank=>{
        if(tank.isFlying)return;
        alive.add(tank);
        let entry=factoryPhysicsState.tankBodies.get(tank);
        if(!entry){
            const half=new A.btVector3(CONFIG.tankSize*.95*FACTORY_PHYSICS_SCALE,18*FACTORY_PHYSICS_SCALE,CONFIG.tankSize*.82*FACTORY_PHYSICS_SCALE);
            const shape=new A.btBoxShape(half);A.destroy(half);
            const nominalMass=Math.max(8,tank.weight||35);
            // 履带与驻车制动会随吨位迅速增强；用非线性求解质量模拟重坦“扎地”效果，
            // 但仍保留 nominalMass 作为真实吨位。
            const solverMass=nominalMass*Math.pow(Math.max(1,nominalMass/25),3);
            entry=addFactoryRigidBody(shape,solverMass,tank.x,(tank.z||0)+18,tank.y,null,{
                friction:1.05,restitution:.08,linearDamping:.32,angularDamping:.92,owner:tank,kind:'tank'
            });
            entry.tankMass=nominalMass;
            entry.solverMass=solverMass;
            const angularFactor=new A.btVector3(0,1,0);
            entry.body.setAngularFactor(angularFactor);
            A.destroy(angularFactor);
            if(typeof entry.body.setCcdMotionThreshold==='function')entry.body.setCcdMotionThreshold(.18);
            if(typeof entry.body.setCcdSweptSphereRadius==='function')entry.body.setCcdSweptSphereRadius(.42);
            factoryPhysicsState.tankBodies.set(tank,entry);
        }
        const transform=entry.body.getWorldTransform();
        const origin=transform.getOrigin();
        const bodyX=origin.x()/FACTORY_PHYSICS_SCALE;
        const bodyY=origin.z()/FACTORY_PHYSICS_SCALE;
        const bodyZ=origin.y()/FACTORY_PHYSICS_SCALE-18;
        const requestedX=tank.x,requestedY=tank.y,requestedZ=tank.z||0;
        const teleported=Math.hypot(requestedX-bodyX,requestedY-bodyY)>240||Math.abs(requestedZ-bodyZ)>120;
        if(teleported){
            syncFactoryDynamicTankTransform(entry,tank);
            const zero=new A.btVector3(0,0,0);
            entry.body.setLinearVelocity(zero);
            entry.body.setAngularVelocity(zero);
            A.destroy(zero);
        }else{
            const maxDrive=Math.max(90,getActualSpeed(tank)*72);
            const desiredVX=Math.max(-maxDrive,Math.min(maxDrive,(requestedX-bodyX)/Math.max(dt,.001)));
            const desiredVY=Math.max(-maxDrive,Math.min(maxDrive,(requestedY-bodyY)/Math.max(dt,.001)));
            const current=entry.body.getLinearVelocity();
            const velocity=new A.btVector3(desiredVX*FACTORY_PHYSICS_SCALE,current.y(),desiredVY*FACTORY_PHYSICS_SCALE);
            entry.body.setLinearVelocity(velocity);
            entry.body.activate();
            A.destroy(velocity);
            syncFactoryDynamicTankRotation(entry,tank.angle||0);
        }
        tank.factoryPhysicsVX=(requestedX-(Number.isFinite(tank.factoryPhysicsLastX)?tank.factoryPhysicsLastX:requestedX))/Math.max(dt,.001);
        tank.factoryPhysicsVY=(requestedY-(Number.isFinite(tank.factoryPhysicsLastY)?tank.factoryPhysicsLastY:requestedY))/Math.max(dt,.001);
        tank.factoryPhysicsLastX=requestedX;tank.factoryPhysicsLastY=requestedY;
    });
    factoryPhysicsState.tankBodies.forEach((entry,tank)=>{
        if(alive.has(tank))return;
        factoryPhysicsState.world.removeRigidBody(entry.body);
        factoryPhysicsState.tankBodies.delete(tank);
    });
}

function syncFactoryDynamicTankRotation(entry,angle) {
    const A=factoryPhysicsState.Ammo;
    const transform=entry.body.getWorldTransform();
    const axis=new A.btVector3(0,1,0);
    const rotation=new A.btQuaternion(0,0,0,1);
    rotation.setRotation(axis,-angle);
    transform.setRotation(rotation);
    entry.body.setWorldTransform(transform);
    if(entry.motionState)entry.motionState.setWorldTransform(transform);
    entry.body.activate();
    const angularVelocity=new A.btVector3(0,0,0);
    entry.body.setAngularVelocity(angularVelocity);
    A.destroy(axis);A.destroy(rotation);A.destroy(angularVelocity);
}

function syncFactoryDynamicTankTransform(entry,tank) {
    const A=factoryPhysicsState.Ammo;
    const transform=new A.btTransform();
    transform.setIdentity();
    const origin=new A.btVector3(tank.x*FACTORY_PHYSICS_SCALE,((tank.z||0)+18)*FACTORY_PHYSICS_SCALE,tank.y*FACTORY_PHYSICS_SCALE);
    const axis=new A.btVector3(0,1,0);
    const rotation=new A.btQuaternion(0,0,0,1);
    rotation.setRotation(axis,-(tank.angle||0));
    transform.setOrigin(origin);
    transform.setRotation(rotation);
    entry.body.setWorldTransform(transform);
    if(entry.motionState)entry.motionState.setWorldTransform(transform);
    entry.body.activate();
    A.destroy(origin);A.destroy(axis);A.destroy(rotation);A.destroy(transform);
}

function syncFactoryDynamicTanksToGame(tanks) {
    const alive=new Set(tanks);
    factoryPhysicsState.tankBodies.forEach((entry,tank)=>{
        if(!alive.has(tank)||tank.dead||tank.isFlying)return;
        const transform=entry.body.getWorldTransform();
        const origin=transform.getOrigin();
        const nextX=origin.x()/FACTORY_PHYSICS_SCALE;
        const nextY=origin.z()/FACTORY_PHYSICS_SCALE;
        const nextZ=origin.y()/FACTORY_PHYSICS_SCALE-18;
        if(Number.isFinite(nextX)&&Number.isFinite(nextY)&&Number.isFinite(nextZ)){
            tank.x=Math.max(CONFIG.tankSize,Math.min(CONFIG.mapWidth-CONFIG.tankSize,nextX));
            tank.y=Math.max(CONFIG.tankSize,Math.min(CONFIG.mapHeight-CONFIG.tankSize,nextY));
            tank.z=nextZ;
            if(typeof getFactoryFloorFromZ==='function')tank.factoryFloor=getFactoryFloorFromZ(tank.z);
        }
    });
}

function applyFactoryConveyorForces(dt) {
    const A=factoryPhysicsState.Ammo;
    factoryPhysicsState.dynamicBodies.forEach((entry,obs)=>{
        const cx=obs.x+obs.w/2,cy=obs.y+obs.h/2;
        const conveyor=mapMechanicsState.factory.conveyors.find(zone=>pointInFactoryZone(cx,cy,zone,0)&&Math.abs((obs.z||0)-getFactoryFloorZ(zone.factoryFloor))<70);
        if(!conveyor)return;
        const velocity=entry.body.getLinearVelocity();
        const blend=1-Math.exp(-dt*4);
        const next=new A.btVector3(
            velocity.x()+(conveyor.dirX*conveyor.speed*FACTORY_PHYSICS_SCALE-velocity.x())*blend,
            velocity.y(),
            velocity.z()+(conveyor.dirY*conveyor.speed*FACTORY_PHYSICS_SCALE-velocity.z())*blend
        );
        entry.body.setLinearVelocity(next);
        entry.body.activate();
        A.destroy(next);
    });
}

function applyFactoryFanForces(dt) {
    const A=factoryPhysicsState.Ammo;
    const fans=mapMechanicsState.factory.fans||[];
    factoryPhysicsState.dynamicBodies.forEach((entry,obs)=>{
        const cx=obs.x+obs.w/2,cy=obs.y+obs.h/2;
        fans.forEach(fan=>{
            if(Math.abs((obs.z||0)-fan.z)>90)return;
            const dx=cx-fan.x,dy=cy-fan.y;
            const forward=dx*fan.dirX+dy*fan.dirY;
            const lateral=Math.abs(dx*fan.dirY-dy*fan.dirX);
            if(forward<=0||forward>fan.range||lateral>fan.width/2)return;
            const strength=fan.strength*(1-forward/fan.range)*entry.mass*.018;
            const impulse=new A.btVector3(fan.dirX*strength*dt,0,fan.dirY*strength*dt);
            entry.body.activate();entry.body.applyCentralImpulse(impulse);A.destroy(impulse);
        });
    });
}

function attachFactoryObjectConstraint(key,obs,x,elevation,mapY) {
    if(!isFactoryPhysicsReady()||!factoryPhysicsState.dynamicBodies.has(obs))return false;
    releaseFactoryObjectConstraint(key,0,0,0);
    const A=factoryPhysicsState.Ammo;
    const target=factoryPhysicsState.dynamicBodies.get(obs);
    const anchor=addFactoryPhysicsBox(4,4,4,x,elevation,mapY,0,null,{owner:key,kind:'constraint-anchor'});
    anchor.body.setCollisionFlags(anchor.body.getCollisionFlags()|2|4);
    anchor.body.setActivationState(4);
    const pivotA=new A.btVector3(0,0,0),pivotB=new A.btVector3(0,0,0);
    const constraint=new A.btPoint2PointConstraint(target.body,anchor.body,pivotA,pivotB);
    factoryPhysicsState.world.addConstraint(constraint,true);
    factoryPhysicsState.constraints.set(key,{constraint,anchor,target,obs});
    target.body.activate();
    A.destroy(pivotA);A.destroy(pivotB);
    return true;
}

function updateFactoryObjectConstraint(key,x,elevation,mapY) {
    const held=factoryPhysicsState.constraints.get(key);
    if(!held)return false;
    syncFactoryKinematicBody(held.anchor,x,elevation,mapY);
    return true;
}

function releaseFactoryObjectConstraint(key,vx=0,vy=0,vz=0) {
    const held=factoryPhysicsState.constraints.get(key);
    if(!held)return false;
    const A=factoryPhysicsState.Ammo;
    factoryPhysicsState.world.removeConstraint(held.constraint);
    factoryPhysicsState.world.removeRigidBody(held.anchor.body);
    factoryPhysicsState.constraints.delete(key);
    const velocity=new A.btVector3(vx*FACTORY_PHYSICS_SCALE,vz*FACTORY_PHYSICS_SCALE,vy*FACTORY_PHYSICS_SCALE);
    held.target.body.setLinearVelocity(velocity);
    held.target.body.activate();
    A.destroy(velocity);
    return true;
}

function attachFactoryCraneObject(obs,crane) {
    return attachFactoryObjectConstraint('crane',obs,crane.hookX,(obs.z||crane.z)+90,crane.hookY);
}

function updateFactoryCraneConstraint(crane,hookZ) {
    return updateFactoryObjectConstraint('crane',crane.hookX,hookZ,crane.hookY);
}

function releaseFactoryCraneObject(obs,vx,vy,vz) {
    return releaseFactoryObjectConstraint('crane',vx,vy,vz);
}

function attachFactoryForkliftObject(obs,forklift) {
    const x=forklift.x+Math.cos(forklift.angle)*62,y=forklift.y+Math.sin(forklift.angle)*62;
    return attachFactoryObjectConstraint('forklift',obs,x,forklift.z+62,y);
}

function updateFactoryForkliftConstraint(forklift) {
    const x=forklift.x+Math.cos(forklift.angle)*62,y=forklift.y+Math.sin(forklift.angle)*62;
    return updateFactoryObjectConstraint('forklift',x,forklift.z+62,y);
}

function releaseFactoryForkliftObject(obs,vx,vy,vz) {
    return releaseFactoryObjectConstraint('forklift',vx,vy,vz);
}

function syncFactoryDynamicObstacles() {
    const A=factoryPhysicsState.Ammo;
    const alive=new Set(obstacles);
    const impactExplosions=[];
    factoryPhysicsState.dynamicBodies.forEach((entry,obs)=>{
        if(!alive.has(obs)){
            factoryPhysicsState.constraints.forEach((held,key)=>{
                if(held.obs===obs)releaseFactoryObjectConstraint(key,0,0,0);
            });
            factoryPhysicsState.world.removeRigidBody(entry.body);
            factoryPhysicsState.dynamicBodies.delete(obs);
            return;
        }
        const transform=factoryPhysicsState.tempTransform;
        entry.motionState.getWorldTransform(transform);
        const origin=transform.getOrigin(),rotation=transform.getRotation();
        const centerX=origin.x()/FACTORY_PHYSICS_SCALE,centerY=origin.z()/FACTORY_PHYSICS_SCALE;
        obs.x=centerX-obs.w/2;
        obs.y=centerY-obs.h/2;
        obs.z=origin.y()/FACTORY_PHYSICS_SCALE-(obs.physicsHeight||48)/2;
        obs.physicsQuaternion={x:rotation.x(),y:rotation.y(),z:rotation.z(),w:rotation.w()};
        const verticalVelocity=entry.body.getLinearVelocity().y()/FACTORY_PHYSICS_SCALE;
        if(obs.type==='oilBarrel'&&(obs.physicsPreviousVY||0)<-330&&Math.abs(verticalVelocity)<100){
            const support=typeof getFactorySupportHeightAt==='function'?getFactorySupportHeightAt(centerX,centerY,obs.z+20):0;
            if(obs.z<=support+22)impactExplosions.push(obs);
        }
        obs.physicsPreviousVY=verticalVelocity;
        if(obs.z<-250){
            obs.z=0;
            const reset=new A.btTransform();reset.setIdentity();
            const resetOrigin=new A.btVector3(centerX*FACTORY_PHYSICS_SCALE,(obs.physicsHeight||48)*.5*FACTORY_PHYSICS_SCALE,centerY*FACTORY_PHYSICS_SCALE);
            reset.setOrigin(resetOrigin);entry.body.setWorldTransform(reset);entry.motionState.setWorldTransform(reset);
            A.destroy(resetOrigin);A.destroy(reset);
        }
    });
    impactExplosions.forEach(obs=>{
        if(obstacles.includes(obs)&&typeof triggerOilBarrelExplosion==='function')triggerOilBarrelExplosion(obs,null,new Set(),'fallImpact');
    });
}

function updateFactoryPhysics(dt,tanks) {
    if(!isFactoryPhysicsReady())return;
    if(currentMap==='factory'){
        factoryPhysicsState.elevatorBodies.forEach((entry,elevator)=>{
            syncFactoryKinematicBody(entry,elevator.x+elevator.w/2,elevator.platformZ-5,elevator.y+elevator.h/2);
        });
        factoryPhysicsState.mechanismBodies.forEach((entry,mechanism)=>{
            if(mechanism.type==='factoryPress')syncFactoryKinematicBody(entry,mechanism.x+mechanism.w/2,mechanism.plateZ-8,mechanism.y+mechanism.h/2);
            else if(mechanism.type==='factoryForklift')syncFactoryKinematicBody(entry,mechanism.x,mechanism.z+24,mechanism.y);
        });
    }
    syncFactoryPhysicsTanks(tanks,dt);
    if(currentMap==='factory'){
        applyFactoryConveyorForces(dt);
        applyFactoryFanForces(dt);
    }
    factoryPhysicsState.world.stepSimulation(Math.min(dt,.05),3,1/60);
    syncFactoryDynamicTanksToGame(tanks);
    if(currentMap==='factory')syncFactoryDynamicObstacles();
}
