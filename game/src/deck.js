// deck.js — the card set, the suits and the shuffle. One job: build a fair deck.

export const SUITS = {
  ember: { name: 'Ember', glyph: '▲', css: 'ember' },
  tide: { name: 'Tide', glyph: '●', css: 'tide' },
  thorn: { name: 'Thorn', glyph: '◆', css: 'thorn' },
  star: { name: 'Star', glyph: '★', css: 'star' },
};

export const SUIT_KEYS = ['ember', 'tide', 'thorn', 'star'];

/** A card: { suit, value, id }. Value 10 is a Crown card and wins ties. */
export function buildDeck() {
  const deck = [];
  for (const suit of SUIT_KEYS) {
    for (let value = 1; value <= 10; value++) {
      deck.push({ suit, value, id: `${suit}-${value}` });
    }
  }
  return deck;
}

/** Small deterministic RNG (mulberry32) so screenshot setups are reproducible. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function nextRandom() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle. `random` is a () => [0,1) function; defaults to Math.random. */
export function shuffleDeck(deck, random) {
  const rng = random || Math.random;
  const out = deck.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/** Draw `n` cards from the front of `deck`, refilling from `discard` when it runs dry. */
export function drawCards(deck, discard, n, random) {
  const drawn = [];
  for (let i = 0; i < n; i++) {
    if (deck.length === 0) {
      if (discard.length === 0) break;
      const fresh = shuffleDeck(discard.splice(0, discard.length), random);
      deck.push(...fresh);
    }
    drawn.push(deck.shift());
  }
  return drawn;
}
