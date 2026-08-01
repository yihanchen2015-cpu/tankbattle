// ==================== 坦克专属 1–8 阶进化 ====================
// 与熟练度 XP 共用等级，但每辆核心载具拥有独立名称、外观和战斗机制。
const EVOLUTION_TANK_TYPES = Object.freeze([
    'zuoyan29', 'zuoyan30', 'zuoyan1',
    'zuoyan31', 'zuoyan32', 'zuoyan33',
    'xingchen27a', 'xingchen27b', 'xingchen27s',
    'xingchen27c', 'xingchen27d', 'xingchen27e',
    'duoduo', 'duoduo_ifv', 'duoduo_spat',
    'duoduo_eng', 'duoduo_rocket', 'duoduo_emp',
    'niuniu_heli', 'kimi_tank'
]);

function evolutionStage(name, visual, mechanic, effects = {}) {
    return Object.freeze({ name, visual, mechanic, effects: Object.freeze(effects) });
}

const TANK_EVOLUTIONS = Object.freeze({
    zuoyan29: Object.freeze([
        evolutionStage('新兵', '原版灰色', '无效果'),
        evolutionStage('老兵', '炮口带淡蓝光晕', '炮弹有少量击退（30）', { shellKnockback: 30, muzzleGlow: '#8deaff' }),
        evolutionStage('精英', '炮弹变成棱柱形', '10% 概率穿透 1 辆', { shellKnockback: 30, penetrationChance: .10, projectileStyle: 'prism', muzzleGlow: '#8deaff' }),
        evolutionStage('冰霜突击', '炮弹带冰蓝拖尾', '15% 概率冰冻 0.5 秒', { shellKnockback: 30, penetrationChance: .10, freezeChance: .15, freezeDuration: .5, projectileStyle: 'ice-prism', projectileTrail: '#76e8ff', muzzleGlow: '#8deaff' }),
        evolutionStage('冰晶王牌', '车身覆盖薄冰晶', '冰冻概率 25%，持续 1 秒', { shellKnockback: 30, penetrationChance: .10, freezeChance: .25, freezeDuration: 1, projectileStyle: 'ice-prism', projectileTrail: '#76e8ff', bodyStyle: 'ice-crystal', palette: ['#8ed8e8', '#d9fbff'] }),
        evolutionStage('极寒突袭', '开大时全屏飘雪', '大招首次命中必定冰冻', { shellKnockback: 30, penetrationChance: .10, freezeChance: .25, freezeDuration: 1, ultimateFirstFreeze: true, projectileStyle: 'ice-prism', projectileTrail: '#76e8ff', bodyStyle: 'ice-crystal', weatherFx: 'snow', palette: ['#78cfe5', '#e7fdff'] }),
        evolutionStage('冰霜传奇', '车身被冰甲覆盖', '受击时 20% 概率减速攻击者', { shellKnockback: 30, penetrationChance: .10, freezeChance: .25, freezeDuration: 1, ultimateFirstFreeze: true, retaliateSlowChance: .20, projectileStyle: 'ice-prism', projectileTrail: '#76e8ff', bodyStyle: 'ice-armor', weatherFx: 'snow', palette: ['#5eb6d7', '#d8f8ff'] }),
        evolutionStage('永冻战神', '金蓝冰晶混合', '冰冻 35%/1.5 秒，穿透 +1', { shellKnockback: 30, penetrationChance: 1, extraPenetration: 1, freezeChance: .35, freezeDuration: 1.5, ultimateFirstFreeze: true, retaliateSlowChance: .20, projectileStyle: 'gold-ice-prism', projectileTrail: '#8defff', bodyStyle: 'eternal-ice', weatherFx: 'snow', palette: ['#4ca8d8', '#ffd95c'] })
    ]),
    zuoyan30: Object.freeze([
        evolutionStage('新兵', '原版灰色', '无效果'),
        evolutionStage('暗影新兵', '车身微微透明', '静止 1 秒后进入半隐身', { passiveStealth: true, stealthOpacity: .40, palette: ['#536071', '#9aa7b8'] }),
        evolutionStage('暗影斥候', '移动时带黑色残影', '隐身状态移速 +15%', { passiveStealth: true, stealthOpacity: .40, stealthSpeed: .15, trailColor: '#17131f', bodyStyle: 'shadow' }),
        evolutionStage('幽灵猎手', '车身更加透明', '隐身第一发攻击必定暴击 ×1.5', { passiveStealth: true, stealthOpacity: .32, stealthSpeed: .15, stealthFirstCrit: 1.5, trailColor: '#17131f', bodyStyle: 'ghost' }),
        evolutionStage('幻影王牌', '残影变成紫色', '隐身状态可穿过敌方坦克', { passiveStealth: true, stealthOpacity: .30, stealthSpeed: .15, stealthFirstCrit: 1.5, phaseTanks: true, trailColor: '#7437ba', bodyStyle: 'phantom' }),
        evolutionStage('虚空行者', '大招期间完全透明', '大招隐身攻击不显形', { passiveStealth: true, stealthOpacity: .28, stealthSpeed: .15, stealthFirstCrit: 1.5, phaseTanks: true, ultimateNoReveal: true, ultimateOpacity: .04, trailColor: '#7437ba', bodyStyle: 'void' }),
        evolutionStage('暗影传奇', '残影带暗紫闪电', '脱离隐身震晕周围敌人 0.5 秒', { passiveStealth: true, stealthOpacity: .25, stealthSpeed: .15, stealthFirstCrit: 1.5, phaseTanks: true, ultimateNoReveal: true, ultimateOpacity: .04, stealthExitStun: .5, trailColor: '#9d4bff', bodyStyle: 'void-lightning' }),
        evolutionStage('虚空战神', '若隐若现，星点环绕', '隐身攻击 +30%，永久半透明', { passiveStealth: true, stealthOpacity: .24, permanentOpacity: .56, stealthSpeed: .15, stealthFirstCrit: 1.5, stealthDamage: 1.3, phaseTanks: true, ultimateNoReveal: true, ultimateOpacity: .03, stealthExitStun: .5, trailColor: '#c075ff', bodyStyle: 'star-void', palette: ['#2d2447', '#d59cff'] })
    ]),
    zuoyan1: Object.freeze([
        evolutionStage('新兵', '原版灰色', '无效果'),
        evolutionStage('过载新兵', '引擎冒橙色火花', '加速时尾焰变长', { trailColor: '#ff8b2d', bodyStyle: 'overload' }),
        evolutionStage('过载精英', '车体带暗红条纹', '生命低于 30% 时移速 +20%', { lowHpThreshold: .30, lowHpSpeed: .20, trailColor: '#ff7a28', bodyStyle: 'red-stripe' }),
        evolutionStage('狂战士', '红色裂纹发光', '生命低于 30% 时攻击 +25%', { lowHpThreshold: .30, lowHpSpeed: .20, lowHpDamage: .25, trailColor: '#ff5b24', bodyStyle: 'red-cracks' }),
        evolutionStage('血怒王牌', '裂纹变成熔岩色', '残血时大招充能加速 50%', { lowHpThreshold: .30, lowHpSpeed: .20, lowHpDamage: .25, lowHpUltCharge: .50, trailColor: '#ff4d1f', bodyStyle: 'lava-cracks', palette: ['#6b2c1f', '#ff7a1c'] }),
        evolutionStage('狂暴突袭', '车体燃烧', '开大后对周围敌人每秒造成 30 伤害', { lowHpThreshold: .30, lowHpSpeed: .20, lowHpDamage: .25, lowHpUltCharge: .50, ultimateBurnDps: 30, trailColor: '#ff351b', bodyStyle: 'burning' }),
        evolutionStage('熔岩传奇', '熔岩裂纹蔓延全车', '阵亡时范围 150 爆炸，伤害 200', { lowHpThreshold: .30, lowHpSpeed: .20, lowHpDamage: .25, lowHpUltCharge: .50, ultimateBurnDps: 30, deathExplosionRadius: 150, deathExplosionDamage: 200, trailColor: '#ff2c16', bodyStyle: 'full-lava' }),
        evolutionStage('末日战神', '熔岩流动并冒黑烟', '生命低于 50% 全属性 +25%，死亡爆炸翻倍', { lowHpThreshold: .50, lowHpSpeed: .25, lowHpDamage: .25, lowHpFireRate: .25, lowHpDefense: .25, lowHpUltCharge: .50, ultimateBurnDps: 30, deathExplosionRadius: 300, deathExplosionDamage: 400, trailColor: '#ffbd42', bodyStyle: 'doomsday-lava', palette: ['#271b19', '#ff5b1d'] })
    ]),
    xingchen27a: Object.freeze([
        evolutionStage('新兵', '原版灰色', '无效果'),
        evolutionStage('护盾新兵', '车身带淡绿色光晕', '护盾持续 +1 秒', { shieldDurationBonus: 1, auraColor: '#8df5a5' }),
        evolutionStage('护卫精英', '光晕变翠绿色', '护盾期间周围友军回血 5/秒', { shieldDurationBonus: 1, shieldHealAura: 5, auraColor: '#38df7b' }),
        evolutionStage('钢铁护卫', '车身增加绿色甲片', '护盾 HP +30%', { shieldDurationBonus: 1, shieldHealAura: 5, shieldHpMult: 1.3, bodyStyle: 'green-plates', auraColor: '#38df7b' }),
        evolutionStage('守护王牌', '甲片带金色描边', '护盾破碎时震退周围敌人', { shieldDurationBonus: 1, shieldHealAura: 5, shieldHpMult: 1.3, shieldBreakKnockback: 90, bodyStyle: 'gold-green-plates', auraColor: '#8bea86' }),
        evolutionStage('圣盾护卫', '护盾带金色光芒', '大招期间全队获得 300 护盾', { shieldDurationBonus: 1, shieldHealAura: 5, shieldHpMult: 1.3, shieldBreakKnockback: 90, teamShield: 300, bodyStyle: 'holy-shield', auraColor: '#ffe475' }),
        evolutionStage('守护传奇', '金光化为圣光', '护盾持续期间免疫控制', { shieldDurationBonus: 1, shieldHealAura: 5, shieldHpMult: 1.3, shieldBreakKnockback: 90, teamShield: 300, shieldControlImmune: true, bodyStyle: 'holy-light', auraColor: '#fff0a1' }),
        evolutionStage('圣盾战神', '金绿圣光环绕', '护盾 HP 翻倍，破碎时全队回血 20%', { shieldDurationBonus: 1, shieldHealAura: 5, shieldHpMult: 2, shieldBreakKnockback: 90, teamShield: 300, shieldControlImmune: true, shieldBreakTeamHeal: .20, bodyStyle: 'divine-shield', auraColor: '#eaff94', palette: ['#2f8f55', '#ffe270'] })
    ]),
    xingchen27b: Object.freeze([
        evolutionStage('新兵', '原版灰色', '无效果'),
        evolutionStage('铁壁新兵', '车身带铁灰条纹', '受击后更快恢复', { hitRecoveryMult: .65, bodyStyle: 'iron-stripe' }),
        evolutionStage('铁壁精英', '装甲板凸起', '正面减伤 +15%', { hitRecoveryMult: .65, frontalReduction: .15, bodyStyle: 'raised-armor' }),
        evolutionStage('堡垒', '车身加厚装甲', '开大期间不可被击退', { hitRecoveryMult: .65, frontalReduction: .15, fortressKnockbackImmune: true, bodyStyle: 'thick-armor' }),
        evolutionStage('不破王牌', '装甲带铆钉细节', '生命低于 40% 时回血 10/秒', { hitRecoveryMult: .65, frontalReduction: .15, fortressKnockbackImmune: true, regenThreshold: .40, regenPerSecond: 10, bodyStyle: 'riveted-armor' }),
        evolutionStage('钢铁堡垒', '钢铁质感强化', '开大期间反弹伤害 +50%', { hitRecoveryMult: .65, frontalReduction: .15, fortressKnockbackImmune: true, regenThreshold: .40, regenPerSecond: 10, reflectMult: 1.5, bodyStyle: 'steel-fortress' }),
        evolutionStage('不灭传奇', '装甲配金色铆钉', '阵亡后留下 20 秒掩体', { hitRecoveryMult: .65, frontalReduction: .15, fortressKnockbackImmune: true, regenThreshold: .40, regenPerSecond: 10, reflectMult: 1.5, deathCoverDuration: 20, bodyStyle: 'gold-rivets' }),
        evolutionStage('不朽战神', '金色钢铁圣光', '开大时免控并减伤 50%', { hitRecoveryMult: .65, frontalReduction: .15, fortressKnockbackImmune: true, regenThreshold: .40, regenPerSecond: 10, reflectMult: 1.5, deathCoverDuration: 20, fortressControlImmune: true, fortressReduction: .50, bodyStyle: 'immortal-steel', palette: ['#8d8f8e', '#ffd85c'] })
    ]),
    xingchen27s: Object.freeze([
        evolutionStage('新兵', '原版灰色', '无效果'),
        evolutionStage('疾风新兵', '车身带白色气流', '移速 +5%', { speedMult: 1.05, trailColor: '#e8f8ff' }),
        evolutionStage('疾风斥候', '地面留下风痕', '移速 +10%，转向 +10%', { speedMult: 1.10, turnMult: 1.10, trailColor: '#d5f5ff', bodyStyle: 'wind' }),
        evolutionStage('闪电机动', '车身带蓝色电光', '跃迁后 1 秒内移速 +50%', { speedMult: 1.10, turnMult: 1.10, teleportSpeed: .50, teleportSpeedDuration: 1, trailColor: '#55c9ff', bodyStyle: 'blue-lightning' }),
        evolutionStage('闪电王牌', '电光变亮', '跃迁后可再次短距离跃迁', { speedMult: 1.10, turnMult: 1.10, teleportSpeed: .50, teleportSpeedDuration: 1, secondTeleport: 240, trailColor: '#5ee8ff', bodyStyle: 'bright-lightning' }),
        evolutionStage('瞬移大师', '跃迁留下蓝色残影', '周围敌人减速 30%，持续 2 秒', { speedMult: 1.10, turnMult: 1.10, teleportSpeed: .50, teleportSpeedDuration: 1, secondTeleport: 240, teleportSlow: .30, teleportSlowDuration: 2, trailColor: '#48aaff', bodyStyle: 'teleport-master' }),
        evolutionStage('闪电传奇', '残影带金色闪电', '跃迁后下一发炮弹必定暴击', { speedMult: 1.10, turnMult: 1.10, teleportSpeed: .50, teleportSpeedDuration: 1, secondTeleport: 240, teleportSlow: .30, teleportSlowDuration: 2, teleportCrit: 1.5, trailColor: '#ffd95b', bodyStyle: 'gold-lightning' }),
        evolutionStage('雷霆战神', '金色电弧缠绕', '跃迁可穿墙，大招冷却 -30%', { speedMult: 1.10, turnMult: 1.10, teleportSpeed: .50, teleportSpeedDuration: 1, secondTeleport: 240, teleportSlow: .30, teleportSlowDuration: 2, teleportCrit: 1.5, teleportThroughWalls: true, ultimateCooldownMult: .70, trailColor: '#ffe66b', bodyStyle: 'thunder-god', palette: ['#397cb8', '#ffd95b'] })
    ]),
    duoduo: Object.freeze([
        evolutionStage('新兵', '原版灰色', '无效果'),
        evolutionStage('重炮新兵', '炮管带金色环', '主炮伤害 +5%', { shellDamageMult: 1.05, bodyStyle: 'gun-ring' }),
        evolutionStage('重炮手', '炮管带双金环', '主炮伤害 +10%，溅射范围 +15%', { shellDamageMult: 1.10, shellSplash: 34, splashMult: 1.15, bodyStyle: 'double-gun-ring' }),
        evolutionStage('攻城炮', '炮管变粗', '炮弹可炸毁小型障碍物', { shellDamageMult: 1.10, shellSplash: 34, splashMult: 1.15, destroySmallObstacles: true, bodyStyle: 'siege-gun' }),
        evolutionStage('攻坚王牌', '炮管配金红条纹', '齐射溅射范围 +30%', { shellDamageMult: 1.10, shellSplash: 34, splashMult: 1.15, destroySmallObstacles: true, salvoSplashMult: 1.30, bodyStyle: 'gold-red-gun' }),
        evolutionStage('毁灭者', '齐射炮口火焰冲天', '齐射无视 20% 护甲', { shellDamageMult: 1.10, shellSplash: 34, splashMult: 1.15, destroySmallObstacles: true, salvoSplashMult: 1.30, salvoArmorIgnore: .20, bodyStyle: 'destroyer' }),
        evolutionStage('攻城传奇', '车体带攻城锤纹章', '对建筑和基地伤害 +50%', { shellDamageMult: 1.10, shellSplash: 34, splashMult: 1.15, destroySmallObstacles: true, salvoSplashMult: 1.30, salvoArmorIgnore: .20, structureDamageMult: 1.50, bodyStyle: 'siege-legend' }),
        evolutionStage('毁灭战神', '炮管呈金色熔岩质感', '主炮穿透 +1，伤害 +25%', { shellDamageMult: 1.25, shellSplash: 34, splashMult: 1.15, destroySmallObstacles: true, salvoSplashMult: 1.30, salvoArmorIgnore: .20, structureDamageMult: 1.50, extraPenetration: 1, bodyStyle: 'molten-gold-gun', palette: ['#8d4b20', '#ffd35a'] })
    ]),
    duoduo_ifv: Object.freeze([
        evolutionStage('新兵', '原版灰色', '无效果'),
        evolutionStage('弹幕新兵', '枪口带火苗', '射速 +8%', { fireRateMult: 1.08, muzzleGlow: '#ff9b41' }),
        evolutionStage('弹幕精英', '弹道变成亮黄色', '机枪 5% 概率击退', { fireRateMult: 1.08, mgKnockbackChance: .05, shellKnockback: 22, projectileTrail: '#fff05d' }),
        evolutionStage('风暴压制', '弹道更加密集', '弹幕风暴期间可移动', { fireRateMult: 1.08, mgKnockbackChance: .05, shellKnockback: 22, stormCanMove: true, projectileTrail: '#fff05d', bodyStyle: 'dense-barrage' }),
        evolutionStage('弹幕王牌', '弹道变为金色', '机枪穿透 +1', { fireRateMult: 1.08, mgKnockbackChance: .05, shellKnockback: 22, stormCanMove: true, mgExtraPenetration: 1, projectileTrail: '#ffd84f', bodyStyle: 'gold-barrage' }),
        evolutionStage('风暴之王', '弹道带金色火花', '弹幕风暴伤害 +30%', { fireRateMult: 1.08, mgKnockbackChance: .05, shellKnockback: 22, stormCanMove: true, mgExtraPenetration: 1, stormDamageMult: 1.30, projectileTrail: '#ffca3e', bodyStyle: 'storm-king' }),
        evolutionStage('压制传奇', '车身增加弹链装饰', '机枪再穿透 +1，射速 +15%', { fireRateMult: 1.15, mgKnockbackChance: .05, shellKnockback: 22, stormCanMove: true, mgExtraPenetration: 2, stormDamageMult: 1.30, projectileTrail: '#ffc62e', bodyStyle: 'ammo-belt' }),
        evolutionStage('风暴战神', '金色弹道带电弧', '弹幕风暴无限弹药且伤害翻倍', { fireRateMult: 1.15, mgKnockbackChance: .05, shellKnockback: 22, stormCanMove: true, mgExtraPenetration: 2, stormDamageMult: 2, stormInfiniteAmmo: true, projectileTrail: '#ffe66d', projectileStyle: 'electric-gold', bodyStyle: 'barrage-god', palette: ['#a15a24', '#ffd85a'] })
    ]),
    duoduo_spat: Object.freeze([
        evolutionStage('新兵', '原版灰色', '无效果'),
        evolutionStage('狙击新兵', '炮口带红点', '射程 +5%', { rangeMult: 1.05, muzzleGlow: '#ff4343' }),
        evolutionStage('狙击精英', '瞄准时出现红色激光', '暴击率 +10%', { rangeMult: 1.05, critChance: .10, laserColor: '#ff3b3b' }),
        evolutionStage('穿甲狙击', '激光变细更亮', '天罚之钉无视 30% 装甲', { rangeMult: 1.05, critChance: .10, nailArmorIgnore: .30, laserColor: '#ff2222', bodyStyle: 'piercing-laser' }),
        evolutionStage('狙击王牌', '激光带金色光晕', '天罚之钉冷却 -15%', { rangeMult: 1.05, critChance: .10, nailArmorIgnore: .30, ultimateCooldownMult: .85, laserColor: '#ff5c38', bodyStyle: 'gold-laser' }),
        evolutionStage('死神狙击', '激光变成深红色', '天罚之钉可穿透 1 辆坦克', { rangeMult: 1.05, critChance: .10, nailArmorIgnore: .30, nailExtraTargets: 1, ultimateCooldownMult: .85, laserColor: '#cf1111', bodyStyle: 'death-laser' }),
        evolutionStage('狙击传奇', '车身迷彩并带瞄准镜标志', '天罚之钉伤害 +30%', { rangeMult: 1.05, critChance: .10, nailArmorIgnore: .30, nailExtraTargets: 1, nailDamageMult: 1.30, ultimateCooldownMult: .85, laserColor: '#d51b1b', bodyStyle: 'sniper-legend' }),
        evolutionStage('死神战神', '红色激光带金色核心', '天罚无视护甲，冷却 -30%', { rangeMult: 1.05, critChance: .10, nailArmorIgnore: 1, nailExtraTargets: 1, nailDamageMult: 1.30, ultimateCooldownMult: .70, laserColor: '#ffcf43', bodyStyle: 'death-god', palette: ['#713321', '#ffd354'] })
    ]),
    zuoyan31: Object.freeze([
        evolutionStage('无', '白板母机', '无效果'),
        evolutionStage('蜂群雏形', '增加一组蓝色蜂巢发射槽', '无人机数量 4', { droneCount: 4, bodyStyle: 'swarm-pods' }),
        evolutionStage('自动索敌', '无人机带蓝色锁定光束', '无人机自动追击最近敌人', { droneCount: 4, droneAutoTrack: true, bodyStyle: 'swarm-lock' }),
        evolutionStage('蜂群战术', '蜂群弹道变为高亮青蓝', '无人机伤害 +30%', { droneCount: 4, droneAutoTrack: true, droneDamageMult: 1.3, projectileTrail: '#68dcff', bodyStyle: 'swarm-tactics' }),
        evolutionStage('蜂巢核心', '车顶浮现六边形蜂巢核心', '无人机数量 6，冷却 -20%', { droneCount: 6, droneAutoTrack: true, droneDamageMult: 1.3, ultimateCooldownMult: .8, auraColor: '#5ccaff', bodyStyle: 'hive-core' }),
        evolutionStage('自爆蜂群', '无人机缠绕橙蓝警示电弧', '无人机被击落时范围 100 自爆', { droneCount: 6, droneAutoTrack: true, droneDamageMult: 1.3, ultimateCooldownMult: .8, droneDeathExplosionRadius: 100, droneDeathExplosionDamage: 100, auraColor: '#67d9ff', bodyStyle: 'suicide-swarm' }),
        evolutionStage('女王蜂', '金色女王蜂徽记悬浮', '无人机数量 9，伤害 +60%', { droneCount: 9, droneAutoTrack: true, droneDamageMult: 1.6, ultimateCooldownMult: .8, droneDeathExplosionRadius: 100, droneDeathExplosionDamage: 100, auraColor: '#ffe266', bodyStyle: 'queen-bee' }),
        evolutionStage('无限蜂群', '金蓝蜂群星环持续环绕', '无人机无限持续，每 8 秒补充 1 架', { droneCount: 9, droneAutoTrack: true, droneDamageMult: 1.6, ultimateCooldownMult: .8, droneDeathExplosionRadius: 100, droneDeathExplosionDamage: 100, droneInfinite: true, droneReplenishInterval: 8, auraColor: '#ffe66d', bodyStyle: 'infinite-swarm', palette: ['#377fc7', '#ffd95d'] })
    ]),
    zuoyan32: Object.freeze([
        evolutionStage('无', '白板幻影车', '无效果'),
        evolutionStage('幻影分身', '车身投射浅蓝重影', '开大生成 1 个幻影，继承 40% 属性', { phantomCount: 1, phantomStatRatio: .4, bodyStyle: 'holo-echo' }),
        evolutionStage('虚张声势', '幻影炮口出现微弱光点', '幻影自动开火，伤害 20%', { phantomCount: 1, phantomStatRatio: .4, phantomCanFire: true, phantomDamageMult: .2, bodyStyle: 'holo-fire' }),
        evolutionStage('真假难辨', '车体产生双层错位轮廓', '幻影数量 2', { phantomCount: 2, phantomStatRatio: .4, phantomCanFire: true, phantomDamageMult: .2, bodyStyle: 'double-holo' }),
        evolutionStage('幻影大师', '全息轮廓变为亮紫色', '幻影伤害提升至 50%', { phantomCount: 2, phantomStatRatio: .4, phantomCanFire: true, phantomDamageMult: .5, bodyStyle: 'phantom-master' }),
        evolutionStage('幻影突袭', '幻影核心带紫色爆裂纹', '幻影爆炸眩晕周围敌人 1 秒', { phantomCount: 2, phantomStatRatio: .4, phantomCanFire: true, phantomDamageMult: .5, phantomExplosionStun: 1, bodyStyle: 'phantom-assault' }),
        evolutionStage('虚实合一', '四道金紫全息影环绕', '幻影数量 4，伤害 70%', { phantomCount: 4, phantomStatRatio: .4, phantomCanFire: true, phantomDamageMult: .7, phantomExplosionStun: 1, bodyStyle: 'real-and-virtual' }),
        evolutionStage('千面幻影', '车身化为流动星紫全息面', '幻影无限持续并独立追击', { phantomCount: 4, phantomStatRatio: .4, phantomCanFire: true, phantomDamageMult: .7, phantomExplosionStun: 1, phantomInfinite: true, phantomIndependent: true, bodyStyle: 'thousand-phantoms', palette: ['#624aa6', '#e2b9ff'] })
    ]),
    zuoyan33: Object.freeze([
        evolutionStage('无', '白板毒素车', '无效果'),
        evolutionStage('神经毒素', '炮弹附着淡绿毒液', '10% 概率中毒：20/秒，持续 3 秒', { toxinChance: .1, toxinDamage: 20, toxinDuration: 3, projectileTrail: '#63e78c' }),
        evolutionStage('剧毒扩散', '毒液拖尾扩散成雾', '中毒目标减速 15%', { toxinChance: .1, toxinDamage: 20, toxinDuration: 3, toxinSlow: .15, projectileTrail: '#52df7e' }),
        evolutionStage('毒雾领域', '大招留下绿色毒雾领域', '毒雾 30/秒，持续 5 秒', { toxinChance: .1, toxinDamage: 20, toxinDuration: 3, toxinSlow: .15, poisonCloudDps: 30, poisonCloudDuration: 5, poisonCloudRadius: 120, bodyStyle: 'poison-cloud' }),
        evolutionStage('致命毒液', '毒液变为荧光黄绿', '中毒概率 20%，伤害 40/秒', { toxinChance: .2, toxinDamage: 40, toxinDuration: 3, toxinSlow: .15, poisonCloudDps: 30, poisonCloudDuration: 5, poisonCloudRadius: 120, projectileTrail: '#a6ff4f', bodyStyle: 'deadly-toxin' }),
        evolutionStage('毒性爆发', '中毒目标浮现紫绿弱点纹', '攻击中毒目标时暴击率 +30%', { toxinChance: .2, toxinDamage: 40, toxinDuration: 3, toxinSlow: .15, toxinCritChance: .3, poisonCloudDps: 30, poisonCloudDuration: 5, poisonCloudRadius: 120, bodyStyle: 'toxic-burst' }),
        evolutionStage('瘟疫使者', '毒雾化为浓烈紫绿漩涡', '中毒 30%，毒雾范围 +50%、伤害 +50%', { toxinChance: .3, toxinDamage: 40, toxinDuration: 3, toxinSlow: .15, toxinCritChance: .3, poisonCloudDps: 45, poisonCloudDuration: 5, poisonCloudRadius: 180, bodyStyle: 'plague-bringer' }),
        evolutionStage('致命瘟疫', '紫绿瘟疫符文笼罩车身', '毒素在 200 范围传染，伤害 60/秒', { toxinChance: .3, toxinDamage: 60, toxinDuration: 3, toxinSlow: .15, toxinCritChance: .3, poisonCloudDps: 45, poisonCloudDuration: 5, poisonCloudRadius: 180, toxinSpreadRadius: 200, bodyStyle: 'fatal-plague', palette: ['#3a7d4d', '#c5ff55'] })
    ]),
    xingchen27c: Object.freeze([
        evolutionStage('无', '白板反隐车', '无效果'),
        evolutionStage('探查雷达', '车顶旋转绿色雷达环', '200 范围自动显示隐身单位', { radarRadius: 200, auraColor: '#75ff88', bodyStyle: 'radar' }),
        evolutionStage('反隐弹药', '弹道带白绿扫描线', '命中后强制显形 2 秒', { radarRadius: 200, forceRevealDuration: 2, projectileTrail: '#b9ffbf', bodyStyle: 'anti-stealth-ammo' }),
        evolutionStage('净化之光', '炮口凝聚白绿色净化光', '对隐身或护盾敌人伤害 +20%', { radarRadius: 200, forceRevealDuration: 2, antiBuffDamageMult: 1.2, muzzleGlow: '#d4ffcb', bodyStyle: 'purifying-light' }),
        evolutionStage('全视之眼', '大型翠绿雷达眼展开', '探查范围 350', { radarRadius: 350, forceRevealDuration: 2, antiBuffDamageMult: 1.2, auraColor: '#6dff78', bodyStyle: 'all-seeing-eye' }),
        evolutionStage('破晓之光', '命中时爆发金绿清除脉冲', '命中移除护盾、加速与大招增益', { radarRadius: 350, forceRevealDuration: 2, antiBuffDamageMult: 1.2, purgeBuffsOnHit: true, muzzleGlow: '#fff79b', bodyStyle: 'dawn-light' }),
        evolutionStage('真理之眼', '全车环绕金绿真视刻度', '显形 4 秒，探查范围 500', { radarRadius: 500, forceRevealDuration: 4, antiBuffDamageMult: 1.2, purgeBuffsOnHit: true, auraColor: '#f1ff81', bodyStyle: 'truth-eye' }),
        evolutionStage('裁决者', '金白裁决光轮悬于车顶', '隐身敌人低于 30% 生命直接斩杀', { radarRadius: 500, forceRevealDuration: 4, antiBuffDamageMult: 1.2, purgeBuffsOnHit: true, stealthExecuteThreshold: .3, auraColor: '#fff178', bodyStyle: 'arbiter', palette: ['#398f52', '#ffe66c'] })
    ]),
    xingchen27d: Object.freeze([
        evolutionStage('无', '白板链接车', '无效果'),
        evolutionStage('生命链接', '最近队友之间出现绿色生命线', '共享 15% 治疗', { linkHealShare: .15, bodyStyle: 'life-link' }),
        evolutionStage('伤害分摊', '生命线增加双向护甲纹', '链接队友分摊 20% 伤害', { linkHealShare: .15, linkDamageShare: .2, bodyStyle: 'damage-link' }),
        evolutionStage('治愈之链', '链接线流动翠绿治疗粒子', '链接队友每秒恢复 5 HP', { linkHealShare: .15, linkDamageShare: .2, linkRegen: 5, bodyStyle: 'healing-chain' }),
        evolutionStage('共生契约', '链接化为金绿双螺旋', '分摊 40%，恢复 10 HP/秒', { linkHealShare: .15, linkDamageShare: .4, linkRegen: 10, bodyStyle: 'symbiosis' }),
        evolutionStage('生命守护', '链接端点形成守护结晶', '链接队友死亡时获得 300 护盾', { linkHealShare: .15, linkDamageShare: .4, linkRegen: 10, linkDeathShield: 300, bodyStyle: 'life-guard' }),
        evolutionStage('不朽链接', '链接线化为金色生命脉搏', '链接队友以 1 HP 存活 3 秒', { linkHealShare: .15, linkDamageShare: .4, linkRegen: 10, linkDeathShield: 300, linkUndyingDuration: 3, bodyStyle: 'immortal-link' }),
        evolutionStage('命运共同体', '全队被大型金绿网络连接', '全队分摊 50% 伤害，恢复速度翻倍', { linkHealShare: .15, linkDamageShare: .4, linkRegen: 10, linkDeathShield: 300, linkUndyingDuration: 3, teamDamageShare: .5, teamRegenMult: 2, bodyStyle: 'shared-destiny', palette: ['#4d9c63', '#ffe779'] })
    ]),
    xingchen27e: Object.freeze([
        evolutionStage('无', '白板审判车', '无效果'),
        evolutionStage('审判标记', '命中目标浮现金色准星', '标记 3 秒，队友伤害 +15%', { judgmentDuration: 3, judgmentDamageBonus: .15, judgmentTargets: 1, bodyStyle: 'judgment-mark' }),
        evolutionStage('罪孽深重', '标记增加红色罪纹', '击杀标记敌人，大招充能 +20%', { judgmentDuration: 3, judgmentDamageBonus: .15, judgmentTargets: 1, judgmentKillUltCharge: .2, bodyStyle: 'sin-mark' }),
        evolutionStage('处决时刻', '标记变为旋转处决准星', '对标记敌人暴击率 +30%', { judgmentDuration: 3, judgmentDamageBonus: .15, judgmentTargets: 1, judgmentKillUltCharge: .2, judgmentCritChance: .3, bodyStyle: 'execution-time' }),
        evolutionStage('最终审判', '金红审判光柱锁定目标', '标记 5 秒，伤害加成 30%', { judgmentDuration: 5, judgmentDamageBonus: .3, judgmentTargets: 1, judgmentKillUltCharge: .2, judgmentCritChance: .3, bodyStyle: 'final-judgment' }),
        evolutionStage('赎罪之击', '击杀时回流翠金生命光', '击杀标记敌人恢复 200 HP', { judgmentDuration: 5, judgmentDamageBonus: .3, judgmentTargets: 1, judgmentKillUltCharge: .2, judgmentCritChance: .3, judgmentKillHeal: 200, bodyStyle: 'atonement' }),
        evolutionStage('审判长', '双重金红标记轨道环绕', '可标记 2 个敌人，处决伤害 +50%', { judgmentDuration: 5, judgmentDamageBonus: .3, judgmentTargets: 2, judgmentKillUltCharge: .2, judgmentCritChance: .3, judgmentKillHeal: 200, judgmentExecuteDamageMult: 1.5, bodyStyle: 'chief-judge' }),
        evolutionStage('天罚裁决', '天罚符文与金红雷光覆盖车身', '标记禁用大招，死亡后范围 200 爆炸', { judgmentDuration: 5, judgmentDamageBonus: .3, judgmentTargets: 2, judgmentKillUltCharge: .2, judgmentCritChance: .3, judgmentKillHeal: 200, judgmentExecuteDamageMult: 1.5, judgmentDisableUltimate: true, judgmentDeathExplosionRadius: 200, judgmentDeathExplosionDamage: 200, bodyStyle: 'heavenly-verdict', palette: ['#589b42', '#ffd65a'] })
    ]),
    duoduo_eng: Object.freeze([
        evolutionStage('无', '白板工程车', '无效果'),
        evolutionStage('维修工具', '机械臂亮起橙色维修灯', '维修效率 +30%', { repairEfficiencyMult: 1.3, bodyStyle: 'repair-tools' }),
        evolutionStage('临时掩体', '车尾装载折叠装甲板', '可部署 1 个 300 HP 掩体，持续 30 秒', { repairEfficiencyMult: 1.3, coverCount: 1, coverHp: 300, coverDuration: 30, bodyStyle: 'cover-rack' }),
        evolutionStage('弹药补给', '维修臂增加弹药补给箱', '维修额外补充主炮 5、机枪 20', { repairEfficiencyMult: 1.3, coverCount: 1, coverHp: 300, coverDuration: 30, repairShellAmmo: 5, repairMgAmmo: 20, bodyStyle: 'ammo-supply' }),
        evolutionStage('要塞工程', '车体展开双组重型装甲板', '掩体 600 HP，可部署 2 个', { repairEfficiencyMult: 1.3, coverCount: 2, coverHp: 600, coverDuration: 30, repairShellAmmo: 5, repairMgAmmo: 20, bodyStyle: 'fortress-engineering' }),
        evolutionStage('急救包', '机械臂附加绿色急救模块', '维修额外瞬间恢复 50 HP', { repairEfficiencyMult: 1.3, coverCount: 2, coverHp: 600, coverDuration: 30, repairShellAmmo: 5, repairMgAmmo: 20, repairInstantBonus: 50, bodyStyle: 'first-aid' }),
        evolutionStage('钢铁堡垒', '三组金铆钉炮塔掩体折叠于车尾', '掩体 1200 HP，可部署 3 个并自动攻击 80 伤害', { repairEfficiencyMult: 1.3, coverCount: 3, coverHp: 1200, coverDuration: 30, repairShellAmmo: 5, repairMgAmmo: 20, repairInstantBonus: 50, coverAutoAttack: true, coverDamage: 80, bodyStyle: 'steel-cover' }),
        evolutionStage('移动基地', '车身展开金色移动维修基地', '掩体永久存在并治疗周围友军 10 HP/秒', { repairEfficiencyMult: 1.3, coverCount: 3, coverHp: 1200, coverDuration: Infinity, repairShellAmmo: 5, repairMgAmmo: 20, repairInstantBonus: 50, coverAutoAttack: true, coverDamage: 80, coverHealPerSecond: 10, bodyStyle: 'mobile-base', palette: ['#b3712e', '#ffd45c'] })
    ]),
    duoduo_rocket: Object.freeze([
        evolutionStage('无', '白板火箭车', '无效果'),
        evolutionStage('火箭弹幕', '发射架增加双联装导轨', '主炮 2 连发，间隔 0.1 秒', { rocketBurstCount: 2, rocketBurstInterval: .1, bodyStyle: 'double-rocket' }),
        evolutionStage('爆炸溅射', '弹头增加橙色爆炸环', '爆炸范围 +30%', { rocketBurstCount: 2, rocketBurstInterval: .1, rocketSplashMult: 1.3, bodyStyle: 'blast-rocket' }),
        evolutionStage('燃烧火箭', '火箭带红色燃烧尾焰', '命中留下 2 秒火焰，30/秒', { rocketBurstCount: 2, rocketBurstInterval: .1, rocketSplashMult: 1.3, rocketFireDuration: 2, rocketFireDps: 30, projectileTrail: '#ff7138', bodyStyle: 'burning-rocket' }),
        evolutionStage('火力覆盖', '发射架升级为三联装', '主炮 3 连发，爆炸范围 +50%', { rocketBurstCount: 3, rocketBurstInterval: .1, rocketSplashMult: 1.5, rocketFireDuration: 2, rocketFireDps: 30, bodyStyle: 'triple-rocket' }),
        evolutionStage('毁灭轰炸', '火箭尾焰变为熔红色', '火焰持续 4 秒，45/秒', { rocketBurstCount: 3, rocketBurstInterval: .1, rocketSplashMult: 1.5, rocketFireDuration: 4, rocketFireDps: 45, projectileTrail: '#ff4b24', bodyStyle: 'devastation-bombardment' }),
        evolutionStage('末日火箭', '四联装金红发射架完全展开', '主炮 4 连发，爆炸范围翻倍', { rocketBurstCount: 4, rocketBurstInterval: .1, rocketSplashMult: 2, rocketFireDuration: 4, rocketFireDps: 45, bodyStyle: 'doomsday-rocket' }),
        evolutionStage('天火降世', '金色熔火弹头环绕火箭架', '火箭分裂 3 枚子炸弹，覆盖 200，火焰持续 6 秒', { rocketBurstCount: 4, rocketBurstInterval: .1, rocketSplashMult: 2, rocketFireDuration: 6, rocketFireDps: 45, rocketSplitCount: 3, rocketSplitRadius: 200, bodyStyle: 'skyfire', palette: ['#a54225', '#ffd159'] })
    ]),
    duoduo_emp: Object.freeze([
        evolutionStage('无', '白板磁暴车', '无效果'),
        evolutionStage('电磁干扰', '炮弹缠绕细小橙色电弧', '命中干扰小地图 2 秒', { empMinimapJam: 2, projectileTrail: '#ff9b42', bodyStyle: 'emp-interference' }),
        evolutionStage('EMP脉冲', '炮口形成橙蓝电磁环', '命中禁用炮塔 1 秒', { empMinimapJam: 2, empTurretDisable: 1, muzzleGlow: '#ffad52', bodyStyle: 'emp-pulse' }),
        evolutionStage('能量过载', '电磁环扩展为双层脉冲', 'EMP 范围 +50%', { empMinimapJam: 2, empTurretDisable: 1, empRadiusMult: 1.5, auraColor: '#ff9c47', bodyStyle: 'energy-overload' }),
        evolutionStage('电磁风暴', '车身持续跳动橙蓝闪电', '干扰 4 秒，炮塔禁用 1.5 秒', { empMinimapJam: 4, empTurretDisable: 1.5, empRadiusMult: 1.5, bodyStyle: 'electromagnetic-storm' }),
        evolutionStage('系统瘫痪', '命中爆发红色系统故障符号', '命中禁用所有技能 2 秒', { empMinimapJam: 4, empTurretDisable: 1.5, empSkillDisable: 2, empRadiusMult: 1.5, bodyStyle: 'system-crash' }),
        evolutionStage('EMP领域', '大型金橙电磁领域环绕车身', '大招范围内炮塔禁用 3 秒', { empMinimapJam: 4, empTurretDisable: 1.5, empSkillDisable: 2, empRadiusMult: 1.5, empUltimateTurretDisable: 3, auraColor: '#ffc158', bodyStyle: 'emp-field' }),
        evolutionStage('末日EMP', '金红电磁风暴与全息故障雨', '全图禁炮 2 秒、小地图 10 秒并禁用技能', { empMinimapJam: 10, empTurretDisable: 2, empSkillDisable: 10, empRadiusMult: 1.5, empUltimateTurretDisable: 2, empGlobalUltimate: true, auraColor: '#ffe266', bodyStyle: 'doomsday-emp', palette: ['#9b5127', '#ffd65b'] })
    ]),
    niuniu_heli: Object.freeze([
        evolutionStage('新兵', '原版灰色', '无效果'),
        evolutionStage('飞行新兵', '旋翼带白色光晕', '爬升速度 +20%', { climbSpeedMult: 1.20, rotorGlow: '#f2fbff' }),
        evolutionStage('飞行精英', '机身增加流线装饰', '空中移速 +10%', { climbSpeedMult: 1.20, speedMult: 1.10, bodyStyle: 'streamline' }),
        evolutionStage('轰炸机', '机身可见炸弹挂架', '炸药包伤害 +20%', { climbSpeedMult: 1.20, speedMult: 1.10, bombDamageMult: 1.20, bodyStyle: 'bomb-rack' }),
        evolutionStage('空中王牌', '机身带金色条纹', '空中打击炸弹数量 +2', { climbSpeedMult: 1.20, speedMult: 1.10, bombDamageMult: 1.20, ultimateBombBonus: 2, bodyStyle: 'gold-stripe' }),
        evolutionStage('空中堡垒', '机身加厚装甲', '空中受到伤害 -20%', { climbSpeedMult: 1.20, speedMult: 1.10, bombDamageMult: 1.20, ultimateBombBonus: 2, airborneReduction: .20, bodyStyle: 'air-fortress' }),
        evolutionStage('飞行传奇', '金色条纹带火焰纹', '炸药包溅射范围 +40%', { climbSpeedMult: 1.20, speedMult: 1.10, bombDamageMult: 1.20, ultimateBombBonus: 2, airborneReduction: .20, bombRadiusMult: 1.40, bodyStyle: 'flame-stripe' }),
        evolutionStage('空中战神', '机身环绕金色圣光', '空中永久伤害 +30%，高度上限 +50%', { climbSpeedMult: 1.20, speedMult: 1.10, bombDamageMult: 1.20, ultimateBombBonus: 2, airborneReduction: .20, bombRadiusMult: 1.40, airborneDamageMult: 1.30, altitudeMult: 1.50, bodyStyle: 'sky-god', palette: ['#44aaca', '#ffd95d'] })
    ]),
    kimi_tank: Object.freeze([
        evolutionStage('新兵', '原版灰色', '无效果'),
        evolutionStage('算法新兵', '车身浮现代码 0 和 1', '命中后暴露敌人位置 3 秒', { revealOnHit: 3, binaryCode: true }),
        evolutionStage('算法精英', '0 和 1 缓慢流动', '被攻击时 5% 概率闪避', { revealOnHit: 3, evadeChance: .05, binaryCode: true, bodyStyle: 'flowing-code' }),
        evolutionStage('数据分析', '代码流变亮', '击杀后移速 +20%，持续 3 秒', { revealOnHit: 3, evadeChance: .05, killSpeed: .20, killSpeedDuration: 3, binaryCode: true, bodyStyle: 'bright-code' }),
        evolutionStage('AI王牌', '金蓝代码混合', '克隆体继承 30% 本体属性', { revealOnHit: 3, evadeChance: .05, killSpeed: .20, killSpeedDuration: 3, cloneStatRatio: .30, binaryCode: true, bodyStyle: 'gold-blue-code' }),
        evolutionStage('机器学习', '代码流动态变化', '每击杀永久 +0.5% 伤害（本局）', { revealOnHit: 3, evadeChance: .05, killSpeed: .20, killSpeedDuration: 3, cloneStatRatio: .30, killDamageGrowth: .005, binaryCode: true, bodyStyle: 'machine-learning' }),
        evolutionStage('AI传奇', '车身呈全息投影', '大招克隆体可以开火（伤害减半）', { revealOnHit: 3, evadeChance: .05, killSpeed: .20, killSpeedDuration: 3, cloneStatRatio: .30, killDamageGrowth: .005, cloneCanFire: true, cloneDamageMult: .50, binaryCode: true, bodyStyle: 'hologram' }),
        evolutionStage('超越战神', '车身落下金色代码雨', '永久伤害 +20%，克隆继承 50% 属性', { revealOnHit: 3, evadeChance: .05, killSpeed: .20, killSpeedDuration: 3, cloneStatRatio: .50, killDamageGrowth: .005, cloneCanFire: true, cloneDamageMult: .50, permanentDamageMult: 1.20, binaryCode: true, bodyStyle: 'gold-code-rain', palette: ['#5a2580', '#ffd95c'] })
    ])
});

