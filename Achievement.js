// ==================== 成就系统 ====================


// ==================== 成就系统 v2.0 ====================
const ACHIEVEMENTS = {
    
// ========== 🟢 简单（新手友好）==========
    // 战斗类
    firstBlood: { 
        id: 'firstBlood', name: '🔴 第一滴血', desc: '首次击毁敌方坦克', 
        icon: '🩸', category: 'combat', difficulty: 'easy',
        condition: (stats) => stats.kills >= 1 
    },
    rookieShooter: { 
        id: 'rookieShooter', name: '🎯 见习射手', desc: '累计击毁10辆敌方坦克', 
        icon: '🎯', category: 'combat', difficulty: 'easy',
        condition: (stats) => stats.kills >= 10 
    },

    // 武器类
    triggerHappy: { 
        id: 'triggerHappy', name: '🔫 扳机狂人', desc: '累计发射100发主炮', 
        icon: '💥', category: 'weapon', difficulty: 'easy',
        condition: (stats) => stats.shellsFired >= 100 
    },
    sprayAndPray: { 
        id: 'sprayAndPray', name: '💨 火力压制', desc: '累计发射500发机枪', 
        icon: '🔥', category: 'weapon', difficulty: 'easy',
        condition: (stats) => stats.mgFired >= 500 
    },
    aaRookie: { 
        id: 'aaRookie', name: '🚀 防空新手', desc: '累计发射50发高射炮', 
        icon: '🚀', category: 'weapon', difficulty: 'easy',
        condition: (stats) => stats.aaFired >= 50 
    },
    smokeRookie: {
        id: 'smokeRookie', name: '💨 烟幕初体验', desc: '首次部署烟雾弹',
        icon: '💨', category: 'weapon', difficulty: 'easy',
        condition: (stats) => (stats.smokeGrenadesDeployed || 0) >= 1
    },

    // 据点类
    flagRaiser: { 
        id: 'flagRaiser', name: '🏴 升旗手', desc: '累计占领3个据点', 
        icon: '🏴', category: 'outpost', difficulty: 'easy',
        condition: (stats) => stats.outpostsCaptured >= 3 
    },

    // 模式类
    firstWin: { 
        id: 'firstWin', name: '🏆 首胜', desc: '首次获得任意模式胜利', 
        icon: '🏆', category: 'mode', difficulty: 'easy',
        condition: (stats) => stats.totalWins >= 1 
    },

    // 生存类
    survivor: { 
        id: 'survivor', name: '⏱️ 幸存者', desc: '单局存活超过2分钟', 
        icon: '⏱️', category: 'survival', difficulty: 'easy',
        condition: (stats) => stats.maxSurvivalTime >= 120 
    },

    // 收集类
    tankRookie: { 
        id: 'tankRookie', name: '🚗 坦克新兵', desc: '使用3种不同类型的坦克', 
        icon: '🚗', category: 'collection', difficulty: 'easy',
        condition: (stats) => stats.tanksUsed.length >= 3 
    },

    
// ========== 🟡 中等（需要一定熟练度）==========
    // 战斗类
    veteranShooter: { 
        id: 'veteranShooter', name: '💀 老兵射手', desc: '累计击毁50辆敌方坦克', 
        icon: '💀', category: 'combat', difficulty: 'medium',
        condition: (stats) => stats.kills >= 50 
    },
    unstoppable: { 
        id: 'unstoppable', name: '🔥 势不可挡', desc: '单局击毁8辆敌方坦克', 
        icon: '⚡', category: 'combat', difficulty: 'medium',
        condition: (stats) => stats.maxKillsInMatch >= 8 
    },

    // 武器类
    shellMaster: { 
        id: 'shellMaster', name: '💣 炮弹大师', desc: '累计发射500发主炮', 
        icon: '🎆', category: 'weapon', difficulty: 'medium',
        condition: (stats) => stats.shellsFired >= 500 
    },
    mgMaster: { 
        id: 'mgMaster', name: '⚡ 机枪大师', desc: '累计发射2000发机枪', 
        icon: '⚡', category: 'weapon', difficulty: 'medium',
        condition: (stats) => stats.mgFired >= 2000 
    },
    aaMaster: { 
        id: 'aaMaster', name: '🎯 防空大师', desc: '累计发射200发高射炮', 
        icon: '🎯', category: 'weapon', difficulty: 'medium',
        condition: (stats) => stats.aaFired >= 200 
    },
    ultimateRookie: { 
        id: 'ultimateRookie', name: '✨ 初露锋芒', desc: '累计释放10次终极技能', 
        icon: '✨', category: 'weapon', difficulty: 'medium',
        condition: (stats) => stats.ultimatesUsed >= 10 
    },
    quickSmokeExpert: {
        id: 'quickSmokeExpert', name: '🌫️ 烟中恶鬼', desc: '使用 Q 键在脚下快速部署20次烟幕',
        icon: '🌫️', category: 'weapon', difficulty: 'medium',
        condition: (stats) => (stats.quickSmokeDeploys || 0) >= 20
    },

    // 据点类
    outpostVeteran: { 
        id: 'outpostVeteran', name: '🏰 据点老兵', desc: '累计占领15个据点', 
        icon: '🏰', category: 'outpost', difficulty: 'medium',
        condition: (stats) => stats.outpostsCaptured >= 15 
    },

    // 基地类
    baseBuster: { 
        id: 'baseBuster', name: '💥 基地破坏者', desc: '累计摧毁敌方基地3次', 
        icon: '💥', category: 'base', difficulty: 'medium',
        condition: (stats) => stats.basesDestroyed >= 3 
    },

    // 模式类
    modeExplorer: { 
        id: 'modeExplorer', name: '🎮 模式探索者', desc: '在3种不同模式中获得胜利', 
        icon: '🎮', category: 'mode', difficulty: 'medium',
        condition: (stats) => stats.modesWon.length >= 3 
    },
    escortChampion: {
        id: 'escortChampion', name: '🚛 钢铁护卫', desc: '护送模式获胜3次',
        icon: '🚛', category: 'mode', difficulty: 'medium',
        condition: (stats) => stats.escortWins >= 3
    },
    defenseHero: { 
        id: 'defenseHero', name: '🛡️ 防守英雄', desc: '守点模式成功防守2次', 
        icon: '🛡️', category: 'mode', difficulty: 'medium',
        condition: (stats) => stats.defenseWins >= 2 
    },

    // 生存类
    ironWill: { 
        id: 'ironWill', name: '💪 钢铁意志', desc: '单局存活超过4分钟', 
        icon: '💪', category: 'survival', difficulty: 'medium',
        condition: (stats) => stats.maxSurvivalTime >= 240 
    },
    closeCall: { 
        id: 'closeCall', name: '😰 死里逃生', desc: '在HP低于20%的情况下存活超过30秒', 
        icon: '😰', category: 'survival', difficulty: 'medium',
        condition: (stats) => stats.lowHpSurvives >= 1 
    },

    // 特殊类
    speedDemon: { 
        id: 'speedDemon', name: '💨 速度恶魔', desc: '使用高速坦克达到速度12以上', 
        icon: '⚡', category: 'special', difficulty: 'medium',
        condition: (stats) => stats.maxSpeedReached >= 12 
    },
    ghostWalker: { 
        id: 'ghostWalker', name: '👻 幽灵行者', desc: '使用左研30隐身状态下击毁3辆坦克', 
        icon: '👻', category: 'special', difficulty: 'medium',
        condition: (stats) => stats.ghostKills >= 3 
    },
    fieldRefit: {
        id: 'fieldRefit', name: '🔧 战地改装', desc: '累计选择3次战损升级',
        icon: '🔧', category: 'special', difficulty: 'medium',
        condition: (stats) => (stats.damageUpgradesChosen || 0) >= 3
    },

    // 收集类
    tankCollector: { 
        id: 'tankCollector', name: '🏎️ 坦克收藏家', desc: '使用8种不同类型的坦克', 
        icon: '🏎️', category: 'collection', difficulty: 'medium',
        condition: (stats) => stats.tanksUsed.length >= 8 
    },
    seriesExplorer: { 
        id: 'seriesExplorer', name: '🔍 系列探索者', desc: '使用两个不同系列的坦克', 
        icon: '🔍', category: 'collection', difficulty: 'medium',
        condition: (stats) => stats.seriesUsed.length >= 2 
    },

    
// ========== 🔴 困难（挑战型玩家）==========
    // 战斗类
    tankAce: { 
        id: 'tankAce', name: '👑 坦克王牌', desc: '累计击毁150辆敌方坦克', 
        icon: '👑', category: 'combat', difficulty: 'hard',
        condition: (stats) => stats.kills >= 150 
    },
    massacre: { 
        id: 'massacre', name: '🔥 大屠杀', desc: '单局击毁15辆敌方坦克', 
        icon: '🔥', category: 'combat', difficulty: 'hard',
        condition: (stats) => stats.maxKillsInMatch >= 15 
    },

    // 武器类
    shellGod: { 
        id: 'shellGod', name: '☄️ 炮弹之神', desc: '累计发射2000发主炮', 
        icon: '☄️', category: 'weapon', difficulty: 'hard',
        condition: (stats) => stats.shellsFired >= 2000 
    },
    mgGod: { 
        id: 'mgGod', name: '🌪️ 机枪之神', desc: '累计发射8000发机枪', 
        icon: '🌪️', category: 'weapon', difficulty: 'hard',
        condition: (stats) => stats.mgFired >= 8000 
    },
    aaGod: { 
        id: 'aaGod', name: '🌟 防空之神', desc: '累计发射500发高射炮', 
        icon: '🌟', category: 'weapon', difficulty: 'hard',
        condition: (stats) => stats.aaFired >= 500 
    },
    ultimateMaster: { 
        id: 'ultimateMaster', name: '⚡ 终极大师', desc: '累计释放30次终极技能', 
        icon: '⚡', category: 'weapon', difficulty: 'hard',
        condition: (stats) => stats.ultimatesUsed >= 30 
    },

    // 据点类
    outpostKing: { 
        id: 'outpostKing', name: '👑 据点之王', desc: '累计占领50个据点', 
        icon: '👑', category: 'outpost', difficulty: 'hard',
        condition: (stats) => stats.outpostsCaptured >= 50 
    },

    // 基地类
    baseDestroyer: { 
        id: 'baseDestroyer', name: '🏰 基地毁灭者', desc: '累计摧毁敌方基地8次', 
        icon: '🏰', category: 'base', difficulty: 'hard',
        condition: (stats) => stats.basesDestroyed >= 8 
    },

    // 模式类
    modeMaster: { 
        id: 'modeMaster', name: '🎖️ 模式大师', desc: '在全部6种模式中获得胜利', 
        icon: '🎖️', category: 'mode', difficulty: 'hard',
        condition: (stats) => stats.modesWon.length >= 6 
    },
    deathmatchChampion: {
        id: 'deathmatchChampion', name: '💀 死斗冠军', desc: '死斗模式获胜3次',
        icon: '💀', category: 'mode', difficulty: 'hard',
        condition: (stats) => stats.deathmatchWins >= 3
    },
    bossHunter: {
        id: 'bossHunter', name: '👑 首领猎手', desc: '首领模式获胜3次',
        icon: '👑', category: 'mode', difficulty: 'hard',
        condition: (stats) => stats.bossWins >= 3
    },
    sneakAssassin: { 
        id: 'sneakAssassin', name: '🗡️ 暗夜刺客', desc: '绝地偷袭模式获胜3次', 
        icon: '🗡️', category: 'mode', difficulty: 'hard',
        condition: (stats) => stats.sneakWins >= 3 
    },

    // 生存类
    unkillable: { 
        id: 'unkillable', name: '🛡️ 不死之身', desc: '单局存活满5分钟', 
        icon: '🛡️', category: 'survival', difficulty: 'hard',
        condition: (stats) => stats.maxSurvivalTime >= 300 
    },
    phoenix: { 
        id: 'phoenix', name: '🔥 凤凰涅槃', desc: '在HP低于10%的情况下击毁敌方坦克', 
        icon: '🔥', category: 'survival', difficulty: 'hard',
        condition: (stats) => stats.lowHpKills >= 1 
    },

    // 特殊类
    comeback: { 
        id: 'comeback', name: '🔄 绝地翻盘', desc: '在己方据点数为0的情况下获胜', 
        icon: '🔄', category: 'special', difficulty: 'hard',
        condition: (stats) => stats.comebackWins >= 1 
    },
    perfectGame: { 
        id: 'perfectGame', name: '💎 完美游戏', desc: '单局0死亡且击毁10辆敌方坦克', 
        icon: '💎', category: 'special', difficulty: 'hard',
        condition: (stats) => stats.perfectGames >= 1 
    },
    battleHardened: {
        id: 'battleHardened', name: '⚙️ 百战之躯', desc: '累计选择10次战损升级',
        icon: '⚙️', category: 'special', difficulty: 'hard',
        condition: (stats) => (stats.damageUpgradesChosen || 0) >= 10
    },

    // 收集类
    tankMaster: { 
        id: 'tankMaster', name: '🏆 坦克大师', desc: '使用全部15种以上的坦克', 
        icon: '🏆', category: 'collection', difficulty: 'hard',
        condition: (stats) => stats.tanksUsed.length >= 15 
    },
    seriesMaster: { 
        id: 'seriesMaster', name: '🎖️ 系列大师', desc: '使用三个不同系列的坦克', 
        icon: '🎖️', category: 'collection', difficulty: 'hard',
        condition: (stats) => stats.seriesUsed.length >= 3 
    },
};

