// ==================== 每日任务 ====================
const DAILY_TASK_REWARDS = Object.freeze({
    signIn: 50,
    featuredKills: 150,
    victory: 150,
    survival: 120
});

function getDailyDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function hashDailyDateKey(dateKey) {
    return String(dateKey).split('').reduce((hash, character) => {
        return ((hash * 31) + character.charCodeAt(0)) >>> 0;
    }, 2166136261);
}

function isDailyTaskTankAvailable(tankType) {
    if(typeof TANKS === 'undefined' || !TANKS[tankType]) return false;
    const tank = TANKS[tankType];
    return !tank.isHidden || (typeof isTankUnlocked === 'function' && isTankUnlocked(tankType));
}

function getDailyTaskTankTypes() {
    if(typeof TANKS === 'undefined') return [];
    return Object.keys(TANKS).filter(isDailyTaskTankAvailable);
}

function createDailyTaskState(dateKey = getDailyDateKey()) {
    const tankTypes = getDailyTaskTankTypes();
    const featuredTankType = tankTypes.length
        ? tankTypes[hashDailyDateKey(dateKey) % tankTypes.length]
        : null;
    return {
        version: 1,
        dateKey,
        featuredTankType,
        signIn: {
            claimed: false,
            reward: DAILY_TASK_REWARDS.signIn,
            rewardTankType: null
        },
        tasks: {
            featuredKills: {
                progress: 0,
                target: 3,
                reward: DAILY_TASK_REWARDS.featuredKills,
                rewarded: false,
                rewardTankType: featuredTankType
            },
            victory: {
                progress: 0,
                target: 1,
                reward: DAILY_TASK_REWARDS.victory,
                rewarded: false,
                rewardTankType: null
            },
            survival: {
                progress: 0,
                target: 120,
                reward: DAILY_TASK_REWARDS.survival,
                rewarded: false,
                rewardTankType: null
            }
        }
    };
}

function normalizeDailyTaskProgress(task, fallback) {
    const normalized = task && typeof task === 'object' ? task : {};
    return {
        progress: Math.max(0, Number(normalized.progress) || 0),
        target: fallback.target,
        reward: fallback.reward,
        rewarded: !!normalized.rewarded,
        rewardTankType: typeof normalized.rewardTankType === 'string'
            ? normalized.rewardTankType
            : fallback.rewardTankType
    };
}

function ensureDailyTaskState(dateKey = getDailyDateKey()) {
    if(typeof playerStats === 'undefined') return createDailyTaskState(dateKey);
    const saved = playerStats.dailyTasks;
    if(!saved || saved.dateKey !== dateKey) {
        playerStats.dailyTasks = createDailyTaskState(dateKey);
        if(typeof saveStats === 'function') saveStats();
        return playerStats.dailyTasks;
    }

    const fallback = createDailyTaskState(dateKey);
    if(!isDailyTaskTankAvailable(saved.featuredTankType)) {
        saved.featuredTankType = fallback.featuredTankType;
    }
    saved.version = 1;
    saved.signIn = saved.signIn && typeof saved.signIn === 'object' ? saved.signIn : {};
    saved.signIn.claimed = !!saved.signIn.claimed;
    saved.signIn.reward = DAILY_TASK_REWARDS.signIn;
    saved.signIn.rewardTankType = typeof saved.signIn.rewardTankType === 'string'
        ? saved.signIn.rewardTankType
        : null;
    saved.tasks = saved.tasks && typeof saved.tasks === 'object' ? saved.tasks : {};
    fallback.tasks.featuredKills.rewardTankType = saved.featuredTankType;
    saved.tasks.featuredKills = normalizeDailyTaskProgress(saved.tasks.featuredKills, fallback.tasks.featuredKills);
    saved.tasks.victory = normalizeDailyTaskProgress(saved.tasks.victory, fallback.tasks.victory);
    saved.tasks.survival = normalizeDailyTaskProgress(saved.tasks.survival, fallback.tasks.survival);
    return saved;
}

