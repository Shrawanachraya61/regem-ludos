/*
global
Timer
G_controller_getMovableTiles
G_controller_createPFPath
G_controller_UnitCommands
G_model_roomGetUnitAt
G_model_roomGetTileAt
*/

enum UnitAllegiance {
  ENEMY,
  PLAYER,
}

enum UnitState {
  IDLE,
  ATTACKING,
  WAITING,
  DEFENDING,
  SHIELDING,
}

interface Unit {
  name: string;
  id: number;
  sprite: string;
  dsc: string;
  state: UnitState;
  disabled: boolean;
  allegiance: UnitAllegiance;
  path: {
    route: PFPath | null;
    i: number;
    t: Timer;
    cb: () => void;
  };
  lvl: number;
  ko: number;
  btn: boolean;
  x: number;
  y: number;
  mhp: number;
  hp: number;
  rng: number;
  POW: number;
  FOR: number;
  // ACC: number;
  EVA: number;
  MOV: number;
  template: UnitTemplate;
}

interface UnitTemplate {
  name: string;
  dsc: string;
  hp: number;
  POW: number;
  // ACC: number;
  FOR: number;
  EVA: number;
  MOV: number;
  rng?: number;
  act?: UnitCommandId[];
}

const model_unitDatabase: Record<string, UnitTemplate> = {
  1: {
    name: 'Blocker',
    dsc: 'Has extra FOR',
    hp: 20,
    POW: 5,
    // ACC: 5,
    FOR: 4,
    EVA: 1,
    MOV: 3,
  },
  2: {
    name: 'Shielder',
    dsc: 'Adjacent allies have +2 FOR',
    hp: 15,
    POW: 8,
    // ACC: 5,
    FOR: 1,
    EVA: 1,
    MOV: 3,
    // act: [3],
  },
  3: {
    name: 'Duelist',
    dsc: 'Bonus vs isolated enemies',
    hp: 12,
    POW: 9,
    // ACC: 5,
    FOR: 0,
    EVA: 1,
    MOV: 4,
  },
  4: {
    name: 'Ranger',
    dsc: 'Has two range',
    hp: 10,
    POW: 7,
    // ACC: 3,
    FOR: 0,
    EVA: 5,
    MOV: 4,
    rng: 2,
  },
  5: {
    name: 'Lancer',
    dsc: 'Bonus vs Blockers',
    hp: 15,
    POW: 9,
    // ACC: 5,
    FOR: 2,
    EVA: 5,
    MOV: 4,
  },
  6: {
    name: 'Medica',
    dsc: 'Can heal adjacent spaces',
    hp: 18,
    POW: 4,
    // ACC: 5,
    FOR: 1,
    EVA: 8,
    MOV: 4,
    act: [3],
  },
  7: {
    name: 'Vaulter',
    dsc: 'Has extra MOV',
    hp: 12,
    POW: 8,
    // ACC: 5,
    FOR: 3,
    EVA: 5,
    MOV: 5,
    // act: [5],
  },
  // 8: {
  //   name: 'Bomber',
  //   dsc: '',
  //   hp: 14,
  //   POW: 7,
  //   // ACC: 5,
  //   FOR: 1,
  //   EVA: 5,
  //   MOV: 4,
  //   act: [6],
  // },
};

const G_model_createUnit = (
  id: number,
  x: number,
  y: number,
  isEnemy: boolean
): Unit => {
  const unitTemplate = model_unitDatabase[id];
  if (!unitTemplate) {
    throw new Error('Unknown unit with id: ' + id);
  }

  return {
    sprite: 'actors1_' + (isEnemy ? id : id + '_alt'),
    state: UnitState.IDLE,
    id,
    x,
    y,
    lvl: 1,
    ko: 0,
    btn: false,
    disabled: false,
    allegiance: isEnemy ? UnitAllegiance.ENEMY : UnitAllegiance.PLAYER,
    path: {
      route: null,
      i: 0,
      t: new Timer(100),
      cb: () => void 0,
    },
    rng: 1,
    mhp: unitTemplate.hp,
    ...unitTemplate,
    template: unitTemplate,
  };
};

const G_model_unitSetPath = (
  unit: Unit,
  path: PFPath | null,
  cb: () => void
) => {
  unit.path.route = path;
  if (path) {
    unit.path.i = 0;
  }
  unit.path.cb = cb;
  unit.path.t.start();
};

const G_model_unitSetState = (unit: Unit, state: UnitState) => {
  unit.state = state;
};

const G_model_unitGetMovablePathToPoint = (
  unit: Unit,
  room: Room,
  point: Point
) => {
  const points = G_model_unitGetMovableTiles(unit, room).map(
    tile => [tile.x, tile.y] as Point
  );
  const unitAtPoint = G_model_roomGetUnitAt(room, point[0], point[1]);
  if (unitAtPoint && unitAtPoint !== unit) {
    return false;
  }
  const allowedToMoveThere = points.reduce((canMoveToPreviousPoint, p) => {
    return canMoveToPreviousPoint || point.join(',') === p.join(',');
  }, false);
  if (allowedToMoveThere) {
    const pfPath = G_controller_createPFPath(
      [unit.x, unit.y],
      point,
      room,
      unit.allegiance
    );
    return pfPath;
  }
};

