// ==================== 子弹系统 ====================
function getTankFiringAngle(tank, spread = 0) {
    let angle = tank && Number.isFinite(tank.turretAngle) ? tank.turretAngle : 0;
    // AI 的普通武器和特殊武器共用本帧瞄准意图，避免目标切换或蓄力结束后
    // 仍沿着旧炮塔角（常见表现为持续向屏幕右侧）生成弹丸。
    if(tank && !tank.isPlayer && Number.isFinite(tank.aiAimAngle)) {
        angle = tank.aiAimAngle;
    }
    return normalizeAngle(angle + spread);
}

function fireBullet(tank, type) {
    if(!tank || tank.dead || (tank.evolutionTurretDisabledTimer || 0) > 0) return;
    const infiniteReserve = !!tank.suddenDeathInfiniteAmmo || (tank.stormActive && tank.tankType === 'duoduo_ifv');
    if ((type === 'shell' || type === 'bomb') && tank.shells <= 0 && !infiniteReserve) return;
    if ((type === 'mg' || type === 'airmg') && tank.mg <= 0 && !infiniteReserve) return;
    if (type === 'aa' && (tank.aa || 0) <= 0 && !infiniteReserve) return;
    if(tank.isPlayer) recordShot(type);
    tank.lastFiredWeapon = type;
    tank.recoilTimer = type === 'shell' || type === 'bomb' ? .24 : type === 'aa' ? .15 : .08;
    tank.recoilStrength = type === 'shell' || type === 'bomb' ? 11 : type === 'aa' ? 6 : 2.5;
    
    const suppressed = typeof tankWeaponHasAttachment === 'function' && tankWeaponHasAttachment(tank, type, 'suppressor');
    if(!suppressed) {
        const minimapClock = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
        tank.minimapRevealedUntil = minimapClock + 4000;
    }
    if(!suppressed && tank.ghostActive && tank.ultimateData && tank.ultimateData.revealOnFire) tank.ghostRevealed = true;
    let speedMult = 1, spreadMult = 1, damageMult = 1, infiniteAmmo = !!tank.suddenDeathInfiniteAmmo;
    if(tank.stormActive && tank.tankType === 'duoduo_ifv') {
        speedMult = tank.ultimateData.mgRateMult || 3; spreadMult = tank.ultimateData.mgSpreadMult || 0.5;
        infiniteAmmo = tank.ultimateData.infiniteAmmo; damageMult = tank.ultimateData.damageBoost || 1.5;
    }
    const projectileSpeedMult = tank.masteryProjectileSpeedMult || 1;
    const masteryRangeMult = (tank.masteryRangeMult || 1) * (tank.evolutionEffects && tank.evolutionEffects.rangeMult || 1);
    const baseSpeed = (type === 'bomb' ? 0 : (type === 'shell' ? CONFIG.bulletSpeed : (type === 'aa' ? CONFIG.aaSpeed : CONFIG.mgSpeed * speedMult))) * projectileSpeedMult;
    const elevationDeg = type === 'shell' ? (tank.shellElevation ?? CONFIG.shellDefaultElevation)
        : type === 'aa' ? (tank.aaElevation ?? CONFIG.aaDefaultElevation) : 0;
    const elevation = elevationDeg * Math.PI / 180;
    const speed = baseSpeed * Math.cos(elevation);
    const movingSpread = typeof getAttachmentSpreadMultiplier === 'function' ? getAttachmentSpreadMultiplier(tank, type) : 1;
    const spread = (type === 'mg' || type === 'airmg') ? (Math.random() - 0.5) * 0.12 * spreadMult * movingSpread
        : (type === 'aa' ? (Math.random() - 0.5) * 0.08 * movingSpread
        : (type === 'shell' && typeof isTankActivelyMoving === 'function' && isTankActivelyMoving(tank)
            ? (Math.random() - .5) * .026 * movingSpread : 0));
    const angle = getTankFiringAngle(tank, spread);
    const masteryGolden = type === 'shell' && !!tank.masteryGoldenProjectiles;
    const masteryDamageMult = masteryGolden
        ? (typeof MASTERY_GOLDEN_SHELL_DAMAGE_MULT !== 'undefined' ? MASTERY_GOLDEN_SHELL_DAMAGE_MULT : 1.2)
        : 1;
    // 主炮弹不使用计时销毁：它会按弹道飞行，直到坠地或真实碰撞。
    const rangeLifeMult = masteryRangeMult / projectileSpeedMult;
    const maxLife = type === 'bomb' ? 5.0 : (type === 'shell' ? Infinity : (type === 'aa' ? 5.0 * rangeLifeMult : 1.2 * rangeLifeMult));
    const muzzleDistance = type === 'bomb' ? 0 : tank.turretSize + 12;
    const projectile = {
        x: tank.x + Math.cos(angle) * muzzleDistance,
        y: tank.y + Math.sin(angle) * muzzleDistance,
        z: type === 'bomb' ? Math.max(28, (tank.z || CONFIG.helicopterAltitude) - 8) : (tank.z || 0) + (type === 'aa' ? 18 : 24),
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        vz: type === 'bomb' ? -35 : ((type === 'shell' || type === 'aa') ? baseSpeed * 60 * Math.sin(elevation) : 0),
        damage: (type === 'bomb' ? 340 : (type === 'shell' ? CONFIG.bulletDamage : (type === 'aa' ? CONFIG.aaDamage : (type === 'airmg' ? 18 : CONFIG.mgDamage)))) *
            damageMult * masteryDamageMult *
            (typeof getAttachmentDamageMultiplier === 'function' ? getAttachmentDamageMultiplier(tank, type) : 1) *
            (tank.masteryWeaponDamageMult || 1) *
            (tank.aiDamageMult || 1) * (tank.masteryAuraDamageMult || 1) * (tank.bossBuffAttackMult || 1),
        team: tank.team, type, owner: tank,
        masteryGolden,
        masteryRangeMult,
        masteryProjectileSpeedMult: projectileSpeedMult,
        ballisticGravityMult: projectileSpeedMult * projectileSpeedMult / masteryRangeMult,
        life: maxLife, maxLife, age: 0,
        altitude: (tank.z || 0) + (type === 'aa' ? 18 : 24),
        trackingRange: type === 'aa' ? CONFIG.aaTrackingRange * masteryRangeMult : 0,
        trackingTarget: null,
        trackingLocked: false,
        maxFlightAngle: type === 'aa' ? elevation : null,
        canRicochet: type === 'shell',
        ricocheted: false,
        maxTargetHits: 1,
        // 高射炮不再拥有穿墙特权；它仍可凭真实 Z 高度从低矮障碍上方飞过。
        ignoresObstacles: type === 'airmg' || (!!tank.isFlying && type !== 'aa'),
        hitTanks: new Set(),
        armorIgnore: tank.tankType === 'duoduo_spat',
        armorIgnorePercent: typeof tankWeaponHasAttachment === 'function' && tankWeaponHasAttachment(tank, type, 'armorPiercing') ? .3 : 0,
        elevation: elevationDeg,
        explosionWidth: type === 'bomb' ? 150 : 0,
        explosionHeight: type === 'bomb' ? 150 : 0,
        explosionRadius: type === 'bomb' ? 75 : (type === 'aa' ? CONFIG.aaExplosionRadius : 0),
        toxinData: tank.toxinActive && tank.ultimateData ? {
            duration: tank.ultimateData.duration,
            damage: tank.ultimateData.dotDamage,
            interval: tank.ultimateData.dotInterval,
            slow: tank.ultimateData.slowPercent,
            chance: tank.ultimateData.applyChance
        } : null
    };
    if(typeof applyTankEvolutionToProjectile === 'function') applyTankEvolutionToProjectile(tank, projectile);
    if(typeof applyMechaPeaTriPhase === 'function') applyMechaPeaTriPhase(tank, projectile);
    bullets.push(projectile);
    if(typeof spawnTankShotAnimation === 'function') spawnTankShotAnimation(tank, projectile, angle);
    if(type === 'shell' && tank.tankType === 'duoduo_rocket' && !tank.evolutionBurstFiring) {
        const burstCount = tank.evolutionEffects && tank.evolutionEffects.rocketBurstCount || 1;
        if(burstCount > 1) {
            tank.evolutionBurstRemaining = burstCount - 1;
            tank.evolutionBurstTimer = tank.evolutionEffects.rocketBurstInterval || .1;
        }
    }
    if(bullets.length > 500) bullets.splice(0, bullets.length - 500);
    if((type === 'shell' || type === 'bomb') && !infiniteAmmo) tank.shells--;
    else if((type === 'mg' || type === 'airmg') && !infiniteAmmo) tank.mg--;
    else if(type === 'aa' && !infiniteAmmo) tank.aa--;
    if(type !== 'bomb') {
        tank.muzzleFlashTimer = type === 'shell' ? 0.16 : (type === 'aa' ? 0.12 : 0.055);
        tank.muzzleFlashType = type;
    }
    createParticles(tank.x + Math.cos(angle) * tank.turretSize, tank.y + Math.sin(angle) * tank.turretSize,
        type === 'shell' || type === 'bomb' ? 5 : (type === 'aa' ? 4 : 2),
        type === 'bomb' ? '#ff6840' : (masteryGolden ? '#ffe36a' : (type === 'shell' ? '#ffaa00' : (type === 'aa' ? '#ff44ff' : '#ffff88'))),
        type === 'shell' || type === 'bomb' ? 1.5 : (type === 'aa' ? 1.2 : 0.5));
    if(typeof playWorldSound === 'function') playWorldSound(type === 'airmg' ? 'mg' : type, tank.x, tank.y, tank.isPlayer ? 1 : 0.72);
}

