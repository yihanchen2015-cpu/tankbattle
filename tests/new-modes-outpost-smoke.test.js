const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

function CanvasRenderingContext2D() {}
CanvasRenderingContext2D.prototype = {};

const elements = new Map();
const makeElement = () => ({
    textContent: '',
    innerHTML: '',
    style: {setProperty() {}},
    classList: {add() {}, remove() {}},
    children: [],
    appendChild(child) { this.children.push(child); },
    replaceChildren() { this.children = []; },
    remove() {}
});

const context = {
    console,
    Math,
    Date,
    Map,
    Set,
    AbortController,
    CanvasRenderingContext2D,
    performance: {now: () => 1000},
    window: {},
    navigator: {},
    document: {
        body: {appendChild() {}},
        getElementById(id) {
            if(!elements.has(id)) elements.set(id, makeElement());
            return elements.get(id);
        },
        createElement: makeElement
    },
    setTimeout() {},
    init() {},
    createParticles() {},
    addExhaustTrail() {},
    playWorldSound() {},
    showDamageNumber() {},
    showMessage() {},
    stopEngineAudio() {},
    recordShot() {},
    recordOutpostCapture() {},
    recordBaseDestroy() {},
    recordPlayerDamageSource() {},
    spawnMasteryDeathFlame() {}
};

vm.createContext(context);
for(const file of ['Config.js', 'Replay.js', 'Score.js', 'GameCore.js', 'Combat.js', 'Pathfinding.js', 'Render.js']) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, {filename:file});
}

const result = vm.runInContext(`(() => {
    showNotification = () => {};
    recordKill = (killer, target) => awardKillScore(killer, target);
    currentMap = 'classic';
    gameMode = 'classic';
    generateMap();
    obstacles = [];
    terrainZones = [];
    mapElements = [];
    neutralNPCs = [];
    resetTeamScores();

    const point = outposts[0];
    player = createTank(TANKS.zuoyan29, point.x, point.y, 'blue', true);
    player.invincible = 0;
    allies = [];
    enemies = [];
    aiTanks = [];
    updateOutposts(5.1);
    const firstCapture = {
        owner: point.owner,
        level: point.level,
        blueScore: teamScores.blue
    };
    updateOutposts(60.1);
    const heldResult = {
        level: point.level,
        blueScore: teamScores.blue
    };

    const red = createTank(TANKS.xingchen27a, point.x, point.y, 'red', false);
    red.invincible = 0;
    player.x = point.x - point.radius - 100;
    enemies = [red];
    aiTanks = [red];
    updateOutposts(5.1);
    const redCapture = {
        owner: point.owner,
        recaptureTeam: point.recaptureTeam,
        recaptureTimer: point.recaptureTimer
    };
    red.x = point.x + point.radius + 100;
    player.x = point.x;
    updateOutposts(2.6);
    const recaptured = {
        owner: point.owner,
        level: point.level
    };

    gameMode = 'deathmatch';
    generateMap();
    resetTeamScores();
    initDeathmatchMode();
    const blueKiller = {team:'blue', tankType:'zuoyan29'};
    const redTarget = {team:'red', tankType:'xingchen27a'};
    for(let i = 0; i < 50; i++) awardKillScore(blueKiller, redTarget);
    let deathmatchEnd = null;
    endGame = reason => { deathmatchEnd = reason; };
    checkWinCondition();
    const deathmatch = {
        outposts: outposts.length,
        basesHidden: bases.blue.hidden && bases.red.hidden,
        kills: deathmatchData.kills.blue,
        score: teamScores.blue,
        end: deathmatchEnd
    };

    gameMode = 'escort';
    generateMap();
    obstacles = [];
    initPathGrid();
    player = createTank(TANKS.zuoyan29, outposts[0].x, outposts[0].y, 'blue', true);
    allies = [];
    enemies = [];
    aiTanks = [];
    initEscortMode();
    const vip = escortData.vip;
    vip.invincible = 0;
    vip.x = escortData.end.x;
    vip.y = escortData.end.y;
    updateEscortVIPTank(vip, .016);
    const escort = {
        hp: vip.maxHp,
        reached: escortData.reached,
        inAllies: allies.includes(vip),
        start: escortData.start,
        end: escortData.end
    };

    gameMode = 'boss';
    generateMap();
    obstacles = [];
    player = createTank(TANKS.zuoyan29, CONFIG.mapWidth / 2 - 200, CONFIG.mapHeight / 2, 'blue', true);
    player.invincible = 0;
    allies = [];
    enemies = [];
    aiTanks = [];
    resetTeamScores();
    initBossMode();
    const boss = bossModeData.boss;
    boss.invincible = 0;
    applyDirectDamage(boss, 40000, player, '测试末击');
    const bossResult = {
        hp: boss.maxHp,
        dead: boss.dead,
        score: teamScores.blue,
        killerTeam: bossModeData.killerTeam,
        buffTimer: bossModeData.buffTimer,
        attack: player.bossBuffAttackMult,
        defense: player.bossBuffDefenseMult,
        speed: player.bossBuffSpeed
    };

    return {firstCapture, heldResult, redCapture, recaptured, deathmatch, escort, bossResult};
})()`, context);

assert.deepStrictEqual(JSON.parse(JSON.stringify(result.firstCapture)), {
    owner: 'blue',
    level: 1,
    blueScore: 500
});
assert.strictEqual(result.heldResult.level, 2, 'an outpost should level up after one minute of ownership');
assert.strictEqual(result.heldResult.blueScore, 900, 'a level-2 outpost should produce 400 points at the minute tick');
assert.strictEqual(result.redCapture.owner, 'red');
assert.strictEqual(result.redCapture.recaptureTeam, 'blue');
assert(result.redCapture.recaptureTimer > 4.8, 'the former defender should retain a ten-second recapture window');
assert.strictEqual(result.recaptured.owner, 'blue', 'recapture should complete in half the normal capture time');
assert.strictEqual(result.recaptured.level, 1, 'ownership changes should reset the outpost to level one');

assert.strictEqual(result.deathmatch.outposts, 0);
assert.strictEqual(result.deathmatch.basesHidden, true);
assert.strictEqual(result.deathmatch.kills, 50);
assert.strictEqual(result.deathmatch.score, 0, 'deathmatch kills must not generate team score');
assert.strictEqual(result.deathmatch.end, 'deathmatchBlueWin');

assert(result.escort.hp >= 6500);
assert.strictEqual(result.escort.reached, true);
assert.strictEqual(result.escort.inAllies, true);
assert.notDeepStrictEqual(result.escort.start, result.escort.end);

assert.strictEqual(result.bossResult.hp, 30000);
assert.strictEqual(result.bossResult.dead, true);
assert.strictEqual(result.bossResult.score, 5000);
assert.strictEqual(result.bossResult.killerTeam, 'blue');
assert.strictEqual(result.bossResult.buffTimer, 30);
assert.strictEqual(result.bossResult.attack, 1.25);
assert.strictEqual(result.bossResult.defense, .75);
assert.strictEqual(result.bossResult.speed, .15);

const html = fs.readFileSync('index.html', 'utf8');
assert(html.includes("selectMode('escort')") && html.includes("selectMode('deathmatch')") && html.includes("selectMode('boss')"));
assert(!html.includes("selectMode('ctf')") && !html.includes("selectMode('infection')") && !html.includes("selectMode('storm')"));

console.log('New modes and outpost smoke test passed:', result);
