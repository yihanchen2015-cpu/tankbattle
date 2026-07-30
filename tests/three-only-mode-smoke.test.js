const assert = require('assert');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const ui = fs.readFileSync('UI.js', 'utf8');
const core = fs.readFileSync('GameCore.js', 'utf8');
const three = fs.readFileSync('ThreeRender.js', 'utf8');
const css = fs.readFileSync('style.css', 'utf8');

assert(!html.includes('id="viewMode"'), 'the pre-battle 2D/3D selector should be removed');
assert(!html.includes('id="viewModeIndicator"'), 'the in-battle view switch hint should be removed');
assert(!html.includes('V 键') && !html.includes('2D 俯视'), 'player-facing instructions should no longer advertise 2D mode');
assert(!ui.includes("e.code === 'KeyV'"), 'the V-key view switch should be removed');
assert(!core.includes('function toggleViewMode') && !core.includes('function setViewMode'),
    'runtime view switching and 2D fallback should be removed');
assert(core.includes("const viewMode = '3d'") && core.includes('activateThreeView();'),
    'every match should initialize directly into the 3D renderer');
assert(core.includes('游戏未开始') && !core.includes('已回到 2D'),
    'unsupported WebGL should stop startup instead of falling back to 2D');

assert(three.includes('group.userData.playerBeacon = playerBeacon') &&
    three.includes("tank.isPlayer ? 'three-tank-label three-player-label'"),
    'the player should receive both a world beacon and a high-priority HUD label');
assert(css.includes('.three-player-label') && css.includes('.three-player-label .three-player-pin'),
    'the player locator should have dedicated high-visibility styling');
assert(html.includes('UI.js?v=three-only-26') &&
    html.includes('GameCore.js?v=three-only-26') &&
    html.includes('ThreeRender.js?v=three-only-26'),
    '3D-only assets should use fresh cache keys');

console.log('3D-only mode and player locator smoke test passed.');