// 难度等级配置
const DIFFICULTY_CONFIG = {
    easy: { name: '简单', color: '#00ff88', points: 10 },
    medium: { name: '中等', color: '#ffaa00', points: 25 },
    hard: { name: '困难', color: '#ff4444', points: 50 }
};


let playerStats = {
    kills: 0, maxKillsInMatch: 0, currentMatchKills: 0,
    maxSurvivalTime: 0, currentMatchSurvivalTime: 0, survivalStartTime: 0,
    lowHpKills: 0, lowHpSurvives: 0, outpostsCaptured: 0, basesDestroyed: 0,
    shellsFired: 0, mgFired: 0, aaFired: 0, ultimatesUsed: 0,
    smokeGrenadesDeployed: 0, quickSmokeDeploys: 0, damageUpgradesChosen: 0,
    escortWins: 0, deathmatchWins: 0, bossWins: 0, defenseWins: 0, sneakWins: 0,
    totalWins: 0, comebackWins: 0, maxSpeedReached: 0, ghostKills: 0,
    perfectGames: 0, modesWon: [], tanksUsed: [], seriesUsed: [], oneShotKills: 0,
    unlockedAchievements: [], unlockedTanks: [], tankMastery: {}, dailyTasks: null, matchStartTime: 0,
    snowMapWins: 0, selectedTankSkins: {}, pixelSkinUnlocked: false,
    currentLowHpTime: 0, currentMatchLowHpAwarded: false
};
let currentMatchMasterySettled = false;
let lastMatchMasteryAward = null;
const PLAYER_MULTI_KILL_WINDOW_MS = 4500;
let playerMultiKillCount = 0;
let playerMultiKillLastAt = 0;

