// ==================== 子弹系统 ====================
function fireBullet(tank, type) {
    if (type === 'shell' && tank.shells <= 0 && !(tank.stormActive && tank.tankType === 'duoduo_ifv')) return;
    if (type === 'mg' && tank.mg <= 0 && !(tank.stormActive && tank.tankType === 'duoduo_ifv')) return;
    if (type === 'aa' && (tank.aa || 0) <= 0) return;
    if(tank.isPlayer) recordShot(type);
    tank.lastFiredWeapon = type;
    
    if(tank.ghostActive && tank.ultimateData && tank.ultimateData.revealOnFire) tank.ghostRevealed = true;
    let speedMult = 1, spreadMult = 1, damageMult = 1, infiniteAmmo = false;
    if(tank.stormActive && tank.tankType === 'duoduo_ifv') {
        speedMult = tank.ultimateData.mgRateMult || 3; spreadMult = tank.ultimateData.mgSpreadMult || 0.5;
        infiniteAmmo = tank.ultimateData.infiniteAmmo; damageMult = tank.ultimateData.damageBoost || 1.5;
    }
    const speed = type === 'shell' ? CONFIG.bulletSpeed : (type === 'aa' ? CONFIG.aaSpeed : CONFIG.mgSpeed * speedMult);
    const spread = type === 'mg' ? (Math.random() - 0.5) * 0.12 * spreadMult : (type === 'aa' ? (Math.random() - 0.5) * 0.08 : 0);
    const angle = tank.turretAngle + spread;
    const maxLife = type === 'shell' ? 3.0 : (type === 'aa' ? 2.5 : 1.2);
    bullets.push({
        x: tank.x + Math.cos(angle) * (tank.turretSize + 12),
        y: tank.y + Math.sin(angle) * (tank.turretSize + 12),
        z: (tank.z || 0) + (type === 'aa' ? 18 : 24),
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        vz: type === 'aa' ? CONFIG.aaVerticalSpeed : 0,
        damage: (type === 'shell' ? CONFIG.bulletDamage : (type === 'aa' ? CONFIG.aaDamage : CONFIG.mgDamage)) * damageMult * (tank.aiDamageMult || 1),
        team: tank.team, type, owner: tank,
        life: maxLife, maxLife, age: 0,
        altitude: (tank.z || 0) + (type === 'aa' ? 18 : 24),
        trackingRange: type === 'aa' ? CONFIG.aaTrackingRange : 0,
        trackingTarget: null,
        trackingLocked: false,
        ignoresObstacles: type === 'aa' || !!tank.isFlying,
        hitTanks: new Set(),
        armorIgnore: tank.tankType === 'duoduo_spat',
        explosionRadius: type === 'aa' ? CONFIG.aaExplosionRadius : 0,
        toxinData: tank.toxinActive && tank.ultimateData ? {
            duration: tank.ultimateData.duration,
            damage: tank.ultimateData.dotDamage,
            interval: tank.ultimateData.dotInterval,
            slow: tank.ultimateData.slowPercent,
            chance: tank.ultimateData.applyChance
        } : null
    });
    if(bullets.length > 500) bullets.splice(0, bullets.length - 500);
    if(type === 'shell' && !infiniteAmmo) tank.shells--;
    else if(type === 'mg' && !infiniteAmmo) tank.mg--;
    else if(type === 'aa' && !infiniteAmmo) tank.aa--;
    createParticles(tank.x + Math.cos(angle) * tank.turretSize, tank.y + Math.sin(angle) * tank.turretSize,
        type === 'shell' ? 5 : (type === 'aa' ? 4 : 2),
        type === 'shell' ? '#ffaa00' : (type === 'aa' ? '#ff44ff' : '#ffff88'),
        type === 'shell' ? 1.5 : (type === 'aa' ? 1.2 : 0.5));
    if(typeof playWorldSound === 'function') playWorldSound(type, tank.x, tank.y, tank.isPlayer ? 1 : 0.72);
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
            const desiredVz = Math.max(-120, Math.min(120, (targetZ - b.z) * 1.4));
            b.vz += (desiredVz - b.vz) * Math.min(1, dt * 1.4);
        }
        b.x += b.vx * 60 * dt; b.y += b.vy * 60 * dt; b.life -= dt;
        if(b.type === 'aa') {
            b.z += b.vz * dt;
            b.vz -= CONFIG.aaGravity * dt;
            b.altitude = b.z;
        }
        if(Math.random() < 0.4) createParticles(b.x, b.y, 1, b.type === 'shell' ? '#ff8800' : (b.type === 'aa' ? '#ff66ff' : '#ffff44'), 0.4);
        if(b.isRocket && (Math.hypot(b.x - b.targetX, b.y - b.targetY) < 35 || b.life <= 0)) {
            explodeRocket(b);
            bullets.splice(i, 1);
            continue;
        }
        if(b.life <= 0 || b.x < 0 || b.x > CONFIG.mapWidth || b.y < 0 || b.y > CONFIG.mapHeight) { bullets.splice(i, 1); continue; }
        if(b.ignoresObstacles) continue;
        for(let obs of obstacles) {
            if(b.x > obs.x && b.x < obs.x + obs.w && b.y > obs.y && b.y < obs.y + obs.h) {
                if(b.isRocket) explodeRocket(b);
                else createParticles(b.x, b.y, 6, '#777', 1);
                bullets.splice(i, 1); break;
            }
        }
    }
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
    }
    return remaining;
}

