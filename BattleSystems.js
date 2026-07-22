// ==================== 战场扩展：空投、维修、弹药架与绝地肉搏 ====================
const AIR_SUPPLY_INTERVAL = 34;
const AIR_SUPPLY_LIFETIME = 42;
const ENGINEER_REPAIR_RANGE = 175;
const ENGINEER_REPAIR_COOLDOWN = 3.2;
const AMMO_RACK_RADIUS = 190;
let supplyDrops = [];
let supplyDropTimer = 8;
let supplyDropCounter = 0;
let suddenDeathActive = false;
let suddenDeathStarted = false;
let sneakHiddenOutpost = null;
let sneakRescueTriggered = false;
let ammoRackFireballs = [];

function resetBattleSystems() {
    supplyDrops = [];
    supplyDropTimer = 8;
    supplyDropCounter = 0;
    suddenDeathActive = false;
    suddenDeathStarted = false;
    sneakHiddenOutpost = null;
    sneakRescueTriggered = false;
    ammoRackFireballs = [];
    const banner = document.getElementById('suddenDeathBanner');
    if(banner) banner.classList.remove('active');
}

function findSneakHiddenOutpostPosition() {
    const centerX = CONFIG.mapWidth / 2, centerY = CONFIG.mapHeight / 2;
    for(let attempt = 0; attempt < 36; attempt++) {
        const ring = Math.floor(attempt / 8) * 115;
        const angle = attempt * Math.PI * 0.61;
        const x = centerX + Math.cos(angle) * ring;
        const y = centerY + Math.sin(angle) * ring;
        if(typeof checkObstacleCollision === 'function' && checkObstacleCollision(x, y, 95, null)) continue;
        if(typeof isPositionInWater === 'function' && isPositionInWater(x, y, 80)) continue;
        return { x, y };
    }
    return { x: centerX, y: centerY };
}

function initializeSneakRescueMechanic() {
    sneakHiddenOutpost = null;
    sneakRescueTriggered = false;
    if(typeof gameMode === 'undefined' || gameMode !== 'sneak') return;
    const position = findSneakHiddenOutpostPosition();
    sneakHiddenOutpost = {
        x: position.x, y: position.y,
        radius: 165, discoveryRadius: 330,
        captureTime: 6, progress: 0,
        discovered: false, triggered: false,
        signalTimer: 0, contested: false
    };
}

function getSneakBlueSurvivors() {
    return [player, ...allies].filter(tank => tank && !tank.dead && tank.team === 'blue');
}

function findBlueEdgeEntry(index) {
    const preferredY = CONFIG.mapHeight / 2 + (index - 1) * 150;
    for(let attempt = 0; attempt < 60; attempt++) {
        const x = 95 + Math.floor(attempt / 12) * 85;
        const y = Math.max(100, Math.min(CONFIG.mapHeight - 100, preferredY + ((attempt % 12) - 6) * 95));
        if(typeof checkObstacleCollision === 'function' && checkObstacleCollision(x, y, CONFIG.tankSize, null)) continue;
        if(typeof isPositionInWater === 'function' && isPositionInWater(x, y, CONFIG.tankSize)) continue;
        return { x, y };
    }
    return { x: 140, y: preferredY };
}

function spawnSneakRescueReinforcements() {
    const rescueTypes = ['xingchen27a', 'duoduo_ifv', 'duoduo_eng'];
    const spawned = [];
    rescueTypes.forEach((type, index) => {
        const data = TANKS[type];
        if(!data || typeof createTank !== 'function') return;
        const entry = findBlueEdgeEntry(index);
        const tank = createTank(data, entry.x, entry.y, 'blue', false);
        tank.shells = Math.ceil(data.maxShells * 0.75);
        tank.mg = Math.ceil(data.maxMG * 0.75);
        tank.aa = Math.ceil((data.maxAA ?? 15) * 0.6);
        tank.apsCharges = CONFIG.apsCharges;
        tank.aiSkillLevel = typeof gameConfig !== 'undefined' && gameConfig.difficulty === 'hard' ? 1.12 : 0.9;
        tank.aiAggro = 1.05;
        tank.invincible = Math.max(tank.invincible || 0, 2.5);
        allies.push(tank);
        if(typeof aiTanks !== 'undefined') aiTanks.push(tank);
        spawned.push(tank);
        if(typeof createParticles === 'function') createParticles(entry.x, entry.y, 18, '#55c8ff', 1.8);
    });
    return spawned;
}

