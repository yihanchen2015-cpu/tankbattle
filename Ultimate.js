// ==================== 大招系统 ====================
function activateUltimate() {
    if(!player || player.dead || player.ultimateCooldown > 0 || player.ultimateActive) return;
    const ult = player.ultimateData;
    if(!ult) return;
    recordUltimate();
    player.ultimateActive = true;
    player.ultimateTimer = ult.duration || 0;
    player.ultimateCooldown = ult.cooldown;
    
    if(player.tankType === 'zuoyan29') {
        player.speedBoost = ult.speedBoost;
        player.turnBoost = ult.turnBoost;
    } else if(player.tankType === 'zuoyan30') {
        player.ghostActive = true; player.ghostTimer = ult.duration; player.speedBoost = ult.ghostSpeedBoost || 0.5; player.ultimateTimer = ult.duration;
    } else if(player.tankType === 'zuoyan1') {
        player.speedBoost = ult.speedBoost; player.turnBoost = ult.turnBoost; player.ultimateTimer = ult.duration;
    } else if(player.tankType === 'xingchen27a') {
        player.shieldActive = true; player.shieldHp = ult.shieldHp; player.armorBoost = ult.armorBoost;
    } else if(player.tankType === 'xingchen27b') {
        player.fortressActive = true; player.fortressTimer = ult.duration;
        player.armorBoost = ult.armorMult - 1; player.canMove = false; player.reflectActive = true;
        player.ultimateTimer = ult.duration;
    } else if(player.tankType === 'xingchen27s') {
        const teleportAngle = player.turretAngle;
        let tx = player.x + Math.cos(teleportAngle) * ult.teleportDist;
        let ty = player.y + Math.sin(teleportAngle) * ult.teleportDist;
        tx = Math.max(CONFIG.tankSize * 2, Math.min(CONFIG.mapWidth - CONFIG.tankSize * 2, tx));
        ty = Math.max(CONFIG.tankSize * 2, Math.min(CONFIG.mapHeight - CONFIG.tankSize * 2, ty));
        if(checkObstacleCollision(tx, ty, CONFIG.tankSize)) {
            let found = false;
            for(let r = 20; r <= 500; r += 20) {
                for(let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
                    const testX = tx + Math.cos(a) * r;
                    const testY = ty + Math.sin(a) * r;
                    const clampedX = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapWidth - CONFIG.tankSize, testX));
                    const clampedY = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapHeight - CONFIG.tankSize, testY));
                    if(!checkObstacleCollision(clampedX, clampedY, CONFIG.tankSize)) {
                        tx = clampedX; ty = clampedY; found = true; break;
                    }
                }
                if(found) break;
            }
            if(!found) { tx = player.x; ty = player.y; }
        }
        player.x = tx; player.y = ty;
        player.shieldActive = true; player.shieldHp = ult.shieldHp; player.ultimateTimer = ult.shieldDuration;
        createParticles(player.x, player.y, 20, '#66cc66', 1.5);
        const allTanks = [player, ...allies, ...enemies].filter(t => !t.dead && t !== player);
        allTanks.forEach(t => {
            if(t.ghostActive && Math.hypot(t.x - player.x, t.y - player.y) < ult.shieldRadius) {
                t.ghostRevealed = true; t.ghostTimer = 0;
                createParticles(t.x, t.y, 10, '#ff0000', 1);
            }
        });
    } else if(player.tankType === 'duoduo') {
        player.ultimateCharging = true; player.ultimateChargeTimer = ult.chargeTime; player.canMove = false;
    } else if(player.tankType === 'duoduo_ifv') {
        player.stormActive = true; player.stormTimer = ult.duration;
        player.stormOriginalMgCooldown = CONFIG.mgCooldown;
        player.canMove = false; player.ultimateTimer = ult.duration;
    } else if(player.tankType === 'duoduo_spat') {
        player.nailLocking = true; player.nailLockTimer = ult.lockTime; player.canMove = false;
        const enemyList = player.team === 'blue' ? enemies.filter(e => !e.dead) : [...allies.filter(a => !a.dead)];
        let nearest = null, minDist = Infinity;
        enemyList.forEach(e => { const d = Math.hypot(e.x - player.x, e.y - player.y); if(d < minDist) { minDist = d; nearest = e; } });
        player.nailTarget = nearest;
        if(nearest) player.nailLaserAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
    } else if(player.tankType === 'duoduo_emp') {
        player.ultimateActive = true;
        player.ultimateTimer = ult.duration;
        player.ultimateCooldown = ult.cooldown;
        const enemyList = player.team === 'blue' ? enemies.filter(e => !e.dead) : [...allies.filter(a => !a.dead)];
        enemyList.forEach(e => {
            const dist = Math.hypot(e.x - player.x, e.y - player.y);
            if(dist < ult.radius) {
                e.minimapJammed = true;
                e.minimapJamTimer = ult.jamDuration;
                createParticles(e.x, e.y, 8, '#ff4400', 1);
            }
        });
        createParticles(player.x, player.y, 20, '#ff8800', 2);
    } else if(player.tankType === 'zuoyan31') {
        player.ultimateActive = true;
        player.ultimateTimer = ult.duration;
        player.ultimateCooldown = ult.cooldown;
        // 释放蜂群无人机
        for(let i = 0; i < ult.droneCount; i++) {
            const angle = player.turretAngle + (i - 1) * 0.5;
            bullets.push({
                x: player.x + Math.cos(angle) * 30,
                y: player.y + Math.sin(angle) * 30,
                vx: Math.cos(angle) * ult.droneSpeed,
                vy: Math.sin(angle) * ult.droneSpeed,
                damage: ult.droneDamage, team: player.team, type: 'drone', owner: player,
                life: ult.droneLife, hitTanks: new Set(), isDrone: true, trackRange: ult.trackRange
            });
        }
        createParticles(player.x, player.y, 15, '#5599ff', 2);
        player.ultimateActive = false;
    } else if(player.tankType === 'zuoyan32') {
        player.ultimateActive = true;
        player.ultimateTimer = ult.duration;
        player.ultimateCooldown = ult.cooldown;
        // 生成全息幻象
        for(let i = 0; i < ult.cloneCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 50 + Math.random() * 50;
            const clone = createTank(TANKS['zuoyan32'], player.x + Math.cos(angle) * dist, player.y + Math.sin(angle) * dist, player.team, false);
            clone.hp = ult.cloneHp;
            clone.maxHp = ult.cloneHp;
            clone.isClone = true;
            clone.cloneOwner = player;
            clone.cloneTimer = ult.duration;
            if(player.team === 'blue') allies.push(clone);
            else enemies.push(clone);
            aiTanks.push(clone);
        }
        createParticles(player.x, player.y, 20, '#77bbff', 2);
    } else if(player.tankType === 'zuoyan33') {
        player.ultimateActive = true;
        player.ultimateTimer = ult.duration;
        player.ultimateCooldown = ult.cooldown;
        player.toxinActive = true;
        player.toxinTimer = ult.duration;
        createParticles(player.x, player.y, 15, '#44dd88', 2);
    } else if(player.tankType === 'xingchen27c') {
        player.ultimateActive = true;
        player.ultimateTimer = ult.duration;
        player.ultimateCooldown = ult.cooldown;
        player.revealActive = true;
        player.revealTimer = ult.duration;
        // 强制范围内隐身单位现身
        const allTanks = [player, ...allies, ...enemies].filter(t => !t.dead);
        allTanks.forEach(t => {
            if(t.team !== player.team && t.ghostActive) {
                t.ghostRevealed = true;
                t.ghostTimer = 0;
                createParticles(t.x, t.y, 10, '#ff0000', 1);
            }
        });
        createParticles(player.x, player.y, 20, '#33aa33', 2);
    } else if(player.tankType === 'xingchen27d') {
        player.ultimateActive = true;
        player.ultimateTimer = ult.duration;
        player.ultimateCooldown = ult.cooldown;
        player.linkActive = true;
        player.linkTimer = ult.duration;
        // 找到最近友方建立链接
        const allyList = player.team === 'blue' ? allies.filter(a => !a.dead) : enemies.filter(e => !e.dead);
        let nearestAlly = null, minDist = Infinity;
        allyList.forEach(a => {
            const d = Math.hypot(a.x - player.x, a.y - player.y);
            if(d < minDist && d < ult.linkRadius && a !== player) {
                minDist = d; nearestAlly = a;
            }
        });
        player.linkedAlly = nearestAlly;
        if(nearestAlly) {
            nearestAlly.linkedTo = player;
            nearestAlly.damageReduction = ult.damageReduction;
            createParticles(player.x, player.y, 10, '#55bb55', 1.5);
            createParticles(nearestAlly.x, nearestAlly.y, 10, '#55bb55', 1.5);
        }
    } else if(player.tankType === 'xingchen27e') {
        player.ultimateActive = true;
        player.ultimateTimer = ult.duration;
        player.ultimateCooldown = ult.cooldown;
        player.judgeActive = true;
        player.judgeTimer = ult.duration;
        // 标记最近敌方
        const enemyList = player.team === 'blue' ? enemies.filter(e => !e.dead) : [...allies.filter(a => !a.dead), ...(player && !player.dead ? [player] : [])];
        let nearest = null, minDist = Infinity;
        enemyList.forEach(e => {
            const d = Math.hypot(e.x - player.x, e.y - player.y);
            if(d < minDist) { minDist = d; nearest = e; }
        });
        player.judgeTarget = nearest;
        if(nearest) {
            nearest.judged = true;
            nearest.judgeOwner = player;
            createParticles(nearest.x, nearest.y, 15, '#ff0000', 1.5);
        }
        createParticles(player.x, player.y, 15, '#66cc44', 2);
    } else if(player.tankType === 'duoduo_eng') {
        player.ultimateActive = true;
        player.ultimateTimer = ult.duration;
        player.ultimateCooldown = ult.cooldown;
        // 部署自动炮塔
        const turretAngle = player.turretAngle;
        const turretX = player.x + Math.cos(turretAngle) * 60;
        const turretY = player.y + Math.sin(turretAngle) * 60;
        mapElements.push({
            type: 'turret', x: turretX, y: turretY, angle: turretAngle,
            hp: ult.turretHp, maxHp: ult.turretHp, armor: ult.turretArmor,
            range: ult.turretRange, damage: ult.turretDamage,
            team: player.team, owner: player, duration: ult.duration,
            fireCooldown: 0, fireRate: 1.5
        });
        createParticles(turretX, turretY, 20, '#dd8833', 2);
    } else if(player.tankType === 'duoduo_rocket') {
        player.ultimateActive = true;
        player.ultimateTimer = ult.duration;
        player.ultimateCooldown = ult.cooldown;
        // 火箭弹幕轰炸
        const targetAngle = player.turretAngle;
        for(let i = 0; i < ult.shellCount; i++) {
            const spreadAngle = targetAngle + (Math.random() - 0.5) * 0.8;
            const dist = 200 + Math.random() * 400;
            const targetX = player.x + Math.cos(spreadAngle) * dist;
            const targetY = player.y + Math.sin(spreadAngle) * dist;
            bullets.push({
                x: player.x + Math.cos(targetAngle) * 30,
                y: player.y + Math.sin(targetAngle) * 30,
                vx: Math.cos(targetAngle) * 12, vy: Math.sin(targetAngle) * 12,
                damage: ult.shellDamage, team: player.team, type: 'rocket', owner: player,
                life: 3.0, hitTanks: new Set(), targetX, targetY, isRocket: true,
                burnDuration: ult.burnDuration, burnDamage: ult.burnDamage
            });
        }
        createParticles(player.x, player.y, 25, '#cc5522', 2.5);
        player.ultimateActive = false;
    } else if(player.tankType === 'zuoyan_x') {
        const friendlyTanks = [player, ...allies].filter(t => t && !t.dead);
        friendlyTanks.forEach(ally => {
            if(Math.hypot(ally.x - player.x, ally.y - player.y) <= ult.radius) {
                ally.fireRateBuff = ult.fireRateBoost;
                ally.speedBuffFromCommander = ult.speedBoost;
                ally.commanderBuffOwner = player;
            }
        });
        createParticles(player.x, player.y, 25, '#8866ff', 2);
    } else if(player.tankType === 'niuniu_heli') {
        const targetX = mouse.x + camera.x;
        const targetY = mouse.y + camera.y;
        for(let i = 0; i < ult.bombCount; i++) {
            const tx = targetX + (Math.random() - 0.5) * ult.bombRadius * 2;
            const ty = targetY + (Math.random() - 0.5) * ult.bombRadius * 2;
            bullets.push({
                x: tx, y: ty - 500 - i * 30, vx: 0, vy: 10,
                damage: ult.bombDamage, team: player.team, type: 'rocket', owner: player,
                life: 2, hitTanks: new Set(), targetX: tx, targetY: ty, isRocket: true,
                burnDuration: 0, burnDamage: 0
            });
        }
        createParticles(targetX, targetY, 20, '#44ddff', 2);
        player.ultimateActive = false;
    } else if(player.tankType === 'kimi_tank') {
        player.hp = Math.max(1, player.hp - (ult.hpCost || 0));
        const disguise = TANKS[ult.disguiseAs] || TANKS.zuoyan29;
        for(let i = 0; i < ult.cloneCount; i++) {
            const angle = Math.PI * 2 * i / ult.cloneCount;
            const clone = createTank(disguise, player.x + Math.cos(angle) * 70, player.y + Math.sin(angle) * 70, player.team, false);
            clone.hp = ult.cloneHp; clone.maxHp = ult.cloneHp;
            clone.isClone = true; clone.cloneOwner = player; clone.cloneTimer = ult.duration;
            allies.push(clone); aiTanks.push(clone);
        }
        createParticles(player.x, player.y, 25, '#ce93d8', 2);
        player.ultimateActive = false;
    }
    updateUltimateUI();
}

