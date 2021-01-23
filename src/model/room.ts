import { loadImageAsSprite, getSprite } from 'model/sprite';
import {
  removeFileExtension,
  Point,
  isoToPixelCoords,
  pixelToIsoCoords,
} from 'utils';
import {
  Character,
  characterSetPos,
  characterGetPos,
  characterCreateFromTemplate,
} from 'model/character';
import { Particle } from 'model/particle';
import { get as getCharacter } from 'db/characters';
import { Polygon } from 'view/draw';

import * as battle1Json from 'map/battle1.json';
import * as testJson from 'map/test.json';
import * as test2Json from 'map/test2.json';
import { getTrigger } from 'lib/rpgscript';

export const TILE_WIDTH = 32;
export const TILE_HEIGHT = 32;

// given an x, y in tile coordinates, return the isometric pixel coordinates
export const tilePosToWorldPos = (x: number, y: number): Point => {
  return [(x * TILE_WIDTH) / 2, (y * TILE_HEIGHT) / 2];
};

const rooms: { [key: string]: Room } = {};

export const loadRooms = async (): Promise<void> => {
  console.log('loading rooms');

  await createRoom('battle1', battle1Json);
  await createRoom('test', testJson);
  await createRoom('test2', test2Json);

  console.log('rooms loaded');
};

export const getRoom = (mapName: string): Room => {
  return rooms[mapName];
};

export interface Prop {
  sprite: string;
  x: number;
  y: number;
  ro?: RenderObject;
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

export interface Marker {
  name: string;
  x: number;
  y: number;
  ro?: RenderObject;
}

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

export interface TriggerActivator {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  polygon?: Polygon;
  ro?: RenderObject;
}

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

export interface Tile {
  sprite: string;
  id: number;
  x: number;
  y: number;
  isWall: boolean;
  tileWidth: number;
  tileHeight: number;
  highlighted: boolean;
  ro?: RenderObject;
}

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
    // corrects for the tile height, which can be any height
    sortY: py + (tile.tileHeight - 32) + (tile.tileHeight > 32 ? 16 + 4 : 16),
    visible: true,
  };
};

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
  sortY: number;
  visible: boolean;
}

export interface Room {
  tiledJson: any;
  width: number;
  height: number;
  widthPx: number;
  heightPx: number;
  props: Prop[];
  tiles: Tile[];
  characters: Character[];
  particles: Particle[];
  renderObjects: RenderObject[];
  markers: Record<string, Marker>;
  triggerActivators: TriggerActivator[];
}

interface TiledObject {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  gid?: number;
}

interface TiledTileset {
  firstgid: number;
  image: string;
  name: string;
  tilewidth: number;
  tileheight: number;
  tiles?: {
    id: number;
    image: string;
  }[];
}

interface TiledLayer {
  name: 'Props' | 'Objects' | 'Tiles';
  objects?: any[];
  data?: any[];
}

const gidToTileSpriteAndSize = (
  tilesets: TiledTileset[],
  gid: number
): {
  tileWidth: number;
  tileHeight: number;
  sprite: string;
} => {
  if (gid === 0) {
    return {
      sprite: 'invisible',
      tileWidth: 32,
      tileHeight: 32,
    };
  }

  let i = 0;
  do {
    let tilesetA = tilesets[i];
    let tilesetB = tilesets[i + 1];
    if (!tilesetB || (gid >= tilesetA.firstgid && gid < tilesetB.firstgid)) {
      const localId = gid - tilesetA.firstgid;
      // const imageName = tilesetA.image.slice(tilesetA.image.lastIndexOf('/') + 1, -4);
      return {
        sprite: tilesetA.name + '_' + localId,
        tileWidth: tilesetA.tilewidth,
        tileHeight: tilesetA.tileheight,
      };
    }
    i++;
  } while (i < tilesets.length);

  throw new Error('Could not determine sprite from gid:' + gid);
};

