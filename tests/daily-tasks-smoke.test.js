const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('DailyTasks.js', 'utf8');
const awarded = [];
let saveCount = 0;
class FixedDate extends Date {
    constructor(...args) {
        if(args.length) super(...args);
        else super(2026, 6, 29, 12, 0, 0);
    }
    static now() { return new Date(2026, 6, 29, 12, 0, 0).getTime(); }
}
const context = {
    console,
    Date: FixedDate,
    Math,
    Object,
    Number,
    String,
    TANKS: {
        alpha: { name: '甲型坦克' },
        bravo: { name: '乙型坦克' },
        hidden: { name: '隐藏坦克', isHidden: true }
    },
    playerStats: { dailyTasks: null },
    selectedTank: null,
    isTankUnlocked: () => false,
    updateTankMastery: (tankType, updates) => awarded.push({ tankType, xp: updates.xp }),
    saveStats: () => { saveCount++; },
    showNotification: () => {}
};
vm.createContext(context);
vm.runInContext(source, context);

const dayOne = context.ensureDailyTaskState('2026-07-29');
assert.strictEqual(dayOne.dateKey, '2026-07-29', 'daily state should use the requested local date');
assert.notStrictEqual(dayOne.featuredTankType, 'hidden', 'locked hidden tanks should not be featured');
assert.strictEqual(context.getDailyTaskCards(dayOne).length, 4, 'four daily tasks should be shown');

assert(context.claimDailySignIn('alpha'), 'first sign-in should be claimable');
assert(!context.claimDailySignIn('alpha'), 'sign-in must not be claimable twice on the same day');
assert.deepStrictEqual(awarded[0], { tankType: 'alpha', xp: 50 }, 'sign-in should grant 50 XP to the selected tank');

const featured = dayOne.featuredTankType;
context.recordDailyTaskKill(featured);
context.recordDailyTaskKill(featured);
assert.strictEqual(dayOne.tasks.featuredKills.progress, 2, 'featured kill progress should be stored');
context.recordDailyTaskKill(featured);
assert.strictEqual(dayOne.tasks.featuredKills.rewarded, true, 'third featured kill should complete the task');
assert(awarded.some(entry => entry.tankType === featured && entry.xp === 150),
    'featured kill task should grant 150 XP');

context.recordDailyTaskMatchResult('bravo', { victory: true, survivalSeconds: 125 });
assert.strictEqual(dayOne.tasks.victory.rewarded, true, 'victory task should auto-complete');
assert.strictEqual(dayOne.tasks.survival.rewarded, true, '120-second survival task should auto-complete');
assert(awarded.some(entry => entry.tankType === 'bravo' && entry.xp === 150), 'victory should reward the used tank');
assert(awarded.some(entry => entry.tankType === 'bravo' && entry.xp === 120), 'survival should reward the used tank');
assert.strictEqual(context.getDailyTaskCompletionCount(dayOne), 4, 'all four tasks should count as completed');

const awardCount = awarded.length;
context.recordDailyTaskKill(featured);
context.recordDailyTaskMatchResult('bravo', { victory: true, survivalSeconds: 300 });
assert.strictEqual(awarded.length, awardCount, 'completed tasks must never reward twice');

const dayTwo = context.ensureDailyTaskState('2026-07-30');
assert.strictEqual(dayTwo.signIn.claimed, false, 'sign-in should reset on a new local day');
assert.strictEqual(dayTwo.tasks.featuredKills.progress, 0, 'combat task progress should reset on a new day');
assert(saveCount > 0, 'daily state changes should be persisted');

const html = fs.readFileSync('index.html', 'utf8');
const achievements = fs.readFileSync('Achievement.js', 'utf8');
const ui = fs.readFileSync('UI.js', 'utf8');
assert(html.includes('id="btnDailyTasks"') && html.includes('id="dailyTasksPanel"'), 'daily task menu and panel should exist');
assert(html.includes('DailyTasks.js?v=daily-tasks-22'), 'daily task script should use a fresh cache key');
assert(achievements.includes('recordDailyTaskKill(tank.tankType)'), 'player kills should update daily progress');
assert(achievements.includes('recordDailyTaskMatchResult(selectedTank'), 'settled matches should update daily progress');
assert(ui.includes('initializeDailyTasks'), 'daily task state should initialize after stats load');

console.log('Daily task smoke test passed.');
