// state.js — the match itself: screens, hands, life, tricks, streaks and the turn flow.

import { buildDeck, shuffleDeck, drawCards, seededRandom } from './deck.js';
import { START_LIFE, HAND_SIZE, resolveTrick, trickDamage } from './rules.js';
import { chooseTellSuit, chooseOpponentCard } from './ai.js';

export const SCREENS = ['title', 'playing', 'win', 'loss'];

/** A fresh match. `seed` is optional; without it the shuffle uses Math.random. */
export function createMatch(seed) {
  const random = seed === undefined ? Math.random : seededRandom(seed);
  const deck = shuffleDeck(buildDeck(), random);
  const discard = [];
  const playerHand = drawCards(deck, discard, HAND_SIZE, random);
  const opponentHand = drawCards(deck, discard, HAND_SIZE, random);
  return {
    screen: 'playing',
    random,
    deck,
    discard,
    playerHand,
    opponentHand,
    playerLife: START_LIFE,
    opponentLife: START_LIFE,
    playerTricks: 0,
    opponentTricks: 0,
    round: 1,
    playerStreak: 0,
    opponentStreak: 0,
    playerLastSuit: null,
    playerLastCard: null,
    opponentCard: null, // the card Vesk committed this turn (face down until reveal)
    tellSuit: null,
    playedPlayerCard: null,
    playedOpponentCard: null,
    lastResult: null,
    phase: 'choose', // choose | reveal | over
    cycledThisTurn: false,
    selectedIndex: -1,
    log: [],
  };
}

/** Vesk commits a card for the turn and his aura promises its suit. Call once per turn. */
export function beginTurn(match) {
  if (match.phase !== 'choose' || match.opponentCard !== null) return;
  match.tellSuit = chooseTellSuit(match.random, match.playerLastSuit);
  const card = chooseOpponentCard(match.opponentHand, {
    tellSuit: match.tellSuit,
    playerTricks: match.playerTricks,
    opponentTricks: match.opponentTricks,
    playerStreak: match.playerStreak,
    opponentLife: match.opponentLife,
    playerLastCard: match.playerLastCard,
  }, match.random);
  const at = match.opponentHand.indexOf(card);
  match.opponentHand.splice(at, 1);
  match.opponentCard = card;
  match.cycledThisTurn = false;
}

/** Discard the selected card and draw a replacement. Once per turn, before playing. */
export function cycleSelectedCard(match) {
  if (match.phase !== 'choose' || match.cycledThisTurn) return false;
  const at = match.selectedIndex;
  if (at < 0 || at >= match.playerHand.length) return false;
  const [old] = match.playerHand.splice(at, 1);
  match.discard.push(old);
  const drawn = drawCards(match.deck, match.discard, 1, match.random);
  match.playerHand.splice(at, 0, ...drawn);
  match.cycledThisTurn = true;
  match.selectedIndex = -1;
  return true;
}

/**
 * Play the player's card at `handIndex`. Resolves the trick, applies damage, draws fresh
 * cards and advances the round. Returns the trick result, or null when the play is illegal.
 */
export function playPlayerCard(match, handIndex) {
  if (match.phase !== 'choose' || match.opponentCard === null) return null;
  if (handIndex < 0 || handIndex >= match.playerHand.length) return null;
  const playerCard = match.playerHand.splice(handIndex, 1)[0];
  const opponentCard = match.opponentCard;
  match.opponentCard = null;
  match.playedPlayerCard = playerCard;
  match.playedOpponentCard = opponentCard;
  match.playerLastCard = playerCard;
  match.playerLastSuit = playerCard.suit;

  const result = resolveTrick(playerCard, opponentCard);
  match.lastResult = result;
  match.phase = 'reveal';

  if (result.winner === 'player') {
    match.playerStreak += 1;
    match.opponentStreak = 0;
    match.playerTricks += 1;
    const damage = trickDamage(result, match.playerStreak);
    match.opponentLife = Math.max(0, match.opponentLife - damage);
    result.damage = damage;
  } else if (result.winner === 'opponent') {
    match.opponentStreak += 1;
    match.playerStreak = 0;
    match.opponentTricks += 1;
    const damage = trickDamage(result, match.opponentStreak);
    match.playerLife = Math.max(0, match.playerLife - damage);
    result.damage = damage;
  } else {
    match.playerStreak = 0;
    match.opponentStreak = 0;
    match.playerLife = Math.max(0, match.playerLife - 1);
    match.opponentLife = Math.max(0, match.opponentLife - 1);
    result.damage = 1;
  }
  match.discard.push(playerCard, opponentCard);
  match.log.push(result);

  if (match.playerLife <= 0 || match.opponentLife <= 0) {
    match.screen = match.opponentLife <= 0 ? 'win' : 'loss';
    match.phase = 'over';
    return result;
  }
  return result;
}