function getTankEvolutionStage(tankType, level = 1) {
    const stages = TANK_EVOLUTIONS[tankType];
    if(!stages) return null;
    return stages[Math.max(0, Math.min(7, Math.floor(Number(level) || 1) - 1))];
}

function getTankEvolutionProfile(tankType, level = 1) {
    const stage = getTankEvolutionStage(tankType, level);
    if(!stage) return null;
    return {
        name: stage.name,
        visual: stage.visual,
        mechanic: stage.mechanic,
        reward: `${stage.visual}；${stage.mechanic}`,
        effects: stage.effects
    };
}

function getTankEvolutionVisual(tankType, level, data) {
    const stage = getTankEvolutionStage(tankType, level);
    if(!stage || !data) return null;
    const effects = stage.effects;
    const palette = effects.palette || null;
    return {
        color: palette ? palette[0] : data.color,
        accent: palette ? palette[1] : data.accent,
        camouflage: false,
        goldenProjectiles: false,
        trailColor: effects.trailColor || null,
        aura: false,
        auraColor: null,
        auraRadius: 0,
        auraAttackMult: 1,
        auraDefenseMult: 1,
        binaryCode: !!effects.binaryCode,
        deathFlame: null,
        speedMult: effects.speedMult || 1,
        turnSpeedMult: effects.turnMult || 1,
        hpMult: 1,
        armorBonus: 0,
        weaponDamageMult: effects.permanentDamageMult || 1,
        evolutionBodyStyle: effects.bodyStyle || null,
        evolutionProjectileStyle: effects.projectileStyle || null,
        evolutionMuzzleGlow: effects.muzzleGlow || null,
        evolutionAuraColor: effects.auraColor || null,
        evolutionPermanentOpacity: effects.permanentOpacity || 1
    };
}

