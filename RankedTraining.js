// ==================== 段位赛季 + 训练场 ====================
const RANKED_SEASON_EPOCH = Date.UTC(2026, 0, 5);
const RANKED_SEASON_DAYS = 56;
const RANKED_PLACEMENT_MATCHES = 5;
const RANKED_TIERS = Object.freeze([
    { key:'bronze', name:'青铜', icon:'◆', color:'#bd845d', min:0 },
    { key:'silver', name:'白银', icon:'◆◆', color:'#c9d4dc', min:400 },
    { key:'gold', name:'黄金', icon:'◆◆◆', color:'#ffd45c', min:800 },
    { key:'platinum', name:'铂金', icon:'✦', color:'#62e2d0', min:1200 },
    { key:'diamond', name:'钻石', icon:'✦✦', color:'#64b8ff', min:1600 },
    { key:'master', name:'大师', icon:'♜', color:'#bd7bff', min:2000 },
    { key:'grandmaster', name:'宗师', icon:'♛', color:'#ff6b8a', min:2400 },
    { key:'legend', name:'传奇战神', icon:'★', color:'#ffe76a', min:2800 }
]);

const SEASON_GOALS = Object.freeze([
    { key:'placements', name:'完成定级', description:'完成 5 场排位赛', test:state => state.matches >= 5 },
    { key:'wins', name:'钢铁连胜', description:'本赛季取得 10 场胜利', test:state => state.wins >= 10 },
    { key:'gold', name:'黄金车长', description:'达到黄金段位', test:state => state.bestRating >= 800 },
    { key:'veteran', name:'百战先锋', description:'排位累计击毁 50 辆敌军', test:state => state.kills >= 50 }
]);

const TRAINING_HINTS = Object.freeze([
    'WASD 移动 · 鼠标控制炮塔 · 左键射击',
    '按 1/2/3/4 切换主炮、机枪、高射炮和特殊武器',
    '按 G 释放终极技能；训练场会立即完成冷却',
    '观察弹道落点，用 [ 和 ] 调整主炮仰角',
    '静止、移动与重甲靶车会循环复位，可反复测试元素效果'
]);

let currentRankedMatchSettled = false;
let lastRankedAward = null;
let trainingSession = null;

function getCurrentRankedSeason(now = Date.now()) {
    const seasonMs = RANKED_SEASON_DAYS * 86400000;
    const index = Math.max(0, Math.floor((now - RANKED_SEASON_EPOCH) / seasonMs));
    const startAt = RANKED_SEASON_EPOCH + index * seasonMs;
    const endAt = startAt + seasonMs;
    return {
        id:`S${index + 1}-2026`, number:index + 1,
        name:`第 ${index + 1} 赛季 · 钢铁征途`, startAt, endAt,
        remainingDays:Math.max(0, Math.ceil((endAt - now) / 86400000))
    };
}

function getRankedTier(rating = 0) {
    const score = Math.max(0, Number(rating) || 0);
    return [...RANKED_TIERS].reverse().find(tier => score >= tier.min) || RANKED_TIERS[0];
}

function getRankedProfile(state = ensureRankedSeasonState()) {
    const tier = getRankedTier(state.rating);
    const tierIndex = RANKED_TIERS.indexOf(tier);
    const next = RANKED_TIERS[tierIndex + 1] || null;
    const progress = next
        ? Math.max(0, Math.min(1, (state.rating - tier.min) / (next.min - tier.min)))
        : 1;
    return {
        ...tier, rating:state.rating, next,
        progress, placementRemaining:Math.max(0, RANKED_PLACEMENT_MATCHES - state.matches),
        displayName:state.matches < RANKED_PLACEMENT_MATCHES
            ? `定级赛 ${state.matches}/${RANKED_PLACEMENT_MATCHES}`
            : tier.name
    };
}

function createRankedSeasonState(season, seedRating = 0) {
    return {
        id:season.id, name:season.name, rating:Math.max(0, Math.round(seedRating)),
        bestRating:Math.max(0, Math.round(seedRating)), matches:0, wins:0, losses:0, draws:0,
        kills:0, winStreak:0, bestWinStreak:0, lastDelta:0, updatedAt:Date.now()
    };
}

