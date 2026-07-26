// ==================== 坦克熟练度 ====================
const TANK_MASTERY_LEVELS = Object.freeze([
    { level: 1, xp: 0,     legacyMatches: 0,   name: '新兵', reward: '基础涂装' },
    { level: 2, xp: 300,   legacyMatches: 3,   name: '斥候', reward: '战地迷彩：敌方锁定概率 -10%' },
    { level: 3, xp: 800,   legacyMatches: 8,   name: '精英', reward: '金色描边：主炮弹变为金色，威力 +20%' },
    { level: 4, xp: 1500,  legacyMatches: 15,  name: '老兵', reward: '灼热尾焰：接触尾焰的敌人持续受伤' },
    { level: 5, xp: 3000,  legacyMatches: 30,  name: '王牌', reward: '王牌光环：激励 300 范围内所有 AI' },
    { level: 6, xp: 5000,  legacyMatches: 50,  name: '战术王牌', reward: '战术机动：速度 +8%，转向速度 +10%' },
    { level: 7, xp: 7500,  legacyMatches: 75,  name: '传奇', reward: '传奇装甲：最大生命 +12%，装甲 +0.15' },
    { level: 8, xp: 11000, legacyMatches: 110, name: '战神', reward: '战神火力：所有常规武器伤害 +10%' }
]);

const TANK_MASTERY_MAX_LEVEL = 8;
const MASTERY_CAMOUFLAGE_EVASION = 0.10;
const MASTERY_GOLDEN_SHELL_DAMAGE_MULT = 1.20;
const MASTERY_TRAIL_DAMAGE_PER_SECOND = 55;
const MASTERY_AURA_RADIUS = 300;
const MASTERY_AURA_ATTACK_MULT = 1.15;
const MASTERY_AURA_DEFENSE_MULT = 0.85;
const MASTERY_TACTICAL_SPEED_MULT = 1.08;
const MASTERY_TACTICAL_TURN_MULT = 1.10;
const MASTERY_LEGENDARY_HP_MULT = 1.12;
const MASTERY_LEGENDARY_ARMOR_BONUS = 0.15;
const MASTERY_WARGOD_WEAPON_DAMAGE_MULT = 1.10;
const MASTERY_LEVEL_COLORS = Object.freeze([
    '#aab4bd', '#78ad57', '#37bddd', '#4d83ff',
    '#a768ff', '#ff943d', '#ff4f75', '#ffd84a'
]);
const AI_MASTERY_LEVEL_WEIGHTS = Object.freeze([30, 22, 16, 12, 8, 6, 4, 2]);

function ensureTankMasteryStore() {
    if(typeof playerStats === 'undefined') return {};
    if(!playerStats.tankMastery || typeof playerStats.tankMastery !== 'object' || Array.isArray(playerStats.tankMastery)) {
        playerStats.tankMastery = {};
    }
    return playerStats.tankMastery;
}

function getTankMasteryLevel(xp) {
    let current = TANK_MASTERY_LEVELS[0];
    TANK_MASTERY_LEVELS.forEach(entry => {
        if(xp >= entry.xp) current = entry;
    });
    return current;
}

function getLegacyTankMasteryXp(matches) {
    let legacyLevel = TANK_MASTERY_LEVELS[0];
    TANK_MASTERY_LEVELS.forEach(entry => {
        if(matches >= entry.legacyMatches) legacyLevel = entry;
    });
    return legacyLevel.xp;
}

function getMasteryLevelColor(level) {
    const index = Math.max(0, Math.min(MASTERY_LEVEL_COLORS.length - 1, (Number(level) || 1) - 1));
    return MASTERY_LEVEL_COLORS[index];
}

function rollAIMasteryLevel(randomValue = Math.random()) {
    const total = AI_MASTERY_LEVEL_WEIGHTS.reduce((sum, weight) => sum + weight, 0);
    let roll = Math.max(0, Math.min(.999999, Number(randomValue) || 0)) * total;
    for(let index = 0; index < AI_MASTERY_LEVEL_WEIGHTS.length; index++) {
        roll -= AI_MASTERY_LEVEL_WEIGHTS[index];
        if(roll < 0) return index + 1;
    }
    return 1;
}

