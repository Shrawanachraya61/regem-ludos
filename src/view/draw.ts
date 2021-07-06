import { Sprite, getSprite } from 'model/sprite';
import { Animation } from 'model/animation';
import { getCanvas, getCtx, getScreenSize } from 'model/canvas';
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  Room,
  Prop,
  tilePosToWorldPos,
  roomGetDistanceToNearestWallInFacingDirection,
  roomGetTileBelow,
} from 'model/room';
import {
  isoToPixelCoords,
  degreesToRadians,
  Point,
  pxToCanvasCoords4by3,
  pixelToIsoCoords,
} from 'utils';
import {
  Character,
  characterCanSeeOther,
  characterGetAnimation,
  characterGetCollisionCircle,
  characterGetPos,
  characterGetPosBottom,
  characterGetPosTopLeft,
  characterGetSize,
  characterGetVisionPoint,
} from 'model/character';
import { Particle, particleGetPos } from 'model/particle';
import { colors } from './style';
import {
  getMarkersVisible,
  getTriggersVisible,
  getCurrentPlayer,
  getPlayerWallGlowEnabled,
} from 'model/generics';

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

export const circleToPolygonPx = (x: number, y: number, r: number): Polygon => {
  const polygon: Polygon = [];
  for (let i = 0; i < 360; i += 10) {
    const pointX = x + Math.sin(degreesToRadians(i)) * r;
    const pointY = y + Math.cos(degreesToRadians(i)) * r;
    polygon.push(pxToCanvasCoords4by3(...isoToPixelCoords(pointX, pointY)));
  }
  return polygon;
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
  ctx.strokeStyle = color;
  ctx.beginPath();

  const firstPoint = polygon[0];
  const [x, y] = firstPoint;
  const [px, py] = ctx ? [x, y] : isoToPixelCoords(x, y, 0);
  ctx.moveTo(px, py);
  for (let i = 1; i < polygon.length; i++) {
    const point = polygon[i];
    const [x, y] = point;
    const [px, py] = ctx ? [x, y] : isoToPixelCoords(x, y, 0);
    ctx.lineTo(px, py);
  }

  ctx.closePath();
  ctx.lineWidth = 2;
  ctx.stroke();
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
  const height = size ?? 12;
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

    // DEBUG Collision Circles
    const [x, y, chR] = characterGetCollisionCircle(ch);
    // const [x2, y2] = characterGetPos(other);
    // const chR2 = Math.min(
    //   other.collisionSize[0] / 2,
    //   other.collisionSize[1] / 2
    // );
    drawPolygon(circleToPolygonPx(x, y, chR), 'black', 1, getCtx('outer'));

    // DEBUG Draw circles where the game thinks the ch is
    // HACK this math is so convoluted, but whatever it somehow works for 32px sprites
    // const visionPolygon: Point[] = [];
    // const visionRange = ch.visionRange;
    // for (let i = 0; i < 360; i += 10) {
    //   const [visX, visY] = characterGetVisionPoint(ch);
    //   const pointX = visX + Math.sin(degreesToRadians(i)) * visionRange;
    //   const pointY = visY + Math.cos(degreesToRadians(i)) * visionRange;
    //   visionPolygon.push(
    //     pxToCanvasCoords4by3(...isoToPixelCoords(pointX, pointY))
    //   );
    //   // visionPolygon.push([pointX, pointY]);
    // }

    // // drawPolygon(visionPolygon, 'white', 1, getCtx('outer'));

    // // top left of a character
    // drawCircle(px, py, 5, 'red');

    // // where the game thinks the character is
    // const [x, y] = characterGetPos(ch);
    // const [aX, aY] = isoToPixelCoords(...characterGetPos(ch));
    // const [visX, visY] = characterGetVisionPoint(ch);
    // drawPolygon(
    //   circleToPolygonPx(visX, visY, ch.visionRange),
    //   'white',
    //   1,
    //   getCtx('outer')
    // );
    // drawPolygon(
    //   circleToPolygonPx(x, y, ch.collisionSize[0] / 2),
    //   'purple',
    //   1,
    //   getCtx('outer')
    // );
    // drawCircle(aX, aY, 5, 'blue');

    // // // where the game thinks the character's feet are
    // const [fX, fY] = isoToPixelCoords(...characterGetPosBottom(ch));
    // drawCircle(fX, fY, 5, 'orange');
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
  //   drawRect(px + 16, py + 29, 4, 4, 'cyan');
  // }
};

