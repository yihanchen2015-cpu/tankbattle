// ==================== 分层 WebAudio 战场音效 ====================
let gameAudioContext = null;
let gameNoiseBuffer = null;
let engineAudio = null;
const gameSoundThrottle = new Map();
let screenShakeState = { strength: 0, duration: 0, remaining: 0 };

function ensureGameAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if(!AudioContextClass) return null;
    if(!gameAudioContext) gameAudioContext = new AudioContextClass();
    if(gameAudioContext.state === 'suspended') gameAudioContext.resume().catch(() => {});
    return gameAudioContext;
}

function getGameNoiseBuffer(ctx) {
    if(gameNoiseBuffer) return gameNoiseBuffer;
    const length = Math.floor(ctx.sampleRate * 0.8);
    gameNoiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const channel = gameNoiseBuffer.getChannelData(0);
    let previous = 0;
    for(let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        previous = previous * 0.86 + white * 0.14;
        channel[i] = previous;
    }
    return gameNoiseBuffer;
}

function connectSpatialNode(ctx, input, pan) {
    if(typeof ctx.createStereoPanner !== 'function') { input.connect(ctx.destination); return; }
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    input.connect(panner).connect(ctx.destination);
}

function playToneLayer(ctx, options) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const start = ctx.currentTime + (options.delay || 0);
    const end = start + options.duration;
    oscillator.type = options.wave || 'sine';
    oscillator.frequency.setValueAtTime(Math.max(20, options.from), start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, options.to), end);
    filter.type = options.filterType || 'lowpass';
    filter.frequency.value = options.filter || 1800;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, options.volume), start + Math.min(0.012, options.duration * 0.15));
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(filter).connect(gain);
    connectSpatialNode(ctx, gain, options.pan || 0);
    oscillator.start(start); oscillator.stop(end + 0.02);
}

function playNoiseLayer(ctx, options) {
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const start = ctx.currentTime + (options.delay || 0);
    source.buffer = getGameNoiseBuffer(ctx);
    filter.type = options.filterType || 'lowpass';
    filter.frequency.value = options.filter || 700;
    filter.Q.value = options.q || 0.8;
    gain.gain.setValueAtTime(Math.max(0.0002, options.volume), start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + options.duration);
    source.connect(filter).connect(gain);
    connectSpatialNode(ctx, gain, options.pan || 0);
    source.start(start, 0, Math.min(options.duration, gameNoiseBuffer.duration));
}

function triggerScreenShake(strength, duration) {
    screenShakeState.strength = Math.max(screenShakeState.strength, strength);
    screenShakeState.duration = Math.max(screenShakeState.duration, duration);
    screenShakeState.remaining = Math.max(screenShakeState.remaining, duration);
}

function updateScreenShake(dt) {
    screenShakeState.remaining = Math.max(0, screenShakeState.remaining - dt);
    if(screenShakeState.remaining <= 0) screenShakeState.strength = 0;
}

function getScreenShakeOffset(multiplier = 1) {
    if(screenShakeState.remaining <= 0 || screenShakeState.duration <= 0) return { x: 0, y: 0 };
    const fade = screenShakeState.remaining / screenShakeState.duration;
    const strength = screenShakeState.strength * fade * multiplier;
    return { x: (Math.random() - 0.5) * strength * 2, y: (Math.random() - 0.5) * strength * 2 };
}