function getTankMasteryProfile(tankType) {
    const store = ensureTankMasteryStore();
    const saved = store[tankType] || {};
    const matches = Math.max(0, Number(saved.matches) || 0);
    const kills = Math.max(0, Number(saved.kills) || 0);
    const wins = Math.max(0, Number(saved.wins) || 0);
    const savedXp = Number(saved.xp);
    const xp = Number.isFinite(savedXp) && savedXp >= 0 ? savedXp : getLegacyTankMasteryXp(matches);
    const levelInfo = getTankMasteryLevel(xp);
    const next = TANK_MASTERY_LEVELS.find(entry => entry.xp > xp) || null;
    return {
        tankType,
        matches,
        kills,
        wins,
        xp,
        level: levelInfo.level,
        levelName: levelInfo.name,
        reward: levelInfo.reward,
        levelXp: levelInfo.xp,
        nextXp: next ? next.xp : xp,
        nextReward: next ? next.reward : '已解锁全部奖励',
        progress: next ? Math.max(0, Math.min(1, (xp - levelInfo.xp) / Math.max(1, next.xp - levelInfo.xp))) : 1
    };
}

function updateTankMastery(tankType, updates) {
    if(!tankType || typeof TANKS === 'undefined' || !TANKS[tankType]) return null;
    const store = ensureTankMasteryStore();
    const previous = getTankMasteryProfile(tankType);
    const current = store[tankType] || { matches: 0, kills: 0, wins: 0, xp: 0 };
    current.xp = previous.xp;
    current.matches = Math.max(0, (Number(current.matches) || 0) + (Number(updates.matches) || 0));
    current.kills = Math.max(0, (Number(current.kills) || 0) + (Number(updates.kills) || 0));
    current.wins = Math.max(0, (Number(current.wins) || 0) + (Number(updates.wins) || 0));
    current.xp = Math.max(0, current.xp + (Number(updates.xp) || 0));
    store[tankType] = current;
    const next = getTankMasteryProfile(tankType);
    if(next.level > previous.level && typeof showNotification === 'function') {
        showNotification(`★ ${TANKS[tankType].name} 熟练度提升：${next.levelName} · ${next.reward}`, '#ffd85a');
    }
    if(typeof saveStats === 'function') saveStats();
    return next;
}

function recordTankMasteryMatch(tankType) {
    return updateTankMastery(tankType, { matches: 1, xp: 100 });
}

function recordTankMasteryKill(tankType) {
    return updateTankMastery(tankType, { kills: 1 });
}

function recordTankMasteryResult(tankType, victory) {
    if(!victory) return getTankMasteryProfile(tankType);
    return updateTankMastery(tankType, { wins: 1 });
}

function calculateTankMasteryMatchXp(performance = {}) {
    const completion = 100;
    const victory = performance.victory ? 150 : 0;
    const kills = Math.max(0, Math.floor(Number(performance.kills) || 0)) * 30;
    const survival = Math.min(150, Math.floor(Math.max(0, Number(performance.survivalSeconds) || 0) / 2));
    return {
        completion,
        victory,
        kills,
        survival,
        total: completion + victory + kills + survival
    };
}

function recordTankMasteryPerformance(tankType, performance = {}) {
    const breakdown = calculateTankMasteryMatchXp(performance);
    const profile = updateTankMastery(tankType, {
        matches: 1,
        wins: performance.victory ? 1 : 0,
        xp: breakdown.total
    });
    if(typeof showNotification === 'function') {
        const parts = [`完赛 ${breakdown.completion}`];
        if(breakdown.victory) parts.push(`胜利 ${breakdown.victory}`);
        if(breakdown.kills) parts.push(`击杀 ${breakdown.kills}`);
        if(breakdown.survival) parts.push(`生存 ${breakdown.survival}`);
        showNotification(`★ ${TANKS[tankType].name} +${breakdown.total} 经验（${parts.join(' · ')}）`, '#ffd85a');
    }
    return { ...profile, gainedXp: breakdown.total, xpBreakdown: breakdown };
}