function applyTankEvolution(tank, evolutionVisual = null) {
    if(!tank) return tank;
    const stage = getTankEvolutionStage(tank.tankType, tank.masteryLevel);
    tank.evolutionStage = stage;
    tank.evolutionEffects = stage ? stage.effects : Object.freeze({});
    tank.evolutionVisual = stage ? stage.visual : null;
    tank.evolutionMechanic = stage ? stage.mechanic : null;
    tank.evolutionBodyStyle = evolutionVisual && evolutionVisual.evolutionBodyStyle || null;
    tank.evolutionProjectileStyle = evolutionVisual && evolutionVisual.evolutionProjectileStyle || null;
    tank.evolutionMuzzleGlow = evolutionVisual && evolutionVisual.evolutionMuzzleGlow || null;
    tank.evolutionAuraColor = evolutionVisual && evolutionVisual.evolutionAuraColor || null;
    tank.evolutionPermanentOpacity = evolutionVisual && evolutionVisual.evolutionPermanentOpacity || 1;
    tank.evolutionStationaryTimer = 0;
    tank.evolutionStealthActive = false;
    tank.evolutionStealthPrimed = true;
    tank.evolutionLastStealth = false;
    tank.evolutionUltimateFirstHit = false;
    tank.evolutionKillDamageMult = 1;
    tank.evolutionSecondTeleportReady = false;
    tank.evolutionTeleportCritReady = false;
    tank.evolutionShieldBrokenHandled = false;
    tank.evolutionRegenCue = 0;
    tank.evolutionBurnTick = 0;
    tank.evolutionRevealTimer = 0;
    if(stage && stage.effects.fireRateMult) tank.fireRate *= stage.effects.fireRateMult;
    if(stage && stage.effects.altitudeMult) tank.maxAltitudeMult = stage.effects.altitudeMult;
    if(stage && stage.effects.climbSpeedMult) tank.climbSpeedMult = stage.effects.climbSpeedMult;
    if(stage && stage.effects.ultimateCooldownMult && tank.ultimateData) {
        tank.ultimateData = { ...tank.ultimateData, cooldown: tank.ultimateData.cooldown * stage.effects.ultimateCooldownMult };
    }
    return tank;
}