function getDailyTaskCompletionCount(state = ensureDailyTaskState()) {
    let completed = state.signIn.claimed ? 1 : 0;
    Object.values(state.tasks).forEach(task => {
        if(task.rewarded) completed++;
    });
    return completed;
}

function awardDailyTaskXp(taskId, tankType) {
    const state = ensureDailyTaskState();
    const task = state.tasks[taskId];
    if(!task || task.rewarded || !isDailyTaskTankAvailable(tankType)) return false;
    task.progress = Math.max(task.progress, task.target);
    task.rewarded = true;
    task.rewardTankType = tankType;
    if(typeof updateTankMastery === 'function') {
        updateTankMastery(tankType, { xp: task.reward });
    }
    if(typeof saveStats === 'function') saveStats();
    if(typeof showNotification === 'function') {
        const tankName = TANKS[tankType] ? TANKS[tankType].name : tankType;
        showNotification(`📅 每日任务完成：${tankName} +${task.reward} XP`, '#76e6ff');
    }
    refreshDailyTaskUI();
    return true;
}

function claimDailySignIn(tankType = null) {
    const state = ensureDailyTaskState();
    if(state.signIn.claimed) return false;
    const select = typeof document !== 'undefined' ? document.getElementById('dailyRewardTankSelect') : null;
    const rewardTankType = tankType || (select ? select.value : null) ||
        (typeof selectedTank === 'string' ? selectedTank : null) ||
        state.featuredTankType;
    if(!isDailyTaskTankAvailable(rewardTankType)) return false;

    state.signIn.claimed = true;
    state.signIn.rewardTankType = rewardTankType;
    if(typeof updateTankMastery === 'function') {
        updateTankMastery(rewardTankType, { xp: state.signIn.reward });
    }
    if(typeof saveStats === 'function') saveStats();
    if(typeof showNotification === 'function') {
        showNotification(`📅 签到成功：${TANKS[rewardTankType].name} +${state.signIn.reward} XP`, '#ffd85a');
    }
    refreshDailyTaskUI();
    return true;
}

function recordDailyTaskKill(tankType) {
    const state = ensureDailyTaskState();
    const task = state.tasks.featuredKills;
    if(task.rewarded || tankType !== state.featuredTankType) return false;
    task.progress = Math.min(task.target, task.progress + 1);
    if(typeof saveStats === 'function') saveStats();
    if(task.progress >= task.target) return awardDailyTaskXp('featuredKills', tankType);
    refreshDailyTaskUI();
    return true;
}

function recordDailyTaskMatchResult(tankType, performance = {}) {
    if(!isDailyTaskTankAvailable(tankType)) return false;
    const state = ensureDailyTaskState();
    let changed = false;

    if(performance.victory && !state.tasks.victory.rewarded) {
        state.tasks.victory.progress = 1;
        changed = awardDailyTaskXp('victory', tankType) || changed;
    }

    if(!state.tasks.survival.rewarded) {
        const survivalSeconds = Math.max(0, Math.floor(Number(performance.survivalSeconds) || 0));
        state.tasks.survival.progress = Math.min(
            state.tasks.survival.target,
            Math.max(state.tasks.survival.progress, survivalSeconds)
        );
        changed = survivalSeconds > 0 || changed;
        if(state.tasks.survival.progress >= state.tasks.survival.target) {
            changed = awardDailyTaskXp('survival', tankType) || changed;
        }
    }

    if(changed && typeof saveStats === 'function') saveStats();
    refreshDailyTaskUI();
    return changed;
}

function getDailyTaskCards(state = ensureDailyTaskState()) {
    const featuredName = state.featuredTankType && TANKS[state.featuredTankType]
        ? TANKS[state.featuredTankType].name
        : '指定坦克';
    return [
        {
            id: 'signIn',
            icon: '🎁',
            title: '每日签到',
            desc: '选择一辆坦克领取今日签到经验',
            progress: state.signIn.claimed ? 1 : 0,
            target: 1,
            reward: state.signIn.reward,
            completed: state.signIn.claimed,
            rewardTankType: state.signIn.rewardTankType
        },
        {
            id: 'featuredKills',
            icon: '🎯',
            title: `${featuredName}出击`,
            desc: `使用${featuredName}击杀3辆敌方坦克`,
            ...state.tasks.featuredKills,
            completed: state.tasks.featuredKills.rewarded
        },
        {
            id: 'victory',
            icon: '🏆',
            title: '今日首胜',
            desc: '使用任意坦克赢得1局战斗',
            ...state.tasks.victory,
            completed: state.tasks.victory.rewarded
        },
        {
            id: 'survival',
            icon: '⏱️',
            title: '坚守战场',
            desc: '任意一局存活至少120秒',
            ...state.tasks.survival,
            completed: state.tasks.survival.rewarded
        }
    ];
}

