import { Polygon } from 'view/draw';
import { Character } from 'model/character';
import { Particle } from 'model/particle';
import { getSprite } from 'model/sprite';
import { isoToPixelCoords } from 'utils';
import { Animation } from 'model/animation';
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  Prop,
  Marker,
  TriggerActivator,
  Tile,
} from 'model/room';

export interface RenderObject {
  name?: string;
  sprite?: string;
  character?: Character;
  particle?: Particle;
  origPy?: number;
  highlighted?: boolean;
  px?: number;
  py?: number;
  polygon?: Polygon;
  isMarker?: boolean;
  isTrigger?: boolean;
  isFloor?: boolean;
  anim?: Animation;
  sortY: number;
  visible: boolean;
}

export const createPropRenderObject = (
  prop: Prop,
  overrideCorrection?: boolean
): RenderObject => {
  if (prop.isDynamic) {
    const sprite = getSprite(prop.sprite);
    if (!sprite) {
      console.error(prop);
      throw new Error(
        'Cannot create prop render object, no sprite exists:' + prop.sprite
      );
    }
    const [, , , spriteWidth, spriteHeight] = sprite;
    let [px, py] = isoToPixelCoords(prop.x, prop.y);

    if (overrideCorrection) {
    } else if (spriteWidth === 32 && spriteHeight === 32) {
      // works for 32 x 32
      py = py - spriteHeight + 16 + 4 - 4 + 1 - 1;
      px = px - spriteWidth / 2 + 16 + 4 - 4 + 0;
    } else {
      // works for everything else??
      py = py - spriteHeight + 16;
      px = px - spriteWidth / 2 + 16;
    }

    let pySortOffset = 0;

    // helps put small sprites on tables
    if (prop.sortOffset !== undefined) {
      pySortOffset = prop.sortOffset;
    } else if (prop.sprite?.includes('props_small')) {
      pySortOffset = 16;
    }

    return {
      sprite: prop.sprite,
      px,
      py,
      sortY: prop.isFront ? Infinity : py + spriteHeight + pySortOffset,
      visible: true,
    };
  } else {
    let [px, py] = isoToPixelCoords(prop.x, prop.y);
    const [, , , spriteWidth, spriteHeight] = getSprite(prop.sprite);
    px -= px - spriteWidth / 2 + TILE_WIDTH / 2;
    py = py - spriteHeight + TILE_HEIGHT / 2;
    return {
      sprite: prop.sprite,
      px,
      py,
      sortY: py + spriteHeight,
      visible: true,
    };
  }
};

export const createMarkerRenderObject = (marker: Marker): RenderObject => {
  const { x, y } = marker;
  const [px, py] = isoToPixelCoords(x, y, 0);
  return {
    name: marker.name,
    sprite: 'control_1',
    px,
    py,
    sortY: py + 32, // because all markers are 32 px tall (right now)
    visible: true,
    isMarker: true,
  };
};

export const createTriggerActivatorRenderObject = (
  trigger: TriggerActivator
): RenderObject => {
  if (trigger.polygon) {
    return {
      name: trigger.name,
      polygon: trigger.polygon,
      sortY: Infinity,
      visible: true,
      isTrigger: true,
    };
  } else {
    const { x, y } = trigger;
    const [px, py] = isoToPixelCoords(x, y, 0);
    return {
      name: trigger.name,
      sprite: 'control_2',
      px,
      py,
      sortY: py + 32, // because all sprite trigger activators are 32 px tall (right now)
      visible: true,
      isTrigger: true,
    };
  }
};

export const createTileRenderObject = (
  tile: Tile,
  sortYOffset?: number
): RenderObject => {
  const pos = isoToPixelCoords(
    (tile.x * TILE_WIDTH) / 2,
    (tile.y * TILE_HEIGHT) / 2
  );
  const px = pos[0];
  let py = pos[1];
  const origPy = py;
  py -= tile.tileHeight - 32;
  const localTileIndex = parseFloat(
    tile.sprite.slice(tile.sprite.lastIndexOf('_') + 1)
  );
  const isFloor = tile.sprite.indexOf('floors') > -1;
  // corrects for the tile height, which can be any height
  const sortY =
    py +
    (tile.tileHeight - 32) +
    (tile.tileHeight > 32 ? 16 + 4 : 16) +
    (sortYOffset ?? 0);
  let sprite = tile.sprite;
  if (isFloor) {
    // HACK, this should really be specified as a separate tile sheet
    // if this is a phat tile that needs to be pushed down instead of up.
    // the floor tileset has both "flat" floors and "cube" floors.  The cube floors
    // need to be pushed down the py axis (world z axis) so that the top of the floor
    // aligns correctly
    if (!isNaN(localTileIndex) && localTileIndex >= 56) {
      py += 16;
    }
    // the first tile is just a skeleton box useful for marking empty space in Tiled and
    // it should not actually be rendered in the game.
    if (tile.sprite === 'floors_0') {
      sprite = 'invisible';
    }
  }
  return {
    sprite,
    origPy,
    px,
    py,
    highlighted: tile.highlighted,
    isFloor,
    sortY,
    visible: true,
  };
};
