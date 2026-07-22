const assert = require('assert');
const fs = require('fs');

const css = fs.readFileSync('style.css', 'utf8');
const baseMarker = css.indexOf('触控按钮的基础外观');
const phoneMedia = css.indexOf('@media', baseMarker);
const baseBlock = css.slice(baseMarker, phoneMedia > baseMarker ? phoneMedia : baseMarker + 6000);

assert(baseMarker >= 0, 'touch buttons should have a resolution-independent base style');
assert(baseBlock.includes('.mobile-btn {'), 'mobile button shape must be defined outside phone-only media queries');
assert(baseBlock.includes('border-radius: 50%'), 'touch action buttons should render as circles on large tablets');
assert(baseBlock.includes('.mobile-btn-weapon'), 'weapon button should have a dedicated rendered style');
assert(baseBlock.includes('.mobile-btn-ultimate'), 'ultimate button should have a dedicated rendered style');
assert(css.includes('html.touch-device #mobileActionButtons { display: flex !important; }'), 'touch capability should expose action buttons independently of screen resolution');

console.log('Touch control style smoke test passed.');