const createRoom = async (name: string, tiledJson: any): Promise<Room> => {
  const { width, height, data } = tiledJson.layers[0];
  const { objects: props } =
    tiledJson.layers.find((layer: TiledLayer) => layer.name === 'Props') || {};
  const { objects } =
    tiledJson.layers.find((layer: TiledLayer) => layer.name === 'Objects') ||
    {};
  const { tiles: propsTilesets, firstgid: propsTilesetsFirstGid } =
    tiledJson.tilesets.find((tileSet: any) => tileSet.name === 'props') || {};

  const room: Room = {
    tiledJson,
    width,
    height,
    widthPx: width * TILE_WIDTH,
    heightPx: (height * TILE_HEIGHT) / 2,
    props: [] as Prop[],
    tiles: [] as Tile[],
    characters: [] as Character[],
    particles: [] as Particle[],
    markers: {} as Record<string, Marker>,
    triggerActivators: [] as TriggerActivator[],
    renderObjects: [] as RenderObject[],
  };

  console.log(
    'create room',
    name,
    tiledJson,
    room.widthPx,
    room.heightPx,
    room.width,
    room.height
  );

  const promises: Promise<any>[] = [];

  data.forEach((tiledTileId: number, i: number) => {
    const { sprite, tileWidth, tileHeight } = gidToTileSpriteAndSize(
      tiledJson.tilesets,
      tiledTileId
    );
    const tile = {
      sprite,
      tileWidth,
      tileHeight,
      isWall: sprite.indexOf('wall') > -1 || sprite.indexOf('prop') > -1,
      id: tiledTileId - 1,
      x: i % width,
      y: Math.floor(i / width),
      highlighted: false,
    } as Tile;
    room.tiles.push(tile);
    room.renderObjects.push(createTileRenderObject(tile));
  });

  if (props) {
    props.forEach((tiledProp: any, i: number) => {
      const x: number = tiledProp.x;
      const y: number = tiledProp.y;
      const gid: number = tiledProp.gid;

      const propIndex = gid - propsTilesetsFirstGid;
      const tilesetTile = propsTilesets[propIndex];
      if (!tilesetTile) {
        throw new Error(
          `Could not load prop '${i}' in room definition '${name}', the propIndex '${propIndex}' has no associated tilesetTile. (gid=${gid} startingGid=${propsTilesetsFirstGid})`
        );
      }
      const pictureName = tilesetTile.image.slice(
        tilesetTile.image.lastIndexOf('/') + 1
      );
      promises.push(
        new Promise<void>(async resolve => {
          await loadImageAsSprite(
            pictureName,
            removeFileExtension(pictureName)
          );
          const prop = {
            x,
            y,
            sprite: pictureName.slice(0, -4),
          };
          room.props.push(prop);
          room.renderObjects.push(createPropRenderObject(prop));
          resolve();
        })
      );
    });
  }

  const addCharacter = (tiledObject: TiledObject) => {
    console.log('Tiled addCharacter', tiledObject);
    const x = tiledObject.x;
    const y = tiledObject.y;
    // tiled specifies objects drawn from the bottom, subtract half height to put them in the same visual spot
    const [xPx, yPy] = isoToPixelCoords(x, y);
    const [newX, newY] = pixelToIsoCoords(xPx, yPy - 16);

    const chTemplate = getCharacter(tiledObject.name);
    if (!chTemplate) {
      throw new Error(
        `Could not load character '${tiledObject.name}' in room definition '${name}', no entry in the db.`
      );
    }
    const ch = characterCreateFromTemplate(chTemplate);

    characterSetPos(ch, [newX, newY, 0]);
    roomAddCharacter(room, ch);
  };

  const addMarker = (tiledObject: TiledObject) => {
    console.log('Tiled addMarker', tiledObject);
    const x = tiledObject.x;
    const y = tiledObject.y;
    // tiled specifies objects drawn from the bottom, subtract half height to put them in the same visual spot
    const [xPx, yPy] = isoToPixelCoords(x, y);
    const [newX, newY] = pixelToIsoCoords(xPx, yPy - 16);
    if (room.markers[tiledObject.name]) {
      throw new Error(
        `Could not load marker '${tiledObject.name}' in room definition '${name}', a marker with that name already exists.)`
      );
    }
    const marker = {
      name: tiledObject.name,
      x: newX,
      y: newY,
    };
    room.markers[tiledObject.name] = marker;
    room.renderObjects.push(createMarkerRenderObject(marker));
  };

  const addTrigger = (tiledObject: TiledObject) => {
    console.log('Tiled addTrigger', tiledObject);
    const x = tiledObject.x;
    const y = tiledObject.y;
    const width = tiledObject.width;
    const height = tiledObject.height;
    const triggerName = tiledObject.name.slice(1);

    // is a polygon
    if (tiledObject.gid === undefined) {
      // I honestly have no idea why it needs these offsets
      const yOffset = 8;
      const xOffset = 16 + 8;
      const polygon: Polygon = [
        [xOffset + x, yOffset + y] as Point,
        [xOffset + x + width, yOffset + y] as Point,
        [xOffset + x + width, yOffset + y + height] as Point,
        [xOffset + x, yOffset + y + height] as Point,
      ];
      const trigger = {
        polygon,
        name: triggerName,
        x,
        y,
        width,
        height,
        isTrigger: true,
      };
      room.triggerActivators.push(trigger);
      room.renderObjects.push(createTriggerActivatorRenderObject(trigger));
    } else {
      // Tiled specifies objects drawn from the bottom, subtract half height of a tile to put them in the same visual spot
      const [xPx, yPy] = isoToPixelCoords(x, y);
      const [newX, newY] = pixelToIsoCoords(xPx, yPy - 16);
      if (!getTrigger(triggerName)) {
        throw new Error(
          `Could not load trigger '${tiledObject.name}' in room definition '${name}', a trigger with that name does not exist.)`
        );
      }
      const trigger = {
        name: triggerName,
        x: newX,
        y: newY,
        width: 16,
        height: 16,
        isTrigger: true,
      };
      room.triggerActivators.push(trigger);
      room.renderObjects.push(createTriggerActivatorRenderObject(trigger));
    }
  };

  if (objects) {
    objects.forEach((object: TiledObject) => {
      const isMarker = object.name.toLowerCase().indexOf('marker') > -1;
      const isTrigger = object.name.toLowerCase().indexOf('#') === 0;

      if (isMarker) {
        addMarker(object);
      } else if (isTrigger) {
        addTrigger(object);
      } else {
        addCharacter(object);
      }
    });
  }

  await Promise.all(promises);

  rooms[name] = room;
  return room;
};