function triggerSneakRescueSignal() {
    if(sneakRescueTriggered || !sneakHiddenOutpost) return false;
    sneakRescueTriggered = true;
    sneakHiddenOutpost.triggered = true;
    sneakHiddenOutpost.signalTimer = 9;
    const reinforcements = spawnSneakRescueReinforcements();
    getSneakBlueSurvivors().forEach(tank => {
        tank.shieldActive = true;
        tank.shieldHp = Math.max(tank.shieldHp || 0, tank.maxHp * 0.2);
        tank.rescueShieldActive = true;
    });
    if(typeof addBattleAnnouncement === 'function') addBattleAnnouncement('blue', '📡 蓝方触发救援信号：3辆增援坦克已从战场边缘进入！');
    if(typeof showNotification === 'function') showNotification('📡 隐藏据点响应：救援抵达，全员获得20%护盾', '#5ed6ff');
    if(typeof playWorldSound === 'function') playWorldSound('capture', sneakHiddenOutpost.x, sneakHiddenOutpost.y, 1.25);
    if(typeof createParticles === 'function') createParticles(sneakHiddenOutpost.x, sneakHiddenOutpost.y, 50, '#72e9ff', 3);
    return reinforcements.length === 3;
}

function updateSneakRescueMechanic(dt) {
    if(typeof gameMode === 'undefined' || gameMode !== 'sneak' || !sneakHiddenOutpost) return;
    const point = sneakHiddenOutpost;
    if(point.triggered) {
        point.signalTimer = Math.max(0, point.signalTimer - dt);
        return;
    }
    const blueSurvivors = getSneakBlueSurvivors();
    if(blueSurvivors.length > 3 || blueSurvivors.length === 0) {
        point.progress = Math.max(0, point.progress - dt * 0.5);
        return;
    }
    if(!point.discovered && blueSurvivors.some(tank => Math.hypot(tank.x - point.x, tank.y - point.y) <= point.discoveryRadius)) {
        point.discovered = true;
        if(typeof showNotification === 'function') showNotification('📻 检测到微弱的未知信号……留在信号源附近', '#76d8ff');
    }
    if(!point.discovered) return;
    const blueInside = blueSurvivors.some(tank => Math.hypot(tank.x - point.x, tank.y - point.y) <= point.radius);
    const redInside = enemies.some(tank => tank && !tank.dead && Math.hypot(tank.x - point.x, tank.y - point.y) <= point.radius);
    point.contested = blueInside && redInside;
    if(blueInside && !redInside) point.progress = Math.min(point.captureTime, point.progress + dt);
    else point.progress = Math.max(0, point.progress - dt * (redInside ? 1.1 : 0.35));
    if(point.progress >= point.captureTime) triggerSneakRescueSignal();
}

function getLivingBattleTanks() {
    return [player, ...allies, ...enemies].filter(tank => tank && !tank.dead);
}

function findSupplyDropPosition() {
    for(let attempt = 0; attempt < 45; attempt++) {
        const x = 500 + Math.random() * Math.max(1, CONFIG.mapWidth - 1000);
        const y = 500 + Math.random() * Math.max(1, CONFIG.mapHeight - 1000);
        if(typeof checkObstacleCollision === 'function' && checkObstacleCollision(x, y, 55, null)) continue;
        if(currentMap === 'island' && typeof isPositionInWater === 'function' && isPositionInWater(x, y, 36)) continue;
        return { x, y };
    }
    return { x: CONFIG.mapWidth / 2, y: CONFIG.mapHeight / 2 };
}

function spawnAirSupply(x = null, y = null) {
    const position = Number.isFinite(x) && Number.isFinite(y) ? { x, y } : findSupplyDropPosition();
    const drop = {
        id: `supply-${++supplyDropCounter}`,
        x: position.x, y: position.y, z: 360,
        descentSpeed: 62, landed: false, life: AIR_SUPPLY_LIFETIME,
        pulse: Math.random() * Math.PI * 2
    };
    supplyDrops.push(drop);
    if(typeof addBattleAnnouncement === 'function') addBattleAnnouncement('blue', `🪂 空投补给正在坐标 ${Math.round(drop.x)}, ${Math.round(drop.y)} 降落`);
    if(typeof showNotification === 'function') showNotification('🪂 新的空投补给已进入战场', '#7fffd4');
    return drop;
}

