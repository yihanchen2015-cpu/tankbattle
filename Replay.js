// ==================== 阵亡精彩回放 ====================
// 覆盖最长 3 秒主炮飞行时间；15Hz 采样后由回放插值为平滑镜头。
const COMBAT_REPLAY_SECONDS = 3.2;
const COMBAT_REPLAY_SAMPLE_INTERVAL = 1 / 15;
const COMBAT_REPLAY_SPEED = 0.3;
let combatReplayFrames = [];
let combatReplayTime = 0;
let combatReplayAccumulator = 0;
let combatReplayActive = false;
let combatReplayAnimation = 0;
let combatReplayStartedAt = 0;
let combatReplayEndReason = 'playerDead';
let combatReplayProjectileCounter = 1;
let combatReplaySequence = [];
let lastPlayerDamageInfo = null;
let combatReplayThree = null;

function resetCombatReplay() {
    combatReplayFrames = [];
    combatReplayTime = 0;
    combatReplayAccumulator = 0;
    lastPlayerDamageInfo = null;
    combatReplaySequence = [];
    combatReplayActive = false;
    if(combatReplayAnimation) cancelAnimationFrame(combatReplayAnimation);
    combatReplayAnimation = 0;
    const overlay = document.getElementById('combatReplayOverlay');
    if(overlay) overlay.classList.remove('active');
    disposeCombatReplayThree();
}

function getReplayTankName(tank) {
    if(!tank) return '';
    return (typeof TANKS !== 'undefined' && TANKS[tank.tankType] && TANKS[tank.tankType].name) || tank.tankType || '未知单位';
}

function getReplayWeaponName(type) {
    return ({ shell: '主炮', mg: '机枪', aa: '高射炮', rocket: '火箭' })[type] || '攻击';
}

function ensureCombatReplayProjectileId(projectile) {
    if(!projectile) return null;
    if(!projectile.replayId) projectile.replayId = combatReplayProjectileCounter++;
    return projectile.replayId;
}

function recordPlayerDamageSource(damage, source, cause, projectile = null) {
    lastPlayerDamageInfo = {
        time: combatReplayTime,
        damage: Math.max(0, Math.round(damage)),
        sourceId: source ? source.id : null,
        sourceName: source ? getReplayTankName(source) : (cause || '环境伤害'),
        weapon: cause || (projectile ? getReplayWeaponName(projectile.type) : (source ? getReplayWeaponName(source.lastFiredWeapon) : '环境伤害')),
        projectileId: ensureCombatReplayProjectileId(projectile),
        projectileType: projectile ? projectile.type : null
    };
}

function updateCombatReplayBuffer(dt) {
    if(combatReplayActive || !player || gameState !== 'playing') return;
    combatReplayTime += dt;
    combatReplayAccumulator += dt;
    if(combatReplayAccumulator < COMBAT_REPLAY_SAMPLE_INTERVAL) return;
    combatReplayAccumulator %= COMBAT_REPLAY_SAMPLE_INTERVAL;
    captureCombatReplayFrame(false);
}

function captureCombatReplayFrame(force = false) {
    if(!player || (gameState !== 'playing' && !force)) return;
    const tanks = [player, ...allies, ...enemies].filter(Boolean).map(tank => ({
        id: tank.id, x: tank.x, y: tank.y, z: tank.z || 0,
        angle: tank.angle || 0, turretAngle: tank.turretAngle || tank.angle || 0,
        team: tank.team, tankType: tank.tankType, name: getReplayTankName(tank),
        color: tank.color, accent: tank.accent,
        hp: Math.max(0, tank.hp), maxHp: tank.maxHp || 1,
        dead: !!tank.dead, isFlying: !!tank.isFlying, onFire: !!tank.helicopterOnFire
    }));
    const fatalId = lastPlayerDamageInfo && lastPlayerDamageInfo.projectileId;
    const replayBullets = bullets
        .filter(b => ensureCombatReplayProjectileId(b) === fatalId || Math.hypot(b.x - player.x, b.y - player.y) < 2400)
        .slice(-160)
        .map(b => ({
            id: ensureCombatReplayProjectileId(b), ownerId: b.owner ? b.owner.id : null,
            x: b.x, y: b.y, z: b.z || 0, vx: b.vx || 0, vy: b.vy || 0,
            type: b.type, team: b.team, age: b.age || 0
        }));
    combatReplayFrames.push({
        time: combatReplayTime, playerId: player.id,
        focusX: player.x, focusY: player.y, tanks, bullets: replayBullets,
        damage: lastPlayerDamageInfo ? { ...lastPlayerDamageInfo } : null
    });
    const cutoff = combatReplayTime - COMBAT_REPLAY_SECONDS;
    while(combatReplayFrames.length > 2 && combatReplayFrames[0].time < cutoff) combatReplayFrames.shift();
}

