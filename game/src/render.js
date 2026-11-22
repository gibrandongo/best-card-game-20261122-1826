// render.js — everything the player sees: cards, life bars, banners and the end screens.

import { SUITS } from './deck.js';
import { describeTrick, START_LIFE } from './rules.js';

const $ = (id) => document.getElementById(id);

/** One face-up card element. `selectable` marks it as a playable hand card. */
export function buildCardElement(card, options) {
  const opts = options || {};
  const suit = SUITS[card.suit];
  const el = document.createElement('div');
  el.className = `card ${suit.css}`;
  el.dataset.cardId = card.id;
  if (opts.dealt) el.classList.add('dealt');
  if (opts.flipped) el.classList.add('flipped');
  if (opts.selected) el.classList.add('selected');
  if (opts.playable) el.classList.add('playable');
  el.innerHTML =
    `<span class="corner"><span class="v">${card.value}</span><span class="s">${suit.glyph}</span></span>` +
    `<span class="pip">${suit.glyph}</span>` +
    `<span class="corner br"><span class="v">${card.value}</span><span class="s">${suit.glyph}</span></span>` +
    (card.value === 10 ? '<span class="crown">CROWN</span>' : '');
  return el;
}

/** One face-down card back. */
export function buildCardBackElement(dealt) {
  const el = document.createElement('div');
  el.className = 'card back';
  if (dealt) el.classList.add('dealt');
  return el;
}

/** A dashed empty slot where a played card will land. */
export function buildEmptySlotElement(label) {
  const el = document.createElement('div');
  el.className = 'slotHint';
  el.textContent = label;
  return el;
}

function renderLife(fillEl, textEl, life) {
  fillEl.style.width = `${Math.max(0, Math.min(100, (life / START_LIFE) * 100))}%`;
  textEl.textContent = `${life} / ${START_LIFE}`;
}

/** Paint the whole table from the match. Called after every state change. */
export function renderTable(match) {
  $('roundLabel').textContent = `ROUND ${match.round}`;
  $('scoreLabel').textContent = `TRICKS ${match.playerTricks} – ${match.opponentTricks}`;
  renderLife($('playerLifeFill'), $('playerLifeText'), match.playerLife);
  renderLife($('opponentLifeFill'), $('opponentLifeText'), match.opponentLife);
  $('deckCount').textContent = String(match.deck.length);

  // Opponent hand: face-down backs, one fewer while his card is committed.
  const oppHand = $('opponentHand');
  oppHand.innerHTML = '';
  for (let i = 0; i < match.opponentHand.length; i++) {
    oppHand.appendChild(buildCardBackElement(false));
  }

  // Player hand: face-up, clickable while choosing.
  const hand = $('playerHand');
  hand.innerHTML = '';
  match.playerHand.forEach((card, index) => {
    const el = buildCardElement(card, {
      selected: index === match.selectedIndex,
      playable: match.phase === 'choose',
    });
    el.dataset.handIndex = String(index);
    hand.appendChild(el);
  });

  // Midfield: the two played cards, or empty slots.
  const playedPlayer = $('playedPlayer');
  playedPlayer.innerHTML = '';
  if (match.playedPlayerCard) {
    playedPlayer.appendChild(buildCardElement(match.playedPlayerCard, { flipped: true }));
  } else {
    playedPlayer.appendChild(buildEmptySlotElement('YOUR CARD'));
  }
  const playedOpponent = $('playedOpponent');
  playedOpponent.innerHTML = '';
  if (match.playedOpponentCard) {
    playedOpponent.appendChild(buildCardElement(match.playedOpponentCard, { flipped: true }));
  } else if (match.opponentCard) {
    playedOpponent.appendChild(buildCardBackElement(false));
  } else {
    playedOpponent.appendChild(buildEmptySlotElement("VESK'S CARD"));
  }

  // The tell: Vesk's aura promises a suit before you commit.
  const tell = $('opponentTell');
  if (match.phase === 'choose' && match.tellSuit) {
    const suit = SUITS[match.tellSuit];
    tell.innerHTML = `Vesk's aura burns <span class="auraGlyph" style="color:${auraColor(match.tellSuit)}">${suit.glyph}</span> — he will play ${suit.name}. Counter it!`;
  } else if (match.phase === 'reveal') {
    tell.textContent = 'The cards are on the table…';
  } else {
    tell.textContent = 'Vesk is thinking…';
  }

  // Banner and detail line.
  const banner = $('trickBanner');
  const detail = $('trickDetail');
  banner.classList.remove('win', 'lose');
  if (match.phase === 'choose') {
    banner.textContent = match.selectedIndex >= 0 ? 'READY — ENTER TO PLAY' : 'PLAY A CARD';
    detail.textContent = match.cycledThisTurn
      ? 'You cycled a card this turn. Pick your play.'
      : 'Match Vesk’s aura or beat it with raw power. D cycles one card.';
  } else if (match.phase === 'reveal' && match.lastResult) {
    const result = match.lastResult;
    if (result.winner === 'player') {
      banner.textContent = `YOU WIN −${result.damage} LIFE`;
      banner.classList.add('win');
    } else if (result.winner === 'opponent') {
      banner.textContent = `VESK WINS −${result.damage} LIFE`;
      banner.classList.add('lose');
    } else {
      banner.textContent = 'DEAD HEAT −1 EACH';
    }
    detail.textContent = describeTrick(match.playedPlayerCard, match.playedOpponentCard, result);
  }

  // Streak badge: your next win deals +2 while you hold a 2+ streak.
  const streak = $('streakBadge');
  const showStreak = match.playerStreak >= 2 && match.phase === 'choose';
  streak.classList.toggle('hidden', !showStreak);
  if (showStreak) streak.textContent = `STREAK ×${match.playerStreak} — NEXT WIN +2`;

  // Screens.
  $('titleScreen').classList.toggle('hidden', match.screen !== 'title');
  const end = $('endScreen');
  end.classList.toggle('hidden', match.screen !== 'win' && match.screen !== 'loss');
  if (match.screen === 'win' || match.screen === 'loss') {
    renderEndScreen(match);
  }
}

function auraColor(suit) {
  return { ember: '#ff6a4d', tide: '#5ea8ff', thorn: '#6fdc8a', star: '#ffd94d' }[suit];
}

function renderEndScreen(match) {
  const end = $('endScreen');
  const won = match.screen === 'win';
  end.classList.toggle('win', won);
  end.classList.toggle('loss', !won);
  $('endEmblem').textContent = won ? '★' : '▲';
  $('endTitle').textContent = won ? 'VICTORY' : 'DEFEAT';
  $('endLine').textContent = won
    ? 'Vesk’s ember is out — the table is yours.'
    : 'Your ember dies out. Vesk keeps the table… this time.';
  $('endScore').textContent =
    `TRICKS ${match.playerTricks} – ${match.opponentTricks} · LIFE ${match.playerLife} – ${match.opponentLife}`;
}

/** A burst of falling confetti for the win flourish. */
export function launchConfetti() {
  const layer = $('confettiLayer');
  layer.innerHTML = '';
  const colors = ['#ffd94d', '#ff6a4d', '#5ea8ff', '#6fdc8a', '#ff9de2', '#ffe9a8'];
  for (let i = 0; i < 90; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti';
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDuration = `${2.2 + Math.random() * 2.2}s`;
    piece.style.animationDelay = `${Math.random() * 0.7}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    layer.appendChild(piece);
  }
  window.setTimeout(() => { layer.innerHTML = ''; }, 5200);
}
