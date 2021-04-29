import { drawSprite } from 'view/draw';
import { createCanvas } from 'model/canvas';
import { TILE_WIDTH, TILE_HEIGHT } from 'model/room';

export type Sprite = [
  HTMLCanvasElement | HTMLImageElement,
  number,
  number,
  number,
  number
];

type SpriteCollection = { [key: string]: Sprite };
const loadedSprites: SpriteCollection = {};
(window as any).sprites = loadedSprites;

export const createSprite = (
  img: HTMLCanvasElement | HTMLImageElement,
  x?: number,
  y?: number,
  w?: number,
  h?: number
): Sprite => {
  return [img, x ?? 0, y ?? 0, w ?? img.width, h ?? img.height];
};

export const loadImage = async (
  fileName: string
): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      reject('Failed to load image: ' + fileName);
    };
    img.src = 'res/' + fileName;
  });
};

export enum SpriteModification {
  NORMAL = '',
  FLIPPED = '_f',
  ROT90 = '_r1',
  ROT180 = '_r2',
  ROT270 = '_r3',
}
// given an inputCanvas, return a new canvas rotated to the right by 90 degrees
const createRotatedImg = (
  inputCanvas: HTMLCanvasElement
): HTMLCanvasElement => {
  const [canvas, ctx, width, height] = createCanvas(
    inputCanvas.width,
    inputCanvas.height
  );
  const x = width / 2;
  const y = height / 2;
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(inputCanvas, -x, -y);
  return canvas;
};

// given an inputCanvas, return a new canvas flipped horizontally
const createFlippedImg = (
  inputCanvas: HTMLCanvasElement
): HTMLCanvasElement => {
  const [canvas, ctx, width] = createCanvas(
    inputCanvas.width,
    inputCanvas.height
  );
  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(inputCanvas, 0, 0);
  return canvas;
};

// given a Sprite, create and return a new image from the sprite
const spriteToCanvas = (sprite: Sprite): HTMLCanvasElement => {
  const [, , , spriteWidth, spriteHeight] = sprite;
  const [canvas, ctx] = createCanvas(spriteWidth, spriteHeight);
  drawSprite(sprite, 0, 0, 1, ctx);
  return canvas;
};

// load a set of sprites from an image, each sprite loaded with also have a set of rotated
// and flipped variants
const loadSpritesFromImage = (
  spriteMap: SpriteCollection, // collection in which to put created sprites
  image: HTMLImageElement | HTMLCanvasElement, // parent image
  spritePrefix: string, // created sprites are named <spritePrefix>_<index>
  spriteWidth: number,
  spriteHeight: number
) => {
  const addSprite = (
    name: string,
    image: HTMLImageElement | HTMLCanvasElement,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    return (spriteMap[name] = createSprite(image, x, y, w, h));
  };

  const addRotatedSprite = (
    sprite: HTMLCanvasElement,
    baseSpriteName: string,
    n: number
  ) => {
    let rotated: HTMLCanvasElement = sprite;
    for (let i = 0; i < n; i++) {
      rotated = createRotatedImg(rotated);
    }
    addSprite(
      `${baseSpriteName}_r${n}`,
      rotated,
      0,
      0,
      spriteWidth,
      spriteHeight
    );
  };

  const addSprites = (baseSpriteName: string, i: number, j: number) => {
    const sprite = addSprite(
      baseSpriteName,
      image,
      j * spriteWidth,
      i * spriteHeight,
      spriteWidth,
      spriteHeight
    );

    // TODO Add this back if necessary, but I think it not necessary
    // create rotated sprites:<baseSpriteName>_rN
    // addRotatedSprite(spriteToCanvas(sprite), baseSpriteName, 1);
    // addRotatedSprite(spriteToCanvas(sprite), baseSpriteName, 2);
    // addRotatedSprite(spriteToCanvas(sprite), baseSpriteName, 3);

    // create flipped sprite: <baseSpriteName>_f
    if (hasFlippedVariant(baseSpriteName)) {
      addSprite(
        `${baseSpriteName}${SpriteModification.FLIPPED}`,
        createFlippedImg(spriteToCanvas(sprite)),
        0,
        0,
        spriteWidth,
        spriteHeight
      );
    }
  };

  const numColumns = image.width / spriteWidth;
  const numRows = image.height / spriteHeight;

  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numColumns; j++) {
      // create original sprite: <baseSpriteName>
      let baseSpriteName = `${spritePrefix}_${i * numColumns + j}`;
      if (
        numColumns === 1 &&
        numRows === 1 &&
        // HACK: Makes 512 portraits retain their _0 for some ui purposes
        !baseSpriteName.includes('512')
      ) {
        baseSpriteName = spritePrefix;
      }
      addSprites(baseSpriteName, i, j);
    }
  }
};

export const loadTiles = async (): Promise<void> => {
  const img = await loadImage('battle-terrain1.png');
  loadSpritesFromImage(loadedSprites, img, 'terrain', TILE_WIDTH, TILE_HEIGHT);
};

// implied 'res' at beginning of fileName
export const loadImageAsSprite = async (
  fileName: string,
  alias: string
): Promise<HTMLImageElement | HTMLCanvasElement> => {
  const spr = getSprite(alias);
  if (!spr) {
    // save space for this so that images aren't loaded multiple times.
    loadedSprites[alias] = [new Image(), 0, 0, 0, 0];
    const img = await loadImage(fileName);
    loadSpritesFromImage(loadedSprites, img, alias, img.width, img.height);
    return img;
  } else {
    return spr[0];
  }
};

// implied 'res' at beginning of FileName
export const loadImageAsSpritesheet = async (
  fileName: string,
  alias: string,
  spriteWidth: number,
  spriteHeight: number
): Promise<HTMLImageElement | HTMLCanvasElement> => {
  const spr = getSprite(alias);
  if (!spr) {
    // save space for this so that images aren't loaded multiple times.
    loadedSprites[alias] = [new Image(), 0, 0, 0, 0];
    const img = await loadImage(fileName);
    loadSpritesFromImage(loadedSprites, img, alias, spriteWidth, spriteHeight);
    loadSpritesFromImage(loadedSprites, img, alias, img.width, img.height);
    return img;
  } else {
    return spr[0];
  }
};

const invisibleSprite = createSprite(
  document.createElement('canvas'),
  0,
  0,
  1,
  1
);

// get a Sprite given a sprite name
export const getSprite = (spriteName: string): Sprite => {
  if (spriteName.indexOf('invisible') === 0) {
    return invisibleSprite;
  }
  return (loadedSprites as SpriteCollection)[spriteName];
};

const nonFlippedVariants = [
  /props/,
  /effect_/,
  /control/,
  /walls(.*)/,
  /walls-anims/,
];

const hasFlippedVariant = (baseSpriteName: string) => {
  for (let i = 0; i < nonFlippedVariants.length; i++) {
    const regex = nonFlippedVariants[i];
    if (regex.test(baseSpriteName)) {
      return false;
    }
  }
  return true;
};
