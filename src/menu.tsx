/* @jsx h */
import { loadRes } from 'controller/res-loader';
import { getCurrentScene, getResPath, setUseZip } from 'model/generics';
import {
  loadSound,
  loadSoundSpritesheet,
  playSoundName,
  SoundType,
  stopCurrentMusic,
} from 'model/sound';
import { randInArr } from 'utils';
import { colors } from 'view/style';
import { h, render } from 'preact';
import { loadDynamicPropsTileset } from 'model/room';
import { initScene } from 'model/scene';
import initDb from 'db';
import { loadTiles } from 'model/sprite';
import {
  loadSettingsFromLS,
  setCurrentSettings,
} from 'controller/save-management';
import MainMenu from 'view/components/MainMenu';
import { initEvents } from 'controller/events';
import { playMusic, playSound } from 'controller/scene/scene-commands';
import { mountUi } from 'view/ui';

const SCALE = 4;
const SQUARE_SIZE = 7 * SCALE;
const BORDER_SIZE = 1 * SCALE;

const widthPx = 25 * (SQUARE_SIZE + BORDER_SIZE);
const heightPx = 27 * (SQUARE_SIZE + BORDER_SIZE);
let rotateInterval: any = -1;
let isRotateEnabled = false;

const colorMapping = {
  10: colors.GREY,
  11: colors.DARKGREY_ALT,
  14: colors.RED,
  15: colors.LIGHTRED,
  12: colors.DARKBLUE_ALT,
  13: colors.LIGHTBLUE,
};

const csv = `
0,0,0,0,0,0,0,0,0,0,0,10,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,10,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,10,10,10,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,10,10,11,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,10,10,10,10,10,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,10,11,10,10,10,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
14,14,14,0,0,14,14,14,14,10,10,14,14,14,10,14,14,14,14,0,14,0,0,0,14,0,0,0,0,0,
14,0,0,14,0,14,0,0,10,10,14,10,10,10,11,14,0,0,0,0,14,14,0,14,14,0,0,0,0,0,
15,15,15,0,0,15,15,15,15,10,15,10,15,15,10,15,15,15,15,0,15,0,15,0,15,0,0,0,0,0,
14,0,0,14,0,14,0,0,10,10,14,10,10,14,10,14,0,0,0,0,14,0,14,0,14,0,0,0,0,0,
14,0,0,14,0,14,14,14,14,0,10,14,14,10,0,14,14,14,14,0,14,0,14,0,14,0,0,0,0,0,
0,0,0,0,0,0,0,10,10,11,10,10,10,10,10,10,10,0,0,0,0,0,0,0,0,0,0,0,0,0,
12,0,0,0,0,12,0,11,12,10,12,12,12,10,10,10,12,12,0,0,0,12,12,12,12,0,0,0,0,0,
12,0,0,0,0,12,10,10,12,10,12,10,10,12,10,12,10,10,12,0,12,0,0,0,0,0,0,0,0,0,
13,0,0,0,0,13,10,10,13,10,13,10,10,13,11,13,10,10,13,0,0,13,13,13,0,0,0,0,0,0,
12,0,0,0,0,12,10,10,12,10,12,10,10,12,10,12,10,10,12,0,0,0,0,0,12,0,0,0,0,0,
12,12,12,12,0,0,12,12,10,0,12,12,12,0,10,0,12,12,0,0,12,12,12,12,0,0,0,0,0,0,
0,0,0,0,0,0,10,11,10,0,10,10,10,10,10,10,10,10,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,10,10,10,10,10,10,11,10,0,10,10,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,10,10,10,10,0,10,10,10,10,10,10,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,10,11,0,10,0,10,11,10,10,0,10,10,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,10,10,0,10,10,0,10,0,10,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,10,0,0,11,10,10,0,10,0,10,10,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,10,0,10,0,10,0,10,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,10,0,0,0,10,0,0,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,10,0,0,0,0,11,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,10,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
`.slice(1, -1);

interface MenuSquare {
  nextX: number;
  nextY: number;
  resultX: number;
  resultY: number;
  color: string;
  div?: HTMLDivElement;
  timeoutId: any;
}

const clearRotateInterval = () => {
  clearInterval(rotateInterval);
  isRotateEnabled = false;
};

