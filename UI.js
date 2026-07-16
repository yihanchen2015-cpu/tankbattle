// ==================== 初始化 ====================
function tutorialPrev() {
    if(tutorialStep > 0) {
        tutorialStep--;
        updateTutorialDisplay();
    }
}

function tutorialNext() {
    if(tutorialStep < totalTutorialSteps - 1) {
        tutorialStep++;
        updateTutorialDisplay();
    } else {
        document.getElementById('tutorialOverlay').classList.remove('active');
    }
}

function startTutorial() {
    console.log('[BUTTON] 点击: 新手教程');
    closeInfoPanels('tutorialOverlay');
    tutorialStep = 0;
    tutorialCompleted = [true, false, false, false, true, true, true];
    document.getElementById('tutorialOverlay').classList.add('active');
    updateTutorialDisplay();
}

function showAchievementPanel() {
    console.log('[BUTTON] 点击: 成就系统');
    closeInfoPanels('achievementPanel');
    const panel = document.getElementById('achievementPanel');
    renderAchievementPanel();
    panel.style.display = 'block';
}

function showIntroPanel() {
    closeInfoPanels('introModal');
    document.getElementById('introModal').classList.add('active');
}

function closeInfoPanels(exceptId = '') {
    const intro = document.getElementById('introModal');
    const tutorial = document.getElementById('tutorialOverlay');
    const achievements = document.getElementById('achievementPanel');
    if(intro && exceptId !== 'introModal') intro.classList.remove('active');
    if(tutorial && exceptId !== 'tutorialOverlay') tutorial.classList.remove('active');
    if(achievements && exceptId !== 'achievementPanel') achievements.style.display = 'none';
}

function init() {
    console.log('[INIT] 游戏初始化开始');
    loadStats();
    checkHiddenTankUnlocks();
    setupAchievementPanel();
    console.log('[INIT] 游戏初始化完成');
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d', { alpha: false });
    minimapCanvas = document.getElementById('minimap');
    minimapCtx = minimapCanvas.getContext('2d', { alpha: false });
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    setupStartScreen();
    setupMenu();
    setupControls();
    setupIntroModal();
    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    minimapCanvas.width = 200;
    minimapCanvas.height = 140;
}


// ==================== 开始页面 ====================
function setupStartScreen() {
    setupTutorial();
}


// ==================== 新手教程系统 ====================
let tutorialStep = 0;
const totalTutorialSteps = 7;
let tutorialInitialized = false;
let tutorialPractice = null;
let tutorialAnimationFrame = 0;
let tutorialCompleted = [true, false, false, false, true, true, true];

function setupTutorial() {
    if(tutorialInitialized) return;
    tutorialInitialized = true;
    window.addEventListener('keydown', (event) => {
        if(event.code === 'KeyF' && !event.repeat && tutorialPractice) fireTutorialShot();
    });
}

function updateTutorialDisplay() {
    document.querySelectorAll('.tutorial-step').forEach((step, idx) => {
        step.classList.toggle('active', idx === tutorialStep);
    });
    const prevBtn = document.getElementById('btnTutorialPrev');
    const nextBtn = document.getElementById('btnTutorialNext');
    prevBtn.style.visibility = tutorialStep === 0 ? 'hidden' : 'visible';
    prevBtn.disabled = tutorialStep === 0;
    nextBtn.textContent = tutorialStep === totalTutorialSteps - 1 ? '完成 ✓' : '下一步';
    nextBtn.disabled = !tutorialCompleted[tutorialStep];
    document.getElementById('tutorialStepNum').textContent = `${tutorialStep + 1} / ${totalTutorialSteps}`;
    
    const progressContainer = document.getElementById('tutorialProgress');
    progressContainer.innerHTML = '';
    for(let i = 0; i < totalTutorialSteps; i++) {
        const dot = document.createElement('div');
        dot.className = 'tutorial-progress-dot' + (i === tutorialStep ? ' active' : '');
        progressContainer.appendChild(dot);
    }
    stopTutorialPractice();
    if(tutorialStep >= 1 && tutorialStep <= 3) startTutorialPractice(tutorialStep);
}

