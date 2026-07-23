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
        world:null,
        Ammo:null,
        bodies:[],
        dynamicBodies:new Map(),
        tankBodies:new Map(),
        elevatorBodies:new Map(),
        tempTransform:null
    };
}

function isFactoryPhysicsReady() {
    return currentMap==='factory'&&factoryPhysicsState.ready&&!!factoryPhysicsState.world;
}

function initializeFactoryPhysics() {
    if(currentMap!=='factory'||!mapMechanicsState.factory)return;
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
        if(generation!==factoryPhysicsGeneration||currentMap!=='factory'||!mapMechanicsState.factory)return;
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
        ready:false,loading:false,world,Ammo:A,bodies:[],dynamicBodies:new Map(),
        tankBodies:new Map(),elevatorBodies:new Map(),tempTransform:new A.btTransform(),
        collisionConfiguration,dispatcher,broadphase,solver
    };
    addFactoryPhysicsFloors();
    addFactoryPhysicsRamps();
    addFactoryPhysicsObstacles();
    addFactoryPhysicsElevators();
    factoryPhysicsState.ready=true;
    console.info('[FACTORY PHYSICS] Ammo.js 物理世界已启用');
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
    const height=obs.type==='oilBarrel'?48:54;
    const mass=obs.type==='oilBarrel'?35:85;
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
        friction:obs.type==='oilBarrel'?.62:.82,restitution:obs.type==='oilBarrel'?.18:.06,
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
            const half=new A.btVector3(CONFIG.tankSize*.82*FACTORY_PHYSICS_SCALE,18*FACTORY_PHYSICS_SCALE,CONFIG.tankSize*.95*FACTORY_PHYSICS_SCALE);
            const shape=new A.btBoxShape(half);A.destroy(half);
            entry=addFactoryRigidBody(shape,0,tank.x,(tank.z||0)+18,tank.y,null,{friction:.9,owner:tank,kind:'tank'});
            entry.body.setCollisionFlags(entry.body.getCollisionFlags()|2);
            entry.body.setActivationState(4);
            factoryPhysicsState.tankBodies.set(tank,entry);
        }
        tank.factoryPhysicsVX=(tank.x-(Number.isFinite(tank.factoryPhysicsLastX)?tank.factoryPhysicsLastX:tank.x))/Math.max(dt,.001);
        tank.factoryPhysicsVY=(tank.y-(Number.isFinite(tank.factoryPhysicsLastY)?tank.factoryPhysicsLastY:tank.y))/Math.max(dt,.001);
        tank.factoryPhysicsLastX=tank.x;tank.factoryPhysicsLastY=tank.y;
        syncFactoryKinematicBody(entry,tank.x,(tank.z||0)+18,tank.y);
    });
    factoryPhysicsState.tankBodies.forEach((entry,tank)=>{
        if(alive.has(tank))return;
        factoryPhysicsState.world.removeRigidBody(entry.body);
        factoryPhysicsState.tankBodies.delete(tank);
    });
}

function applyFactoryTankPushes(tanks) {
    const A=factoryPhysicsState.Ammo;
    factoryPhysicsState.dynamicBodies.forEach((entry,obs)=>{
        const cx=obs.x+obs.w/2,cy=obs.y+obs.h/2;
        tanks.forEach(tank=>{
            if(tank.isFlying||Math.abs((tank.z||0)-(obs.z||0))>80)return;
            const dx=cx-tank.x,dy=cy-tank.y;
            const distance=Math.max(1,Math.hypot(dx,dy));
            if(distance>CONFIG.tankSize+Math.max(obs.w,obs.h)*.58)return;
            const speed=Math.hypot(tank.factoryPhysicsVX||0,tank.factoryPhysicsVY||0);
            if(speed<8)return;
            const pushSpeed=Math.min(260,speed)*FACTORY_PHYSICS_SCALE;
            const impulse=new A.btVector3(dx/distance*entry.mass*pushSpeed*.42,entry.mass*.018,dy/distance*entry.mass*pushSpeed*.42);
            const offset=new A.btVector3(0,(obs.physicsHeight||48)*.22*FACTORY_PHYSICS_SCALE,0);
            entry.body.activate();
            entry.body.applyImpulse(impulse,offset);
            if(obs.type==='oilBarrel'){
                const angular=new A.btVector3(dy/distance*pushSpeed*.9,0,-dx/distance*pushSpeed*.9);
                entry.body.setAngularVelocity(angular);
                A.destroy(angular);
            }
            A.destroy(impulse);A.destroy(offset);
        });
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

function syncFactoryDynamicObstacles() {
    const A=factoryPhysicsState.Ammo;
    const alive=new Set(obstacles);
    factoryPhysicsState.dynamicBodies.forEach((entry,obs)=>{
        if(!alive.has(obs)){
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
        if(obs.z<-250){
            obs.z=0;
            const reset=new A.btTransform();reset.setIdentity();
            const resetOrigin=new A.btVector3(centerX*FACTORY_PHYSICS_SCALE,(obs.physicsHeight||48)*.5*FACTORY_PHYSICS_SCALE,centerY*FACTORY_PHYSICS_SCALE);
            reset.setOrigin(resetOrigin);entry.body.setWorldTransform(reset);entry.motionState.setWorldTransform(reset);
            A.destroy(resetOrigin);A.destroy(reset);
        }
    });
}

function updateFactoryPhysics(dt,tanks) {
    if(!isFactoryPhysicsReady())return;
    factoryPhysicsState.elevatorBodies.forEach((entry,elevator)=>{
        syncFactoryKinematicBody(entry,elevator.x+elevator.w/2,elevator.platformZ-5,elevator.y+elevator.h/2);
    });
    syncFactoryPhysicsTanks(tanks,dt);
    applyFactoryTankPushes(tanks);
    applyFactoryConveyorForces(dt);
    factoryPhysicsState.world.stepSimulation(Math.min(dt,.05),3,1/60);
    syncFactoryDynamicObstacles();
}
