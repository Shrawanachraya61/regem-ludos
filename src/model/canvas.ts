const SCREEN_WIDTH = 512;

let mainCanvas: HTMLCanvasElement | null = null;
let frameMultiplier = 1;
let elapsedMs = 0;

// Create a canvas element given a width and a height, returning a reference to the
// canvas, the rendering context, width, and height
export const createCanvas = (
  width: number,
  height: number
): [HTMLCanvasElement, CanvasRenderingContext2D, number, number] => {
  const canvas = document.createElement('canvas');
  canvas.width = width || 1;
  canvas.height = height || 1;
  return [
    canvas,
    canvas.getContext('2d') as CanvasRenderingContext2D,
    width,
    height,
  ];
};

// get a reference to the current canvas.  If it has not been made yet, then create it,
// append it to the body, then return a reference to it.
export const getCanvas = (): HTMLCanvasElement => {
  if (mainCanvas) {
    return mainCanvas as HTMLCanvasElement;
  } else {
    const [canvas, ctx] = createCanvas(SCREEN_WIDTH, SCREEN_WIDTH);
    canvas.id = 'canv';
    ctx.imageSmoothingEnabled = false;
    const div = document.getElementById('canvas-container');
    if (div) {
      div.appendChild(canvas);
    } else {
      console.warn('Failed to acquire parent div for primary canvas.');
    }
    mainCanvas = canvas;
    return canvas;
  }
};

// get a reference to the current rendering context
export const getCtx = (): CanvasRenderingContext2D => {
  return getCanvas().getContext('2d') as CanvasRenderingContext2D;
};

// return the value to multiply all position and time values by in order to simulate
// rendering at a consistent speed (as if it were 60 FPS).
// Without this value, the game's physics are tied to the FPS, so a higher FPS results
// in a faster game, while lower FPS results in a slower game.
export const setFrameMultiplier = (v: number): void => {
  frameMultiplier = v;
};
export const getFrameMultiplier = (): number => {
  return frameMultiplier;
};
export const setElapsedMs = (v: number): void => {
  elapsedMs = v;
};
export const getElapsedMs = (): number => {
  return elapsedMs;
};

export const getScreenSize = (): number => {
  return SCREEN_WIDTH;
};
