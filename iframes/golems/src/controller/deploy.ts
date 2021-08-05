/*
global
RoomPhase
UnitAllegiance
*/

const G_controller_showDeploySection = (room: Room, player: Player) => {
  room.phase = RoomPhase.DEPLOY;
  room.ui.deploy.unitI = 0;
  room.ui.deploy.mapVis = false;
  player.units = player.units
    .concat(
      room.template.playerUnits.map(unitId => {
        const unit = G_model_createUnit(unitId, 0, 0, false);
        for (let i = 0; i < room.lvl; i++) {
          const lvlObj = G_controller_getLvlUpObj();
          G_controller_assignLvlUpObj(unit, lvlObj);
          unit.lvl++;
        }
        return unit;
      })
    )
    .sort((a, b) => (a.name < b.name ? -1 : 1));
  G_view_renderUi();
};

const G_controller_deployUnitAt = (
  room: Room,
  unit: Unit,
  x: number,
  y: number
) => {
  const unitIsInMap = room.units.includes(unit);
  const unitAtPos = G_model_roomGetUnitAt(room, x, y);
  if (unitAtPos) {
    if (unitIsInMap) {
      // swap positions
      unitAtPos.x = unit.x;
      unitAtPos.y = unit.y;
    } else {
      // remove unit
      const ind = room.units.indexOf(unitAtPos);
      room.units.splice(ind, 1);
    }
  }

  if (unitAtPos !== unit) {
    unit.x = x;
    unit.y = y;
    const player = G_model_getCurrentPlayer() as Player;
    const unitsDeployed = G_model_roomGetUnitsOfAllegiance(
      room,
      UnitAllegiance.PLAYER
    ).length;
    if (!unitIsInMap) {
      if (unitsDeployed < player.maxDeploy) {
        room.units.push(unit);
      } else {
        G_view_playSound('cancel');
      }
    }
  }
};