function closeTutorial() {
    stopTutorialPractice();
    document.getElementById('tutorialOverlay').classList.remove('active');
}

function stopTutorialPractice() {
    if(tutorialAnimationFrame) cancelAnimationFrame(tutorialAnimationFrame);
    tutorialAnimationFrame = 0;
    tutorialPractice = null;
}

function completeTutorialPractice(message) {
    if(!tutorialPractice) return;
    tutorialCompleted[tutorialStep] = true;
    tutorialPractice.complete = true;
    tutorialPractice.status.textContent = '✅ ' + message;
    document.getElementById('btnTutorialNext').disabled = false;
}

function startTutorialPractice(step) {
    const config = step === 1
        ? { canvas: 'tutorialMoveCanvas', status: 'moveStatus', overlay: 'moveOverlay' }
        : step === 2
            ? { canvas: 'tutorialAimCanvas', status: 'aimStatus', overlay: 'aimOverlay' }
            : { canvas: 'tutorialComboCanvas', status: 'comboStatus', overlay: 'comboOverlay' };
    const practiceCanvas = document.getElementById(config.canvas);
    const status = document.getElementById(config.status);
    const overlay = document.getElementById(config.overlay);
    if(overlay) overlay.style.display = 'none';
    const pctx = practiceCanvas.getContext('2d');
    tutorialPractice = {
        step, canvas: practiceCanvas, ctx: pctx, status, complete: false,
        x: 70, y: 150, aimX: 500, aimY: 150, lastTime: performance.now(), cooldown: 0,
        hits: 0,
        targets: step === 2 ? [
            {x: 420, y: 70, r: 18, alive: true},
            {x: 520, y: 150, r: 18, alive: true},
            {x: 410, y: 235, r: 18, alive: true}
        ] : [{x: 480, y: 80, r: 17, vx: 85, vy: 55, alive: true}]
    };
    status.textContent = step === 1 ? '🎮 驾驶到右侧绿色目标点' : (step === 2 ? '🎯 已击毁 0 / 3' : '⚔️ 已击毁 0 / 5');
    practiceCanvas.onmousemove = event => {
        if(!tutorialPractice) return;
        const rect = practiceCanvas.getBoundingClientRect();
        tutorialPractice.aimX = (event.clientX - rect.left) * practiceCanvas.width / rect.width;
        tutorialPractice.aimY = (event.clientY - rect.top) * practiceCanvas.height / rect.height;
    };
    tutorialAnimationFrame = requestAnimationFrame(updateTutorialPractice);
}

function updateTutorialPractice(timestamp) {
    const state = tutorialPractice;
    if(!state) return;
    const dt = Math.min(0.05, (timestamp - state.lastTime) / 1000);
    state.lastTime = timestamp;
    state.cooldown = Math.max(0, state.cooldown - dt);
    let dx = 0, dy = 0;
    if(keys.KeyW || keys.ArrowUp) dy--;
    if(keys.KeyS || keys.ArrowDown) dy++;
    if(keys.KeyA || keys.ArrowLeft) dx--;
    if(keys.KeyD || keys.ArrowRight) dx++;
    if(dx || dy) {
        const length = Math.hypot(dx, dy) || 1;
        state.x = Math.max(20, Math.min(state.canvas.width - 20, state.x + dx / length * 150 * dt));
        state.y = Math.max(20, Math.min(state.canvas.height - 20, state.y + dy / length * 150 * dt));
    }
    if(state.step === 1 && Math.hypot(state.x - 525, state.y - 150) < 34 && !state.complete) {
        completeTutorialPractice('移动练习完成');
    }
    if(state.step === 3 && !state.complete) {
        const target = state.targets[0];
        target.x += target.vx * dt; target.y += target.vy * dt;
        if(target.x < 260 || target.x > 565) target.vx *= -1;
        if(target.y < 35 || target.y > 265) target.vy *= -1;
    }
    drawTutorialPractice(state);
    if(tutorialPractice) tutorialAnimationFrame = requestAnimationFrame(updateTutorialPractice);
}

