/*
global
G_VIEW_STYLE_ABSOLUTE
G_VIEW_STYLE_PANEL
G_VIEW_EMPTY_DIV
G_model_getCtx
G_model_getScale
G_model_unitGetName
G_model_getCurrentRoom
G_model_unitGetStat
UnitAllegiance
TILE_SIZE
Colors
*/

const G_view_UnitInfoBox = (
  unit?: Unit | null,
  pos?: Point,
  lvl?: Record<string, number>
) => {
  const ctx = G_model_getCtx();
  const { height } = ctx.canvas;
  const topBottomStyles: Record<string, string> = {};
  const leftRightStyles: Record<string, string> = {};
  const scale = G_model_getScale();
  const isEnemy = unit?.allegiance === UnitAllegiance.ENEMY;
  if (pos) {
    topBottomStyles.top = '' + pos[1];
    leftRightStyles.left = '' + pos[0];
  } else {
    if ((unit?.y || 0) * scale * TILE_SIZE >= height / 2) {
      topBottomStyles.top = '28px';
    } else {
      topBottomStyles.top = 'unset';
      topBottomStyles.bottom = '28px';
    }
    leftRightStyles.left = isEnemy ? 'unset' : '28px';
    leftRightStyles.right = isEnemy ? '28px' : 'unset';
  }

  const ROW = (label: string, value: string | number | undefined) => {
    return (
      <div
        style={{
          padding: '2px',
        }}
      >
        {label} {value}
      </div>
    );
  };

  const rows = ['hp', 'POW', 'FOR', 'EVA', 'MOV'].map(key => {
    const label = key.toUpperCase();

    let val = '';
    if (unit) {
      const [, base, bonus]: any = G_model_unitGetStat(
        unit,
        G_model_getCurrentRoom() as Room,
        key as any
      );
      val = base;
      if (!lvl && bonus) {
        val += ' + ' + bonus;
      }
    }
    if (key === 'hp') {
      val = unit?.hp + '/' + unit?.mhp;
    }
    if (lvl?.[key]) {
      val += ' + ' + lvl?.[key];
    }
    return ROW(label, val);
  });

  return (
    <div
      style={{
        ...G_VIEW_STYLE_ABSOLUTE,
        ...G_VIEW_STYLE_PANEL,
        ...topBottomStyles,
        ...leftRightStyles,
        textAlign: 'left',
        display: unit ? 'block' : 'none',
        width: '204px',
        height: 'unset',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          color: isEnemy ? Colors.ENEMY : Colors.PLAYER,
        }}
      >
        <div>{unit && G_model_unitGetName(unit)}</div>
        {unit && !lvl && !isEnemy && 'EXP: ' + unit.ko + '/' + unit?.lvl}
      </div>
      {rows}
    </div>
  );
};
