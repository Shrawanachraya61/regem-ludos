/*
global
UnitState
RoomPhase
UnitAllegiance
*/

interface UnitCommand {
  name: string;
  cnd: (unit: Unit, room: Room) => boolean;
  cb: (unit: Unit, room: Room) => Promise<boolean>;
}
const G_controller_selectUnit = (room: Room, units: Unit[]): Promise<Unit> => {
  G_model_roomSetPhase(room, RoomPhase.SELECT_ENEMY);
  room.ui.selUnitI = 0;
  room.ui.selUnits = units;
  G_view_renderUi();
  return new Promise((resolve, reject) => {
    room.ui.unitClickCb = (unit: Unit) => {
      resolve(unit);
    };
    room.ui.cancelCb = reject;
  });
};

const G_controller_selectTile = (room: Room, tiles: Tile[]): Promise<Tile> => {
  G_model_roomSetPhase(room, RoomPhase.SELECT_ENEMY);
  room.ui.selTileI = 0;
  room.ui.selTiles = tiles;
  G_view_renderUi();
  return new Promise((resolve, reject) => {
    room.ui.tileClickCb = (tile: Tile) => {
      resolve(tile);
    };
    room.ui.cancelCb = reject;
  });
};

type UnitCommandId = 0 | 1 | 2 | 3 | 4 | 5 | 6;
const G_UNIT_COMMAND_ATTACK = 0;
const G_UNIT_COMMAND_DEFEND = 1;
const G_UNIT_COMMAND_WAIT = 2;
const G_UNIT_COMMAND_SHIELD = 3;
const G_UNIT_COMMAND_HEAL = 4;
const G_UNIT_COMMAND_VAULT = 5;
const G_UNIT_COMMAND_BOMB = 6;
const G_controller_getUnitCommand = (id: number) => {
  return G_controller_UnitCommands[id];
};

const G_controller_UnitCommands: UnitCommand[] = [
  // 0
  {
    name: 'Attack',
    cnd: (unit: Unit, room: Room) => {
      return (
        G_model_unitGetAttackableUnitsFromCurrentPos(unit, room).length > 0
      );
    },
    cb: async (unit: Unit, room: Room) => {
      try {
        const victim = await G_controller_selectUnit(
          room,
          G_model_unitGetAttackableUnitsFromCurrentPos(unit, room)
        );
        await G_controller_attackUnit(room, unit, victim);
      } catch (e) {
        console.log('select unit canceled', e);
        return false;
      }
      return true;
    },
  },
  // 1
  {
    name: 'Defend',
    cnd: (unit: Unit) => {
      return unit.path.i <= unit.MOV;
    },
    cb: async (unit: Unit) => {
      G_model_unitSetState(unit, UnitState.DEFENDING);
      return true;
    },
  },
  // 2
  {
    name: 'Wait',
    cnd: () => true,
    cb: async (unit: Unit) => {
      G_model_unitSetState(unit, UnitState.WAITING);
      return true;
    },
  },
  // 3
  {
    name: 'Heal Adj',
    cnd: (unit: Unit, room: Room) => {
      const healAmt = Math.floor(unit.mhp / 4);
      const units = G_model_unitGetAdjacentUnits(
        unit,
        room,
        UnitAllegiance.PLAYER
      );
      return unit.hp > healAmt && !!units.length;
    },
    cb: async (unit: Unit, room: Room) => {
      G_model_roomSetPhase(room, RoomPhase.WAITING);
      G_view_renderUi();
      G_view_playSound('select2');
      await G_utils_waitMs(500);

      const healAmt = Math.floor(unit.mhp / 4);
      G_model_unitGetAdjacentUnits(unit, room, UnitAllegiance.PLAYER).forEach(
        unitToHeal => {
          G_model_unitModifyHP(unitToHeal, healAmt);
          room.particles.push(
            G_model_createParticle(
              unitToHeal.x,
              unitToHeal.y,
              '+' + healAmt,
              750
            )
          );
        }
      );
      G_model_unitModifyHP(unit, -healAmt);
      room.particles.push(
        G_model_createParticle(unit.x, unit.y, '-' + healAmt, 750)
      );

      G_view_playSound('select3');
      await G_utils_waitMs(1000);

      G_model_unitSetState(unit, UnitState.WAITING);
      return true;
    },
  },
  // 4
  // {
  //   name: 'Shield',
  //   cnd: () => true,
  //   cb: async (unit: Unit) => {
  //     G_model_unitSetState(unit, UnitState.SHIELDING);
  //     return true;
  //   },
  // },
  // 5
  // {
  //   name: 'Vault',
  //   cnd: () => true,
  //   cb: async (unit: Unit) => {
  //     // G_model_unitSetState(unit, UnitState.SHIELDING);
  //     G_model_unitSetState(unit, UnitState.WAITING);
  //     return true;
  //   },
  // },
  // // 6
  // {
  //   name: 'Bomb',
  //   cnd: () => true,
  //   cb: async (unit: Unit) => {
  //     // G_model_unitSetState(unit, UnitState.SHIELDING);
  //     G_model_unitSetState(unit, UnitState.WAITING);
  //     return true;
  //   },
  // },
];