function deploySmokeGrenade(tank, options = {}) {
    if(!tank || tank.dead || tank.isFlying || tank.evolutionSkillDisabledTimer > 0 ||
       (tank.smoke || 0) <= 0 || (tank.smokeCooldown || 0) > 0) return false;
    const angle = typeof getTankFiringAngle === 'function' ? getTankFiringAngle(tank) : tank.turretAngle;
    const atFeet = options.atFeet === true;
    const distance = atFeet ? 0 : 95;
    smokeClouds.push({
        x: tank.x + Math.cos(angle) * distance,
        y: tank.y + Math.sin(angle) * distance,
        z: tank.z || 0,
        radius: CONFIG.smokeRadius,
        life: CONFIG.smokeDuration,
        maxLife: CONFIG.smokeDuration,
        team: tank.team
    });
    tank.smoke--;
    tank.smokeCooldown = CONFIG.smokeCooldown;
    const particleDistance = atFeet ? 0 : 40;
    createParticles(tank.x + Math.cos(angle) * particleDistance, tank.y + Math.sin(angle) * particleDistance, 12, '#c8ced0', 1.3);
    if(typeof playWorldSound === 'function') playWorldSound('capture', tank.x, tank.y, tank.isPlayer ? .55 : .35);
    if(tank === player && typeof recordSmokeDeployment === 'function') recordSmokeDeployment(options.quick === true);
    if(tank === player && typeof showMessage === 'function') {
        showMessage(atFeet ? '💨 快速烟幕：已在脚下展开' : '💨 烟雾弹展开：遮断敌方视线', '#d7e1e4');
    }
    return true;
}

function updateBullets(dt) {
    if(typeof apsInterceptEffects !== 'undefined') {
        for(let i = apsInterceptEffects.length - 1; i >= 0; i--) {
            apsInterceptEffects[i].life -= dt;
            if(apsInterceptEffects[i].life <= 0) apsInterceptEffects.splice(i, 1);
        }
    }
    for(let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.age = (b.age || 0) + dt;
        if(!Number.isFinite(b.z)) b.z = (b.owner && b.owner.z || 0) + 24;
        if(!Number.isFinite(b.vz)) b.vz = 0;
        if(b.isDrone && b.autoTrack) {
            const targets = b.team === 'blue' ? enemies : [player, ...allies];
            let nearest = null, nearestDist = b.trackRange || 800;
            targets.forEach(t => {
                if(!t || t.dead || t.team === b.team) return;
                const d = Math.hypot(t.x - b.x, t.y - b.y);
                if(d < nearestDist) { nearest = t; nearestDist = d; }
            });
            if(nearest) {
                const speed = Math.hypot(b.vx, b.vy) || 8;
                const angle = Math.atan2(nearest.y - b.y, nearest.x - b.x);
                b.vx += (Math.cos(angle) * speed - b.vx) * Math.min(1, dt * 5);
                b.vy += (Math.sin(angle) * speed - b.vy) * Math.min(1, dt * 5);
            }
        }
        if(b.type === 'aa' && b.age >= CONFIG.aaTrackingDelay && !b.trackingLocked) {
            const targets = b.team === 'blue' ? enemies : [player, ...allies];
            let nearest = null;
            let nearestDist = b.trackingRange || CONFIG.aaTrackingRange;
            targets.forEach(tank => {
                if(!tank || tank.dead || tank.team === b.team) return;
                const distance = Math.hypot(tank.x - b.x, tank.y - b.y);
                if(distance < nearestDist) { nearest = tank; nearestDist = distance; }
            });
            b.trackingTarget = nearest;
            b.trackingLocked = true; // 每发高射弹只锁定一次，不再途中反复换目标。
        }
        if(b.type === 'aa' && b.trackingTarget && !b.trackingTarget.dead &&
           b.age <= CONFIG.aaTrackingDelay + CONFIG.aaTrackingDuration) {
            const target = b.trackingTarget;
            const speed = Math.hypot(b.vx, b.vy) || CONFIG.aaSpeed;
            const desiredAngle = Math.atan2(target.y - b.y, target.x - b.x);
            let currentAngle = Math.atan2(b.vy, b.vx);
            let angleDiff = normalizeAngle(desiredAngle - currentAngle);
            const maxTurn = CONFIG.aaTurnRate * dt;
            angleDiff = Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
            currentAngle += angleDiff;
            b.vx = Math.cos(currentAngle) * speed;
            b.vy = Math.sin(currentAngle) * speed;
            const targetZ = (target.z || 0) + (target.isFlying ? 8 : 22);
            const horizontalWorldSpeed = Math.hypot(b.vx, b.vy) * 60;
            const maxTrackingVz = Math.max(0, horizontalWorldSpeed * Math.tan(b.maxFlightAngle || 0));
            const desiredVz = Math.max(-650, Math.min(maxTrackingVz, (targetZ - b.z) * 1.4));
            b.vz += (desiredVz - b.vz) * Math.min(1, dt * 1.4);
            b.vz = Math.min(b.vz, maxTrackingVz);
        }
        if(typeof applyWeatherToProjectile === 'function') applyWeatherToProjectile(b, dt);
        if(b.type === 'bomb') {
            b.z += b.vz * dt;
            b.vz -= 155 * dt;
            b.life -= dt;
            if(Math.random() < 0.45) createParticles(b.x, b.y, 1, '#ff8a45', 0.55);
            const groundHeight = getBombImpactHeight(b.x, b.y);
            if(b.z <= groundHeight || b.life <= 0) {
                b.z = groundHeight;
                explodeBomb(b);
                bullets.splice(i, 1);
            }
            continue;
        }
        b.prevX = b.x; b.prevY = b.y; b.prevZ = b.z;
        b.x += b.vx * 60 * dt; b.y += b.vy * 60 * dt; b.life -= dt;
        if(b.type === 'aa' || b.type === 'shell') {
            b.z += b.vz * dt;
            b.vz -= (b.type === 'aa' ? CONFIG.aaGravity : CONFIG.shellGravity) * (b.ballisticGravityMult || 1) * dt;
            b.altitude = b.z;
        }
        if(b.type === 'shell' && !b.isRocket && b.vz <= 0) {
            const groundHeight = getBombImpactHeight(b.x, b.y);
            if(b.z <= groundHeight) {
                b.z = groundHeight;
                if(typeof damageTerrainInRadius === 'function') {
                    damageTerrainInRadius(b.x, b.y, 24, b.damage || CONFIG.bulletDamage, 'shell', b.owner);
                }
                createParticles(b.x, b.y, 10, b.masteryGolden ? '#ffe36a' : '#a87a4a', 1.15);
                if(typeof spawnTankImpactAnimation === 'function') spawnTankImpactAnimation(b);
                if(typeof playWorldSound === 'function') playWorldSound('hit', b.x, b.y, b.owner && b.owner.isPlayer ? .72 : .4);
                bullets.splice(i, 1);
                continue;
            }
        }
        if(Math.random() < 0.4) {
            const trailColor = b.evolutionTrail || (b.neutralSniper ? '#c02cff' : (b.type === 'shell' ? '#ff8800' : (b.type === 'aa' ? '#ff66ff' : '#ffff44')));
            createParticles(b.x, b.y, b.neutralSniper ? 2 : 1, trailColor, b.neutralSniper ? .75 : .4);
        }
        if(b.isRocket && (Math.hypot(b.x - b.targetX, b.y - b.targetY) < 35 || b.life <= 0)) {
            if(b.ancientCannon) {
                b.x = b.targetX;
                b.y = b.targetY;
                b.z = getBombImpactHeight(b.x, b.y);
            }
            explodeRocket(b);
            if(typeof spawnTankImpactAnimation === 'function') spawnTankImpactAnimation(b);
            bullets.splice(i, 1);
            continue;
        }
        const lifetimeExpired = b.type !== 'shell' && b.life <= 0;
        if(lifetimeExpired || b.z < -5 || b.x < 0 || b.x > CONFIG.mapWidth || b.y < 0 || b.y > CONFIG.mapHeight) {
            if(b.isDrone && typeof explodeEvolutionDrone === 'function') explodeEvolutionDrone(b);
            if(typeof createEvolutionRocketImpact === 'function') createEvolutionRocketImpact(b);
            bullets.splice(i, 1); continue;
        }
        if(b.ignoresObstacles) continue;
        if(currentMap === 'factory' && typeof factoryProjectileCrossedSlab === 'function' && factoryProjectileCrossedSlab(b)) {
            createParticles(b.x,b.y,6,'#8d9498',.7);
            bullets.splice(i,1);
            continue;
        }
        if(typeof handleMapMechanicProjectile === 'function' && handleMapMechanicProjectile(b)) { bullets.splice(i, 1); continue; }
        for(let obs of obstacles) {
            if(typeof factoryObstacleMatchesProjectile === 'function' && !factoryObstacleMatchesProjectile(obs, b)) continue;
            if(obs.type === 'factoryPlatform' && typeof factoryPlatformMatchesProjectile === 'function' && !factoryPlatformMatchesProjectile(obs, b)) continue;
            const contact = getProjectileObstacleContact(b, obs);
            if(contact) {
                if(obs.type !== 'factoryPlatform' && contact.z > getObstacleWorldHeight(obs)) continue;
                b.x = contact.x;
                b.y = contact.y;
                b.z = contact.z;
                if(typeof tryRicochetBullet === 'function' && tryRicochetBullet(b, obs)) {
                    createParticles(b.x, b.y, 12, '#9ffaff', 1.45);
                    if(typeof playWorldSound === 'function') playWorldSound('aa', b.x, b.y, b.owner && b.owner.isPlayer ? 0.9 : 0.55);
                    break;
                } else if(b.isRocket) explodeRocket(b);
                else {
                    const evolution = b.owner && b.owner.evolutionEffects || {};
                    const smallObstacle = Math.max(obs.w || 0, obs.h || 0) <= 130 ||
                        ['tree', 'factoryCrate', 'oilBarrel', 'evolutionCover'].includes(obs.type);
                    const siegeMult = evolution.destroySmallObstacles && smallObstacle ? 3 : 1;
                    if(typeof damageObstacleAtPoint === 'function') damageObstacleAtPoint(obs, (b.damage || CONFIG.bulletDamage) * siegeMult, b.type, b.x, b.y, b.owner);
                    createParticles(b.x, b.y, 6, '#777', 1);
                }
                if(b.isDrone && typeof explodeEvolutionDrone === 'function') explodeEvolutionDrone(b);
                if(typeof createEvolutionRocketImpact === 'function') createEvolutionRocketImpact(b);
                if(typeof spawnTankImpactAnimation === 'function') spawnTankImpactAnimation(b);
                bullets.splice(i, 1); break;
            }
        }
    }
}

