// ==================== 战场武器配件与坦克涂装 ====================
const WEAPON_ATTACHMENTS = Object.freeze({
    highExplosive: {
        id: 'highExplosive', name: '高爆弹', icon: '💥', color: '#ff7a2d',
        description: '伤害 +20% · 射速 -10%'
    },
    armorPiercing: {
        id: 'armorPiercing', name: '穿甲弹', icon: '◆', color: '#dce7ee',
        description: '无视 30% 装甲'
    },
    quickLoader: {
        id: 'quickLoader', name: '快速装填', icon: '⟳', color: '#ffe15a',
        description: '射速 +25%'
    },
    stabilizer: {
        id: 'stabilizer', name: '稳定器', icon: '⌖', color: '#63e7ff',
        description: '移动射击精度 +30%'
    },
    suppressor: {
        id: 'suppressor', name: '消音器', icon: '▰', color: '#9ea9ad',
        description: '开火不暴露在小地图'
    },
    extendedMagazine: {
        id: 'extendedMagazine', name: '扩容弹匣', icon: '▥', color: '#72ef9d',
        description: '弹药上限 +40%'
    }
});

const TANK_SKINS = Object.freeze({
    standard: {
        id: 'standard', name: '标准涂装', icon: '▧', description: '原厂战术涂装'
    },
    gold: {
        id: 'gold', name: '黄金涂装', icon: '◆', description: '★8 解锁',
        color: '#d9a514', accent: '#fff09a', exhaustColor: '#ffd43b', metalness: .82, emissive: '#6d3e00'
    },
    shadow: {
        id: 'shadow', name: '暗影涂装', icon: '◈', description: '★6 解锁',
        color: '#15151d', accent: '#7650a8', exhaustColor: '#8d63e8', metalness: .58, emissive: '#210c3d'
    },
    flame: {
        id: 'flame', name: '烈焰涂装', icon: '🔥', description: '累计击杀 1000 辆解锁',
        color: '#7d160e', accent: '#ff8a21', exhaustColor: '#ff4317', metalness: .42, emissive: '#5b1000'
    },
    snow: {
        id: 'snow', name: '冰雪涂装', icon: '❄', description: '雪地图获胜 50 场解锁',
        color: '#dcecf0', accent: '#67d8ef', exhaustColor: '#b7f4ff', metalness: .3, emissive: '#123d48'
    },
    pixel: {
        id: 'pixel', name: '像素涂装', icon: '▦', description: '隐藏彩蛋',
        color: '#2f8d58', accent: '#e14eb6', exhaustColor: '#8bff6e', metalness: .25, emissive: '#173e28'
    },
    frostmark: {
        id: 'frostmark', name: '霜痕之印', icon: '❄', description: '故事模式·霜痕的馈赠',
        color: '#bdeaff', accent: '#4fc7ee', exhaustColor: '#d9f8ff', metalness: .36, emissive: '#174c68'
    },
    moltenWalker: {
        id: 'moltenWalker', name: '熔火行者', icon: '♨', description: '故事模式·熔火之心',
        color: '#7d2418', accent: '#ff9b38', exhaustColor: '#ff582d', metalness: .48, emissive: '#621906'
    },
    industrial: {
        id: 'industrial', name: '多多号工业', icon: '⚙', description: '故事模式·废弃档案室',
        color: '#6d7072', accent: '#f2b338', exhaustColor: '#ffcd65', metalness: .72, emissive: '#45320b'
    },
    voidEcho: {
        id: 'voidEcho', name: '霆光回响', icon: '⚡', description: '故事模式·霆光的认可',
        color: '#332660', accent: '#e9ed6b', exhaustColor: '#a68cff', metalness: .58, emissive: '#27174d'
    }
});

let weaponAttachmentPickups = [];
let attachmentPickupCounter = 0;

function normalizeAttachmentWeapon(type) {
    if(type === 'bomb') return 'bomb';
    if(type === 'airmg') return 'airmg';
    return ['shell', 'mg', 'aa'].includes(type) ? type : 'shell';
}

