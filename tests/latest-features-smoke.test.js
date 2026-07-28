const assert = require('assert');
const fs = require('fs');

const ui = fs.readFileSync('UI.js', 'utf8');
const ai = fs.readFileSync('AI.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const combat = fs.readFileSync('Combat.js', 'utf8');
const achievements = fs.readFileSync('Achievement.js', 'utf8');

assert(ui.includes("['zuoyan', 'xingchen', 'duoduo', 'niuniu', 'kimi']"), 'tank selector should use the requested series order');
assert(html.includes("data-series=\"niuniu\""), 'Niuniu series filter should be visible');
assert(html.includes('id="aiSeriesFilterBtn"') && html.includes("filterTanks('kimi', this)"), 'the unlockable AI-series filter should exist');
assert(ui.includes("isTankUnlocked('kimi_tank')") && ui.includes("aiButton.hidden = !aiUnlocked"),
    'the AI-series filter should only become visible after Kimi is unlocked');
assert(ui.includes("'炸药包数量 (个)'"), 'helicopter loadout should rename shell ammunition');
assert(ui.includes("'空对空机枪弹量 (发)'"), 'helicopter loadout should rename machine-gun ammunition');
assert(ui.includes("e.code === 'Digit1'") && ui.includes("e.code === 'BracketRight'"), 'direct weapon and elevation shortcuts should be registered');
assert(ui.includes("e.code === 'KeyQ'") && ui.includes("deploySmokeGrenade(player, {atFeet:true, quick:true})"), 'Q should deploy smoke at the ground tank position');
assert(ai.includes("stopDist = nearestEnemy.isFlying ? 170 : 18"), 'helicopter AI should fly over ground targets');
assert(ai.includes("Math.abs((tank.z || 0) - (nearestEnemy.z || 0)) <= 42"), 'helicopter AI should align altitude before air-to-air fire');
assert(combat.includes('projectileMatchesTargetHeight'), 'direct-hit collision should validate projectile height');
assert(combat.includes('explosionWidth: type === \'bomb\' ? 150'), 'helicopter bomb should use a 150x150 damage footprint');
assert(combat.includes('const distance = atFeet ? 0 : 95'), 'quick smoke should be centered under the tank');
assert(achievements.includes("id: 'smokeRookie'") && achievements.includes("id: 'quickSmokeExpert'"), 'smoke achievements should exist');
assert(achievements.includes("id: 'fieldRefit'") && achievements.includes("id: 'battleHardened'"), 'damage-upgrade achievements should exist');
assert(achievements.includes('function recordSmokeDeployment') && achievements.includes('function recordDamageUpgrade'), 'new achievement progress should be recorded');
assert(html.includes('Achievement.js?v=new-modes-20') && html.includes('UI.js?v=new-modes-20') && html.includes('Combat.js?v=new-modes-20'), 'changed scripts should use fresh cache keys');

console.log('Latest feature smoke test passed.');