const G_model_unitGetAvailableCommands = (unit: Unit, room: Room) => {
  const unitActions = (unit.template.act ?? []).map(
    commandId => G_controller_UnitCommands[commandId]
  );

  const actions: UnitCommand[] = [
    G_controller_UnitCommands[0], // attack
    ...unitActions,
    G_controller_UnitCommands[1], // defend
    G_controller_UnitCommands[2], // wait
  ].filter(action => action.cnd(unit, room));
  return actions;
};

const G_model_unitGetRangeOffsets = (rng: number): Point[] => {
  const ret: Point[] = [];
  for (let j = -rng; j <= rng; j++) {
    const absJ = Math.abs(j);
    for (let i = -rng + absJ; i <= rng - absJ; i++) {
      if (i || j) {
        ret.push([j, i]);
      }
    }
  }
  return ret;
};

const G_model_unitGetAttackableUnitsFromCurrentPos = (
  unit: Unit,
  room: Room
) => {
  const { x, y, rng } = unit;
  return G_model_unitGetRangeOffsets(rng)
    .map(([j, i]) => {
      const potentialUnit = G_model_roomGetUnitAt(room, x + j, y + i);
      if (potentialUnit && potentialUnit.allegiance != unit.allegiance) {
        return potentialUnit;
      }
    })
    .filter(v => !!v) as Unit[];
};

const G_model_unitGetAllAttackableUnitsTiles = (
  unit: Unit,
  room: Room
): { unit: Unit; tile: Tile }[] => {
  interface UnitTile {
    unit: Unit;
    tile: Tile;
  }

  const tiles = G_model_unitGetMovableTiles(unit, room);
  const { x, y } = unit;
  let ret: UnitTile[] = [];
  tiles.forEach(tile => {
    const unitAtTile = G_model_roomGetUnitAt(room, tile.x, tile.y);
    if (unitAtTile && unitAtTile !== unit) {
      return;
    }
    unit.x = tile.x;
    unit.y = tile.y;
    const unitTiles = G_model_unitGetAttackableUnitsFromCurrentPos(
      unit,
      room
    ).map((u: Unit) => {
      return {
        unit: u,
        tile,
      };
    });
    ret = ret.concat(unitTiles);
  });
  unit.x = x;
  unit.y = y;
  return ret;
};

const G_model_unitGetAllAttackableTiles = (unit: Unit, room: Room): Tile[] => {
  let ret: Tile[] = [];
  G_model_unitGetMovableTiles(unit, room).forEach(tile => {
    const rangedTiles = G_model_unitGetRangeOffsets(unit.rng)
      .map(p => G_model_roomGetTileAt(room, tile.x + p[0], tile.y + p[1]))
      .filter(t => !!t);
    ret = ret.concat(rangedTiles as Tile[]);
  });
  return ret;
};

const G_model_unitGetMovableTiles = (unit: Unit, room: Room): Tile[] => {
  const ret: Tile[] = [];

  const { x, y, allegiance } = unit;
  const mov = unit.MOV;

  for (let i = -mov; i <= mov; i++) {
    for (let j = -mov; j <= mov; j++) {
      const targetPoint: Point = [x + j, y + i];
      const tile = G_model_roomGetTileAt(room, targetPoint[0], targetPoint[1]);
      if (!tile) {
        continue;
      }
      const { path } = G_controller_createPFPath(
        [x, y],
        targetPoint,
        room,
        allegiance
      );
      if (path.length && path.length <= mov) {
        ret.push(tile);
      }
    }
  }

  return ret;
};

const G_model_unitGetAdjacentUnits = (
  unit: Unit,
  room: Room,
  allegiance?: UnitAllegiance
) => {
  const ret: Unit[] = [];
  G_model_unitGetRangeOffsets(1).forEach(([xOff, yOff]) => {
    const u = G_model_roomGetUnitAt(room, unit.x + xOff, unit.y + yOff);
    if (u) {
      if (allegiance === undefined || allegiance === u.allegiance) {
        ret.push(u);
      }
    }
  });
  return ret;
};

const G_model_unitModifyHP = (unit: Unit, val: number) => {
  unit.hp += val;
  if (unit.hp < 0) {
    unit.hp = 0;
  } else if (unit.hp > unit.mhp) {
    unit.hp = unit.mhp;
  }
};

const G_model_unitGetSprite = (unit: Unit) => {
  if (unit.disabled) {
    return 'actors1_' + unit.id + '_disabled';
  }
  return unit.sprite;
};

const G_model_unitGetName = (unit: Unit) => {
  return unit.name + ' ' + unit.lvl;
};

// [value, base, bonus]
const G_model_unitGetStat = (
  unit: Unit,
  room: Room,
  stat: 'POW' | 'FOR' | 'MOV' | 'EVA' | 'hp'
): [number, number, number] => {
  if (stat === 'FOR') {
    const adjUnits = G_model_unitGetAdjacentUnits(unit, room, unit.allegiance);
    for (let i = 0; i < adjUnits.length; i++) {
      const adjUnit = adjUnits[i];
      if (adjUnit.name === 'Shielder') {
        return [unit.FOR + 2, unit.FOR, 2];
      }
    }
  }
  return [unit[stat], unit[stat], 0];
};

const G_model_unitUpdate = (unit: Unit) => {
  if (unit.path.route) {
    const { t, i, route } = unit.path;
    if (t.isComplete()) {
      t.start();
      const pt = route.path[i];
      if (pt) {
        unit.x = pt[0];
        unit.y = pt[1];
      }
      unit.path.i++;
      if (i >= route.path.length) {
        unit.path.cb();
        G_model_unitSetPath(unit, null, () => void 0);
      }
    }
  }
};