function getTankWeaponAttachments(tank, type) {
    if(!tank) return [];
    if(!tank.weaponAttachments || typeof tank.weaponAttachments !== 'object') {
        tank.weaponAttachments = { shell: [], mg: [], aa: [], bomb: [], airmg: [] };
    }
    const weapon = normalizeAttachmentWeapon(type);
    if(!Array.isArray(tank.weaponAttachments[weapon])) tank.weaponAttachments[weapon] = [];
    return tank.weaponAttachments[weapon];
}

function tankWeaponHasAttachment(tank, type, attachmentId) {
    return getTankWeaponAttachments(tank, type).includes(attachmentId);
}

function getAttachmentFireRateMultiplier(tank, type) {
    let multiplier = 1;
    if(tankWeaponHasAttachment(tank, type, 'highExplosive')) multiplier *= .9;
    if(tankWeaponHasAttachment(tank, type, 'quickLoader')) multiplier *= 1.25;
    return multiplier;
}

function getAttachmentDamageMultiplier(tank, type) {
    return tankWeaponHasAttachment(tank, type, 'highExplosive') ? 1.2 : 1;
}

function isTankActivelyMoving(tank) {
    if(!tank) return false;
    if((tank.engineLoad || 0) > .08) return true;
    if(!tank.prevPos) return false;
    return Math.hypot(tank.x - tank.prevPos.x, tank.y - tank.prevPos.y) > .12;
}

function getAttachmentSpreadMultiplier(tank, type) {
    return isTankActivelyMoving(tank) && tankWeaponHasAttachment(tank, type, 'stabilizer') ? .7 : 1;
}

function getAttachmentAmmoFields(type) {
    if(type === 'shell' || type === 'bomb') return { ammo: 'shells', maximum: 'maxShells', base: 'attachmentBaseShells' };
    if(type === 'mg' || type === 'airmg') return { ammo: 'mg', maximum: 'maxMG', base: 'attachmentBaseMG' };
    return { ammo: 'aa', maximum: 'maxAA', base: 'attachmentBaseAA' };
}

function initializeTankAttachmentState(tank) {
    if(!tank) return;
    getTankWeaponAttachments(tank, 'shell');
    getTankWeaponAttachments(tank, 'mg');
    getTankWeaponAttachments(tank, 'aa');
    getTankWeaponAttachments(tank, 'bomb');
    getTankWeaponAttachments(tank, 'airmg');
    tank.attachmentBaseShells = Math.max(0, Number(tank.maxShells) || 0);
    tank.attachmentBaseMG = Math.max(0, Number(tank.maxMG) || 0);
    tank.attachmentBaseAA = Math.max(0, Number(tank.maxAA) || 0);
}

function refreshAttachmentAmmoCapacity(tank, type, refillDifference = false) {
    const fields = getAttachmentAmmoFields(type);
    if(!Number.isFinite(tank[fields.base])) tank[fields.base] = Math.max(0, Number(tank[fields.maximum]) || 0);
    const previous = Math.max(0, Number(tank[fields.maximum]) || 0);
    const expanded = tankWeaponHasAttachment(tank, type, 'extendedMagazine');
    const next = Math.ceil(tank[fields.base] * (expanded ? 1.4 : 1));
    tank[fields.maximum] = next;
    if(refillDifference && next > previous) tank[fields.ammo] = Math.min(next, (tank[fields.ammo] || 0) + next - previous);
    else tank[fields.ammo] = Math.min(next, tank[fields.ammo] || 0);
}

function equipWeaponAttachment(tank, type, attachmentId) {
    const attachment = WEAPON_ATTACHMENTS[attachmentId];
    if(!tank || !attachment) return false;
    const weapon = normalizeAttachmentWeapon(type);
    const slots = getTankWeaponAttachments(tank, weapon);
    const existingIndex = slots.indexOf(attachmentId);
    let replaced = null;
    if(existingIndex >= 0) slots.splice(existingIndex, 1);
    else if(slots.length >= 2) replaced = slots.shift();
    slots.push(attachmentId);
    refreshAttachmentAmmoCapacity(tank, weapon, attachmentId === 'extendedMagazine');
    if(replaced === 'extendedMagazine') refreshAttachmentAmmoCapacity(tank, weapon, false);
    if(tank.isPlayer && typeof showMessage === 'function') {
        const weaponName = getAttachmentWeaponName(weapon);
        const replaceText = replaced ? ` · 替换${WEAPON_ATTACHMENTS[replaced].name}` : '';
        showMessage(`${attachment.icon} ${weaponName}装配：${attachment.name}${replaceText}`, attachment.color);
    }
    return true;
}

