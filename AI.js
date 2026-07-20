// ==================== AI 系统 ====================
function updateAITank(tank, dt) {
    if(tank.dead) return;
    if(tank.invincible > 0) tank.invincible -= dt;
    
    if (tank.fireCooldown > 0) tank.fireCooldown -= dt;
    if (tank.mgCooldown > 0) tank.mgCooldown -= dt;
    if (tank.aaCooldown > 0) tank.aaCooldown -= dt;
    updateStatusEffects(tank, dt);
    if(tank.isFlying && typeof updateHelicopterFlight === 'function') updateHelicopterFlight(tank, dt);
    if(tank.dead) return;
    
    tank.pathTimer = (tank.pathTimer || 0) - dt;
    tank.aiStateTimer = (tank.aiStateTimer || 0) - dt;
    tank.pathRefreshTimer = (tank.pathRefreshTimer || 0) - dt;
    tank.aiDodgeTimer = (tank.aiDodgeTimer || 0) - dt;
    tank.aiBehaviorTimer = (tank.aiBehaviorTimer || 0) - dt;

    updateAutoAim(tank, dt);

    tank.prevPos.x = tank.x; tank.prevPos.y = tank.y;

    const movedDist = Math.hypot(tank.x - tank.lastPos.x, tank.y - tank.lastPos.y);
    if(movedDist < 1) tank.stuckTimer = (tank.stuckTimer || 0) + dt;
    else tank.stuckTimer = 0;
    tank.lastPos.x = tank.x; tank.lastPos.y = tank.y;
    
    const enemyList = (tank.team === 'blue' ? enemies.filter(e => !e.dead) : [...allies.filter(a => !a.dead), ...(player && !player.dead ? [player] : [])]).filter(e => e !== tank && e.team !== tank.team);
    const enemyBase = tank.team === 'blue' ? bases.red : bases.blue;
    const myBase = tank.team === 'blue' ? bases.blue : bases.red;
    const myTeamList = tank.team === 'blue' ? [...allies.filter(a => !a.dead), ...(player && !player.dead ? [player] : [])] : enemies.filter(e => !e.dead);
    const isRedAI = tank.team === 'red' || tank.team === 'infected';

    // AI 回到基地后真正维修和补给，避免残血/空弹单位永久卡在撤退状态。
    if(myBase) {
        const baseCenterX = myBase.x + myBase.w / 2;
        const baseCenterY = myBase.y + myBase.h / 2;
        if(Math.hypot(tank.x - baseCenterX, tank.y - baseCenterY) < 230) {
            tank.hp = Math.min(tank.maxHp, tank.hp + tank.maxHp * 0.045 * dt);
            tank.shells = Math.min(tank.maxShells, tank.shells + tank.maxShells * 0.08 * dt);
            tank.mg = Math.min(tank.maxMG, tank.mg + tank.maxMG * 0.12 * dt);
            tank.aa = Math.min(tank.maxAA, (tank.aa || 0) + tank.maxAA * 0.08 * dt);
        }
    }
    
    let nearestEnemy = null, minEnemyDist = Infinity;
    let bestTarget = null, bestTargetScore = -Infinity;
    
    const sensorRange = isRedAI ? 2200 : 1550;
    const nearbyEnemies = getNearbyTanks(tank.x, tank.y, sensorRange);
    const filteredEnemies = nearbyEnemies.filter(e => e.team !== tank.team && !e.dead);
    
    filteredEnemies.forEach(e => {
        const d = Math.hypot(e.x - tank.x, e.y - tank.y);
        if(d < minEnemyDist) { minEnemyDist = d; nearestEnemy = e; }
        let score = 0;
        if(d < 800) score += 100;
        else if(d < 1500) score += 50;
        if(e.isPlayer) score += 80;
        score += (1 - e.hp / e.maxHp) * 60;
        const nearOutpost = outposts.find(op => Math.hypot(e.x - op.x, e.y - op.y) < op.radius && op.owner === tank.team);
        if(nearOutpost) score += 70;
        if(e.tankType === 'duoduo' || e.tankType === 'xingchen27b') score += 30;
        if(e.ultimateActive || e.ultimateCharging) score += 40;
        if(isRedAI && tank.aiFocusFireTarget === e) score += 160;
        score -= d * 0.02;
        if(score > bestTargetScore) { bestTargetScore = score; bestTarget = e; }
    });
    
    if(!nearestEnemy && enemyList.length > 0) {
        enemyList.forEach(e => {
            const d = Math.hypot(e.x - tank.x, e.y - tank.y);
            if(d < sensorRange && d < minEnemyDist) { minEnemyDist = d; nearestEnemy = e; }
        });
    }
    if(!nearestEnemy && isRedAI && gameMode === 'infection' && enemyList.length > 0) {
        nearestEnemy = enemyList.reduce((closest, enemy) =>
            Math.hypot(enemy.x - tank.x, enemy.y - tank.y) < Math.hypot(closest.x - tank.x, closest.y - tank.y) ? enemy : closest
        );
        minEnemyDist = Math.hypot(nearestEnemy.x - tank.x, nearestEnemy.y - tank.y);
    }
    if(bestTarget) {
        nearestEnemy = bestTarget;
        minEnemyDist = Math.hypot(bestTarget.x - tank.x, bestTarget.y - tank.y);
    }
    
    let nearestOutpost = null, minOutpostDist = Infinity;
    outposts.forEach(op => {
        const d = Math.hypot(op.x - tank.x, op.y - tank.y);
        if(d < minOutpostDist) { minOutpostDist = d; nearestOutpost = op; }
    });
    let capturableOutpost = null;
    outposts.forEach(op => {
        if(op.owner !== tank.team) {
            const d = Math.hypot(op.x - tank.x, op.y - tank.y);
            if(!capturableOutpost || d < Math.hypot(capturableOutpost.x - tank.x, capturableOutpost.y - tank.y)) {
                capturableOutpost = op;
            }
        }
    });
    
    const ammoRatio = (tank.maxShells + tank.maxMG) > 0 ? (tank.shells + tank.mg) / (tank.maxShells + tank.maxMG) : 0;
    tank.aiAmmoSaveMode = ammoRatio < 0.2;
    
    const totalAmmo = tank.shells + tank.mg + (tank.aa || 0);
    const hasAmmo = totalAmmo > 0 || (tank.stormActive && tank.tankType === 'duoduo_ifv');
    
    if(tank.aiBehaviorTimer <= 0) {
        tank.aiBehaviorTimer = 3 + Math.random() * 2;
        
        if(tank.hp < tank.maxHp * 0.3 && minEnemyDist < 400) {
            tank.aiBehavior = AI_BEHAVIOR.RETREAT_AND_HEAL;
        } else if(nearestEnemy && minEnemyDist < 600 && myTeamList.length >= 2) {
            const allyNearEnemy = myTeamList.find(ally => 
                ally !== tank && !ally.dead && Math.hypot(ally.x - nearestEnemy.x, ally.y - nearestEnemy.y) < 500
            );
            if(allyNearEnemy && Math.random() < 0.4 * tank.aiSkillLevel) {
                tank.aiBehavior = Math.random() < 0.5 ? AI_BEHAVIOR.FLANK_LEFT : AI_BEHAVIOR.FLANK_RIGHT;
                tank.aiFlankTarget = nearestEnemy;
            } else if(myTeamList.filter(t => !t.dead && Math.hypot(t.x - nearestEnemy.x, t.y - nearestEnemy.y) < CONFIG.aiFocusFireRange).length >= 2) {
                tank.aiBehavior = AI_BEHAVIOR.FOCUS_FIRE;
                tank.aiFocusFireTarget = nearestEnemy;
            } else {
                tank.aiBehavior = AI_BEHAVIOR.GROUP_UP;
            }
        } else {
            tank.aiBehavior = AI_BEHAVIOR.NONE;
        }
    }
    
    if(tank.aiBehavior !== AI_BEHAVIOR.NONE && tank.aiBehaviorTimer <= 0) {
        tank.aiBehavior = AI_BEHAVIOR.NONE;
    }
    
    if(tank.aiStateTimer <= 0) {
        tank.aiLastState = tank.aiState;
        
        if (!hasAmmo && tank.aiState !== 'retreating') {
            tank.aiState = 'retreating';
            tank.aiStateTimer = 15;
        }
        else if(gameMode === 'ctf') {
            tank.aiState = 'ctf'; tank.aiStateTimer = 8;
        }
        else if(gameMode === 'storm' && stormData.safeZone &&
            Math.hypot(tank.x - stormData.safeZone.x, tank.y - stormData.safeZone.y) > stormData.safeZone.radius * 0.82) {
            tank.aiState = 'stormCenter'; tank.aiStateTimer = 2;
        }
        else if(tank.team === 'red' && gameMode === 'defense') {
            if(tank.hp < tank.maxHp * 0.3 && minEnemyDist < 300) { tank.aiState = 'retreating'; tank.aiStateTimer = 4; }
            else if(nearestEnemy && minEnemyDist < 600) { tank.aiState = 'combat'; tank.aiStateTimer = 5; }
            else { tank.aiState = 'attackBase'; tank.aiStateTimer = 20; }
        } else if(tank.team === 'blue' && gameMode === 'defense') {
            if(nearestEnemy && minEnemyDist < 500) { tank.aiState = 'combat'; tank.aiStateTimer = 4; }
            else { tank.aiState = 'defendBase'; tank.aiStateTimer = 10; }
        } else if(tank.team === 'red' && gameMode === 'sneak') {
            if(nearestEnemy && minEnemyDist < 600) { tank.aiState = 'combat'; tank.aiStateTimer = 5; }
            else { tank.aiState = 'patrol'; if(!tank.patrolCenter) tank.patrolCenter = {x: tank.x, y: tank.y}; tank.aiStateTimer = 20; }
        } else if(tank.hp < tank.maxHp * 0.25) {
            tank.aiState = 'retreating'; tank.aiStateTimer = 5;
        } else if(nearestEnemy && minEnemyDist < 1000) {
            tank.aiState = 'combat'; tank.aiStateTimer = 3;
        } else if(capturableOutpost && minEnemyDist > 500 && gameMode !== 'sneak') {
            tank.aiState = 'capturing'; tank.aiCaptureTarget = capturableOutpost; tank.aiStateTimer = 15;
        } else if(nearestOutpost && nearestOutpost.owner === tank.team && minEnemyDist < 800 && gameMode !== 'sneak') {
            tank.aiState = 'defending'; tank.aiStateTimer = 8;
        } else if(isRedAI && !['sneak', 'infection', 'storm'].includes(gameMode) && enemyBase) {
            tank.aiState = 'attackBase'; tank.aiStateTimer = 12;
        } else {
            tank.aiState = 'patrol'; if(!tank.patrolCenter) tank.patrolCenter = {x: tank.x, y: tank.y}; tank.aiStateTimer = 10;
        }
    }
    
    let targetX = tank.x, targetY = tank.y; 
    let shouldFire = false; 
    let stopDist = 350; 
    let usePathfinding = false;
    
    switch(tank.aiState) {
        case 'ctf': {
            const enemyTeam = tank.team === 'blue' ? 'red' : 'blue';
            const enemyFlag = ctfFlags[enemyTeam];
            const myFlag = ctfFlags[tank.team];
            const carrying = enemyFlag && enemyFlag.carrier === tank;
            const objective = carrying ? myFlag : enemyFlag;
            if(objective) {
                targetX = objective.dropped ? objective.dropX : objective.x;
                targetY = objective.dropped ? objective.dropY : objective.y;
                stopDist = 10;
                usePathfinding = true;
            }
            if(nearestEnemy && minEnemyDist < 650) shouldFire = true;
            break;
        }
        case 'stormCenter': {
            targetX = stormData.safeZone.x;
            targetY = stormData.safeZone.y;
            stopDist = Math.max(80, stormData.safeZone.radius * 0.35);
            usePathfinding = true;
            if(nearestEnemy && minEnemyDist < 900) {
                shouldFire = true;
                targetX = nearestEnemy.x;
                targetY = nearestEnemy.y;
                stopDist = 280;
            }
            break;
        }
        case 'combat':
            if(nearestEnemy) {
                switch(tank.aiBehavior) {
                    case AI_BEHAVIOR.FLANK_LEFT:
                        targetX = nearestEnemy.x + Math.cos(nearestEnemy.angle + CONFIG.aiFlankAngle) * 200;
                        targetY = nearestEnemy.y + Math.sin(nearestEnemy.angle + CONFIG.aiFlankAngle) * 200;
                        stopDist = 150;
                        break;
                    case AI_BEHAVIOR.FLANK_RIGHT:
                        targetX = nearestEnemy.x + Math.cos(nearestEnemy.angle - CONFIG.aiFlankAngle) * 200;
                        targetY = nearestEnemy.y + Math.sin(nearestEnemy.angle - CONFIG.aiFlankAngle) * 200;
                        stopDist = 150;
                        break;
                    case AI_BEHAVIOR.FOCUS_FIRE:
                        targetX = nearestEnemy.x; targetY = nearestEnemy.y;
                        stopDist = minEnemyDist > 500 ? 50 : (minEnemyDist > 300 ? 100 : 250);
                        break;
                    default:
                        targetX = nearestEnemy.x; targetY = nearestEnemy.y;
                        stopDist = minEnemyDist > 500 ? 50 : (minEnemyDist > 300 ? 100 : 250);
                }
                shouldFire = true;
            } else { 
                targetX = enemyBase.x + enemyBase.w/2; targetY = enemyBase.y + enemyBase.h/2; 
                stopDist = 250; shouldFire = true; 
            }
            usePathfinding = true; 
            break;
        case 'capturing':
            if(tank.aiCaptureTarget) {
                targetX = tank.aiCaptureTarget.x; targetY = tank.aiCaptureTarget.y;
                const distToOutpost = Math.hypot(targetX - tank.x, targetY - tank.y);
                if(distToOutpost < CONFIG.outpostRadius * 0.6) {
                    tank.aiStayTimer = (tank.aiStayTimer || 0) - dt;
                    if(tank.aiStayTimer <= 0) tank.aiStayTimer = CONFIG.aiStayDuration;
                    targetX = tank.aiCaptureTarget.x + Math.sin(Date.now() * 0.001) * 50;
                    targetY = tank.aiCaptureTarget.y + Math.cos(Date.now() * 0.001) * 50;
                    stopDist = 20;
                    if(nearestEnemy && minEnemyDist < 400) { tank.aiState = 'combat'; tank.aiStateTimer = 5; }
                } else { tank.aiStayTimer = CONFIG.aiStayDuration; stopDist = 20; }
                if(nearestEnemy && minEnemyDist < 1000) shouldFire = true;
                usePathfinding = true;
            } else {
                tank.aiState = 'combat';
                if(nearestEnemy) {
                    targetX = nearestEnemy.x; targetY = nearestEnemy.y; shouldFire = true;
                } else {
                    targetX = enemyBase.x + enemyBase.w/2; targetY = enemyBase.y + enemyBase.h/2;
                }
            }
            break;
        case 'defending':
            if(nearestOutpost && nearestOutpost.owner === tank.team) {
                targetX = nearestOutpost.x + Math.sin(Date.now() * 0.0008) * 100;
                targetY = nearestOutpost.y + Math.cos(Date.now() * 0.0008) * 100;
                stopDist = 30;
                if(nearestEnemy && minEnemyDist < 600) { targetX = nearestEnemy.x; targetY = nearestEnemy.y; shouldFire = true; stopDist = 350; }
            } else {
                tank.aiState = 'capturing';
                if(capturableOutpost) {
                    targetX = capturableOutpost.x; targetY = capturableOutpost.y;
                } else if(nearestEnemy) {
                    targetX = nearestEnemy.x; targetY = nearestEnemy.y; shouldFire = true;
                } else {
                    targetX = enemyBase.x + enemyBase.w/2; targetY = enemyBase.y + enemyBase.h/2;
                }
            }
            break;
        case 'retreating':
            targetX = myBase.x + myBase.w/2; targetY = myBase.y + myBase.h/2; stopDist = 150;
            if(nearestEnemy && minEnemyDist < 300) { targetX = nearestEnemy.x; targetY = nearestEnemy.y; shouldFire = true; stopDist = 400; }
            usePathfinding = true;
            if(tank.hp > tank.maxHp * 0.5 && hasAmmo) { 
                tank.aiState = 'combat'; tank.aiStateTimer = 3;
                targetX = nearestEnemy ? nearestEnemy.x : enemyBase.x + enemyBase.w/2;
                targetY = nearestEnemy ? nearestEnemy.y : enemyBase.y + enemyBase.h/2;
                shouldFire = nearestEnemy ? true : false;
            } 
            break;
        case 'attackBase':
            targetX = enemyBase.x + enemyBase.w/2; targetY = enemyBase.y + enemyBase.h/2; stopDist = 250; shouldFire = true; usePathfinding = true;
            const distToBase = Math.hypot(targetX - tank.x, targetY - tank.y);
            if(distToBase < 400) { const offsetAngle = parseInt(tank.id, 36) || 0; targetX += Math.sin(offsetAngle) * 100; targetY += Math.cos(offsetAngle) * 100; } 
            break;
        case 'defendBase':
            const myBaseCenterX = myBase.x + myBase.w/2; const myBaseCenterY = myBase.y + myBase.h/2;
            const patrolAngle = Date.now() * 0.0005 + (parseInt(tank.id, 36) || 0);
            targetX = myBaseCenterX + Math.cos(patrolAngle) * 200; targetY = myBaseCenterY + Math.sin(patrolAngle) * 200; stopDist = 30;
            if(nearestEnemy && minEnemyDist < 600) { 
                tank.aiState = 'combat'; tank.aiStateTimer = 5;
                targetX = nearestEnemy.x; targetY = nearestEnemy.y; shouldFire = true;
            } 
            break;
        case 'patrol':
            if(!tank.patrolCenter) tank.patrolCenter = {x: tank.x, y: tank.y};
            const pAngle = Date.now() * 0.0002 + (parseInt(tank.id, 36) || 0);
            targetX = tank.patrolCenter.x + Math.cos(pAngle) * 300; targetY = tank.patrolCenter.y + Math.sin(pAngle) * 300; stopDist = 50;
            shouldFire = nearestEnemy && minEnemyDist < 500 ? true : false; 
            usePathfinding = true; 
            break;
    }
    
    let targetAngle = null;
    if(nearestEnemy) {
        const predictTime = minEnemyDist / CONFIG.bulletSpeed;
        const targetVelX = nearestEnemy.x - (nearestEnemy.prevPos ? nearestEnemy.prevPos.x : nearestEnemy.x);
        const targetVelY = nearestEnemy.y - (nearestEnemy.prevPos ? nearestEnemy.prevPos.y : nearestEnemy.y);
        const predictedX = nearestEnemy.x + targetVelX * predictTime * 2;
        const predictedY = nearestEnemy.y + targetVelY * predictTime * 2;
        targetAngle = Math.atan2(predictedY - tank.y, predictedX - tank.x);
    } else if(shouldFire) {
        targetAngle = Math.atan2(targetY - tank.y, targetX - tank.x);
    }

    if (targetAngle !== null) {
        let turretDiff = targetAngle - tank.turretAngle;
        while (turretDiff > Math.PI) turretDiff -= Math.PI * 2;
        while (turretDiff < -Math.PI) turretDiff += Math.PI * 2;
        const skillTurnMultiplier = 0.9 + Math.min(1.8, tank.aiSkillLevel || 0.8) * 0.22;
        const baseTurretSpeed = tank.turnSpeed * 1.2 * skillTurnMultiplier;
        const turretTurnSpeed = baseTurretSpeed * tank.turretSpeedMult;
        const turnAmount = Math.sign(turretDiff) * Math.min(Math.abs(turretDiff), turretTurnSpeed * 60 * dt);
        tank.turretAngle += turnAmount;
    }

    const aimDiff = targetAngle !== null ? Math.abs(normalizeAngle(tank.turretAngle - targetAngle)) : Infinity;

    const validTankTarget = !!(shouldFire && nearestEnemy && !nearestEnemy.dead && minEnemyDist <= sensorRange);
    const baseDistance = enemyBase ? Math.hypot(targetX - tank.x, targetY - tank.y) : Infinity;
    const validBaseTarget = !!(!nearestEnemy && shouldFire && enemyBase && enemyBase.hp > 0 && baseDistance < 950);

    if(validBaseTarget && hasAmmo) {
        const isAimedAtBase = aimDiff < 0.24;
        if(isAimedAtBase && lineOfSight(tank.x, tank.y, enemyBase.x + enemyBase.w/2, enemyBase.y + enemyBase.h/2) && tank.shells > 0 && tank.fireCooldown <= 0) {
            fireBullet(tank, 'shell');
            tank.fireCooldown = CONFIG.fireCooldown / (tank.fireRate * (1 + (tank.fireRateBuff || 0)) * (isRedAI ? 1.08 : 1));
        }
    }

    if (validTankTarget && hasAmmo) {
        const aimThreshold = Math.max(0.18, 0.30 - Math.min(1.8, tank.aiSkillLevel || 0.8) * 0.035);
        const isAimed = aimDiff < aimThreshold;

        // 确保有视线才射击（使用缓存或实时计算）
        let hasLOS;

        const totalAmmo2 = tank.shells + tank.mg;
        const shellRatio = tank.maxShells > 0 ? tank.shells / tank.maxShells : 0;
        const mgRatio = tank.maxMG > 0 ? tank.mg / tank.maxMG : 0;

        if(minEnemyDist < 350 && (tank.aiDodgeTimer || 0) <= 0 && !tank.fortressActive && !tank.stormActive) {
            const dodgeAngle = tank.angle + (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2);
            tank.aiDodgeDir = dodgeAngle;
            tank.aiDodgeTimer = 0.8 + Math.random() * 0.7;
            const dodgeSpeed = getActualSpeed(tank) * 0.6;
            const dodgeX = tank.x + Math.cos(dodgeAngle) * dodgeSpeed * 60 * dt;
            const dodgeY = tank.y + Math.sin(dodgeAngle) * dodgeSpeed * 60 * dt;
            if((tank.canPassObstacles && !tank.isFlying) || !checkObstacleCollision(dodgeX, dodgeY, CONFIG.tankSize, tank)) {
                tank.x = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapWidth - CONFIG.tankSize, dodgeX));
                tank.y = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapHeight - CONFIG.tankSize, dodgeY));
            } else if(tank.isFlying && typeof registerHelicopterCollision === 'function') registerHelicopterCollision(tank);
        }

        // 每3帧检查一次视线，减少开销
        if((tank.aiLOSCheckTimer || 0) <= 0) {
            tank.aiLOSCheckTimer = 0.05; // 约3帧检查一次
            tank.aiCachedLOS = nearestEnemy ? lineOfSight(tank.x, tank.y, nearestEnemy.x, nearestEnemy.y) : false;
        }
        tank.aiLOSCheckTimer -= dt;
        const aaReadyForTarget = (tank.aa || 0) > 0 && (tank.aaCooldown || 0) <= 0;
        hasLOS = aaReadyForTarget ? true : tank.aiCachedLOS;
        
        if (isAimed && hasLOS && nearestEnemy && !nearestEnemy.dead) {
            const canFireShell = tank.shells > 0 && tank.fireCooldown <= 0;
            const canFireMG = tank.mg > 0 && tank.mgCooldown <= 0 && !nearestEnemy.isFlying;
            const canFireAA = (tank.aa || 0) > 0 && (tank.aaCooldown || 0) <= 0;
            const isStormActive = tank.stormActive && tank.tankType === 'duoduo_ifv';

            if(canFireAA && (nearestEnemy.isFlying || !tank.aiCachedLOS)) {
                fireBullet(tank, 'aa');
                tank.aaCooldown = CONFIG.aaCooldown / tank.fireRate;
            } else if(nearestEnemy.isFlying) {
                if(canFireShell) {
                    fireBullet(tank, 'shell');
                    tank.fireCooldown = CONFIG.fireCooldown / (tank.fireRate * (1 + (tank.fireRateBuff || 0)));
                }
            } else if (isStormActive) {
                if (tank.mgCooldown <= 0) {
                    fireBullet(tank, 'mg');
                    tank.mgCooldown = (CONFIG.mgCooldown / tank.fireRate) / (tank.ultimateData.mgRateMult || 3);
                }
            } else if (minEnemyDist < 200) {
                if (canFireMG) {
                    fireBullet(tank, 'mg');
                    tank.mgCooldown = CONFIG.mgCooldown / (tank.fireRate * (1 + (tank.fireRateBuff || 0)));
                } else if (canFireShell) {
                    fireBullet(tank, 'shell');
                    tank.fireCooldown = CONFIG.fireCooldown / (tank.fireRate * (1 + (tank.fireRateBuff || 0)));
                }
            } else if (minEnemyDist < 500) {
                if (canFireMG && mgRatio > 0.15) {
                    fireBullet(tank, 'mg');
                    tank.mgCooldown = CONFIG.mgCooldown / (tank.fireRate * (1 + (tank.fireRateBuff || 0)));
                } else if (canFireShell && shellRatio > 0.1) {
                    fireBullet(tank, 'shell');
                    tank.fireCooldown = CONFIG.fireCooldown / (tank.fireRate * (1 + (tank.fireRateBuff || 0)));
                } else if (canFireMG) {
                    fireBullet(tank, 'mg');
                    tank.mgCooldown = CONFIG.mgCooldown / (tank.fireRate * (1 + (tank.fireRateBuff || 0)));
                }
            } else {
                if (canFireShell && shellRatio > 0.05) {
                    fireBullet(tank, 'shell');
                    tank.fireCooldown = CONFIG.fireCooldown / (tank.fireRate * (1 + (tank.fireRateBuff || 0)));
                } else if(canFireAA) {
                    fireBullet(tank, 'aa');
                    tank.aaCooldown = CONFIG.aaCooldown / tank.fireRate;
                } else if (canFireMG && minEnemyDist < 800 && mgRatio > 0.1) {
                    fireBullet(tank, 'mg');
                    tank.mgCooldown = CONFIG.mgCooldown / (tank.fireRate * (1 + (tank.fireRateBuff || 0)));
                }
            }
        }
    }

    if (!hasAmmo && tank.aiState !== 'retreating' && tank.aiState !== 'capturing') {
        const myBase2 = tank.team === 'blue' ? bases.blue : bases.red;
        if (myBase2) {
            tank.aiState = 'retreating';
            tank.aiStateTimer = 10;
            targetX = myBase2.x + myBase2.w/2; targetY = myBase2.y + myBase2.h/2;
        }
    }
    
    targetX = targetX !== undefined ? targetX : tank.x;
    targetY = targetY !== undefined ? targetY : tank.y;
    if(tank.canMove) {
        const dist = Math.hypot(targetX - tank.x, targetY - tank.y);
        
        const shouldUseAStar = usePathfinding && ((tank.stuckTimer || 0) > 0.5 || (tank.pathRefreshTimer || 0) <= 0 || !tank.path || tank.path.length === 0);
        if(shouldUseAStar && dist > stopDist + 100) {
            const newPath = aStar({x: tank.x, y: tank.y}, {x: targetX, y: targetY});
            if(newPath && newPath.length > 1) { 
                tank.path = simplifyPath(newPath); 
                tank.pathRefreshTimer = CONFIG.pathRefreshInterval; 
            }
            else tank.path = null;
        }
        
        let movedByPath = false;
        if(tank.path && tank.path.length > 0 && dist > stopDist) {
            movedByPath = followPath(tank, dt);
        }
        
        if(!movedByPath && dist > stopDist) {
            const targetAngle2 = Math.atan2(targetY - tank.y, targetX - tank.x);
            let diff = targetAngle2 - tank.angle;
            while(diff > Math.PI) diff -= Math.PI*2;
            while(diff < -Math.PI) diff += Math.PI*2;
            const turnSpeed = tank.turnSpeed * (tank.turnBoost || 1) * tank.turretSpeedMult;
            tank.angle += diff * turnSpeed * 60 * dt;
            const actualSpeed = getActualSpeed(tank);
            const newX = tank.x + Math.cos(tank.angle) * actualSpeed * 60 * dt;
            const newY = tank.y + Math.sin(tank.angle) * actualSpeed * 60 * dt;
            if((tank.canPassObstacles && !tank.isFlying) || !checkObstacleCollision(newX, newY, CONFIG.tankSize, tank)) {
                tank.x = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapWidth - CONFIG.tankSize, newX));
                tank.y = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapHeight - CONFIG.tankSize, newY));
            } else {
                if(tank.isFlying && typeof registerHelicopterCollision === 'function') registerHelicopterCollision(tank);
                tank.angle += (Math.random() - 0.5) * 1.0;
            }
            if(Math.random() < 0.25) addExhaustTrail(tank);
        }
    }
    
    if(tank.aiState !== 'combat' && tank.aiState !== 'retreating') {
        const allyInCombat = myTeamList.find(ally => {
            if(ally === tank) return false;
            const allyEnemies = enemyList.filter(e => Math.hypot(e.x - ally.x, e.y - ally.y) < 500);
            return allyEnemies.length > 0 && Math.hypot(ally.x - tank.x, ally.y - tank.y) < 1500;
        });
        if(allyInCombat && Math.random() < 0.3 * tank.aiSkillLevel) {
            tank.aiState = 'combat';
            tank.aiStateTimer = 5;
            const nearbyEnemy = enemyList.find(e => Math.hypot(e.x - allyInCombat.x, e.y - allyInCombat.y) < 500);
            tank.aiFocusFireTarget = nearbyEnemy || null;
            if(nearbyEnemy) {
                targetX = nearbyEnemy.x; targetY = nearbyEnemy.y; shouldFire = true;
            }
        }
    }
}

