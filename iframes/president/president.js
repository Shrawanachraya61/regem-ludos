const CARD_WIDTH = 64;
const CARD_HEIGHT = 96;
const BOARD_SIZE = 512;
const THINK_TIME_MS = 500;

const SUIT_SPADES = 0;
const SUIT_CLUBS = 1;
const SUIT_HEARTS = 2;
const SUIT_DIAMONDS = 3;
const SUIT_JOKER = 4;

const NAMES = [
  'Pete',
  'Lily',
  'Scott',
  'Kevin',
  'Mo',
  'Zoe',
  'Dan',
  'Flo',
  'Steph',
  'Ron',
  'Claire',
  'Bob',
  'Eddy',
  'Daisy',
];

const CARD_NUMBERS = {
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
  15: 'Jo',
};

const SUITS = {
  [SUIT_SPADES]: '&spades;',
  [SUIT_CLUBS]: '&clubs;',
  [SUIT_HEARTS]: '&hearts;',
  [SUIT_DIAMONDS]: '&diamondsuit;',
  [SUIT_JOKER]: 'Jo',
};

let numPlayers = 6;
const deck = [];
const players = [];
let playersOut = [];
let passedThisRound = [];
let selectedCards = [];
let boardCards = [];
let usedCards = [];
let turnIndex = 0;
let playerLastPlayed = null;
let onGameCompleted = function () {};

const normalize = (x, a, b, c, d) => {
  return c + ((x - a) * (d - c)) / (b - a);
};

const createCard = (number, suit) => {
  return {
    left: 0,
    top: 0,
    number,
    label: CARD_NUMBERS[number],
    suit,
    suitLabel: SUITS[suit],
    dom: createCardDOM(number, suit),
  };
};

const createCardDOM = (number, suitNumber) => {
  const suitLabel = SUITS[suitNumber];
  let color;
  if (suitNumber < 2) {
    color = 'black';
  } else if (suitNumber < 4) {
    color = 'red';
  } else {
    color = 'blue';
  }
  const div = document.createElement('div');
  div.className = 'card';
  const cardNumber1 = document.createElement('div');
  cardNumber1.className = 'card-number1';
  cardNumber1.innerHTML = CARD_NUMBERS[number];
  cardNumber1.style.color = color;
  const cardNumber2 = document.createElement('div');
  cardNumber2.className = 'card-number2';
  cardNumber2.innerHTML = CARD_NUMBERS[number];
  cardNumber2.style.color = color;
  const suit = document.createElement('div');
  suit.className = 'card-suit';
  suit.innerHTML = suitLabel;
  suit.style.color = color;
  const div2 = document.createElement('div');
  div2.appendChild(cardNumber1);
  div2.appendChild(cardNumber2);
  div2.appendChild(suit);
  div.appendChild(div2);
  document.getElementById('board').appendChild(div);
  return div;
};

const setCardPosition = (card, x, y, z) => {
  const { dom } = card;
  dom.style.left = x + 'px';
  dom.style.top = y + 'px';
  card.left = x;
  card.top = y;
  if (z !== undefined) {
    dom.style['z-index'] = z;
  }
};
const setCardVisibility = (card, v) => {
  const { dom } = card;
  const domStyle = dom.style;
  const childStyle = dom.children[0].style;
  if (v) {
    childStyle.display = 'block';
    domStyle.background = 'white';
  } else {
    childStyle.display = 'none';
    domStyle.background =
      'linear-gradient(90deg, rgba(0,1,255,1) 0%, rgba(109,126,255,1) 36%, rgba(0,44,255,1) 70%, rgba(130,157,255,1) 100%)';
  }
};

const createPlayer = (name, i) => {
  return {
    name,
    i,
    hand: [],
  };
};

const shuffle = deck => {
  const oldDeck = deck.slice();
  let ctr = 0;
  while (oldDeck.length) {
    const i = Math.floor(Math.random() * oldDeck.length);
    deck[ctr] = oldDeck[i];
    oldDeck.splice(i, 1);
    ctr++;
  }
  return deck;
};