// 用连续线段而不是仅检查本帧终点，避免高速高射炮穿过较薄的墙体。
function getProjectileObstacleContact(bullet, obs) {
    const x0 = Number.isFinite(bullet.prevX) ? bullet.prevX : bullet.x;
    const y0 = Number.isFinite(bullet.prevY) ? bullet.prevY : bullet.y;
    const z0 = Number.isFinite(bullet.prevZ) ? bullet.prevZ : bullet.z;
    const dx = bullet.x - x0;
    const dy = bullet.y - y0;
    let tMin = 0;
    let tMax = 1;
    const clipAxis = (start, delta, min, max) => {
        if(Math.abs(delta) < 1e-9) return start >= min && start <= max;
        let near = (min - start) / delta;
        let far = (max - start) / delta;
        if(near > far) [near, far] = [far, near];
        tMin = Math.max(tMin, near);
        tMax = Math.min(tMax, far);
        return tMin <= tMax;
    };
    if(!clipAxis(x0, dx, obs.x, obs.x + obs.w) ||
       !clipAxis(y0, dy, obs.y, obs.y + obs.h) ||
       tMax < 0 || tMin > 1) return null;
    const t = Math.max(0, tMin);
    return {
        t,
        x: x0 + dx * t,
        y: y0 + dy * t,
        z: z0 + (bullet.z - z0) * t
    };
}

function getBulletObstacleImpact(bullet, obs) {
    const x0 = Number.isFinite(bullet.prevX) ? bullet.prevX : bullet.x - bullet.vx;
    const y0 = Number.isFinite(bullet.prevY) ? bullet.prevY : bullet.y - bullet.vy;
    const dx = bullet.x - x0, dy = bullet.y - y0;
    const candidates = [];
    const addCandidate = (t, nx, ny) => {
        if(!Number.isFinite(t) || t < 0 || t > 1) return;
        const x = x0 + dx * t, y = y0 + dy * t;
        if(x < obs.x - 0.01 || x > obs.x + obs.w + 0.01 || y < obs.y - 0.01 || y > obs.y + obs.h + 0.01) return;
        candidates.push({ t, x, y, nx, ny });
    };
    if(dx > 0) addCandidate((obs.x - x0) / dx, -1, 0);
    else if(dx < 0) addCandidate((obs.x + obs.w - x0) / dx, 1, 0);
    if(dy > 0) addCandidate((obs.y - y0) / dy, 0, -1);
    else if(dy < 0) addCandidate((obs.y + obs.h - y0) / dy, 0, 1);
    candidates.sort((a, b) => a.t - b.t);
    if(candidates.length) return candidates[0];

    const edges = [
        { value: Math.abs(bullet.x - obs.x), nx: -1, ny: 0, x: obs.x, y: bullet.y },
        { value: Math.abs(obs.x + obs.w - bullet.x), nx: 1, ny: 0, x: obs.x + obs.w, y: bullet.y },
        { value: Math.abs(bullet.y - obs.y), nx: 0, ny: -1, x: bullet.x, y: obs.y },
        { value: Math.abs(obs.y + obs.h - bullet.y), nx: 0, ny: 1, x: bullet.x, y: obs.y + obs.h }
    ].sort((a, b) => a.value - b.value);
    return edges[0];
}

function reflectProjectileFromNormal(bullet, nx, ny) {
    const normalLength = Math.max(0.0001, Math.hypot(nx, ny));
    const normalX = nx / normalLength;
    const normalY = ny / normalLength;
    const dot = bullet.vx * normalX + bullet.vy * normalY;
    bullet.vx -= 2 * dot * normalX;
    bullet.vy -= 2 * dot * normalY;
}

function tryRicochetBullet(bullet, obs) {
    if(!bullet || !obs || bullet.type !== 'shell' || !bullet.canRicochet || bullet.ricocheted || bullet.baseDefense) return false;
    const speed = Math.hypot(bullet.vx, bullet.vy);
    if(speed <= 0.001) return false;
    const impact = getBulletObstacleImpact(bullet, obs);
    const dot = (bullet.vx / speed) * impact.nx + (bullet.vy / speed) * impact.ny;
    const grazingAngle = Math.asin(Math.min(1, Math.abs(dot))) * 180 / Math.PI;
    if(grazingAngle >= CONFIG.ricochetMaxGrazingAngle) return false;
    reflectProjectileFromNormal(bullet, impact.nx, impact.ny);
    bullet.x = impact.x + impact.nx * 4;
    bullet.y = impact.y + impact.ny * 4;
    bullet.prevX = bullet.x;
    bullet.prevY = bullet.y;
    bullet.damage *= CONFIG.ricochetDamageMultiplier;
    bullet.ricocheted = true;
    bullet.ricochetSource = 'obstacle';
    bullet.maxTargetHits = 2;
    bullet.ricochetAngle = grazingAngle;
    return true;
}

function getTankArmorRicochetChance(tank, bullet, actualArmor) {
    if(!tank || !bullet || bullet.type !== 'shell' || bullet.ricocheted || bullet.armorIgnore) return 0;
    const speed = Math.hypot(bullet.vx, bullet.vy);
    if(speed < .001 || actualArmor < .65) return 0;
    const nx = (bullet.x - tank.x) / Math.max(1, Math.hypot(bullet.x - tank.x, bullet.y - tank.y));
    const ny = (bullet.y - tank.y) / Math.max(1, Math.hypot(bullet.x - tank.x, bullet.y - tank.y));
    const incidence = Math.abs((bullet.vx / speed) * nx + (bullet.vy / speed) * ny);
    const obliquity = 1 - Math.min(1, incidence);
    const armorFactor = Math.max(0, Math.min(.34, (actualArmor - .65) * .12));
    return Math.max(CONFIG.armorRicochetMinChance,
        Math.min(CONFIG.armorRicochetMaxChance, CONFIG.armorRicochetMinChance + armorFactor + obliquity * .48));
}

function tryTankArmorRicochet(tank, bullet, actualArmor) {
    const chance = getTankArmorRicochetChance(tank, bullet, actualArmor);
    if(chance <= 0 || Math.random() >= chance) return false;
    const distance = Math.max(1, Math.hypot(bullet.x - tank.x, bullet.y - tank.y));
    const nx = (bullet.x - tank.x) / distance;
    const ny = (bullet.y - tank.y) / distance;
    reflectProjectileFromNormal(bullet, nx, ny);
    bullet.x = tank.x + nx * (CONFIG.tankSize + 5);
    bullet.y = tank.y + ny * (CONFIG.tankSize + 5);
    bullet.prevX = bullet.x;
    bullet.prevY = bullet.y;
    bullet.damage *= CONFIG.ricochetDamageMultiplier;
    bullet.ricocheted = true;
    bullet.ricochetSource = 'armor';
    bullet.maxTargetHits = Math.max(2, bullet.maxTargetHits || 1);
    if(bullet.hitTanks) bullet.hitTanks.add(tank.id);
    createParticles(bullet.x, bullet.y, 16, '#b7f7ff', 1.4);
    if(typeof showDamageNumber === 'function') {
        damageNumbers.push({x:tank.x,y:tank.y-30,z:48,text:'跳弹！',life:1,maxLife:1,vy:-34,vz:45,color:'#b7f7ff'});
    }
    if(tank === player && typeof showMessage === 'function') showMessage('◇ 装甲跳弹！', '#b7f7ff');
    if(typeof playWorldSound === 'function') playWorldSound('aa', bullet.x, bullet.y, tank === player ? .9 : .55);
    return true;
}