/** After the reveal settles: both sides draw back up and the next turn begins. */
export function advanceToNextTurn(match) {
  if (match.phase !== 'reveal') return;
  match.playedPlayerCard = null;
  match.playedOpponentCard = null;
  match.lastResult = null;
  match.selectedIndex = -1;
  match.round += 1;
  const playerDraw = drawCards(match.deck, match.discard, HAND_SIZE - match.playerHand.length, match.random);
  match.playerHand.push(...playerDraw);
  const opponentDraw = drawCards(match.deck, match.discard, HAND_SIZE - match.opponentHand.length, match.random);
  match.opponentHand.push(...opponentDraw);
  match.phase = 'choose';
  beginTurn(match);
}

/** A fixed mid-game position for the table screenshot: real cards, real totals, real hands. */
export function demoTableMatch() {
  const match = createMatch(20261122);
  match.playerLife = 14;
  match.opponentLife = 17;
  match.playerTricks = 3;
  match.opponentTricks = 2;
  match.round = 6;
  match.playerStreak = 1;
  match.playerHand = [
    { suit: 'tide', value: 4, id: 'tide-4' },
    { suit: 'thorn', value: 10, id: 'thorn-10' },
    { suit: 'star', value: 7, id: 'star-7' },
    { suit: 'ember', value: 2, id: 'ember-2' },
  ];
  match.opponentHand = [
    { suit: 'tide', value: 6, id: 'tide-6' },
    { suit: 'thorn', value: 3, id: 'thorn-3' },
    { suit: 'ember', value: 8, id: 'ember-8' },
    { suit: 'star', value: 5, id: 'star-5' },
    { suit: 'tide', value: 9, id: 'tide-9' },
  ];
  match.tellSuit = 'tide';
  match.opponentCard = { suit: 'tide', value: 6, id: 'tide-6' };
  match.opponentHand = match.opponentHand.slice(1);
  match.playedPlayerCard = { suit: 'ember', value: 9, id: 'ember-9' };
  match.playedOpponentCard = { suit: 'tide', value: 6, id: 'tide-6' };
  match.lastResult = resolveTrick(match.playedPlayerCard, match.playedOpponentCard);
  // The trick is already resolved: the player won it, so the streak is now 2.
  match.lastResult.damage = trickDamage(match.lastResult, 2);
  match.phase = 'reveal';
  match.selectedIndex = 1; // the Crown 10, now the player's best answer
  return match;
}

/** A finished match for the win screenshot. */
export function demoWinMatch() {
  const match = createMatch(7);
  match.screen = 'win';
  match.phase = 'over';
  match.playerLife = 8;
  match.opponentLife = 0;
  match.playerTricks = 7;
  match.opponentTricks = 4;
  match.round = 12;
  return match;
}

/** A finished match for the loss screenshot. */
export function demoLossMatch() {
  const match = createMatch(13);
  match.screen = 'loss';
  match.phase = 'over';
  match.playerLife = 0;
  match.opponentLife = 11;
  match.playerTricks = 4;
  match.opponentTricks = 6;
  match.round = 11;
  return match;
}
