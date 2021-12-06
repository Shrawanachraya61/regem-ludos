/*
global
G_model_getCtx
G_model_getCanvas
G_model_getSprite
G_model_unitGetSprite
G_model_roomGetSelectedUnit
G_view_tileCoordsToPxCoords
RoomPhase
Colors
TILE_SIZE
*/
interface DrawTextParams {
  font?: string;
  color?: string;
  size?: number;
  align?: 'left' | 'center' | 'right';
  strokeColor?: string;
}
const DEFAULT_TEXT_PARAMS = {
  font: 'monospace',
  color: '#fff',
  size: 14,
  align: 'center',
  strokeColor: 'black',
};

const G_view_clearScreen = (ctx?: CanvasRenderingContext2D) => {
  ctx = ctx ?? G_model_getCtx();
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

const G_view_setOpacity = (opacity: number, ctx?: CanvasRenderingContext2D) => {
  ctx = ctx || G_model_getCtx();
  ctx.globalAlpha = opacity;
};

const G_view_drawSprite = (
  sprite: string | Sprite,
  x: number,
  y: number,
  scale?: number,
  ctx?: CanvasRenderingContext2D
) => {
  scale = scale || 1;
  ctx = ctx || G_model_getCtx();
  const spriteObj =
    typeof sprite === 'string' ? G_model_getSprite(sprite) : sprite;
  if (!spriteObj) {
    throw new Error(`Cannot find sprite with name: "${sprite}"`);
  }
  const [image, sprX, sprY, sprW, sprH] = spriteObj;

  ctx.drawImage(
    image,
    sprX,
    sprY,
    sprW,
    sprH,
    x,
    y,
    sprW * scale,
    sprH * scale
  );
};

const G_view_drawRect = (
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  stroke?: boolean,
  ctx?: CanvasRenderingContext2D
) => {
  ctx = ctx || G_model_getCtx();
  if (stroke) {
    w -= ctx.lineWidth / 2;
    h -= ctx.lineWidth / 2;
  }

  ctx[stroke ? 'strokeStyle' : 'fillStyle'] = color;
  ctx[stroke ? 'strokeRect' : 'fillRect'](x, y, w, h);
};

const G_view_drawText = (
  text: string,
  x: number,
  y: number,
  textParams?: DrawTextParams,
  ctx?: CanvasRenderingContext2D
) => {
  const { font, size, color, align, strokeColor } = {
    ...DEFAULT_TEXT_PARAMS,
    ...(textParams || {}),
  };
  ctx = ctx || G_model_getCtx();
  ctx.font = `${size}px ${font}`;
  ctx.textAlign = align as CanvasTextAlign;
  ctx.textBaseline = 'middle';
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 4;
    ctx.strokeText(text, x, y);
  }

  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
};

const G_view_drawLine = (
  x: number,
  y: number,
  x2: number,
  y2: number,
  color: string,
  scale?: number,
  ctx?: CanvasRenderingContext2D
) => {
  scale = scale || 1;
  ctx = ctx || G_model_getCtx();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
};

const G_view_renderUnit = (
  unit: Unit,
  room: Room,
  scale?: number,
  ctx?: CanvasRenderingContext2D
) => {
  scale = scale || 1;
  const { x, y } = unit;

  const [px, py] = G_view_tileCoordsToPxCoords([x, y]);
  G_view_drawSprite(G_model_unitGetSprite(unit), px, py, scale, ctx);

  // health bar
  // if (
  //   [room.ui.player, room.ui.enemy, room.ui.activeUnit].includes(unit) ||
  //   ([RoomPhase.BATTLE, RoomPhase.SELECT_ENEMY].includes(room.phase) &&
  //     [G_model_roomGetSelectedUnit(room)].includes(unit))
  // ) {

  const widthBorder = 4;
  const underWidth = TILE_SIZE * scale - widthBorder * 2;
  const overWidth = Math.ceil(underWidth * (unit.hp / unit.mhp));
  const height = scale + 1;
  G_view_drawRect(
    px + widthBorder,
    py + TILE_SIZE * scale - height,
    underWidth,
    height,
    Colors.ENEMY
  );
  G_view_drawRect(
    px + widthBorder,
    py + TILE_SIZE * scale - height,
    overWidth,
    height,
    Colors.PLAYER
  );
  // }
};

const G_view_renderRoom = (
  room: Room,
  scale: number,
  xOff: number,
  yOff: number
) => {
  const ctx = G_model_getCtx();
  ctx.save();
  ctx.translate(Math.floor(xOff), Math.floor(yOff));

  const tScale = TILE_SIZE * scale;

  for (let i = 0; i < room.tiles.length; i++) {
    const tile = room.tiles[i];

    const px = tile.x * tScale;
    const py = tile.y * tScale;
    G_view_drawSprite(`terrain1_${tile.id}`, px, py, scale);
    if (tile.fill) {
      G_view_drawRect(px, py, tScale, tScale, tile.fill);
    }
    if (tile.stroke) {
      G_view_drawRect(px, py, tScale, tScale, tile.stroke, true);
    }
  }

  for (let i = 0; i < room.units.length; i++) {
    const unit = room.units[i];
    G_view_renderUnit(unit, room, scale);
  }

  const textParamsBlack: DrawTextParams = {
    color: Colors.BLACK,
    size: 30,
    align: 'center',
    strokeColor: '',
  };
  const textParamsWhite: DrawTextParams = {
    ...textParamsBlack,
    color: Colors.WHITE,
  };

  for (let i = 0; i < room.particles.length; i++) {
    const particle = room.particles[i];
    const px = particle.x * tScale + tScale / 2;
    const py = particle.y * tScale + tScale / 2;
    G_view_drawText(particle.text, px + 2, py + 2, textParamsBlack);
    G_view_drawText(particle.text, px, py, textParamsWhite);
  }

  const deployVisible = room.phase === RoomPhase.DEPLOY;
  if (deployVisible) {
    const [x, y, x2, y2] = room.deploy;
    const px = x * tScale;
    const py = y * tScale;
    const w = (x2 - x) * tScale + 4;
    const h = (y2 - y) * tScale + 6;
    const text = 'Click here to place units.';
    if (!room.ui.deploy.mapVis) {
      G_view_drawText(text, px + w / 2 + 2, py - 32 + 2, textParamsBlack);
      G_view_drawText(text, px + w / 2, py - 32, textParamsWhite);
    }
    G_view_drawRect(px, py, w, h, Colors.WHITE, true);
  }

  ctx.restore();
};
