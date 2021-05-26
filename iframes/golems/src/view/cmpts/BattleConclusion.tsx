/*
global
G_VIEW_STYLE_ABSOLUTE
G_VIEW_STYLE_PANEL
G_VIEW_EMPTY_DIV
G_model_getCurrentRoom
RoomPhase
*/

const G_view_BattleConclusion = () => {
  const room = G_model_getCurrentRoom();
  if (!room || room?.phase != RoomPhase.CONCLUDED) {
    return G_VIEW_EMPTY_DIV();
  }

  let text = room.conclusion ? 'VICTORY' : 'DEFEAT';
  if (room.lvl === 3) {
    text = 'GAME COMPLETED';
  }

  return (
    <div
      style={{
        ...G_VIEW_STYLE_ABSOLUTE,
        ...G_VIEW_STYLE_PANEL,
        top: '40%',
        fontSize: '64px',
        textAlign: 'center',
      }}
    >
      {text}
    </div>
  );
};
