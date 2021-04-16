import { Sprite, getSprite } from 'model/sprite';
import { Animation } from 'model/animation';
import { getCanvas, getCtx, getScreenSize } from 'model/canvas';
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  Room,
  Prop,
  tilePosToWorldPos,
} from 'model/room';
import { isoToPixelCoords, Point } from 'utils';
import {
  Character,
  characterGetAnimation,
  characterGetPos,
  characterGetPosBottom,
  characterGetPosTopLeft,
  characterGetSize,
} from 'model/character';
import { Particle, particleGetPos } from 'model/particle';
import { colors } from './style';
import {
  getMarkersVisible,
  getTriggersVisible,
  getCurrentPlayer,
} from 'model/generics';

export interface DrawTextParams {
  font?: string;
  color?: string;
  size?: number;
  align?: 'left' | 'center' | 'right';
  strokeColor?: string;
}
const DEFAULT_TEXT_PARAMS = {
  font: 'monospace',
  color: '#fff',
  size: 14,
  align: 'left',
  strokeColor: '',
};

export const clearScreen = (ctx?: CanvasRenderingContext2D): void => {
  ctx = ctx || getCtx();
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

export const setGlobalAlpha = (v: number, ctx?: CanvasRenderingContext2D) => {
  ctx = ctx || getCtx();
  ctx.globalAlpha = v;
};

export const getImageDataScreenshot = (
  ctx?: CanvasRenderingContext2D
): ImageData => {
  ctx = ctx || getCtx();
  return ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
};

export const drawRect = (
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  stroke?: boolean,
  ctx?: CanvasRenderingContext2D
): void => {
  ctx = ctx || getCtx();
  ctx.lineWidth = 1;
  ctx[stroke ? 'strokeStyle' : 'fillStyle'] = color;
  ctx[stroke ? 'strokeRect' : 'fillRect'](Math.floor(x), Math.floor(y), w, h);
};

export const drawCircle = (
  x: number,
  y: number,
  r: number,
  color: string,
  stroke?: boolean,
  ctx?: CanvasRenderingContext2D
): void => {
  ctx = ctx || getCtx();
  ctx.lineWidth = 1;
  ctx[stroke ? 'strokeStyle' : 'fillStyle'] = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx[stroke ? 'stroke' : 'fill']();
};

export const measureText = (
  text: string,
  textParams: DrawTextParams,
  ctx?: CanvasRenderingContext2D
): Point => {
  ctx = ctx || getCtx();
  const { font, size } = {
    ...DEFAULT_TEXT_PARAMS,
    ...(textParams || {}),
  };
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = size + 'px ' + font;
  const width = ctx.measureText(text).width;
  const height = size;
  return [width, height];
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
  ctx.font = `${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = align as CanvasTextAlign;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 0.5;
    ctx.strokeText(text, Math.floor(x), Math.floor(y));
  }
};

export const drawSprite = (
  sprite: string | Sprite,
  x: number,
  y: number,
  scale?: number,
  ctx?: CanvasRenderingContext2D
): void => {
  scale = scale || 1;
  ctx = ctx || getCtx();
  if (sprite === 'invisible') {
    return;
  }

  try {
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    const [image, sprX, sprY, sprW, sprH] =
      typeof sprite === 'string' ? getSprite(sprite) : sprite;
    ctx.drawImage(
      image,
      sprX,
      sprY,
      sprW,
      sprH,
      Math.floor(x),
      Math.floor(y),
      sprW * scale,
      sprH * scale
    );
  } catch (e) {
    console.error(sprite);
    throw new Error('Could not draw sprite: ' + e);
  }
};

export const drawAnimation = (
  anim: Animation,
  x: number,
  y: number,
  scale?: number,
  ctx?: CanvasRenderingContext2D
): void => {
  scale = scale || 1;
  ctx = ctx || getCtx();
  anim.update();
  const sprite = anim.getSprite();
  if (!sprite) {
    console.error(anim);
    throw new Error(`Cannot draw animation that did not provide a sprite.`);
  }
  try {
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    const [image, sprX, sprY, sprW, sprH] =
      typeof sprite === 'string' ? getSprite(sprite) : sprite;
    ctx.drawImage(
      image,
      sprX,
      sprY,
      sprW,
      sprH,
      Math.floor(x),
      Math.floor(y),
      sprW * scale,
      sprH * scale
    );
  } catch (e) {
    throw new Error(`Error attempting to draw animation sprite: "${sprite}"`);
  }
};

// NF = no Math.floor
export const drawAnimationNF = (
  anim: Animation,
  x: number,
  y: number,
  scale?: number,
  ctx?: CanvasRenderingContext2D
): void => {
  scale = scale || 1;
  ctx = ctx || getCtx();
  anim.update();
  const sprite = anim.getSprite();
  if (!sprite) {
    console.error(anim);
    throw new Error(`Cannot draw animation that did not provide a sprite.`);
  }
  try {
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    const [image, sprX, sprY, sprW, sprH] =
      typeof sprite === 'string' ? getSprite(sprite) : sprite;
    ctx.drawImage(
      image,
      sprX,
      sprY,
      sprW,
      sprH,
      x,
      y,
      sprW * scale,
      sprH * scale
    );
  } catch (e) {
    throw new Error(`Error attempting to draw animation sprite: "${sprite}"`);
  }
};

export type Polygon = Point[];

export const drawPolygon = (
  polygon: Polygon,
  color: string,
  scale?: number,
  ctx?: CanvasRenderingContext2D
): void => {
  scale = scale || 1;
  ctx = ctx || getCtx();
  ctx.fillStyle = color;
  ctx.beginPath();

  const firstPoint = polygon[0];
  const [x, y] = firstPoint;
  const [px, py] = isoToPixelCoords(x, y, 0);
  ctx.moveTo(px, py);
  for (let i = 1; i < polygon.length; i++) {
    const point = polygon[i];
    const [x, y] = point;
    const [px, py] = isoToPixelCoords(x, y, 0);
    ctx.lineTo(px, py);
  }

  ctx.closePath();
  ctx.lineWidth = 2;
  ctx.stroke();
};

export const drawCharacter = (
  ch: Character,
  scale?: number,
  ctx?: CanvasRenderingContext2D
): void => {
  const [x, y, z] = characterGetPosTopLeft(ch);
  const anim = characterGetAnimation(ch);
  let [px, py] = isoToPixelCoords(x, y, z);
  ctx = ctx || getCtx();

  // HACK: Make the collision from the top left actually make some sort of visual sense
  px += 1;
  py += 0;

  if (anim.isPaused) {
    const sprite = anim.getSprite();
    if (!sprite) {
      console.error(anim);
      throw new Error(
        `Cannot draw paused character that did not provide a sprite.`
      );
    }
    drawSprite(sprite, px, py, scale, ctx);
    if (ch.highlighted) {
      ctx.globalCompositeOperation = 'multiply';
      drawSprite(sprite, px, py, scale, ctx);
      ctx.globalCompositeOperation = 'source-over';
    }
  } else {
    drawAnimation(anim, px, py, scale, ctx);
    if (ch.highlighted) {
      ctx.globalCompositeOperation = 'multiply';
      drawAnimation(anim, px, py, scale, ctx);
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  // {
  //   const [x, y] = characterGetPosBottom(ch);
  //   const [px, py] = isoToPixelCoords(x, y, z);
  //   // const yOffset = 8;
  //   // const xOffset = 16 + 8;
  //   drawRect(px, py, 4, 4, 'green');
  // }

  // if (ch.walkTarget) {
  //   const [x, y] = ch.walkTarget;
  //   const [px, py] = isoToPixelCoords(x, y, z);
  //   // const yOffset = 8;
  //   // const xOffset = 16 + 8;
  //   drawRect(px, py, 4, 4, 'blue');
  // }
};

export const drawParticle = (
  particle: Particle,
  scale?: number,
  ctx?: CanvasRenderingContext2D
): void => {
  const [px, py] = particleGetPos(particle);
  const { anim, text, textParams, opacity, w, h, color, shape } = particle;
  ctx = ctx ?? getCtx();
  ctx.globalAlpha = opacity ?? 1;
  if (anim) {
    drawAnimation(
      anim,
      px,
      py,
      scale ? scale * particle.scale : particle.scale,
      ctx
    );
  }
  if (text && textParams) {
    drawText(text, px, py, textParams);
  }
  if (w && h && color && shape) {
    if (shape === 'rect') {
      drawRect(px - w / 2, py - h / 2, w, h, color, false, ctx);
    } else if (shape === 'circle') {
      drawCircle(px, py, w, color, false, ctx);
    }
  }
  ctx.globalAlpha = 1;
};

export const drawRoom = (
  room: Room,
  offset: Point,
  ctx?: CanvasRenderingContext2D,
  isPaused?: boolean
): void => {
  const { particles } = room;
  const [offsetX, offsetY] = offset;

  ctx = ctx || getCtx();
  ctx.save();
  ctx.translate(Math.floor(offsetX), Math.floor(offsetY));
  room.renderObjects = room.renderObjects.sort((a, b) => {
    return a.sortY < b.sortY ? -1 : 1;
  });

  // if (!isPaused) {
  //   for (let i = 0; i < particles.length; i++) {
  //     const p = particles[i];
  //     if (p
  //     drawParticle(p);
  //   }
  // }

  // if (room.floor) {
  //   drawSprite(room.floor, -room.widthPx / 2, 0);
  // }

  for (let i = 0; i < room.renderObjects.length; i++) {
    const {
      name,
      sprite,
      anim,
      character,
      px,
      py,
      origPy,
      highlighted,
      visible,
      isMarker,
      isTrigger,
      polygon,
    } = room.renderObjects[i];
    if (!visible) {
      continue;
    }

    if (isPaused) {
      if (character) {
        drawCharacter(character);
      }
    } else {
      if (isMarker) {
        if (getMarkersVisible()) {
          drawText(name || '', (px as number) + 16, py as number, {
            align: 'center',
            color: colors.WHITE,
            size: 12,
          });
          drawSprite(sprite as string, px as number, py as number);
        }
      } else if (isTrigger) {
        if (getTriggersVisible()) {
          if (polygon) {
            const point = polygon[0];
            const [x, y] = point;
            const [px, py] = isoToPixelCoords(x, y, 0);
            drawPolygon(polygon, 'rgba(0, 0, 0, 0.5)');
            drawText(name || '', px, py, {
              align: 'center',
              color: colors.PINK,
              size: 12,
            });
          } else {
            drawSprite(sprite as string, px as number, py as number);
            drawText(name || '', (px as number) + 16, py as number, {
              align: 'center',
              color: colors.PINK,
              size: 12,
            });
          }
        }
      } else if (anim) {
        drawAnimation(anim, px as number, py as number);
      } else if (sprite) {
        drawSprite(sprite, px as number, py as number);
        if (highlighted) {
          drawSprite('indicator', px as number, (origPy as number) - 3);
        }
      } else if (character) {
        drawCharacter(character);
      }
    }
  }

  const player = getCurrentPlayer();
  const leader = player.leader;
  ctx.globalAlpha = 0.25;
  ctx.globalCompositeOperation = 'luminosity';
  drawCharacter(leader);
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';

  if (!isPaused) {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      drawParticle(p);
    }
  }

  ctx.restore();

  const outerCtx = getCtx('outer');
  const [x, y] = characterGetPos(leader);
  drawText(
    `POS: ${x.toFixed(0)}, ${y.toFixed(0)}`,
    20,
    100,
    {
      color: 'white',
      size: 32,
    },
    outerCtx
  );
};
