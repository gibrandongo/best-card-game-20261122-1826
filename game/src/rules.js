// rules.js — the element wheel, trick resolution and damage. One job: decide who wins a trick.

// Ember burns Thorn, Thorn chokes Tide, Tide drowns Ember. Star answers to no suit.
const BEATS = { ember: 'thorn', thorn: 'tide', tide: 'ember', star: null };

export const SUIT_BONUS = 2; // power gained when your suit beats the other card's suit
export const STREAK_BONUS = 2; // extra damage when the winner is on a 2+ trick streak
export const START_LIFE = 20;
export const HAND_SIZE = 5;

/** Does suit `a` beat suit `b` on the element wheel? */
export function suitBeats(a, b) {
  return BEATS[a] === b;
}

/** A card's fighting power against one opposing card. */
export function cardPower(card, opposingCard) {
  let power = card.value;
  if (suitBeats(card.suit, opposingCard.suit)) power += SUIT_BONUS;
  return power;
}

/**
 * Resolve one trick. Returns { winner, playerPower, opponentPower, margin, crownWin, tie }.
 * winner is 'player', 'opponent' or 'tie'. A Crown 10 wins ties outright.
 */
export function resolveTrick(playerCard, opponentCard) {
  const playerPower = cardPower(playerCard, opponentCard);
  const opponentPower = cardPower(opponentCard, playerCard);
  if (playerPower === opponentPower) {
    const playerCrown = playerCard.value === 10;
    const opponentCrown = opponentCard.value === 10;
    if (playerCrown && !opponentCrown) {
      return { winner: 'player', playerPower, opponentPower, margin: 1, crownWin: true, tie: false };
    }
    if (opponentCrown && !playerCrown) {
      return { winner: 'opponent', playerPower, opponentPower, margin: 1, crownWin: true, tie: false };
    }
    return { winner: 'tie', playerPower, opponentPower, margin: 0, crownWin: false, tie: true };
  }
  const winner = playerPower > opponentPower ? 'player' : 'opponent';
  const margin = Math.abs(playerPower - opponentPower);
  return { winner, playerPower, opponentPower, margin, crownWin: false, tie: false };
}

/** Damage the trick winner deals: the margin (at least 1), plus the streak bonus when streaking. */
export function trickDamage(result, winnerStreak) {
  if (result.winner === 'tie') return 0;
  let damage = Math.max(1, result.margin);
  if (winnerStreak >= 2) damage += STREAK_BONUS;
  return damage;
}

/** Human-readable reason line for a trick result, shown under the banner. */
export function describeTrick(playerCard, opponentCard, result) {
  const name = (c) => `${c.value} ${c.suit}`;
  if (result.tie) {
    return `Both played ${name(playerCard)} power ${result.playerPower} — a dead heat. Both lose 1 life.`;
  }
  const who = result.winner === 'player' ? 'You win' : 'Vesk wins';
  const crown = result.crownWin ? ' — the Crown 10 breaks the tie!' : '';
  const wheel =
    suitBeats(playerCard.suit, opponentCard.suit) || suitBeats(opponentCard.suit, playerCard.suit)
      ? ' The wheel turned the trick.'
      : '';
  return `${who} the trick: ${name(playerCard)} (${result.playerPower}) vs ${name(opponentCard)} (${result.opponentPower}).${crown}${wheel}`;
}
