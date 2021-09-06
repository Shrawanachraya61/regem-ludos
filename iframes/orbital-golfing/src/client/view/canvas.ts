const getCanvasDimensions = (omitPosition?: boolean) => {
  const ctx = getCtx();
  const canvas = ctx.canvas;
  if (omitPosition) {
    const { left, top } = canvas.getBoundingClientRect();
    return { left, top, width: canvas.width, height: canvas.height };
  } else {
    return { left: 0, top: 0, width: canvas.width, height: canvas.height };
  }
};

const pxToWorld = (x: number, y: number) => {
  const { width, height } = getCanvasDimensions(true);
  return {
    x: (x - width / 2) / getShared().G_SCALE,
    y: -(y - height / 2) / getShared().G_SCALE,
  };
};

const worldToPx = (x: number, y: number) => {
  const { width, height } = getCanvasDimensions(true);
  return {
    x: Math.round(x * getShared().G_SCALE + width / 2),
    y: Math.round(-y * getShared().G_SCALE + height / 2),
  };
};

const clientToWorld = (x: number, y: number) => {
  const { left, top, width, height } = getCanvasDimensions();
  return {
    x: (x - left - width / 2) / getShared().G_SCALE,
    y: -(y - top - height / 2) / getShared().G_SCALE,
  };
};

const drawCircle = (x: number, y: number, r: number, color: string) => {
  const ctx = getCtx();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * PI, false);
  ctx.fillStyle = color;
  ctx.fill();
};

// const drawCircleOutline = (x: number, y: number, r: number, color: string) => {
//   const ctx = getCtx();
//   ctx.beginPath();
//   ctx.arc(x, y, r, 0, 2 * PI, false);
//   ctx.strokeStyle = color;
//   ctx.stroke();
// };

interface TextParams {
  font: string;
  color: string;
  size: number;
  align: CanvasTextAlign;
  strokeColor: string;
}

const DEFAULT_TEXT_PARAMS: TextParams = {
  font: 'monospace',
  color: '#fff',
  size: 16,
  align: 'center',
  strokeColor: '',
};

