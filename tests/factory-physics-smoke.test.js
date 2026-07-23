const assert = require('assert');
const path = require('path');
const AmmoFactory = require('../vendor/ammo.wasm.js');

(async () => {
    const Ammo = await AmmoFactory({
        locateFile: () => path.resolve(__dirname, '../vendor/ammo.wasm.wasm')
    });
    const configuration = new Ammo.btDefaultCollisionConfiguration();
    const dispatcher = new Ammo.btCollisionDispatcher(configuration);
    const broadphase = new Ammo.btDbvtBroadphase();
    const solver = new Ammo.btSequentialImpulseConstraintSolver();
    const world = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, configuration);
    world.setGravity(new Ammo.btVector3(0, -9.8, 0));

    const createBody = (shape, mass, y) => {
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(0, y, 0));
        const motionState = new Ammo.btDefaultMotionState(transform);
        const inertia = new Ammo.btVector3(0, 0, 0);
        if(mass) shape.calculateLocalInertia(mass, inertia);
        const info = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, inertia);
        const body = new Ammo.btRigidBody(info);
        body.setFriction(0.7);
        world.addRigidBody(body);
        return {body, motionState};
    };

    createBody(new Ammo.btBoxShape(new Ammo.btVector3(8, 0.25, 8)), 0, -0.25);
    const barrel = createBody(new Ammo.btCylinderShape(new Ammo.btVector3(0.5, 0.6, 0.5)), 35, 3);
    for(let i = 0; i < 150; i++) world.stepSimulation(1 / 60, 3, 1 / 60);

    const transform = new Ammo.btTransform();
    barrel.motionState.getWorldTransform(transform);
    const landedY = transform.getOrigin().y();
    assert(landedY > 0.45 && landedY < 0.8, `barrel should land on the physical floor, got ${landedY}`);

    barrel.body.activate();
    barrel.body.applyCentralImpulse(new Ammo.btVector3(30, 0, 0));
    barrel.body.setAngularVelocity(new Ammo.btVector3(0, 0, -4));
    for(let i = 0; i < 20; i++) world.stepSimulation(1 / 60, 3, 1 / 60);
    barrel.motionState.getWorldTransform(transform);
    const rotation = transform.getRotation();
    assert(Math.abs(transform.getOrigin().x()) > 0.1, 'a pushed barrel should move across the floor');
    assert(Math.abs(rotation.x()) + Math.abs(rotation.y()) + Math.abs(rotation.z()) > 0.05, 'a pushed barrel should visibly rotate');

    console.log('Factory Ammo.js physics smoke test passed:', {
        landedY,
        pushedX: transform.getOrigin().x(),
        rotationZ: transform.getRotation().z()
    });
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
