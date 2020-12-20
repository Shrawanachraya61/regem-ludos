const NONE = 0;
const PLAYER = 1;
const CPU = 2;
const SCREEN_SIZE = 412;
const BOX_SIZE = Math.floor(SCREEN_SIZE / 3);

let canvas = null;
let ctx = null;
let board = [];
let currentTurn = null;
let lastStart = CPU;

const drawX = (x, y) => {
  const halfSize = BOX_SIZE / 2 - 10;
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - halfSize, y - halfSize);
  ctx.moveTo(x, y);
  ctx.lineTo(x + halfSize, y - halfSize);
  ctx.moveTo(x, y);
  ctx.lineTo(x - halfSize, y + halfSize);
  ctx.moveTo(x, y);
  ctx.lineTo(x + halfSize, y + halfSize);
  ctx.closePath();
  ctx.stroke();
};

const drawO = (x, y) => {
  const halfSize = BOX_SIZE / 2 - 10;
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, halfSize, 0, 2 * Math.PI);
  ctx.stroke();
};

const drawBoard = () => {
  ctx.strokeStyle = '#DEDEDE';
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    ctx.moveTo(BOX_SIZE * i, 0);
    ctx.lineTo(BOX_SIZE * i, SCREEN_SIZE);
  }
  for (let i = 0; i < 4; i++) {
    ctx.moveTo(0, BOX_SIZE * i);
    ctx.lineTo(SCREEN_SIZE, BOX_SIZE * i);
  }
  ctx.closePath();
  ctx.stroke();
};

const draw = board => {
  ctx.clearRect(0, 0, SCREEN_SIZE, SCREEN_SIZE);
  drawBoard();
  for (let i = 0; i < 9; i++) {
    const [x, y] = indToPos(i);
    if (board[i] === PLAYER) {
      drawX(x * BOX_SIZE + BOX_SIZE / 2, y * BOX_SIZE + BOX_SIZE / 2);
    } else if (board[i] === CPU) {
      drawO(x * BOX_SIZE + BOX_SIZE / 2, y * BOX_SIZE + BOX_SIZE / 2);
    }
  }
};

const agentToId = agent => {
  let id = '';
  if (agent === PLAYER) {
    id = 'player-score';
  } else {
    id = 'cpu-score';
  }
  return id;
};

const indToPos = i => {
  return [Math.floor(i / 3), i % 3];
};

const setScore = (agent, value) => {
  document.getElementById(agentToId(agent)).innerHTML = value;
};

const getScore = agent => {
  return parseInt(document.getElementById(agentToId(agent)).innerHTML) || 0;
};

const areAllEqual = arr => {
  return arr[0] !== NONE && arr[0] === arr[1] && arr[0] === arr[2];
};

const pointRectCollides = (x, y, x1, y1, x2, y2) => {
  return x >= x1 && x <= x2 && y >= y1 && y <= y2;
};

const doCPUTurn = () => {
  let ctr = 0;
  let i = 0;
  do {
    ctr++;
    i = Math.floor(Math.random() * 9);
    if (ctr > 1000) {
      throw new Error('Randomness is broken');
    }
  } while (board[i] != NONE);
  onPositionSelected(i);
};

const getGameResult = board => {
  let victor = -1;
  if (areAllEqual(board.slice(0, 3))) {
    victor = board[0];
  } else if (areAllEqual(board.slice(3, 6))) {
    victor = board[3];
  } else if (areAllEqual(board.slice(6, 9))) {
    victor = board[6];
  } else if (areAllEqual([board[0], board[3], board[6]])) {
    victor = board[0];
  } else if (areAllEqual([board[1], board[4], board[7]])) {
    victor = board[1];
  } else if (areAllEqual([board[2], board[5], board[8]])) {
    victor = board[2];
  } else if (areAllEqual([board[0], board[4], board[8]])) {
    victor = board[0];
  } else if (areAllEqual([board[2], board[4], board[6]])) {
    victor = board[2];
  }

  if (victor > -1) {
    return victor;
  }

  for (let i = 0; i < 9; i++) {
    if (board[i] === NONE) {
      return -1;
    }
  }
  return NONE;
};

const onGameOver = result => {
  const elem = document.getElementById('game-result');
  let innerHTML = '<div>';
  if (result === NONE) {
    innerHTML += '<div>The result is a TIE!</div>';
  } else if (result === PLAYER) {
    innerHTML += '<div>PLAYER wins!</div>';
    setScore(PLAYER, getScore(PLAYER) + 1);
  } else {
    innerHTML += '<div>CPU wins!</div>';
    setScore(CPU, getScore(CPU) + 1);
  }
  innerHTML += '<div><button onclick="newGame()"> Play Again! </button></div>';
  innerHTML += '</div>';
  elem.innerHTML = innerHTML;
};

const onPositionSelected = i => {
  const pos = board[i];
  if (pos === NONE) {
    board[i] = currentTurn;
    draw(board);

    const gameResult = getGameResult(board);

    if (gameResult === -1) {
      if (currentTurn === PLAYER) {
        currentTurn = CPU;
        setTimeout(() => {
          doCPUTurn();
        }, 250);
      } else {
        currentTurn = PLAYER;
      }
    } else {
      currentTurn = NONE;
      onGameOver(gameResult);
    }
  }
};

window.newGame = () => {
  board = [];
  for (let i = 0; i < 9; i++) {
    board.push(NONE);
  }

  document.getElementById('game-result').innerHTML = '';
  if (lastStart === PLAYER) {
    currentTurn = CPU;
    lastStart = CPU;
    setTimeout(() => {
      doCPUTurn();
    }, 250);
  } else {
    currentTurn = PLAYER;
    lastStart = PLAYER;
  }

  draw(board);
};

const init = () => {
  setScore(PLAYER, 0);
  setScore(CPU, 0);

  const canvasDiv = document.getElementById('canvas-area');
  canvas = document.createElement('canvas');
  canvas.width = SCREEN_SIZE;
  canvas.height = SCREEN_SIZE;
  ctx = canvas.getContext('2d');
  canvasDiv.innerHTML = '';
  canvasDiv.appendChild(canvas);
  canvas.addEventListener('mousedown', ev => {
    if (ev.button === 0) {
      if (currentTurn === PLAYER) {
        const xClick = ev.offsetX;
        const yClick = ev.offsetY;
        for (let i = 0; i < 9; i++) {
          const [x, y] = indToPos(i);
          if (
            pointRectCollides(
              xClick,
              yClick,
              BOX_SIZE * x,
              BOX_SIZE * y,
              BOX_SIZE * (x + 1),
              BOX_SIZE * (y + 1)
            )
          ) {
            onPositionSelected(i);
          }
        }
      }
    }
  });
  window.newGame();
};

window.addEventListener('load', init);
