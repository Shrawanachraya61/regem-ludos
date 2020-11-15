import { Sprite, getSprite } from 'model/sprite';
import { Animation } from 'model/animation';
import { getCtx, getScreenSize } from 'model/canvas';
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  Room,
  Prop,
  tilePosToWorldPoint,
} from 'model/room';
import { isoToPixelCoords, Point } from 'utils';
import {
  Character,
  characterGetAnimation,
  characterGetPos,
} from 'model/character';
import { Particle, particleGetPos } from 'model/particle';

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

export const clearScreen = (): void => {
  drawRect(0, 0, getScreenSize(), getScreenSize(), 'black');
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
  const { width, height, tiles, props, characters, particles } = room;
  const [offsetX, offsetY] = offset;

  ctx = ctx || getCtx();
  ctx.save();
  ctx.translate(offsetX, offsetY);

  let highlightedTile: any = null;

  for (let k = 0; k <= width + height - 2; k++) {
    for (let j = 0; j <= k; j++) {
      const i = k - j;
      if (i < height && j < width) {
        const tile = tiles[i * width + j];
        const [px, py] = isoToPixelCoords(
          (tile.x * TILE_WIDTH) / 2,
          (tile.y * TILE_HEIGHT) / 2
        );

        drawSprite(tile.sprite, px, py);

        if (tile.highlighted) {
          highlightedTile = tile;
        }
      }
    }
  }

  if (highlightedTile) {
    const { x, y } = highlightedTile;
    const [tx, ty] = tilePosToWorldPoint(x, y);
    const [px, py] = isoToPixelCoords(tx, ty);
    drawSprite('indicator', px, py);
  }

  room.props = props.sort((a: Prop, b: Prop) => {
    const [, aPy] = isoToPixelCoords(
      (a.x * TILE_WIDTH) / 2,
      (a.y * TILE_HEIGHT) / 2
    );
    const [, bPy] = isoToPixelCoords(
      (b.x * TILE_WIDTH) / 2,
      (b.y * TILE_HEIGHT) / 2
    );

    return aPy < bPy ? -1 : 1;
  });

  for (let i = 0; i < props.length; i++) {
    const prop = props[i];
    const [px, py] = isoToPixelCoords(prop.x, prop.y);
    const [, , , spriteWidth, spriteHeight] = getSprite(prop.sprite);
    drawSprite(
      prop.sprite,
      px - spriteWidth / 2 + TILE_WIDTH / 2, // props are draw bottom-up, centered x
      py - spriteHeight + TILE_HEIGHT / 2
    );
  }

  for (let i = 0; i < characters.length; i++) {
    const ch = characters[i];
    drawCharacter(ch);
  }

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    drawParticle(p);
  }

  ctx.restore();
};
