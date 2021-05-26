/*
global
G_model_getCurrentRoom
G_model_unitGetAvailableCommands
G_model_getScale
G_model_roomGetSelectedUnit
G_model_unitGetName
G_view_tileCoordsToPxCoords
G_view_alignPosToOutsideOfBoundingBox
G_view_playSound
G_VIEW_STYLE_ABSOLUTE
G_VIEW_EMPTY_DIV
G_VIEW_STYLE_PANEL
G_controller_calculateDmg
G_controller_callUnitCommand
G_controller_cancelMovement
G_controller_calculateHit
TILE_SIZE
UnitState
Colors
RoomPhase
UnitAllegiance
*/

const G_view_BattleForecast = (): SuperfineElement => {
  const room = G_model_getCurrentRoom();

  if (!room) {
    return G_VIEW_EMPTY_DIV();
  }

  if (room.phase != RoomPhase.SELECT_ENEMY) {
    return G_VIEW_EMPTY_DIV();
  }

  const attacker = room.ui.activeUnit as Unit;
  const victim = room.ui.selUnits[room.ui.selUnitI];

  if (!attacker) {
    return G_VIEW_EMPTY_DIV();
  }

  const { x, y } = attacker;
  const [px, py] = G_view_tileCoordsToPxCoords([x, y]);
  const scale = G_model_getScale();
  const scaledSize = scale * TILE_SIZE;
  const rng = 2 + 1;
  const innerBox: Rect = [
    px - rng * scaledSize - scaledSize / 2,
    py - rng * scaledSize - scaledSize / 2,
    rng * 2 * scaledSize,
    rng * 2 * scaledSize,
  ];
  const outerBox: Rect = [0, 0, 236, 236];

  const attackerHP = attacker.hp;
  const [attackerDmg, isAttDmgBonus] = G_controller_calculateDmg(
    attacker,
    victim
  );
  const [attackerHit, isAttHitBonus] = G_controller_calculateHit(
    attacker,
    victim
  );

  const isDefending = victim.state === UnitState.DEFENDING;
  const victimHP = victim.hp;
  const [victimDamage, isVicDmgBonus] = isDefending
    ? G_controller_calculateDmg(victim, attacker)
    : ['-'];
  const [victimHit, isVicHitBonus] = isDefending
    ? G_controller_calculateHit(victim, attacker)
    : ['-'];

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px',
  };
  const SPAN = (child: string | number, bonus?: boolean, fat?: boolean) => {
    return (
      <span
        style={{
          width: fat ? '50%' : '33%',
          textAlign: 'center',
          color: bonus ? Colors.PLAYER : 'inherit',
        }}
      >
        {child}
      </span>
    );
  };

  return (
    <div
      key="forecast"
      style={{
        ...G_VIEW_STYLE_ABSOLUTE,
        ...G_view_alignPosToOutsideOfBoundingBox(innerBox, outerBox),
        ...G_VIEW_STYLE_PANEL,
        width: '296px',
      }}
    >
      <div>
        <div style={rowStyle}>
          {SPAN(G_model_unitGetName(attacker), false, true)}
          <span></span>
          {SPAN(G_model_unitGetName(victim), false, true)}
        </div>
        <div style={rowStyle}>
          {SPAN(attackerHP)}
          {SPAN('HP')}
          {SPAN(victimHP)}
        </div>
        <div style={rowStyle}>
          {SPAN(attackerDmg, isAttDmgBonus)}
          {SPAN('DMG')}
          {SPAN(victimDamage, isVicDmgBonus)}
        </div>
        <div style={rowStyle}>
          {SPAN(attackerHit, isAttHitBonus)}
          {SPAN('HIT')}
          {SPAN(victimHit, isVicHitBonus)}
        </div>
      </div>
      <div>
        <button
          onclick={() => {
            G_view_playSound('select2');
            room.ui.unitClickCb(G_model_roomGetSelectedUnit(room) as Unit);
          }}
          style={{
            width: '100%',
            padding: '8px',
            background: Colors.WHITE,
            display: room.turn == UnitAllegiance.ENEMY ? 'none' : '',
          }}
        >
          Fight!
        </button>
      </div>
      <div>
        <button
          onclick={() => {
            G_view_playSound('cancel');
            room.ui.cancelCb();
          }}
          style={{
            width: '100%',
            padding: '8px',
            background: Colors.ENEMY,
            display: room.turn == UnitAllegiance.ENEMY ? 'none' : '',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
