const assert = require('assert');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('style.css', 'utf8');
const core = fs.readFileSync('GameCore.js', 'utf8');
const render = fs.readFileSync('Render.js', 'utf8');

const hudStart = html.indexOf('<div id="hud">');
const hudEnd = html.indexOf('<div id="speedPenalty">', hudStart);
const penaltyPosition = html.indexOf('<div id="speedPenalty">');
assert(hudStart >= 0 && hudEnd > hudStart, 'HUD markup should exist');
const stackStart = html.indexOf('<div id="leftHudStack">');
const stackEnd = html.indexOf('<div id="weaponIndicator">', stackStart);
assert(stackStart >= 0 && stackEnd > stackStart, 'the automatic left HUD stack should exist');
assert(penaltyPosition > hudStart && penaltyPosition < stackEnd,
    'the speed penalty should follow the score HUD instead of covering it');
assert(html.indexOf('<div id="ultimateBar">') > penaltyPosition &&
    html.indexOf('<div id="battleFeed"') < stackEnd,
    'the ultimate bar and battle feed should share the non-overlapping HUD stack');

const penaltyCssStart = css.indexOf('#speedPenalty {');
const penaltyCssEnd = css.indexOf('}', penaltyCssStart);
const penaltyCss = css.slice(penaltyCssStart, penaltyCssEnd);
assert(penaltyCss.includes('position: static'), 'the speed penalty must not use absolute positioning');
assert(!/(^|[;\s])top\s*:/.test(penaltyCss), 'the speed penalty should not be pinned over the score rows');
assert(css.includes('#leftHudStack #hud,') && css.includes('#leftHudStack #battleFeed'),
    'all left-side HUD blocks should use automatic vertical layout');

assert(core.includes("document.getElementById('gameUI').dataset.mode = gameMode"),
    'the active mode should be exposed for collision-free HUD lanes');
assert(html.includes('<div id="centerHudStack">') &&
    html.includes('<div id="modeStatus" aria-live="polite">'),
    'central HUD blocks should share one automatic vertical stack');
assert(css.includes('#centerHudStack > *') &&
    css.includes('@media (max-width: 900px)') &&
    css.includes('#leftHudStack {\n                top: 230px;') &&
    css.includes('width: min(32vw, 160px);'),
    'narrow screens should reserve a separate row below the central HUD');
assert(render.includes('function updateModeStatusHUD()') &&
    render.includes("panel.classList.toggle('no-progress', !showProgress)"),
    'dynamic mode score and progress should render in the DOM stack');
assert(!render.includes('ctx.fillRect(canvas.width / 2 - 150, 64, 300, 34)') &&
    !render.includes('ctx.fillRect(canvas.width / 2 - 220, 62, 440, 48)'),
    'mode panels must not use fixed canvas coordinates beneath DOM HUD elements');
assert(html.includes('style.css?v=armory-skins-29') &&
    html.includes('GameCore.js?v=armory-skins-29') &&
    html.includes('Render.js?v=armory-skins-29'),
    'HUD layout assets should use fresh cache keys');

console.log('HUD layout smoke test passed.');
