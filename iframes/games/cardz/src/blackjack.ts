import { getCardSuit, Hand, shuffle } from './cards';
import {
  createTable,
  Player,
  Table,
  tableCreateHands,
  TableEvent,
  tableInvokeEvent,
  tableSubscribeEvent,
} from './table';

interface BlackJackPlayer {
  tablePlayer: Player;
  bets: number[];

  splitHands: Hand[];

  isDealer: boolean;
  isPlayer: boolean;
  hasInsurance: boolean;
  isBust: boolean;
}

enum BlackJackTableEvent {
  onCardDealt = 'onCardDealt',
  onHandSplit = 'onHandSplit',
  onHit = 'onHit',
  onPass = 'onPass',
  onBust = 'onBust',
}

interface GameBlackJack {
  table: Table<BlackJackTableEvent>;
  players: BlackJackPlayer[];
  turnInd: number;
}

export const createGameBlackJack = () => {
  const table: Table<BlackJackTableEvent> = createTable([
    'Bob',
    'Joe',
    'Player',
    'Dealer',
  ]);

  table.subscriptions[BlackJackTableEvent.onCardDealt] = [];
  table.subscriptions[BlackJackTableEvent.onHandSplit] = [];
  table.subscriptions[BlackJackTableEvent.onHit] = [];
  table.subscriptions[BlackJackTableEvent.onPass] = [];
  table.subscriptions[BlackJackTableEvent.onBust] = [];

  const game: GameBlackJack = {
    table,
    turnInd: 0,
    players: table.players.map((tablePlayer, i) => {
      const player: BlackJackPlayer = {
        tablePlayer,
        bets: [],
        splitHands: [],
        isDealer: i === table.players.length - 1,
        isPlayer: i === table.players.length - 2,
        hasInsurance: false,
        isBust: false,
      };
      return player;
    }),
  };

  tableSubscribeEvent(table, TableEvent.onGameBegin, () => {
    shuffle(table.deck);
    game.turnInd = 0;
    tableCreateHands(table, 2);
    tableInvokeEvent(table, TableEvent.onRoundBegin);
    tableInvokeEvent(
      table,
      TableEvent.onPlayerTurnStart,
      game.players[game.turnInd]
    );
  });

  tableSubscribeEvent(table, TableEvent.onPlayerTurnStart, () => {
    const player = game.players[game.turnInd];
    if (player.isPlayer) {
      // wait for input
    } else if (player.isDealer) {
      // do dealer hand
    } else {
      // do player hand
    }
  });

  tableSubscribeEvent(table, BlackJackTableEvent.onHit, () => {
    const player = game.players[game.turnInd];
    const nextCard = table.deck.unshift();
    if (player.splitHands.length === 0) {
      player.tablePlayer.hand.push(nextCard);
      const value = getHandValue(player.tablePlayer.hand);
      if (value > 21) {
        tableInvokeEvent(table, BlackJackTableEvent.onBust, player);
      }
    }
  });

  tableSubscribeEvent(table, BlackJackTableEvent.onPass, () => {
    game.turnInd++;
    const player = game.players[game.turnInd];
    if (!player) {
      tableInvokeEvent(table, TableEvent.onRoundEnd);
      tableInvokeEvent(table, TableEvent.onGameEnd);
      return;
    }
    tableInvokeEvent(table, TableEvent.onPlayerTurnStart, player);
  });

  tableSubscribeEvent(table, BlackJackTableEvent.onBust, () => {
    const player = game.players[game.turnInd];
    player.isBust = true;
    tableInvokeEvent(table, BlackJackTableEvent.onPass);
  });

  tableInvokeEvent(table, TableEvent.onGameBegin);
};

const getHandValue = (hand: Hand) => {
  let sum = 0;
  let numAces = 0;

  for (let i = 0; i < hand.length; i++) {
    const [value] = getCardSuit(hand[i]);
    if (value === 1) {
      numAces++;
    }
    sum += value;
  }

  for (let i = 0; i < numAces; i++) {
    const sum2 = sum + 10;
    if (sum2 > sum && sum2 <= 21) {
      sum = sum2;
    }
  }

  return sum;
};