function mixMasteryColor(hex, target, amount) {
    const parse = value => {
        const clean = String(value || '#808080').replace('#', '');
        const expanded = clean.length === 3 ? clean.split('').map(char => char + char).join('') : clean.padEnd(6, '8').slice(0, 6);
        return [0, 2, 4].map(index => parseInt(expanded.slice(index, index + 2), 16));
    };
    const source = parse(hex);
    const destination = parse(target);
    const mixed = source.map((value, index) => Math.round(value + (destination[index] - value) * amount));
    return `#${mixed.map(value => value.toString(16).padStart(2, '0')).join('')}`;
}

function getTankMasteryVisual(tankType, levelOverride = null) {
    const data = typeof TANKS !== 'undefined' ? TANKS[tankType] : null;
    const savedProfile = getTankMasteryProfile(tankType);
    const overrideInfo = levelOverride === null
        ? null
        : TANK_MASTERY_LEVELS.find(entry => entry.level === Math.max(1, Math.min(8, Number(levelOverride) || 1)));
    const profile = overrideInfo ? {
        ...savedProfile,
        level: overrideInfo.level,
        levelName: overrideInfo.name,
        reward: overrideInfo.reward
    } : savedProfile;
    if(!data) return {
        ...profile,
        color: '#888888',
        accent: '#cccccc',
        camouflage: false,
        goldenProjectiles: false,
        trailColor: null,
        aura: false,
        speedMult: 1,
        turnSpeedMult: 1,
        hpMult: 1,
        armorBonus: 0,
        weaponDamageMult: 1,
        levelColor: getMasteryLevelColor(profile.level)
    };
    let color = data.color;
    let accent = data.accent;
    if(profile.level >= 2) color = mixMasteryColor(data.color, '#3d5234', .34);
    if(profile.level >= 3) accent = mixMasteryColor(data.accent, '#ffd85a', .72);
    return {
        ...profile,
        color,
        accent,
        camouflage: profile.level >= 2,
        goldenProjectiles: profile.level >= 3,
        trailColor: profile.level >= 4 ? accent : null,
        aura: profile.level >= 5,
        auraRadius: profile.level >= 5 ? MASTERY_AURA_RADIUS : 0,
        speedMult: profile.level >= 6 ? MASTERY_TACTICAL_SPEED_MULT : 1,
        turnSpeedMult: profile.level >= 6 ? MASTERY_TACTICAL_TURN_MULT : 1,
        hpMult: profile.level >= 7 ? MASTERY_LEGENDARY_HP_MULT : 1,
        armorBonus: profile.level >= 7 ? MASTERY_LEGENDARY_ARMOR_BONUS : 0,
        weaponDamageMult: profile.level >= 8 ? MASTERY_WARGOD_WEAPON_DAMAGE_MULT : 1,
        levelColor: getMasteryLevelColor(profile.level)
    };
}

function shouldAIAcquireMasteryTarget(observer, target, now = performance.now()) {
    if(!observer || !target || !target.masteryCamouflage || observer.aiTrackedTarget === target) return true;
    if(!observer.masteryCamouflageChecks || typeof observer.masteryCamouflageChecks !== 'object') {
        observer.masteryCamouflageChecks = {};
    }
    const key = target.id || target.tankType || 'target';
    let check = observer.masteryCamouflageChecks[key];
    if(!check || now >= check.expiresAt) {
        check = {
            avoided: Math.random() < MASTERY_CAMOUFLAGE_EVASION,
            expiresAt: now + 1000
        };
        observer.masteryCamouflageChecks[key] = check;
    }
    return !check.avoided;
}

function updateMasteryBattleEffects() {
    if(typeof allies === 'undefined' || typeof enemies === 'undefined') return;
    const aiUnits = [...allies, ...enemies].filter(tank => tank && !tank.dead && !tank.isPlayer);
    aiUnits.forEach(tank => {
        tank.masteryAuraDamageMult = 1;
        tank.masteryAuraDefenseMult = 1;
        tank.masteryAuraInspired = false;
    });
    const auraSources = [player, ...allies, ...enemies].filter(tank => tank && !tank.dead && tank.masteryAura);
    if(auraSources.length === 0) return;
    aiUnits.forEach(tank => {
        const source = auraSources.find(auraTank => {
            if(typeof areEntitiesOnSameFactoryFloor === 'function' && !areEntitiesOnSameFactoryFloor(auraTank, tank)) return false;
            return Math.hypot(tank.x - auraTank.x, tank.y - auraTank.y) <= MASTERY_AURA_RADIUS;
        });
        if(!source) return;
        tank.masteryAuraDamageMult = MASTERY_AURA_ATTACK_MULT;
        tank.masteryAuraDefenseMult = MASTERY_AURA_DEFENSE_MULT;
        tank.masteryAuraInspired = true;
        tank.aiState = 'combat';
        tank.aiStateTimer = Math.max(tank.aiStateTimer || 0, 0.35);
    });
}

