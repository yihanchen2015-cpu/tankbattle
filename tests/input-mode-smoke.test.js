const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const listeners = {};
const classes = new Set();
const sandbox = {
    console,
    navigator: { maxTouchPoints: 5, userAgent: 'Desktop-like tablet', platform: 'Linux' },
    window: {
        innerWidth: 3000,
        innerHeight: 2000,
        addEventListener(type, callback) { listeners[type] = callback; },
        matchMedia() { return { matches: false }; }
    },
    document: {
        documentElement: { classList: { toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); } } }
    },
    AbortController
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'Config.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'UI.js'), 'utf8'), sandbox);

assert.strictEqual(vm.runInContext('isTouchControlDevice()', sandbox), true, '3000×2000 平板仍应按触控设备处理');
vm.runInContext('updateInputDeviceMode()', sandbox);
assert(classes.has('touch-device'));

vm.runInContext('touchControlMode = false; navigator.maxTouchPoints = 0; installInputModeDetection()', sandbox);
listeners.pointerdown({ pointerType: 'touch' });
assert.strictEqual(vm.runInContext('touchControlMode', sandbox), true, '实际触摸应强制启用摇杆模式');
assert(classes.has('touch-device'));

console.log('Input mode smoke test passed:', { resolution: '3000x2000', touchClass: classes.has('touch-device') });
