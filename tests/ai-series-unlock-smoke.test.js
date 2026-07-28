const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

function makeButton(series, hidden = false) {
    const classes = new Set(series === 'all' ? ['series-btn', 'active'] : ['series-btn']);
    return {
        hidden,
        style: {display: hidden ? 'none' : ''},
        attributes: {},
        dataset: {series},
        classList: {
            add(value) { classes.add(value); },
            remove(value) { classes.delete(value); },
            contains(value) { return classes.has(value); }
        },
        setAttribute(name, value) { this.attributes[name] = value; }
    };
}

const allButton = makeButton('all');
const aiButton = makeButton('kimi', true);
const buttons = [allButton, aiButton];
const context = {
    console,
    Math,
    Date,
    Map,
    Set,
    AbortController,
    navigator: {},
    window: {},
    document: {
        getElementById(id) {
            if(id === 'aiSeriesFilterBtn') return aiButton;
            return null;
        },
        querySelectorAll(selector) {
            return selector === '.series-btn' ? buttons : [];
        },
        querySelector(selector) {
            return selector === '.series-btn[data-series="all"]' ? allButton : null;
        }
    },
    init() {},
    showNotification() {}
};

vm.createContext(context);
for(const file of ['Config.js', 'Achievement.js', 'UI.js']) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, {filename: file});
}

const result = vm.runInContext(`(() => {
    playerStats.unlockedTanks=[];
    const lockedVisible=updateSeriesFilterVisibility();
    const lockedState={hidden:document.getElementById('aiSeriesFilterBtn').hidden,display:document.getElementById('aiSeriesFilterBtn').style.display};

    let renders=0;
    renderTankList=()=>{renders++;};
    saveStats=()=>{};
    playerStats.unlockedAchievements=['tankAce'];
    checkHiddenTankUnlocks();
    const unlockedState={
        visible:updateSeriesFilterVisibility(),
        hidden:document.getElementById('aiSeriesFilterBtn').hidden,
        display:document.getElementById('aiSeriesFilterBtn').style.display,
        aria:document.getElementById('aiSeriesFilterBtn').attributes['aria-hidden'],
        tankUnlocked:isTankUnlocked('kimi_tank'),
        renders
    };
    recordTankUsed('kimi_tank');
    return {lockedVisible,lockedState,unlockedState,seriesUsed:playerStats.seriesUsed.slice()};
})()`, context);

assert.strictEqual(result.lockedVisible, false);
assert.deepStrictEqual(JSON.parse(JSON.stringify(result.lockedState)), {hidden:true,display:'none'},
    'AI-series button should stay hidden before Kimi is unlocked');
assert.deepStrictEqual(JSON.parse(JSON.stringify(result.unlockedState)), {
    visible:true,hidden:false,display:'',aria:'false',tankUnlocked:true,renders:1
}, 'unlocking Kimi should immediately reveal the AI-series button and refresh the selector');
assert(result.seriesUsed.includes('kimi'), 'using Kimi should count as using the AI series');

console.log('AI-series unlock smoke test passed:', result);
