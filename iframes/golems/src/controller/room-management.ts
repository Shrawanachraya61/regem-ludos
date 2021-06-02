/*
global
G_initNewGame
G_nextRoom
G_showTitle
G_view_clearScreen
G_view_renderRoom
G_view_renderUi
G_view_playSound
G_model_roomGetAdjacentTiles
G_model_setCurrentRoom
G_model_roomSetPhase
G_model_roomUpdate
G_model_roomGetUnitsOfAllegiance
G_model_getScale
G_model_unitGetAdjacentUnits
G_model_unitUpdate
G_model_unitModifyHP
G_model_unitGetStat
G_model_unitSetState
G_model_createParticle
G_model_unitSetPath
G_model_roomGetTileAt
G_model_getCurrentRoom
G_model_createPlayer
G_model_setCurrentPlayer
G_model_getCurrentPlayer
G_model_roomGetUnitAt
G_model_roomChangeTileAt
G_controller_enemyTurn
G_utils_waitMs
G_utils_getDirTowards
G_utils_randInArr
RoomPhase
UnitState
UnitAllegiance
TILE_SIZE
*/

const G_controller_tickRoom = (room: Room) => {
  G_model_roomUpdate(room);
  const scale = G_model_getScale();
  G_view_renderRoom(room, scale, 0, 0);
};

const G_controller_endTurn = (room: Room) => {
  console.log('END TURN', room.turn);
  room.turn =
    room.turn === UnitAllegiance.PLAYER
      ? UnitAllegiance.ENEMY
      : UnitAllegiance.PLAYER;

  const units = G_model_roomGetUnitsOfAllegiance(room, room.turn);
  units.forEach(unit => {
    G_model_unitSetState(unit, UnitState.IDLE);
  });
  for (let i = 0; i < room.units.length; i++) {
    const u = room.units[i];
    u.disabled = false;
  }
  G_model_roomSetPhase(
    room,
    room.turn === UnitAllegiance.PLAYER ? RoomPhase.PLAYER : RoomPhase.ENEMY
  );
  room.ui.enemy = null;
  room.ui.player = null;
  G_view_renderUi();

  if (room.turn === UnitAllegiance.ENEMY) {
    console.log('go to enemy turn now');
    G_controller_enemyTurn(room);
  }
};

