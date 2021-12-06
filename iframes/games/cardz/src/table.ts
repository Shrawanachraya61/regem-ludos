import { createDeck, deal, Deck, Hand } from './cards';

export enum TableEvent {
  onGameBegin = 'onGameBegin',
  onGameEnd = 'onGameEnd',
  onRoundBegin = 'onRoundBegin',
  onRoundEnd = 'onRoundEnd',
  onCardsDealt = 'onCardsDealt',
  onPlayerTurnStart = 'onPlayerTurnStart',
  onPlayerTurnEnd = 'onPlayerTurnEnd',
  onCardsPlayed = 'onCardsPlayed',
}

export type SubscriptionFunc = (...args: any[]) => void;

export interface Player {
  name: string;
  hand: Hand;
}

export interface Table<T> {
  deck: Deck;
  players: Player[];
  subscriptions: Record<string, SubscriptionFunc[]>;
}

export function createTable<T>(playerNames: string[]) {
  const table: Table<T> = {
    deck: createDeck(),
    players: playerNames.map(name => {
      const player: Player = {
        name,
        hand: [],
      };
      return player;
    }),
    subscriptions: {
      [TableEvent.onGameBegin]: [],
      [TableEvent.onGameEnd]: [],
      [TableEvent.onRoundBegin]: [],
      [TableEvent.onRoundEnd]: [],
      [TableEvent.onCardsDealt]: [],
      [TableEvent.onPlayerTurnStart]: [],
      [TableEvent.onPlayerTurnStart]: [],
      [TableEvent.onPlayerTurnEnd]: [],
      [TableEvent.onCardsPlayed]: [],
    } as Record<string, SubscriptionFunc[]>,
  };
  return table;
}

export function tableCreateHands<T>(table: Table<T>, cardsPerHand: number) {
  const hands = deal(table.deck, cardsPerHand, table.players.length);
  table.players.forEach((player, i) => {
    player.hand = hands[i];
  });
}

export function tableInvokeEvent<T>(
  table: Table<T>,
  ev: TableEvent | T,
  ...args: any[]
) {
  setTimeout(() => {
    const subs = table.subscriptions[ev].slice();
    subs.forEach(cb => {
      cb(args);
    });
  }, 1);
}

export function tableSubscribeEvent<T>(
  table: Table<T>,
  ev: TableEvent | T,
  cb: SubscriptionFunc
) {
  table.subscriptions[ev as string].push(cb);
}

export function tableUnsubscribeEvent<T>(
  table: Table<T>,
  ev: TableEvent | T,
  cb: SubscriptionFunc
) {
  const subs = table.subscriptions[ev as string];
  const ind = subs.indexOf(cb);
  if (ind > -1) {
    subs.splice(ind, 1);
  }
}