function fireNailShot(tank) {
    const ult = tank.ultimateData; if(!ult) return;
    const angle = tank.nailLaserAngle || tank.turretAngle;
    const startX = tank.x + Math.cos(angle) * (tank.turretSize + 20);
    const startY = tank.y + Math.sin(angle) * (tank.turretSize + 20);
    const endX = tank.x + Math.cos(angle) * ult.range;
    const endY = tank.y + Math.sin(angle) * ult.range;
    const allTanks = [player, ...allies, ...enemies].filter(t => !t.dead && t !== tank && t.team !== tank.team);
    let hitTanks = [];
    allTanks.forEach(t => {
        const dist = pointToLineDistance(t.x, t.y, startX, startY, endX, endY);
        if(dist < CONFIG.tankSize + 10) hitTanks.push({tank: t, dist: Math.hypot(t.x - startX, t.y - startY)});
    });
    hitTanks.sort((a, b) => a.dist - b.dist);
    hitTanks.forEach((hit, index) => {
        let damage = ult.damageFirst * Math.pow(ult.damageDecay || 0.6, index);
        if(!ult.armorIgnore) damage = damage / hit.tank.armor;
        if(hit.tank.reflectActive && hit.tank.fortressActive && hit.tank.ultimateData) {
            const reflectDmg = damage * (hit.tank.ultimateData.reflectDamage || 0.3);
            applyDirectDamage(tank, reflectDmg, hit.tank); showDamageNumber(tank.x, tank.y - 30, Math.floor(reflectDmg));
            createParticles(tank.x, tank.y, 5, '#ff0000', 1);
        }
        applyDirectDamage(hit.tank, damage, tank); createParticles(hit.tank.x, hit.tank.y, 10, '#ff8800', 1.5);
        showDamageNumber(hit.tank.x, hit.tank.y - 30, Math.floor(damage));
    });
    createNailLaserEffect(startX, startY, endX, endY);
    createParticles(startX, startY, 25, '#ff4400', 2);
}

function pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
    const dot = A * C + B * D, lenSq = C * C + D * D;
    let param = -1; if(lenSq !== 0) param = dot / lenSq;
    let xx, yy; if(param < 0) { xx = x1; yy = y1; } else if(param > 1) { xx = x2; yy = y2; } else { xx = x1 + param * C; yy = y1 + param * D; }
    return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2);
}

function createNailLaserEffect(x1, y1, x2, y2) {
    for(let i = 0; i < 10; i++) { const t = i / 10; createParticles(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, 2, '#ff0000', 0.5); }
}

function endUltimate(tank) {
    tank.ultimateActive = false;
    tank.speedBoost = 0; tank.turnBoost = 0;
    tank.shieldActive = false; tank.shieldHp = 0; tank.armorBoost = 0;
    tank.ghostActive = false; tank.ghostTimer = 0; tank.ghostRevealed = false;
    tank.fortressActive = false; tank.fortressTimer = 0; tank.reflectActive = false;
    tank.stormActive = false; tank.stormTimer = 0;
    tank.nailLocking = false; tank.nailLockTimer = 0; tank.nailTarget = null;
    tank.canMove = true;
    const allTanks = [player, ...allies, ...enemies].filter(t => t && !t.dead);
    allTanks.forEach(t => {
        if(t.commanderBuffOwner === tank) {
            t.fireRateBuff = 0;
            t.speedBuffFromCommander = 0;
            t.commanderBuffOwner = null;
        }
    });
    // 新坦克状态清理
    tank.toxinActive = false; tank.toxinTimer = 0;
    tank.revealActive = false; tank.revealTimer = 0;
    tank.linkActive = false; tank.linkTimer = 0;
    if(tank.linkedAlly) { tank.linkedAlly.linkedTo = null; tank.linkedAlly.damageReduction = 0; }
    tank.linkedAlly = null;
    tank.judgeActive = false; tank.judgeTimer = 0;
    if(tank.judgeTarget) { tank.judgeTarget.judged = false; tank.judgeTarget.judgeOwner = null; }
    tank.judgeTarget = null;
    tank.minimapJammed = false; tank.minimapJamTimer = 0;

    aiTanks.forEach(t => {
        if(t.shieldOwner === tank) { t.shieldProtected = false; t.shieldOwner = null; }
    });
}