const drawText = (
  text: string,
  x: number,
  y: number,
  textParams?: Partial<TextParams>
) => {
  const { font, size, color, align, strokeColor } = {
    ...DEFAULT_TEXT_PARAMS,
    ...(textParams || {}),
  };
  const ctx = getCtx();
  ctx.font = `${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 0.5;
    ctx.strokeText(text, x, y);
  }
};

// const drawPoly = (pos, points, color) => {
//   const ctx = getCtx();
//   ctx.save();
//   ctx.beginPath();
//   ctx.translate(pos.x, pos.y);
//   ctx.fillStyle = color;
//   const firstPoint = points[0];
//   ctx.moveTo(firstPoint.x, firstPoint.y);
//   for (let i = 1; i < points.length; i++) {
//     const point = points[i];
//     ctx.lineTo(point.x, point.y);
//   }
//   ctx.closePath();
//   ctx.fill();
//   ctx.restore();
// };

const drawRectangle = (
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  deg?: number
) => {
  const ctx = getCtx();
  ctx.save();
  ctx.beginPath();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  if (deg !== undefined) {
    const w2 = w / 2;
    const h2 = h / 2;
    ctx.translate(w2, h2);
    ctx.rotate((deg * PI) / 180);
    ctx.fillRect(-w2, -h / 1.5, w, h);
  } else {
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
};

const drawPlanets = (planets: PlanetEntityData[]) => {
  const G_SCALE = getShared().G_SCALE;
  for (let i = 0; i < planets.length; i++) {
    const { x, y, r, color } = planets[i];
    const { x: px, y: py } = worldToPx(x, y);
    drawCircle(px, py, r * G_SCALE, color);
  }
};

const drawPlayers = (players: PlayerEntityData[]) => {
  const G_SCALE = getShared().G_SCALE;
  for (let i = 0; i < players.length; i++) {
    const playerEntity = players[i];
    const { x, y, r, color, finished, disconnected } = playerEntity;
    if (finished || disconnected) {
      continue;
    }
    let angleDeg = playerEntity.angle;

    if (isPlayerEntityMe(playerEntity)) {
      angleDeg = getLocalPlayerAngle();
    }

    const { x: px, y: py } = worldToPx(x, y);
    const sz = r * 2 * G_SCALE - 10;
    const sz2 = sz / 2;

    drawCircle(px, py, r * G_SCALE, color);
    drawRectangle(px - sz2, py - sz2, sz, sz, getColor(color, true));
    drawRectangle(
      px - 5,
      py - 30,
      10,
      60,
      'white',
      getShared().getHeadingTowards(
        px,
        py,
        px + Math.sin(getShared().toRadians(angleDeg)),
        py - Math.cos(getShared().toRadians(angleDeg))
      )
    );
    drawCircle(px, py, sz2 / 1.5, getColor(color));
    drawText(playerEntity.name, px, py - sz - 32, { size: 32 });
  }
};

let lastFlagTimestamp = +new Date();
let flagMode = 0;
const drawFlags = (flags: EntityData[]) => {
  const timestamp = +new Date();

  if (timestamp - lastFlagTimestamp > 500) {
    flagMode = (flagMode + 1) % 2;
    lastFlagTimestamp = timestamp;
  }

  const G_SCALE = getShared().G_SCALE;
  for (let i = 0; i < flags.length; i++) {
    const flagEntity = flags[i];
    const { x, y, r } = flagEntity;
    const { x: px, y: py } = worldToPx(x, y);

    const radius = r * G_SCALE;

    drawCircle(px, py, radius, 'orange');
    drawCircle(px, py, radius - 4, 'white');

    drawRectangle(
      px - radius / 6 - 10,
      py - radius,
      radius / 3,
      radius * 2,
      'black'
    );

    {
      const x = px - radius / 6 - 10;
      const y = py - radius;
      const w = 40;
      const h = 30;
      if (flagMode === 1) {
        drawRectangle(x, y, w, h, 'black');
        drawRectangle(x + 2, y + 2, w - 4, h - 4, 'orange');
      } else {
        drawRectangle(x, y, w, h, 'black', 359);
        drawRectangle(x + 2, y + 2, w - 4, h - 4, 'orange', 359);
      }
    }

    drawText('Shoot here!', px, py - radius - 32, { size: 32 });
  }
};

const drawCoins = (coins: CoinEntityData[]) => {
  const G_SCALE = getShared().G_SCALE;
  for (let i = 0; i < coins.length; i++) {
    const coinEntity = coins[i];
    const { x, y, r, removed } = coinEntity;
    if (removed) {
      continue;
    }
    const { x: px, y: py } = worldToPx(x, y);

    const radius = r * G_SCALE;
    drawText('Shot -1', px, py - radius - 32, { size: 32 });

    const ctx = getCtx();
    ctx.save();
    if (flagMode === 1) {
      ctx.translate(px, py);
      ctx.scale(0.5, 1);
      ctx.translate(-px, -py);
    }

    drawCircle(px, py, radius, 'black');
    drawCircle(px, py, radius - 2, 'yellow');
    drawCircle(px, py, radius - 4, 'brown');
    drawCircle(px, py, radius - 6, 'yellow');

    ctx.restore();
  }
};

const drawShotPreview = (preview: Point[]) => {
  for (let i = 0; i < preview.length; i++) {
    const [x, y] = preview[i];
    drawCircle(x, y, 5, 'rgba(255,255,255,0.25)');
  }
};

const drawSimulation = (gameData: GameData) => {
  const { players, planets, flags, coins } = gameData;

  const ctx = getCtx();
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  updateGlobalFrameTime();

  drawPlanets(planets.map(id => getShared().getEntity(gameData, id)));
  drawPlayers(players.map(id => getShared().getEntity(gameData, id)));
  drawFlags(flags.map(id => getShared().getEntity(gameData, id)));
  drawCoins(coins.map(id => getShared().getEntity(gameData, id)));

  const myEntity = getMyPlayerEntity(gameData);
  if (!myEntity.active && !myEntity.finished) {
    drawShotPreview(getShotPreview());
  }
};