const G_controller_onUnitActed = async (room: Room, unit: Unit) => {
  const units = G_model_roomGetUnitsOfAllegiance(room, room.turn);
  const isTurnCompleted = units.every(u => {
    return u.state !== UnitState.IDLE;
  });
  const player = G_model_getCurrentPlayer();
  unit.disabled = true;
  console.log('IS TURN COMPLETED FOR:', units, isTurnCompleted);
  const attackedUnit = room.ui.selUnits[room.ui.selUnitI];
  let didKo = false;
  for (let i = 0; i < room.units.length; i++) {
    const u = room.units[i];
    if (u.hp <= 0) {
      room.particles.push(G_model_createParticle(u.x, u.y, 'KO!', 750));
      room.units.splice(i, 1);
      if (player) {
        const plInd = player.units.indexOf(u);
        if (plInd > -1) {
          player.units.splice(plInd, 1);
        }
      }
      didKo = true;
      i--;
    }
  }
  if (didKo) {
    G_view_playSound('ko');
    await G_utils_waitMs(750);
    if (unit.hp > 0 && unit.allegiance === UnitAllegiance.PLAYER) {
      await G_controller_lvlUp(room, unit);
    } else if (
      attackedUnit?.hp > 0 &&
      attackedUnit?.allegiance === UnitAllegiance.PLAYER
    ) {
      await G_controller_lvlUp(room, attackedUnit);
    }
  }

  const playerUnits = G_model_roomGetUnitsOfAllegiance(
    room,
    UnitAllegiance.PLAYER
  );
  const enemyUnits = G_model_roomGetUnitsOfAllegiance(
    room,
    UnitAllegiance.ENEMY
  );

  if (!playerUnits.length) {
    console.log('game over');
    G_view_playSound('lose');
    room.conclusion = false;
    room.phase = RoomPhase.CONCLUDED;
    G_view_renderUi();
    await G_utils_waitMs(3000);
    G_showTitle();
    return;
  }

  if (!enemyUnits.length) {
    console.log('game victor');
    G_view_playSound('win');
    room.conclusion = true;
    room.phase = RoomPhase.CONCLUDED;
    G_view_renderUi();
    await G_utils_waitMs(3000);
    const player = G_model_getCurrentPlayer() as Player;
    G_nextRoom(player);
    return;
  }

  // button gate toggle
  const TILE_ID_WALL = 1;
  const TILE_ID_BUTTON = 9;
  const TILE_ID_CLOSED_GATE = 7;
  const TILE_ID_OPEN_GATE = 8;
  const TILE_ID_HEALTH = 5;
  const TILE_ID_EVIL = 4;

  const finishedTileId = G_model_roomGetTileAt(room, unit.x, unit.y)?.id;
  const finishedOnButton = finishedTileId === TILE_ID_BUTTON;
  room.tiles.forEach(tile => {
    if (finishedOnButton || (unit.btn && !finishedOnButton)) {
      if (tile.id === TILE_ID_CLOSED_GATE) {
        G_model_roomChangeTileAt(room, tile.x, tile.y, TILE_ID_OPEN_GATE);
      } else if (tile.id === TILE_ID_OPEN_GATE) {
        G_model_roomChangeTileAt(room, tile.x, tile.y, TILE_ID_CLOSED_GATE);
      }
    }
  });
  unit.btn = finishedOnButton;

  room.ui.activeUnit = null;
  G_view_renderUi();

  const adjTiles = G_model_roomGetAdjacentTiles(room, [unit.x, unit.y]);
  const adjacentTileIds = adjTiles.map(tile => tile.id);
  const healAmt = 4;
  if (adjacentTileIds.includes(TILE_ID_HEALTH)) {
    G_model_unitModifyHP(unit, healAmt);
    room.particles.push(
      G_model_createParticle(unit.x, unit.y, '+' + healAmt, 750)
    );
    const tile = adjTiles[adjacentTileIds.indexOf(TILE_ID_HEALTH)];
    G_view_playSound('miss');
    await G_utils_waitMs(1000);
    G_model_roomChangeTileAt(room, tile.x, tile.y, TILE_ID_WALL);
    await G_utils_waitMs(250);
  }
  if (adjacentTileIds.includes(TILE_ID_EVIL)) {
    G_model_unitModifyHP(unit, -healAmt);
    room.particles.push(
      G_model_createParticle(unit.x, unit.y, '-' + healAmt, 750)
    );
    const tile = adjTiles[adjacentTileIds.indexOf(TILE_ID_EVIL)];
    G_view_playSound('hit');
    await G_utils_waitMs(1000);
    G_model_roomChangeTileAt(room, tile.x, tile.y, TILE_ID_WALL);
    await G_utils_waitMs(250);
  }

  if (isTurnCompleted) {
    G_view_renderUi();
    await G_utils_waitMs(300);
    G_view_playSound('endTurn');
    await G_utils_waitMs(300);
    G_controller_endTurn(room);
  } else {
    G_model_roomSetPhase(
      room,
      room.turn === UnitAllegiance.PLAYER ? RoomPhase.PLAYER : RoomPhase.ENEMY
    );
    G_view_renderUi();
  }
};

const G_controller_callUnitCommand = async (
  room: Room,
  unit: Unit,
  command: UnitCommand
) => {
  const success = await command.cb(unit, room);
  if (success) {
    G_controller_onUnitActed(room, unit);
  } else {
    console.log('Canceled unit action');

    G_model_roomSetPhase(room, RoomPhase.WAITING_ACTION);
    G_view_renderUi();
  }
};

const G_controller_moveAlongPath = (
  room: Room,
  unit: Unit,
  pfPath: PFPath
): Promise<void> => {
  G_model_roomSetPhase(room, RoomPhase.MOVING);
  G_view_renderUi();
  room.ui.lastPos = [unit.x, unit.y];
  return new Promise(resolve => {
    G_model_unitSetPath(unit, pfPath, resolve);
  });
};

const G_controller_cancelMovement = (room: Room, unit: Unit) => {
  unit.x = room.ui.lastPos[0];
  unit.y = room.ui.lastPos[1];
  G_view_playSound('cancel');
  G_model_roomSetPhase(
    room,
    room.turn === UnitAllegiance.PLAYER ? RoomPhase.PLAYER : RoomPhase.ENEMY
  );
  G_view_renderUi();
};

const G_controller_getLvlUpObj = () => {
  const stats = ['POW', 'FOR', 'EVA', 'MOV', 'hp'];
  const lvlUpObj: Record<string, number> = {};
  for (let i = 0; i < 2; i++) {
    const stat = G_utils_randInArr(stats);
    const ind = stats.indexOf(stat);
    stats.splice(ind, 1);
    lvlUpObj[stat] = 1;
  }
  return lvlUpObj;
};