function resetPlayerMultiKill() {
    playerMultiKillCount = 0;
    playerMultiKillLastAt = 0;
}

function registerPlayerMultiKill(target) {
    const now = Date.now();
    playerMultiKillCount = now - playerMultiKillLastAt <= PLAYER_MULTI_KILL_WINDOW_MS
        ? playerMultiKillCount + 1
        : 1;
    playerMultiKillLastAt = now;
    if(playerMultiKillCount < 2 || typeof showJuiceCue !== 'function') return playerMultiKillCount;

    const tiers = {
        2: { title:'二 杀！', subtitle:'双重击破 · 火力升温', color:'#50e6ff', intensity:1.02 },
        3: { title:'三 杀！', subtitle:'连续摧毁 · 势不可挡', color:'#ffe45c', intensity:1.10 },
        4: { title:'疯 狂 四 杀！', subtitle:'战场收割 · 无人可挡', color:'#ff9a3d', intensity:1.16 },
        5: { title:'五 连 绝 世！', subtitle:'主宰战场 · 全军震动', color:'#ff4f75', intensity:1.22 }
    };
    const tier = tiers[Math.min(5, playerMultiKillCount)] || tiers[5];
    const targetName = target && typeof getReplayTankName === 'function' ? getReplayTankName(target) : '敌方单位';
    const subtitle = playerMultiKillCount > 5
        ? `连续 ${playerMultiKillCount} 杀 · ${targetName} 已摧毁`
        : `${tier.subtitle} · ${targetName}`;
    showJuiceCue(
        playerMultiKillCount > 5 ? `主 宰 ×${playerMultiKillCount}！` : tier.title,
        subtitle,
        tier.color,
        tier.intensity,
        `连续击杀 ×${playerMultiKillCount}`
    );
    return playerMultiKillCount;
}

