// ai.js — Vesk, the Cinder Warden. One job: pick the opponent's card, and leave a readable tell.
//
// Vesk is readable on purpose: his aura (shown before you commit) reveals the SUIT he will
// play, never the value. His choices follow simple rules you can learn and counter:
//  - He protects his Crown 10s until his life is low or he is on a losing streak.
//  - When you are streaking, he answers with his strongest card of a countering suit.
//  - Otherwise he plays a mid card of the suit his aura promised, keeping big cards in reserve.

import { SUIT_KEYS } from './deck.js';
import { suitBeats, cardPower } from './rules.js';

/** The suit Vesk's aura promises this turn. Weighted toward suits that counter your last play. */
export function chooseTellSuit(random, playerLastSuit) {
  const rng = random || Math.random;
  if (playerLastSuit && rng() < 0.45) {
    // Vesk often reaches for a suit that beats what you just played.
    for (const suit of SUIT_KEYS) {
      if (suitBeats(suit, playerLastSuit)) return suit;
    }
  }
  return SUIT_KEYS[Math.floor(rng() * SUIT_KEYS.length)];
}

/**
 * Pick Vesk's card from his hand. `context` carries { tellSuit, playerStreak, opponentLife,
 * playerTricks, opponentTricks, playerLastCard }. Returns the chosen card object from `hand`
 */
export function chooseOpponentCard(hand, context, random) {
  const rng = random || Math.random;
  const { tellSuit, playerStreak, opponentLife, playerTricks, opponentTricks } = context;
  const ofSuit = hand.filter((c) => c.suit === tellSuit);
  const pool = ofSuit.length > 0 ? ofSuit : hand.slice();
  const sorted = pool.slice().sort((a, b) => b.value - a.value);
  const behind = (playerTricks || 0) - (opponentTricks || 0) >= 2;
  const lowLife = opponentLife <= 10;
  const desperate = lowLife || playerStreak >= 2 || behind;

  // A threatened Vesk spends his best: highest value in the promised suit, Crown included.
  if (desperate) {
    return sorted[0];
  }

  // Calm Vesk plays a solid mid-to-high card and keeps his Crown 10s in reserve.
  const spendable = sorted.filter((c) => c.value < 10);
  const candidates = spendable.length > 0 ? spendable : sorted;
  const pick = candidates[Math.floor(rng() * Math.min(candidates.length, 2))];
  return pick || hand[0];
}

/** Rough read of Vesk's hand strength, for the tell line: 0..1, higher means he holds big cards. */
export function handThreat(hand) {
  if (hand.length === 0) return 0;
  const total = hand.reduce((sum, c) => sum + c.value, 0);
  return total / (hand.length * 10);
}