function playWorldSound(type, x, y, strength = 1) {
    const ctx = ensureGameAudio();
    if(!ctx) return;
    const nowMs = performance.now();
    const limits = { mg: 38, hit: 45, shell: 90, bomb: 120, aa: 90, kill: 180, death: 180, ammoRack: 220, repair: 180, heliWarning: 2200, capture: 500 };
    if(nowMs - (gameSoundThrottle.get(type) || 0) < (limits[type] || 70)) return;
    gameSoundThrottle.set(type, nowMs);

    let attenuation = 1, pan = 0;
    if(typeof player !== 'undefined' && player && Number.isFinite(x) && Number.isFinite(y)) {
        const distance = Math.hypot(x - player.x, y - player.y);
        attenuation = Math.max(0, 1 - distance / 2200);
        pan = Math.max(-0.88, Math.min(0.88, (x - player.x) / 1000));
    }
    const volume = attenuation * strength;
    if(volume < 0.012) return;

    if(type === 'shell') {
        playToneLayer(ctx, { from: 82, to: 36, duration: .30, wave: 'sine', volume: .22 * volume, filter: 500, pan });
        playToneLayer(ctx, { from: 52, to: 29, duration: .42, wave: 'triangle', volume: .12 * volume, filter: 260, pan, delay: .012 });
        playNoiseLayer(ctx, { duration: .13, volume: .09 * volume, filter: 520, pan });
        if(attenuation > .55) triggerScreenShake(3.5 * strength, .13);
    } else if(type === 'bomb') {
        playToneLayer(ctx, { from: 360, to: 95, duration: .34, wave: 'triangle', volume: .08 * volume, filter: 1200, pan });
        playNoiseLayer(ctx, { duration: .09, volume: .04 * volume, filter: 800, pan });
    } else if(type === 'mg') {
        playToneLayer(ctx, { from: 520, to: 170, duration: .045, wave: 'square', volume: .055 * volume, filter: 1400, pan });
        playNoiseLayer(ctx, { duration: .032, volume: .026 * volume, filter: 2200, filterType: 'highpass', pan });
    } else if(type === 'aa') {
        playToneLayer(ctx, { from: 1120, to: 310, duration: .19, wave: 'sine', volume: .10 * volume, filter: 2600, pan });
        playToneLayer(ctx, { from: 640, to: 210, duration: .15, wave: 'triangle', volume: .045 * volume, filter: 1700, pan, delay: .018 });
    } else if(type === 'hit') {
        playToneLayer(ctx, { from: 178, to: 76, duration: .22, wave: 'triangle', volume: .15 * volume, filter: 920, pan });
        playNoiseLayer(ctx, { duration: .10, volume: .08 * volume, filter: 1300, pan });
        if(attenuation > .45) triggerScreenShake(5.5 * strength, .16);
    } else if(type === 'kill' || type === 'death') {
        const boost = type === 'death' ? 1.2 : 1;
        playToneLayer(ctx, { from: 112, to: 34, duration: .58, wave: 'sine', volume: .28 * volume * boost, filter: 500, pan });
        playToneLayer(ctx, { from: 210, to: 62, duration: .34, wave: 'triangle', volume: .12 * volume * boost, filter: 1100, pan });
        playNoiseLayer(ctx, { duration: .28, volume: .15 * volume * boost, filter: 620, pan });
        triggerScreenShake((type === 'death' ? 11 : 8) * strength, .34);
    } else if(type === 'ammoRack') {
        playToneLayer(ctx, { from: 96, to: 24, duration: .82, wave: 'sine', volume: .38 * volume, filter: 460, pan });
        playToneLayer(ctx, { from: 245, to: 48, duration: .52, wave: 'sawtooth', volume: .16 * volume, filter: 900, pan });
        playNoiseLayer(ctx, { duration: .46, volume: .22 * volume, filter: 700, pan });
        triggerScreenShake(14 * strength, .48);
    } else if(type === 'repair') {
        playToneLayer(ctx, { from: 520, to: 760, duration: .12, wave: 'square', volume: .045 * volume, filter: 1800, pan });
        playToneLayer(ctx, { from: 680, to: 980, duration: .16, wave: 'sine', volume: .04 * volume, filter: 2200, pan, delay: .11 });
    } else if(type === 'capture') {
        playToneLayer(ctx, { from: 420, to: 880, duration: .42, wave: 'sine', volume: .09 * volume, filter: 1600, pan });
    } else if(type === 'heliWarning') {
        playToneLayer(ctx, { from: 920, to: 520, duration: .55, wave: 'square', volume: .075 * volume, filter: 1500, pan });
    }
}

function startEngineAudio() {
    const ctx = ensureGameAudio();
    if(!ctx || engineAudio) return;
    const master = ctx.createGain();
    const lowpass = ctx.createBiquadFilter();
    const low = ctx.createOscillator();
    const pulse = ctx.createOscillator();
    master.gain.value = 0.0001;
    lowpass.type = 'lowpass'; lowpass.frequency.value = 420; lowpass.Q.value = 1.2;
    low.type = 'sawtooth'; low.frequency.value = 42;
    pulse.type = 'square'; pulse.frequency.value = 63;
    const lowGain = ctx.createGain(), pulseGain = ctx.createGain();
    lowGain.gain.value = .65; pulseGain.gain.value = .18;
    low.connect(lowGain).connect(lowpass); pulse.connect(pulseGain).connect(lowpass);
    lowpass.connect(master).connect(ctx.destination);
    low.start(); pulse.start();
    engineAudio = { master, lowpass, low, pulse, lowGain, pulseGain };
}

function updateEngineAudio(tank) {
    if(!tank || tank.dead || gameState !== 'playing') { stopEngineAudio(); return; }
    startEngineAudio();
    if(!engineAudio || !gameAudioContext) return;
    const now = gameAudioContext.currentTime;
    const load = Math.max(0, Math.min(1, tank.engineLoad || 0));
    const damageRattle = tank.hp / tank.maxHp < .3 ? .18 : 0;
    engineAudio.master.gain.setTargetAtTime(.018 + load * .055 + damageRattle * .02, now, .08);
    engineAudio.low.frequency.setTargetAtTime(41 + load * 43, now, .06);
    engineAudio.pulse.frequency.setTargetAtTime(62 + load * 68 + damageRattle * 18, now, .05);
    engineAudio.lowpass.frequency.setTargetAtTime(330 + load * 650, now, .09);
}

function stopEngineAudio() {
    if(!engineAudio || !gameAudioContext) return;
    const nodes = engineAudio;
    const now = gameAudioContext.currentTime;
    nodes.master.gain.cancelScheduledValues(now);
    nodes.master.gain.setTargetAtTime(.0001, now, .035);
    nodes.low.stop(now + .18); nodes.pulse.stop(now + .18);
    engineAudio = null;
}

window.addEventListener('pointerdown', ensureGameAudio, { once: true });
window.addEventListener('keydown', ensureGameAudio, { once: true });
