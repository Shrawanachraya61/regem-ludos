/*
global
G_controller_moveAlongPath
G_controller_callUnitCommand
G_controller_getUnitCommand
G_controller_calculateDmg
G_controller_calculateHit
G_model_roomGetUnitsOfAllegiance
G_model_roomSetPhase
G_model_unitGetAllAttackableUnitsTiles
G_model_unitGetMovablePathToPoint
G_view_renderUi
G_utils_waitMs
G_UNIT_COMMAND_WAIT
G_UNIT_COMMAND_DEFEND
G_UNIT_COMMAND_ATTACK
UnitAllegiance
RoomPhase
*/

const G_controller_enemyTurn = async (room: Room) => {
  console.log('START ENEMY TURN');
  const enemies = G_model_roomGetUnitsOfAllegiance(room, UnitAllegiance.ENEMY);
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    console.log('SET ACTIVE ENEMY', enemy);
    room.ui.activeUnit = enemy;
    room.ui.enemy = null;
    const attackableUnitsTiles = G_model_unitGetAllAttackableUnitsTiles(
      enemy,
      room
    );
    G_model_roomSetPhase(room, RoomPhase.ENEMY);
    G_view_renderUi();

    if (attackableUnitsTiles.length) {
      await G_utils_waitMs(750);
      console.log('FOUND UNITS TO ATTACK', attackableUnitsTiles);
      const sortedUnits = attackableUnitsTiles.sort((a, b) => {
        if (a.unit.name === 'Medica') {
          return -1;
        }
        if (b.unit.name === 'Medica') {
          return 1;
        }
        const [damageA] = G_controller_calculateDmg(enemy, a.unit);
        const [damageB] = G_controller_calculateDmg(enemy, b.unit);
        if (damageA > damageB) {
          return -1;
        } else if (damageA < damageB) {
          return 1;
        } else {
          const [hitA] = G_controller_calculateHit(enemy, a.unit);
          const [hitB] = G_controller_calculateHit(enemy, b.unit);
          return hitA > hitB ? -1 : 1;
        }
      });
      const { unit: victim, tile } = sortedUnits[0];
      const pfPath = G_model_unitGetMovablePathToPoint(enemy, room, [
        tile.x,
        tile.y,
      ]);
      if (pfPath) {
        console.log('MOVE TO TILE', tile);
        await G_controller_moveAlongPath(room, enemy, pfPath);
        console.log('REACHED INTENDED TILE');
        console.log('ATTACK VICTIM');
        const p = G_controller_callUnitCommand(
          room,
          enemy,
          G_controller_getUnitCommand(G_UNIT_COMMAND_ATTACK)
        );
        room.ui.selUnits = [victim];
        room.ui.selUnitI = 0;
        G_utils_waitMs(1000).then(() => {
          room.ui.unitClickCb(victim);
        });
        G_view_renderUi();
        await p;
        await G_utils_waitMs(250);
      } else {
        console.log(
          'NO PATH FOUND SOMEHOW',
          [enemy.x, enemy.y],
          [tile.x, tile.y]
        );
        await G_controller_callUnitCommand(
          room,
          enemy,
          G_controller_getUnitCommand(G_UNIT_COMMAND_WAIT)
        );
      }
    } else {
      console.log('NO UNITS IN RANGE, DEFENDING');
      await G_utils_waitMs(150);
      await G_controller_callUnitCommand(
        room,
        enemy,
        G_controller_getUnitCommand(G_UNIT_COMMAND_DEFEND)
      );
    }
  }
};
