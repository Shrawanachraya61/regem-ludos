import WebGL2D from 'lib/webgl-canvas';

export const SCREEN_WIDTH = 512;
export const CANVAS_ID = 'canv';
export const CANVAS_ID_OUTER = 'canv-outer';

let mainCanvas: HTMLCanvasElement | null = null;
let outerCanvas: HTMLCanvasElement | null = null;
let drawScale = 1;

// Create a canvas element given a width and a height, returning a reference to the
// canvas, the rendering context, width, and height
export const createCanvas = (
  width: number,
  height: number,
  isGL?: boolean
): [HTMLCanvasElement, CanvasRenderingContext2D, number, number] => {
  const canvas = document.createElement('canvas');
  canvas.width = width || 1;
  canvas.height = height || 1;
  let context: any;
  if (isGL) {
    WebGL2D.enable(canvas);
    context = canvas.getContext('webgl-2d');
  } else {
    context = canvas.getContext('2d');
  }
  return [canvas, context as CanvasRenderingContext2D, width, height];
};

// get a reference to the current canvas.  If it has not been made yet, then create it,
// append it to the body, then return a reference to it.
// Also creates an 'outer' canvas, used for debug and text
export const getCanvas = (type?: string): HTMLCanvasElement => {
  if (type === 'outer' && outerCanvas) {
    return outerCanvas;
  }

  if (mainCanvas) {
    return mainCanvas as HTMLCanvasElement;
  } else {
    const [canvas, ctx] = createCanvas(SCREEN_WIDTH, SCREEN_WIDTH, true);
    canvas.id = CANVAS_ID;
    ctx.imageSmoothingEnabled = false;
    const div = document.getElementById('canvas-container');
    if (div) {
      div.appendChild(canvas);
      const [canvasOuter, ctx] = createCanvas(SCREEN_WIDTH, SCREEN_WIDTH);
      canvasOuter.id = CANVAS_ID_OUTER;
      ctx.imageSmoothingEnabled = false;
      div.appendChild(canvasOuter);
    } else {
      console.warn('Failed to acquire parent div for primary canvas.');
    }
    mainCanvas = canvas;
    return canvas;
  }
};

// get a reference to the current rendering context
export const getCtx = (type?: string): CanvasRenderingContext2D => {
  const canvas = getCanvas(type);
  return (canvas.getContext('2d') ??
    canvas.getContext('webgl-2d')) as CanvasRenderingContext2D;
};

const setDrawScaleCanvas = (canvas: HTMLCanvasElement, s: number) => {
  drawScale = s;
  if (canvas) {
    canvas.style.width = String(SCREEN_WIDTH * drawScale);
    canvas.style.height = String(SCREEN_WIDTH * drawScale);

    if (s > 2) {
      canvas.style.position = 'relative';
      canvas.style.left = -(parseInt(canvas.style.width) / 4) + 'px';
      canvas.style.top = -(parseInt(canvas.style.height) / 4) + 'px';
    }

    // canvas.width = SCREEN_WIDTH * drawScale;
    // canvas.height = SCREEN_WIDTH * drawScale;
  }
};

export const setDrawScale = (s: number): void => {
  drawScale = s;
  const canvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement | null;
  if (canvas) {
    setDrawScaleCanvas(canvas, s);
  }
  const canvasOuter = document.getElementById(
    CANVAS_ID_OUTER
  ) as HTMLCanvasElement | null;
  if (canvasOuter) {
    setDrawScaleCanvas(canvasOuter, s);
    canvasOuter.style.position = 'absolute';
    canvasOuter.style.left = '0px';
    canvasOuter.style.top = '0px';
    outerCanvas = canvasOuter;
  }
};
export const getDrawScale = (): number => {
  return drawScale;
};

export const getScreenSize = (): number => {
  return SCREEN_WIDTH;
};