const convertCsvToSquares = (csv: string) => {
  const rows = csv.split('\n');
  const ret: MenuSquare[] = [];
  rows.forEach((row, y) => {
    if (row[row.length - 1] === ',') {
      row = row.slice(0, -1);
    }
    row.split(',').forEach((numStr, x) => {
      const num = parseInt(numStr);
      const color = colorMapping[num];
      if (color) {
        const xVal = x * (SQUARE_SIZE + BORDER_SIZE);
        const yVal = y * (SQUARE_SIZE + BORDER_SIZE);
        ret.push({
          nextX: xVal,
          nextY: yVal,
          resultX: xVal,
          resultY: yVal,
          color,
          timeoutId: null,
        });
      }
    });
  });

  const retShuffled: MenuSquare[] = [];
  const len = ret.length;
  for (let i = 0; i < len; i++) {
    const v = randInArr(ret);
    const ind = ret.indexOf(v);
    ret.splice(ind, 1);
    retShuffled.push(v);
  }
  return retShuffled;
};

const addSquares = (map: MenuSquare[]) => {
  const parent2 = document.createElement('div');
  parent2.style.position = 'fixed';
  parent2.style.background = colors.WHITE;
  parent2.style.left = '0px';
  parent2.style.top = '0px';
  parent2.style.width = '100%';
  parent2.style.height = '100%';
  parent2.style.display = 'flex';
  parent2.style['justify-content'] = 'center';
  parent2.style['align-items'] = 'center';
  parent2.style['flex-direction'] = 'column';
  parent2.style['padding-top'] = '0px';
  parent2.style.transition = 'padding-top 300ms ease-out';

  const parent = document.createElement('div');
  parent.style.position = 'relative';
  parent.style.width = widthPx + 'px';
  parent.style.height = heightPx + 'px';
  map.forEach((square, i) => {
    const div = document.createElement('div');
    div.id = 'square-' + i;
    div.style.position = 'absolute';
    div.style.transition = 'transform 1000ms ease-in-out';
    div.style.left = '0px';
    div.style.top = '0px';
    div.style.width = SQUARE_SIZE + 'px';
    div.style.height = SQUARE_SIZE + 'px';
    div.style.background = square.color;
    if (square.color === colors.RED || square.color === colors.DARKBLUE_ALT) {
      div.style['border-radius'] = '6px';
    }
    div.style.transform = 'translate(0px, 0px)';
    parent.appendChild(div);
    square.div = div;
  });

  parent2.appendChild(parent);
  document.body.appendChild(parent2);
  return parent2;
};

const moveSquaresToLogo = (map: MenuSquare[]) => {
  clearRotateInterval();

  map.forEach(square => {
    const { resultX, resultY, div, timeoutId } = square;
    if (div) {
      div.style.transition = `transform ${
        750 + Math.floor(Math.random() * 500)
      }ms ease-out`;
      div.style.transform = `translate(${resultX}px, ${resultY}px)`;
      clearTimeout(timeoutId);
    }
  });
  setTimeout(() => {
    isRotateEnabled = true;
  }, 1000);
  rotateInterval = setInterval(() => {
    const numRotations = Math.floor(7 - Math.random() * 10);
    if (numRotations <= 0 || !isRotateEnabled) {
      return;
    }
    for (let i = 0; i < numRotations; i++) {
      const square = randInArr(map);
      const { div, resultX, resultY } = square;
      if (div) {
        div.style.transition = `transform 250ms ease-out`;
        setTimeout(() => {
          div.style.transform = `translate(${resultX}px, ${resultY}px) rotate(360deg)`;
          setTimeout(() => {
            div.style.transition = `transform 0ms ease-out`;
            div.style.transform = `translate(${resultX}px, ${resultY}px) rotate(0deg)`;
          }, 250);
        }, 100);
      }
    }
  }, 500);
};

const moveSquaresToField = (map: MenuSquare[]) => {
  clearRotateInterval();

  const moveSquareToRandomLocation = (square: MenuSquare) => {
    const { div } = square;
    if (div) {
      const x = Math.round(Math.random() * (widthPx * 2)) - widthPx / 2;
      const y = Math.round(Math.random() * (heightPx * 2)) - heightPx / 2;
      const duration = 5000 + Math.random() * 5000;

      div.style.transition = `transform ${duration}ms ease-out`;
      div.style.transform = `translate(${x}px, ${y}px)`;

      square.timeoutId = setTimeout(() => {
        moveSquareToRandomLocation(square);
      }, duration);
    }
  };

  map.forEach(square => {
    clearTimeout(square.timeoutId);
    moveSquareToRandomLocation(square);
    clearTimeout(square.timeoutId);
    square.timeoutId = setTimeout(() => {
      moveSquareToRandomLocation(square);
    }, 100);
  });
};

