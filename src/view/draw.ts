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

  let renderObjects: {
    sprite?: string;
    character?: Character;
    particle?: Particle;
    origPy?: number;
    highlighted?: boolean;
    px?: number;
    py?: number;
    sortY: number;
  }[] = [];

  for (let k = 0; k <= width + height - 2; k++) {
    for (let j = 0; j <= k; j++) {
      const i = k - j;
      if (i < height && j < width) {
        const tile = tiles[i * width + j];
        let [px, py] = isoToPixelCoords(
          (tile.x * TILE_WIDTH) / 2,
          (tile.y * TILE_HEIGHT) / 2
        );
        const origPy = py;
        py -= tile.tileHeight - 32;
        renderObjects.push({
          sprite: tile.sprite,
          origPy,
          px,
          py,
          highlighted: tile.highlighted,
          sortY: py + (tile.tileHeight - 32) + (tile.tileHeight > 32 ? 16 + 4 : 16), // corrects for the tile height
        });

        // drawSprite(tile.sprite, px, py - (tile.tileHeight - 32));
      }
    }
  }

  for (let i = 0; i < props.length; i++) {
    const prop = props[i];
    let [px, py] = isoToPixelCoords(prop.x, prop.y);
    const [, , , spriteWidth, spriteHeight] = getSprite(prop.sprite);
    px -= px - spriteWidth / 2 + TILE_WIDTH / 2;
    py = py - spriteHeight + TILE_HEIGHT / 2;
    renderObjects.push({
      sprite: prop.sprite,
      px,
      py,
      sortY: py + spriteHeight,
    });
    // drawSprite(
    //   prop.sprite,
    //   px - spriteWidth / 2 + TILE_WIDTH / 2, // props are draw bottom-up, centered x
    //   py - spriteHeight + TILE_HEIGHT / 2
    // );
  }

  for (let i = 0; i < characters.length; i++) {
    const ch = characters[i];
    const [x, y, z] = characterGetPos(ch);
    const [, py] = isoToPixelCoords(x, y, z);
    renderObjects.push({
      character: ch,
      sortY: py + 32, // because all characters are 32 px tall (right now)
    });
  }

  // DEBUG: draws makers
  // for (let i in room.markers) {
  //   const marker = room.markers[i];
  //   const {x, y} = marker;
  //   const [px, py] = isoToPixelCoords(x, y, 0);
  //   renderObjects.push({
  //     sprite: 'control_1',
  //     px,
  //     py,
  //     sortY: py + 32, // because all characters are 32 px tall (right now)
  //   });
  // }

  renderObjects = renderObjects.sort((a, b) => {
    return a.sortY < b.sortY ? -1 : 1;
  });

  for (let i = 0; i < renderObjects.length; i++) {
    const { sprite, character, px, py, origPy, highlighted } = renderObjects[i];
    if (sprite) {
      drawSprite(sprite, px as number, py as number);

      if (sprite.indexOf('control_1') === 0) {
        drawRect(px as number + 16 - 4, py as number + 32 - 4, 8, 8, 'orange');
      }
      // if (highlighted) {
      //   drawSprite('indicator', px as number, origPy as number - 3);
      // }
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
