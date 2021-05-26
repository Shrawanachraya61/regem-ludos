/*
global
G_model_getCurrentRoom
G_model_unitGetAvailableCommands
G_model_getScale
G_view_tileCoordsToPxCoords
G_view_alignPosToOutsideOfBoundingBox
G_view_playSound
G_VIEW_STYLE_ABSOLUTE
G_VIEW_STYLE_PANEL
G_VIEW_EMPTY_DIV
G_controller_callUnitCommand
G_controller_cancelMovement
TILE_SIZE
Colors
RoomPhase
*/

const G_view_ActionList = (): SuperfineElement => {
  const room = G_model_getCurrentRoom();

  if (!room) {
    return G_VIEW_EMPTY_DIV;
  }

  if (room.phase != RoomPhase.WAITING_ACTION) {
    return G_VIEW_EMPTY_DIV;
  }

  const unit = room.ui.activeUnit as Unit;

  if (!unit) {
    return G_VIEW_EMPTY_DIV;
  }

  const commands = G_model_unitGetAvailableCommands(unit, room);
  // G_view_alignPosToOutsideOfBoundingBox
  const { x, y } = unit;
  const [px, py] = G_view_tileCoordsToPxCoords([x, y]);
  const scale = G_model_getScale();
  const scaledSize = scale * TILE_SIZE;
  const innerBox: Rect = [
    px - scaledSize - scaledSize / 2,
    py - scaledSize - scaledSize / 2,
    3 * scaledSize,
    3 * scaledSize,
  ];
  const outerBox: Rect = [0, 0, 164, 164];

  console.log('RENDER ACTION LIST', {
    ...G_VIEW_STYLE_ABSOLUTE,
    ...G_view_alignPosToOutsideOfBoundingBox(innerBox, outerBox),
    ...G_VIEW_STYLE_PANEL,
    width: '248px',
  });

  return (
    <div
      id="act-list"
      key="act-list"
      style={{
        ...G_VIEW_STYLE_ABSOLUTE,
        ...G_view_alignPosToOutsideOfBoundingBox(innerBox, outerBox),
        ...G_VIEW_STYLE_PANEL,
        width: '250px',
      }}
    >
      {commands.map(cmd => {
        return (
          <div key={cmd.name}>
            <button
              onclick={() => {
                G_view_playSound('select3');
                G_controller_callUnitCommand(room, unit, cmd);
              }}
              style={{
                background: Colors.NEUTRAL_LIGHT,
              }}
            >
              {cmd.name}
            </button>
          </div>
        );
      })}
      <div key="Cancel">
        <button
          onclick={() => {
            G_controller_cancelMovement(room, unit);
          }}
          style={{
            background: Colors.ENEMY,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
