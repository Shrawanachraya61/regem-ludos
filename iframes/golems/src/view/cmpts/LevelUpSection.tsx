/*
global
G_model_getCurrentRoom
G_model_getCurrentPlayer
G_VIEW_EMPTY_DIV
G_VIEW_STYLE_PANEL
G_VIEW_STYLE_ABSOLUTE
G_model_unitGetName
RoomPhase
G_view_UnitInfoBox
*/

const G_view_LevelUpSection = () => {
  const room = G_model_getCurrentRoom();
  const player = G_model_getCurrentPlayer();
  const unit = room?.ui.activeUnit;

  if (!room || !player || !unit || room.phase !== RoomPhase.LEVEL) {
    return G_VIEW_EMPTY_DIV();
  }

  const lvl = room.ui.lvl;
  const boxX = 42;
  const boxY = 84;

  return (
    <div
      style={{
        ...G_VIEW_STYLE_ABSOLUTE,
        ...G_VIEW_STYLE_PANEL,
        left: 'calc(50% - 296px/2)',
        top: '35%',
        bottom: '35%',
        width: '296px',
        textAlign: 'center',
      }}
    >
      <div>{G_model_unitGetName(unit)}</div>
      <div>
        {unit.ko} / {unit.lvl} {unit.lvl === unit.ko ? 'Level Gained!' : ''}
      </div>
      {G_view_UnitInfoBox(unit, [boxX, boxY], lvl)}
    </div>
  );
};
