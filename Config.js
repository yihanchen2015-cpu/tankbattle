// ==================== 游戏配置 ====================
const CONFIG = {
    mapWidth: 9000,
    mapHeight: 9000,
    tileSize: 100,
    gameTime: 300,
    outpostRadius: 240,
    outpostCaptureTime: 5,
    outpostSpawnInterval: 20,
    baseHp: 50000,
    baseSize: 120,
    tankSize: 35,
    bulletSpeed: 18,
    mgSpeed: 22,
    aaSpeed: 28,
    bulletDamage: 180,
    mgDamage: 12,
    aaDamage: 150,
    fireCooldown: 1.2,
    mgCooldown: 0.08,
    aaCooldown: 0.6,
    aaArcHeight: 80,
    helicopterAltitude: 240,
    helicopterMinAltitude: 100,
    helicopterMaxAltitude: 1000,
    helicopterClimbSpeed: 180,
    helicopterCollisionDamage: 45,
    helicopterIgniteHits: 4,
    helicopterFireDuration: 12,
    helicopterFireDps: 24,
    aaVerticalSpeed: 240,
    aaGravity: 192,
    aaHitHeightTolerance: 62,
    aaExplosionRadius: 60,
    aaTrackingRange: 600,
    aaTrackingDelay: 0.20,
    aaTrackingDuration: 0.85,
    aaTurnRate: 1.65,
    shellGravity: 320,
    shellDefaultElevation: 6,
    aaDefaultElevation: 12,
    gunElevationMin: -2,
    gunElevationMax: 45,
    aaElevationMin: 2,
    aaElevationMax: 70,
    gunElevationStep: 2,
    apsCharges: 4,
    apsCooldown: 15,
    cameraSmooth: 0.06,
    speedPenaltyPerShell: 0.002,
    speedPenaltyPerMG: 0.0008,
    aiStayDuration: 5,
    pathGridSize: 150,
    pathRefreshInterval: 1.5,
    pathMaxNodes: 2000,
    baseDefenseRange: 400,
    baseDefenseDamage: 120,
    baseDefenseCooldown: 2.0,
    baseRageThreshold: 0.30,
    baseRageDamageMultiplier: 2,
    baseRageFireRateMultiplier: 2,
    ricochetMaxGrazingAngle: 15,
    ricochetDamageMultiplier: 0.5,
    ricochetFriendlySpeedBoost: 0.10,
    ricochetFriendlyBoostDuration: 5,
    aiTankMinDistance: 70,
    mgPenetration: 3,
    spatialGridSize: 300,
    aiFlankAngle: Math.PI / 3,
    aiFocusFireRange: 600,
    aiGroupUpRange: 400,
    autoAimInterval: 2.0,
    autoAimRange: 1200,
    autoAimSmoothSpeed: 0.12,
    autoAimPredictFactor: 1.5,
};