function ensureRankedSeasonState(now = Date.now()) {
    if(typeof playerStats === 'undefined') return createRankedSeasonState(getCurrentRankedSeason(now));
    const season = getCurrentRankedSeason(now);
    if(!Array.isArray(playerStats.rankedHistory)) playerStats.rankedHistory = [];
    const previous = playerStats.rankedSeason;
    if(!previous || typeof previous !== 'object' || previous.id !== season.id) {
        let seedRating = 0;
        if(previous && previous.id && (previous.matches || 0) > 0) {
            playerStats.rankedHistory.unshift({
                id:previous.id, name:previous.name || previous.id,
                rating:Math.max(0, Number(previous.rating) || 0),
                bestRating:Math.max(0, Number(previous.bestRating) || 0),
                matches:Math.max(0, Number(previous.matches) || 0),
                wins:Math.max(0, Number(previous.wins) || 0)
            });
            playerStats.rankedHistory = playerStats.rankedHistory.slice(0, 8);
            seedRating = Math.min(700, Math.floor((Number(previous.rating) || 0) * .25));
        }
        playerStats.rankedSeason = createRankedSeasonState(season, seedRating);
    }
    const state = playerStats.rankedSeason;
    ['rating','bestRating','matches','wins','losses','draws','kills','winStreak','bestWinStreak'].forEach(key => {
        state[key] = Math.max(0, Number(state[key]) || 0);
    });
    state.lastDelta = Number(state.lastDelta) || 0;
    state.name = season.name;
    return state;
}

function initializeSeasonSystems() {
    ensureRankedSeasonState();
    refreshSeasonHomeSummary();
}

function resetRankedMatchSettlement() {
    currentRankedMatchSettled = false;
    lastRankedAward = null;
    const result = document.getElementById('resultRankedRating');
    if(result) {
        result.textContent = '';
        result.style.display = 'none';
    }
}

function calculateRankedDelta(result, performance = {}, state = ensureRankedSeasonState()) {
    const kills = Math.max(0, Number(performance.kills) || 0);
    const blueScore = Math.max(0, Number(performance.blueScore) || 0);
    const redScore = Math.max(0, Number(performance.redScore) || 0);
    const scoreTotal = Math.max(1, blueScore + redScore);
    const scoreBonus = Math.max(-4, Math.min(4, Math.round((blueScore - redScore) / scoreTotal * 10)));
    const killBonus = Math.min(12, kills * 2);
    const placementBonus = state.matches < RANKED_PLACEMENT_MATCHES && result === 'victory' ? 8 : 0;
    if(result === 'victory') return 28 + killBonus + Math.max(0, scoreBonus) + Math.min(6, state.winStreak * 2) + placementBonus;
    if(result === 'draw') return Math.max(0, 3 + Math.floor(killBonus / 2) + scoreBonus);
    return Math.min(-2, -18 + Math.floor(killBonus / 2) + Math.max(0, scoreBonus));
}

function settleRankedMatch(result) {
    if(typeof gameMode === 'undefined' || gameMode !== 'ranked' || currentRankedMatchSettled) return null;
    currentRankedMatchSettled = true;
    const state = ensureRankedSeasonState();
    const previousRating = state.rating;
    const previousTier = getRankedTier(previousRating);
    const performance = {
        kills:typeof playerStats !== 'undefined' ? playerStats.currentMatchKills || 0 : 0,
        blueScore:typeof teamScores !== 'undefined' ? teamScores.blue || 0 : 0,
        redScore:typeof teamScores !== 'undefined' ? teamScores.red || 0 : 0
    };
    const delta = calculateRankedDelta(result, performance, state);
    state.matches++;
    state.kills += performance.kills;
    if(result === 'victory') {
        state.wins++;
        state.winStreak++;
        state.bestWinStreak = Math.max(state.bestWinStreak, state.winStreak);
    } else {
        if(result === 'draw') state.draws++;
        else state.losses++;
        state.winStreak = 0;
    }
    state.rating = Math.max(0, state.rating + delta);
    state.bestRating = Math.max(state.bestRating, state.rating);
    state.lastDelta = delta;
    state.updatedAt = Date.now();
    const nextTier = getRankedTier(state.rating);
    lastRankedAward = {
        delta, previousRating, rating:state.rating,
        previousTier:previousTier.name, tier:nextTier.name,
        promoted:RANKED_TIERS.indexOf(nextTier) > RANKED_TIERS.indexOf(previousTier),
        result
    };
    const resultLine = document.getElementById('resultRankedRating');
    if(resultLine) {
        const sign = delta >= 0 ? '+' : '';
        resultLine.textContent = `${nextTier.icon} ${nextTier.name} · ${state.rating} RP（${sign}${delta}）${lastRankedAward.promoted ? ' · 晋级！' : ''}`;
        resultLine.style.display = 'block';
        resultLine.style.color = nextTier.color;
    }
    if(typeof saveStats === 'function') saveStats();
    refreshSeasonHomeSummary();
    return lastRankedAward;
}

