// main.js — the bootstrap. One job: wire the match, the renderer, input and sound together.

import { createMatch, beginTurn, playPlayerCard, cycleSelectedCard, advanceToNextTurn } from './state.js';
import { renderTable, launchConfetti } from './render.js';
import { bindInput } from './input.js';
import {
  isMuted, toggleMute,
  playDealSound, playFlipSound, playWinTrickSound, playLoseTrickSound,
  playVictorySound, playDefeatSound, playClickSound,
} from './audio.js';
import { shotFromUrl, matchForShot } from './shots.js';

const REVEAL_MS = 1500;

let match = null;
let revealTimer = null;

function paint() {
  renderTable(match);
  document.getElementById('muteBtn').textContent = isMuted() ? 'SOUND OFF' : 'SOUND ON';
}

function startMatch(seed) {
  window.clearTimeout(revealTimer);
  match = createMatch(seed);
  match.screen = 'playing';
  beginTurn(match);
  paint();
  playDealSound();
}

function endMatchIfOver() {
  if (match.screen === 'win') {
    launchConfetti();
    playVictorySound();
  } else if (match.screen === 'loss') {
    playDefeatSound();
  }
}

function onCardClick(index) {
  if (!match || match.screen !== 'playing' || match.phase !== 'choose') return;
  if (index < 0 || index >= match.playerHand.length) return;
  // A second click on the selected card plays it at once.
  if (match.selectedIndex === index) {
    playSelectedCard();
    return;
  }
  match.selectedIndex = index;
  playClickSound();
  paint();
}

function playSelectedCard() {
  if (!match || match.phase !== 'choose') return;
  const index = match.selectedIndex;
  if (index < 0) return;
  const result = playPlayerCard(match, index);
  if (!result) return;
  playFlipSound();
  paint();
  if (result.winner === 'player') playWinTrickSound();
  else if (result.winner === 'opponent') playLoseTrickSound();
  if (match.phase === 'over') {
    endMatchIfOver();
    paint();
    return;
  }
  revealTimer = window.setTimeout(() => {
    advanceToNextTurn(match);
    paint();
  }, REVEAL_MS);
}

function onConfirm() {
  if (!match) return;
  if (match.screen === 'title') {
    startMatch();
    return;
  }
  if (match.screen === 'win' || match.screen === 'loss') {
    startMatch();
    return;
  }
  playSelectedCard();
}

function onCycle() {
  if (!match || match.screen !== 'playing' || match.phase !== 'choose') return;
  if (cycleSelectedCard(match)) {
    playDealSound();
    paint();
  }
}

function onMute() {
  toggleMute();
  paint();
}

function boot() {
  const shot = shotFromUrl();
  const shotMatch = shot === null ? null : matchForShot(shot);
  if (shotMatch !== null) {
    match = shotMatch;
    if (shot === 'title') {
      match.screen = 'title';
    } else if (shot === 'table') {
      match.screen = 'playing';
    } else if (shot === 'win') {
      launchConfetti();
    }
    paint();
  } else {
    match = createMatch();
    match.screen = 'title';
    paint();
  }

  bindInput({
    onCardClick,
    onConfirm,
    onCycle,
    onMute,
    onStart: () => startMatch(),
    onRestart: () => startMatch(),
  });
}

document.addEventListener('DOMContentLoaded', boot);