const deal = (deck, players) => {
  const newPlayers = players.slice();
  shuffle(newPlayers);
  shuffle(deck);
  const numPlayers = players.length;
  const handSize = Math.ceil(deck.length / numPlayers);
  let ctr = 0;
  for (let i = 0; i < deck.length; i += handSize) {
    newPlayers[ctr].hand = deck.slice(i, i + handSize).sort((a, b) => {
      if (a.number < b.number) {
        return -1;
      } else if (a.number > b.number) {
        return 1;
      } else {
        if (a.suit < b.suit) {
          return -1;
        } else {
          return 1;
        }
      }
    });
    ctr++;
  }
};

const playCards = (selectedCards, player) => {
  boardCards.push(selectedCards.slice());
  selectedCards.forEach((card, i) => {
    const widthOfCards = boardCards[0].length * CARD_WIDTH;
    const cardStart = BOARD_SIZE / 2 - widthOfCards / 2;
    setCardPosition(
      card,
      cardStart + CARD_WIDTH * i,
      BOARD_SIZE / 2 - CARD_HEIGHT / 2,
      boardCards.length
    );
    setCardVisibility(card, true);

    const ind = player.hand.indexOf(card);
    if (ind > -1) {
      player.hand.splice(ind, 1);
    }
    card.onclick = function () {};
  });
  playerLastPlayed = player;
  nextTurn();
};

const pass = () => {
  passedThisRound.push(players[turnIndex]);
  nextTurn();
};

const ai = player => {
  const topCards = boardCards[boardCards.length - 1];
  if (!topCards) {
    playCards(
      getAllCardsWithNumber(player.hand, player.hand[0].number),
      player
    );
  } else {
    const topCardNumber = topCards[0].number;
    const topCardAmount = topCards.length;

    for (let i in player.hand) {
      const card = player.hand[i];
      if (card.number > topCardNumber) {
        const cards = getAllCardsWithNumber(player.hand, card.number);
        if (cards.length === topCardAmount) {
          setTimeout(() => {
            playCards(cards, player);
          }, THINK_TIME_MS);
          return;
        }
      }
    }

    pass();
  }
};

const nextTurn = () => {
  const currentPlayer = players[turnIndex];
  if (
    currentPlayer &&
    currentPlayer.hand.length === 0 &&
    !playersOut.includes(currentPlayer)
  ) {
    playersOut.push(currentPlayer);
  }

  if (isGameOver(players)) {
    endGame();
    return;
  }
  do {
    turnIndex = (turnIndex + 1) % numPlayers;
  } while (players[turnIndex].hand.length === 0 && !isEndOfRound());

  if (isEndOfRound()) {
    for (let i in boardCards) {
      usedCards = usedCards.concat(boardCards[i]);
    }
    boardCards = [];
    passedThisRound = [];
  }

  if (players[turnIndex].hand.length === 0) {
    playerLastPlayed = null;
    nextTurn();
    return;
  }

  drawUi();
  if (turnIndex > 0) {
    ai(players[turnIndex]);
  }
};

const isGameOver = players => {
  let ctr = 0;
  for (let i in players) {
    const player = players[i];
    if (player.hand.length) {
      ctr++;
    }
  }
  return ctr < 2;
};

const isEndOfRound = () => {
  return playerLastPlayed === players[turnIndex];
};

const isValidPlay = (boardCards, cards) => {
  const topCards = boardCards[boardCards.length - 1];
  if (cards.length === 0) {
    return false;
  }
  if (boardCards.length === 0) {
    return true;
  }
  if (cards.length === topCards.length) {
    return topCards[0].number < cards[0].number;
  } else {
    return false;
  }
};

const getAllCardsWithNumber = (cards, number) => {
  return cards.filter(card => card.number === number);
};

const onCardClickHand = (hand, card) => {
  if (selectedCards.length) {
    const selectedCard = selectedCards[0];
    if (selectedCard.number === card.number) {
      selectedCards.push(card);
      setCardPosition(card, card.left, BOARD_SIZE - CARD_HEIGHT * 1.66);
      card.dom.onclick = () => {
        onCardClickSelected(hand, card);
      };
      return;
    } else {
      selectedCards.forEach(c => {
        setCardPosition(c, c.left, BOARD_SIZE - CARD_HEIGHT);
        c.dom.onclick = () => {
          onCardClickHand(hand, c);
        };
      });
    }
  }
  selectedCards = getAllCardsWithNumber(hand, card.number).map(c => {
    setCardPosition(c, c.left, BOARD_SIZE - CARD_HEIGHT * 1.66);
    c.dom.onclick = () => {
      onCardClickSelected(hand, c);
    };
    return c;
  });
  drawUi();
};

