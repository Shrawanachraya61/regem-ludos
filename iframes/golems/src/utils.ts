type Rect = [number, number, number, number];

const G_utils_randInRange = (n1: number, n2: number): number => {
  return Math.floor(Math.random() * (n2 - n1) + n1);
};
const G_utils_randInArr = (arr: any[]) =>
  arr[G_utils_randInRange(0, arr.length)];

const G_utils_cycleItemInArr = (i: number, arr: any[], dir: -1 | 1): number => {
  const nextI = i + dir;
  if (nextI < 0 || nextI >= arr.length) {
    return i;
  }
  const item = arr[i];
  arr[i] = arr[i + dir];
  arr[i + dir] = item;
  return i + dir;
};

const G_utils_pointRectCollides = (
  x: number,
  y: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): boolean => {
  return x >= x1 && x <= x2 && y >= y1 && y <= y2;
};

const G_utils_waitMs = async (ms: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

const G_utils_getDirTowards = (p1: Point, p2: Point): Point => {
  const vx = p2[0] - p1[0];
  const vy = p2[1] - p1[1];
  return [vx / (Math.abs(vx) || 1), vy / (Math.abs(vy) || 1)];
};

const G_utils_to4d = (xGlobal: number, yGlobal: number, innerSize: number) => {
  const xWorld = Math.floor(xGlobal / innerSize);
  const yWorld = Math.floor(yGlobal / innerSize);
  const xLocal = xGlobal % innerSize;
  const yLocal = (yGlobal % innerSize) - 1;
  return [xWorld, yWorld, xLocal, yLocal];
};

const G_utils_to2d = (
  xWorld: number,
  yWorld: number,
  x: number,
  y: number,
  innerSize: number
) => {
  return [xWorld * innerSize + x, yWorld * innerSize + y];
};
