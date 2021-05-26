/*
global
G_VIEW_STYLE_ABSOLUTE
G_view_ActionList
G_view_BattleForecast
G_view_UnitInfoBox
G_view_DeploymentSection
G_view_BattleConclusion
G_view_LevelUpSection
G_view_TitleScreen
G_view_TurnIndicator
G_model_getCurrentRoom
UnitAllegiance
RoomPhase
*/

const G_view_RoomSection = (): SuperfineElement => {
  const room = G_model_getCurrentRoom();

  let selEnemy = room?.ui?.enemy;
  if (room?.phase === RoomPhase.SELECT_ENEMY) {
    selEnemy = room?.ui?.selUnits?.[room?.ui?.selUnitI];
  }

  let selPlayer = room?.ui?.activeUnit || room?.ui?.player;

  if (
    [RoomPhase.BATTLE, RoomPhase.ENEMY, RoomPhase.LEVEL].includes(
      room?.phase as RoomPhase
    )
  ) {
    selEnemy = null;
    selPlayer = null;
  }

  return (
    <div
      style={{
        ...G_VIEW_STYLE_ABSOLUTE,
      }}
    >
      {G_view_TitleScreen()}
      {G_view_BattleConclusion()}
      {G_view_DeploymentSection()}
      {G_view_LevelUpSection()}
      {G_view_ActionList()}
      {G_view_BattleForecast()}
      {G_view_UnitInfoBox(selEnemy)}
      {G_view_UnitInfoBox(selPlayer)}
      {G_view_TurnIndicator()}
    </div>
  );
};