// ==================== 粒子 / 尾迹 / 伤害数字 ====================
const MAX_PARTICLES = 150;
const MAX_EXHAUST_TRAILS = 150;
const MAX_DAMAGE_NUMBERS = 30;

function createParticles(x, y, count, color, life) {
    const roomLeft = MAX_PARTICLES - particles.length;
    const actualCount = Math.min(count, Math.max(0, roomLeft));

    for(let i=0; i<actualCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 8;
        particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            life: life * (0.5 + Math.random() * 0.5), maxLife: life, color, size: 2 + Math.random() * 5 });
    }
}

function updateParticles(dt) {
    for(let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * 60 * dt; p.y += p.vy * 60 * dt;
        p.vx *= 0.97; p.vy *= 0.97; p.life -= dt;
        if(p.life <= 0) particles.splice(i, 1);
    }
    if(particles.length > MAX_PARTICLES) {
        particles.splice(0, particles.length - MAX_PARTICLES);
    }
}

function addExhaustTrail(tank) {
    const rearX = tank.x - Math.cos(tank.angle) * (CONFIG.tankSize * 0.8);
    const rearY = tank.y - Math.sin(tank.angle) * (CONFIG.tankSize * 0.8);
    exhaustTrails.push({
        x: rearX + (Math.random() - 0.5) * 8, y: rearY + (Math.random() - 0.5) * 8,
        vx: -Math.cos(tank.angle) * (2 + Math.random() * 3), vy: -Math.sin(tank.angle) * (2 + Math.random() * 3),
        life: 1.5, maxLife: 1.5, color: tank.exhaustColor, size: 3 + Math.random() * 4,
        isPlasma: gameConfig.dayNight === 'night'
    });
}