function renderMasteryPanel() {
    const list = document.getElementById('masteryList');
    const summary = document.getElementById('masterySummary');
    if(!list) return;
    const profiles = Object.keys(TANKS)
        .filter(key => !TANKS[key].isHidden || (typeof isTankUnlocked === 'function' && isTankUnlocked(key)))
        .map(key => getTankMasteryProfile(key))
        .sort((a, b) => b.xp - a.xp || b.matches - a.matches || b.kills - a.kills);
    const totalMatches = profiles.reduce((sum, profile) => sum + profile.matches, 0);
    const mastered = profiles.filter(profile => profile.level >= TANK_MASTERY_MAX_LEVEL).length;
    if(summary) summary.textContent = `累计驾驶 ${totalMatches} 场 · 8级满熟练坦克 ${mastered} 辆`;
    list.replaceChildren();
    profiles.forEach(profile => {
        const tank = TANKS[profile.tankType];
        const card = document.createElement('div');
        card.className = `mastery-card mastery-level-${profile.level}`;
        const progressText = profile.level >= TANK_MASTERY_MAX_LEVEL ? 'MAX' : `${profile.xp}/${profile.nextXp} XP`;
        card.innerHTML = `
            <div class="mastery-card-head">
                <strong>${tank.name}</strong>
                <span>★${profile.level} ${profile.levelName}</span>
            </div>
            <div class="mastery-card-stats">${profile.xp} XP · ${profile.matches} 场 · ${profile.wins} 胜 · ${profile.kills} 击杀</div>
            <div class="mastery-progress"><i style="width:${Math.round(profile.progress * 100)}%"></i></div>
            <div class="mastery-reward">${profile.level >= TANK_MASTERY_MAX_LEVEL ? profile.reward : `下一奖励：${profile.nextReward}`} <b>${progressText}</b></div>
        `;
        list.appendChild(card);
    });
}

function showMasteryPanel() {
    if(typeof closeInfoPanels === 'function') closeInfoPanels('masteryPanel');
    renderMasteryPanel();
    const panel = document.getElementById('masteryPanel');
    if(panel) panel.style.display = 'block';
}

// ==================== 自定义房间 ====================
const CUSTOM_ROOM_DEFAULTS = Object.freeze({
    rule: 'base',
    blueCount: 6,
    redCount: 8,
    durationMinutes: 6,
    outpostCount: 3,
    reinforcements: true,
    blueSpawnInterval: 18,
    redSpawnInterval: 18,
    scoreTarget: 5000,
    baseHp: 10000,
    aiAmmoPercent: 70,
    tankPool: []
});

let customRoomConfig = {
    ...CUSTOM_ROOM_DEFAULTS,
    tankPool: Object.keys(TANKS).filter(type => !TANKS[type].isHidden)
};

function getAvailableCustomTankTypes() {
    if(typeof TANKS === 'undefined') return [];
    return Object.keys(TANKS).filter(key => !TANKS[key].isHidden ||
        (typeof isTankUnlocked === 'function' && isTankUnlocked(key)));
}