// ==================== 坦克数据（完整版） ====================
const TANKS = {
    zuoyan29: {
        name: "左研29", desc: "原型突击型 - 高机动轻型坦克",
        hp: 800, maxHp: 800, speed: 5.5, turnSpeed: 0.09, armor: 0.7, fireRate: 1.1,
        color: "#4488ff", accent: "#88ccff", shape: "light",
        maxShells: 80, maxMG: 200, turretSize: 20, exhaustColor: "#4488ff",
        ultimate: { name: "疾风突袭", cooldown: 25, duration: 3, speedBoost: 0.8, turnBoost: 2.0, trailDuration: 5, debuffDuration: 2, debuffTurretSlow: 0.5 }
    },
    zuoyan30: {
        name: "左研30", desc: "极速侦察型 - 隐身刺杀专家",
        hp: 650, maxHp: 650, speed: 6.5, turnSpeed: 0.11, armor: 0.5, fireRate: 1.2,
        color: "#00aaff", accent: "#66ddff", shape: "light",
        maxShells: 60, maxMG: 170, turretSize: 18, exhaustColor: "#00aaff",
        ultimate: { name: "幽灵漫步", cooldown: 30, duration: 3, ghostSpeedBoost: 0.5, canPassObstacles: true, stunRadius: 120, stunDuration: 1.0, revealOnFire: true }
    },
    zuoyan1: {
        name: "左研1", desc: "初代实验型 - 自杀式抢点",
        hp: 700, maxHp: 700, speed: 4.5, turnSpeed: 0.085, armor: 0.6, fireRate: 1.0,
        color: "#3388cc", accent: "#77bbee", shape: "light",
        maxShells: 65, maxMG: 120, turretSize: 16, exhaustColor: "#3388cc",
        ultimate: { name: "过载引擎", cooldown: 35, duration: 5, speedBoost: 1.5, turnBoost: 1.5, overheatDuration: 3, overheatSpeedMult: 0.0, overheatTurretLock: true }
    },
    xingchen27a: {
        name: "星辰27A", desc: "标准护卫型 - 团队核心",
        hp: 1200, maxHp: 1200, speed: 4.0, turnSpeed: 0.07, armor: 1.1, fireRate: 1.0,
        color: "#44aa44", accent: "#88dd88", shape: "medium",
        maxShells: 100, maxMG: 180, turretSize: 24, exhaustColor: "#44aa44",
        ultimate: { name: "钢铁意志", cooldown: 35, duration: 4, armorBoost: 3.0, shieldRadius: 150, damageRedirect: 0.4, shieldHp: 2000 }
    },
    xingchen27b: {
        name: "星辰27B", desc: "重装堡垒型 - 人形障碍物",
        hp: 2500, maxHp: 2500, speed: 2.0, turnSpeed: 0.04, armor: 2.5, fireRate: 0.8,
        color: "#228822", accent: "#55bb55", shape: "heavy",
        maxShells: 120, maxMG: 200, turretSize: 28, exhaustColor: "#228822",
        ultimate: { name: "绝对领域", cooldown: 40, duration: 5, armorMult: 5.0, reflectDamage: 0.3, canMove: false, reflectRadius: 80 }
    },
    xingchen27s: {
        name: "星辰27S", desc: "快速反应型 - 救场补位",
        hp: 1000, maxHp: 1000, speed: 5.0, turnSpeed: 0.08, armor: 0.9, fireRate: 1.15,
        color: "#66cc66", accent: "#aaeeaa", shape: "medium",
        maxShells: 90, maxMG: 160, turretSize: 22, exhaustColor: "#66cc66",
        ultimate: { name: "紧急跃迁", cooldown: 20, teleportDist: 200, shieldDuration: 3, shieldRadius: 80, shieldHp: 800, revealGhost: true }
    },
    duoduo: {
        name: "多多号主战坦克", desc: "正面攻坚型 - 阵地突破",
        hp: 2000, maxHp: 2000, speed: 2.5, turnSpeed: 0.045, armor: 2.0, fireRate: 0.75,
        color: "#cc7744", accent: "#eeaa66", shape: "heavy",
        maxShells: 60, maxMG: 120, turretSize: 30, exhaustColor: "#cc7744",
        ultimate: { name: "毁灭齐射", cooldown: 40, chargeTime: 2, shellCount: 12, spreadAngle: Math.PI / 3, damagePerShell: 150, knockback: 50, baseDamageMult: 2.0 }
    },
    duoduo_ifv: {
        name: "多多号步战车", desc: "持续压制型 - 守点绞肉",
        hp: 1500, maxHp: 1500, speed: 3.2, turnSpeed: 0.06, armor: 1.3, fireRate: 1.0,
        color: "#cc6633", accent: "#dd9955", shape: "medium",
        maxShells: 80, maxMG: 300, turretSize: 22, exhaustColor: "#cc6633",
        ultimate: { name: "弹幕风暴", cooldown: 30, duration: 8, mgRateMult: 3.0, mgSpreadMult: 0.5, infiniteAmmo: true, canMove: false, damageBoost: 1.5 }
    },
    duoduo_spat: {
        name: "多多号自移车", desc: "远程狙击型 - 全图威慑",
        hp: 1000, maxHp: 1000, speed: 3.0, turnSpeed: 0.05, armor: 0.8, fireRate: 0.6,
        color: "#bb5522", accent: "#dd8855", shape: "light",
        maxShells: 40, maxMG: 80, turretSize: 35, exhaustColor: "#bb5522",
        ultimate: { name: "天罚之钉", cooldown: 45, lockTime: 3, damageFirst: 500, damageDecay: 0.6, penetration: true, range: 5000, laserReveal: true, armorIgnore: true }
    },
    zuoyan_x: {
        name: "左研X", desc: "全能指挥官型 - 团队增益核心",
        hp: 1100, maxHp: 1100, speed: 4.2, turnSpeed: 0.08, armor: 1.0, fireRate: 1.0,
        color: "#8866ff", accent: "#bb99ff", shape: "medium",
        maxShells: 90, maxMG: 170, turretSize: 24, exhaustColor: "#8866ff",
        ultimate: { 
            name: "战术指挥", 
            cooldown: 35, 
            duration: 6, 
            radius: 200,
            fireRateBoost: 0.25,
            speedBoost: 0.15,
            armorBoost: 0.3
        }
    },
    zuoyan31: {
        name: "左研31", desc: "无人机母机型 - 蜂群战术",
        hp: 900, maxHp: 900, speed: 4.5, turnSpeed: 0.08, armor: 0.8, fireRate: 1.0,
        color: "#5599ff", accent: "#99ccff", shape: "light",
        maxShells: 70, maxMG: 160, turretSize: 20, exhaustColor: "#5599ff",
        ultimate: { name: "蜂群出击", cooldown: 30, droneCount: 3, droneDamage: 200, droneSpeed: 8, droneLife: 5, trackRange: 800 }
    },
    zuoyan32: {
        name: "左研32", desc: "诱饵干扰型 - 全息欺骗",
        hp: 750, maxHp: 750, speed: 5.0, turnSpeed: 0.10, armor: 0.6, fireRate: 1.1,
        color: "#77bbff", accent: "#bbddff", shape: "light",
        maxShells: 60, maxMG: 140, turretSize: 18, exhaustColor: "#77bbff",
        ultimate: { name: "全息投影", cooldown: 25, duration: 6, cloneCount: 2, cloneHp: 400, cloneDamageMult: 0.4 }
    },
    zuoyan33: {
        name: "左研33", desc: "毒素持续伤害型 - 慢性绞杀",
        hp: 850, maxHp: 850, speed: 5.2, turnSpeed: 0.09, armor: 0.7, fireRate: 1.15,
        color: "#44dd88", accent: "#88eebb", shape: "light",
        maxShells: 75, maxMG: 180, turretSize: 19, exhaustColor: "#44dd88",
        ultimate: { name: "神经毒素", cooldown: 28, duration: 5, dotDamage: 30, dotInterval: 1, slowPercent: 0.2, applyChance: 0.4 }
    },
    xingchen27c: {
        name: "星辰27C", desc: "反隐领域型 - 隐身克星",
        hp: 1300, maxHp: 1300, speed: 3.5, turnSpeed: 0.06, armor: 1.3, fireRate: 0.9,
        color: "#33aa33", accent: "#77dd77", shape: "medium",
        maxShells: 110, maxMG: 190, turretSize: 24, exhaustColor: "#33aa33",
        ultimate: { name: "全域照明", cooldown: 35, duration: 5, revealRadius: 2000, preventStealth: true }
    },
    xingchen27d: {
        name: "星辰27D", desc: "伤害链接型 - 共生防御",
        hp: 1100, maxHp: 1100, speed: 4.0, turnSpeed: 0.07, armor: 1.0, fireRate: 0.95,
        color: "#55bb55", accent: "#99dd99", shape: "medium",
        maxShells: 95, maxMG: 170, turretSize: 23, exhaustColor: "#55bb55",
        ultimate: { name: "共生链接", cooldown: 30, duration: 5, linkRadius: 300, damageReduction: 0.30, shareHeal: true }
    },
    xingchen27e: {
        name: "星辰27E", desc: "斩杀处决型 - 低血收割",
        hp: 1000, maxHp: 1000, speed: 4.2, turnSpeed: 0.075, armor: 0.9, fireRate: 0.85,
        color: "#66cc44", accent: "#aaee88", shape: "medium",
        maxShells: 85, maxMG: 150, turretSize: 22, exhaustColor: "#66cc44",
        ultimate: { name: "最终审判", cooldown: 32, duration: 6, damageBoost: 0.40, executeThreshold: 0.30, executeDamage: 500 }
    },
    duoduo_eng: {
        name: "多多号工程车", desc: "阵地建造型 - 以静制动",
        hp: 1800, maxHp: 1800, speed: 2.0, turnSpeed: 0.04, armor: 2.2, fireRate: 0.7,
        color: "#dd8833", accent: "#ffbb66", shape: "heavy",
        maxShells: 100, maxMG: 140, turretSize: 26, exhaustColor: "#dd8833",
        ultimate: { name: "自动炮塔", cooldown: 40, turretHp: 800, turretArmor: 1.5, turretRange: 500, turretDamage: 80, duration: 20 }
    },
    duoduo_rocket: {
        name: "多多号火箭炮", desc: "区域轰炸型 - 火力覆盖",
        hp: 1200, maxHp: 1200, speed: 2.8, turnSpeed: 0.05, armor: 1.0, fireRate: 0.6,
        color: "#cc5522", accent: "#ee8855", shape: "heavy",
        maxShells: 65, maxMG: 120, turretSize: 28, exhaustColor: "#cc5522",
        ultimate: { name: "火箭弹幕", cooldown: 38, shellCount: 8, shellDamage: 150, spreadRadius: 200, burnDuration: 3, burnDamage: 20 }
    },
    duoduo_emp: {
        name: "多多号磁暴车", desc: "EMP干扰型 - 电子战专家",
        hp: 1400, maxHp: 1400, speed: 3.0, turnSpeed: 0.05, armor: 1.2, fireRate: 0.8,
        color: "#bb5522", accent: "#dd8855", shape: "medium",
        maxShells: 80, maxMG: 120, maxAA: 20, turretSize: 26, exhaustColor: "#bb5522",
        ultimate: { name: "电磁脉冲", cooldown: 35, duration: 5, radius: 400, jamDuration: 8, damage: 100 }
    },
    niuniu_heli: {
        name: "牛牛直升机", desc: "空中支援型 - 垂直轰炸与空对空压制",
        hp: 600, maxHp: 600, speed: 7.0, turnSpeed: 0.15, armor: 0.4, fireRate: 1.3,
        color: "#44ddff", accent: "#88eeff", shape: "helicopter",
        maxShells: 32, maxMG: 220, maxAA: 0, turretSize: 22, exhaustColor: "#44ddff",
        isFlying: true, canPassObstacles: true, weight: 0.6,
        ultimate: { name: "空中打击", cooldown: 35, duration: 4, bombCount: 5, bombDamage: 300, bombRadius: 100 }
    },
    kimi_tank: {
        name: "Kimi主战坦克", desc: "AI类隐藏坦克 - 瞒天过海",
        hp: 1500, maxHp: 1500, speed: 4.5, turnSpeed: 0.08, armor: 1.2, fireRate: 1.0,
        color: "#9c27b0", accent: "#ce93d8", shape: "medium",
        maxShells: 90, maxMG: 180, maxAA: 20, turretSize: 24, exhaustColor: "#9c27b0",
        weight: 1.5, isHidden: true, unlockRequirement: 'tankAce',
        ultimate: { name: "瞒天过海", cooldown: 40, duration: 5, cloneCount: 3, cloneHp: 300, disguiseAs: 'zuoyan29', hpCost: 300 }
    }
};

