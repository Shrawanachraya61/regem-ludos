/*
global
G_utils_to1d
G_controller_getLvlUpObj
G_controller_assignLvlUpObj
G_model_actorSetPosition
G_model_createCanvas
G_model_createTile
G_model_createUnit
G_model_unitUpdate
G_model_unitGetRangeOffsets
G_view_drawSprite
UnitAllegiance
to1dIndex
*/

enum RoomPhase {
  DEPLOY,
  ENEMY,
  PLAYER,
  MOVING,
  WAITING,
  WAITING_ACTION,
  SELECT_ENEMY,
  SELECT_TILE,
  BATTLE_FORECAST,
  BATTLE,
  LEVEL,
  CONCLUDED,
}

interface Room {
  lvl: number;
  tiles: Tile[];
  units: Unit[];
  particles: Particle[];
  deploy: Rect;
  w: number; // width/height of room (most likely 16)
  h: number;
  phase: RoomPhase;
  turn: UnitAllegiance;
  conclusion: boolean | null;
  ui: {
    activeUnit: Unit | null;
    lastPos: Point;
    enemyRanges: boolean;
    enemy: Unit | null;
    player: Unit | null;
    selUnitI: number;
    selUnits: Unit[];
    unitClickCb: (unit: Unit) => void;
    selTileI: number;
    selTiles: Tile[];
    tileClickCb: (tile: Tile) => void;
    cancelCb: () => void;
    lvl: Record<string, number>;
    deploy: {
      unitI: number;
      mapVis: boolean;
    };
  };
  template: RoomTemplate;
}

const TILE_SIZE = 16;
const PNG_SIZE = 16;

const G_MAP_TILE_NOTHING = 0;
const colorsInverted = {};
for (let i = 0; i < 64; i++) {
  colorsInverted[i] = [i * 4, i * 4, i * 4];
}
const colors = {};
for (const i in colorsInverted) {
  colors[colorsInverted[i].join('')] = Number(i);
}

interface RoomTemplate {
  deploy: Rect;
  playerUnits: number[];
}

// deployments are specified by TILED and are in absolute world coords for convenience.
// use modulus to get actual deployment values
const model_roomDatabase: Record<string, RoomTemplate> = {
  0: {
    deploy: [4, 12, 9, 14],
    playerUnits: [6, 2, 1, 3, 4, 5, 7],
  },
  1: {
    deploy: [27, 2, 30, 4],
    playerUnits: [4],
  },
  2: {
    deploy: [34, 11, 37, 13],
    playerUnits: [2],
  },
  3: {
    deploy: [50, 11, 53, 15],
    playerUnits: [1],
  },
};

const G_model_createRoom = (roomId: number): Room => {
  const tiles: Tile[] = [];
  const units: Unit[] = [];
  const particles: Particle[] = [];
  const pngSize = PNG_SIZE;
  const [, ctx] = G_model_createCanvas(pngSize, pngSize);
  G_view_drawSprite('map1_' + roomId, 0, 0, 1, ctx);

  const roomTemplate = model_roomDatabase[roomId];
  if (!roomTemplate) {
    throw new Error('no room exists with id: ' + roomId);
  }

  const { data } = ctx.getImageData(0, 0, pngSize, pngSize);
  let ctr = 0;
  for (let j = 0; j < data.length; j += 4) {
    const colorKey = `${data[j + 0]}${data[j + 1]}${data[j + 2]}`;
    let ind = colors[colorKey] || 0;
    const tx = ctr % pngSize;
    const ty = Math.floor(ctr / pngSize);
    if (ind > 15) {
      const unit = G_model_createUnit(ind - 16, tx, ty, true);
      units.push(unit);
      ind = G_MAP_TILE_NOTHING;
    }
    const tile = G_model_createTile(ind, tx, ty);
    tiles.push(tile);
    ctr++;
  }

  const room: Room = {
    lvl: roomId,
    tiles,
    units,
    particles,
    conclusion: null,
    deploy: roomTemplate.deploy.map(v => v % PNG_SIZE) as Rect,
    w: pngSize,
    h: pngSize,
    phase: RoomPhase.DEPLOY,
    turn: UnitAllegiance.PLAYER,
    ui: {
      activeUnit: null,
      lastPos: [0, 0],
      enemyRanges: false,
      enemy: null,
      player: null,
      selUnitI: 0,
      selUnits: [],
      unitClickCb: () => void 0,
      selTileI: 0,
      selTiles: [],
      tileClickCb: () => void 0,
      cancelCb: () => void 0,
      lvl: {},
      deploy: {
        unitI: 0,
        mapVis: false,
      },
    },
    template: roomTemplate,
  };

  for (let i = 0; i < roomId; i++) {
    for (let j = 0; j < units.length; j++) {
      const lvlObj = G_controller_getLvlUpObj();
      G_controller_assignLvlUpObj(units[j], lvlObj);
      units[j].lvl++;
    }
  }

  return room;
};

const G_model_roomGetUnitAt = (
  room: Room,
  x: number,
  y: number
): Unit | null => {
  for (let i = 0; i < room.units.length; i++) {
    const unit = room.units[i];
    if (unit.x === x && unit.y === y) {
      return unit;
    }
  }
  return null;
};

const G_model_roomGetTileAt = (
  room: Room,
  x: number,
  y: number
): Tile | null => {
  if (x < 0 || x >= room.w || y < 0 || y >= room.w) {
    return null;
  }
  return room.tiles[to1dIndex([x, y], room.w)] || null;
};

const G_model_roomSetPhase = (room: Room, phase: RoomPhase) => {
  room.phase = phase;
};

const G_model_roomClearFillTiles = (room: Room, ofColor?: string) => {
  room.tiles.forEach(tile => {
    if ((ofColor && ofColor === tile.fill) || ofColor === undefined) {
      tile.fill = '';
    }
  });
};

const G_model_roomClearStrokeTiles = (room: Room, ofColor?: string) => {
  room.tiles.forEach(tile => {
    if ((ofColor && ofColor === tile.stroke) || ofColor === undefined) {
      tile.stroke = '';
    }
  });
};

const G_model_roomGetSelectedUnit = (room: Room): Unit | undefined => {
  return room.ui.selUnits[room.ui.selUnitI];
};

const G_model_roomGetUnitsOfAllegiance = (
  room: Room,
  allegiance: UnitAllegiance
) => {
  return room.units.filter(unit => unit.allegiance === allegiance);
};
const G_model_roomUpdate = (room: Room) => {
  for (let i = 0; i < room.units.length; i++) {
    const unit = room.units[i];
    G_model_unitUpdate(unit);
  }

  for (let i = 0; i < room.particles.length; i++) {
    const particle = room.particles[i];
    if (particle.timer.isComplete()) {
      room.particles.splice(i, 1);
      i--;
    }
  }
};

const G_model_roomChangeTileAt = (
  room: Room,
  x: number,
  y: number,
  toId: number
) => {
  const tile = G_model_roomGetTileAt(room, x, y);
  if (tile) {
    const tileTo = G_model_createTile(toId, 0, 0);
    Object.assign(tile, tileTo);
    tile.x = x;
    tile.y = y;
  }
};

const G_model_roomGetAdjacentTiles = (room: Room, [x, y]: Point) => {
  const ret: Tile[] = [];
  G_model_unitGetRangeOffsets(1).forEach(([xOff, yOff]) => {
    const tile = G_model_roomGetTileAt(room, x + xOff, y + yOff);
    if (tile) {
      ret.push(tile);
    }
  });
  return ret;
};