function loadStats() {
    try {
        const saved = localStorage.getItem('tankBattleStats');
        if(saved) Object.assign(playerStats, JSON.parse(saved));
    } catch(error) {
        console.warn('[STATS] 存档损坏，已恢复默认数据', error);
        localStorage.removeItem('tankBattleStats');
    }
    ['modesWon', 'tanksUsed', 'seriesUsed', 'unlockedAchievements', 'unlockedTanks'].forEach(key => {
        if(!Array.isArray(playerStats[key])) playerStats[key] = [];
    });
    if(!playerStats.tankMastery || typeof playerStats.tankMastery !== 'object' || Array.isArray(playerStats.tankMastery)) {
        playerStats.tankMastery = {};
    }
    if(!playerStats.selectedTankSkins || typeof playerStats.selectedTankSkins !== 'object' || Array.isArray(playerStats.selectedTankSkins)) {
        playerStats.selectedTankSkins = {};
    }
    playerStats.snowMapWins = Math.max(0, Number(playerStats.snowMapWins) || 0);
    playerStats.pixelSkinUnlocked = !!playerStats.pixelSkinUnlocked;
    if(playerStats.dailyTasks && typeof playerStats.dailyTasks !== 'object') playerStats.dailyTasks = null;
}

function saveStats() {
    try {
        localStorage.setItem('tankBattleStats', JSON.stringify(playerStats));
    } catch(error) {
        console.warn('[STATS] 无法保存成就数据', error);
    }
}

function checkAchievements() {
    let newUnlocks = [];
    Object.values(ACHIEVEMENTS).forEach(ach => {
        if(!playerStats.unlockedAchievements.includes(ach.id) && ach.condition(playerStats)) {
            playerStats.unlockedAchievements.push(ach.id);
            newUnlocks.push(ach);
            showAchievementPopup(ach);
        }
    });
    if(newUnlocks.length > 0) {
        checkHiddenTankUnlocks();
        saveStats();
    }
    return newUnlocks;
}