function collectAirSupply(drop, tank) {
    const oldHp = tank.hp;
    tank.hp = Math.min(tank.maxHp, tank.hp + tank.maxHp * 0.34);
    tank.shells = Math.min(tank.maxShells, tank.shells + Math.ceil(tank.maxShells * 0.42));
    tank.mg = Math.min(tank.maxMG, tank.mg + Math.ceil(tank.maxMG * 0.48));
    tank.aa = Math.min(tank.maxAA, (tank.aa || 0) + Math.ceil(tank.maxAA * 0.4));
    tank.apsCharges = Math.min(CONFIG.apsCharges, (tank.apsCharges || 0) + 1);
    createParticles(drop.x, drop.y, 28, '#69ffd0', 2.2);
    const name = typeof getReplayTankName === 'function' ? getReplayTankName(tank) : tank.tankType;
    if(typeof addBattleAnnouncement === 'function') addBattleAnnouncement(tank.team, `${tank.team === 'blue' ? '蓝方' : '红方'}${name} 获得空投补给`);
    if(tank === player && typeof showMessage === 'function') {
        showMessage(`🪂 补给已获取：修复 ${Math.round(tank.hp - oldHp)} HP，弹药和 APS 已补充`, '#69ffd0');
    }
}

function updateAirSupplies(dt) {
    supplyDropTimer -= dt;
    if(supplyDropTimer <= 0) {
        spawnAirSupply();
        supplyDropTimer = AIR_SUPPLY_INTERVAL + Math.random() * 12;
    }
    const living = getLivingBattleTanks();
    for(let index = supplyDrops.length - 1; index >= 0; index--) {
        const drop = supplyDrops[index];
        if(!drop.landed) {
            drop.z = Math.max(0, drop.z - drop.descentSpeed * dt);
            if(drop.z <= 0) {
                drop.landed = true;
                createParticles(drop.x, drop.y, 18, '#e5fff7', 1.5);
            }
            continue;
        }
        drop.life -= dt;
        const collector = living.find(tank => Math.hypot(tank.x - drop.x, tank.y - drop.y) <= 72);
        if(collector) {
            collectAirSupply(drop, collector);
            supplyDrops.splice(index, 1);
        } else if(drop.life <= 0) supplyDrops.splice(index, 1);
    }
}

function getEngineerRepairTargets(engineer) {
    if(!engineer) return [];
    return getLivingBattleTanks().filter(tank =>
        tank !== engineer && tank.team === engineer.team && tank.hp < tank.maxHp &&
        Math.hypot(tank.x - engineer.x, tank.y - engineer.y) <= ENGINEER_REPAIR_RANGE
    );
}

function attemptEngineerRepair(engineer, notifyFailure = false) {
    if(!engineer || engineer.dead || engineer.tankType !== 'duoduo_eng') {
        if(notifyFailure && typeof showMessage === 'function') showMessage('只有多多号工程车可以使用战场维修', '#ffbf69');
        return false;
    }
    if((engineer.repairCooldown || 0) > 0) {
        if(notifyFailure && typeof showMessage === 'function') showMessage(`🔧 维修工具冷却 ${engineer.repairCooldown.toFixed(1)}s`, '#ffbf69');
        return false;
    }
    const targets = getEngineerRepairTargets(engineer).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
    const target = targets[0];
    if(!target) {
        if(notifyFailure && typeof showMessage === 'function') showMessage(`🔧 ${ENGINEER_REPAIR_RANGE} 范围内没有受损队友`, '#ffbf69');
        return false;
    }
    const amount = Math.min(target.maxHp - target.hp, Math.max(220, target.maxHp * 0.24));
    target.hp += amount;
    engineer.repairCooldown = ENGINEER_REPAIR_COOLDOWN;
    createParticles(target.x, target.y, 22, '#62ff8d', 1.5);
    if(typeof playWorldSound === 'function') playWorldSound('repair', target.x, target.y, 0.9);
    if(engineer === player && typeof showMessage === 'function') showMessage(`🔧 已维修 ${getReplayTankName(target)} +${Math.round(amount)} HP`, '#62ff8d');
    return true;
}

function updateEngineerRepairs(dt) {
    getLivingBattleTanks().forEach(tank => {
        tank.repairCooldown = Math.max(0, (tank.repairCooldown || 0) - dt);
        if(!tank.isPlayer && tank.tankType === 'duoduo_eng' && tank.repairCooldown <= 0 && getEngineerRepairTargets(tank).length) {
            attemptEngineerRepair(tank, false);
        }
    });
}

function getTankAmmoRatio(tank) {
    const maximum = Math.max(1, (tank.maxShells || 0) + (tank.maxMG || 0) + (tank.maxAA || 0));
    return Math.max(0, Math.min(1, ((tank.shells || 0) + (tank.mg || 0) + (tank.aa || 0)) / maximum));
}

