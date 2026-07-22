// ==================== 团队积分与战况公告 ====================
const SCORE_RULES = Object.freeze({ normalKill: 250, helicopterKill: 300, outpost: 500, flag: 1000, base: 10000000 });
let teamScores = { blue: 0, red: 0 };
let battleFeed = [];
let battleFeedCounter = 0;

function getScoreTeamName(team) { return team === 'blue' ? '蓝方' : '红方'; }
function getScoreTeamColor(team) { return team === 'blue' ? '#66b7ff' : '#ff7474'; }

function resetTeamScores() {
    teamScores = { blue: 0, red: 0 };
    battleFeed = [];
    battleFeedCounter = 0;
    updateScoreHUD();
    renderBattleFeed();
}

function addTeamScore(team, amount, message) {
    if(team !== 'blue' && team !== 'red') return;
    teamScores[team] = Math.max(0, (teamScores[team] || 0) + amount);
    updateScoreHUD();
    if(message) addBattleAnnouncement(team, `${message}，+${amount.toLocaleString('zh-CN')}分！`);
}

function addBattleAnnouncement(team, text) {
    battleFeed.unshift({ id: ++battleFeedCounter, team, text, createdAt: Date.now() });
    if(battleFeed.length > 6) battleFeed.length = 6;
    renderBattleFeed();
}

function renderBattleFeed() {
    const feed = document.getElementById('battleFeed');
    if(!feed) return;
    feed.replaceChildren();
    battleFeed.slice(0, 4).forEach((entry, index) => {
        const line = document.createElement('div');
        line.className = 'battle-feed-line';
        line.style.setProperty('--feed-color', getScoreTeamColor(entry.team));
        line.style.opacity = String(Math.max(0.38, 1 - index * 0.18));
        line.textContent = entry.text;
        feed.appendChild(line);
    });
}

function updateScoreHUD() {
    const score = document.getElementById('teamScoreDisplay');
    if(score) score.innerHTML = `<span class="score-blue">蓝 ${teamScores.blue.toLocaleString('zh-CN')}分</span><b>|</b><span class="score-red">红 ${teamScores.red.toLocaleString('zh-CN')}分</span>`;
}

function awardKillScore(killer, target) {
    if(!killer || !target || killer.team === target.team || (killer.team !== 'blue' && killer.team !== 'red')) return;
    const points = target.isFlying ? SCORE_RULES.helicopterKill : SCORE_RULES.normalKill;
    const killerName = getReplayTankName(killer);
    const targetName = getReplayTankName(target);
    addTeamScore(killer.team, points, `${getScoreTeamName(killer.team)}${killerName} 击杀 ${getScoreTeamName(target.team)} ${targetName}`);
}

function awardOutpostScore(team, outpostName) {
    addTeamScore(team, SCORE_RULES.outpost, `${getScoreTeamName(team)}占领${outpostName}点`);
}

function awardFlagScore(team, tank) {
    addTeamScore(team, SCORE_RULES.flag, `${getScoreTeamName(team)}${tank ? getReplayTankName(tank) : ''} 成功夺旗`);
}

function awardBaseScore(team) {
    addTeamScore(team, SCORE_RULES.base, `${getScoreTeamName(team)}摧毁敌方基地`);
}

function getWinningScoreTeam() {
    if(teamScores.blue === teamScores.red) return 'draw';
    return teamScores.blue > teamScores.red ? 'blue' : 'red';
}
