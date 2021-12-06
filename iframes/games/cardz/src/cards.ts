export type Card = number;
export type Deck = Card[];
export type Hand = Card[];

export enum Suit {
  HEARTS = 'hearts',
  DIAMONDS = 'diamonds',
  SPADES = 'spades',
  CLUBS = 'clubs',
}

export const createDeck = (): Deck => {
  const deck: Deck = [];
  for (let i = 0; i < 13 * 4; i++) {
    deck.push(i);
  }
  return deck;
};

export const shuffle = (deck: Deck) => {
  const deckCopy = deck.slice();
  let ii = 0;
  while (deckCopy.length) {
    const i = Math.floor(Math.random() * deckCopy.length);
    deck[ii] = deckCopy[i];
    deckCopy.splice(i, 1);
    ii++;
  }
  return deck;
};

export const deal = (deck: Deck, cardsPerHand: number, numHands: number) => {
  const hands: Hand[] = [];
  for (let i = 0; i < cardsPerHand; i++) {
    for (let j = 0; j < numHands; j++) {
      const card = deck.unshift();
      if (!hands[j]) {
        hands.push([card]);
      } else {
        hands[j].push(card);
      }
    }
  }
  return hands;
};

export const getCardSuit = (n: Card): [number, Suit] => {
  const suit = [Suit.HEARTS, Suit.DIAMONDS, Suit.SPADES, Suit.CLUBS];
  return [(n % 13) + 1, suit[Math.floor(n / 13)] ?? Suit.HEARTS];
};