function shouldAmmoRackExplode(tank, roll = Math.random()) {
    if(!tank || tank.ammoRackExploded) return false;
    const ratio = getTankAmmoRatio(tank);
    if(ratio <= 0.04) return false;
    return roll < 0.18 + ratio * 0.52;
}

function triggerAmmoRackExplosion(tank) {
    if(!tank || tank.ammoRackExploded) return false;
    tank.ammoRackExploded = true;
    const ratio = getTankAmmoRatio(tank);
    const damage = 260 + ratio * 360;
    const nearby = typeof getNearbyTanks === 'function'
        ? getNearbyTanks(tank.x, tank.y, AMMO_RACK_RADIUS)
        : getLivingBattleTanks();
    nearby.forEach(other => {
        if(!other || other === tank || other.dead || (other.invincible || 0) > 0) return;
        const distance = Math.hypot(other.x - tank.x, other.y - tank.y);
        if(distance > AMMO_RACK_RADIUS) return;
        const falloff = Math.max(0.28, 1 - distance / AMMO_RACK_RADIUS);
        const dealt = applyDirectDamage(other, damage * falloff, null, '弹药架殉爆');
        if(dealt > 0) showDamageNumber(other.x, other.y - 34, Math.round(dealt));
    });
    if(typeof damageTerrainInRadius === 'function') damageTerrainInRadius(tank.x, tank.y, AMMO_RACK_RADIUS, damage * 0.7, 'ammoRack', null);
    createParticles(tank.x, tank.y, 72, '#ff5a18', 4.2);
    createParticles(tank.x, tank.y, 38, '#fff0a8', 2.6);
    ammoRackFireballs.push({
        x: tank.x, y: tank.y, z: (tank.z || 0) + 26,
        life: 1.15, maxLife: 1.15, seed: Math.random() * Math.PI * 2
    });
    if(ammoRackFireballs.length > 24) ammoRackFireballs.splice(0, ammoRackFireballs.length - 24);
    if(typeof triggerScreenShake === 'function') triggerScreenShake(13, 0.46);
    if(typeof playWorldSound === 'function') playWorldSound('ammoRack', tank.x, tank.y, 1.25);
    if(typeof addBattleAnnouncement === 'function') addBattleAnnouncement(tank.team, `💥 ${getReplayTankName(tank)} 弹药架殉爆，爆风敌我不分！`);
    return true;
}

function findSuddenDeathPosition(tank, index, count) {
    const teamSide = tank.team === 'blue' ? -1 : 1;
    const centerX = CONFIG.mapWidth / 2 + teamSide * 115;
    const centerY = CONFIG.mapHeight / 2;
    for(let attempt = 0; attempt < 18; attempt++) {
        const ring = 45 + Math.floor((index + attempt) / 6) * 62;
        const angle = (index + attempt) / Math.max(1, count) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * ring;
        const y = centerY + Math.sin(angle) * ring;
        const blockedByWater = !tank.isFlying
            && currentMap === 'island'
            && typeof isPositionInWater === 'function'
            && isPositionInWater(x, y, CONFIG.tankSize * 0.55);
        const blockedByObstacle = !tank.isFlying
            && typeof checkObstacleCollision === 'function'
            && checkObstacleCollision(x, y, CONFIG.tankSize, tank);
        if(!blockedByWater && !blockedByObstacle) return { x, y };
    }
    return { x: centerX, y: centerY };
}

function startSuddenDeath() {
    if(suddenDeathStarted) return false;
    suddenDeathStarted = true;
    suddenDeathActive = true;
    gameTime = 60;
    const living = getLivingBattleTanks();
    living.forEach((tank, index) => {
        const sameTeam = living.filter(other => other.team === tank.team);
        const teamIndex = sameTeam.indexOf(tank);
        const position = findSuddenDeathPosition(tank, teamIndex, sameTeam.length);
        tank.x = position.x; tank.y = position.y;
        tank.prevPos = { x: tank.x, y: tank.y };
        tank.lastPos = { x: tank.x, y: tank.y };
        tank.hp = tank.maxHp;
        tank.ultimateCooldown = 0;
        tank.ultimateActive = false;
        tank.ultimateCharging = false;
        tank.fireCooldown = 0; tank.mgCooldown = 0; tank.aaCooldown = 0;
        tank.shells = tank.maxShells;
        tank.mg = tank.maxMG;
        tank.aa = tank.maxAA;
        tank.suddenDeathInfiniteAmmo = true;
        tank.invincible = Math.max(tank.invincible || 0, 2.5);
        tank.angle = tank.team === 'blue' ? 0 : Math.PI;
        tank.turretAngle = tank.angle;
    });
    bullets.length = 0;
    const banner = document.getElementById('suddenDeathBanner');
    if(banner) banner.classList.add('active');
    if(typeof addBattleAnnouncement === 'function') addBattleAnnouncement('red', '⚔ 双方平分，触发隐藏机制：绝地肉搏！');
    if(typeof showNotification === 'function') showNotification('⚔ 绝地肉搏：1分钟加时 · 满血 · 大招回满 · 无限弹药', '#ff4545');
    return true;
}