function startCombatReplay(reason) {
    if(combatReplayActive || reason !== 'playerDead' || !player || !player.dead || combatReplayFrames.length < 2) return false;
    captureCombatReplayFrame(true);
    const fatalId = lastPlayerDamageInfo && lastPlayerDamageInfo.projectileId;
    const firstProjectileFrame = fatalId ? combatReplayFrames.findIndex(frame => frame.bullets.some(b => b.id === fatalId)) : -1;
    combatReplaySequence = combatReplayFrames.slice(firstProjectileFrame >= 0 ? Math.max(0, firstProjectileFrame - 1) : 0);
    if(combatReplaySequence.length < 2) combatReplaySequence = combatReplayFrames.slice();
    combatReplayActive = true;
    combatReplayEndReason = reason;
    gameState = 'replay';
    const overlay = document.getElementById('combatReplayOverlay');
    const cause = document.getElementById('combatReplayCause');
    if(!overlay) { combatReplayActive = false; return false; }
    overlay.classList.add('active');
    if(cause) {
        const info = lastPlayerDamageInfo;
        cause.textContent = info
            ? `致命来源：${info.sourceName} · ${info.weapon} · 最后一击 ${info.damage} 伤害`
            : '致命来源：战场环境';
    }
    combatReplayStartedAt = performance.now();
    combatReplayAnimation = requestAnimationFrame(renderCombatReplay);
    return true;
}

function lerpReplayValue(a, b, amount) { return a + (b - a) * amount; }
function smoothReplayStep(value) {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
}

function interpolateReplayItems(before, after, amount, fields) {
    const afterMap = new Map(after.map(item => [item.id, item]));
    return before.map(item => {
        const next = afterMap.get(item.id);
        if(!next) return { ...item };
        const result = { ...item };
        fields.forEach(field => result[field] = lerpReplayValue(item[field] || 0, next[field] || 0, amount));
        result.dead = amount > 0.6 ? next.dead : item.dead;
        result.hp = lerpReplayValue(item.hp || 0, next.hp || 0, amount);
        return result;
    });
}

function sampleCombatReplay(time) {
    const frames = combatReplaySequence;
    let before = frames[0], after = frames[frames.length - 1];
    for(let i = 1; i < frames.length; i++) {
        if(frames[i].time >= time) { before = frames[i - 1]; after = frames[i]; break; }
    }
    const span = Math.max(0.001, after.time - before.time);
    const amount = Math.max(0, Math.min(1, (time - before.time) / span));
    return {
        time,
        playerId: before.playerId,
        tanks: interpolateReplayItems(before.tanks, after.tanks, amount, ['x', 'y', 'z', 'angle', 'turretAngle']),
        bullets: interpolateReplayItems(before.bullets, after.bullets, amount, ['x', 'y', 'z', 'vx', 'vy', 'age'])
    };
}

function renderCombatReplay(now) {
    if(!combatReplayActive) return;
    const canvas = document.getElementById('combatReplayCanvas');
    if(!canvas) { finishCombatReplay(); return; }
    const dpr = Math.min(touchControlMode ? 1 : 1.5, window.devicePixelRatio || 1);
    const width = Math.max(320, Math.min(window.innerWidth * 0.92, 1100));
    const height = Math.max(240, Math.min(window.innerHeight * 0.72, 680));
    if(canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    }
    const firstTime = combatReplaySequence[0].time;
    const lastTime = combatReplaySequence[combatReplaySequence.length - 1].time;
    const flightDurationMs = Math.max(1500, (lastTime - firstTime) * 1000 / COMBAT_REPLAY_SPEED);
    const impactDurationMs = 1100;
    const elapsed = now - combatReplayStartedAt;
    const simulationTime = firstTime + Math.min(lastTime - firstTime, elapsed * COMBAT_REPLAY_SPEED / 1000);
    const impactProgress = Math.max(0, Math.min(1, (elapsed - flightDurationMs) / impactDurationMs));
    const frame = sampleCombatReplay(simulationTime);
    const totalProgress = Math.min(1, elapsed / (flightDurationMs + impactDurationMs));
    if(typeof THREE !== 'undefined' && initCombatReplayThree(canvas, width, height)) {
        renderCombatReplayThree(frame, totalProgress, impactProgress, width, height);
    } else {
        drawCombatReplayFrame(canvas.getContext('2d'), canvas.width, canvas.height, dpr, frame, totalProgress, impactProgress);
    }
    if(elapsed >= flightDurationMs + impactDurationMs) { finishCombatReplay(); return; }
    combatReplayAnimation = requestAnimationFrame(renderCombatReplay);
}

