import { createSprite, loadImageAsSprite, Sprite } from 'model/sprite';
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
import { Polygon, drawSprite } from 'view/draw';
import { getTrigger } from 'lib/rpgscript';
import { getReplacementTemplate } from 'db/tiles';
import { createAnimation } from 'model/animation';
import {
  RenderObject,
  createPropRenderObject,
  createMarkerRenderObject,
  createTriggerActivatorRenderObject,
  createTileRenderObject,
} from 'model/render-object';
import { createCanvas } from 'model/canvas';

export const TILE_WIDTH = 32;
export const TILE_HEIGHT = 32;
export const TILE_WIDTH_WORLD = 16;
export const TILE_HEIGHT_WORLD = 16;

// given an x, y in tile coordinates, return the isometric pixel coordinates
export const tilePosToWorldPos = (x: number, y: number): Point => {
  return [(x * TILE_WIDTH) / 2, (y * TILE_HEIGHT) / 2];
};

export interface Room {
  tiledJson: any;
  width: number;
  height: number;
  widthPx: number;
  heightPx: number;
  props: Prop[];
  tiles: Tile[];
  defaultFloorSprite: string;
  characters: Character[];
  particles: Particle[];
  renderObjects: RenderObject[];
  floorTileObjects: RenderObject[];
  floor?: Sprite;
  markers: Record<string, Marker>;
  triggerActivators: TriggerActivator[];
}

export interface Prop {
  sprite: string;
  x: number;
  y: number;
  isDynamic: boolean;
  isFront: boolean;
  ro?: RenderObject;
}

export interface Marker {
  name: string;
  x: number;
  y: number;
  ro?: RenderObject;
}

export interface TriggerActivator {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  polygon?: Polygon;
  ro?: RenderObject;
}

export interface Tile {
  sprite: string;
  animName?: string;
  id: number;
  x: number;
  y: number;
  isWall: boolean;
  tileWidth: number;
  tileHeight: number;
  highlighted: boolean;
  ro?: RenderObject;
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

let dynamicPropsTileset: null | string[] = null;
const loadDynamicPropsTileset = async () => {
  const xml = await fetch('res/props-dynamic.tiled-sheet.tsx').then(result =>
    result.text()
  );

  if (xml) {
    dynamicPropsTileset =
      xml
        .match(/source="(.*)\.[\w]+"/g)
        ?.map(str =>
          str.slice(str.indexOf('"') + 1, str.lastIndexOf('"') - 4)
        ) ?? null;
  }
};

export const createRoom = async (
  name: string,
  tiledJson: any
): Promise<Room> => {
  // const t
  if (!dynamicPropsTileset) {
    await loadDynamicPropsTileset();
  }

  const { width, height, data } = tiledJson.layers[0];
  const { objects: props } =
    tiledJson.layers.find((layer: TiledLayer) => layer.name === 'Props') || {};
  const { objects } =
    tiledJson.layers.find((layer: TiledLayer) => layer.name === 'Objects') ||
    {};
  const { firstgid: propsTilesetsFirstGid } = tiledJson.tilesets.find(
    (tileSet: any) => {
      return (
        tileSet.name === 'props-dynamic' ||
        (tileSet.source ?? '').indexOf('props-dynamic') > -1
      );
    }
  ) || { firstGid: -9999999 };

  const widthPx = width * TILE_WIDTH;
  const heightPx = (height * TILE_HEIGHT) / 2;
  // not sure why the +TILE_HEIGHT is required.  Maybe it's a rounding thing.
  const [floorCanvas, floorCtx] = createCanvas(widthPx, heightPx + TILE_HEIGHT);

  const room: Room = {
    tiledJson,
    width,
    height,
    widthPx,
    heightPx,
    props: [] as Prop[],
    tiles: [] as Tile[],
    characters: [] as Character[],
    particles: [] as Particle[],
    markers: {} as Record<string, Marker>,
    triggerActivators: [] as TriggerActivator[],
    renderObjects: [] as RenderObject[],
    floorTileObjects: [] as RenderObject[],
    floor: createSprite(floorCanvas),
    defaultFloorSprite: 'floors_1',
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

    const isWallTileset = sprite.indexOf('wall') > -1;
    const isPropTileset = sprite.indexOf('props') > -1;
    const tile = {
      sprite,
      tileWidth,
      tileHeight,
      isWall: isWallTileset || isPropTileset,
      id: tiledTileId - 1,
      x: i % width,
      y: Math.floor(i / width),
      highlighted: false,
    } as Tile;
    room.tiles.push(tile);
    const ro = createTileRenderObject(tile);
    if (ro.isFloor) {
      // room.floorTileObjects.push(ro);
      room.renderObjects.push(ro);
    } else {
      if (isWallTileset) {
        const floorTile = {
          ...tile,
          tileWidth: 32,
          tileHeight: 32,
          sprite: 'floors_1', //TODO make this a room param
          id: 1,
        } as Tile;
        // const roFloor = createTileRenderObject(floorTile);
        // room.floorTileObjects.push(roFloor);
      } else if (isPropTileset) {
        const floorTile = {
          ...tile,
          tileWidth: 32,
          tileHeight: 32,
          sprite: 'floors_1', //TODO make this a room param
          id: 1,
          x: tile.x + 1,
          y: tile.y,
        } as Tile;
        const floorTile2 = {
          ...floorTile,
          x: tile.x,
          y: tile.y + 1,
        } as Tile;
        const roFloor = createTileRenderObject(floorTile);
        const roFloor2 = createTileRenderObject(floorTile2);
        room.renderObjects.push(roFloor, roFloor2);
      }
      room.renderObjects.push(ro);
    }
    tile.ro = ro;
    const tileTemplate = getReplacementTemplate(tile.sprite);
    if (tileTemplate) {
      tile.ro.sprite = tileTemplate.baseSprite;
      tile.isWall = tileTemplate.isWall ?? tile.isWall;
      if (tileTemplate?.animName) {
        tile.animName = tileTemplate.animName;
        tile.ro.anim = createAnimation(tileTemplate.animName);
        tile.ro.anim.start();
      }
    }
  });

