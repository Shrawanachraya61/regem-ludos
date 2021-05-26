/*
global
G_controller_moveAlongPath
G_controller_deployUnitAt
G_model_getScale
G_model_getCurrentRoom
G_model_roomGetTileAt
G_model_roomGetUnitAt
G_model_roomClearFillTiles
G_model_roomClearStrokeTiles
G_model_roomGetUnitsOfAllegiance
G_model_roomSetPhase
G_model_unitGetMovablePathToPoint
G_model_unitGetMovableTiles
G_model_unitSetPath
G_model_unitSetState
G_model_getCurrentPlayer
G_view_getElementById
G_view_hexToRgba
G_view_renderUi
G_view_playSound
G_initNewGame
TILE_SIZE
Colors
UnitAllegiance
UnitState
Unit
RoomPhase
*/

const G_controller_initEvents = () => {
  const roomPhasePlayerMouseListener = (room: Room, x: number, y: number) => {
    const unit = G_model_roomGetUnitAt(room, x, y);
    if (unit && unit !== room.ui.activeUnit) {
      if (unit.allegiance === UnitAllegiance.ENEMY) {
        room.ui.enemy = unit === room.ui.enemy ? null : unit;
        if (room.ui.enemy) {
          G_view_playSound('select');
        } else {
          G_view_playSound('cancel');
        }
      } else {
        if (unit.state === UnitState.IDLE) {
          room.ui.activeUnit = unit;
          G_view_playSound('select4');
          // room.ui.player = null;
        } else {
          room.ui.player = unit === room.ui.player ? null : unit;
          room.ui.activeUnit = null;
          G_view_playSound('select');
        }
        // room.ui.activeUnit = room.ui.activeUnit === unit ? null : unit;
      }
    } else {
      if (room.ui.activeUnit) {
        const unit = room.ui.activeUnit;
        const pfPath = G_model_unitGetMovablePathToPoint(unit, room, [x, y]);
        if (pfPath) {
          G_view_playSound('select');
          if (x === unit.x && y === unit.y) {
            room.ui.lastPos = [x, y];
            room.ui.activeUnit.path.i = 0;
            G_view_playSound('rdy');
            G_model_roomSetPhase(room, RoomPhase.WAITING_ACTION);
            G_view_renderUi();
          } else {
            G_controller_moveAlongPath(room, unit, pfPath).then(() => {
              G_view_playSound('rdy');
              G_model_roomSetPhase(room, RoomPhase.WAITING_ACTION);
              G_view_renderUi();
            });
          }
        } else {
          G_view_playSound('cancel');
          room.ui.activeUnit = null;
        }
      } else if (room.ui.enemy) {
        G_view_playSound('cancel');
      }
      room.ui.player = null;
      room.ui.enemy = null;
    }

    G_view_renderUi();
  };

  const roomPhaseSelectEnemyMouseListener = (
    room: Room,
    x: number,
    y: number
  ) => {
    const unit = G_model_roomGetUnitAt(room, x, y);
    if (unit) {
      const ind = room.ui.selUnits.indexOf(unit);
      if (ind > -1) {
        G_view_playSound('select');
        room.ui.selUnitI = ind;
        G_view_renderUi();
      }
    }
  };

  const roomPhaseSelectTileMouseListener = (
    room: Room,
    x: number,
    y: number
  ) => {};

  const roomPhaseDeployMouseListener = (room: Room, x: number, y: number) => {
    const [x1, y1, x2, y2] = room.deploy;
    const player = G_model_getCurrentPlayer();
    if (player) {
      const unit = player.units[room.ui.deploy.unitI];
      const isMapVis = room.ui.deploy.mapVis;
      if (x >= x1 && x < x2 && y >= y1 && y < y2 && !isMapVis) {
        G_view_playSound('select3');
        G_controller_deployUnitAt(room, unit, x, y);
      }
    }

    const unit = G_model_roomGetUnitAt(room, x, y);
    if (unit && room.ui.deploy.mapVis) {
      if (unit.allegiance === UnitAllegiance.ENEMY) {
        room.ui.enemy = unit === room.ui.enemy ? null : unit;
        if (room.ui.enemy) {
          G_view_playSound('select');
        } else {
          G_view_playSound('cancel');
        }
      }
    } else {
      if (room.ui.enemy) {
        G_view_playSound('cancel');
      }
      room.ui.enemy = null;
    }
    G_view_renderUi();
  };

  const elem = G_view_getElementById('canv');
  if (elem) {
    elem.onmousedown = elem.ontouchstart = (ev: any) => {
      let { offsetX, offsetY } = ev;
      if (offsetX === undefined) {
        const r = elem.getBoundingClientRect();
        const { clientX, clientY } = ev.touches[0];
        offsetX = clientX - r.left;
        offsetY = clientY - r.top;
      }
      const scale = G_model_getScale();
      const px = offsetX / scale;
      const py = offsetY / scale;

      const x = Math.floor(px / TILE_SIZE);
      const y = Math.floor(py / TILE_SIZE);

      const room = G_model_getCurrentRoom();
      if (room) {
        if (room.phase === RoomPhase.PLAYER) {
          roomPhasePlayerMouseListener(room, x, y);
        } else if (room.phase === RoomPhase.SELECT_ENEMY) {
          roomPhaseSelectEnemyMouseListener(room, x, y);
        } else if (room.phase === RoomPhase.SELECT_TILE) {
          roomPhaseSelectTileMouseListener(room, x, y);
        } else if (room.phase === RoomPhase.DEPLOY) {
          roomPhaseDeployMouseListener(room, x, y);
        }
      } else {
        G_view_playSound('select4');
        G_initNewGame();
      }
    };
  }
};