function replayWorldPosition(x, y, height = 0) {
    const scale = typeof THREE_WORLD_SCALE === 'number' ? THREE_WORLD_SCALE : 0.08;
    return new THREE.Vector3((x - CONFIG.mapWidth / 2) * scale, height, (y - CONFIG.mapHeight / 2) * scale);
}

function createReplayTankMesh(tank) {
    const group = new THREE.Group();
    const color = new THREE.Color(tank.color || (tank.team === 'blue' ? 0x338ddd : 0xd94444));
    const accent = new THREE.Color(tank.accent || 0xb7c3ca);
    const dark = new THREE.MeshStandardMaterial({ color: 0x151a1d, roughness: .78, metalness: .2 });
    const body = new THREE.MeshStandardMaterial({ color, roughness: .5, metalness: .3 });
    if(tank.isFlying) {
        const fuselage = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), body);
        fuselage.scale.set(3.8, 1.25, 1.3);
        const tail = new THREE.Mesh(new THREE.BoxGeometry(4.2, .35, .42), body.clone()); tail.position.x = -3.7;
        const rotor = new THREE.Mesh(new THREE.BoxGeometry(10, .1, .22), dark); rotor.position.y = 1.65;
        group.add(fuselage, tail, rotor); group.userData.rotor = rotor;
    } else {
        const hullLength = tank.tankType && tank.tankType.includes('27b') ? 6.8 : 5.8;
        const leftTrack = new THREE.Mesh(new THREE.BoxGeometry(hullLength, .85, .72), dark);
        const rightTrack = leftTrack.clone(); leftTrack.position.set(0,.48,-1.85); rightTrack.position.set(0,.48,1.85);
        const hull = new THREE.Mesh(new THREE.BoxGeometry(hullLength * .9, 1.2, 3.2), body); hull.position.y = 1.05;
        const upper = new THREE.Mesh(new THREE.BoxGeometry(hullLength * .62,.6,2.45),body.clone()); upper.position.set(.25,1.85,0);
        const turretPivot = new THREE.Group(); turretPivot.position.y = 2.25;
        const turret = new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.45,.82,8),new THREE.MeshStandardMaterial({color:accent,roughness:.42,metalness:.38}));
        const barrel = new THREE.Mesh(new THREE.BoxGeometry(4.4,.3,.35),dark.clone()); barrel.position.x = 2.65;
        turretPivot.add(turret,barrel); group.add(leftTrack,rightTrack,hull,upper,turretPivot); group.userData.turret = turretPivot;
    }
    group.traverse(child => { if(child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
    return group;
}

function initCombatReplayThree(canvas, width, height) {
    if(combatReplayThree && combatReplayThree.canvas === canvas) {
        combatReplayThree.renderer.setSize(width, height, false);
        combatReplayThree.camera.aspect = width / height;
        combatReplayThree.camera.updateProjectionMatrix();
        return true;
    }
    disposeCombatReplayThree();
    try {
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: !touchControlMode, alpha: false, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, touchControlMode ? 1 : 1.3));
        renderer.setSize(width, height, false);
        renderer.shadowMap.enabled = !touchControlMode;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        if(THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
        const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0a1118); scene.fog = new THREE.Fog(0x0a1118, 70, 190);
        const camera = new THREE.PerspectiveCamera(58, width / height, .15, 500);
        scene.add(new THREE.HemisphereLight(0xbfdfff,0x172016,1.8));
        const key = new THREE.DirectionalLight(0xffe4bb,2.8); key.position.set(-45,80,-30); key.castShadow = !touchControlMode; scene.add(key);
        const root = new THREE.Group(); scene.add(root);
        const scale = typeof THREE_WORLD_SCALE === 'number' ? THREE_WORLD_SCALE : .08;
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(CONFIG.mapWidth * scale,CONFIG.mapHeight * scale),new THREE.MeshStandardMaterial({color:0x334c22,roughness:1}));
        ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; root.add(ground);
        const routeTanks = combatReplaySequence.flatMap(frame => frame.tanks.filter(t => t.id === frame.playerId || t.id === (lastPlayerDamageInfo && lastPlayerDamageInfo.sourceId)));
        const minX = Math.min(...routeTanks.map(t=>t.x), combatReplaySequence[0].focusX) - 900;
        const maxX = Math.max(...routeTanks.map(t=>t.x), combatReplaySequence[0].focusX) + 900;
        const minY = Math.min(...routeTanks.map(t=>t.y), combatReplaySequence[0].focusY) - 900;
        const maxY = Math.max(...routeTanks.map(t=>t.y), combatReplaySequence[0].focusY) + 900;
        obstacles.forEach((obs,index) => {
            if(obs.x+obs.w<minX||obs.x>maxX||obs.y+obs.h<minY||obs.y>maxY) return;
            const obstacleHeight = (typeof getObstacleWorldHeight === 'function' ? getObstacleWorldHeight(obs) : 60) * scale;
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(obs.w*scale,obstacleHeight,obs.h*scale),new THREE.MeshStandardMaterial({color:obs.type==='building'?0x505a64:0x654b32,roughness:.92}));
            mesh.position.copy(replayWorldPosition(obs.x+obs.w/2,obs.y+obs.h/2,obstacleHeight/2));
            mesh.castShadow = !touchControlMode && index%2===0; mesh.receiveShadow = true; root.add(mesh);
        });
        const bullet = new THREE.Mesh(new THREE.SphereGeometry(.58,14,10),new THREE.MeshStandardMaterial({color:0xffa126,emissive:0xff5a00,emissiveIntensity:3.2}));
        const bulletLight = new THREE.PointLight(0xff6a17,4,22); bullet.add(bulletLight); root.add(bullet); bullet.visible = false;
        const trailGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
        const trail = new THREE.Line(trailGeometry,new THREE.LineBasicMaterial({color:0xffa33a,transparent:true,opacity:.82})); root.add(trail); trail.visible = false;
        const explosionLight = new THREE.PointLight(0xff5a12,0,50); root.add(explosionLight);
        const fragments = [];
        for(let i=0;i<30;i++) {
            const fragment = new THREE.Mesh(new THREE.BoxGeometry(.45+(i%4)*.18,.25+(i%3)*.15,.36+(i%5)*.12),new THREE.MeshStandardMaterial({color:i%4===0?0xff7020:0x3c7fb0,roughness:.65,metalness:.35}));
            fragment.visible=false; root.add(fragment); fragments.push(fragment);
        }
        combatReplayThree = { canvas,renderer,scene,camera,root,tankMeshes:new Map(),bullet,trail,explosionLight,fragments };
        return true;
    } catch(error) {
        console.warn('[REPLAY_3D] initialization failed:',error);
        disposeCombatReplayThree(); return false;
    }
}

