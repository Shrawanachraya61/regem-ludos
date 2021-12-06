/*
global
G_model_getCurrentRoom
G_VIEW_EMPTY_DIV
G_VIEW_STYLE_ABSOLUTE
G_VIEW_STYLE_PANEL
*/

const G_view_TitleScreen = () => {
  const room = G_model_getCurrentRoom();
  if (room) {
    return G_VIEW_EMPTY_DIV();
  }

  return (
    <div
      style={{
        ...G_VIEW_STYLE_ABSOLUTE,
        ...G_VIEW_STYLE_PANEL,
        pointerEvents: 'none',
        top: '40%',
        fontSize: '64px',
        textAlign: 'center',
      }}
    >
      <div>GOLEMS</div>
      <div>click to start</div>
    </div>
  );
};