const moveSquaresToPlus = (
  map: MenuSquare[],
  crossX: () => number,
  crossY: () => number,
  start?: boolean
) => {
  clearRotateInterval();

  const moveSquareToRow = (square: MenuSquare, d?: number) => {
    const duration = d ?? 8000 + Math.random() * 8000;
    const variance = 5 - Math.random() * 10;
    const { div } = square;
    if (div) {
      const x = Math.round(Math.random() * (widthPx * 2)) - widthPx / 2;
      div.style.transition = `transform ${duration}ms ease-out`;
      div.style.transform = `translate(${x}px, ${crossY() + variance}px)`;

      square.timeoutId = setTimeout(() => {
        moveSquareToRow(square);
      }, duration);
    }
  };

  const moveSquareToCol = (square: MenuSquare, d?: number) => {
    const duration = d ?? 8000 + Math.random() * 8000;
    const variance = 5 - Math.random() * 10;
    const { div } = square;
    if (div) {
      const y = Math.round(Math.random() * (heightPx * 2)) - heightPx / 2;
      div.style.transition = `transform ${duration}ms ease-out`;
      div.style.transform = `translate(${crossX() + variance}px, ${y}px)`;

      square.timeoutId = setTimeout(() => {
        moveSquareToCol(square);
      }, duration);
    }
  };

  map.forEach(square => {
    clearTimeout(square.timeoutId);
    if (Math.random() >= 0.5) {
      moveSquareToRow(square, 750);
      clearTimeout(square.timeoutId);
      square.timeoutId = setTimeout(
        () => {
          moveSquareToRow(square);
        },
        start ? 50 : 750
      );
    } else {
      moveSquareToCol(square, 750);
      clearTimeout(square.timeoutId);
      square.timeoutId = setTimeout(
        () => {
          moveSquareToCol(square);
        },
        start ? 50 : 750
      );
    }
  });
};

const moveSquaresUp = (map: MenuSquare[]) => {
  clearRotateInterval();
  map.forEach(square => {
    clearTimeout(square.timeoutId);
    const duration = 3000;
    const { div } = square;
    if (div) {
      const x = Math.round(Math.random() * (widthPx * 2)) - widthPx / 2;
      div.style.transition = `transform ${duration}ms ease-out`;
      div.style.transform = `translate(${x}px, ${-1000}px) rotate(${
        1000 + Math.random() * 1000
      }deg) scale(0.1)`;
    }
  });
};

const mountMenu = (
  div: HTMLDivElement,
  hide: (isNewGame: boolean) => Promise<void>,
  map: MenuSquare[]
) => {
  render(
    <MainMenu
      squareCommands={{
        plus: () => {
          const crossX = () => window.innerWidth / 2 + 50;
          const crossY = () => window.innerHeight / 2 + 50;
          moveSquaresToPlus(map, crossX, crossY);
        },
        plus2: () => {
          const crossX = () => window.innerWidth / 2 - 50;
          const crossY = () => window.innerHeight / 2 - 50;
          moveSquaresToPlus(map, crossX, crossY);
        },
        plus3: () => {
          const crossX = () => 10;
          const crossY = () => 10;
          moveSquaresToPlus(map, crossX, crossY);
        },
        logo: () => {
          moveSquaresToLogo(map);
        },
        field: () => {
          moveSquaresToField(map);
        },
        hide,
      }}
    />,
    div
  );
};

const loadPrimaryAssets = async () => {
  initScene();
  initEvents();
  const scene = getCurrentScene();
  await loadSoundSpritesheet('foley/foley.mp3');
  await loadRes();
  await loadDynamicPropsTileset();
  await initDb(scene);
  await loadTiles();

  try {
    const settings = loadSettingsFromLS();
    setCurrentSettings(settings);
    console.log('Settings have been loaded from localStorage.');
  } catch (e) {
    console.log('Settings have NOT been loaded from localStorage.');
  }
};