function refreshSeasonHomeSummary() {
    const state = ensureRankedSeasonState();
    const season = getCurrentRankedSeason();
    const profile = getRankedProfile(state);
    const summary = document.getElementById('seasonHomeSummary');
    if(summary) {
        summary.textContent = `${profile.icon} ${profile.displayName} · ${state.rating} RP · 赛季剩余 ${season.remainingDays} 天`;
        summary.style.color = profile.color;
    }
}

function renderRankedSeasonPanel() {
    const panel = document.getElementById('rankedSeasonPanel');
    const content = document.getElementById('rankedSeasonContent');
    if(!panel || !content) return;
    const state = ensureRankedSeasonState();
    const season = getCurrentRankedSeason();
    const profile = getRankedProfile(state);
    const goals = SEASON_GOALS.map(goal => `
        <article class="season-goal ${goal.test(state) ? 'complete' : ''}">
            <span>${goal.test(state) ? '✓' : '○'}</span><div><strong>${goal.name}</strong><small>${goal.description}</small></div>
        </article>`).join('');
    const ladder = RANKED_TIERS.map(tier => `
        <div class="rank-ladder-step ${tier.key === profile.key ? 'current' : ''}" style="--rank-color:${tier.color}">
            <span>${tier.icon}</span><strong>${tier.name}</strong><small>${tier.min} RP</small>
        </div>`).join('');
    const history = (playerStats.rankedHistory || []).length
        ? playerStats.rankedHistory.map(item => `<li><span>${item.name}</span><strong>${getRankedTier(item.rating).name} · ${item.rating} RP</strong></li>`).join('')
        : '<li><span>完成本赛季后将在这里保留最高段位</span></li>';
    content.innerHTML = `
        <header class="season-hero" style="--rank-color:${profile.color}">
            <div><small>${season.name} · 剩余 ${season.remainingDays} 天</small><h2>${profile.icon} ${profile.displayName}</h2><p>${state.rating} RP · ${state.wins}胜 ${state.losses}负 · 最高连胜 ${state.bestWinStreak}</p></div>
            <div class="season-emblem">${profile.icon}</div>
        </header>
        <div class="season-progress"><div style="width:${Math.round(profile.progress * 100)}%;background:${profile.color}"></div></div>
        <p class="season-next">${profile.next ? `距离 ${profile.next.name} 还需 ${profile.next.min - state.rating} RP` : '已到达最高段位，继续冲击赛季最高分'}</p>
        <section><h3>段位阶梯</h3><div class="rank-ladder">${ladder}</div></section>
        <section><h3>赛季目标</h3><div class="season-goals">${goals}</div></section>
        <section><h3>历届战绩</h3><ul class="season-history">${history}</ul></section>`;
}

function showRankedSeasonPanel() {
    if(typeof closeInfoPanels === 'function') closeInfoPanels('rankedSeasonPanel');
    renderRankedSeasonPanel();
    const panel = document.getElementById('rankedSeasonPanel');
    if(panel) panel.classList.add('active');
}

function closeRankedSeasonPanel() {
    const panel = document.getElementById('rankedSeasonPanel');
    if(panel) panel.classList.remove('active');
}

function configureTrainingTarget(tank, index, resetPosition = true) {
    if(!tank) return;
    if(resetPosition && typeof player !== 'undefined' && player) {
        const angles = [-.72, -.34, 0, .34, .72];
        const distance = 360 + (index % 2) * 150;
        let x = player.x + Math.cos(angles[index % angles.length]) * distance;
        let y = player.y + Math.sin(angles[index % angles.length]) * distance;
        x = Math.max(CONFIG.tankSize * 2, Math.min(CONFIG.mapWidth - CONFIG.tankSize * 2, x));
        y = Math.max(CONFIG.tankSize * 2, Math.min(CONFIG.mapHeight - CONFIG.tankSize * 2, y));
        tank.x = x; tank.y = y;
    }
    tank.dead = false;
    tank.hp = tank.maxHp;
    tank.invincible = .35;
    tank.trainingDummy = true;
    tank.trainingMoving = index === 4;
    tank.trainingIndex = index;
    tank.trainingBaseX = tank.x;
    tank.trainingBaseY = tank.y;
    tank.trainingRespawnTimer = 0;
    tank.canMove = false;
    tank.target = null;
    tank.shells = 0; tank.mg = 0; tank.aa = 0;
}

