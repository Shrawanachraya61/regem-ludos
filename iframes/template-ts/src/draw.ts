let canvas = document.createElement('canvas');
let ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
let SCREEN_WIDTH = 1;
let SCREEN_HEIGHT = 1;

export const initDraw = (c: HTMLCanvasElement, w: number, h: number) => {
  canvas = c;
  ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  SCREEN_WIDTH = w;
  SCREEN_HEIGHT = h;
};

export const getCtx = (): CanvasRenderingContext2D => {
  return canvas.getContext('2d') as CanvasRenderingContext2D;
};

export const clearScreen = (ctx?: CanvasRenderingContext2D): void => {
  ctx = ctx || getCtx();
  ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
};

export const drawRectangle = (
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  deg?: number
) => {
  ctx.save();
  ctx.beginPath();
  var cx = x + 0.5 * w;
  var cy = y + 0.5 * h;

  ctx.translate(cx, cy);
  ctx.rotate((Math.PI / 180) * (deg ?? 0));
  ctx.translate(-cx, -cy);

  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
};

export const drawCircle = (x: number, y: number, r: number, color: string) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI, false);
  ctx.fillStyle = color;
  ctx.fill();
};

export interface DrawTextParams {
  font?: string;
  color?: string;
  size?: number;
  align?: 'left' | 'center' | 'right';
  strokeColor?: string;
}
export const DEFAULT_TEXT_PARAMS: DrawTextParams = {
  font: 'monospace',
  color: '#fff',
  size: 14,
  align: 'left',
  strokeColor: '',
};

export const drawText = (
  text: string,
  x: number,
  y: number,
  textParams?: DrawTextParams,
  ctx?: CanvasRenderingContext2D
): void => {
  const { font, size, color, align, strokeColor } = {
    ...DEFAULT_TEXT_PARAMS,
    ...(textParams || {}),
  };
  ctx = ctx || getCtx();
  if (strokeColor) {
    const color = strokeColor;
    drawText(
      text,
      x + 1,
      y + 1,
      {
        font,
        size,
        color,
        align: align as any,
      },
      ctx
    );
  }
  ctx.font = `${size}px ${font}`;
  ctx.fillStyle = color || '#FFF';
  ctx.textAlign = align as CanvasTextAlign;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
};

export const setGlobalAlpha = (v: number, ctx?: CanvasRenderingContext2D) => {
  ctx = ctx || getCtx();
  ctx.globalAlpha = v;
};