const onCardClickSelected = (hand, card) => {
  const i = selectedCards.indexOf(card);
  if (i > -1) {
    selectedCards.splice(i, 1);
    setCardPosition(card, card.left, BOARD_SIZE - CARD_HEIGHT);
    card.dom.onclick = () => {
      onCardClickHand(hand, card);
    };
    drawUi();
  }
};

const onPlayClick = () => {
  if (isValidPlay(boardCards, selectedCards)) {
    playCards(selectedCards, players[0]);
    selectedCards = [];
    setHandCards(players[0]);
  }
};

const onPassClick = () => {
  pass();
  setHandCards(players[0]);
  selectedCards = [];
};

const setPlayButton = () => {
  const elem = document.getElementById('play-card');
  elem.onclick = onPlayClick;
  if (isValidPlay(boardCards, selectedCards)) {
    elem.className = 'button play-card';
  } else {
    elem.className = 'button play-card-disabled';
  }

  if (turnIndex === 0) {
    elem.style.display = 'block';
  } else {
    elem.style.display = 'none';
  }
};

const setPassButton = () => {
  const elem = document.getElementById('pass');
  elem.onclick = onPassClick;
  elem.className = 'button pass';

  if (turnIndex === 0) {
    elem.style.display = 'block';
  } else {
    elem.style.display = 'none';
  }
};

const setUsedCards = () => {
  for (let i in usedCards) {
    const card = usedCards[i];
    setCardPosition(
      card,
      BOARD_SIZE - CARD_WIDTH - 32,
      BOARD_SIZE / 2 - CARD_HEIGHT / 2
    );
    setCardVisibility(card, false);
  }
};

const setHandCards = player => {
  const numCardsInHand = player.hand.length;
  if (player.i === 0) {
    const widthOfCards = numCardsInHand * CARD_WIDTH;
    let cardSpacing = CARD_WIDTH;
    let cardStart = 0;
    if (widthOfCards > BOARD_SIZE) {
      cardSpacing = (BOARD_SIZE - CARD_WIDTH) / numCardsInHand;
      cardStart = 16;
    } else {
      cardStart = BOARD_SIZE / 2 - widthOfCards / 2;
    }
    for (let i = 0; i < numCardsInHand; i++) {
      const card = player.hand[i];
      setCardPosition(
        card,
        cardStart + i * cardSpacing,
        BOARD_SIZE - CARD_HEIGHT,
        i
      );
      card.dom.onclick = () => {
        onCardClickHand(player.hand, card);
      };
      setCardVisibility(card, true);
    }
  } else {
    const spacing = BOARD_SIZE / (numPlayers - 1);
    const widthOfCards = spacing * (numPlayers - 2);
    const x =
      BOARD_SIZE / 2 -
      CARD_WIDTH / 2 -
      widthOfCards / 2 +
      (player.i - 1) * spacing;

    for (let i = 0; i < numCardsInHand; i++) {
      const card = player.hand[i];
      setCardPosition(card, x, 32, i);
      setCardVisibility(card, false);
      card.onclick = function () {};
    }
  }
};

const drawPlayerText = player => {
  const spacing = BOARD_SIZE / (numPlayers - 1);
  const widthOfCards = spacing * (numPlayers - 2);
  const x =
    BOARD_SIZE / 2 -
    CARD_WIDTH / 2 -
    widthOfCards / 2 +
    (player.i - 1) * spacing;

  const ctx = document.getElementById('canvas').getContext('2d');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'hanging';
  ctx.font = '16px monospace';
  ctx.fillStyle = 'white';
  ctx.fillText(player.name + ` (${player.hand.length})`, x + CARD_WIDTH / 2, 8);

  if (passedThisRound.includes(player)) {
    ctx.fillText(`PASSED`, x + CARD_WIDTH / 2, 8 + CARD_HEIGHT + 32);
  }
};

