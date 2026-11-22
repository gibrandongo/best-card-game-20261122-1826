// audio.js — every sound is synthesized with WebAudio. No audio files, no network.

let audioContext = null;
let muted = false;

/** True when the player has muted the game. */
export function isMuted() {
  return muted;
}

/** Flip the mute state. Returns the new state. */
export function toggleMute() {
  muted = !muted;
  return muted;
}

function ensureContext() {
  if (audioContext === null) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
  }
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

/** One short tone: frequency in Hz, seconds long, 'sine'|'triangle'|'square', 0..1 loud. */
function tone(freq, seconds, type, loud) {
  if (muted) return;
  const ctx = ensureContext();
  if (ctx === null) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(loud || 0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + seconds);
}

/** A card sliding onto the table. */
export function playDealSound() {
  tone(620, 0.09, 'triangle', 0.1);
  window.setTimeout(() => tone(440, 0.08, 'triangle', 0.08), 70);
}

/** A card flipping face up. */
export function playFlipSound() {
  tone(880, 0.06, 'square', 0.05);
}

/** A trick won: a bright two-note rise. */
export function playWinTrickSound() {
  tone(523, 0.12, 'triangle', 0.12);
  window.setTimeout(() => tone(784, 0.18, 'triangle', 0.12), 110);
}

/** A trick lost: a low two-note fall. */
export function playLoseTrickSound() {
  tone(330, 0.14, 'triangle', 0.12);
  window.setTimeout(() => tone(220, 0.2, 'triangle', 0.12), 120);
}

/** The match is won: a little fanfare. */
export function playVictorySound() {
  [523, 659, 784, 1047].forEach((freq, i) => {
    window.setTimeout(() => tone(freq, 0.28, 'triangle', 0.14), i * 140);
  });
}

/** The match is lost: a low descent. */
export function playDefeatSound() {
  [392, 330, 262, 196].forEach((freq, i) => {
    window.setTimeout(() => tone(freq, 0.3, 'sine', 0.12), i * 160);
  });
}

/** A soft click for selecting a card. */
export function playClickSound() {
  tone(700, 0.05, 'square', 0.05);
}