function getAchievementProgress(achId) {
    const ach = ACHIEVEMENTS[achId];
    if(!ach) return { current: 0, target: 1, text: '?' };

    switch(achId) {
        case 'firstBlood': return { current: playerStats.kills, target: 1, text: `${playerStats.kills}/1` };
        case 'rookieShooter': return { current: playerStats.kills, target: 10, text: `${playerStats.kills}/10` };
        case 'veteranShooter': return { current: playerStats.kills, target: 50, text: `${playerStats.kills}/50` };
        case 'tankAce': return { current: playerStats.kills, target: 150, text: `${playerStats.kills}/150` };
        case 'unstoppable': return { current: playerStats.maxKillsInMatch, target: 8, text: `${playerStats.maxKillsInMatch}/8` };
        case 'massacre': return { current: playerStats.maxKillsInMatch, target: 15, text: `${playerStats.maxKillsInMatch}/15` };
        case 'triggerHappy': return { current: playerStats.shellsFired, target: 100, text: `${playerStats.shellsFired}/100` };
        case 'shellMaster': return { current: playerStats.shellsFired, target: 500, text: `${playerStats.shellsFired}/500` };
        case 'shellGod': return { current: playerStats.shellsFired, target: 2000, text: `${playerStats.shellsFired}/2000` };
        case 'sprayAndPray': return { current: playerStats.mgFired, target: 500, text: `${playerStats.mgFired}/500` };
        case 'mgMaster': return { current: playerStats.mgFired, target: 2000, text: `${playerStats.mgFired}/2000` };
        case 'mgGod': return { current: playerStats.mgFired, target: 8000, text: `${playerStats.mgFired}/8000` };
        case 'aaRookie': return { current: playerStats.aaFired, target: 50, text: `${playerStats.aaFired}/50` };
        case 'aaMaster': return { current: playerStats.aaFired, target: 200, text: `${playerStats.aaFired}/200` };
        case 'aaGod': return { current: playerStats.aaFired, target: 500, text: `${playerStats.aaFired}/500` };
        case 'smokeRookie': return { current: playerStats.smokeGrenadesDeployed || 0, target: 1, text: `${playerStats.smokeGrenadesDeployed || 0}/1` };
        case 'quickSmokeExpert': return { current: playerStats.quickSmokeDeploys || 0, target: 20, text: `${playerStats.quickSmokeDeploys || 0}/20` };
        case 'ultimateRookie': return { current: playerStats.ultimatesUsed, target: 10, text: `${playerStats.ultimatesUsed}/10` };
        case 'ultimateMaster': return { current: playerStats.ultimatesUsed, target: 30, text: `${playerStats.ultimatesUsed}/30` };
        case 'flagRaiser': return { current: playerStats.outpostsCaptured, target: 3, text: `${playerStats.outpostsCaptured}/3` };
        case 'outpostVeteran': return { current: playerStats.outpostsCaptured, target: 15, text: `${playerStats.outpostsCaptured}/15` };
        case 'outpostKing': return { current: playerStats.outpostsCaptured, target: 50, text: `${playerStats.outpostsCaptured}/50` };
        case 'baseBuster': return { current: playerStats.basesDestroyed, target: 3, text: `${playerStats.basesDestroyed}/3` };
        case 'baseDestroyer': return { current: playerStats.basesDestroyed, target: 8, text: `${playerStats.basesDestroyed}/8` };
        case 'firstWin': return { current: playerStats.totalWins, target: 1, text: `${playerStats.totalWins}/1` };
        case 'modeExplorer': return { current: playerStats.modesWon.length, target: 3, text: `${playerStats.modesWon.length}/3` };
        case 'modeMaster': return { current: playerStats.modesWon.length, target: 6, text: `${playerStats.modesWon.length}/6` };
        case 'escortChampion': return { current: playerStats.escortWins, target: 3, text: `${playerStats.escortWins}/3` };
        case 'defenseHero': return { current: playerStats.defenseWins, target: 2, text: `${playerStats.defenseWins}/2` };
        case 'deathmatchChampion': return { current: playerStats.deathmatchWins, target: 3, text: `${playerStats.deathmatchWins}/3` };
        case 'bossHunter': return { current: playerStats.bossWins, target: 3, text: `${playerStats.bossWins}/3` };
        case 'sneakAssassin': return { current: playerStats.sneakWins, target: 3, text: `${playerStats.sneakWins}/3` };
        case 'survivor': return { current: Math.floor(playerStats.maxSurvivalTime), target: 120, text: `${Math.floor(playerStats.maxSurvivalTime)}s/120s` };
        case 'ironWill': return { current: Math.floor(playerStats.maxSurvivalTime), target: 240, text: `${Math.floor(playerStats.maxSurvivalTime)}s/240s` };
        case 'unkillable': return { current: Math.floor(playerStats.maxSurvivalTime), target: 300, text: `${Math.floor(playerStats.maxSurvivalTime)}s/300s` };
        case 'closeCall': return { current: playerStats.lowHpSurvives, target: 1, text: `${playerStats.lowHpSurvives}/1` };
        case 'phoenix': return { current: playerStats.lowHpKills, target: 1, text: `${playerStats.lowHpKills}/1` };
        case 'speedDemon': return { current: playerStats.maxSpeedReached.toFixed(1), target: 12, text: `${playerStats.maxSpeedReached.toFixed(1)}/12` };
        case 'ghostWalker': return { current: playerStats.ghostKills, target: 3, text: `${playerStats.ghostKills}/3` };
        case 'fieldRefit': return { current: playerStats.damageUpgradesChosen || 0, target: 3, text: `${playerStats.damageUpgradesChosen || 0}/3` };
        case 'battleHardened': return { current: playerStats.damageUpgradesChosen || 0, target: 10, text: `${playerStats.damageUpgradesChosen || 0}/10` };
        case 'tankRookie': return { current: playerStats.tanksUsed.length, target: 3, text: `${playerStats.tanksUsed.length}/3` };
        case 'tankCollector': return { current: playerStats.tanksUsed.length, target: 8, text: `${playerStats.tanksUsed.length}/8` };
        case 'tankMaster': return { current: playerStats.tanksUsed.length, target: 15, text: `${playerStats.tanksUsed.length}/15` };
        case 'seriesExplorer': return { current: playerStats.seriesUsed.length, target: 2, text: `${playerStats.seriesUsed.length}/2` };
        case 'seriesMaster': return { current: playerStats.seriesUsed.length, target: 3, text: `${playerStats.seriesUsed.length}/3` };
        case 'comeback': return { current: playerStats.comebackWins, target: 1, text: `${playerStats.comebackWins}/1` };
        case 'perfectGame': return { current: playerStats.perfectGames, target: 1, text: `${playerStats.perfectGames}/1` };
        default: return { current: 0, target: 1, text: '?' };
    }
}

