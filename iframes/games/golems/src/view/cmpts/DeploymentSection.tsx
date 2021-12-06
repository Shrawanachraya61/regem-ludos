/*
global
G_VIEW_STYLE_ABSOLUTE
G_VIEW_STYLE_PANEL
G_VIEW_EMPTY_DIV
G_view_UnitSprite
G_view_renderUi
G_view_UnitInfoBox
G_view_playSound
G_model_getScale
G_model_getCurrentRoom
G_model_getCurrentPlayer
G_model_roomGetUnitsOfAllegiance
G_model_unitGetName
UnitAllegiance
TILE_SIZE
PNG_SIZE
RoomPhase
Colors
*/

const G_view_DeploymentSection = () => {
  const room = G_model_getCurrentRoom();
  const player = G_model_getCurrentPlayer();

  if (!room || !player) {
    return G_VIEW_EMPTY_DIV();
  }

  const handleUnitClick = (unit: Unit, i: number) => {
    G_view_playSound('select');
    room.ui.deploy.unitI = i;
    G_view_renderUi();
  };

  const handleMapVisClick = () => {
    G_view_playSound('select');
    room.ui.deploy.mapVis = !room.ui.deploy.mapVis;
    room.ui.enemy = null;
    G_view_renderUi();
  };

  const UNIT = (unit: Unit, i: number) => {
    const isSelected = room.ui.deploy.unitI === i;
    const isDeployed = room.units.includes(unit);
    return (
      <div
        onclick={() => handleUnitClick(unit, i)}
        style={{
          border: `2px solid ${isSelected ? Colors.WHITE : 'transparent'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px',
        }}
      >
        {isDeployed ? '*' : ''} {G_model_unitGetName(unit)}
        <div>{G_view_UnitSprite(unit.sprite, 'unit-' + i)}</div>
      </div>
    );
  };

  const scale = G_model_getScale();
  const mapSizePx = PNG_SIZE * TILE_SIZE * scale;

  const deployX = room.deploy[0] * TILE_SIZE * scale;

  const deployVisible = room.phase === RoomPhase.DEPLOY;
  const selUnit = player.units[room.ui.deploy.unitI];
  const unitListAlign = deployX <= mapSizePx / 2 ? 'right' : 'left';
  const playerUnits = G_model_roomGetUnitsOfAllegiance(
    room,
    UnitAllegiance.PLAYER
  );
  const isMapVis = room.ui.deploy.mapVis;

  let primaryBoxLeft = unitListAlign === 'left' ? '64px' : '700px';
  if (isMapVis) {
    primaryBoxLeft = '16px';
  }

  const primaryBoxTop = isMapVis ? '0px' : '128px';
  const primaryBoxW = 256;
  const left =
    unitListAlign === 'left'
      ? parseInt(primaryBoxLeft) + primaryBoxW
      : parseInt(primaryBoxLeft) - 204;
  const top = parseInt(primaryBoxTop);

  return (
    <>
      {deployVisible && !isMapVis ? (
        <div
          style={{
            ...G_VIEW_STYLE_ABSOLUTE,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              ...G_VIEW_STYLE_PANEL,
              padding: '8px',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                textDecoration: 'underline',
                marginBottom: '8px',
              }}
            >
              DESCRIPTION
            </div>
            <div
              style={{
                textAlign: 'center',
                color: Colors.PLAYER,
              }}
            >
              {selUnit.name}
            </div>
            {selUnit.dsc}.
          </div>
        </div>
      ) : null}
      {deployVisible && !isMapVis
        ? G_view_UnitInfoBox(selUnit, [left, top])
        : null}
      <div
        style={{
          ...G_VIEW_STYLE_ABSOLUTE,
          ...G_VIEW_STYLE_PANEL,
          left: primaryBoxLeft,
          display: deployVisible ? 'block' : 'none',
          height: 'unset',
          width: '256px',
          top: primaryBoxTop,
          bottom: isMapVis ? 'unset' : primaryBoxTop,
        }}
      >
        {!isMapVis ? (
          <button
            disabled={!playerUnits.length}
            onclick={() => {
              G_view_playSound('begin');
              room.phase = RoomPhase.PLAYER;
              G_view_renderUi();
            }}
            style={{
              width: '100%',
              padding: '8px',
              background: Colors.WHITE,
            }}
          >
            Begin!
          </button>
        ) : null}
        <button
          onclick={handleMapVisClick}
          style={{
            width: '100%',
            padding: '8px',
            background: Colors.NEUTRAL_LIGHT,
          }}
        >
          {isMapVis ? 'View Deploy' : 'View Map'}
        </button>
        {!isMapVis ? (
          <div
            style={{
              textAlign: 'center',
            }}
          >
            Placed {playerUnits.length} of {player.maxDeploy}
          </div>
        ) : null}
        {!isMapVis ? (
          <div
            style={{
              height: 'calc(100% - 126px)',
              overflowY: 'auto',
            }}
          >
            {player.units.map(UNIT)}
          </div>
        ) : null}
      </div>
    </>
  );
};
