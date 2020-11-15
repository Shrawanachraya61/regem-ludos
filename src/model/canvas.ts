export const SCREEN_WIDTH = 512;
export const CANVAS_ID = 'canv';

let mainCanvas: HTMLCanvasElement | null = null;
let drawScale = 1;

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
    canvas.id = CANVAS_ID;
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

export const setDrawScale = (s: number): void => {
  drawScale = s;
  const canvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement | null;
  if (canvas) {
    canvas.style.width = String(SCREEN_WIDTH * drawScale);
    canvas.style.height = String(SCREEN_WIDTH * drawScale);
    // canvas.width = SCREEN_WIDTH * drawScale;
    // canvas.height = SCREEN_WIDTH * drawScale;
  }
};
export const getDrawScale = (): number => {
  return drawScale;
};

export const getScreenSize = (): number => {
  return SCREEN_WIDTH;
};
