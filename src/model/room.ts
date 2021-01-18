import { loadImageAsSprite } from 'model/sprite';
import {
  removeFileExtension,
  Point,
  isoToPixelCoords,
  pixelToIsoCoords,
} from 'utils';
import {
  Character,
  characterSetPos,
  characterCreateFromTemplate,
} from 'model/character';
import { Particle } from 'model/particle';
import { get as getCharacter } from 'db/characters';

import * as battle1Json from 'map/battle1.json';
import * as testJson from 'map/test.json';
import * as test2Json from 'map/test2.json';

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
}

export interface Tile {
  sprite: string;
  id: number;
  x: number;
  y: number;
  isWall: boolean;
  tileWidth: number;
  tileHeight: number;
  highlighted: boolean;
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
  name: 'Props' | 'Characters' | 'Tiles';
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
  const { objects: characters } =
    tiledJson.layers.find((layer: TiledLayer) => layer.name === 'Characters') ||
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
    room.tiles.push({
      // sprite: 'terrain_' + (tiledTileId - 1),
      sprite,
      tileWidth,
      tileHeight,
      isWall: sprite.indexOf('wall') > -1,
      id: tiledTileId - 1,
      x: i % width,
      y: Math.floor(i / width),
      highlighted: false,
    });
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
        loadImageAsSprite(pictureName, removeFileExtension(pictureName))
      );
      room.props.push({
        x,
        y,
        sprite: pictureName.slice(0, -4),
      });
    });
  }

  if (characters) {
    characters.forEach(
      (tiledCharacter: { x: number; y: number; name: string }, i: number) => {
        const x = tiledCharacter.x;
        const y = tiledCharacter.y;
        const chTemplate = getCharacter(tiledCharacter.name);
        if (!chTemplate) {
          throw new Error(
            `Could not load character '${i}' in room definition '${name}', the character '${tiledCharacter.name}' does not exist in the db.`
          );
        }
        const ch = characterCreateFromTemplate(chTemplate);

        // tiled specifies objects drawn from the bottom, subtract half height to put them in the same visual spot
        const [xPx, yPy] = isoToPixelCoords(x, y);
        const [newX, newY] = pixelToIsoCoords(xPx, yPy - 16);
        characterSetPos(ch, [newX, newY, 0]);
        room.characters.push(ch);
      }
    );
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
  const tileX = Math.floor(((x + 16) / TILE_WIDTH) * 2);
  const tileY = Math.floor(((y + 16) / TILE_HEIGHT) * 2);
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
