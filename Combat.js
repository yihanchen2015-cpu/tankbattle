// ==================== 子弹系统 ====================
function fireBullet(tank, type) {
    const infiniteReserve = !!tank.suddenDeathInfiniteAmmo || (tank.stormActive && tank.tankType === 'duoduo_ifv');
    if ((type === 'shell' || type === 'bomb') && tank.shells <= 0 && !infiniteReserve) return;
    if ((type === 'mg' || type === 'airmg') && tank.mg <= 0 && !infiniteReserve) return;
    if (type === 'aa' && (tank.aa || 0) <= 0 && !infiniteReserve) return;
    if(tank.isPlayer) recordShot(type);
    tank.lastFiredWeapon = type;
    
    if(tank.ghostActive && tank.ultimateData && tank.ultimateData.revealOnFire) tank.ghostRevealed = true;
    let speedMult = 1, spreadMult = 1, damageMult = 1, infiniteAmmo = !!tank.suddenDeathInfiniteAmmo;
    if(tank.stormActive && tank.tankType === 'duoduo_ifv') {
        speedMult = tank.ultimateData.mgRateMult || 3; spreadMult = tank.ultimateData.mgSpreadMult || 0.5;
        infiniteAmmo = tank.ultimateData.infiniteAmmo; damageMult = tank.ultimateData.damageBoost || 1.5;
    }
    const baseSpeed = type === 'bomb' ? 0 : (type === 'shell' ? CONFIG.bulletSpeed : (type === 'aa' ? CONFIG.aaSpeed : CONFIG.mgSpeed * speedMult));
    const elevationDeg = type === 'shell' ? (tank.shellElevation ?? CONFIG.shellDefaultElevation)
        : type === 'aa' ? (tank.aaElevation ?? CONFIG.aaDefaultElevation) : 0;
    const elevation = elevationDeg * Math.PI / 180;
    const speed = baseSpeed * Math.cos(elevation);
    const spread = (type === 'mg' || type === 'airmg') ? (Math.random() - 0.5) * 0.12 * spreadMult : (type === 'aa' ? (Math.random() - 0.5) * 0.08 : 0);
    const angle = tank.turretAngle + spread;
    const maxLife = type === 'bomb' ? 5.0 : (type === 'shell' ? 4.0 : (type === 'aa' ? 5.0 : 1.2));
    const muzzleDistance = type === 'bomb' ? 0 : tank.turretSize + 12;
    bullets.push({
        x: tank.x + Math.cos(angle) * muzzleDistance,
        y: tank.y + Math.sin(angle) * muzzleDistance,
        z: type === 'bomb' ? Math.max(28, (tank.z || CONFIG.helicopterAltitude) - 8) : (tank.z || 0) + (type === 'aa' ? 18 : 24),
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        vz: type === 'bomb' ? -35 : ((type === 'shell' || type === 'aa') ? baseSpeed * 60 * Math.sin(elevation) : 0),
        damage: (type === 'bomb' ? 340 : (type === 'shell' ? CONFIG.bulletDamage : (type === 'aa' ? CONFIG.aaDamage : (type === 'airmg' ? 18 : CONFIG.mgDamage)))) * damageMult * (tank.aiDamageMult || 1),
        team: tank.team, type, owner: tank,
        life: maxLife, maxLife, age: 0,
        altitude: (tank.z || 0) + (type === 'aa' ? 18 : 24),
        trackingRange: type === 'aa' ? CONFIG.aaTrackingRange : 0,
        trackingTarget: null,
        trackingLocked: false,
        canRicochet: type === 'shell',
        ricocheted: false,
        maxTargetHits: 1,
        ignoresObstacles: type === 'aa' || type === 'airmg' || !!tank.isFlying,
        hitTanks: new Set(),
        armorIgnore: tank.tankType === 'duoduo_spat',
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
    });
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
        type === 'bomb' ? '#ff6840' : (type === 'shell' ? '#ffaa00' : (type === 'aa' ? '#ff44ff' : '#ffff88')),
        type === 'shell' || type === 'bomb' ? 1.5 : (type === 'aa' ? 1.2 : 0.5));
    if(typeof playWorldSound === 'function') playWorldSound(type === 'airmg' ? 'mg' : type, tank.x, tank.y, tank.isPlayer ? 1 : 0.72);
}