function showAchievementPopup(ach) {
    const popup = document.createElement('div');
    popup.style.cssText = `
        position: fixed; top: 80px; right: -400px;
        background: linear-gradient(135deg, #1a1a3e, #0f0f2a);
        border: 2px solid #ffd700; border-radius: 15px;
        padding: 15px 25px; color: #fff; z-index: 10000;
        font-family: var(--font-mechanical, "DIN Alternate", "Arial Narrow", "STHeiti", sans-serif);
        box-shadow: 0 0 30px rgba(255,215,0,0.3);
        transition: right 0.5s ease; min-width: 280px;
    `;
    popup.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;">
            <div style="font-size:36px;">${ach.icon}</div>
            <div>
                <div style="color:#ffd700;font-size:12px;font-weight:bold;letter-spacing:2px;">🏆 成就解锁</div>
                <div style="font-size:18px;font-weight:bold;margin:4px 0;">${ach.name}</div>
                <div style="color:#aaa;font-size:12px;">${ach.desc}</div>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.style.right = '20px', 100);
    setTimeout(() => {
        popup.style.right = '-400px';
        setTimeout(() => popup.remove(), 500);
    }, 4000);
}

function resetMatchStats() {
    resetPlayerMultiKill();
    playerStats.currentMatchKills = 0;
    playerStats.currentMatchSurvivalTime = 0;
    playerStats.matchStartTime = Date.now();
    playerStats.currentLowHpTime = 0;
    playerStats.currentMatchLowHpAwarded = false;
    currentMatchMasterySettled = false;
    lastMatchMasteryAward = null;
}

function endMatchStats(result) {
    const matchTime = (Date.now() - playerStats.matchStartTime) / 1000;
    playerStats.currentMatchSurvivalTime = matchTime;
    playerStats.maxSurvivalTime = Math.max(playerStats.maxSurvivalTime, matchTime);
    playerStats.maxKillsInMatch = Math.max(playerStats.maxKillsInMatch, playerStats.currentMatchKills);

    if(result === 'victory') {
        playerStats.totalWins++;
        if(typeof currentMap !== 'undefined' && currentMap === 'snow') playerStats.snowMapWins++;
        if(!playerStats.modesWon.includes(gameMode)) playerStats.modesWon.push(gameMode);

        if(gameMode === 'escort') playerStats.escortWins++;
        else if(gameMode === 'deathmatch') playerStats.deathmatchWins++;
        else if(gameMode === 'boss') playerStats.bossWins++;
        else if(gameMode === 'defense') playerStats.defenseWins++;
        else if(gameMode === 'sneak') playerStats.sneakWins++;

        const blueCount = outposts.filter(o => o.owner === 'blue').length;
        const redCount = outposts.filter(o => o.owner === 'red').length;
        if(gameMode === 'classic' && blueCount === 0) playerStats.comebackWins++;

        // 检查完美游戏（0死亡且击杀10+）
        if(playerStats.currentMatchKills >= 10 && !player.dead) {
            playerStats.perfectGames++;
        }
    }

    // 熟练度只在一局真正进入结算时记账。开始战斗后刷新不会增加场次，
    // 同一局即使结算回调被重复触发也只会记录一次。
    if(!currentMatchMasterySettled && typeof selectedTank === 'string') {
        currentMatchMasterySettled = true;
        if(typeof recordTankMasteryPerformance === 'function') {
            lastMatchMasteryAward = recordTankMasteryPerformance(selectedTank, {
                victory: result === 'victory',
                kills: playerStats.currentMatchKills,
                survivalSeconds: matchTime
            });
        } else {
            if(typeof recordTankMasteryMatch === 'function') recordTankMasteryMatch(selectedTank);
            if(typeof recordTankMasteryResult === 'function') {
                recordTankMasteryResult(selectedTank, result === 'victory');
            }
        }
        if(typeof recordDailyTaskMatchResult === 'function') {
            recordDailyTaskMatchResult(selectedTank, {
                victory: result === 'victory',
                survivalSeconds: matchTime
            });
        }
    }
    const masteryXp = document.getElementById('resultMasteryXp');
    if(masteryXp) {
        masteryXp.textContent = lastMatchMasteryAward
            ? `本局 ${TANKS[selectedTank].name} 获得 +${lastMatchMasteryAward.gainedXp} XP`
            : '';
    }
    checkAchievements();
    saveStats();
}