function normalizeAngle(a) {
    while(a > Math.PI) a -= Math.PI*2;
    while(a < -Math.PI) a += Math.PI*2;
    return a;
}


// ==================== AI大招 ====================
function updateAIUltimate(tank, dt) {
    if (tank.ultimateCooldown > 0) {
        tank.ultimateCooldown -= dt;
        return;
    }
    
    if (tank.ultimateActive || tank.ultimateCharging || tank.nailLocking || tank.stormActive || tank.fortressActive || tank.ghostActive) {
        return;
    }
    
    const enemyList = tank.team === 'blue' ? enemies.filter(e => !e.dead) : [...allies.filter(a => !a.dead), ...(player && !player.dead ? [player] : [])];
    const nearestEnemy = enemyList.length > 0 ? enemyList.reduce((a, b) => Math.hypot(a.x - tank.x, a.y - tank.y) < Math.hypot(b.x - tank.x, b.y - tank.y) ? a : b) : null;
    const minEnemyDist = nearestEnemy ? Math.hypot(nearestEnemy.x - tank.x, nearestEnemy.y - tank.y) : Infinity;
    const myTeamList = tank.team === 'blue' ? [...allies.filter(a => !a.dead), ...(player && !player.dead ? [player] : [])] : enemies.filter(e => !e.dead);
    const multipleEnemies = enemyList.filter(e => Math.hypot(e.x - tank.x, e.y - tank.y) < 400).length;
    
    if(tank.tankType === 'zuoyan30') {
        const highValueTarget = enemyList.find(e => (e.isPlayer || e.tankType === 'duoduo' || e.tankType === 'duoduo_ifv' || e.tankType === 'duoduo_spat') && Math.hypot(e.x - tank.x, e.y - tank.y) < 800);
        if(highValueTarget && tank.hp > tank.maxHp * 0.3) {
            tank.ghostActive = true; tank.ghostTimer = tank.ultimateData.duration; tank.ultimateCooldown = tank.ultimateData.cooldown;
            tank.speedBoost = tank.ultimateData.ghostSpeedBoost || 0.5; tank.ultimateActive = true; tank.ultimateTimer = tank.ultimateData.duration; return;
        }
    }
    if(tank.tankType === 'zuoyan1') {
        const capturable = outposts.find(op => op.owner !== tank.team);
        const needEscape = tank.hp < tank.maxHp * 0.3 && minEnemyDist < 400;
        if((capturable && Math.hypot(capturable.x - tank.x, capturable.y - tank.y) < 1500) || needEscape) {
            tank.ultimateActive = true; tank.ultimateTimer = tank.ultimateData.duration; tank.ultimateCooldown = tank.ultimateData.cooldown;
            tank.speedBoost = tank.ultimateData.speedBoost; tank.turnBoost = tank.ultimateData.turnBoost; return;
        }
    }
    if(tank.tankType === 'zuoyan29') {
        const lowHpEnemy = enemyList.find(e => e.hp < e.maxHp * 0.4 && Math.hypot(e.x - tank.x, e.y - tank.y) < 600);
        if(lowHpEnemy && tank.hp > tank.maxHp * 0.4) {
            tank.ultimateActive = true; tank.ultimateTimer = tank.ultimateData.duration; tank.ultimateCooldown = tank.ultimateData.cooldown;
            tank.speedBoost = tank.ultimateData.speedBoost; tank.turnBoost = tank.ultimateData.turnBoost; return;
        }
    }
    if(tank.tankType === 'xingchen27b') {
        const surrounded = multipleEnemies >= 2 || (minEnemyDist < 300 && nearestEnemy && (nearestEnemy.tankType === 'zuoyan29' || nearestEnemy.tankType === 'zuoyan1'));
        if(surrounded && tank.hp > tank.maxHp * 0.2) {
            tank.fortressActive = true; tank.fortressTimer = tank.ultimateData.duration; tank.ultimateCooldown = tank.ultimateData.cooldown;
            tank.armorBoost = tank.ultimateData.armorMult - 1; tank.canMove = false; tank.reflectActive = true;
            tank.ultimateActive = true; tank.ultimateTimer = tank.ultimateData.duration; return;
        }
    }
    if(tank.tankType === 'xingchen27s') {
        const ghostTarget = enemyList.find(e => e.ghostActive && Math.hypot(e.x - tank.x, e.y - tank.y) < 500);
        if(ghostTarget) {
            const angle = Math.atan2(ghostTarget.y - tank.y, ghostTarget.x - tank.x);
            let tx = tank.x + Math.cos(angle) * tank.ultimateData.teleportDist;
            let ty = tank.y + Math.sin(angle) * tank.ultimateData.teleportDist;
            tx = Math.max(CONFIG.tankSize * 2, Math.min(CONFIG.mapWidth - CONFIG.tankSize * 2, tx));
            ty = Math.max(CONFIG.tankSize * 2, Math.min(CONFIG.mapHeight - CONFIG.tankSize * 2, ty));
            if(checkObstacleCollision(tx, ty, CONFIG.tankSize, tank)) {
                let found = false;
                for(let r = 20; r <= 500; r += 20) {
                    for(let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
                        const testX = tx + Math.cos(a) * r;
                        const testY = ty + Math.sin(a) * r;
                        const clampedX = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapWidth - CONFIG.tankSize, testX));
                        const clampedY = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapHeight - CONFIG.tankSize, testY));
                        if(!checkObstacleCollision(clampedX, clampedY, CONFIG.tankSize, tank)) {
                            tx = clampedX; ty = clampedY; found = true; break;
                        }
                    }
                    if(found) break;
                }
                if(!found) { tx = tank.x; ty = tank.y; }
            }
            tank.x = tx; tank.y = ty;
            tank.shieldActive = true; tank.shieldHp = tank.ultimateData.shieldHp; tank.ultimateCooldown = tank.ultimateData.cooldown;
            tank.ultimateActive = true; tank.ultimateTimer = tank.ultimateData.shieldDuration;
            ghostTarget.ghostRevealed = true; ghostTarget.ghostTimer = 0; createParticles(tank.x, tank.y, 20, '#66cc66', 1.5); return;
        }
    }
    if(tank.tankType === 'xingchen27a') {
        const allyInDanger = aiTanks.find(t => t.team === tank.team && !t.dead && t !== tank && enemyList.some(e => Math.hypot(e.x - t.x, e.y - t.y) < 400));
        const selfInDanger = tank.hp < tank.maxHp * 0.4 && minEnemyDist < 400;
        if((allyInDanger || selfInDanger) && tank.hp > tank.maxHp * 0.2) {
            tank.ultimateActive = true; tank.ultimateTimer = tank.ultimateData.duration; tank.ultimateCooldown = tank.ultimateData.cooldown;
            tank.shieldActive = true; tank.shieldHp = tank.ultimateData.shieldHp; tank.armorBoost = tank.ultimateData.armorBoost; return;
        }
    }
    if(tank.tankType === 'duoduo') {
        const goodTarget = nearestEnemy && (nearestEnemy.tankType === 'xingchen27b' || nearestEnemy.isPlayer || nearestEnemy.hp < nearestEnemy.maxHp * 0.5);
        if(goodTarget && minEnemyDist < 600 && minEnemyDist > 200) {
            tank.ultimateCharging = true; tank.ultimateChargeTimer = tank.ultimateData.chargeTime; tank.ultimateCooldown = tank.ultimateData.cooldown;
            tank.canMove = false; tank.ultimateActive = true; return;
        }
    }
    if(tank.tankType === 'duoduo_ifv') {
        const paralyzedTarget = enemyList.find(e => e.tankType === 'zuoyan1' && e.overheatActive && Math.hypot(e.x - tank.x, e.y - tank.y) < 500);
        const surrounded2 = multipleEnemies >= 3;
        if(paralyzedTarget || surrounded2) {
            tank.stormActive = true; tank.stormTimer = tank.ultimateData.duration; tank.ultimateCooldown = tank.ultimateData.cooldown;
            tank.canMove = false; tank.ultimateActive = true; tank.ultimateTimer = tank.ultimateData.duration; return;
        }
    }
    if(tank.tankType === 'duoduo_spat') {
        const goodTarget = nearestEnemy && (nearestEnemy.tankType === 'xingchen27b' || nearestEnemy.tankType === 'xingchen27a' || nearestEnemy.isPlayer);
        if(goodTarget && minEnemyDist > 400 && minEnemyDist < 3000) {
            tank.nailLocking = true; tank.nailLockTimer = tank.ultimateData.lockTime; tank.ultimateCooldown = tank.ultimateData.cooldown;
            tank.canMove = false; tank.ultimateActive = true; tank.nailTarget = nearestEnemy;
            tank.nailLaserAngle = Math.atan2(nearestEnemy.y - tank.y, nearestEnemy.x - tank.x); return;
        }
    }
    if(tank.tankType === 'duoduo_emp') {
        const enemyList2 = tank.team === 'blue' ? enemies.filter(e => !e.dead) : [...allies.filter(a => !a.dead), ...(player && !player.dead ? [player] : [])];
        let nearest = null, minDist = Infinity;
        enemyList2.forEach(e => {
            const d = Math.hypot(e.x - tank.x, e.y - tank.y);
            if(d < minDist && d < 3000) { minDist = d; nearest = e; }
        });
        if(nearest) {
            tank.ultimateActive = true;
            tank.ultimateTimer = tank.ultimateData.duration;
            tank.ultimateCooldown = tank.ultimateData.cooldown;
            enemyList2.forEach(e => {
                const dist = Math.hypot(e.x - tank.x, e.y - tank.y);
                if(dist < tank.ultimateData.radius) {
                    e.minimapJammed = true;
                    e.minimapJamTimer = tank.ultimateData.jamDuration;
                    createParticles(e.x, e.y, 5, '#ff4400', 0.8);
                }
            });
            createParticles(tank.x, tank.y, 15, '#ff8800', 1.5);
        }
    } else if(tank.tankType === 'zuoyan31') {
        const enemyList2 = tank.team === 'blue' ? enemies.filter(e => !e.dead) : [...allies.filter(a => !a.dead), ...(player && !player.dead ? [player] : [])];
        if(enemyList2.length > 0) {
            tank.ultimateActive = true;
            tank.ultimateTimer = tank.ultimateData.duration;
            tank.ultimateCooldown = tank.ultimateData.cooldown;
            for(let i = 0; i < tank.ultimateData.droneCount; i++) {
                const angle = tank.turretAngle + (i - 1) * 0.5;
                bullets.push({
                    x: tank.x + Math.cos(angle) * 30, y: tank.y + Math.sin(angle) * 30,
                    vx: Math.cos(angle) * tank.ultimateData.droneSpeed, vy: Math.sin(angle) * tank.ultimateData.droneSpeed,
                    damage: tank.ultimateData.droneDamage, team: tank.team, type: 'drone', owner: tank,
                    life: tank.ultimateData.droneLife, hitTanks: new Set(), isDrone: true, trackRange: tank.ultimateData.trackRange
                });
            }
            createParticles(tank.x, tank.y, 12, '#5599ff', 1.5);
        }
    } else if(tank.tankType === 'zuoyan32') {
        const enemyList2 = tank.team === 'blue' ? enemies.filter(e => !e.dead) : [...allies.filter(a => !a.dead), ...(player && !player.dead ? [player] : [])];
        if(tank.hp < tank.maxHp * 0.5 || enemyList2.filter(e => Math.hypot(e.x - tank.x, e.y - tank.y) < 600).length >= 2) {
            tank.ultimateActive = true;
            tank.ultimateTimer = tank.ultimateData.duration;
            tank.ultimateCooldown = tank.ultimateData.cooldown;
            for(let i = 0; i < tank.ultimateData.cloneCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 50 + Math.random() * 50;
                const clone = createTank(TANKS['zuoyan32'], tank.x + Math.cos(angle) * dist, tank.y + Math.sin(angle) * dist, tank.team, false);
                clone.hp = tank.ultimateData.cloneHp; clone.maxHp = tank.ultimateData.cloneHp;
                clone.isClone = true; clone.cloneOwner = tank; clone.cloneTimer = tank.ultimateData.duration;
                if(tank.team === 'blue') allies.push(clone); else enemies.push(clone);
                aiTanks.push(clone);
            }
            createParticles(tank.x, tank.y, 15, '#77bbff', 1.5);
        }
    } else if(tank.tankType === 'zuoyan33') {
        const enemyList2 = tank.team === 'blue' ? enemies.filter(e => !e.dead) : [...allies.filter(a => !a.dead), ...(player && !player.dead ? [player] : [])];
        if(enemyList2.find(e => Math.hypot(e.x - tank.x, e.y - tank.y) < 500)) {
            tank.ultimateActive = true;
            tank.ultimateTimer = tank.ultimateData.duration;
            tank.ultimateCooldown = tank.ultimateData.cooldown;
            tank.toxinActive = true; tank.toxinTimer = tank.ultimateData.duration;
            createParticles(tank.x, tank.y, 12, '#44dd88', 1.5);
        }
    } else if(tank.tankType === 'xingchen27c') {
        const enemyList2 = tank.team === 'blue' ? enemies.filter(e => !e.dead) : [...allies.filter(a => !a.dead), ...(player && !player.dead ? [player] : [])];
        if(enemyList2.find(e => e.ghostActive && Math.hypot(e.x - tank.x, e.y - tank.y) < tank.ultimateData.revealRadius)) {
            tank.ultimateActive = true;
            tank.ultimateTimer = tank.ultimateData.duration;
            tank.ultimateCooldown = tank.ultimateData.cooldown;
            tank.revealActive = true; tank.revealTimer = tank.ultimateData.duration;
            enemyList2.forEach(e => {
                if(e.ghostActive) { e.ghostRevealed = true; e.ghostTimer = 0; createParticles(e.x, e.y, 8, '#ff0000', 1); }
            });
            createParticles(tank.x, tank.y, 15, '#33aa33', 1.5);
        }
    } else if(tank.tankType === 'xingchen27d') {
        const allyList = tank.team === 'blue' ? allies.filter(a => !a.dead) : enemies.filter(e => !e.dead);
        const nearestAlly = allyList.find(a => a !== tank && Math.hypot(a.x - tank.x, a.y - tank.y) < tank.ultimateData.linkRadius);
        if(nearestAlly && (tank.hp < tank.maxHp * 0.5 || nearestAlly.hp < nearestAlly.maxHp * 0.5)) {
            tank.ultimateActive = true;
            tank.ultimateTimer = tank.ultimateData.duration;
            tank.ultimateCooldown = tank.ultimateData.cooldown;
            tank.linkActive = true; tank.linkTimer = tank.ultimateData.duration;
            tank.linkedAlly = nearestAlly;
            nearestAlly.linkedTo = tank; nearestAlly.damageReduction = tank.ultimateData.damageReduction;
            createParticles(tank.x, tank.y, 10, '#55bb55', 1.5);
            createParticles(nearestAlly.x, nearestAlly.y, 10, '#55bb55', 1.5);
        }
    } else if(tank.tankType === 'xingchen27e') {
        const enemyList2 = tank.team === 'blue' ? enemies.filter(e => !e.dead) : [...allies.filter(a => !a.dead), ...(player && !player.dead ? [player] : [])];
        const lowHpEnemy = enemyList2.find(e => e.hp < e.maxHp * tank.ultimateData.executeThreshold && Math.hypot(e.x - tank.x, e.y - tank.y) < 800);
        if(lowHpEnemy) {
            tank.ultimateActive = true;
            tank.ultimateTimer = tank.ultimateData.duration;
            tank.ultimateCooldown = tank.ultimateData.cooldown;
            tank.judgeActive = true; tank.judgeTimer = tank.ultimateData.duration;
            tank.judgeTarget = lowHpEnemy;
            lowHpEnemy.judged = true; lowHpEnemy.judgeOwner = tank;
            createParticles(lowHpEnemy.x, lowHpEnemy.y, 15, '#ff0000', 1.5);
            createParticles(tank.x, tank.y, 12, '#66cc44', 1.5);
        }
    } else if(tank.tankType === 'duoduo_eng') {
        const enemyList2 = tank.team === 'blue' ? enemies.filter(e => !e.dead) : [...allies.filter(a => !a.dead), ...(player && !player.dead ? [player] : [])];
        if(enemyList2.find(e => Math.hypot(e.x - tank.x, e.y - tank.y) < 600)) {
            tank.ultimateActive = true;
            tank.ultimateTimer = tank.ultimateData.duration;
            tank.ultimateCooldown = tank.ultimateData.cooldown;
            const turretAngle = tank.turretAngle;
            const turretX = tank.x + Math.cos(turretAngle) * 60;
            const turretY = tank.y + Math.sin(turretAngle) * 60;
            mapElements.push({
                type: 'turret', x: turretX, y: turretY, angle: turretAngle,
                hp: tank.ultimateData.turretHp, maxHp: tank.ultimateData.turretHp, armor: tank.ultimateData.turretArmor,
                range: tank.ultimateData.turretRange, damage: tank.ultimateData.turretDamage,
                team: tank.team, owner: tank, duration: tank.ultimateData.duration,
                fireCooldown: 0, fireRate: 1.5
            });
            createParticles(turretX, turretY, 15, '#dd8833', 1.5);
        }
    } else if(tank.tankType === 'duoduo_rocket') {
        const enemyList2 = tank.team === 'blue' ? enemies.filter(e => !e.dead) : [...allies.filter(a => !a.dead), ...(player && !player.dead ? [player] : [])];
        const cluster = enemyList2.filter(e => Math.hypot(e.x - tank.x, e.y - tank.y) < 1000);
        if(cluster.length >= 2) {
            tank.ultimateActive = true;
            tank.ultimateTimer = tank.ultimateData.duration;
            tank.ultimateCooldown = tank.ultimateData.cooldown;
            const targetAngle = tank.turretAngle;
            for(let i = 0; i < tank.ultimateData.shellCount; i++) {
                const spreadAngle = targetAngle + (Math.random() - 0.5) * 0.8;
                const dist = 200 + Math.random() * 400;
                const targetX = tank.x + Math.cos(spreadAngle) * dist;
                const targetY = tank.y + Math.sin(spreadAngle) * dist;
                bullets.push({
                    x: tank.x + Math.cos(targetAngle) * 30, y: tank.y + Math.sin(targetAngle) * 30,
                    vx: Math.cos(targetAngle) * 12, vy: Math.sin(targetAngle) * 12,
                    damage: tank.ultimateData.shellDamage, team: tank.team, type: 'rocket', owner: tank,
                    life: 3.0, hitTanks: new Set(), targetX, targetY, isRocket: true,
                    burnDuration: tank.ultimateData.burnDuration, burnDamage: tank.ultimateData.burnDamage
                });
            }
            createParticles(tank.x, tank.y, 20, '#cc5522', 2);
        }
    }
    if(tank.tankType === 'zuoyan_x') {
        const enemyList2 = tank.team === 'blue' ? enemies.filter(e => !e.dead) : [...allies.filter(a => !a.dead), ...(player && !player.dead ? [player] : [])];
        const alliesNear = myTeamList.filter(t => t !== tank && !t.dead && Math.hypot(t.x - tank.x, t.y - tank.y) < tank.ultimateData.radius);
        const enemiesNear = enemyList2.filter(e => !e.dead && Math.hypot(e.x - tank.x, e.y - tank.y) < 600);
        if(alliesNear.length >= 2 && enemiesNear.length >= 1 && tank.hp > tank.maxHp * 0.3) {
            tank.ultimateActive = true; 
            tank.ultimateTimer = tank.ultimateData.duration; 
            tank.ultimateCooldown = tank.ultimateData.cooldown;
            const buffRadius = tank.ultimateData.radius;
            myTeamList.forEach(ally => {
                const dist = Math.hypot(ally.x - tank.x, ally.y - tank.y);
                if(dist < buffRadius) {
                    ally.fireRateBuff = tank.ultimateData.fireRateBoost;
                    ally.speedBuffFromCommander = tank.ultimateData.speedBoost;
                    ally.commanderBuffOwner = tank;
                }
            });
        }
    }
}
