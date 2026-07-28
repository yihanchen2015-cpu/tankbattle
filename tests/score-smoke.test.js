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
    },
    CONFIG: { outpostMinuteScoreBase: 200 },
    gameMode: 'classic',
    deathmatchData: { kills: { blue: 0, red: 0 }, targetKills: 50 }
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('Replay.js', 'utf8'), sandbox, { filename: 'Replay.js' });
vm.runInContext(fs.readFileSync('Score.js', 'utf8'), sandbox, { filename: 'Score.js' });

vm.runInContext(`
    resetTeamScores();
    blueContributor = { team:'blue', tankType:'zuoyan29' };
    redContributor = { team:'red', tankType:'niuniu' };
    awardKillScore(blueContributor, { team:'red', tankType:'duoduo', isFlying:false });
    awardKillScore(redContributor, { team:'blue', tankType:'niuniu', isFlying:true });
    awardOutpostScore('blue', 'B', blueContributor);
    awardOutpostMinuteScore('red', 'C', 3);
    awardBossLastHit('red', redContributor);
    awardBaseScore('blue', blueContributor);
`, sandbox);

const result = vm.runInContext(`({
    scores: { ...teamScores },
    personalScores: { blue:blueContributor.battleScore, red:redContributor.battleScore },
    winner: getWinningScoreTeam(),
    feed: battleFeed.map(entry => entry.text)
})`, sandbox);

assert.deepStrictEqual(JSON.parse(JSON.stringify(result.scores)), { blue: 10000750, red: 5900 });
assert.deepStrictEqual(JSON.parse(JSON.stringify(result.personalScores)), { blue: 10000750, red: 5300 });
assert.strictEqual(result.winner, 'blue');
assert.strictEqual(result.feed.length, 6);
assert.ok(result.feed.some(line => line.includes('蓝方左研29 击杀 红方 多多号步战车，+250分！')));
assert.ok(result.feed.some(line => line.includes('蓝方占领B点，+500分！')));
assert.ok(result.feed.some(line => line.includes('C点 Lv.3 每分钟产出，+600分！')));
assert.ok(result.feed.some(line => line.includes('首领最后一击，+5,000分！')));
assert.ok(result.feed.some(line => line.includes('+10,000,000分！')));
assert.ok(elements.teamScoreDisplay.innerHTML.includes('蓝 10,000,750分'));
assert.strictEqual(elements.battleFeed.children.length, 4);

vm.runInContext(`
    gameMode = 'deathmatch';
    deathmatchData = { kills:{blue:0,red:0}, targetKills:50 };
    teamScores = {blue:0,red:0};
    awardKillScore(blueContributor, {team:'red', tankType:'duoduo'});
`, sandbox);
assert.strictEqual(vm.runInContext('deathmatchData.kills.blue', sandbox), 1);
assert.strictEqual(vm.runInContext('teamScores.blue', sandbox), 0);
assert.ok(elements.teamScoreDisplay.innerHTML.includes('1/50击杀'));

vm.runInContext(`teamScores = { blue: 100, red: 100 }`, sandbox);
assert.strictEqual(vm.runInContext('getWinningScoreTeam()', sandbox), 'draw');

console.log('Score smoke test passed.');