const G_controller_assignLvlUpObj = (
  unit: Unit,
  lvlUpObj: Record<string, number>
) => {
  for (const i in lvlUpObj) {
    unit[i] += lvlUpObj[i];
    if (i === 'hp') {
      unit.mhp += lvlUpObj[i];
    }
  }
};

const G_controller_lvlUp = async (room: Room, unit: Unit) => {
  room.phase = RoomPhase.LEVEL;
  unit.ko++;

  if (unit.ko === unit.lvl) {
    unit.ko = unit.lvl - 1;
    G_view_renderUi();
    await G_utils_waitMs(1000);

    const lvlUpObj = G_controller_getLvlUpObj();
    unit.ko = unit.lvl;
    room.ui.lvl = lvlUpObj;
    G_view_playSound('select2');
    G_view_renderUi();
    await G_utils_waitMs(3000);

    unit.ko = 0;
    unit.lvl++;
    G_controller_assignLvlUpObj(unit, lvlUpObj);
    G_view_renderUi();
  } else {
    G_view_renderUi();
    await G_utils_waitMs(1000);
  }
};

const G_controller_calculateDmg = (
  attacker: Unit,
  victim: Unit
): [number, boolean] => {
  const room = G_model_getCurrentRoom() as Room;
  const { POW: aPOW } = attacker;
  const [vFOR] = G_model_unitGetStat(victim, room, 'FOR');
  let dmg = aPOW - vFOR;
  let isBonus = false;
  if (attacker.name === 'Lancer' && victim.name === 'Blocker') {
    isBonus = true;
    dmg *= 2;
  }
  if (
    attacker.name === 'Duelist' &&
    G_model_unitGetAdjacentUnits(
      victim,
      G_model_getCurrentRoom() as Room,
      victim.allegiance
    ).length === 0
  ) {
    isBonus = true;
    dmg += 3;
  }
  console.log(
    'CALC DAMAGE',
    dmg,
    isBonus,
    G_model_unitGetAdjacentUnits(victim, room, victim.allegiance)
  );
  return [Math.max(dmg, 0), isBonus];
};

const G_controller_calculateHit = (
  attacker: Unit,
  victim: Unit
): [number, boolean] => {
  let eva = victim.EVA;
  const tile = G_model_roomGetTileAt(
    G_model_getCurrentRoom() as Room,
    victim.x,
    victim.y
  );
  let isBonus = false;
  if (tile && tile.id === 6) {
    isBonus = true;
    eva += 2;
  }
  return [100 - eva * 5, isBonus];
};

const G_controller_attackUnit = async (
  room: Room,
  attacker: Unit,
  victim: Unit,
  dontCheckDefend?: boolean
): Promise<void> => {
  G_model_roomSetPhase(room, RoomPhase.BATTLE);
  G_view_renderUi();

  const { x: aX, y: aY } = attacker;
  const { x: vX, y: vY } = victim;

  const [hit] = G_controller_calculateHit(attacker, victim);
  const didAttackerHit = Math.random() * 100 <= hit;
  const [attackerDamage] = G_controller_calculateDmg(attacker, victim);

  await G_utils_waitMs(350);
  const [offX, offY] = G_utils_getDirTowards([aX, aY], [vX, vY]);
  attacker.x = attacker.x + offX / 2;
  attacker.y = attacker.y + offY / 2;
  await G_utils_waitMs(100);
  attacker.x = aX;
  attacker.y = aY;
  await G_utils_waitMs(50);
  if (didAttackerHit) {
    G_view_playSound('hit');
    G_model_unitModifyHP(victim, -attackerDamage);
    room.particles.push(
      G_model_createParticle(vX, vY, '-' + attackerDamage, 750)
    );
  } else {
    G_view_playSound('miss');
    room.particles.push(G_model_createParticle(vX, vY, 'Miss!', 750));
  }
  G_view_renderUi();
  await G_utils_waitMs(750);

  if (
    !dontCheckDefend &&
    victim.state === UnitState.DEFENDING &&
    victim.hp > 0
  ) {
    await G_controller_attackUnit(room, victim, attacker, true);
  }

  G_view_renderUi();
  await G_utils_waitMs(500);

  G_model_unitSetState(attacker, UnitState.WAITING);
  G_view_renderUi();
};