export const roomGetTileAt = (
  room: Room,
  x: number,
  y: number
): Tile | null => {
  if (x < 0 || x >= room.width || y < 0 || y >= room.height) {
    return null;
  }
  return room.tiles[y * room.width + x];
};

export const roomAddParticle = (room: Room, particle: Particle): void => {
  room.particles.push(particle);
};

export const roomRemoveRemoveCharacter = (room: Room, ch: Character): void => {
  const ind = room.characters.indexOf(ch);
  if (ind > -1) {
    room.characters.splice(ind, 1);
  }
};

export const roomGetTileBelow = (room: Room, ch: Character): Tile | null => {
  const { x, y } = ch;
  const tileX = Math.floor(((x + 16 - 3) / TILE_WIDTH) * 2);
  const tileY = Math.floor(((y + 16 - 3) / TILE_HEIGHT) * 2);
  return roomGetTileAt(room, tileX, tileY);
};

export const roomGetCharacterByName = (
  room: Room,
  chName: string
): Character | null => {
  for (let i = 0; i < room.characters.length; i++) {
    const ch = room.characters[i];
    if (ch.name === chName) {
      return ch;
    }
  }
  return null;
};

export const roomAddCharacter = (room: Room, ch: Character) => {
  room.characters.push(ch);
  if (ch.ro) {
    room.renderObjects.push(ch.ro);
  }
};

export const roomRemoveCharacter = (room: Room, ch: Character) => {
  const chInd = room.characters.indexOf(ch);
  if (chInd > -1) {
    room.characters.splice(chInd, 1);
  }
  if (ch.ro) {
    const roInd = room.renderObjects.indexOf(ch.ro);
    if (roInd > -1) {
      room.renderObjects.splice(roInd, 1);
    }
  }
};
