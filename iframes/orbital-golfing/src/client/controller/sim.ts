interface ShotArgsData {
  power: number;
  ms: number;
  angleDeg: number;
}

type Point = [number, number];

const generateShotPreview = (
  originalGameData: GameData,
  args: ShotArgsData
): Point[] => {
  const gameData = copyGameData(originalGameData);
  const playerEntity = getMyPlayerEntity(gameData);

  playerEntity.active = true;
  playerEntity.vx = 55000 * Math.sin(getShared().toRadians(args.angleDeg));
  playerEntity.vy = 55000 * Math.cos(getShared().toRadians(args.angleDeg));
  playerEntity.angle = args.angleDeg;

  const ret: Point[] = [];
  for (let i = 0; i < 12; i++) {
    getShared().simulate(gameData, { nowDt: 100 });
    const { x: px, y: py } = worldToPx(playerEntity.x, playerEntity.y);
    ret.push([px, py]);
  }
  return ret;
};