function getWeaponCause(type) {
    return ({ shell: '主炮', mg: '机枪', aa: '高射炮', rocket: '火箭' })[type] || null;
}

function explodeRocket(b) {
    const radius = 130;
    const targets = getNearbyTanks(b.x, b.y, radius);
    targets.forEach(tank => {
        if(tank.dead || tank.team === b.team) return;
        const distance = Math.hypot(tank.x - b.x, tank.y - b.y);
        if(distance > radius) return;
        const falloff = Math.max(0.35, 1 - distance / radius);
        const armor = Math.max(0.25, tank.armor * (1 + (tank.armorBoost || 0)));
        const dealt = applyDirectDamage(tank, b.damage * falloff / armor, b.owner, getWeaponCause(b.type), b);
        if(dealt > 0) showDamageNumber(tank.x, tank.y - 30, Math.floor(dealt));
        tank.burnTimer = Math.max(tank.burnTimer || 0, b.burnDuration || 0);
        tank.burnTickTimer = 1;
        tank.burnDamage = Math.max(tank.burnDamage || 0, b.burnDamage || 0);
    });
    createParticles(b.x, b.y, 25, '#ff6600', 2);
}


// ==================== 碰撞系统 ====================
function checkCollisions() {
    for(let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        let hitCount = 0;
        let maxHits = b.type === 'mg' ? CONFIG.mgPenetration : 1;
        
        const nearbyTanks = getNearbyTanks(b.x, b.y, CONFIG.tankSize * 2);
        const potentialTargets = nearbyTanks.filter(t => !t.dead && t.team !== b.team && t.invincible <= 0);
        
        for(let tank of potentialTargets) {
            if(hitCount >= maxHits) break;
            if(b.hitTanks && b.hitTanks.has(tank.id)) continue;
            const dist = Math.hypot(b.x - tank.x, b.y - tank.y);
            if(dist < CONFIG.tankSize) {
                // 机枪仰角不足；高射炮主要对空，但导引弹也能命中地面坦克。
                if(tank.isFlying && b.type === 'mg') continue;
                if(b.type === 'aa') {
                    const targetZ = (tank.z || 0) + (tank.isFlying ? 8 : 22);
                    if(Math.abs((b.z || 0) - targetZ) > CONFIG.aaHitHeightTolerance) continue;
                }
                if(['shell', 'aa', 'rocket'].includes(b.type) && tank.apsCharges > 0 && tank.apsCooldown <= 0) {
                    tank.apsCharges--;
                    tank.apsCooldown = CONFIG.apsCooldown;
                    createParticles(b.x, b.y, 12, '#00d4ff', 1);
                    hitCount = maxHits;
                    break;
                }
                let actualArmor = tank.armor * (1 + (tank.armorBoost || 0));
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
                if(!b.armorIgnore && b.type === 'mg') damage = damage / Math.max(1, actualArmor * 0.5);
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
                        const splashArmor = Math.max(0.25, other.armor * (1 + (other.armorBoost || 0)));
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
        if(hitCount > 0 && (b.type !== 'mg' || (b.hitTanks && b.hitTanks.size >= maxHits))) { bullets.splice(i, 1); }
    }
    
    for(let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        let hitBase = false;
        [bases.blue, bases.red].forEach(base => {
            if(hitBase) return;
            if(b.type === 'aa') return;
            if(b.x > base.x && b.x < base.x + base.w && b.y > base.y && b.y < base.y + base.h) {
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

function lineOfSight(x1, y1, x2, y2) {
    const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 80);
    for(let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = x1 + (x2 - x1) * t;
        const cy = y1 + (y2 - y1) * t;
        for(let obs of obstacles) {
            if(cx > obs.x && cx < obs.x + obs.w && cy > obs.y && cy < obs.y + obs.h) {
                return false;
            }
        }
    }
    return true;
}

function getObstacleWorldHeight(obs) {
    if(!obs) return 0;
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
    tank.shells = Math.floor(data.maxShells * 0.5);
    tank.mg = Math.floor(data.maxMG * 0.5);
    tank.aa = Math.floor((data.maxAA || 15) * 0.45);
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