function getTankHitZone(tank, projectile) {
    if(!tank || !projectile) return 'hull';
    const relativeZ = (projectile.z || 0) - (tank.z || 0);
    if(relativeZ >= 29) return 'turret';
    if(relativeZ <= 15) return 'track';
    const dx = projectile.x - tank.x;
    const dy = projectile.y - tank.y;
    const sideOffset = -Math.sin(tank.angle || 0) * dx + Math.cos(tank.angle || 0) * dy;
    const forwardOffset = Math.cos(tank.angle || 0) * dx + Math.sin(tank.angle || 0) * dy;
    if(Math.abs(sideOffset) > Math.max(10, Math.abs(forwardOffset) * .72)) return 'fuel';
    return 'hull';
}

function applyTankHitReaction(tank, projectile) {
    if(!tank || tank.dead || !projectile || !['shell','aa','rocket'].includes(projectile.type)) return 'hull';
    const zone = getTankHitZone(tank, projectile);
    if(zone === 'turret') {
        const recoveryMult = tank.evolutionEffects && tank.evolutionEffects.hitRecoveryMult || 1;
        tank.turretJamTimer = Math.max(tank.turretJamTimer || 0, CONFIG.turretJamDuration * recoveryMult);
        createParticles(tank.x, tank.y, 10, '#e8c26b', 1);
        if(tank === player && typeof showMessage === 'function') showMessage('⚙ 炮塔卡壳：暂时无法转动', '#ffc867');
    } else if(zone === 'track') {
        const recoveryMult = tank.evolutionEffects && tank.evolutionEffects.hitRecoveryMult || 1;
        const duration = CONFIG.trackDamageDuration * Math.max(.2, tank.trackRepairMultiplier || 1) * recoveryMult;
        tank.trackDamageTimer = Math.max(tank.trackDamageTimer || 0, duration);
        createParticles(tank.x, tank.y + 15, 12, '#806f5c', 1.2);
        if(tank === player && typeof showMessage === 'function') showMessage('⛓ 履带受损：速度下降', '#e1b278');
    } else if(zone === 'fuel') {
        const recoveryMult = tank.evolutionEffects && tank.evolutionEffects.hitRecoveryMult || 1;
        tank.fuelFireTimer = Math.max(tank.fuelFireTimer || 0, CONFIG.fuelFireDuration * recoveryMult);
        if(typeof applyTankElementalStatus === 'function') {
            applyTankElementalStatus(tank, 'fire', CONFIG.fuelFireDuration * recoveryMult, {
                interval:.5, damage:CONFIG.fuelFireDamage, source:projectile.owner || null
            });
        } else {
            tank.burnTimer = Math.max(tank.burnTimer || 0, CONFIG.fuelFireDuration * recoveryMult);
            tank.burnTickTimer = Math.min(tank.burnTickTimer || 1, .5);
            tank.burnDamage = Math.max(tank.burnDamage || 0, CONFIG.fuelFireDamage);
        }
        createParticles(tank.x, tank.y, 15, '#ff681f', 1.5);
        if(tank === player && typeof showMessage === 'function') showMessage('🔥 侧面油箱起火！', '#ff6f32');
    }
    return zone;
}

function consumeGoldenShield(tank, source, projectile) {
    if(!tank || !tank.goldenShieldReady || (!source && !projectile)) return false;
    tank.goldenShieldReady = false;
    tank.goldenShieldTimer = CONFIG.goldenShieldInterval;
    createParticles(tank.x, tank.y, 30, '#ffd84a', 2.1);
    if(typeof getNearbyTanks === 'function') {
        getNearbyTanks(tank.x, tank.y, 115).forEach(other => {
            if(!other || other === tank || other.dead || other.team === tank.team) return;
            const falloff = Math.max(.25, 1 - Math.hypot(other.x - tank.x, other.y - tank.y) / 115);
            applyDirectDamage(other, 80 * falloff, tank, '金色护盾爆炸');
        });
    }
    if(tank === player && typeof showMessage === 'function') showMessage('✦ 金色护盾抵挡攻击并反爆！', '#ffe45c');
    if(typeof playWorldSound === 'function') playWorldSound('capture', tank.x, tank.y, tank === player ? 1 : .65);
    return true;
}

function applyDirectDamage(tank, damage, source, cause = null, projectile = null, evolutionShared = false) {
    if(!tank || tank.dead || damage <= 0) return 0;
    if(typeof gameMode !== 'undefined' && gameMode === 'training' && tank === player) return 0;
    if((tank.evolutionUndyingTimer || 0) > 0) return 0;
    if(!evolutionShared && source && source.team !== tank.team) {
        const linkOwner = tank.linkedTo && !tank.linkedTo.dead ? tank.linkedTo : null;
        const linkShare = linkOwner && linkOwner.evolutionEffects && linkOwner.evolutionEffects.linkDamageShare || 0;
        if(linkOwner && linkShare > 0) {
            const shared = damage * linkShare;
            damage -= shared;
            applyDirectDamage(linkOwner, shared, source, cause || '链接分摊', projectile, true);
        }
        const team = tank.team === 'blue' ? [player, ...allies] : enemies;
        const destinyOwner = team.find(member => member && !member.dead && member.evolutionEffects && member.evolutionEffects.teamDamageShare);
        if(destinyOwner) {
            const recipients = team.filter(member => member && member !== tank && !member.dead);
            const teamShare = destinyOwner.evolutionEffects.teamDamageShare;
            if(recipients.length) {
                const shared = damage * teamShare;
                damage -= shared;
                recipients.forEach(member => applyDirectDamage(member, shared / recipients.length, source, '命运共同体', projectile, true));
            }
        }
    }
    if(consumeGoldenShield(tank, source, projectile)) return 0;
    if(typeof modifyTankEvolutionIncomingDamage === 'function') {
        damage = modifyTankEvolutionIncomingDamage(tank, source, damage);
        if(damage <= 0) {
            if(typeof showDamageNumber === 'function') showDamageNumber(tank.x, tank.y - 30, '闪避');
            return 0;
        }
    }
    const preHitHp = tank.hp;
    const shieldWasActive = !!(tank.shieldActive && tank.shieldHp > 0);
    let modeMultiplier = 1;
    if(gameMode === 'defense' && source) {
        if(tank === player && !source.isPlayer && source.team === 'red') {
            modeMultiplier = CONFIG.defensePlayerDamageTakenMultiplier;
        } else if(!tank.isPlayer && !source.isPlayer) {
            modeMultiplier = CONFIG.defenseAIVsAIDamageMultiplier;
        } else if(source === player && tank.team === 'red') {
            modeMultiplier = CONFIG.defensePlayerDamageDealtMultiplier;
        }
    }
    const baseShieldMultiplier = typeof getBlueBaseShieldDamageMultiplier === 'function'
        ? getBlueBaseShieldDamageMultiplier(tank)
        : 1;
    const beginnerDamageMultiplier = tank === player && source && source.team !== tank.team &&
        typeof isBeginnerModeEnabled === 'function' && isBeginnerModeEnabled() ? 0.75 : 1;
    let remaining = damage * modeMultiplier * beginnerDamageMultiplier * baseShieldMultiplier * (tank.masteryAuraDefenseMult || 1) *
        (tank.bossBuffDefenseMult || 1) * Math.max(0, 1 - (tank.damageReduction || 0));
    if(tank.shieldActive && tank.shieldHp > 0) {
        const absorbed = Math.min(tank.shieldHp, remaining);
        tank.shieldHp -= absorbed;
        remaining -= absorbed;
        if(tank.shieldHp <= 0) tank.shieldActive = false;
    }
    if(remaining > 0) {
        tank.hp -= remaining;
        tank.hitFlashTimer = Math.max(tank.hitFlashTimer || 0, .18);
        if(source) tank.hitDirection = Math.atan2(source.y - tank.y, source.x - tank.x);
        if(tank === player && typeof recordPlayerDamageSource === 'function') recordPlayerDamageSource(remaining, source, cause, projectile);
    }
    if(tank.hp <= 0 && tank.linkedTo && !tank.linkedTo.dead) {
        const linkEffects = tank.linkedTo.evolutionEffects || {};
        if(linkEffects.linkUndyingDuration) {
            tank.hp = 1;
            tank.evolutionUndyingTimer = linkEffects.linkUndyingDuration;
            tank.invincible = Math.max(tank.invincible || 0, linkEffects.linkUndyingDuration);
            if(typeof createParticles === 'function') createParticles(tank.x, tank.y, 24, '#b6ff86', 2);
        }
    }
    if(shieldWasActive && (!tank.shieldActive || tank.shieldHp <= 0) &&
       typeof handleTankEvolutionShieldBreak === 'function') {
        handleTankEvolutionShieldBreak(tank);
    }
    if(typeof handleTankEvolutionDamaged === 'function') {
        handleTankEvolutionDamaged(tank, source, preHitHp);
    }
    if(tank.hp <= 0 && !tank.dead) {
        if(source) recordKill(source, tank, { preHitHp, damage, weapon: source.isPlayer ? currentWeapon : null });
        tank.dead = true;
        if(typeof handleTankEvolutionDeath === 'function') handleTankEvolutionDeath(tank);
        if(typeof spawnMasteryDeathFlame === 'function') spawnMasteryDeathFlame(tank);
        createParticles(tank.x, tank.y, 40, tank.color, 3);
        createParticles(tank.x, tank.y, 25, '#ffaa00', 2);
        if(tank === player && typeof captureCombatReplayFrame === 'function') captureCombatReplayFrame(true);
        if(typeof playWorldSound === 'function') playWorldSound(tank === player ? 'death' : 'kill', tank.x, tank.y, tank === player ? 1.25 : 1);
        if(typeof shouldAmmoRackExplode === 'function' && shouldAmmoRackExplode(tank)) triggerAmmoRackExplosion(tank);
        if(tank === player) {
            if(gameMode === 'story' && typeof endGame === 'function') endGame('storyDefeat');
            else if(typeof scheduleDamageUpgrade === 'function') scheduleDamageUpgrade();
            else if(typeof beginDamageUpgrade === 'function') beginDamageUpgrade();
        }
    }
    return remaining;
}