export const drawParticle = (
  particle: Particle,
  px: number,
  py: number,
  scale?: number,
  ctx?: CanvasRenderingContext2D
): void => {
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
    drawText(text, px, py, textParams, ctx);
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

  const outerCtx = getCtx('outer');
  const player = getCurrentPlayer();
  const leader = player.leader;

  // DEBUG highlight stuff that sees Ada
  // for (let i = 0; i < room.characters.length; i++) {
  //   const ch = room.characters[i];
  //   if (ch !== leader && characterCanSeeOther(ch, leader)) {
  //     ch.highlighted = true;
  //   } else {
  //     ch.highlighted = false;
  //   }
  // }

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
          const [pxO, pyO] = pxToCanvasCoords4by3(
            (px as number) + 16,
            py as number
          );
          drawText(
            name || '',
            pxO,
            pyO,
            {
              align: 'center',
              color: colors.WHITE,
              strokeColor: colors.BLACK,
              size: 24,
            },
            getCtx('outer')
          );
          drawSprite(sprite as string, px as number, py as number);
        }
      } else if (isTrigger) {
        if (getTriggersVisible()) {
          if (polygon) {
            const point = polygon[0];
            const [x, y] = point;
            const [pxO, pyO] = pxToCanvasCoords4by3(
              ...isoToPixelCoords(x, y, 0)
            );

            const mappedPolygon = polygon.map(([pointX, pointY]) => {
              return isoToPixelCoords(pointX, pointY);
            });

            drawPolygon(mappedPolygon, 'rgba(0, 0, 0, 0.5)', 1, getCtx());
            drawText(
              name || '',
              pxO,
              pyO,
              {
                align: 'center',
                color: colors.PINK,
                strokeColor: colors.BLACK,
                size: 24,
              },
              getCtx('outer')
            );
          } else {
            const [pxO, pyO] = pxToCanvasCoords4by3(
              (px as number) + 16,
              py as number
            );
            drawSprite(sprite as string, px as number, py as number);
            drawText(
              name || '',
              pxO,
              pyO,
              {
                align: 'center',
                color: colors.PINK,
                strokeColor: colors.BLACK,
                size: 24,
              },
              getCtx('outer')
            );
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

  if (getPlayerWallGlowEnabled()) {
    ctx.globalAlpha = 0.25;
    ctx.globalCompositeOperation = 'luminosity';
    drawCharacter(leader);
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
  }

  if (!isPaused) {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.useOuterCanvas) {
        const [px, py] = particleGetPos(p);
        const [pxO, pyO] = pxToCanvasCoords4by3(px, py);
        drawParticle(p, pxO, pyO, 1, outerCtx);
      } else {
        const [px, py] = particleGetPos(p);
        drawParticle(p, px, py);
      }
    }
  }

  ctx.restore();

  if (getMarkersVisible()) {
    const [x, y] = characterGetPos(leader);
    drawText(
      `POS: ${x.toFixed(0)}, ${y.toFixed(0)}`,
      20,
      164,
      {
        color: 'white',
        size: 32,
      },
      outerCtx
    );

    const [px, py] = isoToPixelCoords(x, y);
    const [pxO, pyO] = pxToCanvasCoords4by3(px, py);
    drawText(
      `OPos: ${pxO.toFixed(0)}, ${pyO.toFixed(0)}`,
      20,
      194,
      {
        color: 'white',
        size: 32,
      },
      outerCtx
    );

    const tile = roomGetTileBelow(room, [x, y]);
    drawText(
      `TPos: ${tile?.x.toFixed(0)}, ${tile?.y.toFixed(0)}`,
      20,
      224,
      {
        color: 'white',
        size: 32,
      },
      outerCtx
    );
  }
};