function getEvolutionEnemyList(tank) {
    if(!tank) return [];
    return tank.team === 'blue'
        ? (typeof enemies !== 'undefined' ? enemies : [])
        : [
            ...(typeof allies !== 'undefined' ? allies : []),
            ...(typeof player !== 'undefined' && player && !player.dead ? [player] : [])
        ];
}

function getEvolutionTeamList(tank) {
    if(!tank) return [];
    return tank.team === 'blue'
        ? [
            ...(typeof player !== 'undefined' && player && !player.dead ? [player] : []),
            ...(typeof allies !== 'undefined' ? allies : [])
        ]
        : (typeof enemies !== 'undefined' ? enemies : []);
}

function pushTankVisualEffect(kind, x, y, options = {}) {
    if(typeof trailEffects === 'undefined') return null;
    const effect = {
        kind, x, y, z: options.z || 0,
        angle: options.angle || 0,
        team: options.team || null,
        owner: options.owner || null,
        color: options.color || '#ffffff',
        accent: options.accent || options.color || '#ffffff',
        radius: options.radius || 40,
        life: options.life || .5,
        maxLife: options.life || .5,
        seed: Math.random() * Math.PI * 2,
        visualOnly: true
    };
    trailEffects.push(effect);
    while(trailEffects.length > 240) {
        const visualIndex = trailEffects.findIndex(item => item && item.visualOnly);
        trailEffects.splice(visualIndex >= 0 ? visualIndex : 0, 1);
    }
    return effect;
}

