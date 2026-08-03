const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('story campaign structure, weak parts, counter shots and tri-phase reward', () => {
    const root = path.join(__dirname, '..');
    const source = fs.readFileSync(path.join(root, 'StoryMode.js'), 'utf8');
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const storage = new Map();
    const context = {
        console,
        Math,
        JSON,
        Set,
        performance: {now: () => 1000},
        window: {addEventListener() {}, devicePixelRatio: 1},
        document: {getElementById: () => null},
        localStorage: {
            getItem: key => storage.has(key) ? storage.get(key) : null,
            setItem: (key, value) => storage.set(key, value)
        },
        TANKS: {zuoyan29:{}, mecha_pea:{}},
        CONFIG: {mapWidth: 5400, mapHeight: 5400},
        gameMode: 'story', gameState: 'playing',
        player: {x:300,y:300,hp:1600,maxHp:1600,dead:false,tankType:'zuoyan29'},
        enemies: [], allies: [], bullets: [], particles: [], outposts: [], neutralNPCs: [], aiTanks: [],
        bases: {blue:null,red:null}, obstacles: [], currentMap: 'classic', mapMechanicsState: null,
        createParticles() {}, showDamageNumber() {}, showNotification() {}, showMessage() {},
        applyTankElementalStatus() {}, applyDirectDamage() {}, getNearbyTanks: () => [],
        normalizeAngle: angle => Math.atan2(Math.sin(angle), Math.cos(angle)),
        playerStats: {unlockedTanks: []}, saveStats() {}, renderTankList() {}
    };
    vm.createContext(context);
    vm.runInContext(source + `\n;globalThis.__storyTest={
        count:STORY_LEVELS.length,
        chapters:[...new Set(STORY_LEVELS.map(level=>level.chapter))],
        mechanics:STORY_LEVELS.map(level=>level.mechanic),
        final:STORY_LEVELS[STORY_LEVELS.length-1],
        levels:STORY_LEVELS,
        setLevel(id){storyModeState.currentLevelId=id;storyModeState.currentLevel=STORY_LEVELS.find(level=>level.id===id);},
        unlock:index=>isStoryLevelUnlocked(index),
        save:saveStoryProgress,
        weak:modifyStoryBossDamage,
        tri:applyMechaPeaTriPhase,
        unlockTank:unlockMechaPea
    };`, context);

    const api = context.__storyTest;
    assert.equal(api.count, 11);
    assert.deepEqual(Array.from(api.chapters), [1, 2, 3, 4]);
    assert.equal(new Set(Array.from(api.mechanics)).size, 11);
    assert.equal(api.final.id, 'codeAbyss');
    assert.equal(api.final.enemyTypes[0], 'mecha_pea');
    assert.match(html, /id="storyMapCanvas"/);
    assert.match(html, /id="storyDialogueOverlay"/);
    assert.match(html, /StoryMode\.js\?v=story-mode-1/);

    assert.equal(api.unlock(0), true);
    assert.equal(api.unlock(1), false);
    api.save({completed:['iceTrap'],introSeen:true,finished:false});
    assert.equal(api.unlock(1), true);

    api.setLevel('fireWalker');
    const boss = {x:1000,y:1000,angle:0,storyBoss:true,storyVulnerable:false,storyWeakParts:[
        {label:'core',x:34,y:0,radius:25,hp:200,maxHp:200,color:'#fff'}
    ]};
    const projectile = {x:1034,y:1000,type:'shell',owner:context.player};
    assert.equal(api.weak(boss, projectile, 250), 0);
    assert.equal(boss.storyWeakParts[0].hp, 0);
    assert.equal(boss.storyVulnerable, true);
    assert.equal(api.weak(boss, projectile, 250), 250);

    const reward = {tankType:'mecha_pea',triPhaseIndex:0};
    const phases = [0,1,2].map(() => {
        const shell = {type:'shell'};
        api.tri(reward, shell);
        return shell.triPhase;
    });
    assert.deepEqual(phases, ['ice','fire','toxin']);
    api.unlockTank();
    assert.deepEqual(context.playerStats.unlockedTanks, ['mecha_pea']);
});