function getAttachmentWeaponName(type) {
    return ({ shell:'主炮', mg:'机枪', aa:'高射炮', bomb:'炸药包', airmg:'空对空机枪' })[type] || '主炮';
}

function getCurrentAttachmentWeapon(tank) {
    const fallback = tank && tank.isFlying ? 'bomb' : 'shell';
    if(typeof currentWeapon === 'undefined' || currentWeapon === 'smoke') return normalizeAttachmentWeapon(tank && tank.lastFiredWeapon || fallback);
    return normalizeAttachmentWeapon(currentWeapon);
}

function findAttachmentPickupPosition() {
    for(let attempt = 0; attempt < 100; attempt++) {
        const x = 130 + Math.random() * Math.max(1, CONFIG.mapWidth - 260);
        const y = 130 + Math.random() * Math.max(1, CONFIG.mapHeight - 260);
        if(typeof checkObstacleCollision === 'function' && checkObstacleCollision(x, y, 34, null)) continue;
        if(currentMap === 'island' && typeof isPositionInWater === 'function' && isPositionInWater(x, y, 25)) continue;
        return { x, y };
    }
    return { x: CONFIG.mapWidth * .5, y: CONFIG.mapHeight * .5 };
}

function resetWeaponAttachmentPickups(count = 12) {
    weaponAttachmentPickups = [];
    attachmentPickupCounter = 0;
    const ids = Object.keys(WEAPON_ATTACHMENTS);
    for(let i = 0; i < count; i++) {
        const position = findAttachmentPickupPosition();
        weaponAttachmentPickups.push({
            id: `attachment-${++attachmentPickupCounter}`,
            attachmentId: ids[i % ids.length],
            x: position.x,
            y: position.y,
            z: currentMap === 'factory' && typeof getFactoryFloorZ === 'function' ? getFactoryFloorZ(1) : 0,
            pulse: Math.random() * Math.PI * 2
        });
    }
}

function updateWeaponAttachmentPickups() {
    if(!player || player.dead || !weaponAttachmentPickups.length) return;
    for(let i = weaponAttachmentPickups.length - 1; i >= 0; i--) {
        const pickup = weaponAttachmentPickups[i];
        if(currentMap === 'factory' && Math.abs((player.z || 0) - (pickup.z || 0)) > 70) continue;
        if(Math.hypot(player.x - pickup.x, player.y - pickup.y) > 54) continue;
        equipWeaponAttachment(player, getCurrentAttachmentWeapon(player), pickup.attachmentId);
        createParticles(pickup.x, pickup.y, 18, WEAPON_ATTACHMENTS[pickup.attachmentId].color, 1.5);
        if(typeof playWorldSound === 'function') playWorldSound('capture', pickup.x, pickup.y, .8);
        weaponAttachmentPickups.splice(i, 1);
    }
}

function getTankSkinUnlock(tankType, skinId) {
    const stats = typeof playerStats !== 'undefined' ? playerStats : {};
    const mastery = typeof getTankMasteryProfile === 'function' ? getTankMasteryProfile(tankType) : { level: 1 };
    if(skinId === 'standard') return { unlocked: true, progress: '已装备' };
    if(skinId === 'gold') return { unlocked: mastery.level >= 8, progress: `★${mastery.level}/8` };
    if(skinId === 'shadow') return { unlocked: mastery.level >= 6, progress: `★${mastery.level}/6` };
    if(skinId === 'flame') return { unlocked: (stats.kills || 0) >= 1000, progress: `${Math.min(1000, stats.kills || 0)}/1000 击杀` };
    if(skinId === 'snow') return { unlocked: (stats.snowMapWins || 0) >= 50, progress: `${Math.min(50, stats.snowMapWins || 0)}/50 雪地胜场` };
    if(skinId === 'pixel') return { unlocked: !!stats.pixelSkinUnlocked, progress: stats.pixelSkinUnlocked ? '彩蛋已发现' : '？？？' };
    if(['frostmark','moltenWalker','industrial','voidEcho'].includes(skinId)) {
        const unlocked = typeof isStoryCosmeticUnlocked === 'function' && isStoryCosmeticUnlocked(skinId);
        return { unlocked, progress: unlocked ? '故事奖励已领取' : '完成对应章节奖励关' };
    }
    return { unlocked: false, progress: '未解锁' };
}

