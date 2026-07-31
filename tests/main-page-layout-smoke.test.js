const assert = require('assert');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('style.css', 'utf8');
const ultimate = fs.readFileSync('Ultimate.js', 'utf8');

assert(html.includes('<header class="start-hero">'), 'home page should have a dedicated hero header');
assert(html.includes('<main class="start-mode-panel">'), 'battle modes should live in the main content region');
assert(html.includes('<nav class="start-actions"'), 'secondary destinations should use a separate navigation region');
const modeButtons = html.match(/id="btnMode(?:Classic|Defense|Sneak|Escort|Deathmatch|Boss|Custom)"/g) || [];
assert.strictEqual(modeButtons.length, 7, 'home page should expose exactly seven playable modes');
assert(!html.includes('btnModePVP') && !html.includes('btnModeParty'), 'unavailable placeholder modes should be removed');
assert(css.includes('grid-template-columns: repeat(3, minmax(0, 1fr))'), 'desktop modes should use a compact three-column grid');
assert(!css.includes('justify-content: safe center'), 'the scrollable home page should not retain conflicting vertical alignment');
assert(!ultimate.includes("gameConfig.viewMode === '3d'"), 'the removed 2D renderer branch should stay out of the main render path');

console.log('Main page organization smoke test passed.');