function getWeaponCause(type) {
    return ({ shell: '主炮', mg: '机枪', aa: '高射炮', rocket: '火箭', bomb: '垂直炸药包', airmg: '空对空机枪', sniper: '中立狙击塔' })[type] || null;
}

function getBombImpactHeight(x, y) {
    let height = typeof getTacticalTerrainHeightAt === 'function' ? getTacticalTerrainHeightAt(x,y) : 0;
    for(const obs of obstacles) {
        if(x >= obs.x && x <= obs.x + obs.w && y >= obs.y && y <= obs.y + obs.h) {
            height = Math.max(height, getObstacleWorldHeight(obs));
        }
    }
    return height;
}

function explodeBomb(bomb) {
    const width = bomb.explosionWidth || 150;
    const height = bomb.explosionHeight || 150;
    const halfW = width / 2, halfH = height / 2;
    const queryRadius = Math.hypot(halfW, halfH);
    if(typeof damageTerrainInRadius === 'function') damageTerrainInRadius(bomb.x, bomb.y, queryRadius, bomb.damage, 'bomb', bomb.owner);
    getNearbyTanks(bomb.x, bomb.y, queryRadius).forEach(tank => {
        if(!tank || tank.dead || (tank.team === bomb.team &&
            !(typeof isFriendlyFireEnabled === 'function' && isFriendlyFireEnabled()))) return;
        const dx = Math.abs(tank.x - bomb.x), dy = Math.abs(tank.y - bomb.y);
        if(dx > halfW || dy > halfH) return;
        if(Math.abs(getProjectileTargetHeight(tank) - (bomb.z || 0)) > 65) return;
        const falloff = Math.max(.3, 1 - Math.max(dx / halfW, dy / halfH));
        const bombArmor = (tank.armor + (tank.mapArmorBonus || 0)) *
            (1 - Math.max(0, Math.min(.95, bomb.armorIgnorePercent || 0)));
        const dealt = applyDirectDamage(tank, bomb.damage * falloff / Math.max(.35, bombArmor), bomb.owner, '垂直炸药包', bomb);
        if(dealt > 0) showDamageNumber(tank.x, tank.y - 34, Math.round(dealt));
        if(dealt > 0 && typeof tryApplyProjectileElementalStatus === 'function') {
            tryApplyProjectileElementalStatus(bomb, tank);
        }
    });
    const enemyBase = bomb.team === 'blue' ? bases.red : bases.blue;
    if(enemyBase && enemyBase.hp > 0 && !enemyBase.invulnerable) {
        const cx = enemyBase.x + enemyBase.w / 2, cy = enemyBase.y + enemyBase.h / 2;
        if(Math.abs(cx - bomb.x) <= halfW + enemyBase.w * .5 && Math.abs(cy - bomb.y) <= halfH + enemyBase.h * .5) {
            const wasAlive = enemyBase.hp > 0;
            enemyBase.hp -= bomb.damage * .7;
            if(wasAlive && enemyBase.hp <= 0) recordBaseDestroy(bomb.team);
        }
    }
    createParticles(bomb.x, bomb.y, 38, '#ff621f', 3.2);
    createParticles(bomb.x, bomb.y, 18, '#ffe2a1', 2.1);
    if(typeof playWorldSound === 'function') playWorldSound('hit', bomb.x, bomb.y, 1.2);
}

function explodeRocket(b) {
    const radius = b.explosionRadius || 130;
    if(typeof damageTerrainInRadius === 'function') damageTerrainInRadius(b.x, b.y, radius, b.damage, 'rocket', b.owner);
    const targets = getNearbyTanks(b.x, b.y, radius);
    targets.forEach(tank => {
        if(tank.dead || (tank.team === b.team &&
            !(typeof isFriendlyFireEnabled === 'function' && isFriendlyFireEnabled()))) return;
        const distance = Math.hypot(tank.x - b.x, tank.y - b.y);
        if(distance > radius) return;
        if(Number.isFinite(b.z) && Math.abs(getProjectileTargetHeight(tank) - b.z) > 70) return;
        const falloff = Math.max(0.35, 1 - distance / radius);
        const armor = Math.max(0.25, tank.armor * (1 + (tank.armorBoost || 0) + (tank.commanderArmorBoost || 0)) + (tank.mapArmorBonus || 0));
        const dealt = applyDirectDamage(tank, b.damage * falloff / armor, b.owner, getWeaponCause(b.type), b);
        if(dealt > 0) showDamageNumber(tank.x, tank.y - 30, Math.floor(dealt));
        if(dealt > 0 && typeof tryApplyProjectileElementalStatus === 'function') {
            tryApplyProjectileElementalStatus(b, tank);
        }
    });
    createParticles(b.x, b.y, b.ancientCannon ? 95 : 25, b.ancientCannon ? '#ffd34f' : '#ff6600', b.ancientCannon ? 4.5 : 2);
    if(b.ancientCannon && typeof showNotification === 'function') {
        showNotification('💥 远古地图炮命中：毁灭冲击波席卷目标区域', '#ffcf4d');
    }
}


// ==================== 碰撞系统 ====================
function getProjectileTargetHeight(tank) {
    return (tank.z || 0) + (tank.isFlying ? 8 : 22);
}

function projectileMatchesTargetHeight(projectile, tank) {
    if(!projectile || !tank) return false;
    if(projectile.type === 'mg' && tank.isFlying) return false;
    if(projectile.type === 'airmg' && !tank.isFlying) return false;
    const tolerances = { shell: 24, aa: CONFIG.aaHitHeightTolerance, mg: 20, airmg: 38, rocket: 30 };
    const tolerance = tolerances[projectile.type] ?? 24;
    return Math.abs((projectile.z || 0) - getProjectileTargetHeight(tank)) <= tolerance;
}

function tryAPSInterceptProjectile(projectile) {
    if(!projectile || projectile.apsImmune || projectile.apsIntercepted || !['shell', 'aa', 'rocket'].includes(projectile.type)) return null;
    const radius = CONFIG.apsInterceptionRadius || 95;
    const heightTolerance = CONFIG.apsInterceptionHeightTolerance || 72;
    const candidates = getNearbyTanks(projectile.x, projectile.y, radius)
        .filter(tank => tank && !tank.dead && tank.team !== projectile.team &&
            (tank.apsCharges || 0) > 0 && (tank.apsCooldown || 0) <= 0)
        .sort((a, b) => Math.hypot(a.x - projectile.x, a.y - projectile.y) - Math.hypot(b.x - projectile.x, b.y - projectile.y));
    for(const tank of candidates) {
        const distance = Math.hypot(tank.x - projectile.x, tank.y - projectile.y);
        if(distance > radius || Math.abs(getProjectileTargetHeight(tank) - (projectile.z || 0)) > heightTolerance) continue;
        const toTankX = tank.x - projectile.x;
        const toTankY = tank.y - projectile.y;
        const horizontalSpeed = Math.hypot(projectile.vx || 0, projectile.vy || 0);
        if(horizontalSpeed > .1 && (projectile.vx * toTankX + projectile.vy * toTankY) <= 0) continue;
        tank.apsCharges--;
        tank.apsCooldown = CONFIG.apsCooldown;
        projectile.apsIntercepted = true;
        if(typeof apsInterceptEffects !== 'undefined') {
            apsInterceptEffects.push({
                x1: tank.x, y1: tank.y, z1: getProjectileTargetHeight(tank) + 12,
                x2: projectile.x, y2: projectile.y, z2: projectile.z || 0,
                life: .28, maxLife: .28
            });
        }
        for(let step = 1; step <= 5; step++) {
            const progress = step / 6;
            createParticles(
                tank.x + (projectile.x - tank.x) * progress,
                tank.y + (projectile.y - tank.y) * progress,
                2, '#54e7ff', .72
            );
        }
        createParticles(projectile.x, projectile.y, 18, '#8ef3ff', 1.45);
        createParticles(projectile.x, projectile.y, 8, '#ff9a42', .9);
        if(typeof areDamageNumbersEnabled !== 'function' || areDamageNumbersEnabled()) {
            damageNumbers.push({
                x: projectile.x, y: projectile.y, z: (projectile.z || 0) + 18,
                text: 'APS 拦截', life: .9, maxLife: .9, vy: -32, vz: 38, color: '#72efff'
            });
        }
        if(tank === player && typeof showMessage === 'function') showMessage('◇ APS 车外拦截成功', '#72efff');
        if(typeof playWorldSound === 'function') playWorldSound('aa', projectile.x, projectile.y, tank === player ? .9 : .55);
        return tank;
    }
    return null;
}