function updateBullets(dt) {
    for(let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.age = (b.age || 0) + dt;
        if(!Number.isFinite(b.z)) b.z = (b.owner && b.owner.z || 0) + 24;
        if(!Number.isFinite(b.vz)) b.vz = 0;
        if(b.isDrone) {
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
            const desiredVz = Math.max(-650, Math.min(650, (targetZ - b.z) * 1.4));
            b.vz += (desiredVz - b.vz) * Math.min(1, dt * 1.4);
        }
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
        b.prevX = b.x; b.prevY = b.y;
        b.x += b.vx * 60 * dt; b.y += b.vy * 60 * dt; b.life -= dt;
        if(b.type === 'aa' || b.type === 'shell') {
            b.z += b.vz * dt;
            b.vz -= (b.type === 'aa' ? CONFIG.aaGravity : CONFIG.shellGravity) * dt;
            b.altitude = b.z;
        }
        if(Math.random() < 0.4) createParticles(b.x, b.y, 1, b.type === 'shell' ? '#ff8800' : (b.type === 'aa' ? '#ff66ff' : '#ffff44'), 0.4);
        if(b.isRocket && (Math.hypot(b.x - b.targetX, b.y - b.targetY) < 35 || b.life <= 0)) {
            explodeRocket(b);
            bullets.splice(i, 1);
            continue;
        }
        if(b.life <= 0 || b.z < -5 || b.x < 0 || b.x > CONFIG.mapWidth || b.y < 0 || b.y > CONFIG.mapHeight) { bullets.splice(i, 1); continue; }
        if(typeof handleMapMechanicProjectile === 'function' && handleMapMechanicProjectile(b)) { bullets.splice(i, 1); continue; }
        if(b.ignoresObstacles) continue;
        for(let obs of obstacles) {
            if(b.x > obs.x && b.x < obs.x + obs.w && b.y > obs.y && b.y < obs.y + obs.h) {
                if(typeof factoryObstacleMatchesProjectile === 'function' && !factoryObstacleMatchesProjectile(obs, b)) continue;
                if(obs.type === 'factoryPlatform' && typeof factoryPlatformMatchesProjectile === 'function' && !factoryPlatformMatchesProjectile(obs, b)) continue;
                if(obs.type !== 'factoryPlatform' && (b.z || 0) > getObstacleWorldHeight(obs)) continue;
                if(typeof tryRicochetBullet === 'function' && tryRicochetBullet(b, obs)) {
                    createParticles(b.x, b.y, 12, '#9ffaff', 1.45);
                    if(typeof playWorldSound === 'function') playWorldSound('aa', b.x, b.y, b.owner && b.owner.isPlayer ? 0.9 : 0.55);
                    break;
                } else if(b.isRocket) explodeRocket(b);
                else {
                    if(typeof damageObstacleAtPoint === 'function') damageObstacleAtPoint(obs, b.damage || CONFIG.bulletDamage, b.type, b.x, b.y, b.owner);
                    createParticles(b.x, b.y, 6, '#777', 1);
                }
                bullets.splice(i, 1); break;
            }
        }
    }
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

function tryRicochetBullet(bullet, obs) {
    if(!bullet || !obs || bullet.type !== 'shell' || !bullet.canRicochet || bullet.ricocheted || bullet.baseDefense) return false;
    const speed = Math.hypot(bullet.vx, bullet.vy);
    if(speed <= 0.001) return false;
    const impact = getBulletObstacleImpact(bullet, obs);
    const dot = (bullet.vx / speed) * impact.nx + (bullet.vy / speed) * impact.ny;
    const grazingAngle = Math.asin(Math.min(1, Math.abs(dot))) * 180 / Math.PI;
    if(grazingAngle >= CONFIG.ricochetMaxGrazingAngle) return false;
    bullet.vx -= 2 * dot * speed * impact.nx;
    bullet.vy -= 2 * dot * speed * impact.ny;
    bullet.x = impact.x + impact.nx * 4;
    bullet.y = impact.y + impact.ny * 4;
    bullet.prevX = bullet.x;
    bullet.prevY = bullet.y;
    bullet.damage *= CONFIG.ricochetDamageMultiplier;
    bullet.ricocheted = true;
    bullet.maxTargetHits = 2;
    bullet.ricochetAngle = grazingAngle;
    return true;
}

function applyDirectDamage(tank, damage, source, cause = null, projectile = null) {
    if(!tank || tank.dead || damage <= 0) return 0;
    const preHitHp = tank.hp;
    let remaining = damage * Math.max(0, 1 - (tank.damageReduction || 0));
    if(tank.shieldActive && tank.shieldHp > 0) {
        const absorbed = Math.min(tank.shieldHp, remaining);
        tank.shieldHp -= absorbed;
        remaining -= absorbed;
        if(tank.shieldHp <= 0) tank.shieldActive = false;
    }
    if(remaining > 0) {
        tank.hp -= remaining;
        if(tank === player && typeof recordPlayerDamageSource === 'function') recordPlayerDamageSource(remaining, source, cause, projectile);
    }
    if(tank.hp <= 0 && !tank.dead) {
        if(source) recordKill(source, tank, { preHitHp, damage, weapon: source.isPlayer ? currentWeapon : null });
        tank.dead = true;
        createParticles(tank.x, tank.y, 40, tank.color, 3);
        createParticles(tank.x, tank.y, 25, '#ffaa00', 2);
        if(tank === player && typeof captureCombatReplayFrame === 'function') captureCombatReplayFrame(true);
        if(typeof playWorldSound === 'function') playWorldSound(tank === player ? 'death' : 'kill', tank.x, tank.y, tank === player ? 1.25 : 1);
        if(typeof shouldAmmoRackExplode === 'function' && shouldAmmoRackExplode(tank)) triggerAmmoRackExplosion(tank);
    }
    return remaining;
}

function getWeaponCause(type) {
    return ({ shell: '主炮', mg: '机枪', aa: '高射炮', rocket: '火箭', bomb: '垂直炸药包', airmg: '空对空机枪' })[type] || null;
}

function getBombImpactHeight(x, y) {
    let height = 0;
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
        if(!tank || tank.dead || tank.team === bomb.team) return;
        const dx = Math.abs(tank.x - bomb.x), dy = Math.abs(tank.y - bomb.y);
        if(dx > halfW || dy > halfH) return;
        if(Math.abs(getProjectileTargetHeight(tank) - (bomb.z || 0)) > 65) return;
        const falloff = Math.max(.3, 1 - Math.max(dx / halfW, dy / halfH));
        const dealt = applyDirectDamage(tank, bomb.damage * falloff / Math.max(.35, tank.armor + (tank.mapArmorBonus || 0)), bomb.owner, '垂直炸药包', bomb);
        if(dealt > 0) showDamageNumber(tank.x, tank.y - 34, Math.round(dealt));
    });
    const enemyBase = bomb.team === 'blue' ? bases.red : bases.blue;
    if(enemyBase && enemyBase.hp > 0) {
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
    const radius = 130;
    if(typeof damageTerrainInRadius === 'function') damageTerrainInRadius(b.x, b.y, radius, b.damage, 'rocket', b.owner);
    const targets = getNearbyTanks(b.x, b.y, radius);
    targets.forEach(tank => {
        if(tank.dead || tank.team === b.team) return;
        const distance = Math.hypot(tank.x - b.x, tank.y - b.y);
        if(distance > radius) return;
        if(Number.isFinite(b.z) && Math.abs(getProjectileTargetHeight(tank) - b.z) > 70) return;
        const falloff = Math.max(0.35, 1 - distance / radius);
        const armor = Math.max(0.25, tank.armor * (1 + (tank.armorBoost || 0)) + (tank.mapArmorBonus || 0));
        const dealt = applyDirectDamage(tank, b.damage * falloff / armor, b.owner, getWeaponCause(b.type), b);
        if(dealt > 0) showDamageNumber(tank.x, tank.y - 30, Math.floor(dealt));
        tank.burnTimer = Math.max(tank.burnTimer || 0, b.burnDuration || 0);
        tank.burnTickTimer = 1;
        tank.burnDamage = Math.max(tank.burnDamage || 0, b.burnDamage || 0);
    });
    createParticles(b.x, b.y, 25, '#ff6600', 2);
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

function checkCollisions() {
    for(let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        let hitCount = 0;
        let forceRemove = false;
        let maxHits = b.maxTargetHits || (b.type === 'mg' ? CONFIG.mgPenetration : 1);
        
        const nearbyTanks = getNearbyTanks(b.x, b.y, CONFIG.tankSize * 2);
        const potentialTargets = nearbyTanks.filter(t => {
            if(!t || t.dead) return false;
            if(t.team === b.team) return !!b.ricocheted;
            return t.invincible <= 0;
        });
        
        for(let tank of potentialTargets) {
            if(hitCount >= maxHits) break;
            if(b.hitTanks && b.hitTanks.has(tank.id)) continue;
            const dist = Math.hypot(b.x - tank.x, b.y - tank.y);
            if(dist < CONFIG.tankSize) {
                // XYZ 三轴同时重叠才命中；XY 擦过但高度不符时继续飞行。
                if(!projectileMatchesTargetHeight(b, tank)) continue;
                if(b.ricocheted && tank.team === b.team) {
                    tank.ricochetSpeedBoost = CONFIG.ricochetFriendlySpeedBoost;
                    tank.ricochetSpeedBoostTimer = CONFIG.ricochetFriendlyBoostDuration;
                    createParticles(tank.x, tank.y, 14, '#64f5c8', 1.35);
                    if(tank === player && typeof showMessage === 'function') showMessage('↗ 友军误射激励：速度 +10%（5秒）', '#64f5c8');
                    if(typeof playWorldSound === 'function') playWorldSound('capture', tank.x, tank.y, tank === player ? 0.72 : 0.45);
                    hitCount++;
                    if(b.hitTanks) b.hitTanks.add(tank.id);
                    continue;
                }
                if(['shell', 'aa', 'rocket'].includes(b.type) && tank.apsCharges > 0 && tank.apsCooldown <= 0) {
                    tank.apsCharges--;
                    tank.apsCooldown = CONFIG.apsCooldown;
                    createParticles(b.x, b.y, 12, '#00d4ff', 1);
                    hitCount = maxHits;
                    forceRemove = true;
                    break;
                }
                let actualArmor = tank.armor * (1 + (tank.armorBoost || 0)) + (tank.mapArmorBonus || 0);
                if(tank.fortressActive && tank.ultimateData) actualArmor = tank.armor * (tank.ultimateData.armorMult || 5.0);
                let damage = b.damage;
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
                if(!b.armorIgnore && (b.type === 'mg' || b.type === 'airmg')) damage = damage / Math.max(1, actualArmor * 0.5);
                else if(!b.armorIgnore) damage = damage / Math.max(0.25, actualArmor);
                if(tank.reflectActive && tank.fortressActive && b.owner) {
                    const reflectDmg = damage * (tank.ultimateData.reflectDamage || 0.3);
                    applyDirectDamage(b.owner, reflectDmg, tank, '反射伤害'); showDamageNumber(b.owner.x, b.owner.y - 30, Math.floor(reflectDmg));
                    createParticles(b.owner.x, b.owner.y, 5, '#ff0000', 1);
                }
                if(tank.shieldProtected && tank.shieldOwner && !tank.shieldOwner.dead) {
                    const redirect = tank.shieldOwner.ultimateData.damageRedirect || 0.4;
                    const redirectDamage = damage * redirect;
                    applyDirectDamage(tank, damage - redirectDamage, b.owner, getWeaponCause(b.type), b);
                    applyDirectDamage(tank.shieldOwner, redirectDamage, b.owner, getWeaponCause(b.type), b);
                } else applyDirectDamage(tank, damage, b.owner, getWeaponCause(b.type), b);
                if(b.toxinData && Math.random() < (b.toxinData.chance || 1)) {
                    tank.toxinDebuffTimer = Math.max(tank.toxinDebuffTimer || 0, b.toxinData.duration || 0);
                    tank.toxinTickTimer = b.toxinData.interval || 1;
                    tank.toxinDamage = Math.max(tank.toxinDamage || 0, b.toxinData.damage || 0);
                    tank.toxinSlow = Math.max(tank.toxinSlow || 0, b.toxinData.slow || 0);
                }
                if(b.explosionRadius > 0) {
                    getNearbyTanks(b.x, b.y, b.explosionRadius).forEach(other => {
                        if(other === tank || other.dead || other.team === b.team) return;
                        const distance = Math.hypot(other.x - b.x, other.y - b.y);
                        if(distance > b.explosionRadius) return;
                        const splash = b.damage * 0.5 * Math.max(0.25, 1 - distance / b.explosionRadius);
                        const splashArmor = Math.max(0.25, other.armor * (1 + (other.armorBoost || 0)) + (other.mapArmorBonus || 0));
                        applyDirectDamage(other, splash / splashArmor, b.owner, `${getWeaponCause(b.type) || '爆炸'}溅射`, b);
                    });
                }
                createParticles(b.x, b.y, 5, '#ff4400', 1);
                showDamageNumber(tank.x, tank.y - 30, Math.floor(damage));
                if(typeof playWorldSound === 'function') playWorldSound('hit', tank.x, tank.y, tank === player ? 1 : 0.7);
                hitCount++;
                if(b.hitTanks) b.hitTanks.add(tank.id);
            }
        }
        if(hitCount > 0 && (forceRemove || !b.hitTanks || b.hitTanks.size >= maxHits)) bullets.splice(i, 1);
    }
    
    for(let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        let hitBase = false;
        [bases.blue, bases.red].forEach(base => {
            if(hitBase) return;
            if(b.type === 'aa' || b.type === 'airmg' || b.type === 'bomb') return;
            if(b.x > base.x && b.x < base.x + base.w && b.y > base.y && b.y < base.y + base.h) {
                const baseZ = base.z || 0;
                if((b.z || 0) < baseZ || (b.z || 0) > baseZ + 78) return;
                if(base.team !== b.team) {
                    const wasAlive = base.hp > 0;
                    base.hp -= b.damage;
                    if(wasAlive && base.hp <= 0) recordBaseDestroy(b.team);
                    createParticles(b.x, b.y, 8, '#ff6600', 1.2); hitBase = true;
                }
            }
        });
        if(hitBase) bullets.splice(i, 1);
    }
}

function lineOfSight(x1, y1, x2, y2, factoryFloor = null) {
    const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 80);
    for(let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = x1 + (x2 - x1) * t;
        const cy = y1 + (y2 - y1) * t;
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
    const baseZ = typeof currentMap !== 'undefined' && currentMap === 'factory' && Number.isInteger(obs.factoryFloor) && typeof getFactoryFloorZ === 'function' ? getFactoryFloorZ(obs.factoryFloor) : 0;
    if(obs.type === 'factoryPlatform') return (obs.platformHeight || 120) + 18;
    if(obs.type === 'oilBarrel') return baseZ + 58;
    if(obs.type === 'factoryBoundary') return baseZ + 150;
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
            const nextZ = Math.max(CONFIG.helicopterMinAltitude, Math.min(CONFIG.helicopterMaxAltitude,
                (tank.z || CONFIG.helicopterAltitude) + lift * CONFIG.helicopterClimbSpeed * dt));
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
    for(let obs of obstacles) {
        if(currentMap === 'factory' && typeof factoryObstacleMatchesFloor === 'function') {
            const floor = tank ? getFactoryEntityFloor(tank) : getFactoryViewFloor();
            if(!factoryObstacleMatchesFloor(obs, floor)) continue;
        }
        if(obs.type === 'factoryPlatform') continue;
        const closestX = Math.max(obs.x, Math.min(x, obs.x + obs.w));
        const closestY = Math.max(obs.y, Math.min(y, obs.y + obs.h));
        const dist = Math.hypot(x - closestX, y - closestY);
        if(dist < radius) return true;
    }
    return false;
}

function resolveTankCollisions() {
    const allTanks = [player, ...allies, ...enemies].filter(t => t && !t.dead);
    
    for(let tank of allTanks) {
        const nearby = getNearbyTanks(tank.x, tank.y, CONFIG.aiTankMinDistance * 2);
        for(let other of nearby) {
            if(other === tank || other.dead) continue;
            // 幽灵坦克不参与物理碰撞
            if(tank.ghostActive || other.ghostActive) continue;
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
    let prevOwners = {}; outposts.forEach(op => prevOwners[op.name] = op.owner);
    const allTanks = [player, ...allies, ...enemies].filter(t => t && !t.dead);
    outposts.forEach(op => {
        let blueIn = false, redIn = false;
        allTanks.forEach(t => {
            if(currentMap === 'factory' && Number.isInteger(op.factoryFloor) && typeof getFactoryEntityFloor === 'function' && getFactoryEntityFloor(t) !== op.factoryFloor) return;
            const dist = Math.hypot(t.x - op.x, t.y - op.y);
            if(dist < op.radius) { if(t.team === 'blue') blueIn = true; else redIn = true; }
        });
        if(blueIn && !redIn) {
            if(op.capturingTeam !== 'blue') { op.capturingTeam = 'blue'; op.captureProgress = 0; }
            op.captureProgress += dt;
        } else if(redIn && !blueIn) {
            if(op.capturingTeam !== 'red') { op.capturingTeam = 'red'; op.captureProgress = 0; }
            op.captureProgress += dt;
        } else op.captureProgress = Math.max(0, op.captureProgress - dt * 0.5);
        if(op.captureProgress >= CONFIG.outpostCaptureTime) {
            const oldOwner = op.owner;
            if(oldOwner !== op.capturingTeam) {
                recordOutpostCapture(op.capturingTeam);
                if(typeof awardOutpostScore === 'function') awardOutpostScore(op.capturingTeam, op.name);
            }
            op.owner = op.capturingTeam;
            op.captureProgress = 0;
            if(oldOwner !== op.owner) {
                createParticles(op.x, op.y, 30, op.owner === 'blue' ? '#4488ff' : '#ff4444', 2.5);
                if(typeof playWorldSound === 'function') playWorldSound('capture', op.x, op.y, 1);
                updateOutpostInfo();
            }
        }
    });
}

function updateOutpostSpawns(dt) {
    outposts.forEach(op => {
        if(!op.owner) return;
        outpostSpawnTimers[op.name] -= dt;
        if(outpostSpawnTimers[op.name] <= 0) {
            outpostSpawnTimers[op.name] = CONFIG.outpostSpawnInterval;
            spawnOutpostTank(op);
        }
    });
}

function spawnOutpostTank(outpost) {
    const team = outpost.owner;
    const teamCount = team === 'blue' ? allies.filter(t => !t.dead).length : enemies.filter(t => !t.dead).length;
    if(teamCount >= 30) return;
    const types = Object.keys(TANKS).filter(type => !TANKS[type].isHidden);
    const type = types[Math.floor(Math.random() * types.length)];
    const data = TANKS[type];
    const angle = Math.random() * Math.PI * 2;
    const dist = outpost.radius + 40;
    const x = Math.max(100, Math.min(CONFIG.mapWidth - 100, outpost.x + Math.cos(angle) * dist));
    const y = Math.max(100, Math.min(CONFIG.mapHeight - 100, outpost.y + Math.sin(angle) * dist));
    const tank = createTank(data, x, y, team, false);
    if(currentMap === 'factory' && Number.isInteger(outpost.factoryFloor) && typeof getFactoryFloorZ === 'function') {
        tank.factoryFloor = outpost.factoryFloor;
        tank.z = getFactoryFloorZ(outpost.factoryFloor);
    }
    tank.shells = Math.floor(data.maxShells * 0.5);
    tank.mg = Math.floor(data.maxMG * 0.5);
    tank.aa = Math.floor((data.maxAA ?? 15) * 0.45);
    tank.apsCharges = CONFIG.apsCharges;
    if(team === 'blue') {
        tank.aiSkillLevel = gameConfig.difficulty === 'hard' ? 1.0 : 0.78;
        allies.push(tank);
    } else {
        tank.aiSkillLevel = gameConfig.difficulty === 'easy' ? 0.9 : gameConfig.difficulty === 'hard' ? 1.65 : 1.35;
        tank.aiDamageMult = gameConfig.difficulty === 'easy' ? 1.03 : gameConfig.difficulty === 'hard' ? 1.16 : 1.10;
        enemies.push(tank);
    }
    aiTanks.push(tank);
}