const drawUi = isFromInit => {
  const ctx = document.getElementById('canvas').getContext('2d');
  ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

  for (let i = 1; i < numPlayers; i++) {
    drawPlayerText(players[i]);
  }

  setPassButton();
  setPlayButton();
  setUsedCards();

  if (isGameOver(players)) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'hanging';
    ctx.font = '16px monospace';
    ctx.fillText(isFromInit ? 'President!' : 'Game Over', BOARD_SIZE / 2, 64);

    ctx.fillText(
      'Click the cards to start a new game.',
      BOARD_SIZE / 2,
      BOARD_SIZE / 2
    );

    if (!isFromInit) {
      const x = BOARD_SIZE / 2;
      const yStart = BOARD_SIZE / 2 + CARD_HEIGHT / 3;
      for (let i = 0; i < playersOut.length; i++) {
        ctx.fillStyle = playersOut[i] === players[0] ? 'cyan' : 'white';
        ctx.fillText(i + 1 + '. ' + playersOut[i].name, x, yStart + i * 24);
      }
    }
  } else {
    if (playerLastPlayed && playerLastPlayed !== players[0]) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'hanging';
      ctx.font = '16px monospace';
      ctx.fillStyle = 'white';
      ctx.fillText(
        `(Played by ${playerLastPlayed.name})`,
        BOARD_SIZE / 2,
        BOARD_SIZE / 2 - CARD_HEIGHT
      );
    } else {
      if (turnIndex === 0) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'hanging';
        ctx.font = '16px monospace';
        ctx.fillStyle = 'white';
        ctx.fillText(
          `Your turn!`,
          BOARD_SIZE / 2,
          BOARD_SIZE / 2 - CARD_HEIGHT
        );
      }
    }
  }
};

const endGame = isFromInit => {
  selectedCards = [];
  boardCards = [];
  usedCards = [];
  passedThisRound = [];
  turnIndex = 0;
  playerLastPlayed = null;
  turnIndex = 1;

  if (!isFromInit) {
    for (let i in players) {
      const player = players[i];
      if (!playersOut.includes(player)) {
        playersOut.push(player);
      }
    }
  }

  if (isFromInit) {
    turnIndex = -1;
  } else {
    turnIndex = players.indexOf(playersOut[0]) - 1;
  }

  for (let i in deck) {
    const card = deck[i];
    card.dom.onclick = newGame;
    setCardPosition(
      card,
      BOARD_SIZE / 2 - CARD_WIDTH / 2 + normalize(i, 0, deck.length, -75, 75),
      BOARD_SIZE / 3 - CARD_HEIGHT / 2,
      i
    );
    setCardVisibility(card, false);
  }
  drawUi(isFromInit);

  if (!isFromInit) {
    onGameCompleted();
  }
};

const newGame = () => {
  numPlayers = 6;
  selectedCards = [];
  boardCards = [];
  usedCards = [];
  playersOut = [];
  passedThisRound = [];
  playerLastPlayed = null;

  for (let i in players) {
    const player = players[i];
    player.hand = [];
  }

  deal(deck, players);

  for (let i = 0; i < players.length; i++) {
    setHandCards(players[i]);
  }

  nextTurn();

  drawUi();
};

const init = () => {
  deck.length = 0;
  players.length = 0;
  for (let suit = 0; suit < 4; suit++) {
    for (let i = 2; i <= 14; i++) {
      const card = createCard(i, suit);
      setCardVisibility(card, false);
      deck.push(card);
    }
  }

  {
    const card = createCard(15, SUIT_JOKER);
    setCardVisibility(card, false);
    deck.push(card);
  }
  {
    const card = createCard(15, SUIT_JOKER);
    setCardVisibility(card, false);
    deck.push(card);
  }

  let usedNames = [];
  const getRandomName = () => {
    let ctr = 0;
    let randomName = '';
    do {
      randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
      ctr++;
    } while (usedNames.includes(randomName) && ctr <= NAMES.length);
    usedNames.push(randomName);
    return randomName;
  };

  for (let i = 0; i < numPlayers; i++) {
    players.push(createPlayer(i > 0 ? getRandomName() : 'PLAYER', i));
  }

  endGame(true);

  // newGame();
};

window.addEventListener('load', init);
window.addEventListener('message', event => {
  const { data, source } = event;
  if (data === 'init') {
    console.log('[IFRAME] President initialized.');
    onGameCompleted = () => {
      source.postMessage(
        JSON.stringify({
          game: 'president',
          winner: playersOut[0] === players[0],
        }),
        '*'
      );
    };
  }
});