function checkCollisions() {
    for(let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        let hitCount = 0;
        let maxHits = b.maxTargetHits || (b.type === 'mg' ? CONFIG.mgPenetration : 1);
        if(tryAPSInterceptProjectile(b)) {
            bullets.splice(i, 1);
            continue;
        }
        
        const nearbyTanks = getNearbyTanks(b.x, b.y, CONFIG.tankSize * 2.5);
        const potentialTargets = nearbyTanks.filter(t => {
            if(!t || t.dead) return false;
            if(b.neutralSniperTargetId && t.id !== b.neutralSniperTargetId) return false;
            if(t.team === b.team) {
                const friendlyFire = typeof isFriendlyFireEnabled === 'function' && isFriendlyFireEnabled();
                return (friendlyFire || !!b.ricocheted) && t.invincible <= 0;
            }
            return t.invincible <= 0;
        });
        
        for(let tank of potentialTargets) {
            if(hitCount >= maxHits) break;
            if(b.hitTanks && b.hitTanks.has(tank.id)) continue;
            const dist = Math.hypot(b.x - tank.x, b.y - tank.y);
            if(dist < (tank.hitRadius || CONFIG.tankSize)) {
                // XYZ 三轴同时重叠才命中；XY 擦过但高度不符时继续飞行。
                if(!projectileMatchesTargetHeight(b, tank)) continue;
                if(b.ricocheted && tank.team === b.team &&
                    !(typeof isFriendlyFireEnabled === 'function' && isFriendlyFireEnabled())) {
                    tank.ricochetSpeedBoost = CONFIG.ricochetFriendlySpeedBoost;
                    tank.ricochetSpeedBoostTimer = CONFIG.ricochetFriendlyBoostDuration;
                    createParticles(tank.x, tank.y, 14, '#64f5c8', 1.35);
                    if(tank === player && typeof showMessage === 'function') showMessage('↗ 友军误射激励：速度 +10%（5秒）', '#64f5c8');
                    if(typeof playWorldSound === 'function') playWorldSound('capture', tank.x, tank.y, tank === player ? 0.72 : 0.45);
                    hitCount++;
                    if(b.hitTanks) b.hitTanks.add(tank.id);
                    continue;
                }
                let actualArmor = tank.armor * (1 + (tank.armorBoost || 0) + (tank.commanderArmorBoost || 0)) + (tank.mapArmorBonus || 0);
                if(tank.fortressActive && tank.ultimateData) actualArmor = tank.armor * (tank.ultimateData.armorMult || 5.0);
                if(tryTankArmorRicochet(tank, b, actualArmor)) {
                    hitCount++;
                    continue;
                }
                let damage = b.damage;
                if(typeof modifyTankEvolutionOutgoingDamage === 'function') {
                    damage = modifyTankEvolutionOutgoingDamage(b, tank, damage);
                }
                if(typeof modifyStoryBossDamage === 'function') {
                    damage = modifyStoryBossDamage(tank, b, damage);
                }
                if(tank.isFlying && b.type === 'shell') damage *= 0.4;
                if(tank.isFlying && b.type === 'aa') {
                    const aaMapMultiplier = currentMap === 'classic' ? 1.35 : currentMap === 'island' ? 1.20 : 1;
                    damage *= aaMapMultiplier;
                }
                if(b.owner && b.owner.judgeActive && b.owner.ultimateData) {
                    damage *= 1 + (b.owner.ultimateData.damageBoost || 0);
                    if(tank.judged && tank.judgeOwner === b.owner && tank.hp / tank.maxHp <= (b.owner.ultimateData.executeThreshold || 0)) {
                        damage += b.owner.ultimateData.executeDamage || 0;
                    }
                }
                const effectiveArmor = actualArmor * (1 - Math.max(0, Math.min(.95, b.armorIgnorePercent || 0)));
                if(!b.armorIgnore && (b.type === 'mg' || b.type === 'airmg')) damage = damage / Math.max(1, effectiveArmor * 0.5);
                else if(!b.armorIgnore) damage = damage / Math.max(0.25, effectiveArmor);
                if(tank.reflectActive && tank.fortressActive && b.owner) {
                    const reflectMult = tank.evolutionEffects && tank.evolutionEffects.reflectMult || 1;
                    const reflectDmg = damage * (tank.ultimateData.reflectDamage || 0.3) * reflectMult;
                    applyDirectDamage(b.owner, reflectDmg, tank, '反射伤害'); showDamageNumber(b.owner.x, b.owner.y - 30, Math.floor(reflectDmg));
                    createParticles(b.owner.x, b.owner.y, 5, '#ff0000', 1);
                }
                let dealtToTank = 0;
                if(tank.shieldProtected && tank.shieldOwner && !tank.shieldOwner.dead) {
                    const redirect = tank.shieldOwner.ultimateData.damageRedirect || 0.4;
                    const redirectDamage = damage * redirect;
                    dealtToTank = applyDirectDamage(tank, damage - redirectDamage, b.owner, getWeaponCause(b.type), b);
                    applyDirectDamage(tank.shieldOwner, redirectDamage, b.owner, getWeaponCause(b.type), b);
                } else dealtToTank = applyDirectDamage(tank, damage, b.owner, getWeaponCause(b.type), b);
                if(dealtToTank > 0 && !tank.dead) applyTankHitReaction(tank, b);
                if(typeof handleStoryCloneProjectileHit === 'function') handleStoryCloneProjectileHit(tank, b);
                if(typeof handleTankEvolutionProjectileHit === 'function') handleTankEvolutionProjectileHit(b, tank, dealtToTank);
                if(typeof spawnTankImpactAnimation === 'function') spawnTankImpactAnimation(b, tank);
                if(dealtToTank > 0 && typeof tryApplyProjectileElementalStatus === 'function') {
                    tryApplyProjectileElementalStatus(b, tank);
                }
                if(dealtToTank > 0 && b.storyForcedIce && typeof applyTankElementalStatus === 'function') {
                    applyTankElementalStatus(tank, 'ice', 2.5, {source:b.owner});
                }
                if(b.explosionRadius > 0) {
                    getNearbyTanks(b.x, b.y, b.explosionRadius).forEach(other => {
                        if(other === tank || other.dead || (other.team === b.team &&
                            !(typeof isFriendlyFireEnabled === 'function' && isFriendlyFireEnabled()))) return;
                        const distance = Math.hypot(other.x - b.x, other.y - b.y);
                        if(distance > b.explosionRadius) return;
                        const splash = b.damage * 0.5 * Math.max(0.25, 1 - distance / b.explosionRadius);
                        const splashArmor = Math.max(0.25, other.armor * (1 + (other.armorBoost || 0) + (other.commanderArmorBoost || 0)) + (other.mapArmorBonus || 0));
                        applyDirectDamage(other, splash / splashArmor, b.owner, `${getWeaponCause(b.type) || '爆炸'}溅射`, b);
                    });
                }
                createParticles(b.x, b.y, b.neutralSniper ? 16 : 5, b.neutralSniper ? '#b82cff' : '#ff4400', b.neutralSniper ? 1.8 : 1);
                showDamageNumber(tank.x, tank.y - 30, Math.floor(damage));
                if(typeof playWorldSound === 'function') playWorldSound('hit', tank.x, tank.y, tank === player ? 1 : 0.7);
                hitCount++;
                if(b.hitTanks) b.hitTanks.add(tank.id);
            }
        }
        if(hitCount > 0 && (!b.hitTanks || b.hitTanks.size >= maxHits)) {
            if(b.isDrone && typeof explodeEvolutionDrone === 'function') explodeEvolutionDrone(b);
            if(typeof createEvolutionRocketImpact === 'function') createEvolutionRocketImpact(b);
            bullets.splice(i, 1);
        }
    }
    
    for(let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        let hitBase = false;
        [bases.blue, bases.red].forEach(base => {
            if(hitBase) return;
            if(b.neutralSniper) return;
            if(b.type === 'aa' || b.type === 'airmg' || b.type === 'bomb') return;
            if(b.x > base.x && b.x < base.x + base.w && b.y > base.y && b.y < base.y + base.h) {
                const baseZ = base.z || 0;
                if((b.z || 0) < baseZ || (b.z || 0) > baseZ + 78) return;
                if(base.team !== b.team) {
                    if(base.invulnerable) {
                        createParticles(b.x, b.y, 8, '#9be9ff', 1.1);
                        hitBase = true;
                        return;
                    }
                    const wasAlive = base.hp > 0;
                    const structureMult = b.owner && b.owner.evolutionEffects && b.owner.evolutionEffects.structureDamageMult || 1;
                    base.hp -= b.damage * structureMult;
                    if(wasAlive && base.hp <= 0) recordBaseDestroy(b.team, b.owner || null);
                    createParticles(b.x, b.y, 8, '#ff6600', 1.2); hitBase = true;
                }
            }
        });
        if(hitBase) bullets.splice(i, 1);
    }
}

