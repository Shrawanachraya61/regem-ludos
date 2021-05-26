/*
global
G_model_getScale
G_model_createCanvas
G_model_getCtx
G_view_drawSprite
G_view_getElementById
G_view_clearScreen
TILE_SIZE
*/

const view_sprites: Record<
  string,
  {
    id: string;
    sprite: string;
  }
> = {};

const G_view_uiDrawSpriteElements = () => {
  for (const i in view_sprites) {
    const { id, sprite } = view_sprites[i];
    const scale = G_model_getScale();
    const canvas = G_view_getElementById(id);
    if (canvas) {
      const ctx = G_model_getCtx(canvas as HTMLCanvasElement);
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        G_view_clearScreen(ctx);
        G_view_drawSprite(sprite, 0, 0, scale, ctx);
      }
    }
  }
};

const G_view_UnitSprite = (spriteName: string, refId: string) => {
  const scale = G_model_getScale();
  view_sprites[refId] = {
    id: refId,
    sprite: spriteName,
  };
  return (
    <canvas
      key={refId}
      id={refId}
      width={TILE_SIZE * scale}
      height={TILE_SIZE * scale}
    />
  );
};