// 为所有坦克添加默认maxAA和weight
Object.keys(TANKS).forEach(key => {
    if(TANKS[key].maxAA === undefined) TANKS[key].maxAA = 15;
    if(TANKS[key].weight === undefined) {
        if(TANKS[key].shape === 'helicopter') TANKS[key].weight = 8;
        else if(TANKS[key].shape === 'light') TANKS[key].weight = 25;
        else if(TANKS[key].shape === 'medium') TANKS[key].weight = 40;
        else if(TANKS[key].shape === 'heavy') TANKS[key].weight = 65;
        else TANKS[key].weight = 35;
    }
});


// ==================== 全局状态 ====================
let canvas, ctx, minimapCanvas, minimapCtx;
let gameState = 'start';
let selectedTank = null;
let gameMode = 'classic';
let gameConfig = {};
let lastMatchSetup = null;
let camera = { x: 0, y: 0, zoom: 1 };
let gameTime = CONFIG.gameTime;
let lastTime = 0;
let keys = {};
let mouse = { x: 0, y: 0, down: false, worldX: 0, worldY: 0 };
let joystick = { active: false, dx: 0, dy: 0 };
let helicopterLiftInput = 0;
let touchControlMode = false;
let mobileDenseCombatMode = false;

let player = null;

// AbortController polyfill for older browsers
if (typeof AbortController === 'undefined') {
    window.AbortController = function() {
        this.signal = { aborted: false, addEventListener: function() {}, removeEventListener: function() {} };
    };
    AbortController.prototype.abort = function() {
        this.signal.aborted = true;
    };
}

