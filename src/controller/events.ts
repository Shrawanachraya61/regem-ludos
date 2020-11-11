import { setMousePos, setKeyDown, setKeyUp } from 'model/misc';
import { CANVAS_ID } from 'model/canvas';

export const initEvents = (): void => {
  const canvasElem = document.getElementById(CANVAS_ID);
  const { left, top, width, height } = canvasElem?.getBoundingClientRect() || {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  };
  window.addEventListener('mousemove', (ev: MouseEvent) => {
    const { clientX, clientY } = ev;
    let mouseX = clientX - left;
    let mouseY = clientY - top;
    if (mouseX > width) {
      mouseX = width;
    }
    if (mouseY > height) {
      mouseY = height;
    }
    setMousePos(mouseX, mouseY);
  });

  window.addEventListener('keydown', (ev: KeyboardEvent) => {
    setKeyDown(ev.key);

    const handler = getCurrentKeyHandler();
    if (handler) {
      handler(ev);
    }
  });

  window.addEventListener('keyup', (ev: KeyboardEvent) => {
    setKeyUp(ev.key);
  });

  setCurrentKeyHandler((ev: KeyboardEvent) => {
    switch (ev.key) {
      case 'ArrowUp': {
        break;
      }
      case 'ArrowDown': {
        break;
      }
      case 'ArrowLeft': {
        break;
      }
      case 'ArrowRight': {
        break;
      }
      case 'x':
      case 'X': {
        break;
      }
    }
  });
};

type KeyboardHandler = (ev: KeyboardEvent) => void;
let currentKeyHandler: null | KeyboardHandler = null;
export const getCurrentKeyHandler = (): KeyboardHandler | null =>
  currentKeyHandler;
export const setCurrentKeyHandler = (cb: KeyboardHandler): void => {
  currentKeyHandler = cb;
};
