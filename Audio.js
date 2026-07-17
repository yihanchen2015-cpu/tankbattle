// ==================== WebAudio 战场音效 ====================
let gameAudioContext = null;
const gameSoundThrottle = new Map();

function ensureGameAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if(!AudioContextClass) return null;
    if(!gameAudioContext) gameAudioContext = new AudioContextClass();
    if(gameAudioContext.state === 'suspended') gameAudioContext.resume().catch(() => {});
    return gameAudioContext;
}

function playWorldSound(type, x, y, strength = 1) {
    const ctx = ensureGameAudio();
    if(!ctx) return;
    const nowMs = performance.now();
    const limits = { mg: 45, hit: 55, heliWarning: 2200, capture: 500 };
    const throttle = limits[type] || 80;
    if(nowMs - (gameSoundThrottle.get(type) || 0) < throttle) return;
    gameSoundThrottle.set(type, nowMs);

    let attenuation = 1;
    let pan = 0;
    if(player && Number.isFinite(x) && Number.isFinite(y)) {
        const distance = Math.hypot(x - player.x, y - player.y);
        attenuation = Math.max(0, 1 - distance / 1900);
        pan = Math.max(-0.85, Math.min(0.85, (x - player.x) / 1000));
    }
    const volume = Math.max(0.0001, attenuation * strength);
    if(volume < 0.015) return;

    const settings = {
        shell: [92, 42, 0.24, 'sawtooth', 0.16],
        mg: [420, 150, 0.055, 'square', 0.045],
        aa: [760, 240, 0.20, 'sawtooth', 0.085],
        hit: [145, 65, 0.12, 'square', 0.075],
        capture: [420, 880, 0.42, 'sine', 0.09],
        heliWarning: [920, 520, 0.55, 'square', 0.075]
    }[type] || [220, 100, 0.1, 'sine', 0.05];

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : null;
    const start = ctx.currentTime;
    const end = start + settings[2];
    oscillator.type = settings[3];
    oscillator.frequency.setValueAtTime(settings[0], start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, settings[1]), end);
    gain.gain.setValueAtTime(settings[4] * volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    if(panner) {
        panner.pan.setValueAtTime(pan, start);
        oscillator.connect(gain).connect(panner).connect(ctx.destination);
    } else oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(end);
}

window.addEventListener('pointerdown', ensureGameAudio, { once: true });
window.addEventListener('keydown', ensureGameAudio, { once: true });