function handleBattleTimeExpired() {
    const tied = typeof getWinningScoreTeam === 'function' && getWinningScoreTeam() === 'draw';
    if(tied && !suddenDeathStarted) return startSuddenDeath();
    if(suddenDeathActive) suddenDeathActive = false;
    return false;
}

function updateBattleSystems(dt) {
    updateAirSupplies(dt);
    updateEngineerRepairs(dt);
    updateSneakRescueMechanic(dt);
    for(let i = ammoRackFireballs.length - 1; i >= 0; i--) {
        ammoRackFireballs[i].life -= dt;
        if(ammoRackFireballs[i].life <= 0) ammoRackFireballs.splice(i, 1);
    }
}

function drawBattleSystems2D() {
    ammoRackFireballs.forEach(fireball => {
        const progress = 1 - fireball.life / fireball.maxLife;
        const radius = 20 + Math.sin(Math.min(1, progress) * Math.PI) * 92;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const glow = ctx.createRadialGradient(fireball.x, fireball.y - fireball.z * .25, 2, fireball.x, fireball.y - fireball.z * .25, radius);
        glow.addColorStop(0, `rgba(255,255,225,${1 - progress})`);
        glow.addColorStop(.22, `rgba(255,215,60,${.95 - progress * .5})`);
        glow.addColorStop(.58, `rgba(255,75,10,${.82 - progress * .55})`);
        glow.addColorStop(1, 'rgba(80,8,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(fireball.x, fireball.y - fireball.z * .25, radius, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    });
    supplyDrops.forEach(drop => {
        const altitudeOffset = drop.z * 0.32;
        ctx.save();
        ctx.globalAlpha = drop.landed ? 0.92 : 0.82;
        ctx.fillStyle = 'rgba(0,0,0,.25)';
        ctx.beginPath(); ctx.ellipse(drop.x + 8, drop.y + 10, 28, 12, 0, 0, Math.PI * 2); ctx.fill();
        const drawY = drop.y - altitudeOffset;
        if(!drop.landed) {
            ctx.strokeStyle = '#e7f6f4'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(drop.x - 23, drawY - 24); ctx.lineTo(drop.x - 14, drawY - 7);
            ctx.moveTo(drop.x + 23, drawY - 24); ctx.lineTo(drop.x + 14, drawY - 7); ctx.stroke();
            ctx.fillStyle = '#f1f4dc';
            ctx.beginPath(); ctx.arc(drop.x, drawY - 27, 29, Math.PI, Math.PI * 2); ctx.fill();
        }
        ctx.translate(drop.x, drawY);
        ctx.rotate(Math.sin(Date.now() * .002 + drop.pulse) * .05);
        ctx.fillStyle = '#477c5b'; ctx.fillRect(-20, -15, 40, 30);
        ctx.strokeStyle = '#bdf7d4'; ctx.lineWidth = 3; ctx.strokeRect(-20, -15, 40, 30);
        ctx.fillStyle = '#f4e36a'; ctx.fillRect(-4, -15, 8, 30); ctx.fillRect(-20, -4, 40, 8);
        ctx.restore();
    });
    if(sneakHiddenOutpost && sneakHiddenOutpost.discovered && (!sneakHiddenOutpost.triggered || sneakHiddenOutpost.signalTimer > 0)) {
        const point = sneakHiddenOutpost;
        const progress = point.progress / point.captureTime;
        ctx.save();
        ctx.globalAlpha = point.triggered ? Math.min(1, point.signalTimer / 2) : 0.6 + Math.sin(Date.now() * 0.008) * 0.18;
        ctx.strokeStyle = point.contested ? '#ff9d36' : (point.triggered ? '#70ffbc' : '#65d9ff');
        ctx.lineWidth = 5;
        ctx.setLineDash([14, 9]);
        ctx.beginPath(); ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.arc(point.x, point.y, point.radius - 13, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress); ctx.stroke();
        ctx.fillStyle = point.triggered ? '#70ffbc' : '#d9f8ff';
        ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(point.triggered ? '📡' : '?', point.x, point.y);
        ctx.restore();
    }
}