function getTankWeaponAnimationTheme(tank, projectile = null) {
    if(projectile && projectile.isDrone || tank && tank.tankType === 'zuoyan31') return 'drone';
    if(tank && tank.tankType === 'duoduo_emp') return 'emp';
    if(tank && tank.tankType === 'zuoyan33') return 'toxin';
    if(tank && tank.tankType === 'duoduo_rocket' || projectile && (projectile.isRocket || projectile.type === 'rocket')) return 'rocket';
    if(projectile && projectile.evolutionStyle && projectile.evolutionStyle.includes('prism')) return 'ice';
    if(projectile && (projectile.type === 'mg' || projectile.type === 'airmg')) return 'mg';
    return 'shell';
}

function spawnTankShotAnimation(tank, projectile, angle) {
    if(!tank || !projectile) return;
    const theme = getTankWeaponAnimationTheme(tank, projectile);
    const distance = projectile.type === 'bomb' ? 0 : (tank.turretSize || 24) + 16;
    const colors = {
        ice: ['#d9fbff', '#4bdcff'], emp: ['#fff0a8', '#ff7b29'], toxin: ['#d9ff79', '#4be579'],
        rocket: ['#fff0a0', '#ff4c1f'], drone: ['#d9f5ff', '#4daeff'], mg: ['#fffad0', '#ffd12e'],
        shell: ['#fff4b8', '#ff7626']
    }[theme];
    pushTankVisualEffect(`muzzle-${theme}`,
        tank.x + Math.cos(angle) * distance,
        tank.y + Math.sin(angle) * distance, {
            z: (tank.z || 0) + 24, angle, team:tank.team, owner:tank,
            color:colors[0], accent:colors[1], radius: theme === 'mg' ? 18 : 32,
            life: theme === 'mg' ? .16 : .28
        });
}

function spawnTankImpactAnimation(projectile, target = null) {
    if(!projectile) return;
    const theme = getTankWeaponAnimationTheme(projectile.owner, projectile);
    const colors = {
        ice: ['#e8fdff', '#4bdcff'], emp: ['#ffe787', '#ff6c26'], toxin: ['#caff62', '#3ddc74'],
        rocket: ['#fff0a0', '#ff3e18'], drone: ['#c8f3ff', '#429dff'], mg: ['#fff8bc', '#ffcf31'],
        shell: ['#fff0af', '#ff5724']
    }[theme];
    pushTankVisualEffect(`impact-${theme}`, projectile.x, projectile.y, {
        z: target ? (target.z || 0) + 20 : projectile.z || 0,
        angle:Math.atan2(projectile.vy || 0, projectile.vx || 1), team:projectile.team, owner:projectile.owner,
        color:colors[0], accent:colors[1], radius: theme === 'rocket' ? 85 : theme === 'ice' ? 58 : 42,
        life: theme === 'rocket' ? .78 : .55
    });
}

function spawnTankUltimateAnimation(tank) {
    if(!tank) return;
    const visualClock = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
    if(visualClock - (tank.evolutionLastUltimateVisualAt || -Infinity) < 180) return;
    tank.evolutionLastUltimateVisualAt = visualClock;
    const themes = {
        zuoyan29:['ice','#bdf8ff','#42d8ff'], zuoyan30:['shadow','#d5a4ff','#6f2aff'],
        zuoyan1:['fire','#fff09a','#ff391b'], zuoyan31:['drone','#d5f4ff','#438dff'],
        zuoyan32:['phantom','#f0c6ff','#a34cff'], zuoyan33:['toxin','#d7ff73','#3bdb70'],
        xingchen27a:['shield','#e8ff9a','#43df7b'], xingchen27b:['fortress','#fff0a0','#ffbd35'],
        xingchen27s:['teleport','#d8f6ff','#3bbdff'], xingchen27c:['radar','#e7ff9a','#55e76b'],
        xingchen27d:['link','#d8ffac','#42d777'], xingchen27e:['judgment','#fff0a8','#ff522e'],
        duoduo:['salvo','#fff2a4','#ff5624'], duoduo_ifv:['storm','#fff4a0','#ffc629'],
        duoduo_spat:['sniper','#ffd2cb','#ff211b'], duoduo_eng:['build','#fff0ad','#e8872d'],
        duoduo_rocket:['rocket','#fff09a','#ff3f19'], duoduo_emp:['emp','#fff0a0','#ff7728'],
        niuniu_heli:['airstrike','#e0f9ff','#4bc5ff'], kimi_tank:['code','#e4ceff','#9d4cff']
    };
    const spec = themes[tank.tankType] || ['power','#ffffff','#65c8ff'];
    const radius = tank.ultimateData && (tank.ultimateData.radius || tank.ultimateData.shieldRadius || tank.ultimateData.spreadRadius) || 150;
    pushTankVisualEffect(`ultimate-${spec[0]}`, tank.x, tank.y, {
        z:tank.z || 0, angle:tank.turretAngle || tank.angle || 0, team:tank.team, owner:tank,
        color:spec[1], accent:spec[2], radius, life:1.15
    });
}

function spawnEvolutionDrone(tank, angle, options = {}) {
    if(!tank || typeof bullets === 'undefined') return null;
    const effects = tank.evolutionEffects || {};
    const ult = tank.ultimateData || {};
    const projectile = {
        x: tank.x + Math.cos(angle) * 30,
        y: tank.y + Math.sin(angle) * 30,
        z: (tank.z || 0) + 24,
        vx: Math.cos(angle) * (ult.droneSpeed || 8),
        vy: Math.sin(angle) * (ult.droneSpeed || 8),
        vz: 0,
        damage: (ult.droneDamage || 200) * (effects.droneDamageMult || 1),
        team: tank.team, type: 'drone', owner: tank,
        life: effects.droneInfinite ? Infinity : (ult.droneLife || 5),
        maxLife: effects.droneInfinite ? Infinity : (ult.droneLife || 5),
        hitTanks: new Set(), isDrone: true,
        autoTrack: !!effects.droneAutoTrack,
        trackRange: ult.trackRange || 800,
        droneDeathExplosionRadius: effects.droneDeathExplosionRadius || 0,
        droneDeathExplosionDamage: effects.droneDeathExplosionDamage || 0,
        evolutionTrail: effects.projectileTrail || '#70d8ff',
        replenishedDrone: !!options.replenished
    };
    bullets.push(projectile);
    if(typeof spawnTankShotAnimation === 'function') spawnTankShotAnimation(tank, projectile, angle);
    return projectile;
}

function spawnEvolutionDroneSwarm(tank) {
    const effects = tank && tank.evolutionEffects || {};
    const count = effects.droneCount || (tank.ultimateData && tank.ultimateData.droneCount) || 3;
    for(let index = 0; index < count; index++) {
        const offset = (index - (count - 1) / 2) * Math.min(.34, 1.5 / Math.max(1, count - 1));
        spawnEvolutionDrone(tank, (tank.turretAngle || tank.angle || 0) + offset);
    }
    tank.evolutionDroneReplenishTimer = effects.droneReplenishInterval || 8;
    return count;
}

function explodeEvolutionDrone(projectile) {
    if(!projectile || projectile.droneExplosionHandled || !projectile.droneDeathExplosionRadius) return;
    projectile.droneExplosionHandled = true;
    if(typeof getNearbyTanks === 'function') {
        getNearbyTanks(projectile.x, projectile.y, projectile.droneDeathExplosionRadius).forEach(target => {
            if(!target || target.dead || target.team === projectile.team) return;
            const distance = Math.hypot(target.x - projectile.x, target.y - projectile.y);
            const falloff = Math.max(.35, 1 - distance / projectile.droneDeathExplosionRadius);
            if(typeof applyDirectDamage === 'function') applyDirectDamage(target, projectile.droneDeathExplosionDamage * falloff, projectile.owner, '自爆蜂群', projectile);
        });
    }
    if(typeof createParticles === 'function') createParticles(projectile.x, projectile.y, 24, '#67d9ff', 2.1);
}