function renderCombatReplayThree(frame, progress, impactProgress, width, height) {
    const view = combatReplayThree;
    if(!view) return;
    const activeIds = new Set();
    frame.tanks.forEach(tank => {
        activeIds.add(tank.id);
        let mesh = view.tankMeshes.get(tank.id);
        if(!mesh) { mesh=createReplayTankMesh(tank); view.root.add(mesh); view.tankMeshes.set(tank.id,mesh); }
        mesh.position.copy(replayWorldPosition(tank.x,tank.y,(tank.z||0)*(typeof THREE_WORLD_SCALE==='number'?THREE_WORLD_SCALE:.08)));
        mesh.rotation.y = -(tank.angle||0);
        if(mesh.userData.turret) mesh.userData.turret.rotation.y = -((tank.turretAngle||tank.angle||0)-(tank.angle||0));
        if(mesh.userData.rotor) mesh.userData.rotor.rotation.y = performance.now()*.025;
        mesh.visible = !(tank.id===frame.playerId && impactProgress>.04);
    });
    for(const [id,mesh] of view.tankMeshes) if(!activeIds.has(id)) mesh.visible=false;
    const cameraData = getReplayCamera(frame,impactProgress);
    const fatalId = lastPlayerDamageInfo && lastPlayerDamageInfo.projectileId;
    const fatalBullet = frame.bullets.find(b=>b.id===fatalId);
    const victim = frame.tanks.find(t=>t.id===frame.playerId)||cameraData.victim;
    const victimPos = replayWorldPosition(victim.x,victim.y,1.4);
    if(fatalBullet && impactProgress<=0) {
        const bulletPos = replayWorldPosition(fatalBullet.x,fatalBullet.y,Math.max(1.1,(fatalBullet.z||0)*(typeof THREE_WORLD_SCALE==='number'?THREE_WORLD_SCALE:.08)));
        view.bullet.visible=true; view.bullet.position.copy(bulletPos);
        const dir = new THREE.Vector3(fatalBullet.vx||1,0,fatalBullet.vy||0).normalize();
        const trailPoints=[bulletPos.clone().addScaledVector(dir,-10),bulletPos.clone()];
        view.trail.geometry.setFromPoints(trailPoints); view.trail.visible=true;
        const perp = new THREE.Vector3(-dir.z,0,dir.x);
        const closeCamera = bulletPos.clone().addScaledVector(dir,-11).addScaledVector(perp,3.8); closeCamera.y += 5.5;
        const midpoint = bulletPos.clone().lerp(victimPos,.5);
        const wideCamera = midpoint.clone().addScaledVector(dir,-25).addScaledVector(perp,13); wideCamera.y += 18;
        view.camera.position.copy(closeCamera.lerp(wideCamera,cameraData.reveal));
        const closeTarget = bulletPos.clone().addScaledVector(dir,7);
        view.camera.lookAt(closeTarget.lerp(midpoint,cameraData.reveal));
    } else {
        view.bullet.visible=false; view.trail.visible=false;
        const orbit = impactProgress*.9-.45;
        view.camera.position.set(victimPos.x+Math.cos(orbit)*25,16+impactProgress*4,victimPos.z+Math.sin(orbit)*25);
        const shake=(1-impactProgress)*1.2; view.camera.position.x+=(Math.random()-.5)*shake; view.camera.position.y+=(Math.random()-.5)*shake;
        view.camera.lookAt(victimPos);
    }
    view.explosionLight.position.copy(victimPos);
    view.explosionLight.intensity = impactProgress>0 ? Math.max(0,11-impactProgress*14) : 0;
    view.fragments.forEach((fragment,i)=>{
        if(impactProgress<=0){fragment.visible=false;return;}
        fragment.visible=true;
        const angle=i*2.399+(i%4)*.17, speed=8+(i*7%13);
        fragment.position.set(victimPos.x+Math.cos(angle)*speed*impactProgress,victimPos.y+3+Math.sin(i*.7)*4*impactProgress-impactProgress*impactProgress*3,victimPos.z+Math.sin(angle)*speed*impactProgress);
        fragment.rotation.set(angle+impactProgress*(3+i%4),impactProgress*(5+i%3),angle*.4);
    });
    const stage=document.getElementById('combatReplayStage');
    if(stage) stage.textContent=impactProgress>0?'3D 命中镜头 · 车体解体':cameraData.reveal>.2?'3D 导演镜头 · 拉远展示目标':'3D 弹道追踪 · 0.3× 慢放';
    view.renderer.render(view.scene,view.camera);
}