function sanitizeCustomRoomConfig(config = {}) {
    const available = getAvailableCustomTankTypes();
    const clampInt = (value, min, max, fallback) => {
        const parsed = Math.round(Number(value));
        return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
    };
    const rule = ['base', 'score', 'timed'].includes(config.rule) ? config.rule : CUSTOM_ROOM_DEFAULTS.rule;
    let tankPool = Array.isArray(config.tankPool)
        ? config.tankPool.filter(type => available.includes(type))
        : available.filter(type => !TANKS[type].isHidden);
    tankPool = [...new Set(tankPool)];
    return {
        rule,
        blueCount: clampInt(config.blueCount, 1, 20, CUSTOM_ROOM_DEFAULTS.blueCount),
        redCount: clampInt(config.redCount, 1, 20, CUSTOM_ROOM_DEFAULTS.redCount),
        durationMinutes: clampInt(config.durationMinutes, 1, 20, CUSTOM_ROOM_DEFAULTS.durationMinutes),
        outpostCount: clampInt(config.outpostCount, 0, 5, CUSTOM_ROOM_DEFAULTS.outpostCount),
        reinforcements: config.reinforcements !== false,
        blueSpawnInterval: clampInt(config.blueSpawnInterval, 5, 90, CUSTOM_ROOM_DEFAULTS.blueSpawnInterval),
        redSpawnInterval: clampInt(config.redSpawnInterval, 5, 90, CUSTOM_ROOM_DEFAULTS.redSpawnInterval),
        scoreTarget: clampInt(config.scoreTarget, 500, 50000, CUSTOM_ROOM_DEFAULTS.scoreTarget),
        baseHp: clampInt(config.baseHp, 1000, 50000, CUSTOM_ROOM_DEFAULTS.baseHp),
        aiAmmoPercent: clampInt(config.aiAmmoPercent, 10, 200, CUSTOM_ROOM_DEFAULTS.aiAmmoPercent),
        tankPool
    };
}

function getCustomControlValue(id, fallback) {
    const element = document.getElementById(id);
    return element ? element.value : fallback;
}

function readCustomRoomConfig() {
    const poolInputs = Array.from(document.querySelectorAll('#customTankPool input[type="checkbox"]:checked'));
    customRoomConfig = sanitizeCustomRoomConfig({
        rule: getCustomControlValue('customRule', customRoomConfig.rule),
        blueCount: getCustomControlValue('customBlueCount', customRoomConfig.blueCount),
        redCount: getCustomControlValue('customRedCount', customRoomConfig.redCount),
        durationMinutes: getCustomControlValue('customDuration', customRoomConfig.durationMinutes),
        outpostCount: getCustomControlValue('customOutposts', customRoomConfig.outpostCount),
        reinforcements: !!(document.getElementById('customReinforcements') || {}).checked,
        blueSpawnInterval: getCustomControlValue('customBlueSpawn', customRoomConfig.blueSpawnInterval),
        redSpawnInterval: getCustomControlValue('customRedSpawn', customRoomConfig.redSpawnInterval),
        scoreTarget: getCustomControlValue('customScoreTarget', customRoomConfig.scoreTarget),
        baseHp: getCustomControlValue('customBaseHp', customRoomConfig.baseHp),
        aiAmmoPercent: getCustomControlValue('customAiAmmo', customRoomConfig.aiAmmoPercent),
        tankPool: poolInputs.map(input => input.value)
    });
    if(typeof selectedTank !== 'undefined' && selectedTank && !customRoomConfig.tankPool.includes(selectedTank)) {
        selectedTank = null;
        const startButton = document.getElementById('startBtn');
        if(startButton) startButton.disabled = true;
    }
    return customRoomConfig;
}

function applyCustomRoomConfigToUI(config = customRoomConfig) {
    customRoomConfig = sanitizeCustomRoomConfig(config);
    const values = {
        customRule: customRoomConfig.rule,
        customBlueCount: customRoomConfig.blueCount,
        customRedCount: customRoomConfig.redCount,
        customDuration: customRoomConfig.durationMinutes,
        customOutposts: customRoomConfig.outpostCount,
        customBlueSpawn: customRoomConfig.blueSpawnInterval,
        customRedSpawn: customRoomConfig.redSpawnInterval,
        customScoreTarget: customRoomConfig.scoreTarget,
        customBaseHp: customRoomConfig.baseHp,
        customAiAmmo: customRoomConfig.aiAmmoPercent
    };
    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if(element) element.value = value;
        const output = document.getElementById(`${id}Value`);
        if(output) output.textContent = value;
    });
    const reinforcements = document.getElementById('customReinforcements');
    if(reinforcements) reinforcements.checked = customRoomConfig.reinforcements;
    renderCustomTankPool();
    updateCustomRoomConditionalUI();
}