  const addProp = (tiledProp: any) => {
    const x: number = tiledProp.x;
    const y: number = tiledProp.y;
    const gid: number = tiledProp.gid;

    const isDynamicProp =
      gid >= propsTilesetsFirstGid &&
      gid < propsTilesetsFirstGid + dynamicPropsTileset?.length;
    const propIndex = gid - propsTilesetsFirstGid;

    if (isDynamicProp) {
      if (dynamicPropsTileset) {
        const pictureName = dynamicPropsTileset[propIndex];
        console.log('Add dynamic prop', tiledProp, pictureName);
        if (!pictureName) {
          throw new Error(
            `Could not load prop in room definition '${name}', the propIndex '${propIndex}' has no associated tilesetTile. (gid=${gid} startingGid=${propsTilesetsFirstGid})`
          );
        }
        promises.push(
          new Promise<void>(async resolve => {
            await loadImageAsSprite(
              pictureName,
              removeFileExtension(pictureName)
            );
            const prop = {
              x,
              y,
              sprite: pictureName,
              isDynamic: true,
              isFront: tiledProp.type === 'front',
            };
            room.props.push(prop);
            room.renderObjects.push(createPropRenderObject(prop));
            resolve();
          })
        );
      }
    }
  };

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

  if (props) {
    props.forEach(addProp);
  }

  if (objects) {
    objects.forEach((object: TiledObject) => {
      const isMarker = object.name.toLowerCase().indexOf('marker') > -1;
      const isTrigger = object.name.toLowerCase().indexOf('#') === 0;

      if (isMarker) {
        addMarker(object);
      } else if (isTrigger) {
        addTrigger(object);
      } else if (object.name) {
        addCharacter(object);
      } else {
        addProp(object);
        // console.error('Skipped loading unnamed tiled object', object);
      }
    });
  }

  // draw the floor to the floor canvas
  room.floorTileObjects = room.floorTileObjects.sort((a, b) => {
    return a.sortY < b.sortY ? -1 : 1;
  });
  for (let i = 0; i < room.floorTileObjects.length; i++) {
    const { sprite, px, py } = room.floorTileObjects[i];
    if (sprite) {
      drawSprite(
        sprite,
        (px as number) + room.widthPx / 2,
        py as number,
        1,
        floorCtx
      );
    }
  }

  await Promise.all(promises);

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

export const roomGetTileBelow = (room: Room, position: Point): Tile | null => {
  const [x, y] = position;
  const tileX = Math.floor(((x + TILE_WIDTH_WORLD - 3) / TILE_WIDTH) * 2);
  const tileY = Math.floor(((y + TILE_HEIGHT_WORLD - 3) / TILE_HEIGHT) * 2);
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