function recordKill(tank, target, hitInfo = null) {
    if(target && target.isPlayer) resetPlayerMultiKill();
    if(tank && target && tank.team && target.team && tank.team === target.team) {
        if(tank.isPlayer && typeof showMessage === 'function') {
            showMessage(`⚠ 友军误伤：${target.name || '友军单位'}已被击毁`, '#ff7048');
        }
        return;
    }
    if(typeof awardKillScore === 'function') awardKillScore(tank, target);
    if(typeof handleTankEvolutionKill === 'function') handleTankEvolutionKill(tank, target);
    if(tank.isPlayer) {
        registerPlayerMultiKill(target);
        playerStats.currentMatchKills++;
        playerStats.kills++;

        // 检查一击必杀
        if(hitInfo && hitInfo.preHitHp >= target.maxHp * 0.9 && hitInfo.damage >= hitInfo.preHitHp && hitInfo.weapon === 'shell') {
            playerStats.oneShotKills++;
        }

        // 检查低血量击杀
        if(tank.hp < tank.maxHp * 0.1) {
            playerStats.lowHpKills++;
        }

        // 检查幽灵击杀
        if(tank.ghostActive) {
            playerStats.ghostKills = (playerStats.ghostKills || 0) + 1;
        }

        if(typeof recordTankMasteryKill === 'function') recordTankMasteryKill(tank.tankType);
        if(typeof recordDailyTaskKill === 'function') recordDailyTaskKill(tank.tankType);
        checkAchievements();
    }
}

function recordSurvivalState(tank, dt) {
    if(!tank || tank.dead || tank.hp >= tank.maxHp * 0.2) {
        playerStats.currentLowHpTime = 0;
        return;
    }
    playerStats.currentLowHpTime += dt;
    if(playerStats.currentLowHpTime >= 30 && !playerStats.currentMatchLowHpAwarded) {
        playerStats.currentMatchLowHpAwarded = true;
        playerStats.lowHpSurvives++;
        checkAchievements();
        saveStats();
    }
}

function recordShot(type) {
    if(type === 'shell' || type === 'bomb') playerStats.shellsFired++;
    else if(type === 'mg' || type === 'airmg') playerStats.mgFired++;
    else if(type === 'aa') playerStats.aaFired++;
    checkAchievements();
}

function recordUltimate() {
    playerStats.ultimatesUsed++;
    checkAchievements();
}

function recordSmokeDeployment(quick = false) {
    playerStats.smokeGrenadesDeployed = (playerStats.smokeGrenadesDeployed || 0) + 1;
    if(quick) playerStats.quickSmokeDeploys = (playerStats.quickSmokeDeploys || 0) + 1;
    checkAchievements();
    saveStats();
}

function recordDamageUpgrade() {
    playerStats.damageUpgradesChosen = (playerStats.damageUpgradesChosen || 0) + 1;
    checkAchievements();
    saveStats();
}

function recordOutpostCapture(team) {
    if(team === 'blue') playerStats.outpostsCaptured++;
    checkAchievements();
}

function recordBaseDestroy(team, contributor = null) {
    if(typeof awardBaseScore === 'function') awardBaseScore(team, contributor);
    if(team === 'blue') playerStats.basesDestroyed++;
    checkAchievements();
}

function recordTankUsed(tankType) {
    if(!playerStats.tanksUsed.includes(tankType)) {
        playerStats.tanksUsed.push(tankType);
    }

    let series = '';
    if(tankType.startsWith('zuoyan')) series = 'zuoyan';
    else if(tankType.startsWith('xingchen')) series = 'xingchen';
    else if(tankType.startsWith('duoduo')) series = 'duoduo';
    else if(tankType.startsWith('niuniu')) series = 'niuniu';
    else if(tankType.startsWith('kimi')) series = 'kimi';

    if(series && !playerStats.seriesUsed.includes(series)) {
        playerStats.seriesUsed.push(series);
    }

    checkAchievements();
}

function recordSpeed(speed) {
    if(speed > playerStats.maxSpeedReached) {
        playerStats.maxSpeedReached = speed;
        checkAchievements();
    }
}


