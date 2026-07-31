const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('style.css', 'utf8');
const source = fs.readFileSync('Settings.js', 'utf8');
const core = fs.readFileSync('GameCore.js', 'utf8');
const combat = fs.readFileSync('Combat.js', 'utf8');
const audio = fs.readFileSync('Audio.js', 'utf8');
const ultimate = fs.readFileSync('Ultimate.js', 'utf8');
const ui = fs.readFileSync('UI.js', 'utf8');
const replay = fs.readFileSync('Replay.js', 'utf8');
const three = fs.readFileSync('ThreeRender.js', 'utf8');

assert(html.includes('id="btnSettings"') && html.includes('id="settingsModal"'), 'the home screen should expose a settings dialog');
[
    'friendlyFire', 'beginnerMode', 'audioEnabled', 'screenShake', 'damageNumbers',
    'autoAim', 'combatReplay', 'minimap', 'playerLocator'
].forEach(key => assert(html.includes(`id="setting-${key}"`), `missing setting control: ${key}`));
assert(html.indexOf('Settings.js?v=physics-settings-28') < html.indexOf('Audio.js?v=physics-settings-28'),
    'settings must load before systems that consume them');
assert(css.includes('--font-mechanical:') && css.includes('--font-mechanical-display:'),
    'the interface should define a shared mechanical type system');
assert(css.includes('button, input, select, textarea') && css.includes('font: inherit'),
    'form controls should inherit the mechanical font');
assert(core.includes('player.maxHp * 1.35') && core.includes('player.maxShells * 1.25'),
    'beginner mode should provide visible durability and ammo gains');
assert(combat.includes('beginnerDamageMultiplier') && combat.includes('isFriendlyFireEnabled()'),
    'combat should consume beginner and friendly-fire settings');
assert(audio.includes('isGameAudioEnabled') && audio.includes('isScreenShakeEnabled'),
    'audio and shake toggles should gate their runtime systems');
assert(ultimate.includes('areDamageNumbersEnabled'), 'damage number rendering should respect its setting');
assert(ui.includes('BEGINNER_TANK_POOL') && ui.includes('BEGINNER_TANK_POOL.includes(key)'),
    'beginner mode should render a reduced curated tank roster');
assert(replay.includes('isCombatReplayEnabled') && ultimate.includes('isMinimapEnabled'),
    'replay and minimap options should gate their runtime systems');
assert(three.includes('isPlayerLocatorEnabled') && three.includes('syncThreeTargetingLasers(now)'),
    '3D player markers and targeting lasers should be synchronized by the renderer');

const storage = new Map();
const elements = new Map();
const rootClasses = new Set();
const makeElement = id => ({
    id,
    checked: false,
    textContent: '',
    classList: {
        add(name) { rootClasses.add(`${id}:${name}`); },
        remove(name) { rootClasses.delete(`${id}:${name}`); }
    },
    addEventListener() {}
});
[
    'settingsModal', 'settingsSummary',
    'setting-friendlyFire', 'setting-beginnerMode', 'setting-audioEnabled',
    'setting-screenShake', 'setting-damageNumbers', 'setting-autoAim',
    'setting-combatReplay', 'setting-minimap', 'setting-playerLocator'
].forEach(id => elements.set(id, makeElement(id)));

const sandbox = {
    console,
    localStorage: {
        getItem(key) { return storage.has(key) ? storage.get(key) : null; },
        setItem(key, value) { storage.set(key, value); }
    },
    document: {
        getElementById(id) { return elements.get(id) || null; },
        documentElement: {
            classList: {
                toggle(name, active) {
                    if(active) rootClasses.add(name);
                    else rootClasses.delete(name);
                }
            }
        }
    }
};
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
vm.runInContext('initializeGameSettings()', sandbox);
assert.strictEqual(vm.runInContext('gameSettings.audioEnabled', sandbox), true);
assert.strictEqual(vm.runInContext('gameSettings.friendlyFire', sandbox), false);

vm.runInContext('showSettingsPanel()', sandbox);
assert(rootClasses.has('settingsModal:active'), 'settings dialog should open before saving');
elements.get('setting-friendlyFire').checked = true;
elements.get('setting-beginnerMode').checked = true;
vm.runInContext('saveSettingsFromPanel()', sandbox);
assert.strictEqual(JSON.parse(storage.get('tankBattleSettingsV1')).friendlyFire, true);
assert(rootClasses.has('beginner-mode-enabled'), 'beginner mode should be reflected on the root UI state');
assert(!rootClasses.has('settingsModal:active'), 'saving settings should close the dialog automatically');

vm.runInContext('resetSettingsToDefault()', sandbox);
assert.strictEqual(JSON.parse(storage.get('tankBattleSettingsV1')).friendlyFire, false);
assert.strictEqual(elements.get('setting-audioEnabled').checked, true);

console.log('Settings and mechanical typography smoke test passed.');