function drawTutorialPractice(state) {
    const pctx = state.ctx;
    pctx.fillStyle = '#101827'; pctx.fillRect(0, 0, state.canvas.width, state.canvas.height);
    pctx.strokeStyle = 'rgba(255,255,255,.08)';
    for(let x = 0; x < state.canvas.width; x += 40) { pctx.beginPath(); pctx.moveTo(x, 0); pctx.lineTo(x, state.canvas.height); pctx.stroke(); }
    for(let y = 0; y < state.canvas.height; y += 40) { pctx.beginPath(); pctx.moveTo(0, y); pctx.lineTo(state.canvas.width, y); pctx.stroke(); }
    if(state.step === 1) {
        pctx.fillStyle = '#00ff88'; pctx.beginPath(); pctx.arc(525, 150, 28, 0, Math.PI * 2); pctx.fill();
    } else {
        state.targets.forEach(target => {
            if(!target.alive) return;
            pctx.fillStyle = '#ff4455'; pctx.beginPath(); pctx.arc(target.x, target.y, target.r, 0, Math.PI * 2); pctx.fill();
            pctx.strokeStyle = '#fff'; pctx.beginPath(); pctx.moveTo(target.x - 8, target.y); pctx.lineTo(target.x + 8, target.y); pctx.moveTo(target.x, target.y - 8); pctx.lineTo(target.x, target.y + 8); pctx.stroke();
        });
    }
    const angle = Math.atan2(state.aimY - state.y, state.aimX - state.x);
    pctx.save(); pctx.translate(state.x, state.y); pctx.rotate(angle);
    pctx.fillStyle = '#4488ff'; pctx.fillRect(-18, -13, 36, 26);
    pctx.fillStyle = '#88ccff'; pctx.fillRect(0, -4, 30, 8); pctx.restore();
    pctx.strokeStyle = 'rgba(255,255,255,.35)'; pctx.beginPath(); pctx.arc(state.aimX, state.aimY, 8, 0, Math.PI * 2); pctx.stroke();
}

function fireTutorialShot() {
    const state = tutorialPractice;
    if(!state || state.step === 1 || state.complete || state.cooldown > 0) return;
    state.cooldown = 0.2;
    const angle = Math.atan2(state.aimY - state.y, state.aimX - state.x);
    let best = null, bestDistance = Infinity;
    state.targets.forEach(target => {
        if(!target.alive) return;
        const along = (target.x - state.x) * Math.cos(angle) + (target.y - state.y) * Math.sin(angle);
        if(along < 0) return;
        const perpendicular = Math.abs((target.x - state.x) * Math.sin(angle) - (target.y - state.y) * Math.cos(angle));
        if(perpendicular <= target.r + 6 && along < bestDistance) { best = target; bestDistance = along; }
    });
    if(!best) return;
    best.alive = false;
    state.hits++;
    const goal = state.step === 2 ? 3 : 5;
    state.status.textContent = (state.step === 2 ? '🎯' : '⚔️') + ` 已击毁 ${state.hits} / ${goal}`;
    if(state.hits >= goal) {
        completeTutorialPractice(state.step === 2 ? '瞄准练习完成' : '综合演练完成');
    } else if(state.step === 3) {
        const target = state.targets[0];
        target.x = 300 + Math.random() * 240; target.y = 45 + Math.random() * 210;
        target.vx = (Math.random() > 0.5 ? 1 : -1) * (70 + Math.random() * 50);
        target.vy = (Math.random() > 0.5 ? 1 : -1) * (40 + Math.random() * 45);
        target.alive = true;
    }
}