function disposeCombatReplayThree() {
    if(!combatReplayThree) return;
    combatReplayThree.root.traverse(object=>{ if(object.geometry) object.geometry.dispose(); if(object.material){ const materials=Array.isArray(object.material)?object.material:[object.material]; materials.forEach(material=>material.dispose()); } });
    combatReplayThree.renderer.dispose();
    combatReplayThree=null;
}

function getReplayCamera(frame, impactProgress) {
    const info = lastPlayerDamageInfo || {};
    const bullet = frame.bullets.find(item => item.id === info.projectileId);
    const finalFrame = combatReplaySequence[combatReplaySequence.length - 1];
    const victim = frame.tanks.find(item => item.id === frame.playerId) || { x: finalFrame.focusX, y: finalFrame.focusY };
    if(!bullet || impactProgress > 0) return { x: victim.x, y: victim.y, span: 1120, bullet: null, victim, reveal: 1 };
    const speed = Math.hypot(bullet.vx, bullet.vy) || 1;
    const dirX = bullet.vx / speed, dirY = bullet.vy / speed;
    const distance = Math.hypot(victim.x - bullet.x, victim.y - bullet.y);
    const reveal = smoothReplayStep(1 - distance / 520);
    const aheadX = bullet.x + dirX * 125, aheadY = bullet.y + dirY * 125;
    const wideX = (bullet.x + victim.x) / 2, wideY = (bullet.y + victim.y) / 2;
    return {
        x: lerpReplayValue(aheadX, wideX, reveal), y: lerpReplayValue(aheadY, wideY, reveal),
        span: lerpReplayValue(480, 1180, reveal), bullet, victim, reveal
    };
}

