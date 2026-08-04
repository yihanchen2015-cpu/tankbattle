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
        bases: {blue:null,red:null}, obstacles: [], terrainZones: [], mapElements: [], currentMap: 'classic', mapMechanicsState: null, gameConfig: {},
        createParticles() {}, showDamageNumber() {}, showNotification() {}, showMessage() {},
        applyTankElementalStatus() {}, applyDirectDamage() {}, getNearbyTanks: () => [],
        normalizeAngle: angle => Math.atan2(Math.sin(angle), Math.cos(angle)),
        playerStats: {unlockedTanks: []}, saveStats() {}, renderTankList() {}
    };
    vm.createContext(context);
    vm.runInContext(source + `\n;globalThis.__storyTest={
        count:STORY_LEVELS.length,
        mainline:STORY_MAINLINE.length,
        rewards:STORY_LEVELS.filter(level=>level.rewardLevel).length,
        chapters:[...new Set(STORY_LEVELS.map(level=>level.chapter))],
        mechanics:STORY_LEVELS.map(level=>level.mechanic),
        final:STORY_LEVELS.find(level=>level.id==='triCore'),
        levels:STORY_LEVELS,
        layouts:STORY_MAP_LAYOUTS,
        intro:id=>getExpandedStoryIntro(STORY_LEVELS.find(level=>level.id===id)),
        outro:id=>getExpandedStoryOutro(STORY_LEVELS.find(level=>level.id===id)),
        setLevel(id){storyModeState.currentLevelId=id;storyModeState.currentLevel=STORY_LEVELS.find(level=>level.id===id);},
        unlock:index=>isStoryLevelUnlocked(index),
        save:saveStoryProgress,
        weak:modifyStoryBossDamage,
        tri:applyMechaPeaTriPhase,
        permanent:getStoryPermanentRewards,
        unlockTank:unlockMechaPea,
        hiddenGate(){
            const runtime={gate:STORY_MAP_LAYOUTS.frostTrial.gate,crossbow:{...STORY_MAP_LAYOUTS.frostTrial.crossbow,dead:false,cooldown:99},crossbowBolts:[],hiddenGateDialogue:false,playerAttacked:false};
            storyModeState.runtime=runtime;player.x=750;player.y=220;enemies=[{dead:false,hp:100,canMove:true}];gameState='playing';
            updateFrostTrial(.016,STORY_LEVELS[0],runtime);
            return {runtime,state:gameState,dialogue:storyModeState.dialogue};
        },
        crossbowShot(){
            const runtime={gate:STORY_MAP_LAYOUTS.frostTrial.gate,crossbow:{...STORY_MAP_LAYOUTS.frostTrial.crossbow,dead:false,cooldown:0},crossbowBolts:[],hiddenGateDialogue:false,playerAttacked:true};
            storyModeState.runtime=runtime;player.x=750;player.y=1250;enemies=[{dead:false,hp:100,canMove:true}];bullets=[];gameState='playing';
            updateFrostTrial(.1,STORY_LEVELS[0],runtime);return runtime.crossbowBolts[0];
        },
        icicleDrop(){
            const layout=STORY_MAP_LAYOUTS.crystalCorridor,runtime={ceilingIcicles:layout.icicles.map(item=>({...item})),fallingIcicles:[],icicleCooldown:0,elapsed:3};
            enemies=[{dead:false,hp:100}];updateCrystalCorridor(.1,STORY_LEVELS[1],runtime);return runtime.fallingIcicles[0];
        },
        markAttack(){const runtime={playerAttacked:false};storyModeState.runtime=runtime;applyStoryProjectileProperties(player,{type:'shell'});return runtime.playerAttacked;}
    };`, context);

    const api = context.__storyTest;
    assert.equal(api.count, 19);
    assert.equal(api.mainline, 14);
    assert.equal(api.rewards, 5);
    assert.deepEqual(Array.from(api.chapters), [1, 2, 3, 4, 5]);
    assert.equal(new Set(Array.from(api.mechanics)).size, 19);
    assert.equal(api.final.id, 'triCore');
    assert.equal(api.final.enemyTypes[0], 'mecha_pea');
    const layouts = Object.values(api.layouts);
    assert.equal(layouts.length, 19);
    assert.deepEqual(layouts.map(layout => layout.id), Array.from(api.levels, level => level.id));
    layouts.forEach((layout, index) => {
        assert.ok(layout.width >= 1100 && layout.height >= 1400, `${layout.id} has a full custom battlefield`);
        assert.equal(layout.direction, 'rear-to-front', `${layout.id} uses rear-to-front progression`);
        assert.ok(layout.obstacles.length >= 8, `${layout.id} has bespoke terrain`);
        assert.equal(layout.enemySpawns.length, api.levels[index].enemyTypes.length, `${layout.id} deploys every initial enemy`);
        assert.ok(layout.player.x > 0 && layout.player.x < layout.width);
        assert.ok(layout.player.y > 0 && layout.player.y < layout.height);
    });
    const gate = api.layouts.frostTrial;
    assert.equal(gate.width, 1500);
    assert.equal(gate.height, 1500);
    assert.equal(gate.enemySpawns.length, 2);
    assert.deepEqual(Array.from(gate.enemySpawns, spawn => spawn.role), ['gateLeft','gateRight']);
    assert.equal(gate.gate.w, 500);
    assert.equal(gate.crossbow.type, 'gateCrossbow');
    assert.equal(gate.crossbow.z, 820);
    assert.ok(!gate.obstacles.some(obstacle => gate.gate.x + gate.gate.w/2 >= obstacle.x && gate.gate.x + gate.gate.w/2 <= obstacle.x + obstacle.w && gate.crossbow.y >= obstacle.y && gate.crossbow.y <= obstacle.y + obstacle.h), 'central gate opening stays empty');
    assert.ok(gate.obstacles.some(obstacle => obstacle.storyLabel === '冰城墙左翼'));
    assert.ok(gate.obstacles.some(obstacle => obstacle.storyLabel === '冰城墙右翼'));
    assert.equal(api.layouts.crystalCorridor.ceiling.sealed, true);
    assert.equal(api.layouts.crystalCorridor.icicles.length, 12);
    assert.ok(layouts.filter(layout => layout.ceiling && layout.ceiling.sealed).length >= 12);
    api.levels.forEach(level => {
        assert.ok(api.intro(level.id).length >= 4, `${level.id} has expanded intro dialogue`);
        assert.ok(api.outro(level.id).length >= 3, `${level.id} has expanded outro dialogue`);
    });
    const hidden = api.hiddenGate();
    assert.equal(hidden.runtime.hiddenGateDialogue, true);
    assert.equal(hidden.state, 'storyDialogue');
    assert.equal(hidden.dialogue.length, 5);
    assert.equal(api.markAttack(), true);
    const bolt = api.crossbowShot();
    assert.equal(bolt.type, 'crossbowBolt');
    assert.ok(bolt.vy > 0, 'crossbow fires from the front toward the rear');
    assert.ok(bolt.z < gate.crossbow.z, 'crossbow bolt descends from the gate tower');
    const fallingIcicle = api.icicleDrop();
    assert.equal(fallingIcicle.type, 'iceSpike');
    assert.match(html, /id="storyMapCanvas"/);
    assert.match(html, /id="storyDialogueOverlay"/);
    assert.match(html, /StoryMode\.js\?v=story-mode-1/);

    assert.equal(api.unlock(0), true);
    assert.equal(api.unlock(1), false);
    api.save({completed:['frostTrial'],choices:{},finished:false});
    assert.equal(api.unlock(1), true);
    assert.equal(api.unlock(3), false);
    api.save({completed:['frostTrial','crystalCorridor','frostResolve'],choices:{},finished:false});
    assert.equal(api.unlock(3), true);
    assert.equal(api.unlock(4), true);

    api.setLevel('frostResolve');
    const boss = {x:1000,y:1000,angle:0,storyBoss:true,storyVulnerable:false,storyWeakParts:[
        {label:'core',x:34,y:0,radius:25,hp:200,maxHp:200,color:'#fff'}
    ]};
    const projectile = {x:1034,y:1000,type:'shell',owner:context.player};
    assert.equal(api.weak(boss, projectile, 250), 0);
    assert.equal(boss.storyWeakParts[0].hp, 0);
    assert.equal(boss.storyVulnerable, true);
    assert.equal(api.weak(boss, projectile, 250), 250);

    api.save({completed:['frostGift','moltenGift','archiveGift','thunderGift','sealEcho'],choices:{},finished:true});
    const permanent = api.permanent();
    assert.equal(permanent.iceResist, .1);
    assert.equal(permanent.fireResist, .1);
    assert.ok(Math.abs(permanent.reloadMult - 1.3) < 1e-9);
    assert.equal(permanent.triResonance, true);

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
