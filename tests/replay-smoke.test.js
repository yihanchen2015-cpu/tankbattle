const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const elements = {
    combatReplayOverlay: { classList: { active: false, add() { this.active = true; }, remove() { this.active = false; } } },
    combatReplayCause: { textContent: '' }
};
let scheduled = null;
let ended = null;
const sandbox = {
    console,
    Math,
    performance: { now: () => 1000 },
    requestAnimationFrame(callback) { scheduled = callback; return 1; },
    cancelAnimationFrame() {},
    setTimeout(callback) { callback(); },
    window: { innerWidth: 1000, innerHeight: 700, devicePixelRatio: 1 },
    document: { getElementById: id => elements[id] || null },
    TANKS: { hero: { name: '玩家坦克' }, enemy: { name: '敌方坦克' } },
    gameState: 'playing',
    player: { id: 1, x: 100, y: 100, z: 0, hp: 100, maxHp: 100, team: 'blue', tankType: 'hero', dead: false },
    allies: [],
    enemies: [{ id: 2, x: 160, y: 100, z: 0, hp: 100, maxHp: 100, team: 'red', tankType: 'enemy', dead: false, lastFiredWeapon: 'shell' }],
    bullets: [],
    obstacles: [],
    finishEndGame(reason) { ended = reason; }
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'Replay.js'), 'utf8'), sandbox);

vm.runInContext(`
    var fatalBullet = { x: -800, y: 100, z: 20, vx: 20, vy: 0, type: 'shell', team: 'red', owner: enemies[0], age: 0 };
    bullets = [fatalBullet];
`, sandbox);
for(let i = 0; i < 50; i++) vm.runInContext('fatalBullet.x += 18; fatalBullet.age += 0.067; updateCombatReplayBuffer(0.067)', sandbox);
const cachedSpan = vm.runInContext('combatReplayFrames[combatReplayFrames.length - 1].time - combatReplayFrames[0].time', sandbox);
assert(cachedSpan >= 3 && cachedSpan <= 3.3, '应缓存足够覆盖炮弹发射的约 3.2 秒战况');
vm.runInContext('fatalBullet.x = 96; recordPlayerDamageSource(180, enemies[0], null, fatalBullet); player.dead = true; player.hp = 0; captureCombatReplayFrame(true);', sandbox);
assert.strictEqual(vm.runInContext("startCombatReplay('playerDead')", sandbox), true);
assert.strictEqual(elements.combatReplayOverlay.classList.active, true);
assert(elements.combatReplayCause.textContent.includes('敌方坦克'));
assert(elements.combatReplayCause.textContent.includes('主炮'));
assert(vm.runInContext('lastPlayerDamageInfo.projectileId !== null', sandbox));
assert(vm.runInContext('combatReplaySequence.some(frame => frame.bullets.some(b => b.id === lastPlayerDamageInfo.projectileId))', sandbox));
assert(vm.runInContext('getReplayCamera(sampleCombatReplay(combatReplaySequence[0].time), 0).bullet !== null', sandbox));
assert.strictEqual(vm.runInContext('COMBAT_REPLAY_SPEED', sandbox), 0.3);
assert.strictEqual(typeof scheduled, 'function');
vm.runInContext('skipCombatReplay()', sandbox);
assert.strictEqual(ended, 'playerDead');

console.log('Replay smoke test passed:', {
    frames: vm.runInContext('combatReplayFrames.length', sandbox),
    cachedSpan,
    cause: elements.combatReplayCause.textContent,
    ended
});