function drawReplayTank(rctx, tank, x, y, scale, isPlayer) {
    rctx.save(); rctx.translate(x, y); rctx.rotate(tank.angle || 0);
    rctx.fillStyle = '#14191c';
    rctx.fillRect(-19 * scale, -14 * scale, 38 * scale, 6 * scale);
    rctx.fillRect(-19 * scale, 8 * scale, 38 * scale, 6 * scale);
    rctx.fillStyle = tank.color || (tank.team === 'blue' ? '#338ddd' : '#d94444');
    rctx.beginPath();
    rctx.moveTo(21 * scale, 0); rctx.lineTo(12 * scale, -12 * scale); rctx.lineTo(-16 * scale, -11 * scale);
    rctx.lineTo(-20 * scale, 0); rctx.lineTo(-16 * scale, 11 * scale); rctx.lineTo(12 * scale, 12 * scale); rctx.closePath(); rctx.fill();
    rctx.strokeStyle = isPlayer ? '#fff' : (tank.team === 'blue' ? '#61b9ff' : '#ff7777');
    rctx.lineWidth = isPlayer ? 2.5 : 1.2; rctx.stroke(); rctx.restore();
    rctx.save(); rctx.translate(x, y); rctx.rotate(tank.turretAngle || tank.angle || 0);
    rctx.fillStyle = '#252b2f'; rctx.fillRect(0, -3 * scale, 30 * scale, 6 * scale);
    rctx.fillStyle = tank.accent || '#b7c3ca'; rctx.beginPath(); rctx.arc(0, 0, 9 * scale, 0, Math.PI * 2); rctx.fill(); rctx.restore();
}

function drawReplayShrapnel(rctx, victim, sx, sy, impactProgress) {
    if(impactProgress <= 0) return;
    const t = impactProgress;
    const cx = sx(victim.x), cy = sy(victim.y);
    const flash = Math.max(0, 1 - t * 2.2);
    if(flash > 0) {
        const gradient = rctx.createRadialGradient(cx, cy, 0, cx, cy, 95 * flash + 25);
        gradient.addColorStop(0, `rgba(255,255,225,${flash})`);
        gradient.addColorStop(.35, `rgba(255,126,20,${flash * .85})`);
        gradient.addColorStop(1, 'rgba(255,50,0,0)');
        rctx.fillStyle = gradient; rctx.beginPath(); rctx.arc(cx, cy, 110, 0, Math.PI * 2); rctx.fill();
    }
    for(let i = 0; i < 30; i++) {
        const angle = i * 2.399 + (i % 4) * 0.17;
        const speed = 45 + (i * 37 % 95);
        const distance = speed * Math.sin(t * Math.PI * 0.62);
        const x = cx + Math.cos(angle) * distance;
        const y = cy + Math.sin(angle) * distance + t * t * 45;
        const size = 3 + (i % 5) * 1.5;
        rctx.save(); rctx.translate(x, y); rctx.rotate(angle + t * (5 + i % 4));
        rctx.globalAlpha = Math.max(0, 1 - t * .72);
        rctx.fillStyle = i % 4 === 0 ? '#ff8a25' : (i % 3 === 0 ? '#24292c' : (victim.color || '#3b8ed0'));
        rctx.fillRect(-size, -size * .55, size * 2.2, size * 1.1); rctx.restore();
    }
}