function updateExhaustTrails(dt) {
    for(let i = exhaustTrails.length - 1; i >= 0; i--) {
        const t = exhaustTrails[i];
        t.x += t.vx * 60 * dt; t.y += t.vy * 60 * dt; t.life -= dt; t.size *= 0.98;
        if(t.life <= 0) exhaustTrails.splice(i, 1);
    }
    if(exhaustTrails.length > MAX_EXHAUST_TRAILS) {
        exhaustTrails.splice(0, exhaustTrails.length - MAX_EXHAUST_TRAILS);
    }
}

function updateTrailEffects(dt) {
    for(let i = trailEffects.length - 1; i >= 0; i--) {
        const t = trailEffects[i];
        t.life -= dt;
        if(t.life <= 0) trailEffects.splice(i, 1);
    }
}

function showDamageNumber(x, y, damage) {
    damageNumbers.push({ x, y, text: `-${damage}`, life: 1.0, maxLife: 1.0, vy: -40 });
}

function updateDamageNumbers(dt) {
    for(let i = damageNumbers.length - 1; i >= 0; i--) {
        const dn = damageNumbers[i];
        dn.y += dn.vy * dt; dn.life -= dt;
        if(dn.life <= 0) damageNumbers.splice(i, 1);
    }
    if(damageNumbers.length > MAX_DAMAGE_NUMBERS) {
        damageNumbers.splice(0, damageNumbers.length - MAX_DAMAGE_NUMBERS);
    }
}