function initializeTrainingMode() {
    if(typeof gameMode === 'undefined' || gameMode !== 'training' || !player) return;
    trainingSession = { elapsed:0, hintIndex:0, resets:0 };
    player.trainingMode = true;
    player.suddenDeathInfiniteAmmo = true;
    player.invincible = Infinity;
    player.hp = player.maxHp;
    player.ultimateCooldown = 0;
    if(typeof bases !== 'undefined') Object.values(bases).filter(Boolean).forEach(base => { base.invulnerable = true; });
    enemies.forEach((tank,index) => configureTrainingTarget(tank,index,true));
    if(typeof aiTanks !== 'undefined') aiTanks = [...allies, ...enemies];
    const controls = document.getElementById('trainingControls');
    if(controls) controls.style.display = 'flex';
    const nextHintButton = document.getElementById('trainingNextHint');
    const resetButton = document.getElementById('trainingResetTargets');
    const exitButton = document.getElementById('trainingExit');
    if(nextHintButton) nextHintButton.onclick = nextTrainingHint;
    if(resetButton) resetButton.onclick = resetTrainingTargets;
    if(exitButton) exitButton.onclick = endTrainingSession;
    updateTrainingHint();
    if(typeof showMessage === 'function') showMessage('训练场已启动 · 无限弹药与终极技能 · 靶车不会还击', '#74e8ff');
}

function updateTrainingMode(dt) {
    if(typeof gameMode === 'undefined' || gameMode !== 'training' || !trainingSession || !player) return;
    trainingSession.elapsed += dt;
    player.dead = false;
    player.hp = player.maxHp;
    player.suddenDeathInfiniteAmmo = true;
    player.shells = Math.max(player.shells || 0, player.maxShells || 1);
    player.mg = Math.max(player.mg || 0, player.maxMG || 1);
    player.aa = Math.max(player.aa || 0, player.maxAA || 1);
    player.smoke = player.maxSmoke || player.smoke;
    player.ultimateCooldown = 0;
    enemies.forEach((tank,index) => {
        if(tank.dead || tank.hp <= 0) {
            tank.trainingRespawnTimer = (tank.trainingRespawnTimer || 1.25) - dt;
            if(tank.trainingRespawnTimer <= 0) configureTrainingTarget(tank,index,true);
            return;
        }
        if(tank.trainingMoving) {
            const offset = Math.sin(trainingSession.elapsed * .85) * 145;
            tank.y = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapHeight - CONFIG.tankSize, tank.trainingBaseY + offset));
            tank.angle = Math.cos(trainingSession.elapsed * .85) >= 0 ? Math.PI / 2 : -Math.PI / 2;
            tank.turretAngle = tank.angle;
        }
    });
}

function resetTrainingTargets() {
    if(typeof gameMode === 'undefined' || gameMode !== 'training') return false;
    enemies.forEach((tank,index) => configureTrainingTarget(tank,index,true));
    if(trainingSession) trainingSession.resets++;
    if(typeof showMessage === 'function') showMessage('训练靶车已全部复位', '#80ecff');
    return true;
}

function updateTrainingHint() {
    const hint = document.getElementById('trainingHint');
    if(hint && trainingSession) hint.textContent = `提示 ${trainingSession.hintIndex + 1}/${TRAINING_HINTS.length}：${TRAINING_HINTS[trainingSession.hintIndex]}`;
}

function nextTrainingHint() {
    if(!trainingSession) return;
    trainingSession.hintIndex = (trainingSession.hintIndex + 1) % TRAINING_HINTS.length;
    updateTrainingHint();
}

function endTrainingSession() {
    trainingSession = null;
    const controls = document.getElementById('trainingControls');
    if(controls) controls.style.display = 'none';
    if(typeof returnToHome === 'function') returnToHome();
}
