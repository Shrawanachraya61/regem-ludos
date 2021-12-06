/*
global
G_superfine_patch
G_view_getElementById
G_view_RoomSection
G_view_hexToRgba
G_model_roomClearFillTiles
G_model_roomClearStrokeTiles
G_model_unitGetMovableTiles
G_model_getCurrentRoom
G_model_roomGetTileAt
G_model_unitGetRangeOffsets
G_model_unitGetAllAttackableTiles
G_view_uiDrawSpriteElements
Colors
RoomPhase
*/

const G_VIEW_EMPTY_DIV = () => <div></div>;
const PLAYER_HIGHLIGHT_COLOR = G_view_hexToRgba(Colors.PLAYER, 0.33);
const ENEMY_HIGHLIGHT_COLOR = G_view_hexToRgba(Colors.ENEMY, 0.5);
const ALT_HIGHLIGHT_COLOR = G_view_hexToRgba(Colors.ALT, 0.5);

const G_view_renderUi = () => {
  const room = G_model_getCurrentRoom();
  if (room) {
    G_view_applyRoomHighlights(room);
  }
  const primary = G_view_getElementById('ui') as HTMLElement;
  G_superfine_patch(primary, G_view_RoomSection());
  G_view_uiDrawSpriteElements();
};

const G_view_applyRoomHighlights = (room: Room) => {
  G_model_roomClearFillTiles(room);
  G_model_roomClearStrokeTiles(room);

  const highlightMoveAttackTiles = (unit: Unit, useAlt: boolean) => {
    const points: Point[] = G_model_unitGetAllAttackableTiles(unit, room).map(
      tile => [tile.x, tile.y] as Point
    );
    const points2: Point[] = G_model_unitGetMovableTiles(unit, room).map(
      tile => [tile.x, tile.y] as Point
    );
    highlightTilesAt(points, ENEMY_HIGHLIGHT_COLOR, false, false);
    highlightTilesAt(points2, PLAYER_HIGHLIGHT_COLOR, false, false);
  };

  const highlightRanges = () => {
    const unit = room.ui.activeUnit as Unit;
    const points2 = G_model_unitGetRangeOffsets(unit.rng).map(
      p => [unit.x + p[0], unit.y + p[1]] as Point
    );
    highlightTilesAt(points2, ENEMY_HIGHLIGHT_COLOR);
  };

  if (room.ui.enemy) {
    highlightMoveAttackTiles(room.ui.enemy, false);
  }

  if (room.ui.activeUnit) {
    if (room.phase === RoomPhase.PLAYER) {
      const points2: Point[] = G_model_unitGetMovableTiles(
        room.ui.activeUnit,
        room
      ).map(tile => [tile.x, tile.y] as Point);
      highlightTilesAt(points2, PLAYER_HIGHLIGHT_COLOR, false, true);
      highlightMoveAttackTiles(room.ui.activeUnit, true);
    } else if (room.phase === RoomPhase.SELECT_ENEMY) {
      const points = room.ui.selUnits.map(unit => [unit.x, unit.y] as Point);
      highlightTilesAt(points, ENEMY_HIGHLIGHT_COLOR);
      const selectedEnemy = room.ui.selUnits[room.ui.selUnitI];
      if (selectedEnemy) {
        highlightTilesAt(
          [[selectedEnemy.x, selectedEnemy.y]],
          Colors.ENEMY,
          true
        );
      }
      highlightRanges();
    } else if (room.phase === RoomPhase.WAITING_ACTION) {
      highlightRanges();
    }

    if (room.phase !== RoomPhase.BATTLE) {
      highlightTilesAt(
        [[room.ui.activeUnit.x, room.ui.activeUnit.y]],
        Colors.WHITE,
        true
      );
    }
  }

  // if (room.ui.enemyRanges) {
  //   const enemies = G_model_roomGetUnitsOfAllegiance(
  //     room,
  //     UnitAllegiance.ENEMY
  //   );
  //   let points: Point[] = [];
  //   enemies.forEach(unit => {
  //     points = points.concat(
  //       G_model_unitGetMovableTiles(unit, room).map(
  //         tile => [tile.x, tile.y] as Point
  //       )
  //     );
  //   });
  //   highlightTilesAt(points, ALT_HIGHLIGHT_COLOR);
  // }
};

const highlightTilesAt = (
  points: Point[],
  color: string,
  useStroke?: boolean,
  useAlt?: boolean
) => {
  const room = G_model_getCurrentRoom();
  if (room) {
    for (let i = 0; i < points.length; i++) {
      const [x, y] = points[i];
      const tile = G_model_roomGetTileAt(room, x, y);
      if (tile) {
        if (tile[useStroke ? 'stroke' : 'fill'] === ALT_HIGHLIGHT_COLOR) {
          continue;
        }
        if (useAlt && tile[useStroke ? 'stroke' : 'fill']) {
          tile[useStroke ? 'stroke' : 'fill'] = ALT_HIGHLIGHT_COLOR;
        } else {
          tile[useStroke ? 'stroke' : 'fill'] = color;
        }
      }
    }
  }
};
