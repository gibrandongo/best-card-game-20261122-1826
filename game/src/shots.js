// shots.js — the screenshot hook. One job: set up a fixed, readable state for each shot.
//
// ?shot=title  the title screen over a fresh table
// ?shot=table  a mid-game table: both hands, a trick on the table, life and tricks visible
// ?shot=win    the victory screen with confetti
// ?shot=loss   the defeat screen
// No ?shot means a normal game: title screen, then play.

import { createMatch, demoTableMatch, demoWinMatch, demoLossMatch } from './state.js';

export function shotFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot === 'title' || shot === 'table' || shot === 'win' || shot === 'loss') return shot;
  return null;
}

/** Build the match for a shot name, or null for a normal game. */
export function matchForShot(shot) {
  if (shot === 'title') {
    const match = createMatch(20261122);
    match.screen = 'title';
    return match;
  }
  if (shot === 'table') return demoTableMatch();
  if (shot === 'win') return demoWinMatch();
  if (shot === 'loss') return demoLossMatch();
  return null;
}