function renderDailyTasksPanel() {
    if(typeof document === 'undefined') return;
    const state = ensureDailyTaskState();
    const summary = document.getElementById('dailyTaskSummary');
    const list = document.getElementById('dailyTaskList');
    const signInControls = document.getElementById('dailySignInControls');
    if(!summary || !list || !signInControls) return;

    const availableTanks = getDailyTaskTankTypes();
    const defaultTank = state.signIn.rewardTankType ||
        (typeof selectedTank === 'string' && isDailyTaskTankAvailable(selectedTank) ? selectedTank : null) ||
        state.featuredTankType ||
        availableTanks[0];
    const completed = getDailyTaskCompletionCount(state);
    summary.textContent = `${state.dateKey} · 今日已完成 ${completed}/4 · 每日零点刷新`;
    signInControls.innerHTML = state.signIn.claimed
        ? `<div class="daily-signin-claimed">✓ 今日已签到 · ${TANKS[state.signIn.rewardTankType]?.name || '坦克'} +${state.signIn.reward} XP</div>`
        : `
            <label for="dailyRewardTankSelect">签到经验加给</label>
            <select id="dailyRewardTankSelect">
                ${availableTanks.map(type => `<option value="${type}"${type === defaultTank ? ' selected' : ''}>${TANKS[type].name}</option>`).join('')}
            </select>
            <button type="button" onclick="claimDailySignIn()">签到并领取 +${state.signIn.reward} XP</button>
        `;

    list.innerHTML = getDailyTaskCards(state).map(card => {
        const progress = Math.min(1, card.progress / Math.max(1, card.target));
        const rewardTank = card.rewardTankType && TANKS[card.rewardTankType]
            ? ` · 已发给${TANKS[card.rewardTankType].name}`
            : '';
        return `
            <article class="daily-task-card${card.completed ? ' completed' : ''}">
                <div class="daily-task-icon">${card.icon}</div>
                <div class="daily-task-copy">
                    <div class="daily-task-head"><strong>${card.title}</strong><span>+${card.reward} XP</span></div>
                    <p>${card.desc}</p>
                    <div class="daily-task-progress"><i style="width:${Math.round(progress * 100)}%"></i></div>
                    <small>${Math.min(card.progress, card.target)}/${card.target}${card.completed ? ` · 已完成${rewardTank}` : ''}</small>
                </div>
            </article>
        `;
    }).join('');
}

function updateDailyTaskMenuBadge() {
    if(typeof document === 'undefined') return;
    const button = document.getElementById('btnDailyTasks');
    if(!button) return;
    const state = ensureDailyTaskState();
    button.textContent = `📅 每日任务 ${getDailyTaskCompletionCount(state)}/4`;
    button.classList.toggle('daily-all-complete', getDailyTaskCompletionCount(state) >= 4);
}

function refreshDailyTaskUI() {
    updateDailyTaskMenuBadge();
    if(typeof document === 'undefined') return;
    const panel = document.getElementById('dailyTasksPanel');
    if(panel && panel.style.display !== 'none') renderDailyTasksPanel();
}

function showDailyTasksPanel() {
    if(typeof closeInfoPanels === 'function') closeInfoPanels('dailyTasksPanel');
    renderDailyTasksPanel();
    const panel = document.getElementById('dailyTasksPanel');
    if(panel) panel.style.display = 'block';
}

function initializeDailyTasks() {
    ensureDailyTaskState();
    updateDailyTaskMenuBadge();
}