function selectMode(mode) {
    console.log('[SELECT_MODE] 选择模式:', mode);

    // PvP联机和好友聚会显示暂未开放
    if(mode === 'pvp') {
        alert('🌐 PvP联机功能暂未开放\n\n在线匹配系统正在开发中，敬请期待！');
        return;
    } else if(mode === 'party') {
        alert('🎉 好友聚会功能暂未开放\n\nWebRTC私密房间功能正在开发中，敬请期待！');
        return;
    }

    closeTutorial();
    closeInfoPanels();
    gameMode = mode;
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
    document.getElementById('menu').classList.add('active');
    gameState = 'menu';
    const badge = document.getElementById('modeBadge');
    const subtitle = document.getElementById('menuSubtitle');
    const dayNightRow = document.getElementById('dayNightRow');
    if(mode === 'classic') {
        badge.className = 'mode-badge classic';
        badge.textContent = '🏛 经典模式';
        subtitle.textContent = '据点争夺战 | 9000×9000 超大地图';
        dayNightRow.style.display = 'flex';
    } else if(mode === 'defense') {
        badge.className = 'mode-badge defense';
        badge.textContent = '🛡 守点模式';
        subtitle.textContent = '孤军死守 | 弹药×3 | 撑过3分钟';
        dayNightRow.style.display = 'none';
    } else if(mode === 'sneak') {
        badge.className = 'mode-badge sneak';
        badge.textContent = '🌙 绝地偷袭';
        subtitle.textContent = '黑夜奇袭 | 10v30 | 摧毁敌方基地';
        dayNightRow.style.display = 'none';
    } else if(mode === 'ctf') {
        badge.className = 'mode-badge ctf';
        badge.textContent = '🏴 夺旗模式';
        subtitle.textContent = '夺取敌旗并送回基地 | 率先获得3分';
        dayNightRow.style.display = 'none';
    } else if(mode === 'infection') {
        badge.className = 'mode-badge infection';
        badge.textContent = '🧟 感染模式';
        subtitle.textContent = '幸存者对抗感染者 | 接触传播';
        dayNightRow.style.display = 'none';
    } else if(mode === 'storm') {
        badge.className = 'mode-badge storm';
        badge.textContent = '🌪 风暴模式';
        subtitle.textContent = '安全区持续缩小 | 活到最后';
        dayNightRow.style.display = 'none';
    }
}

function setupIntroModal() {
    if(introModalInitialized) return;
    introModalInitialized = true;

    document.getElementById('btnCloseIntro').addEventListener('click', () => {
        document.getElementById('introModal').classList.remove('active');
    });
    document.getElementById('introModal').addEventListener('click', (e) => {
        if(e.target.id === 'introModal') document.getElementById('introModal').classList.remove('active');
    });
}


// ==================== 菜单系统 ====================
let currentTankFilter = 'all';