let allies = [];
let enemies = [];
let bullets = [];
let particles = [];
let exhaustTrails = [];
let outposts = [];
let bases = { blue: null, red: null };
let obstacles = [];
let outpostSpawnTimers = {};
let aiTanks = [];
let trailEffects = [];
let damageNumbers = [];
let terrainZones = [];
let snowTracks = [];
let environmentState = {
    sandstormActive: false,
    sandstormTimer: 0,
    nextSandstorm: 20,
    windAngle: 0,
    windStrength: 0
};

// 新模式状态变量
let ctfFlags = { blue: null, red: null };
let ctfScores = { blue: 0, red: 0 };
let ctfFlagCarriers = { blue: null, red: null };
let infectionData = { infected: [], survivors: [], patientZero: null, infectionStartTime: 0 };
let stormData = { safeZone: { x: 0, y: 0, radius: 0 }, nextSafeZone: { x: 0, y: 0, radius: 0 }, shrinkStartTime: 0, shrinkDuration: 30000, stormDamage: 32, phase: 0 };

let currentWeapon = 'shell';
let pathGrid = null;
let pathGridWidth = 0;
let pathGridHeight = 0;
let factoryPathGrids = null;

let spatialGrid = new Map();
let spatialGridKeys = [];

const AI_BEHAVIOR = {
    NONE: 0,
    FLANK_LEFT: 1,
    FLANK_RIGHT: 2,
    FOCUS_FIRE: 3,
    GROUP_UP: 4,
    RETREAT_AND_HEAL: 5,
};

// 事件监听器引用（用于清理）
const eventListeners = [];
let mapElements = [];
let controlsInitialized = false;
let introModalInitialized = false;