function updateMapElements(dt) {
    const allTanks = [player, ...allies, ...enemies].filter(t => t && !t.dead);

    mapElements.forEach(el => {
        if(el.type === 'mine' && el.armed) {
            el.blinkTimer -= dt;
            if(el.blinkTimer <= 0) el.blinkTimer = 2;
            for(let tank of allTanks) {
                const dist = Math.hypot(tank.x - el.x, tank.y - el.y);
                if(dist < el.triggerRadius) {
                    applyDirectDamage(tank, el.damage, null);
                    createParticles(el.x, el.y, 20, '#ff4400', 1.5);
                    createParticles(el.x, el.y, 10, '#ff8800', 1);
                    showDamageNumber(el.x, el.y - 20, el.damage);
                    el.armed = false;
                    el.respawnTimer = 30;
                    break;
                }
            }
        } else if(el.type === 'mine' && !el.armed) {
            el.respawnTimer -= dt;
            if(el.respawnTimer <= 0) {
                el.armed = true;
                el.blinkTimer = Math.random() * 2;
            }
        } else if(el.type === 'turret') {
            el.duration -= dt;
            el.fireCooldown -= dt;
            const targets = el.team === 'blue' ? enemies : [player, ...allies];
            let nearest = null, nearestDist = el.range;
            targets.forEach(tank => {
                if(!tank || tank.dead || tank.team === el.team) return;
                const distance = Math.hypot(tank.x - el.x, tank.y - el.y);
                if(distance < nearestDist && lineOfSight(el.x, el.y, tank.x, tank.y)) {
                    nearest = tank; nearestDist = distance;
                }
            });
            if(nearest) {
                el.angle = Math.atan2(nearest.y - el.y, nearest.x - el.x);
                if(el.fireCooldown <= 0) {
                    bullets.push({
                        x: el.x, y: el.y, vx: Math.cos(el.angle) * CONFIG.bulletSpeed,
                        vy: Math.sin(el.angle) * CONFIG.bulletSpeed, damage: el.damage,
                        team: el.team, type: 'shell', owner: el.owner, life: 2, hitTanks: new Set()
                    });
                    el.fireCooldown = el.fireRate;
                }
            }
        } else if(el.type === 'boost') {
            for(let tank of allTanks) {
                const dx = tank.x - el.x;
                const dy = tank.y - el.y;
                const cos = Math.cos(-el.angle);
                const sin = Math.sin(-el.angle);
                const localX = dx * cos - dy * sin;
                const localY = dx * sin + dy * cos;
                if(Math.abs(localX) < el.width/2 + CONFIG.tankSize && 
                   Math.abs(localY) < el.height/2 + CONFIG.tankSize) {
                    tank.mapSpeedBoost = Math.max(tank.mapSpeedBoost || 0, el.speedMult - 1);
                    tank.mapBoostTimer = el.duration;
                    createParticles(tank.x, tank.y, 3, '#00aaff', 0.5);
                }
            }
        }
    });
    mapElements = mapElements.filter(el => el.type !== 'turret' || el.duration > 0);

    allTanks.forEach(tank => {
        if(tank.mapBoostTimer > 0) {
            tank.mapBoostTimer -= dt;
            if(tank.mapBoostTimer <= 0) {
                tank.mapBoostTimer = 0;
                tank.mapSpeedBoost = 0;
            }
        }
    });
}


