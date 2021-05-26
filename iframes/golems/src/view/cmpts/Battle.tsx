/*
global
G_model_getCurrentRoom
G_model_unitGetAvailableCommands
G_model_getScale
G_view_tileCoordsToPxCoords
G_view_alignPosToOutsideOfBoundingBox
G_VIEW_STYLE_ABSOLUTE
G_VIEW_STYLE_PANEL
G_VIEW_EMPTY_DIV
G_controller_callUnitCommand
G_controller_cancelMovement
TILE_SIZE
Colors
RoomPhase
*/

const G_view_Battle = (): SuperfineElement => {
  const room = G_model_getCurrentRoom();

  if (!room) {
    return G_VIEW_EMPTY_DIV();
  }

  if (room.phase != RoomPhase.SELECT_ENEMY) {
    return G_VIEW_EMPTY_DIV();
  }

  const attacker = room.ui.activeUnit as Unit;
  const victim = room.ui.selUnits[room.ui.selUnitI];

  if (!attacker || !victim) {
    return G_VIEW_EMPTY_DIV();
  }

  const { x, y } = attacker;
  const [px, py] = G_view_tileCoordsToPxCoords([x, y]);
  const scale = G_model_getScale();
  const scaledSize = scale * TILE_SIZE;
  const rng = 3;
  const innerBox: Rect = [
    px - rng * scaledSize - scaledSize / 2,
    py - rng * scaledSize - scaledSize / 2,
    rng * 2 * scaledSize,
    rng * 2 * scaledSize,
  ];
  const outerBox: Rect = [0, 0, 296, 296];

  const attackerDmg = Math.max(attacker.POW - victim.FOR, 0);
  const attackerHP = attacker.hp;
  const attackerHit = 100 - victim.EVA;
  const victimHP = victim.hp;

  return (
    <div
      key="forecast"
      style={{
        ...G_VIEW_STYLE_ABSOLUTE,
        ...G_view_alignPosToOutsideOfBoundingBox(innerBox, outerBox),
        ...G_VIEW_STYLE_PANEL,
        width: '296px',
      }}
    ></div>
  );
};
