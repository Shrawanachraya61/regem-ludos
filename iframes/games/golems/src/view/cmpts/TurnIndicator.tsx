/*
global
G_model_getCurrentRoom
G_VIEW_EMPTY_DIV
G_VIEW_STYLE_ABSOLUTE
G_VIEW_STYLE_PANEL
UnitAllegiance
RoomPhase
Colors
*/

const G_view_TurnIndicator = () => {
  const room = G_model_getCurrentRoom();
  if (!room) {
    return G_VIEW_EMPTY_DIV();
  }

  let text = room.turn === UnitAllegiance.ENEMY ? 'Enemy' : 'Player';

  if (room.phase === RoomPhase.DEPLOY) {
    text = 'Deploy';
  }

  return (
    <div
      style={{
        ...G_VIEW_STYLE_ABSOLUTE,
        ...G_VIEW_STYLE_PANEL,
        pointerEvents: 'none',
        width: 'unset',
        left: '28%',
        right: '28%',
        fontSize: '28px',
        textAlign: 'center',
      }}
    >
      <div>
        PHASE:{' '}
        <span
          style={{
            color:
              room.turn === UnitAllegiance.ENEMY ? Colors.ENEMY : Colors.PLAYER,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};