// ==================== 渲染 ====================
function render() {
    if(!player) {
        console.log('[RENDER] Player is null/undefined, skipping render');
        return;
    }
    if(typeof player.x !== 'number' || typeof player.y !== 'number') {
        console.log('[RENDER] Player position type invalid:', typeof player.x, typeof player.y, 'values:', player.x, player.y);
        return;
    }
    if(isNaN(player.x) || isNaN(player.y)) {
        console.log('[RENDER] Player position is NaN! x:', player.x, 'y:', player.y, 'angle:', player.angle, 'speed:', player.speed);
        console.log('[RENDER] Player tankType:', player.tankType, 'dead:', player.dead, 'canMove:', player.canMove);
        return;
    }
    const zoom = camera.zoom || 1;
    const viewWidth = canvas.width / zoom;
    const viewHeight = canvas.height / zoom;
    const targetCamX = player.x - viewWidth / 2;
    const targetCamY = player.y - viewHeight / 2;
    camera.x += (targetCamX - camera.x) * CONFIG.cameraSmooth;
    camera.y += (targetCamY - camera.y) * CONFIG.cameraSmooth;
    camera.x = Math.max(0, Math.min(CONFIG.mapWidth - viewWidth, camera.x));
    camera.y = Math.max(0, Math.min(CONFIG.mapHeight - viewHeight, camera.y));
    
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(-camera.x, -camera.y);
    
    const template = MAP_TEMPLATES[currentMap] || MAP_TEMPLATES.classic;
    if(gameConfig.dayNight === 'night') ctx.fillStyle = '#080810';
    else ctx.fillStyle = template.groundColor || '#3d5c1e';
    ctx.fillRect(camera.x, camera.y, viewWidth, viewHeight);
    
    const gridSize = 200;
    const startGridX = Math.floor(camera.x / gridSize) * gridSize;
    const startGridY = Math.floor(camera.y / gridSize) * gridSize;
    ctx.strokeStyle = gameConfig.dayNight === 'night' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    for(let x = startGridX; x <= camera.x + viewWidth + gridSize; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, camera.y); ctx.lineTo(x, camera.y + viewHeight); ctx.stroke();
    }
    for(let y = startGridY; y <= camera.y + viewHeight + gridSize; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(camera.x, y); ctx.lineTo(camera.x + viewWidth, y); ctx.stroke();
    }
    
    ctx.strokeStyle = gameConfig.dayNight === 'night' ? 'rgba(255,50,50,0.5)' : 'rgba(200,50,50,0.6)';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, CONFIG.mapWidth, CONFIG.mapHeight);
    
    const viewLeft = camera.x - 150, viewRight = camera.x + viewWidth + 150;
    const viewTop = camera.y - 150, viewBottom = camera.y + viewHeight + 150;

    if(currentMap === 'city') drawCityRoads();
    drawTerrainZones();
    
    ctx.fillStyle = gameConfig.dayNight === 'night' ? '#151525' : '#5a4328';
    for(let obs of obstacles) {
        if(obs.x + obs.w < viewLeft || obs.x > viewRight || obs.y + obs.h < viewTop || obs.y > viewBottom) continue;
        if(obs.type === 'tree') drawTreeObstacle(obs);
        else if(obs.type === 'building') drawBuildingObstacle(obs);
        else {
            ctx.fillStyle = obs.type === 'ice' ? '#9db7c4' : (obs.type === 'rock' ? '#8a633a' : (gameConfig.dayNight === 'night' ? '#151525' : '#5a4328'));
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(obs.x + 4, obs.y + obs.h, obs.w, 4);
        ctx.fillRect(obs.x + obs.w, obs.y + 4, 4, obs.h);
        ctx.fillStyle = gameConfig.dayNight === 'night' ? '#151525' : '#5a4328';
    }
    
    drawBase(bases.blue);
    drawBase(bases.red);

    drawMapElements();
    
    outposts.forEach(op => {
        if(op.x + op.radius < viewLeft || op.x - op.radius > viewRight ||
           op.y + op.radius < viewTop || op.y - op.radius > viewBottom) return;
        drawOutpost(op);
    });
    
    drawTrailEffects();
    drawSnowTracks();
    drawExhaustTrails();
    
    const visibleTanks = getNearbyTanks(camera.x + viewWidth/2, camera.y + viewHeight/2,
        Math.max(viewWidth, viewHeight) / 2 + 200);
    visibleTanks.forEach(t => {
        if(t.dead) return;
        drawTank(t);
        if(isTankInWater(t)) drawTankWaterOverlay(t);
    });
    
    bullets.forEach(b => drawBullet(b));
    
    particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.life/p.maxLife), 0, Math.PI*2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
    
    drawDamageNumbers();
    
    if(gameConfig.dayNight === 'night') {
        const lightRadius = 500;
        const grad = ctx.createRadialGradient(player.x, player.y, 30, player.x, player.y, lightRadius);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.7, 'rgba(0,0,0,0.5)');
        grad.addColorStop(1, 'rgba(0,0,0,0.92)');
        ctx.fillStyle = grad;
        ctx.fillRect(camera.x, camera.y, viewWidth, viewHeight);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(camera.x, camera.y, viewWidth, viewHeight);
    }

    if(currentMap === 'desert' && environmentState.sandstormActive) {
        const visibility = player.isFlying ? 230 : 330;
        const sand = ctx.createRadialGradient(player.x, player.y, visibility * 0.25, player.x, player.y, visibility);
        sand.addColorStop(0, 'rgba(190,125,45,0.12)');
        sand.addColorStop(0.6, 'rgba(177,105,30,0.48)');
        sand.addColorStop(1, 'rgba(126,72,25,0.82)');
        ctx.fillStyle = sand;
        ctx.fillRect(camera.x, camera.y, viewWidth, viewHeight);
    }
    
    ctx.restore();
    renderGameModes();
    drawMinimap();
}