function renderCustomTankPool() {
    const pool = document.getElementById('customTankPool');
    if(!pool) return;
    pool.replaceChildren();
    getAvailableCustomTankTypes().forEach(type => {
        const tank = TANKS[type];
        const label = document.createElement('label');
        label.className = 'custom-tank-option';
        const checked = customRoomConfig.tankPool.includes(type);
        label.innerHTML = `<input type="checkbox" value="${type}" ${checked ? 'checked' : ''}><span>${tank.name}</span>`;
        const input = label.querySelector('input');
        if(input) input.addEventListener('change', () => {
            readCustomRoomConfig();
            if(typeof renderTankList === 'function') renderTankList();
        });
        pool.appendChild(label);
    });
}

function toggleCustomTankPoolAll(checked) {
    document.querySelectorAll('#customTankPool input[type="checkbox"]').forEach(input => { input.checked = checked; });
    readCustomRoomConfig();
    if(typeof renderTankList === 'function') renderTankList();
}

function updateCustomRoomConditionalUI() {
    const rule = getCustomControlValue('customRule', customRoomConfig.rule);
    const targetRow = document.getElementById('customScoreTargetRow');
    if(targetRow) targetRow.style.display = rule === 'score' ? 'flex' : 'none';
    const baseHpRow = document.getElementById('customBaseHpRow');
    if(baseHpRow) baseHpRow.style.display = rule === 'base' ? 'flex' : 'none';
    const reinforcementRows = document.querySelectorAll('.custom-reinforcement-row');
    const enabled = !!(document.getElementById('customReinforcements') || {}).checked;
    reinforcementRows.forEach(row => { row.style.display = enabled ? 'flex' : 'none'; });
}

function setupCustomRoomControls() {
    const panel = document.getElementById('customRoomPanel');
    if(!panel || panel.dataset.ready === '1') return;
    panel.dataset.ready = '1';
    customRoomConfig = sanitizeCustomRoomConfig(customRoomConfig);
    const ids = ['customRule', 'customBlueCount', 'customRedCount', 'customDuration', 'customOutposts',
        'customBlueSpawn', 'customRedSpawn', 'customScoreTarget', 'customBaseHp', 'customAiAmmo'];
    ids.forEach(id => {
        const element = document.getElementById(id);
        if(!element) return;
        element.addEventListener('input', () => {
            const output = document.getElementById(`${id}Value`);
            if(output) output.textContent = element.value;
            readCustomRoomConfig();
            updateCustomRoomConditionalUI();
        });
    });
    const reinforcements = document.getElementById('customReinforcements');
    if(reinforcements) reinforcements.addEventListener('change', () => {
        readCustomRoomConfig();
        updateCustomRoomConditionalUI();
    });
    applyCustomRoomConfigToUI(customRoomConfig);
}

function applyCustomRoomMapRules() {
    if(typeof gameMode === 'undefined' || gameMode !== 'custom') return;
    customRoomConfig = sanitizeCustomRoomConfig(customRoomConfig);
    if(typeof bases !== 'undefined') {
        ['blue', 'red'].forEach(team => {
            if(!bases[team]) return;
            bases[team].hp = customRoomConfig.baseHp;
            bases[team].maxHp = customRoomConfig.baseHp;
            bases[team].invulnerable = customRoomConfig.rule !== 'base';
        });
    }
    if(typeof outposts === 'undefined') return;
    if(customRoomConfig.outpostCount < outposts.length) outposts = outposts.slice(0, customRoomConfig.outpostCount);
    while(outposts.length < customRoomConfig.outpostCount) {
        const index = outposts.length;
        const angle = -Math.PI / 2 + index * (Math.PI * 2 / Math.max(1, customRoomConfig.outpostCount));
        const radius = Math.min(CONFIG.mapWidth, CONFIG.mapHeight) * .24;
        const floor = currentMap === 'factory' ? index % 3 : null;
        outposts.push({
            x: CONFIG.mapWidth / 2 + Math.cos(angle) * radius,
            y: CONFIG.mapHeight / 2 + Math.sin(angle) * radius,
            name: String.fromCharCode(65 + index),
            factoryFloor: floor,
            z: floor !== null && typeof getFactoryFloorZ === 'function' ? getFactoryFloorZ(floor) : 0,
            owner: null,
            captureProgress: 0,
            capturingTeam: null,
            radius: CONFIG.outpostRadius
        });
    }
}

function getCustomTankPool() {
    return sanitizeCustomRoomConfig(customRoomConfig).tankPool;
}
