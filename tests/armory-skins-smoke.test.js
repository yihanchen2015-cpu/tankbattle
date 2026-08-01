const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const messages = [];
const sandbox = {
    console,
    Math,
    Date,
    setTimeout,
    clearTimeout,
    CONFIG: { mapWidth: 4000, mapHeight: 4000 },
    currentMap: 'classic',
    currentWeapon: 'shell',
    selectedTank: 'demo',
    TANKS: { demo: { name:'测试坦克', color:'#335577', accent:'#88aacc' } },
    playerStats: {
        kills: 999,
        snowMapWins: 49,
        selectedTankSkins: {},
        pixelSkinUnlocked: false
    },
    getTankMasteryProfile() { return { level: 5 }; },
    checkObstacleCollision() { return false; },
    isPositionInWater() { return false; },
    createParticles() {},
    playWorldSound() {},
    showMessage(text) { messages.push(text); },
    showNotification(text) { messages.push(text); },
    saveStats() {},
    document: { getElementById() { return null; } }
};
sandbox.player = {
    isPlayer: true,
    isFlying: false,
    dead: false,
    x: 2000, y: 2000,
    maxShells: 100, shells: 50,
    maxMG: 200, mg: 100,
    maxAA: 20, aa: 10,
    engineLoad: 1
};

vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('Armory.js', 'utf8'), sandbox, { filename:'Armory.js' });

vm.runInContext('initializeTankAttachmentState(player)', sandbox);
assert.strictEqual(vm.runInContext("equipWeaponAttachment(player, 'shell', 'highExplosive')", sandbox), true);
assert.strictEqual(vm.runInContext("equipWeaponAttachment(player, 'shell', 'quickLoader')", sandbox), true);
assert.strictEqual(vm.runInContext("getAttachmentDamageMultiplier(player, 'shell')", sandbox), 1.2);
assert.strictEqual(vm.runInContext("getAttachmentFireRateMultiplier(player, 'shell')", sandbox), 1.125);

vm.runInContext("equipWeaponAttachment(player, 'shell', 'stabilizer')", sandbox);
assert.deepStrictEqual(
    Array.from(vm.runInContext("getTankWeaponAttachments(player, 'shell')", sandbox)),
    ['quickLoader', 'stabilizer'],
    'a third attachment should replace the oldest of two slots'
);
assert.strictEqual(vm.runInContext("getAttachmentSpreadMultiplier(player, 'shell')", sandbox), .7);

vm.runInContext("equipWeaponAttachment(player, 'mg', 'extendedMagazine')", sandbox);
assert.strictEqual(sandbox.player.maxMG, 280, 'extended magazine should increase the correct ammo cap by 40%');
assert.strictEqual(sandbox.player.mg, 180, 'new capacity should immediately grant only the added capacity');

vm.runInContext(`
    weaponAttachmentPickups = [{
        id:'nearby', attachmentId:'armorPiercing', x:player.x, y:player.y, z:0, pulse:0
    }];
    currentWeapon = 'aa';
    updateWeaponAttachmentPickups();
`, sandbox);
assert.strictEqual(vm.runInContext("tankWeaponHasAttachment(player, 'aa', 'armorPiercing')", sandbox), true);
assert.strictEqual(vm.runInContext('weaponAttachmentPickups.length', sandbox), 0);

assert.strictEqual(vm.runInContext("getTankSkinUnlock('demo', 'shadow').unlocked", sandbox), false);
sandbox.getTankMasteryProfile = () => ({ level: 8 });
assert.strictEqual(vm.runInContext("getTankSkinUnlock('demo', 'gold').unlocked", sandbox), true);
sandbox.playerStats.kills = 1000;
sandbox.playerStats.snowMapWins = 50;
assert.strictEqual(vm.runInContext("getTankSkinUnlock('demo', 'flame').unlocked", sandbox), true);
assert.strictEqual(vm.runInContext("getTankSkinUnlock('demo', 'snow').unlocked", sandbox), true);
assert.strictEqual(vm.runInContext("getTankSkinUnlock('demo', 'pixel').unlocked", sandbox), false);
sandbox.playerStats.pixelSkinUnlocked = true;
assert.strictEqual(vm.runInContext("getTankSkinUnlock('demo', 'pixel').unlocked", sandbox), true);

const combat = fs.readFileSync('Combat.js', 'utf8');
const gameCore = fs.readFileSync('GameCore.js', 'utf8');
const render = fs.readFileSync('Render.js', 'utf8');
const three = fs.readFileSync('ThreeRender.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
assert(combat.includes('armorIgnorePercent') && combat.includes('getAttachmentDamageMultiplier'));
assert(combat.includes("'suppressor'") && combat.includes('minimapRevealedUntil'));
assert(gameCore.includes('getAttachmentFireRateMultiplier') && gameCore.includes('resetWeaponAttachmentPickups'));
assert(render.includes('weaponAttachmentHud') && render.includes('weaponAttachmentPickups'));
assert(three.includes('syncThreeAttachmentPickups') && three.includes("tank.skinId === 'pixel'"));
assert(html.includes('tankSkinSelector') && html.includes('Armory.js?v=armory-skins-29'));

console.log('Armory and skins smoke test passed:', { messages: messages.length });
