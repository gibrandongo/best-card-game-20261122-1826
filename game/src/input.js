// input.js — mouse and keyboard play. One job: turn presses and clicks into game actions.
//
// Keys: 1–5 select a hand card, Enter plays the selected card, D cycles the selected
// card for a fresh draw (once a turn), M mutes, R restarts from the end screen.

import { playClickSound } from './audio.js';

export function bindInput(hooks) {
  const hand = document.getElementById('playerHand');

  hand.addEventListener('click', (event) => {
    const cardEl = event.target.closest('.card');
    if (!cardEl || cardEl.dataset.handIndex === undefined) return;
    const index = Number(cardEl.dataset.handIndex);
    playClickSound();
    hooks.onCardClick(index);
  });

  document.getElementById('startBtn').addEventListener('click', () => hooks.onStart());
  document.getElementById('againBtn').addEventListener('click', () => hooks.onRestart());
  document.getElementById('muteBtn').addEventListener('click', () => hooks.onMute());

  document.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key;
    if (key >= '1' && key <= '5') {
      hooks.onCardClick(Number(key) - 1);
      return;
    }
    if (key === 'Enter') {
      hooks.onConfirm();
      return;
    }
    if (key === 'd' || key === 'D') {
      hooks.onCycle();
      return;
    }
    if (key === 'm' || key === 'M') {
      hooks.onMute();
      return;
    }
    if (key === 'r' || key === 'R') {
      hooks.onRestart();
    }
  });
}