function spawnEvolutionPhantoms(tank) {
    if(!tank || typeof createTank !== 'function') return 0;
    const effects = tank.evolutionEffects || {};
    const ult = tank.ultimateData || {};
    const count = effects.phantomCount || ult.cloneCount || 2;
    const ratio = effects.phantomStatRatio || .4;
    for(let index = 0; index < count; index++) {
        const angle = index / Math.max(1, count) * Math.PI * 2 + Math.random() * .25;
        const distance = 58 + Math.random() * 34;
        const clone = createTank(TANKS.zuoyan32, tank.x + Math.cos(angle) * distance, tank.y + Math.sin(angle) * distance, tank.team, false, 1);
        clone.hp = Math.max(1, Math.round((ult.cloneHp || tank.maxHp) * ratio));
        clone.maxHp = clone.hp;
        clone.isClone = true;
        clone.cloneOwner = tank;
        clone.cloneTimer = effects.phantomInfinite ? Infinity : (ult.duration || 6);
        clone.cloneCanFire = !!effects.phantomCanFire;
        clone.cloneDamageMult = effects.phantomDamageMult || 0;
        clone.phantomExplosionStun = effects.phantomExplosionStun || 0;
        clone.phantomIndependent = !!effects.phantomIndependent;
        clone.shells = clone.cloneCanFire ? Math.max(8, Math.round((tank.shells || 0) * ratio)) : 0;
        clone.mg = clone.cloneCanFire ? Math.max(24, Math.round((tank.mg || 0) * ratio)) : 0;
        if(tank.team === 'blue') allies.push(clone); else enemies.push(clone);
        if(typeof aiTanks !== 'undefined') aiTanks.push(clone);
    }
    return count;
}

function detonateEvolutionPhantom(clone) {
    if(!clone || clone.phantomExplosionHandled || !clone.phantomExplosionStun) return;
    clone.phantomExplosionHandled = true;
    getEvolutionEnemyList(clone).forEach(enemy => {
        if(!enemy || enemy.dead || Math.hypot(enemy.x - clone.x, enemy.y - clone.y) > 135) return;
        enemy.evolutionFreezeTimer = Math.max(enemy.evolutionFreezeTimer || 0, clone.phantomExplosionStun);
    });
    if(typeof createParticles === 'function') createParticles(clone.x, clone.y, 28, '#be78ff', 2.2);
}

function deployEvolutionCovers(tank) {
    if(!tank || typeof mapElements === 'undefined') return 0;
    const effects = tank.evolutionEffects || {};
    if(!effects.coverCount) return 0;
    const count = effects.coverCount;
    for(let index = 0; index < count; index++) {
        const angle = (tank.turretAngle || tank.angle || 0) + (index - (count - 1) / 2) * .48;
        const distance = 68 + (index % 2) * 18;
        mapElements.push({
            type: 'turret', isEvolutionCover: true,
            x: tank.x + Math.cos(angle) * distance,
            y: tank.y + Math.sin(angle) * distance,
            angle, hp: effects.coverHp, maxHp: effects.coverHp, armor: 1.5,
            range: effects.coverAutoAttack ? 500 : 0,
            damage: effects.coverDamage || 0,
            team: tank.team, owner: tank,
            duration: effects.coverDuration,
            fireCooldown: 0, fireRate: 1.5,
            healPerSecond: effects.coverHealPerSecond || 0
        });
    }
    return count;
}

function createEvolutionPoisonCloud(tank) {
    const effects = tank && tank.evolutionEffects || {};
    if(!effects.poisonCloudDps || typeof trailEffects === 'undefined') return null;
    const cloud = {
        kind: 'poison-cloud', x: tank.x, y: tank.y, z: tank.z || 0,
        life: effects.poisonCloudDuration, maxLife: effects.poisonCloudDuration,
        radius: effects.poisonCloudRadius, team: tank.team, owner: tank,
        color: '#59e778', damagePerSecond: effects.poisonCloudDps
    };
    trailEffects.push(cloud);
    return cloud;
}

function createEvolutionRocketImpact(projectile) {
    if(!projectile || projectile.evolutionRocketImpactHandled) return;
    projectile.evolutionRocketImpactHandled = true;
    if(projectile.rocketFireDuration && typeof trailEffects !== 'undefined') {
        trailEffects.push({
            kind: 'rocket-fire', x: projectile.x, y: projectile.y, z: projectile.z || 0,
            life: projectile.rocketFireDuration, maxLife: projectile.rocketFireDuration,
            radius: Math.max(55, projectile.explosionRadius || 55), team: projectile.team,
            owner: projectile.owner, color: '#ff5a25', damagePerSecond: projectile.rocketFireDps || 30
        });
    }
    if(projectile.rocketSplitCount && typeof bullets !== 'undefined') {
        for(let index = 0; index < projectile.rocketSplitCount; index++) {
            const angle = index / projectile.rocketSplitCount * Math.PI * 2;
            const distance = projectile.rocketSplitRadius || 200;
            bullets.push({
                x: projectile.x, y: projectile.y, z: Math.max(28, (projectile.z || 0) + 70),
                vx: Math.cos(angle) * 3.2, vy: Math.sin(angle) * 3.2, vz: 30,
                damage: projectile.damage * .55, team: projectile.team, type: 'bomb', owner: projectile.owner,
                life: .65, maxLife: .65, age: 0, hitTanks: new Set(),
                explosionWidth: distance * .55, explosionHeight: distance * .55, explosionRadius: distance * .28,
                evolutionTrail: '#ffb24a'
            });
        }
    }
    if(typeof createParticles === 'function' && (projectile.rocketFireDuration || projectile.rocketSplitCount)) {
        createParticles(projectile.x, projectile.y, projectile.rocketSplitCount ? 36 : 20, '#ff7b2e', 2.2);
    }
}

function applyEvolutionEmpUltimate(tank) {
    if(!tank) return;
    const effects = tank.evolutionEffects || {};
    const radius = ((tank.ultimateData && tank.ultimateData.radius) || 400) * (effects.empRadiusMult || 1);
    getEvolutionEnemyList(tank).forEach(enemy => {
        if(!enemy || enemy.dead || (!effects.empGlobalUltimate && Math.hypot(enemy.x - tank.x, enemy.y - tank.y) > radius)) return;
        enemy.minimapJammed = true;
        enemy.minimapJamTimer = Math.max(enemy.minimapJamTimer || 0, effects.empGlobalUltimate ? 10 : (effects.empMinimapJam || tank.ultimateData.jamDuration || 0));
        enemy.evolutionTurretDisabledTimer = Math.max(enemy.evolutionTurretDisabledTimer || 0, effects.empUltimateTurretDisable || 0);
        if(effects.empGlobalUltimate) enemy.evolutionSkillDisabledTimer = Math.max(enemy.evolutionSkillDisabledTimer || 0, 10);
    });
}

function markEvolutionJudgment(owner, target) {
    const effects = owner && owner.evolutionEffects || {};
    if(!owner || !target || !effects.judgmentDuration) return;
    const existing = getEvolutionEnemyList(owner).filter(enemy => enemy && enemy.evolutionJudgmentOwner === owner);
    if(existing.length >= (effects.judgmentTargets || 1)) {
        existing.sort((a, b) => (a.evolutionJudgmentTimer || 0) - (b.evolutionJudgmentTimer || 0));
        existing[0].evolutionJudgmentTimer = 0;
        existing[0].evolutionJudgmentOwner = null;
    }
    target.evolutionJudgmentOwner = owner;
    target.evolutionJudgmentTimer = effects.judgmentDuration;
    target.evolutionJudgmentNoUltimate = !!effects.judgmentDisableUltimate;
}

function applyTankEvolutionToProjectile(tank, projectile) {
    if(!tank || !projectile) return projectile;
    const effects = tank.evolutionEffects || {};
    projectile.evolutionStyle = effects.projectileStyle || null;
    projectile.evolutionTrail = effects.projectileTrail || null;
    if(projectile.type === 'shell') {
        projectile.damage *= effects.shellDamageMult || 1;
        projectile.explosionRadius = Math.max(projectile.explosionRadius || 0, (effects.shellSplash || 0) * (effects.splashMult || 1));
        if(tank.tankType === 'duoduo_rocket') {
            projectile.explosionRadius = Math.max(projectile.explosionRadius || 0, 45 * (effects.rocketSplashMult || 1));
            projectile.rocketFireDuration = effects.rocketFireDuration || 0;
            projectile.rocketFireDps = effects.rocketFireDps || 0;
            projectile.rocketSplitCount = effects.rocketSplitCount || 0;
            projectile.rocketSplitRadius = effects.rocketSplitRadius || 0;
        }
        if(effects.extraPenetration) projectile.maxTargetHits = Math.max(projectile.maxTargetHits || 1, 1 + effects.extraPenetration);
        else if(effects.penetrationChance && Math.random() < effects.penetrationChance) projectile.maxTargetHits = Math.max(projectile.maxTargetHits || 1, 2);
    }
    if(projectile.type === 'mg' || projectile.type === 'airmg') {
        if(effects.mgExtraPenetration) projectile.maxTargetHits = Math.max(projectile.maxTargetHits || 1, 1 + effects.mgExtraPenetration);
        if(tank.stormActive) projectile.damage *= effects.stormDamageMult || 1;
    }
    if(projectile.type === 'bomb') {
        projectile.damage *= effects.bombDamageMult || 1;
        projectile.explosionWidth *= effects.bombRadiusMult || 1;
        projectile.explosionHeight *= effects.bombRadiusMult || 1;
        projectile.explosionRadius *= effects.bombRadiusMult || 1;
    }
    if(tank.isFlying) projectile.damage *= effects.airborneDamageMult || 1;
    if(effects.toxinChance) {
        projectile.toxinData = {
            duration: effects.toxinDuration || 3,
            damage: effects.toxinDamage || 20,
            interval: 1,
            slow: effects.toxinSlow || 0,
            chance: effects.toxinChance,
            spreadRadius: effects.toxinSpreadRadius || 0,
            source: tank
        };
    }
    if(effects.empMinimapJam) {
        projectile.empData = {
            minimapJam: effects.empMinimapJam,
            turretDisable: effects.empTurretDisable || 0,
            skillDisable: effects.empSkillDisable || 0
        };
    }
    if(effects.lowHpDamage && tank.hp / Math.max(1, tank.maxHp) <= (effects.lowHpThreshold || 0)) {
        projectile.damage *= 1 + effects.lowHpDamage;
    }
    if(effects.critChance && Math.random() < effects.critChance) {
        projectile.damage *= 1.5;
        projectile.evolutionCritical = true;
    }
    const stealthActive = !!(tank.evolutionStealthActive || tank.ghostActive);
    if(stealthActive) {
        if(tank.evolutionStealthPrimed && effects.stealthFirstCrit) {
            projectile.damage *= effects.stealthFirstCrit;
            projectile.evolutionCritical = true;
            tank.evolutionStealthPrimed = false;
        }
        projectile.damage *= effects.stealthDamage || 1;
        if(!(tank.ghostActive && effects.ultimateNoReveal)) {
            tank.evolutionStealthExitPending = tank.evolutionStealthActive;
            tank.evolutionStealthActive = false;
            tank.evolutionStationaryTimer = 0;
        }
    }
    if(tank.evolutionTeleportCritReady && projectile.type === 'shell') {
        projectile.damage *= effects.teleportCrit || 1.5;
        projectile.evolutionCritical = true;
        tank.evolutionTeleportCritReady = false;
    }
    projectile.damage *= tank.evolutionKillDamageMult || 1;
    if(tank.isClone) projectile.damage *= tank.cloneDamageMult || 1;
    return projectile;
}

