const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

class FakeElement {
    constructor() { this.children = []; this.style = { setProperty() {} }; this.innerHTML = ''; this.textContent = ''; }
    replaceChildren() { this.children = []; }
    appendChild(child) { this.children.push(child); }
}

const elements = { teamScoreDisplay: new FakeElement(), battleFeed: new FakeElement() };
const sandbox = {
    console,
    Date,
    Map,
    TANKS: {
        zuoyan29: { name: '左研29' },
        duoduo: { name: '多多号步战车' },
        niuniu: { name: '牛牛直升机' }
    },
    document: {
        getElementById(id) { return elements[id] || null; },
        createElement() { return new FakeElement(); }
    }
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('Replay.js', 'utf8'), sandbox, { filename: 'Replay.js' });
vm.runInContext(fs.readFileSync('Score.js', 'utf8'), sandbox, { filename: 'Score.js' });

vm.runInContext(`
    resetTeamScores();
    awardKillScore({ team:'blue', tankType:'zuoyan29' }, { team:'red', tankType:'duoduo', isFlying:false });
    awardKillScore({ team:'red', tankType:'niuniu' }, { team:'blue', tankType:'niuniu', isFlying:true });
    awardOutpostScore('blue', 'B');
    awardFlagScore('red', { tankType:'duoduo' });
    awardBaseScore('blue');
`, sandbox);

const result = vm.runInContext(`({
    scores: { ...teamScores },
    winner: getWinningScoreTeam(),
    feed: battleFeed.map(entry => entry.text)
})`, sandbox);

assert.deepStrictEqual(JSON.parse(JSON.stringify(result.scores)), { blue: 10000750, red: 1300 });
assert.strictEqual(result.winner, 'blue');
assert.strictEqual(result.feed.length, 5);
assert.ok(result.feed.some(line => line.includes('蓝方左研29 击杀 红方 多多号步战车，+250分！')));
assert.ok(result.feed.some(line => line.includes('蓝方占领B点，+500分！')));
assert.ok(result.feed.some(line => line.includes('+10,000,000分！')));
assert.ok(elements.teamScoreDisplay.innerHTML.includes('蓝 10,000,750分'));
assert.strictEqual(elements.battleFeed.children.length, 4);

vm.runInContext(`teamScores = { blue: 100, red: 100 }`, sandbox);
assert.strictEqual(vm.runInContext('getWinningScoreTeam()', sandbox), 'draw');

console.log('Score smoke test passed.');
