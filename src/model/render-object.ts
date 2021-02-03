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

export const createPropRenderObject = (prop: Prop): RenderObject => {
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

export const createTileRenderObject = (tile: Tile): RenderObject => {
  let [px, py] = isoToPixelCoords(
    (tile.x * TILE_WIDTH) / 2,
    (tile.y * TILE_HEIGHT) / 2
  );
  const origPy = py;
  py -= tile.tileHeight - 32;
  return {
    sprite: tile.sprite,
    origPy,
    px,
    py,
    highlighted: tile.highlighted,
    isFloor: tile.sprite.indexOf('floors') > -1,
    // corrects for the tile height, which can be any height
    sortY: py + (tile.tileHeight - 32) + (tile.tileHeight > 32 ? 16 + 4 : 16),
    visible: true,
  };
};
