import { loadImageAsSprite } from 'model/sprite';
import { removeFileExtension } from 'utils';
import { Character } from 'model/character';

import * as battleJson from 'map/battle.json';

export const TILE_WIDTH = 32;
export const TILE_HEIGHT = 32;

const rooms: { [key: string]: Room } = {};

export const loadRooms = async (): Promise<void> => {
  console.log('loading maps');

  await createRoom('battle1', battleJson);

  console.log('maps loaded');
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
}

const createRoom = async (name: string, tiledJson: any): Promise<Room> => {
  console.log('create room', name, tiledJson);
  const { width, height, data } = tiledJson.layers[0];
  const { objects: props } = tiledJson.layers[1];
  const {
    tiles: propsTilesets,
    firstgid: propsTilesetsFirstGid,
  } = tiledJson.tilesets.find((tileSet: any) => tileSet.name === 'props');

  const room: Room = {
    tiledJson,
    width,
    height,
    widthPx: width * TILE_WIDTH,
    heightPx: (height * TILE_HEIGHT) / 2,
    props: [] as Prop[],
    tiles: [] as Tile[],
    characters: [] as Character[],
  };

  const promises: Promise<any>[] = [];

  data.forEach((tiledTileId: number, i: number) => {
    room.tiles.push({
      sprite: 'terrain_' + (tiledTileId - 1),
      id: tiledTileId - 1,
      x: i % width,
      y: Math.floor(i / width),
    });
  });

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

  await Promise.all(promises);

  rooms[name] = room;
  return room;
};