function modifyTankEvolutionOutgoingDamage(projectile, target, damage) {
    if(!projectile || !target || damage <= 0) return damage;
    const owner = projectile.owner;
    const effects = owner && owner.evolutionEffects || {};
    let next = damage;
    if(effects.toxinCritChance && target.toxinDebuffTimer > 0 && Math.random() < effects.toxinCritChance) {
        next *= 1.5;
        projectile.evolutionCritical = true;
    }
    if(effects.antiBuffDamageMult && (target.ghostActive || target.evolutionStealthActive || target.shieldActive || target.shieldHp > 0)) {
        next *= effects.antiBuffDamageMult;
    }
    if(target.evolutionJudgmentOwner && target.evolutionJudgmentTimer > 0 && owner && owner.team === target.evolutionJudgmentOwner.team) {
        const judgeEffects = target.evolutionJudgmentOwner.evolutionEffects || {};
        next *= 1 + (judgeEffects.judgmentDamageBonus || 0);
        if(owner === target.evolutionJudgmentOwner && judgeEffects.judgmentCritChance && Math.random() < judgeEffects.judgmentCritChance) {
            next *= 1.5;
            projectile.evolutionCritical = true;
        }
    }
    return next;
}

function handleTankEvolutionProjectileHit(projectile, target, dealtDamage) {
    if(!projectile || !target || dealtDamage <= 0) return;
    const owner = projectile.owner;
    const effects = owner && owner.evolutionEffects || {};
    const targetWasStealthed = !!(target.ghostActive || target.evolutionStealthActive);
    const isShell = projectile.type === 'shell';
    const isMg = projectile.type === 'mg' || projectile.type === 'airmg';
    let knockback = isShell ? effects.shellKnockback || 0 : 0;
    if(isMg && effects.mgKnockbackChance && Math.random() < effects.mgKnockbackChance) knockback = effects.shellKnockback || 22;
    if(knockback > 0 && !(target.fortressActive && target.evolutionEffects && target.evolutionEffects.fortressKnockbackImmune)) {
        const angle = Math.atan2(target.y - owner.y, target.x - owner.x);
        const nx = target.x + Math.cos(angle) * knockback;
        const ny = target.y + Math.sin(angle) * knockback;
        if(typeof checkObstacleCollision !== 'function' || !checkObstacleCollision(nx, ny, CONFIG.tankSize, target)) {
            target.x = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapWidth - CONFIG.tankSize, nx));
            target.y = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapHeight - CONFIG.tankSize, ny));
        }
    }
    if(isShell && effects.freezeChance) {
        const guaranteed = owner.ultimateActive && effects.ultimateFirstFreeze && !owner.evolutionUltimateFirstHit;
        const targetEffects = target.evolutionEffects || {};
        const controlImmune = (target.shieldActive && targetEffects.shieldControlImmune) ||
            (target.fortressActive && targetEffects.fortressControlImmune);
        if(!controlImmune && (guaranteed || Math.random() < effects.freezeChance)) {
            const duration = effects.freezeDuration || .5;
            target.evolutionFreezeTimer = Math.max(target.evolutionFreezeTimer || 0, duration);
            target.mapSlow = Math.max(target.mapSlow || 0, .65);
            target.mapSlowTimer = Math.max(target.mapSlowTimer || 0, duration);
            if(typeof createParticles === 'function') createParticles(target.x, target.y, 14, '#86eaff', 1.35);
        }
        if(owner.ultimateActive && effects.ultimateFirstFreeze) owner.evolutionUltimateFirstHit = true;
    }
    if(effects.revealOnHit) {
        target.minimapRevealedUntil = (typeof performance !== 'undefined' ? performance.now() : Date.now()) + effects.revealOnHit * 1000;
        target.evolutionRevealTimer = Math.max(target.evolutionRevealTimer || 0, effects.revealOnHit);
    }
    if(effects.forceRevealDuration) {
        target.ghostRevealed = true;
        target.evolutionForcedRevealTimer = Math.max(target.evolutionForcedRevealTimer || 0, effects.forceRevealDuration);
    }
    if(effects.purgeBuffsOnHit) {
        target.shieldActive = false; target.shieldHp = 0;
        target.speedBoost = 0; target.turnBoost = 0;
        target.mapSpeedBoost = 0; target.mapBoostTimer = 0;
        target.ultimateActive = false; target.ultimateTimer = 0;
        target.ghostActive = false; target.fortressActive = false; target.stormActive = false;
    }
    if(effects.stealthExecuteThreshold && targetWasStealthed &&
       target.hp / Math.max(1, target.maxHp) <= effects.stealthExecuteThreshold && !target.dead) {
        if(typeof applyDirectDamage === 'function') applyDirectDamage(target, target.hp + target.shieldHp + 1, owner, '裁决斩杀', projectile);
    }
    if(effects.judgmentDuration) markEvolutionJudgment(owner, target);
    if(projectile.empData) {
        target.minimapJammed = true;
        target.minimapJamTimer = Math.max(target.minimapJamTimer || 0, projectile.empData.minimapJam || 0);
        target.evolutionTurretDisabledTimer = Math.max(target.evolutionTurretDisabledTimer || 0, projectile.empData.turretDisable || 0);
        target.evolutionSkillDisabledTimer = Math.max(target.evolutionSkillDisabledTimer || 0, projectile.empData.skillDisable || 0);
    }
}

function modifyTankEvolutionIncomingDamage(tank, source, damage) {
    if(!tank || damage <= 0) return damage;
    const effects = tank.evolutionEffects || {};
    if(effects.evadeChance && Math.random() < effects.evadeChance) {
        if(typeof createParticles === 'function') createParticles(tank.x, tank.y, 10, '#d48dff', 1);
        return 0;
    }
    let next = damage;
    if(tank.isFlying) next *= 1 - (effects.airborneReduction || 0);
    if(tank.fortressActive) next *= 1 - (effects.fortressReduction || 0);
    if(effects.lowHpDefense && tank.hp / Math.max(1, tank.maxHp) <= (effects.lowHpThreshold || 0)) {
        next *= 1 - effects.lowHpDefense;
    }
    if(source && effects.frontalReduction) {
        const incoming = Math.atan2(source.y - tank.y, source.x - tank.x);
        let diff = incoming - tank.angle;
        while(diff > Math.PI) diff -= Math.PI * 2;
        while(diff < -Math.PI) diff += Math.PI * 2;
        if(Math.abs(diff) <= Math.PI * .34) next *= 1 - effects.frontalReduction;
    }
    return next;
}

function handleTankEvolutionShieldBreak(tank) {
    if(!tank || tank.evolutionShieldBrokenHandled) return;
    const effects = tank.evolutionEffects || {};
    tank.evolutionShieldBrokenHandled = true;
    if(effects.shieldBreakKnockback) {
        getEvolutionEnemyList(tank).forEach(enemy => {
            if(!enemy || enemy.dead) return;
            const dist = Math.hypot(enemy.x - tank.x, enemy.y - tank.y);
            if(dist > 150 || dist <= 0) return;
            const push = effects.shieldBreakKnockback * (1 - dist / 220);
            enemy.x += (enemy.x - tank.x) / dist * push;
            enemy.y += (enemy.y - tank.y) / dist * push;
        });
        if(typeof createParticles === 'function') createParticles(tank.x, tank.y, 24, '#dfff7d', 2);
    }
    if(effects.shieldBreakTeamHeal) {
        getEvolutionTeamList(tank).forEach(ally => {
            if(ally && !ally.dead) ally.hp = Math.min(ally.maxHp, ally.hp + ally.maxHp * effects.shieldBreakTeamHeal);
        });
    }
}

function handleTankEvolutionDamaged(tank, source, previousHp) {
    if(!tank) return;
    const effects = tank.evolutionEffects || {};
    if(source && effects.retaliateSlowChance && Math.random() < effects.retaliateSlowChance) {
        source.mapSlow = Math.max(source.mapSlow || 0, .30);
        source.mapSlowTimer = Math.max(source.mapSlowTimer || 0, 2);
    }
    if(previousHp > 0 && tank.shieldHp <= 0 && tank.evolutionShieldWasActive) handleTankEvolutionShieldBreak(tank);
}

function handleTankEvolutionDeath(tank) {
    if(!tank || tank.evolutionDeathHandled) return;
    tank.evolutionDeathHandled = true;
    if(tank.isClone) detonateEvolutionPhantom(tank);
    const effects = tank.evolutionEffects || {};
    if(effects.deathExplosionDamage && typeof getNearbyTanks === 'function') {
        getNearbyTanks(tank.x, tank.y, effects.deathExplosionRadius).forEach(other => {
            if(!other || other === tank || other.dead || other.team === tank.team) return;
            const dist = Math.hypot(other.x - tank.x, other.y - tank.y);
            const falloff = Math.max(.35, 1 - dist / effects.deathExplosionRadius);
            if(typeof applyDirectDamage === 'function') applyDirectDamage(other, effects.deathExplosionDamage * falloff, tank, '熔岩殉爆');
        });
        if(typeof createParticles === 'function') createParticles(tank.x, tank.y, 55, '#ff4b1d', 3.4);
    }
    if(effects.deathCoverDuration && typeof obstacles !== 'undefined') {
        obstacles.push({
            x: tank.x - 42, y: tank.y - 28, w: 84, h: 56,
            hp: 900, maxHp: 900, destructible: true,
            type: 'evolutionCover', evolutionCoverTimer: effects.deathCoverDuration
        });
    }
    if(tank.evolutionJudgmentOwner && tank.evolutionJudgmentTimer > 0) {
        const judge = tank.evolutionJudgmentOwner;
        const judgeEffects = judge.evolutionEffects || {};
        if(judgeEffects.judgmentDeathExplosionRadius && typeof getNearbyTanks === 'function') {
            getNearbyTanks(tank.x, tank.y, judgeEffects.judgmentDeathExplosionRadius).forEach(other => {
                if(!other || other.dead || other.team === judge.team) return;
                if(typeof applyDirectDamage === 'function') applyDirectDamage(other, judgeEffects.judgmentDeathExplosionDamage || 200, judge, '天罚裁决');
            });
            if(typeof createParticles === 'function') createParticles(tank.x, tank.y, 36, '#ffd44f', 2.5);
        }
    }
    if(tank.linkedTo && !tank.linkedTo.dead) {
        const linkEffects = tank.linkedTo.evolutionEffects || {};
        if(linkEffects.linkDeathShield) {
            tank.linkedTo.shieldActive = true;
            tank.linkedTo.shieldHp = Math.max(tank.linkedTo.shieldHp || 0, linkEffects.linkDeathShield);
        }
    }
}

function handleTankEvolutionKill(tank, target = null) {
    if(!tank) return;
    const effects = tank.evolutionEffects || {};
    if(effects.killSpeed) {
        tank.evolutionKillSpeedBoost = effects.killSpeed;
        tank.evolutionKillSpeedTimer = effects.killSpeedDuration || 3;
    }
    if(effects.killDamageGrowth) {
        tank.evolutionKillDamageMult = Math.min(2, (tank.evolutionKillDamageMult || 1) + effects.killDamageGrowth);
    }
    if(target && target.evolutionJudgmentOwner === tank && target.evolutionJudgmentTimer > 0) {
        if(effects.judgmentKillUltCharge && tank.ultimateCooldown > 0) {
            tank.ultimateCooldown = Math.max(0, tank.ultimateCooldown * (1 - effects.judgmentKillUltCharge));
        }
        if(effects.judgmentKillHeal) tank.hp = Math.min(tank.maxHp, tank.hp + effects.judgmentKillHeal);
    }
}

