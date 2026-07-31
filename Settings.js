// ==================== 战场设置 ====================
const GAME_SETTINGS_STORAGE_KEY = 'tankBattleSettingsV1';
const DEFAULT_GAME_SETTINGS = Object.freeze({
    friendlyFire: false,
    beginnerMode: false,
    audioEnabled: true,
    screenShake: true,
    damageNumbers: true,
    autoAim: true,
    combatReplay: true,
    minimap: true,
    playerLocator: true
});

function sanitizeGameSettings(value = {}) {
    return Object.keys(DEFAULT_GAME_SETTINGS).reduce((settings, key) => {
        settings[key] = typeof value[key] === 'boolean' ? value[key] : DEFAULT_GAME_SETTINGS[key];
        return settings;
    }, {});
}

function loadGameSettings() {
    try {
        const saved = localStorage.getItem(GAME_SETTINGS_STORAGE_KEY);
        return sanitizeGameSettings(saved ? JSON.parse(saved) : {});
    } catch(error) {
        console.warn('[SETTINGS] 无法读取本地设置，已使用默认值:', error);
        return { ...DEFAULT_GAME_SETTINGS };
    }
}

let gameSettings = loadGameSettings();
let gameSettingsInitialized = false;

function persistGameSettings() {
    try {
        localStorage.setItem(GAME_SETTINGS_STORAGE_KEY, JSON.stringify(gameSettings));
    } catch(error) {
        console.warn('[SETTINGS] 无法保存本地设置:', error);
    }
}

function isFriendlyFireEnabled() {
    return gameSettings.friendlyFire === true;
}

function isBeginnerModeEnabled() {
    return gameSettings.beginnerMode === true;
}

function isGameAudioEnabled() {
    return gameSettings.audioEnabled !== false;
}

function isScreenShakeEnabled() {
    return gameSettings.screenShake !== false;
}

function areDamageNumbersEnabled() {
    return gameSettings.damageNumbers !== false;
}

function isAutoAimEnabled() {
    return gameSettings.autoAim !== false;
}

function isCombatReplayEnabled() {
    return gameSettings.combatReplay !== false;
}

function isMinimapEnabled() {
    return gameSettings.minimap !== false;
}

function isPlayerLocatorEnabled() {
    return gameSettings.playerLocator !== false;
}

function syncSettingsForm() {
    Object.keys(DEFAULT_GAME_SETTINGS).forEach(key => {
        const input = document.getElementById(`setting-${key}`);
        if(input) input.checked = gameSettings[key];
    });
    updateSettingsSummary();
}

function updateSettingsSummary(message = '') {
    const summary = document.getElementById('settingsSummary');
    if(summary) {
        const beginner = gameSettings.beginnerMode ? '新手辅助 ON' : '标准战斗';
        const friendlyFire = gameSettings.friendlyFire ? '友伤 ON' : '友伤 OFF';
        summary.textContent = message || `${beginner} · ${friendlyFire}`;
    }
    document.documentElement.classList.toggle('beginner-mode-enabled', gameSettings.beginnerMode);
}

function initializeGameSettings() {
    gameSettings = loadGameSettings();
    syncSettingsForm();
    if(gameSettingsInitialized) return;
    gameSettingsInitialized = true;
    const modal = document.getElementById('settingsModal');
    if(modal) {
        modal.addEventListener('click', event => {
            if(event.target === modal) closeSettingsPanel();
        });
    }
}

function showSettingsPanel() {
    if(typeof closeInfoPanels === 'function') closeInfoPanels('settingsModal');
    syncSettingsForm();
    const modal = document.getElementById('settingsModal');
    if(modal) modal.classList.add('active');
}

function closeSettingsPanel() {
    const modal = document.getElementById('settingsModal');
    if(modal) modal.classList.remove('active');
}

function saveSettingsFromPanel() {
    const nextSettings = {};
    Object.keys(DEFAULT_GAME_SETTINGS).forEach(key => {
        const input = document.getElementById(`setting-${key}`);
        nextSettings[key] = input ? input.checked : gameSettings[key];
    });
    gameSettings = sanitizeGameSettings(nextSettings);
    persistGameSettings();
    updateSettingsSummary('设置已保存 · 下一场战斗生效');
    closeSettingsPanel();
}

function resetSettingsToDefault() {
    gameSettings = { ...DEFAULT_GAME_SETTINGS };
    persistGameSettings();
    syncSettingsForm();
    updateSettingsSummary('已恢复默认战场设置');
}