function getSelectedTankSkin(tankType) {
    const selected = typeof playerStats !== 'undefined' && playerStats.selectedTankSkins
        ? playerStats.selectedTankSkins[tankType]
        : 'standard';
    return TANK_SKINS[selected] && getTankSkinUnlock(tankType, selected).unlocked ? selected : 'standard';
}

function selectTankSkin(skinId) {
    if(!selectedTank || !TANK_SKINS[skinId]) return false;
    const unlock = getTankSkinUnlock(selectedTank, skinId);
    if(!unlock.unlocked) {
        if(typeof showNotification === 'function') showNotification(`${TANK_SKINS[skinId].name}尚未解锁 · ${unlock.progress}`, '#ff9b49');
        return false;
    }
    if(!playerStats.selectedTankSkins || typeof playerStats.selectedTankSkins !== 'object') playerStats.selectedTankSkins = {};
    playerStats.selectedTankSkins[selectedTank] = skinId;
    if(typeof saveStats === 'function') saveStats();
    renderTankSkinSelector(selectedTank);
    if(typeof drawTankPreview === 'function') drawTankPreview(selectedTank, TANKS[selectedTank]);
    return true;
}

function getTankSkinVisual(tankData, tankType, skinId = null) {
    const selected = skinId || getSelectedTankSkin(tankType);
    const skin = TANK_SKINS[selected] || TANK_SKINS.standard;
    if(selected === 'standard') return { skinId:'standard' };
    return {
        skinId: selected,
        color: skin.color,
        accent: skin.accent,
        exhaustColor: skin.exhaustColor,
        skinMetalness: skin.metalness,
        skinEmissive: skin.emissive
    };
}

function renderTankSkinSelector(tankType = selectedTank) {
    const root = document.getElementById('tankSkinSelector');
    if(!root) return;
    if(!tankType || !TANKS[tankType]) {
        root.innerHTML = '<span class="skin-empty">选择坦克后配置纯外观涂装</span>';
        return;
    }
    const selected = getSelectedTankSkin(tankType);
    root.innerHTML = Object.values(TANK_SKINS)
        .filter(skin => skin.id !== 'pixel' || getTankSkinUnlock(tankType, skin.id).unlocked)
        .map(skin => {
            const unlock = getTankSkinUnlock(tankType, skin.id);
            return `<button type="button" class="skin-option ${selected === skin.id ? 'selected' : ''} ${unlock.unlocked ? '' : 'locked'}"
                onclick="selectTankSkin('${skin.id}')" aria-pressed="${selected === skin.id}">
                <i style="--skin-color:${skin.color || TANKS[tankType].color};--skin-accent:${skin.accent || TANKS[tankType].accent}"></i>
                <strong>${skin.icon} ${skin.name}</strong><small>${unlock.unlocked ? (selected === skin.id ? '已装备' : skin.description) : `锁定 · ${unlock.progress}`}</small>
            </button>`;
        }).join('');
}

function installPixelSkinEasterEgg() {
    const title = document.getElementById('startGameTitle');
    if(!title || title.dataset.pixelEggInstalled === 'true') return;
    title.dataset.pixelEggInstalled = 'true';
    let taps = 0;
    let resetTimer = 0;
    title.addEventListener('click', () => {
        clearTimeout(resetTimer);
        taps++;
        resetTimer = setTimeout(() => { taps = 0; }, 2200);
        if(taps < 7 || playerStats.pixelSkinUnlocked) return;
        playerStats.pixelSkinUnlocked = true;
        saveStats();
        taps = 0;
        if(typeof showNotification === 'function') showNotification('▦ 隐藏信号解码完成：像素涂装已解锁', '#8bff6e');
        if(selectedTank) renderTankSkinSelector(selectedTank);
    });
}