function drawCombatReplayFrame(rctx, pixelWidth, pixelHeight, dpr, frame, progress, impactProgress) {
    const width = pixelWidth / dpr, height = pixelHeight / dpr;
    const cameraData = getReplayCamera(frame, impactProgress);
    const shake = impactProgress > 0 && impactProgress < .45 ? (1 - impactProgress / .45) * 9 : 0;
    const shakeX = Math.sin(impactProgress * 93) * shake, shakeY = Math.cos(impactProgress * 77) * shake;
    const scale = Math.min(width, height) / cameraData.span;
    const sx = x => width / 2 + shakeX + (x - cameraData.x) * scale;
    const sy = y => height / 2 + shakeY + (y - cameraData.y) * scale;
    rctx.setTransform(dpr, 0, 0, dpr, 0, 0); rctx.clearRect(0, 0, width, height);
    rctx.fillStyle = '#091017'; rctx.fillRect(0, 0, width, height);
    rctx.strokeStyle = 'rgba(105,155,180,.10)'; rctx.lineWidth = 1;
    const grid = 150;
    for(let x = Math.floor((cameraData.x - cameraData.span) / grid) * grid; x < cameraData.x + cameraData.span; x += grid) {
        rctx.beginPath(); rctx.moveTo(sx(x), 0); rctx.lineTo(sx(x), height); rctx.stroke();
    }
    for(let y = Math.floor((cameraData.y - cameraData.span) / grid) * grid; y < cameraData.y + cameraData.span; y += grid) {
        rctx.beginPath(); rctx.moveTo(0, sy(y)); rctx.lineTo(width, sy(y)); rctx.stroke();
    }
    if(typeof obstacles !== 'undefined') {
        rctx.fillStyle = '#46515a';
        for(const obs of obstacles) {
            const x = sx(obs.x), y = sy(obs.y), w = obs.w * scale, h = obs.h * scale;
            if(x + w < 0 || y + h < 0 || x > width || y > height) continue;
            rctx.fillRect(x, y, w, h);
        }
    }
    const fatalId = lastPlayerDamageInfo && lastPlayerDamageInfo.projectileId;
    const victim = frame.tanks.find(tank => tank.id === frame.playerId) || cameraData.victim;
    for(const tank of frame.tanks) {
        const isVictim = tank.id === frame.playerId;
        if(isVictim && impactProgress > 0) continue;
        const x = sx(tank.x), y = sy(tank.y);
        drawReplayTank(rctx, tank, x, y, Math.max(.7, Math.min(1.25, scale * 1.7)), isVictim);
        rctx.fillStyle = '#fff'; rctx.font = 'bold 11px Microsoft YaHei, sans-serif'; rctx.textAlign = 'center';
        rctx.fillText(isVictim ? `你 · ${tank.name}` : tank.name, x, y - 25);
    }
    for(const bullet of frame.bullets) {
        const x = sx(bullet.x), y = sy(bullet.y);
        const isFatal = bullet.id === fatalId;
        if(isFatal) {
            const speed = Math.hypot(bullet.vx, bullet.vy) || 1;
            rctx.strokeStyle = 'rgba(255,154,45,.72)'; rctx.lineWidth = 5;
            rctx.beginPath(); rctx.moveTo(x, y); rctx.lineTo(x - bullet.vx / speed * 42, y - bullet.vy / speed * 42); rctx.stroke();
        }
        rctx.fillStyle = bullet.type === 'aa' ? '#ff63ff' : bullet.type === 'mg' ? '#fff58b' : '#ff9b43';
        rctx.beginPath(); rctx.arc(x, y, isFatal ? 6 : 2.5, 0, Math.PI * 2); rctx.fill();
    }
    drawReplayShrapnel(rctx, victim, sx, sy, impactProgress);
    const stage = document.getElementById('combatReplayStage');
    if(stage) stage.textContent = impactProgress > 0 ? '命中 · 车体解体' : (cameraData.reveal > .2 ? '接近目标 · 镜头拉远' : '跟随致命炮弹 · 0.3× 慢放');
    rctx.fillStyle = 'rgba(0,0,0,.65)'; rctx.fillRect(18, height - 28, width - 36, 6);
    rctx.fillStyle = '#ffcf57'; rctx.fillRect(18, height - 28, (width - 36) * progress, 6);
}

function finishCombatReplay() {
    if(!combatReplayActive) return;
    combatReplayActive = false;
    if(combatReplayAnimation) cancelAnimationFrame(combatReplayAnimation);
    combatReplayAnimation = 0;
    const overlay = document.getElementById('combatReplayOverlay');
    if(overlay) overlay.classList.remove('active');
    // WebGL 驱动在少数设备上会在 dispose 时抛错；结算不能因资源回收失败而卡在 replay 状态。
    try {
        disposeCombatReplayThree();
    } catch(error) {
        console.warn('[REPLAY_3D] cleanup failed:', error);
        combatReplayThree = null;
    } finally {
        if(typeof finishEndGame === 'function') finishEndGame(combatReplayEndReason);
    }
}

function skipCombatReplay() { finishCombatReplay(); }
