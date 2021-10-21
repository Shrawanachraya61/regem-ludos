import { createSprite, loadImageAsSprite, Sprite } from 'model/sprite';
import {
  removeFileExtension,
  Point,
  isoToPixelCoords,
  pixelToIsoCoords,
  facingToIncrements,
  pxFacingToWorldFacing,
  calculateDistance,
} from 'utils';
import {
  Character,
  characterSetPos,
  characterCreateFromTemplate,
  characterGetPos,
  characterGetPosBottom,
  Facing,
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
import { sceneIsEncounterDefeated } from './scene';
import { getCurrentOverworld, getCurrentScene } from './generics';
import { getIfExists as getItem, Item } from 'db/items';
import { Transform, TransformEase } from './utility';
import { addRoomUiParticle, removeRoomUiParticle } from 'controller/ui-actions';

export const TILE_WIDTH = 32;
export const TILE_HEIGHT = 32;
export const TILE_WIDTH_WORLD = 16;
export const TILE_HEIGHT_WORLD = 16;

// given an x, y in tile coordinates, return the world x and y coordinates
export const tilePosToWorldPos = (x: number, y: number): Point => {
  return [(x * TILE_WIDTH) / 2, (y * TILE_HEIGHT) / 2];
};

export const getAllTagMarkers = (room: Room, name: string) => {
  return room.taggedMarkers.filter((marker: Marker) => {
    return marker.name === name;
  });
};

const isWallProp = (sprite: string) => {
  const wallProps = [
    'props_0',
    'props_1',
    'props_2',
    'props_3',
    'props_4',
    'props_5',
    'props_6',
    'props_8',
    'props_9',
    'props_10',
    'props_11',
    'props_12',
    'props_13',
  ];
  return wallProps.includes(sprite);
};

export interface Room {
  name: string;
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
  taggedMarkers: Marker[];
  triggerActivators: TriggerActivator[];
  visible: boolean;
  bgImage: string;
  bgTransform: Transform;
}

export const roomCopy = (room: Room) => {
  // HACK: should just deep copy it
  const roomCp = createRoom(room.name, room.tiledJson);
  return roomCp;
};

export interface Prop {
  id: string;
  sprite: string;
  x: number;
  y: number;
  isDynamic: boolean;
  isFront: boolean;
  isItem?: boolean;
  itemName?: string;
  sortOffset?: number;
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
  isProp: boolean;
  floorTileBeneath?: Tile;
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
  properties?: {
    name: 'overworldAi' | 'encounterName';
    value: string;
  }[];
  gid?: number;
  id?: number;
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
  name: 'Props' | 'Objects' | 'Tiles' | 'Tiles2';
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
    const tilesetA = tilesets[i];
    const tilesetB = tilesets[i + 1];
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
export const loadDynamicPropsTileset = async () => {
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

const promises: Promise<any>[] = [];
export const awaitAllRoomProps = async () => {
  await Promise.all(promises);
};

export const createRoom = (name: string, tiledJson: any): Room => {
  const { width, height, data } =
    tiledJson.layers.find((l: TiledLayer) => l.name === 'Tiles') ?? {};
  if (!data) {
    throw new Error(
      `Cannot create room '${name}', it does not have a layer named 'Tiles'`
    );
  }
  const secondaryTileLayer = tiledJson.layers.find(
    (l: TiledLayer) => l.name === 'Tiles2'
  );
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
    name,
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
    taggedMarkers: [] as Marker[],
    triggerActivators: [] as TriggerActivator[],
    renderObjects: [] as RenderObject[],
    floorTileObjects: [] as RenderObject[],
    floor: createSprite(floorCanvas),
    defaultFloorSprite: 'floors_1', //TODO make this a room param
    visible: true,
    bgImage: '',
    bgTransform: new Transform(
      [0, 0, 0],
      [0, 0, 0],
      1000,
      TransformEase.LINEAR
    ),
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

  const applyTileTemplate = (tile: Tile) => {
    const tileTemplate = getReplacementTemplate(tile.sprite);
    if (tileTemplate && tile.ro) {
      tile.ro.sprite = tileTemplate.baseSprite;
      tile.isWall = tileTemplate.isWall ?? tile.isWall;
      if (tileTemplate?.animName) {
        tile.animName = tileTemplate.animName;
        tile.ro.anim = createAnimation(tileTemplate.animName);
        tile.ro.anim.start();
      }
      if (tileTemplate.onAfterCreation) {
        tileTemplate.onAfterCreation(tile);
      }
    }
  };

  const addTile = (tiledTileId: number, i: number) => {
    // Tiled sets id to 0 when no tile exists
    if (tiledTileId === 0) {
      // the blank floors_1 tile
      tiledTileId = 129;
    }

    const { sprite, tileWidth, tileHeight } = gidToTileSpriteAndSize(
      tiledJson.tilesets,
      tiledTileId
    );

    const isWallTileset = sprite.indexOf('wall') > -1;
    const isPropTileset = sprite.indexOf('props') > -1;
    const isFloorTileset = sprite.indexOf('floors') > -1;
    let isFromTiles2 = false;
    if (secondaryTileLayer) {
      if (
        secondaryTileLayer.data[i] !== 0 &&
        data[i] !== secondaryTileLayer.data[i]
      ) {
        isFromTiles2 = true;
      }
    }

    const tile = {
      sprite,
      tileWidth,
      tileHeight,
      isWall: isWallTileset || isPropTileset,
      // y sorting and collisions are different if something is classified as a prop.
      // certain props are big enough to be considered walls
      isProp: isPropTileset && !isWallProp(sprite),
      id: tiledTileId - 1,
      x: i % width,
      y: Math.floor(i / width),
      highlighted: false,
    } as Tile;

    room.tiles.push(tile);
    const ro = createTileRenderObject(tile);
    if (ro.isFloor) {
      room.renderObjects.push(ro);
      if (tile.sprite === 'floors_0') {
        tile.isProp = true;
        tile.isWall = true;
      }

      if (isFromTiles2) {
        // if a tile came from the Tiles2 layer, then use the tile from below it as the
        // floor below it (special case for negative Z tiles)
        const { sprite: floorSprite } = gidToTileSpriteAndSize(
          tiledJson.tilesets,
          data[i]
        );
        const defaultFloorSprite = floorSprite;
        const floorTile = {
          ...tile,
          tileWidth: 32,
          tileHeight: 32,
          sprite: defaultFloorSprite,
          id: isFromTiles2 ? data[i] || 1 : 1,
        } as Tile;
        const roFloor = createTileRenderObject(floorTile);
        floorTile.ro = roFloor;
        floorTile.ro.sortY -= 1;
        applyTileTemplate(floorTile);
        tile.floorTileBeneath = floorTile;
        room.renderObjects.push(roFloor);
      }
    } else {
      let defaultFloorSprite = room.defaultFloorSprite;
      if (isFromTiles2) {
        // if a tile came from the Tiles2 layer, then use the tile from below it as the
        // floor sprite.  This way it looks the same as how Tiled sees it.
        const { sprite: floorSprite } = gidToTileSpriteAndSize(
          tiledJson.tilesets,
          data[i]
        );
        defaultFloorSprite = floorSprite;
      }

      if (tile.isWall && !tile.isProp) {
        const floorTile = {
          ...tile,
          tileWidth: 32,
          tileHeight: 32,
          sprite: defaultFloorSprite,
          id: isFromTiles2 ? data[i] || 1 : 1,
        } as Tile;
        const roFloor = createTileRenderObject(floorTile);
        floorTile.ro = roFloor;
        applyTileTemplate(floorTile);
        tile.floorTileBeneath = floorTile;
        room.renderObjects.push(roFloor);
      } else {
        ro.sortY += 8;
        const floorTile = {
          ...tile,
          tileWidth: 32,
          tileHeight: 32,
          sprite: defaultFloorSprite,
          id: 1,
          x: tile.x,
          y: tile.y,
        } as Tile;
        const roFloor = createTileRenderObject(floorTile);
        floorTile.ro = roFloor;
        applyTileTemplate(floorTile);
        tile.floorTileBeneath = floorTile;
        room.renderObjects.push(roFloor);
      }
      room.renderObjects.push(ro);
    }

    tile.ro = ro;
    applyTileTemplate(tile);
  };

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
        if (!pictureName) {
          throw new Error(
            `Could not load prop in room definition '${name}', the propIndex '${propIndex}' has no associated tilesetTile. (gid=${gid} startingGid=${propsTilesetsFirstGid})`
          );
        }
        promises.push(
          new Promise<void>(resolve => {
            loadImageAsSprite(
              pictureName,
              removeFileExtension(pictureName)
            ).then(() => {
              const prop: Prop = {
                id: `prop,${x},${y}`,
                x,
                y,
                sprite: pictureName,
                isDynamic: true,
                isFront: tiledProp.type === 'front',
              };
              const ro = createPropRenderObject(prop);
              prop.ro = ro;
              room.props.push(prop);
              room.renderObjects.push(ro);
              resolve();
            });
          })
        );
      }
    } else if (tiledJson.tilesets && gid) {
      const { sprite, tileWidth, tileHeight } = gidToTileSpriteAndSize(
        tiledJson.tilesets,
        gid
      );
      const sortOffset = isNaN(parseFloat(tiledProp.type))
        ? undefined
        : parseFloat(tiledProp.type);
      const prop: Prop = {
        id: `prop,${x},${y}`,
        x,
        y,
        sprite,
        isDynamic: true,
        sortOffset,
        isFront: tiledProp.type === 'front',
      };
      const ro = createPropRenderObject(prop);
      prop.ro = ro;
      room.props.push(prop);
      room.renderObjects.push(ro);
    }
  };

  const addTreasure = (tiledProp: any) => {
    const itemTemplateName: string = tiledProp.name.slice(4);
    const item = getItem(itemTemplateName);
    if (!item) {
      throw new Error(
        `Could not load treasure ${tiledProp.name} in room definition ${name}, no entry for the item is in the db`
      );
    }

    const x: number = tiledProp.x - 32 * 2 + 16;
    const y: number = tiledProp.y - 32 * 2 + 16;

    const prop: Prop = {
      id: `prop,${x},${y}`,
      x,
      y,
      sprite: 'props_31', // the Present/Gift sprite
      isDynamic: true,
      isFront: false,
      isItem: true,
      itemName: itemTemplateName,
    };
    const ro = createPropRenderObject(prop, true);
    prop.ro = ro;
    room.props.push(prop);
    room.renderObjects.push(ro);
  };

  const addCharacter = (tiledObject: TiledObject) => {
    // console.log('Tiled addCharacter', tiledObject);
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
    const customProps = tiledObject.properties ?? [];
    const customOverworldAi = customProps.find(p => p.name === 'overworldAi');
    if (customOverworldAi) {
      chTemplate.overworldAi = customOverworldAi.value;
    }
    const customEncounterName = customProps.find(
      p => p.name === 'encounterName'
    );
    if (customEncounterName) {
      const roamerName = chTemplate.name + ',' + tiledObject.id;
      const scene = getCurrentScene();

      if (sceneIsEncounterDefeated(scene, roamerName, room.name)) {
        return;
      }
      chTemplate.encounterName = customEncounterName.value;
      chTemplate.name = roamerName;
      chTemplate.nameLabel = chTemplate.name;
    } else if (customOverworldAi) {
      console.error(
        `Error, character has an overworldAi but not an encounterName: ${tiledObject.name} `,
        tiledObject
      );
    }

    const ch = characterCreateFromTemplate(chTemplate);
    characterSetPos(ch, [newX, newY, 0]);
    roomAddCharacter(room, ch);
  };

  const addMarker = (tiledObject: TiledObject) => {
    // console.log('Tiled addMarker', tiledObject);
    const x = tiledObject.x;
    const y = tiledObject.y;
    // tiled specifies objects drawn from the bottom, subtract half height to put them in the same visual spot
    const [xPx, yPy] = isoToPixelCoords(x, y);
    const [newX, newY] = pixelToIsoCoords(xPx, yPy - 16);
    if (room.markers[tiledObject.name]) {
      throw new Error(
        `Could not load marker '${tiledObject.name}' in room definition '${name}', a marker with that name already exists.`
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

  const addTaggedMarker = (tiledObject: TiledObject) => {
    // console.log('Tiled addMarker', tiledObject);
    const x = tiledObject.x;
    const y = tiledObject.y;
    // tiled specifies objects drawn from the bottom, subtract half height to put them in the same visual spot
    const [xPx, yPy] = isoToPixelCoords(x, y);
    const [newX, newY] = pixelToIsoCoords(xPx, yPy - 16);
    const marker = {
      name: tiledObject.name,
      x: newX,
      y: newY,
    };
    room.taggedMarkers.push(marker);
    room.renderObjects.push(createMarkerRenderObject(marker));
  };

  const addTrigger = (tiledObject: TiledObject) => {
    // console.log('Tiled addTrigger', tiledObject);
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

  const tiles = data.slice();

  // The secondary tile layer overrides the one beneath it
  if (secondaryTileLayer && secondaryTileLayer.data) {
    secondaryTileLayer.data.forEach((tiledTileId: number, i: number) => {
      if (tiledTileId !== 0) {
        tiles[i] = tiledTileId;
      }
    });
  }

  tiles.forEach(addTile);

  if (props) {
    props.forEach(addProp);
  }

  if (objects) {
    objects.forEach((object: TiledObject) => {
      const isTaggedMarker =
        object.name.toLowerCase().indexOf('tagmarker') === 0;
      const isMarker = object.name.toLowerCase().indexOf('marker') > -1;
      const isTrigger = object.name.toLowerCase().indexOf('#') === 0;
      const isTreasure = object.name.toLowerCase().indexOf('item') === 0;

      if (isTaggedMarker) {
        addTaggedMarker(object);
      } else if (isMarker) {
        addMarker(object);
      } else if (isTrigger) {
        addTrigger(object);
      } else if (isTreasure) {
        addTreasure(object);
      } else if (object.name) {
        addCharacter(object);
      } else {
        addProp(object);
      }
    });
  }

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
  if (particle.uiComponent) {
    addRoomUiParticle(particle);
  }
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
    if (ch.name.toLowerCase() === chName.toLowerCase()) {
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

export const roomRemoveParticle = (room: Room, p: Particle) => {
  const pInd = room.particles.indexOf(p);
  if (pInd > -1) {
    room.particles.splice(pInd, 1);
  }
  removeRoomUiParticle(p);
};

export const roomRemoveProp = (room: Room, prop: Prop) => {
  const ind = room.props.indexOf(prop);
  if (ind > -1) {
    room.props.splice(ind, 1);
  }
  const ind2 = room.renderObjects.indexOf(prop.ro as RenderObject);
  if (ind2 > -1) {
    room.renderObjects.splice(ind2, 1);
  }
};

export const roomShow = (room: Room) => {
  room.visible = true;
};

export const roomHide = (room: Room) => {
  room.visible = false;
};

const _innerNearestInSomeDirection = (
  room: Room,
  x: number,
  y: number,
  pxFacing: Facing
) => {
  let tile = roomGetTileBelow(room, [x, y]);
  if (!tile) {
    console.error(room, x, y);
    console.error(
      'cannot _innerNearestInSomeDirection, given point is not contained within the room.'
    );
    return Infinity;
  }
  const [incrementX, incrementY] = facingToIncrements(
    pxFacingToWorldFacing(pxFacing)
  );

  let loopCtr = 0;
  let xOffset = 0;
  let yOffset = 0;
  do {
    if (tile) {
      const nextTile = roomGetTileBelow(room, [x + xOffset, y + yOffset]);
      if (nextTile && !nextTile.isWall) {
        tile = nextTile;
        xOffset += 1 * incrementX;
        yOffset += 1 * incrementY;
      } else {
        break;
      }
    }
    loopCtr++;
  } while (loopCtr < 100);

  return calculateDistance([x, y, 0], [x + xOffset, y + yOffset, 0]);
};

export const roomGetDistanceToNearestWallInFacingDirection = (
  room: Room,
  ch: Character
): number => {
  const [x, y] = characterGetPosBottom(ch);
  const sz = 32;
  const points = [
    [x + sz, y],
    [x - sz, y],
    [x, y + sz],
    [x, y - sz],
  ];

  let minDistance = Infinity;
  for (let i = 0; i < points.length; i++) {
    const d = _innerNearestInSomeDirection(
      room,
      points[i][0],
      points[i][1],
      ch.facing
    );
    minDistance = Math.min(minDistance, d);
  }
  return minDistance;
};

export const roomDoCharactersOccupySameTile = (
  room: Room,
  ch1: Character,
  ch2: Character
): boolean => {
  const tileBelow1 = roomGetTileBelow(room, [ch1.x, ch1.y]);
  const tileBelow2 = roomGetTileBelow(room, [ch2.x, ch2.y]);

  if (tileBelow1 && tileBelow2) {
    if (tileBelow1 === tileBelow2) {
      return true;
    }
  }
  return false;
};

export const roomGetEmptyAdjacentTile = (
  room: Room,
  ch: Character,
  biasCh?: Character
) => {
  const left = roomGetTileBelow(room, [ch.x - TILE_WIDTH_WORLD, ch.y]);
  const up = roomGetTileBelow(room, [ch.x, ch.y - TILE_HEIGHT_WORLD]);
  const right = roomGetTileBelow(room, [ch.x + TILE_WIDTH_WORLD, ch.y]);
  const down = roomGetTileBelow(room, [ch.x, ch.y + TILE_HEIGHT_WORLD]);

  let adjacentTiles = [left, up, right, down];

  if (biasCh) {
    const { x, y } = biasCh;
    const { x: x2, y: y2 } = ch;
    const dx = x2 - x;
    const dy = y2 - y;
    if (dx < 0) {
      if (dy < 0) {
        adjacentTiles = [right, down, left, up];
      } else {
        adjacentTiles = [right, up, left, down];
      }
    } else {
      if (dy < 0) {
        adjacentTiles = [left, down, right, up];
      }
    }
  }

  for (let i = 0; i < adjacentTiles.length; i++) {
    const tile = adjacentTiles[i];
    if (tile && !tile.isWall && !tile.isProp) {
      const tileDown = roomGetTileAt(room, tile.x, tile.y + 1);
      const tileRight = roomGetTileAt(room, tile.x + 1, tile.y);
      if (tileDown?.isWall) {
        continue;
      }
      if (tileRight?.isWall) {
        continue;
      }
      return tile;
    }
  }
  return null;
};
