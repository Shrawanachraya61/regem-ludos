import { Sprite, getSprite } from 'model/sprite';
import { Animation } from 'model/animation';
import { getCtx, getScreenSize } from 'model/canvas';
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
} from 'model/character';
import { Particle, particleGetPos } from 'model/particle';
import { colors } from './style';

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
  ctx.clearRect(0, 0, getScreenSize(), getScreenSize());
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
  ctx[stroke ? 'strokeRect' : 'fillRect'](x, y, w, h);
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
    ctx.strokeText(text, x, y);
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
  ctx.fill();
};

export const drawCharacter = (
  ch: Character,
  scale?: number,
  ctx?: CanvasRenderingContext2D
): void => {
  const [x, y, z] = characterGetPos(ch);
  const anim = characterGetAnimation(ch);
  // const [, , , spriteWidth, spriteHeight] = getSprite(anim.getSprite());
  const [px, py] = isoToPixelCoords(x, y, z);
  drawAnimation(anim, px, py, scale, ctx);

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
  const { anim, text, textParams } = particle;
  if (anim) {
    drawAnimation(anim, px, py, scale, ctx);
  }
  if (text && textParams) {
    drawText(text, px, py, textParams);
  }
};

export const drawRoom = (
  room: Room,
  offset: Point,
  ctx?: CanvasRenderingContext2D
): void => {
  const { particles } = room;
  const [offsetX, offsetY] = offset;

  ctx = ctx || getCtx();
  ctx.save();
  ctx.translate(offsetX, offsetY);
  room.renderObjects = room.renderObjects.sort((a, b) => {
    return a.sortY < b.sortY ? -1 : 1;
  });

  for (let i = 0; i < room.renderObjects.length; i++) {
    const {
      name,
      sprite,
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

    if (isMarker) {
      drawText(name || '', (px as number) + 16, py as number, {
        align: 'center',
        color: colors.WHITE,
        size: 12,
      });
      drawSprite(sprite as string, px as number, py as number);
    } else if (isTrigger) {
      if (polygon) {
        const point = polygon[0];
        const [x, y] = point;
        const [px, py] = isoToPixelCoords(x, y, 0);
        drawPolygon(polygon, 'rgba(255, 0, 0, 0.33)');
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
    } else if (sprite) {
      drawSprite(sprite, px as number, py as number);
      if (highlighted) {
        drawSprite('indicator', px as number, (origPy as number) - 3);
      }
    } else if (character) {
      drawCharacter(character);
    }
  }

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    drawParticle(p);
  }

  ctx.restore();
};