function filterTanks(series, btn) {
    console.log('[BUTTON] 点击: 系列筛选', series);
    currentTankFilter = series;
    document.querySelectorAll('.series-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    renderTankList();
}

function renderTankList() {
    console.log('[RENDER_TANKS] 渲染坦克列表, 筛选:', currentTankFilter);
    const tankList = document.getElementById('tankList');
    if(!tankList) {
        console.log('[RENDER_TANKS] 错误: tankList 不存在');
        return;
    }
    tankList.innerHTML = '';

    Object.entries(TANKS).forEach(([key, tank]) => {
        // 跳过未解锁的隐藏坦克
        if (tank.isHidden && !isTankUnlocked(key)) return;

        // 根据系列筛选
        let series = '';
        if(key.startsWith('zuoyan')) series = 'zuoyan';
        else if(key.startsWith('xingchen')) series = 'xingchen';
        else if(key.startsWith('duoduo')) series = 'duoduo';
        else if(key.startsWith('kimi')) series = 'kimi';

        if(currentTankFilter !== 'all' && series !== currentTankFilter) return;

        const card = document.createElement('div');
        card.className = 'tank-card';
        card.dataset.tank = key;
        card.onclick = function() { selectTank(key, this); };
        let seriesTag = '';
        if(key.startsWith('zuoyan')) seriesTag = '🔵 左研系';
        else if(key.startsWith('xingchen')) seriesTag = '🟢 星辰系';
        else if(key.startsWith('duoduo')) seriesTag = '🟠 多多系';
        else if(key.startsWith('kimi')) seriesTag = '🟣 AI系';
        card.innerHTML = `
            <div class="tank-preview" id="preview-${key}"></div>
            <h4>${tank.name}</h4>
            <div style="font-size:11px;color:#888;margin-bottom:4px;">${seriesTag} | ${tank.desc.split(' - ')[0]}</div>
            <div class="tank-stats">
                生命: <span>${tank.hp}</span> | 速度: <span>${tank.speed}</span><br>
                装甲: <span>${tank.armor}x</span> | 射速: <span>${(tank.fireRate*100).toFixed(0)}%</span><br>
                <span style="color:#ffd700">⚡ ${tank.ultimate.name}</span>
            </div>
        `;
        tankList.appendChild(card);
        setTimeout(() => drawTankPreview(key, tank), 50);
    });
}

function setupMenu() {
    console.log('[SETUP_MENU] 菜单设置开始');
    const tankList = document.getElementById('tankList');
    if(tankList) {
        console.log('[SETUP_MENU] 清空坦克列表');
        tankList.innerHTML = '';
    }

    // 初始化地图选择
    setupMapSelection();

    renderTankList();

    document.getElementById('ammoSlider').oninput = (e) => document.getElementById('ammoValue').textContent = e.target.value;
    document.getElementById('mgSlider').oninput = (e) => document.getElementById('mgValue').textContent = e.target.value;
    document.getElementById('aaSlider').oninput = (e) => document.getElementById('aaValue').textContent = e.target.value;
}

// 地图选择初始化
function setupMapSelection() {
    const mapSelect = document.getElementById('mapSelect');
    if(!mapSelect) return;

    mapSelect.innerHTML = '';
    const maps = [
        {key: 'classic', name: '🏛 经典战场', desc: '标准据点争夺战'},
        {key: 'desert', name: '🏜 沙漠风暴', desc: '大视野，随机沙尘暴'},
        {key: 'city', name: '🏙 城市巷战', desc: '街区路网与密集楼群'},
        {key: 'snow', name: '❄️ 雪地突袭', desc: '履带留痕，久停冻结'},
        {key: 'island', name: '🏝 海岛争夺', desc: '7座据点岛、桥网与树林'}
    ];

    maps.forEach(map => {
        const option = document.createElement('option');
        option.value = map.key;
        option.textContent = map.name + ' - ' + map.desc;
        if(map.key === currentMap) option.selected = true;
        mapSelect.appendChild(option);
    });

    mapSelect.onchange = (e) => {
        currentMap = e.target.value;
        const template = MAP_TEMPLATES[currentMap];
        showNotification('地图切换: ' + template.name + ' - ' + template.description, '#00ff88');
    };
}

function drawTankPreview(key, tank) {
    const preview = document.getElementById(`preview-${key}`);
    const c = document.createElement('canvas');
    c.width = 220; c.height = 90;
    const pctx = c.getContext('2d');
    pctx.translate(110, 45);
    if(tank.shape === 'helicopter') {
        drawHelicopterPreview(pctx, tank);
    } else {
        drawTankShape(pctx, tank, 0, 0, 0, 2.2);
    }
    preview.appendChild(c);
}

function drawHelicopterPreview(pctx, tank) {
    pctx.save();
    pctx.scale(2.2, 2.2);
    // 机身
    pctx.fillStyle = tank.color;
    pctx.beginPath();
    pctx.ellipse(0, 0, 10, 5, 0, 0, Math.PI*2);
    pctx.fill();
    // 驾驶舱
    pctx.fillStyle = tank.accent;
    pctx.beginPath();
    pctx.ellipse(4, -1, 4, 3, -0.2, 0, Math.PI*2);
    pctx.fill();
    // 尾翼
    pctx.fillStyle = tank.color;
    pctx.beginPath();
    pctx.moveTo(-8, 0);
    pctx.lineTo(-12, -3);
    pctx.lineTo(-12, 3);
    pctx.closePath();
    pctx.fill();
    // 螺旋桨
    pctx.strokeStyle = '#aaa';
    pctx.lineWidth = 1;
    pctx.beginPath();
    pctx.moveTo(-12, -5);
    pctx.lineTo(0, -5);
    pctx.stroke();
    pctx.beginPath();
    pctx.moveTo(-8, -5);
    pctx.lineTo(8, -5);
    pctx.stroke();
    pctx.restore();
}

function selectTank(key, card) {
    console.log('[SELECT_TANK] 选择坦克:', key);
    document.querySelectorAll('.tank-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedTank = key;
    const tank = TANKS[key];
    const ammoSlider = document.getElementById('ammoSlider');
    const mgSlider = document.getElementById('mgSlider');
    const aaSlider = document.getElementById('aaSlider');
    let ammoMult = 1;
    if(gameMode === 'defense') ammoMult = 3;
    ammoSlider.max = Math.floor(tank.maxShells * ammoMult);
    mgSlider.max = Math.floor(tank.maxMG * ammoMult);
    aaSlider.max = Math.floor((tank.maxAA || 15) * ammoMult);
    ammoSlider.value = Math.floor(tank.maxShells * 0.7 * ammoMult);
    mgSlider.value = Math.floor(tank.maxMG * 0.7 * ammoMult);
    aaSlider.value = Math.floor((tank.maxAA || 15) * 0.5 * ammoMult);
    document.getElementById('ammoValue').textContent = ammoSlider.value;
    document.getElementById('mgValue').textContent = mgSlider.value;
    document.getElementById('aaValue').textContent = aaSlider.value;
    document.getElementById('startBtn').disabled = false;
}


// ==================== 控制设置 ====================
function setupControls() {
    if(controlsInitialized) return;
    controlsInitialized = true;

    const keydownHandler = (e) => {
        keys[e.code] = true;
        if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
        if(e.code === 'KeyF') mouse.down = true;
        if(e.code === 'KeyT') switchWeapon();
        if(e.code === 'KeyG') activateUltimate();
        if(e.code === 'KeyY' && player) {
            toggleAutoAim(player);
        }
    };
    const keyupHandler = (e) => {
        keys[e.code] = false;
        if(e.code === 'KeyF') mouse.down = false;
    };
    window.addEventListener('keydown', keydownHandler);
    window.addEventListener('keyup', keyupHandler);

    
    const mousemoveHandler = (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        if (player) {
            player.lastManualAimTime = Date.now();
            player.autoAimActive = false;
        }
    };
    const mousedownHandler = () => mouse.down = true;
    const mouseupHandler = () => mouse.down = false;
    canvas.addEventListener('mousemove', mousemoveHandler);
    canvas.addEventListener('mousedown', mousedownHandler);
    canvas.addEventListener('mouseup', mouseupHandler);

    
    const joy = document.getElementById('joystick');
    const knob = document.getElementById('joystick-knob');
    let joyStart = null;
    
    const joyTouchStart = (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = joy.getBoundingClientRect();
        joyStart = { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
        joystick.active = true;
        updateJoystick(touch.clientX, touch.clientY);
    };
    const joyTouchMove = (e) => {
        e.preventDefault();
        if(joyStart) updateJoystick(e.touches[0].clientX, e.touches[0].clientY);
    };
    const joyTouchEnd = (e) => {
        e.preventDefault();
        joystick.active = false;
        joystick.dx = 0; joystick.dy = 0;
        knob.style.transform = 'translate(-50%, -50%)';
    };
    
    joy.addEventListener('touchstart', joyTouchStart, {passive: false});
    joy.addEventListener('touchmove', joyTouchMove, {passive: false});
    joy.addEventListener('touchend', joyTouchEnd, {passive: false});

    
    function updateJoystick(cx, cy) {
        const maxR = 38;
        let dx = cx - joyStart.x;
        let dy = cy - joyStart.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if(dist > maxR) { dx = dx/dist*maxR; dy = dy/dist*maxR; }
        knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        joystick.dx = dx / maxR;
        joystick.dy = dy / maxR;
    }
    
    const fireBtn = document.getElementById('fireBtn');
    const fireTouchStart = (e) => { e.preventDefault(); mouse.down = true; };
    const fireTouchEnd = (e) => { e.preventDefault(); mouse.down = false; };
    fireBtn.addEventListener('touchstart', fireTouchStart, {passive: false});
    fireBtn.addEventListener('touchend', fireTouchEnd, {passive: false});

    
    const pcFireBtn = document.getElementById('pcFireBtn');
    const pcFireDown = () => { mouse.down = true; pcFireBtn.classList.add('active'); };
    const pcFireUp = () => { mouse.down = false; pcFireBtn.classList.remove('active'); };
    const pcFireLeave = () => { mouse.down = false; pcFireBtn.classList.remove('active'); };
    pcFireBtn.addEventListener('mousedown', pcFireDown);
    pcFireBtn.addEventListener('mouseup', pcFireUp);
    pcFireBtn.addEventListener('mouseleave', pcFireLeave);

    
    const pcSwitchBtn = document.getElementById('pcSwitchBtn');
    const pcSwitchClick = () => switchWeapon();
    pcSwitchBtn.addEventListener('click', pcSwitchClick);

    
    const pcUltimateBtn = document.getElementById('pcUltimateBtn');
    const pcUltimateClick = () => activateUltimate();
    pcUltimateBtn.addEventListener('click', pcUltimateClick);

}


// ==================== 自动瞄准开关 ====================

function toggleAutoAim(tank) {
    if (!tank) return;
    if (tank.autoAimActive) {
        tank.autoAimActive = false;
        tank.autoAimTarget = null;
        tank.autoAimLockOn = false;
        showMessage('🎯 自动瞄准已关闭', '#ff4444');
    } else {
        tank.autoAimTimer = 0;
        tank.autoAimActive = true;
        showMessage('🎯 自动瞄准已开启', '#00ff88');
    }
}

function showMessage(text, color) {
    const msg = document.getElementById('message');
    if (!msg) return;
    const oldDisplay = msg.style.display;
    const oldHTML = msg.innerHTML;
    msg.textContent = text;
    msg.style.color = color;
    msg.style.display = 'block';
    msg.style.fontSize = '24px';
    msg.style.padding = '15px 30px';
    setTimeout(() => {
        msg.style.display = oldDisplay;
        msg.innerHTML = oldHTML;
    }, 1500);
}

function switchWeapon() {
    console.log('[WEAPON] Switching weapon, current:', currentWeapon);
    const weapons = ['shell', 'mg', 'aa'];
    const weaponNames = { shell: '主炮', mg: '机枪', aa: '高射炮' };
    const weaponColors = { shell: '#ff8800', mg: '#ffff00', aa: '#ff44ff' };

    const idx = weapons.indexOf(currentWeapon);
    currentWeapon = weapons[(idx + 1) % weapons.length];
    console.log('[WEAPON] Switched to:', currentWeapon);

    document.getElementById('currentWeapon').textContent = weaponNames[currentWeapon];
    const indicator = document.getElementById('weaponIndicator');
    indicator.textContent = `已切换: ${weaponNames[currentWeapon]}`;
    indicator.style.display = 'block';
    indicator.style.color = weaponColors[currentWeapon];
    setTimeout(() => { indicator.style.display = 'none'; }, 1500);
}