function lineOfSight(x1, y1, x2, y2, factoryFloor = null) {
    const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 80));
    const terrainStart = typeof getTacticalTerrainHeightAt === 'function' ? getTacticalTerrainHeightAt(x1,y1) + 32 : 0;
    const terrainEnd = typeof getTacticalTerrainHeightAt === 'function' ? getTacticalTerrainHeightAt(x2,y2) + 32 : 0;
    for(let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = x1 + (x2 - x1) * t;
        const cy = y1 + (y2 - y1) * t;
        if(i>0&&i<steps&&typeof getTacticalTerrainHeightAt==='function'){
            const sightHeight=terrainStart+(terrainEnd-terrainStart)*t;
            if(getTacticalTerrainHeightAt(cx,cy)>sightHeight+10)return false;
        }
        for(const cloud of smokeClouds) {
            if(cloud.life <= 0) continue;
            if(factoryFloor !== null && Math.abs((cloud.z || 0) - (typeof getFactoryFloorZ === 'function' ? getFactoryFloorZ(factoryFloor) : 0)) > 90) continue;
            if(Math.hypot(cx - cloud.x, cy - cloud.y) < cloud.radius) return false;
        }
        for(let obs of obstacles) {
            if(factoryFloor !== null && typeof factoryObstacleMatchesFloor === 'function' && !factoryObstacleMatchesFloor(obs, factoryFloor)) continue;
            if(obs.type === 'factoryPlatform') continue;
            if(cx > obs.x && cx < obs.x + obs.w && cy > obs.y && cy < obs.y + obs.h) {
                return false;
            }
        }
    }
    return true;
}

function getObstacleWorldHeight(obs) {
    if(!obs) return 0;
    const baseZ = typeof currentMap !== 'undefined' && currentMap === 'factory'
        ? (Number.isFinite(obs.z) ? obs.z : (Number.isInteger(obs.factoryFloor) && typeof getFactoryFloorZ === 'function' ? getFactoryFloorZ(obs.factoryFloor) : 0)) : 0;
    if(Number.isFinite(obs.worldHeight)) return baseZ + obs.worldHeight;
    if(obs.type === 'factoryPlatform') return (obs.platformHeight || 120) + 18;
    if(obs.type === 'oilBarrel') return baseZ + 58;
    if(obs.type === 'factorySkateboard') return baseZ + 14;
    if(obs.type === 'factoryBoundary' || obs.type === 'factoryElevatorShaft') return baseZ + (typeof FACTORY_FLOOR_HEIGHT!=='undefined'?FACTORY_FLOOR_HEIGHT:500) * 3;
    if(obs.type === 'factoryFacility') return baseZ + 86;
    if(obs.type === 'factoryCrate') return baseZ + 54;
    if(obs.type === 'factoryWall') return baseZ + 70 + (obs.floors || 3) * 18;
    if(obs.type === 'rubble') return obs.rubbleHeight || Math.max(18, Math.min(42, Math.min(obs.w, obs.h) * 0.42));
    if(obs.type === 'building') return 52 + (obs.floors || 4) * 18;
    if(obs.type === 'tree') return Math.max(35, Math.min(obs.w, obs.h) * 0.9);
    return Math.max(35, Math.min(obs.w, obs.h) * 0.58);
}

function flyingTankHitsObstacle(x, y, z, radius) {
    const bodyBottom = z - 24;
    if(typeof factoryFlightHitsSlab==='function'&&factoryFlightHitsSlab(x,y,z,24))return true;
    for(const obs of obstacles) {
        const closestX = Math.max(obs.x, Math.min(x, obs.x + obs.w));
        const closestY = Math.max(obs.y, Math.min(y, obs.y + obs.h));
        if(Math.hypot(x - closestX, y - closestY) < radius && bodyBottom < getObstacleWorldHeight(obs)) return true;
    }
    return false;
}

function registerHelicopterCollision(tank) {
    if(!tank || !tank.isFlying || tank.helicopterCollisionCooldown > 0) return;
    tank.helicopterCollisionCooldown = 0.42;
    tank.helicopterCollisionReset = 6;
    tank.helicopterCollisionHits = (tank.helicopterCollisionHits || 0) + 1;
    const dealt = applyDirectDamage(tank, CONFIG.helicopterCollisionDamage, null, '障碍物撞击');
    if(dealt > 0) showDamageNumber(tank.x, tank.y - 30, Math.round(dealt));
    createParticles(tank.x, tank.y, 12, '#ff8a32', 1.2);
    if(typeof playWorldSound === 'function') playWorldSound('hit', tank.x, tank.y, tank === player ? 1 : 0.65);
    if(tank.helicopterCollisionHits >= CONFIG.helicopterIgniteHits && !tank.helicopterOnFire) {
        tank.helicopterOnFire = true;
        tank.helicopterFireTimer = CONFIG.helicopterFireDuration;
        tank.helicopterFireDamageTick = 0;
        if(tank === player) showMessage('🔥 连续撞击导致直升机起火！', '#ff5522');
    }
}

function updateHelicopterFlight(tank, dt) {
    if(!tank || !tank.isFlying) return;
    tank.helicopterCollisionCooldown = Math.max(0, (tank.helicopterCollisionCooldown || 0) - dt);
    tank.helicopterCollisionReset = Math.max(0, (tank.helicopterCollisionReset || 0) - dt);
    if(tank.helicopterCollisionReset <= 0) tank.helicopterCollisionHits = 0;

    if(tank.isPlayer) {
        let lift = helicopterLiftInput;
        if(keys.KeyE || keys.Space) lift = 1;
        if(keys.KeyQ || keys.ShiftLeft || keys.ShiftRight) lift = -1;
        if(lift !== 0) {
            const maxAltitude = CONFIG.helicopterMaxAltitude * (tank.maxAltitudeMult || 1);
            const climbSpeed = CONFIG.helicopterClimbSpeed * (tank.climbSpeedMult || 1);
            const nextZ = Math.max(CONFIG.helicopterMinAltitude, Math.min(maxAltitude,
                (tank.z || CONFIG.helicopterAltitude) + lift * climbSpeed * dt));
            if(lift < 0 && flyingTankHitsObstacle(tank.x, tank.y, nextZ, CONFIG.tankSize * 0.8)) registerHelicopterCollision(tank);
            else tank.z = nextZ;
        }
    }

    if(tank.helicopterOnFire) {
        tank.helicopterFireTimer -= dt;
        tank.helicopterFireDamageTick = (tank.helicopterFireDamageTick || 0) - dt;
        if(tank.helicopterFireDamageTick <= 0) {
            tank.helicopterFireDamageTick = 0.5;
            const damage = CONFIG.helicopterFireDps * 0.5;
            applyDirectDamage(tank, damage, null, '直升机失火');
            showDamageNumber(tank.x, tank.y - 30, Math.round(damage));
        }
        if(Math.random() < 0.35) createParticles(tank.x, tank.y, 2, '#ff5a20', 0.9);
        if(tank.helicopterFireTimer <= 0) {
            tank.helicopterOnFire = false;
            tank.helicopterCollisionHits = 0;
        }
    }
}

function checkObstacleCollision(x, y, radius, tank = null) {
    if(tank && tank.isFlying) return flyingTankHitsObstacle(x, y, tank.z || CONFIG.helicopterAltitude, radius * 0.82);
    if(tank && !canTankCrossWater(tank) && isPositionInWater(x, y, radius * 0.75)) return true;
    if(currentMap === 'factory' && tank && typeof isFactoryRampGuardrailCollision === 'function' && isFactoryRampGuardrailCollision(x,y,tank.z||0,radius*.65)) return true;
    if(currentMap === 'factory' && tank && typeof isFactoryElevatorExitBlocked === 'function' && isFactoryElevatorExitBlocked(tank,x,y)) return true;
    if(currentMap === 'factory' && tank && typeof isFactorySurfaceReachable === 'function' && !isFactorySurfaceReachable(x,y,tank.z||0)) return true;
    for(let obs of obstacles) {
        if(currentMap === 'factory' && tank && typeof factoryObstacleOverlapsHeight === 'function' && !factoryObstacleOverlapsHeight(obs,tank.z||0,58)) continue;
        if(obs.type === 'factoryPlatform') continue;
        const closestX = Math.max(obs.x, Math.min(x, obs.x + obs.w));
        const closestY = Math.max(obs.y, Math.min(y, obs.y + obs.h));
        const dist = Math.hypot(x - closestX, y - closestY);
        if(dist < radius) return true;
    }
    return false;
}