// ==================== 成就面板渲染 ====================
function renderAchievementPanel() {
    const panel = document.getElementById('achievementPanel');
    const list = document.getElementById('achievementList');
    const stats = document.getElementById('achievementStats');

    if(!panel || !list) return;

    const total = Object.keys(ACHIEVEMENTS).length;
    const unlocked = playerStats.unlockedAchievements.length;
    const easyUnlocked = Object.values(ACHIEVEMENTS).filter(a => a.difficulty === 'easy' && playerStats.unlockedAchievements.includes(a.id)).length;
    const mediumUnlocked = Object.values(ACHIEVEMENTS).filter(a => a.difficulty === 'medium' && playerStats.unlockedAchievements.includes(a.id)).length;
    const hardUnlocked = Object.values(ACHIEVEMENTS).filter(a => a.difficulty === 'hard' && playerStats.unlockedAchievements.includes(a.id)).length;

    stats.innerHTML = `
        <div style="font-size:28px;font-weight:bold;color:#ffd700;margin-bottom:10px;">${unlocked} / ${total}</div>
        <div style="display:flex;gap:15px;justify-content:center;">
            <span style="color:#00ff88;">🟢 简单 ${easyUnlocked}</span>
            <span style="color:#ffaa00;">🟡 中等 ${mediumUnlocked}</span>
            <span style="color:#ff4444;">🔴 困难 ${hardUnlocked}</span>
        </div>
    `;

    list.innerHTML = '';

    const categories = {
        combat: '⚔️ 战斗', survival: '🛡️ 生存', outpost: '🏴 据点',
        base: '🏰 基地', weapon: '🔫 武器', mode: '🎮 模式',
        special: '✨ 特殊', collection: '🏎️ 收集'
    };

    // 按难度排序：简单 → 中等 → 困难
    const sortedAchievements = Object.values(ACHIEVEMENTS).sort((a, b) => {
        const diffOrder = { easy: 0, medium: 1, hard: 2 };
        return diffOrder[a.difficulty] - diffOrder[b.difficulty];
    });

    sortedAchievements.forEach(ach => {
        const isUnlocked = playerStats.unlockedAchievements.includes(ach.id);
        const card = document.createElement('div');
        card.className = 'achievement-card' + (isUnlocked ? ' unlocked' : '');

        const progress = getAchievementProgress(ach.id);
        const diffConfig = DIFFICULTY_CONFIG[ach.difficulty];

        card.innerHTML = `
            <div class="achievement-icon">${ach.icon}</div>
            <div class="achievement-info" style="flex:1;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <h4 style="margin:0;">${isUnlocked ? '✓ ' : ''}${ach.name}</h4>
                    <span style="color:${diffConfig.color};font-size:11px;border:1px solid ${diffConfig.color};padding:1px 6px;border-radius:8px;">${diffConfig.name}</span>
                </div>
                <p style="margin:4px 0;">${ach.desc}</p>
                <span class="achievement-category ${ach.category}">${categories[ach.category]}</span>
                <div class="achievement-progress">
                    <div class="achievement-progress-fill" style="width:${Math.min(progress.current / progress.target, 1) * 100}%"></div>
                </div>
                <div style="text-align:right;color:#888;font-size:11px;margin-top:2px;">${progress.text}</div>
            </div>
        `;
        list.appendChild(card);
    });
}

function setupAchievementPanel() {
    const btn = document.getElementById('btnAchievements');
    const panel = document.getElementById('achievementPanel');
    const closeBtn = document.getElementById('btnCloseAchievements');

    if(btn) btn.addEventListener('click', () => {
        renderAchievementPanel();
        panel.style.display = 'block';
    });

    if(closeBtn) closeBtn.addEventListener('click', () => {
        panel.style.display = 'none';
    });
}


// ==================== 隐藏坦克解锁系统 ====================
function checkHiddenTankUnlocks() {
    const unlocks = {
        'kimi_tank': { achievement: 'tankAce', message: '🎉 解锁隐藏坦克：Kimi主战坦克！AI系选车分类已开放' }
    };

    for (const [tankId, unlock] of Object.entries(unlocks)) {
        if (!playerStats.unlockedTanks) playerStats.unlockedTanks = [];
        if (!playerStats.unlockedTanks.includes(tankId) && playerStats.unlockedAchievements.includes(unlock.achievement)) {
            playerStats.unlockedTanks.push(tankId);
            showNotification(unlock.message, '#9c27b0');
            saveStats();
            if(typeof updateSeriesFilterVisibility === 'function') updateSeriesFilterVisibility();
            if(typeof renderTankList === 'function') renderTankList();
        }
    }
}

function isTankUnlocked(tankId) {
    const tank = TANKS[tankId];
    if (!tank || !tank.isHidden) return true;
    if (!playerStats.unlockedTanks) return false;
    return playerStats.unlockedTanks.includes(tankId);
}