export const menu = async (): Promise<void> => {
  setUseZip(true);

  loadSound('game_ready', 'game_ready.mp3', SoundType.NORMAL, 1, false);
  mountUi();
  initScene();

  const map = convertCsvToSquares(csv);
  const squareParent = addSquares(map);
  const crossX = () => window.innerWidth / 2 + 50;
  const crossY = () => window.innerHeight / 2 + 50;
  moveSquaresToPlus(map, crossX, crossY, true);

  const pressAnyKey = document.createElement('div');
  pressAnyKey.style.position = 'fixed';
  pressAnyKey.style.left = '0px';
  pressAnyKey.style.top = '0px';
  pressAnyKey.style.width = '100%';
  pressAnyKey.style.height = '100%';
  pressAnyKey.style.display = 'flex';
  pressAnyKey.style['justify-content'] = 'center';
  pressAnyKey.style['align-items'] = 'center';
  pressAnyKey.style.background =
    'radial-gradient(circle, rgba(17,17,17,0) 81%, rgba(17,17,17,1) 93%)';
  pressAnyKey.style.transition = 'opacity 750ms ease-out';

  const pressAnyKeyInnerGradient = document.createElement('div');
  pressAnyKeyInnerGradient.style.position = 'fixed';
  pressAnyKeyInnerGradient.style.width = '100%';
  pressAnyKeyInnerGradient.style.height = '100%';
  pressAnyKeyInnerGradient.style.transition = 'opacity 750ms ease-out';
  pressAnyKeyInnerGradient.style.opacity = '1';
  pressAnyKeyInnerGradient.style.background =
    'radial-gradient(circle, rgba(17, 17, 17, 0) 1%, rgba(17, 17, 17, 1) 4%)';
  pressAnyKey.appendChild(pressAnyKeyInnerGradient);

  const flower = document.createElement('img');
  flower.src = `${getResPath()}/img/flower.png`;
  flower.style.width = '64px';
  flower.style['image-rendering'] = 'pixelated';
  flower.className = 'bob-load';
  pressAnyKey.appendChild(flower);

  const pressAnyKeyInner = document.createElement('div');
  pressAnyKeyInner.innerHTML = 'Press Any Key';
  pressAnyKeyInner.style.padding = '16px';
  pressAnyKeyInner.style.background = colors.DARKGREY;
  pressAnyKeyInner.style['font-size'] = '20px';
  pressAnyKeyInner.style.margin = '16px';
  pressAnyKeyInner.style.border = '2px solid ' + colors.BLUE;
  pressAnyKeyInner.style['font-family'] = 'DataLatin';
  pressAnyKeyInner.style['letter-spacing'] = '1px';
  pressAnyKeyInner.style['border-radius'] = '8px';
  pressAnyKeyInner.style['z-index'] = 1;
  // pressAnyKeyInner.style['border-bottom'] = '2px solid ' + colors.DARKBLUE_ALT;

  pressAnyKey.appendChild(pressAnyKeyInner);

  const flower2: any = flower.cloneNode();
  pressAnyKey.appendChild(flower2);

  document.body.appendChild(pressAnyKey);

  await new Promise<void>(resolve => {
    const touchSomething = () => {
      window.removeEventListener('keydown', touchSomething);
      window.removeEventListener('mousedown', touchSomething);
      resolve();
    };
    window.addEventListener('keydown', touchSomething);
    window.addEventListener('mousedown', touchSomething);
    pressAnyKey.style.display = 'flex';
  });

  playSound('game_ready');
  pressAnyKeyInnerGradient.style.opacity = '0';
  pressAnyKeyInner.style.background = colors.GREY;
  pressAnyKeyInner.innerHTML = 'Loading...';
  flower.className = 'spin-load-fast';
  flower2.className = 'spin-load-fast';

  await new Promise<void>(resolve => {
    setTimeout(resolve, 100);
  });

  console.log('load assets');
  console.time('assets');
  await loadPrimaryAssets();
  console.timeEnd('assets');

  playMusic('music_menu');

  pressAnyKey.style.opacity = '0';

  squareParent.style['justify-content'] = 'flex-start';
  squareParent.style['padding-top'] = '32px';
  moveSquaresToLogo(map);

  await new Promise<void>(resolve => {
    setTimeout(resolve, 1000);
  });
  pressAnyKey.remove();

  const hideMenu = async (isNewGame: boolean) => {
    if (isNewGame) {
      stopCurrentMusic(800);
      squareParent.style.transition = 'background-color 1000ms linear';
      squareParent.style['background-color'] = colors.BLACK;
      menuPrimary.style.transition = 'opacity 800ms linear';
      menuPrimary.style.opacity = '0';
      clearRotateInterval();
      await new Promise<void>(resolve => {
        setTimeout(resolve, 2500);
      });

      playSoundName('menu_sparkle');
      moveSquaresUp(map);

      await new Promise<void>(resolve => {
        setTimeout(resolve, 2000);
      });

      squareParent.remove();
      menuPrimary.remove();
    } else {
      stopCurrentMusic(800);
      squareParent.style.transition =
        'background-color 1000ms linear, opacity 1000ms linear';
      squareParent.style['background-color'] = colors.BLACK;
      squareParent.style.opacity = '0';
      menuPrimary.style.transition = 'opacity 800ms linear';
      menuPrimary.style.opacity = '0';
      clearRotateInterval();
      await new Promise<void>(resolve => {
        setTimeout(resolve, 1500);
      });
      squareParent.remove();
      menuPrimary.remove();
    }
  };

  const menuPrimary = document.createElement('div');
  document.body.appendChild(menuPrimary);
  mountMenu(menuPrimary, hideMenu, map);
};