function updateTankEvolution(tank, dt) {
    if(!tank || tank.dead) return;
    const effects = tank.evolutionEffects || {};
    if(tank.evolutionUndyingTimer > 0) tank.evolutionUndyingTimer = Math.max(0, tank.evolutionUndyingTimer - dt);
    if(tank.evolutionForcedRevealTimer > 0) {
        tank.evolutionForcedRevealTimer -= dt;
        tank.ghostRevealed = true;
    }
    if(tank.evolutionSkillDisabledTimer > 0) tank.evolutionSkillDisabledTimer = Math.max(0, tank.evolutionSkillDisabledTimer - dt);
    if(tank.evolutionTurretDisabledTimer > 0) tank.evolutionTurretDisabledTimer = Math.max(0, tank.evolutionTurretDisabledTimer - dt);
    if(tank.evolutionJudgmentTimer > 0) {
        tank.evolutionJudgmentTimer -= dt;
        if(tank.evolutionJudgmentTimer <= 0) {
            tank.evolutionJudgmentOwner = null;
            tank.evolutionJudgmentNoUltimate = false;
        }
    }
    if(effects.radarRadius) {
        getEvolutionEnemyList(tank).forEach(enemy => {
            if(!enemy || enemy.dead || Math.hypot(enemy.x - tank.x, enemy.y - tank.y) > effects.radarRadius) return;
            if(enemy.ghostActive || enemy.evolutionStealthActive) {
                enemy.ghostRevealed = true;
                enemy.evolutionRadarMarkedTimer = Math.max(enemy.evolutionRadarMarkedTimer || 0, .2);
            }
        });
    }
    if(tank.evolutionRadarMarkedTimer > 0) tank.evolutionRadarMarkedTimer = Math.max(0, tank.evolutionRadarMarkedTimer - dt);
    if(tank.tankType === 'xingchen27d') {
        const team = getEvolutionTeamList(tank).filter(ally => ally && ally !== tank && !ally.dead);
        const linked = tank.linkedAlly && !tank.linkedAlly.dead ? tank.linkedAlly : team.sort((a, b) =>
            Math.hypot(a.x - tank.x, a.y - tank.y) - Math.hypot(b.x - tank.x, b.y - tank.y))[0];
        if(linked) {
            tank.linkedAlly = linked;
            linked.linkedTo = tank;
            if(effects.linkRegen) linked.hp = Math.min(linked.maxHp, linked.hp + effects.linkRegen * (effects.teamRegenMult || 1) * dt);
            const previousHp = tank.evolutionPreviousLinkedHp === undefined ? linked.hp : tank.evolutionPreviousLinkedHp;
            if(effects.linkHealShare && linked.hp > previousHp) tank.hp = Math.min(tank.maxHp, tank.hp + (linked.hp - previousHp) * effects.linkHealShare);
            tank.evolutionPreviousLinkedHp = linked.hp;
        }
    }
    if(tank.toxinDebuffTimer > 0 && tank.toxinSpreadRadius && tank.toxinSource && !tank.evolutionToxinSpreadDone) {
        getEvolutionTeamList(tank).forEach(ally => {
            if(!ally || ally === tank || ally.dead || Math.hypot(ally.x - tank.x, ally.y - tank.y) > tank.toxinSpreadRadius) return;
            ally.toxinDebuffTimer = Math.max(ally.toxinDebuffTimer || 0, Math.min(3, tank.toxinDebuffTimer));
            ally.toxinTickTimer = 1; ally.toxinDamage = Math.max(ally.toxinDamage || 0, tank.toxinDamage || 0);
            ally.toxinSlow = Math.max(ally.toxinSlow || 0, tank.toxinSlow || 0);
            ally.toxinSource = tank.toxinSource; ally.toxinSpreadRadius = tank.toxinSpreadRadius;
        });
        tank.evolutionToxinSpreadDone = true;
    }
    if(tank.evolutionBurstRemaining > 0) {
        tank.evolutionBurstTimer -= dt;
        if(tank.evolutionBurstTimer <= 0 && typeof fireBullet === 'function') {
            tank.evolutionBurstFiring = true;
            fireBullet(tank, 'shell');
            tank.evolutionBurstFiring = false;
            tank.evolutionBurstRemaining--;
            tank.evolutionBurstTimer = tank.evolutionEffects.rocketBurstInterval || .1;
        }
    }
    if(effects.droneInfinite && tank.evolutionDroneReplenishTimer !== undefined) {
        tank.evolutionDroneReplenishTimer -= dt;
        if(tank.evolutionDroneReplenishTimer <= 0) {
            const active = typeof bullets === 'undefined' ? 0 : bullets.filter(bullet => bullet.isDrone && bullet.owner === tank).length;
            if(active < (effects.droneCount || 9)) spawnEvolutionDrone(tank, tank.turretAngle || tank.angle || 0, { replenished: true });
            tank.evolutionDroneReplenishTimer = effects.droneReplenishInterval || 8;
        }
    }
    const moved = Math.hypot(tank.x - (tank.prevPos ? tank.prevPos.x : tank.x), tank.y - (tank.prevPos ? tank.prevPos.y : tank.y));
    const wasStealthed = !!tank.evolutionStealthActive;
    if(effects.passiveStealth && !tank.ghostActive) {
        if(moved < .15 && (tank.recoilTimer || 0) <= 0) tank.evolutionStationaryTimer = (tank.evolutionStationaryTimer || 0) + dt;
        else tank.evolutionStationaryTimer = 0;
        tank.evolutionStealthActive = tank.evolutionStationaryTimer >= 1;
    }
    if(!wasStealthed && tank.evolutionStealthActive) tank.evolutionStealthPrimed = true;
    if((wasStealthed && !tank.evolutionStealthActive || tank.evolutionStealthExitPending) && effects.stealthExitStun) {
        getEvolutionEnemyList(tank).forEach(enemy => {
            if(!enemy || enemy.dead || Math.hypot(enemy.x - tank.x, enemy.y - tank.y) > 130) return;
            const enemyEffects = enemy.evolutionEffects || {};
            if((enemy.shieldActive && enemyEffects.shieldControlImmune) ||
               (enemy.fortressActive && enemyEffects.fortressControlImmune)) return;
            enemy.evolutionFreezeTimer = Math.max(enemy.evolutionFreezeTimer || 0, effects.stealthExitStun);
        });
        if(typeof createParticles === 'function') createParticles(tank.x, tank.y, 18, '#9d4bff', 1.6);
    }
    tank.evolutionStealthExitPending = false;
    tank.evolutionLastStealth = tank.evolutionStealthActive;
    tank.evolutionDynamicSpeedBoost = 0;
    tank.evolutionDynamicFireRateBoost = 0;
    if((tank.evolutionStealthActive || tank.ghostActive) && effects.stealthSpeed) tank.evolutionDynamicSpeedBoost += effects.stealthSpeed;
    if(effects.lowHpThreshold && tank.hp / Math.max(1, tank.maxHp) <= effects.lowHpThreshold) {
        tank.evolutionDynamicSpeedBoost += effects.lowHpSpeed || 0;
        tank.evolutionDynamicFireRateBoost += effects.lowHpFireRate || 0;
    }
    if(tank.evolutionKillSpeedTimer > 0) {
        tank.evolutionKillSpeedTimer -= dt;
        tank.evolutionDynamicSpeedBoost += tank.evolutionKillSpeedBoost || 0;
    }
    if(tank.evolutionTeleportSpeedTimer > 0) {
        tank.evolutionTeleportSpeedTimer -= dt;
        tank.evolutionDynamicSpeedBoost += effects.teleportSpeed || 0;
    }
    if(tank.evolutionFreezeTimer > 0) {
        tank.evolutionFreezeTimer -= dt;
        tank.canMove = false;
        if(tank.evolutionFreezeTimer <= 0 && !tank.fortressActive && !tank.overheatActive &&
           !tank.ultimateCharging && !tank.nailLocking) tank.canMove = true;
    }
    if(effects.regenPerSecond && tank.hp / Math.max(1, tank.maxHp) < effects.regenThreshold) {
        tank.hp = Math.min(tank.maxHp, tank.hp + effects.regenPerSecond * dt);
    }
    if(effects.shieldHealAura && tank.shieldActive) {
        getEvolutionTeamList(tank).forEach(ally => {
            if(ally && ally !== tank && !ally.dead && Math.hypot(ally.x - tank.x, ally.y - tank.y) <= 180) {
                ally.hp = Math.min(ally.maxHp, ally.hp + effects.shieldHealAura * dt);
            }
        });
    }
    tank.evolutionShieldWasActive = !!tank.shieldActive;
    if(effects.ultimateBurnDps && tank.ultimateActive) {
        tank.evolutionBurnTick = (tank.evolutionBurnTick || 0) - dt;
        if(tank.evolutionBurnTick <= 0) {
            getEvolutionEnemyList(tank).forEach(enemy => {
                if(enemy && !enemy.dead && Math.hypot(enemy.x - tank.x, enemy.y - tank.y) <= 150) {
                    if(typeof applyDirectDamage === 'function') applyDirectDamage(enemy, effects.ultimateBurnDps, tank, '狂暴自燃');
                }
            });
            tank.evolutionBurnTick = 1;
        }
    }
    if(tank.ultimateCharging && effects.lowHpUltCharge && tank.hp / Math.max(1, tank.maxHp) <= effects.lowHpThreshold) {
        tank.ultimateChargeTimer = Math.max(0, tank.ultimateChargeTimer - dt * effects.lowHpUltCharge);
    }
}

function handleTankEvolutionUltimateStart(tank) {
    if(!tank) return;
    if(typeof spawnTankUltimateAnimation === 'function') spawnTankUltimateAnimation(tank);
    const effects = tank.evolutionEffects || {};
    tank.evolutionUltimateFirstHit = false;
    tank.evolutionShieldBrokenHandled = false;
    if(tank.tankType === 'xingchen27a') {
        tank.ultimateTimer += effects.shieldDurationBonus || 0;
        tank.shieldHp *= effects.shieldHpMult || 1;
        if(effects.teamShield) {
            getEvolutionTeamList(tank).forEach(ally => {
                if(!ally || ally.dead) return;
                ally.shieldActive = true;
                ally.shieldHp = Math.max(ally.shieldHp || 0, effects.teamShield);
            });
        }
    }
    if(tank.tankType === 'xingchen27s') {
        tank.evolutionTeleportSpeedTimer = effects.teleportSpeedDuration || 0;
        tank.evolutionSecondTeleportReady = !!effects.secondTeleport;
        tank.evolutionTeleportCritReady = !!effects.teleportCrit;
        if(effects.teleportSlow) {
            getEvolutionEnemyList(tank).forEach(enemy => {
                if(!enemy || enemy.dead || Math.hypot(enemy.x - tank.x, enemy.y - tank.y) > 170) return;
                enemy.mapSlow = Math.max(enemy.mapSlow || 0, effects.teleportSlow);
                enemy.mapSlowTimer = Math.max(enemy.mapSlowTimer || 0, effects.teleportSlowDuration || 2);
            });
        }
    }
    if(tank.tankType === 'duoduo_ifv' && effects.stormCanMove) tank.canMove = true;
}

function performTankEvolutionSecondTeleport(tank) {
    const effects = tank && tank.evolutionEffects || {};
    if(!tank || !tank.evolutionSecondTeleportReady || !effects.secondTeleport) return false;
    const angle = tank.turretAngle;
    let distance = effects.secondTeleport;
    let tx = tank.x + Math.cos(angle) * distance;
    let ty = tank.y + Math.sin(angle) * distance;
    tx = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapWidth - CONFIG.tankSize, tx));
    ty = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapHeight - CONFIG.tankSize, ty));
    if(!effects.teleportThroughWalls && typeof checkObstacleCollision === 'function' && checkObstacleCollision(tx, ty, CONFIG.tankSize, tank)) {
        while(distance > 20) {
            distance -= 20;
            tx = tank.x + Math.cos(angle) * distance;
            ty = tank.y + Math.sin(angle) * distance;
            if(!checkObstacleCollision(tx, ty, CONFIG.tankSize, tank)) break;
        }
    }
    tank.x = tx;
    tank.y = ty;
    tank.evolutionSecondTeleportReady = false;
    tank.evolutionTeleportSpeedTimer = effects.teleportSpeedDuration || 1;
    if(typeof createParticles === 'function') createParticles(tank.x, tank.y, 20, '#66dfff', 1.5);
    return true;
}