function resolveTankCollisions() {
    // 工厂内的坦克与轻物体已经全部交给 Ammo.js 动态刚体处理。
    if(typeof isFactoryPhysicsReady === 'function' && isFactoryPhysicsReady()) return;
    const allTanks = [player, ...allies, ...enemies].filter(t => t && !t.dead);
    
    for(let tank of allTanks) {
        const nearby = getNearbyTanks(tank.x, tank.y, CONFIG.aiTankMinDistance * 2);
        for(let other of nearby) {
            if(other === tank || other.dead) continue;
            // 幽灵坦克不参与物理碰撞
            if(tank.ghostActive || other.ghostActive ||
               (tank.evolutionStealthActive && tank.evolutionEffects && tank.evolutionEffects.phaseTanks) ||
               (other.evolutionStealthActive && other.evolutionEffects && other.evolutionEffects.phaseTanks)) continue;
            // 飞行单位不参与地面坦克碰撞
            if(tank.isFlying || other.isFlying) continue;
            if(Math.abs((tank.z || 0) - (other.z || 0)) > 55) continue;
            const dx = other.x - tank.x, dy = other.y - tank.y;
            const dist = Math.hypot(dx, dy);
            const minDist = CONFIG.aiTankMinDistance;
            if(dist < minDist && dist > 0) {
                const pushX = dx / dist * (minDist - dist) * 0.5;
                const pushY = dy / dist * (minDist - dist) * 0.5;
                tank.x -= pushX; tank.y -= pushY;
                other.x += pushX; other.y += pushY;
                // 防止被挤进障碍物
                if(checkObstacleCollision(tank.x, tank.y, CONFIG.tankSize, tank)) {
                    tank.x += pushX; tank.y += pushY;
                }
                if(checkObstacleCollision(other.x, other.y, CONFIG.tankSize, other)) {
                    other.x -= pushX; other.y -= pushY;
                }
                tank.x = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapWidth - CONFIG.tankSize, tank.x));
                tank.y = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapHeight - CONFIG.tankSize, tank.y));
                other.x = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapWidth - CONFIG.tankSize, other.x));
                other.y = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapHeight - CONFIG.tankSize, other.y));
            }
        }
    }
}


// ==================== 据点系统 ====================
function updateOutposts(dt) {
    const allTanks = [player, ...allies, ...enemies].filter(t => t && !t.dead);
    outposts.forEach(op => {
        if(!Number.isFinite(op.level)) op.level = op.owner ? 1 : 0;
        if(!Number.isFinite(op.heldTime)) op.heldTime = 0;
        if(!Number.isFinite(op.minuteScoreTimer)) op.minuteScoreTimer = CONFIG.outpostLevelInterval;
        if(!Number.isFinite(op.recaptureTimer)) op.recaptureTimer = 0;
        if(op.recaptureTimer > 0) {
            op.recaptureTimer = Math.max(0, op.recaptureTimer - dt);
            if(op.recaptureTimer <= 0) op.recaptureTeam = null;
        }

        if(op.owner) {
            op.heldTime += dt;
            const nextLevel = Math.min(
                CONFIG.outpostMaxLevel,
                1 + Math.floor(op.heldTime / CONFIG.outpostLevelInterval)
            );
            if(nextLevel > op.level) {
                op.level = nextLevel;
                if(typeof addBattleAnnouncement === 'function') {
                    addBattleAnnouncement(op.owner, `${op.name}点升级至 Lv.${op.level}`);
                }
                createParticles(op.x, op.y, 22, op.owner === 'blue' ? '#61b5ff' : '#ff6b61', 1.8);
            }
            op.minuteScoreTimer -= dt;
            while(op.minuteScoreTimer <= 0) {
                if(typeof awardOutpostMinuteScore === 'function') {
                    awardOutpostMinuteScore(op.owner, op.name, op.level);
                }
                op.minuteScoreTimer += CONFIG.outpostLevelInterval;
            }
        }

        let blueIn = false, redIn = false;
        allTanks.forEach(t => {
            if(currentMap === 'factory' && Math.abs((t.z||0)-(op.z||0))>85) return;
            const dist = Math.hypot(t.x - op.x, t.y - op.y);
            if(dist < op.radius) { if(t.team === 'blue') blueIn = true; else redIn = true; }
        });
        const soleTeam = blueIn && !redIn ? 'blue' : redIn && !blueIn ? 'red' : null;
        if(soleTeam && soleTeam !== op.owner) {
            if(op.capturingTeam !== soleTeam) { op.capturingTeam = soleTeam; op.captureProgress = 0; }
            op.captureProgress += dt;
        } else {
            op.captureProgress = soleTeam === op.owner ? 0 : Math.max(0, op.captureProgress - dt * 0.5);
            if(soleTeam === op.owner) op.capturingTeam = null;
        }
        const captureTime = op.recaptureTimer > 0 && op.capturingTeam === op.recaptureTeam
            ? CONFIG.outpostCaptureTime * CONFIG.outpostRecaptureTimeMultiplier
            : CONFIG.outpostCaptureTime;
        if(op.captureProgress >= captureTime) {
            const oldOwner = op.owner;
            if(oldOwner !== op.capturingTeam) {
                recordOutpostCapture(op.capturingTeam);
                const contributor = allTanks
                    .filter(tank =>
                        tank.team === op.capturingTeam &&
                        (currentMap !== 'factory' || Math.abs((tank.z || 0) - (op.z || 0)) <= 85) &&
                        Math.hypot(tank.x - op.x, tank.y - op.y) < op.radius
                    )
                    .sort((a, b) => Math.hypot(a.x - op.x, a.y - op.y) - Math.hypot(b.x - op.x, b.y - op.y))[0] || null;
                if(typeof awardOutpostScore === 'function') awardOutpostScore(op.capturingTeam, op.name, contributor);
            }
            op.owner = op.capturingTeam;
            op.captureProgress = 0;
            op.capturingTeam = null;
            if(oldOwner !== op.owner) {
                op.level = 1;
                op.heldTime = 0;
                op.minuteScoreTimer = CONFIG.outpostLevelInterval;
                op.recaptureTeam = oldOwner;
                op.recaptureTimer = oldOwner ? CONFIG.outpostRecaptureWindow : 0;
                createParticles(op.x, op.y, 30, op.owner === 'blue' ? '#4488ff' : '#ff4444', 2.5);
                if(typeof playWorldSound === 'function') playWorldSound('capture', op.x, op.y, 1);
            }
        }
        const hudState = `${op.owner}|${op.level}|${op.recaptureTeam}|${Math.ceil(op.recaptureTimer)}`;
        if(hudState !== op.lastHudState) {
            op.lastHudState = hudState;
            if(typeof updateOutpostInfo === 'function') updateOutpostInfo();
        }
    });
}

function updateBaseSpawns(dt) {
    ['blue','red'].forEach(team=>{
        const base=bases[team];
        if(!base||base.hp<=0)return;
        const interval=typeof getBaseSpawnInterval==='function'?getBaseSpawnInterval(team):15;
        baseSpawnTimers[team]=Math.max(0,(baseSpawnTimers[team]??interval)-dt);
        if(baseSpawnTimers[team]>0)return;
        baseSpawnTimers[team]=interval;
        spawnBaseTank(team);
    });
}

function spawnBaseTank(team) {
    if(team!=='blue'&&team!=='red')return null;
    const teamCount=team==='blue'
        ?[player,...allies].filter(t=>t&&!t.dead).length
        :enemies.filter(t=>t&&!t.dead).length;
    if(teamCount >= 30) return null;
    const customTypes = gameMode === 'custom' && typeof getCustomTankPool === 'function' ? getCustomTankPool() : null;
    const types = customTypes && customTypes.length ? customTypes : Object.keys(TANKS).filter(type => !TANKS[type].isHidden);
    const type = types[Math.floor(Math.random() * types.length)];
    const data = TANKS[type];
    if(!data)return null;
    const deployment=typeof findBaseDeploymentPoint==='function'
        ?findBaseDeploymentPoint(team,teamCount)
        :{x:bases[team].x+bases[team].w/2,y:bases[team].y+bases[team].h/2};
    const masteryLevel = typeof rollTeamAIMasteryLevel === 'function' ? rollTeamAIMasteryLevel(team) : null;
    const tank = createTank(data, deployment.x, deployment.y, team, false, masteryLevel);
    if(currentMap === 'factory' && typeof getFactoryFloorZ === 'function') {
        tank.factoryFloor = 1;
        tank.z = getFactoryFloorZ(1)+(tank.isFlying?CONFIG.helicopterAltitude:0);
    }
    const customAmmoRatio = gameMode === 'custom' && typeof customRoomConfig !== 'undefined'
        ? customRoomConfig.aiAmmoPercent / 100
        : null;
    tank.shells = Math.floor(data.maxShells * (customAmmoRatio ?? 0.5));
    tank.mg = Math.floor(data.maxMG * (customAmmoRatio ?? 0.5));
    tank.aa = Math.floor((data.maxAA ?? 15) * (customAmmoRatio ?? 0.45));
    tank.apsCharges = CONFIG.apsCharges;
    if(team === 'blue') {
        tank.aiSkillLevel = gameConfig.difficulty === 'hard' ? 1.0 : 0.78;
        allies.push(tank);
    } else {
        tank.aiSkillLevel = gameMode === 'defense'
            ? (gameConfig.difficulty === 'easy' ? 0.8 : gameConfig.difficulty === 'hard' ? 1.25 : 1.0)
            : (gameConfig.difficulty === 'easy' ? 0.88 : gameConfig.difficulty === 'hard' ? 1.4 : 1.08);
        tank.aiDamageMult = gameMode === 'defense' ? 1.0 : (gameConfig.difficulty === 'easy' ? 1.02 : gameConfig.difficulty === 'hard' ? 1.14 : 1.05);
        enemies.push(tank);
    }
    aiTanks.push(tank);
    if(typeof addBattleAnnouncement==='function'){
        const teamName=team==='blue'?'蓝方':'红方';
        addBattleAnnouncement(team,`🏭 ${teamName}基地部署 ${data.name}`);
    }
    return tank;
}
