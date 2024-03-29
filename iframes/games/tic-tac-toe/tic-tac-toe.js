const NONE = 0;
const PLAYER = 1;
const CPU = 2;
const SCREEN_SIZE = 388;
const BOX_SIZE = Math.floor(SCREEN_SIZE / 3);
const MAX_GAMES_PLAYED = 3;

let canvas = null;
let ctx = null;
let board = [];
let currentTurn = null;
let lastStart = CPU;
let isPlaying = false;
let numGamesPlayed = 0;
let cursorX = 0;
let cursorY = 0;

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

  ctx.strokeStyle = '#999';
  ctx.lineWidth = 2;
  const padding = 8;
  ctx.strokeRect(
    cursorX * BOX_SIZE + padding,
    cursorY * BOX_SIZE + padding,
    BOX_SIZE - padding * 2,
    BOX_SIZE - padding * 2
  );
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

const clear = () => {
  ctx.clearRect(0, 0, SCREEN_SIZE, SCREEN_SIZE);
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

const getRandomPassiveAggressiveWinningPhrase = () => {
  const phrases = [
    'You win... Nice job?',
    'You must be sooo smart.',
    'You win.  No need to gloat.',
    'You are a "winner"',
    'You have somehow won.',
    'You won that game.',
    'You clicked correctly this time.',
    "You actually think you're good.",
    'So stupid.',
    'Leave me alone.',
    "It's just a game.",
    'Play again.  Go on.',
  ];
  return phrases[Math.floor(Math.random() * phrases.length)];
};

const getGloatingPhrase = i => {
  const phrases = [
    'HAHAHA YOU ACTUALLY LOST!',
    'HOW CAN YOU BE THIS BAD?',
    'MUAHAHAHA EMBARRASSING!',
  ];
  return phrases[i] || phrases[0];
};

const onGameOver = result => {
  numGamesPlayed++;
  const elem = document.getElementById(`game-result`);
  let tag = 'marquee';
  let innerHTML = `<div>`;
  if (result === NONE) {
    if (numGamesPlayed < MAX_GAMES_PLAYED) {
      window.Lib.playSoundName('game-tie');
    }
    innerHTML += `<${tag}>TIE...</${tag}>`;
  } else if (result === PLAYER) {
    if (numGamesPlayed < MAX_GAMES_PLAYED) {
      window.Lib.playSoundName('game-win');
    }
    innerHTML += `<${tag}>${getRandomPassiveAggressiveWinningPhrase()}</${tag}>`;
    setScore(PLAYER, getScore(PLAYER) + 1);
  } else {
    window.Lib.playSoundName(`ai-laugh${getScore(CPU)}`);
    innerHTML += `<${tag}>${getGloatingPhrase(getScore(CPU))}</${tag}>`;
    setScore(CPU, getScore(CPU) + 1);
  }

  if (numGamesPlayed === MAX_GAMES_PLAYED || getScore(CPU) >= 3) {
    if (getScore(CPU) >= 3) {
      // window.Lib.playSoundName('game-win');
    } else {
      window.Lib.playSoundName('match-win');
    }

    setTimeout(() => {
      end();
    }, 5000);
    innerHTML +=
      '<div style="display:flex; justify-content: center">GAME OVER</div>';
    innerHTML += '</div>';
  } else {
    innerHTML +=
      '<div style="display:flex; justify-content: center"><button onclick="newGameFromButton()"> Next Game! </button></div>';
    innerHTML += '</div>';
  }
  innerHTML += `<div>Game ${numGamesPlayed}/${MAX_GAMES_PLAYED}</div>`;
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

window.newGameFromButton = function () {
  window.Lib.playSoundName('next-game');
  newGame();
};

const newGame = () => {
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

const end = (window.end = () => {
  const wins = getScore(PLAYER);
  const losses = getScore(CPU);
  let score = 0;
  if (losses >= 3) {
    score = -1;
  } else {
    score = wins;
  }
  isPlaying = false;
  // Tells Lib the game is done
  window.Lib.notifyGameCompleted(score);
  menu();
});

const menu = () => {
  clear();
  clearInterval(menuFlashInterval);
  // isPlaying = true;

  document.getElementById('score-area').style.display = 'none';
  if (window.Lib.getConfig().startButtonEnabled) {
    const startButton = document.getElementById('start');
    if (startButton) startButton.style.display = 'block';
  }

  let flashOn = true;

  const drawMenu = () => {
    clear();
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    ctx.font = '36px retro';
    ctx.textAlign = 'center';

    if (flashOn) {
      ctx.strokeText('Tic Tac Toe', canvas.width / 2, canvas.height / 4);
    } else {
      ctx.fillText('Tic Tac Toe', canvas.width / 2, canvas.height / 4);
    }

    ctx.font = '24px retro';
    ctx.fillText(
      'Insert Token To Play',
      canvas.width / 2,
      canvas.height / 2 + 94
    );
    ctx.fillText(
      `1 Token = ${MAX_GAMES_PLAYED} Games`,
      canvas.width / 2,
      canvas.height / 2 + 94 + 32
    );

    drawX(96, 188);
    drawO(canvas.width - 96, 188);

    flashOn = !flashOn;
  };

  menuFlashInterval = setInterval(drawMenu, 1000);
  drawMenu();
};

const loading = () => {};

// exports -------------------------------------------------------------------------------

let menuFlashInterval = 0;
const start = () => {
  // Tells lib.js the game is running
  window.Lib.notifyGameStarted();

  window.Lib.playSoundName('game-start');

  clear();
  clearInterval(menuFlashInterval);
  isPlaying = true;
  numGamesPlayed = 0;

  document.getElementById('score-area').style.display = 'flex';
  if (window.Lib.getConfig().startButtonEnabled) {
    const startButton = document.getElementById('start');
    if (startButton) startButton.style.display = 'none';
  }

  setScore(PLAYER, 0);
  setScore(CPU, 0);
  newGame();
};

const init = async () => {
  loading();
  await Promise.all([
    window.Lib.loadSound('game-start', 'tic-tac-toe-game-start.mp3'),
    window.Lib.loadSound('game-win', 'tic-tac-toe-game-win.mp3'),
    window.Lib.loadSound('game-tie', 'tic-tac-toe-game-tie.mp3'),
    window.Lib.loadSound('next-game', 'tic-tac-toe-next-game.mp3'),
    window.Lib.loadSound('match-win', 'tic-tac-toe-match-win.mp3'),
    window.Lib.loadSound('ai-laugh0', 'tic-tac-toe-ai-laugh1.mp3'),
    window.Lib.loadSound('ai-laugh1', 'tic-tac-toe-ai-laugh2.mp3'),
    window.Lib.loadSound('ai-laugh2', 'tic-tac-toe-ai-laugh3.mp3'),
  ]);

  // accidentally exported all these sounds super loud
  window.Lib.setVolume(0.5);

  // need this to prevent load timeout in lib.js
  window.Module.jsLoaded();
  document.getElementById('game').style.display = 'flex';
  window.Lib.notifyGameReady();

  // need this so font doesn't pop into view jarringly
  setTimeout(function () {
    document.fonts
      .load('42px "retro"')
      .then(() => {
        menu();
      })
      .catch(() => {});
  }, 0);

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
        if (isPlaying) {
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
    }
  });

  canvas.addEventListener('mousemove', ev => {
    if (isPlaying) {
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
          const lastX = cursorX;
          const lastY = cursorY;
          cursorX = x;
          cursorY = y;

          if (lastX !== cursorX || lastY !== cursorY) {
            draw(board);
          }
        }
      }
    }
  });

  window.addEventListener('keydown', ev => {
    if (isPlaying) {
      if (ev.key === 'ArrowLeft') {
        cursorX = (cursorX + 3 - 1) % 3;
      } else if (ev.key === 'ArrowRight') {
        cursorX = (cursorX + 1) % 3;
      } else if (ev.key === 'ArrowUp') {
        cursorY = (cursorY + 3 - 1) % 3;
      } else if (ev.key === 'ArrowDown') {
        cursorY = (cursorY + 1) % 3;
      } else if (ev.key.toLowerCase() === 'x') {
        if (currentTurn === PLAYER) {
          const i = cursorX * 3 + cursorY;
          onPositionSelected(i);
        } else if (currentTurn === NONE && numGamesPlayed < 3) {
          window.newGameFromButton();
        }
      }
      draw(board);
    } else {
      // HACK checking the start button visibility as a way to know if the game is initiated
      // from an arcade machine or if somebody just loaded the page
      if (
        ev.key.toLowerCase() === 'x' &&
        document.getElementById('start').style.display !== 'none'
      ) {
        start();
      }
    }
  });
};

window.init = init;
window.start = start;
