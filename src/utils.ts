import { Polygon } from 'view/draw';
import { addTimer, getCameraDrawOffset, removeTimer } from 'model/generics';
import { getDrawScale } from 'model/canvas';
import { Timer } from 'model/utility';
import { CharacterTemplate, Facing } from 'model/character';
import { BattleStats } from 'model/battle';
import { Item } from 'db/items';

export const isoToPixelCoords = (
  x: number,
  y: number,
  z?: number
): [number, number] => {
  return [x - y, (x + y) / 2 - (z ?? 0) / 2];
};

export const pixelToIsoCoords = (x: number, y: number): [number, number] => {
  return [(2 * y + x) / 2, (2 * y - x) / 2];
};

export const tileToWorldCoords = (x: number, y: number): Point => {
  return [x * 16, y * 16];
};

export const worldToCanvasCoords4by3 = (
  x: number,
  y: number,
  z: number
): [number, number] => {
  const [px, py] = isoToPixelCoords(x, y, z);
  return pxToCanvasCoords4by3(px, py);
};

export const pxToCanvasCoords4by3 = (
  px: number,
  py: number
): [number, number] => {
  const [roomXOffset, roomYOffset] = getCameraDrawOffset();
  const scale = getDrawScale();

  // HACK for scale of 4 at 4:3 resolution.  Adjusts for the top left of the canvas going
  // negative behind the div showing it.
  const resultX = (px + roomXOffset) * scale - (scale >= 4 ? 638 + 48 : 0);
  const resultY = (py + roomYOffset) * scale - (scale >= 4 ? 512 : 0);
  return [resultX, resultY];
};

export const removeFileExtension = (fileName: string): string => {
  const ind = fileName.lastIndexOf('.');
  if (ind > -1) {
    fileName = fileName.slice(0, ind);
  }
  return fileName;
};

export type Point = [number, number];
export type Point3d = [number, number, number];
export type Circle = Point3d;

export const truncatePoint3d = (p: Point3d): Point => {
  return [p[0], p[1]];
};

export const extrapolatePoint = (p: Point): Point3d => {
  return [p[0], p[1], 0];
};

export type Rect = [number, number, number, number];

function easeOut(t: number, b: number, c: number, d: number): number {
  const t2 = t / d;
  return -c * t2 * (t2 - 2) + b;
}

export const randomId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export function normalize(
  x: number,
  a: number,
  b: number,
  c: number,
  d: number
): number {
  return c + ((x - a) * (d - c)) / (b - a);
}

export function normalizeClamp(
  x: number,
  a: number,
  b: number,
  c: number,
  d: number
): number {
  let r = normalize(x, a, b, c, d);
  if (c < d) {
    if (r > d) {
      r = d;
    } else if (r < c) {
      r = c;
    }
  } else {
    if (r < d) {
      r = d;
    } else if (r > c) {
      r = c;
    }
  }
  return r;
}

export function normalizeEaseOut(
  x: number,
  a: number,
  b: number,
  c: number,
  d: number
): number {
  const t = normalize(x, a, b, 0, 1);
  return easeOut(t, c, d - c, 1);
}

export function normalizeEaseOutClamp(
  x: number,
  a: number,
  b: number,
  c: number,
  d: number
): number {
  const t = normalizeClamp(x, a, b, 0, 1);
  return easeOut(t, c, d - c, 1);
}

export const timeoutPromise = async (
  ms: number,
  skipGlobalQueue?: boolean
): Promise<void> => {
  const t = new Timer(ms);
  if (!skipGlobalQueue) {
    addTimer(t);
  }
  t.start();
  await t.onCompletion();
  if (!skipGlobalQueue) {
    removeTimer(t);
  }
};

export const getRandBetween = (a: number, b: number): number => {
  return Math.floor(Math.random() * (b - a)) + a;
};

export const removeIfPresent = (arr: any[], item: any): boolean => {
  const ind = arr.indexOf(item);
  if (ind > -1) {
    arr.splice(ind, 1);
    return true;
  }
  return false;
};

export const calculateDistance = (a: Point3d, b: Point3d) => {
  const [x1, y1, z1] = a;
  const [x2, y2, z2] = b;
  return Math.sqrt(
    Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2)
  );
};

export const circleCircleCollision = (a: Circle, b: Circle): boolean => {
  const [x1, y1, r1] = a;
  const [x2, y2, r2] = b;

  const dist = calculateDistance([x1, y1, 0], [x2, y2, 0]);
  return dist <= r1 + r2;
};

type CircleRectCollision =
  | 'none'
  | 'bottom'
  | 'left'
  | 'top'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';
export const circleRectCollision = (
  c: Circle,
  r2: Rect
): CircleRectCollision => {
  const [cx, cy, cr] = c;
  const r1 = [cx - cr, cy - cr, cr * 2, cr * 2];

  const [r1x, r1y, r1w, r1h] = r1;
  const [r2x, r2y, r2w, r2h] = r2;

  const dx = r1x + r1w / 2 - (r2x + r2w / 2);
  const dy = r1y + r1h / 2 - (r2y + r2h / 2);
  const width = (r1w + r2w) / 2;
  const height = (r1h + r2h) / 2;
  const crossWidth = width * dy;
  const crossHeight = height * dx;
  let collision: CircleRectCollision = 'none';

  if (Math.abs(dx) <= width && Math.abs(dy) <= height) {
    if (crossWidth > crossHeight) {
      collision = crossWidth > -crossHeight ? 'bottom' : 'left';
    } else {
      collision = crossWidth > -crossHeight ? 'right' : 'top';
    }

    if (cx <= r2x && cy <= r2y) {
      collision = 'top-left';
    } else if (cx >= r2x + r2w && cy <= r2y) {
      collision = 'top-right';
    } else if (cx <= r2x && cy >= r2y + r2h) {
      collision = 'bottom-left';
    } else if (cx >= r2x + r2w && cy >= r2y + r2h) {
      collision = 'bottom-right';
    }
  }

  return collision;
};

export function getAngleTowards(
  point1: Point3d | Point,
  point2: Point3d | Point
): number {
  const [x1, y1] = point1;
  const [x2, y2] = point2;
  const lenY = y2 - y1;
  const lenX = x2 - x1;
  const hyp = Math.sqrt(lenX * lenX + lenY * lenY);
  let ret = 0;
  if (y2 >= y1 && x2 >= x1) {
    ret = (Math.asin(lenY / hyp) * 180) / Math.PI + 90;
  } else if (y2 >= y1 && x2 < x1) {
    ret = (Math.asin(lenY / -hyp) * 180) / Math.PI - 90;
  } else if (y2 < y1 && x2 > x1) {
    ret = (Math.asin(lenY / hyp) * 180) / Math.PI + 90;
  } else {
    ret = (Math.asin(-lenY / hyp) * 180) / Math.PI - 90;
  }
  if (ret >= 360) {
    ret = 360 - ret;
  }
  if (ret < 0) {
    ret = 360 + ret;
  }
  return ret;
}

export const getNormalizedVec = (x: number, y: number): [number, number] => {
  const d = Math.sqrt(x * x + y * y);
  return [x / d, y / d];
};

export const radiansToDegrees = (rad: number) => {
  return rad * (180 / Math.PI);
};

export const degreesToRadians = (degrees: number) => {
  return degrees * (Math.PI / 180);
};

export const getAngleFromVector = (x: number, y: number): number => {
  if (x == 0) {
    return y > 0 ? 90 : y == 0 ? 0 : 270;
  } else if (y == 0) {
    return x >= 0 ? 0 : 180;
  }
  let ret = radiansToDegrees(Math.atan(y / x));
  if (x < 0 && y < 0) {
    ret = 180 + ret;
  } else if (x < 0) {
    ret = 180 + ret;
  } else if (y < 0) {
    ret = 270 + (90 + ret);
  }
  return ret;
};

export const createPolygonFromRect = (r: Rect): Polygon => {
  const [x, y, width, height] = r;
  const polygon: Polygon = [
    [x, y] as Point,
    [x + width, y] as Point,
    [x + width, y + height] as Point,
    [x, y + height] as Point,
  ];
  return polygon;
};

export const toFixedPrecision = (n: number, precision: number): number => {
  return parseFloat(n.toFixed(precision));
};

export function randInArr<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// px facing and world facing are different. "down" in px scope is actually "right_down"
// in world coords and so on
export const pxFacingToWorldFacing = (direction: Facing): Facing => {
  const mapping = {
    [Facing.LEFT]: Facing.LEFT_DOWN,
    [Facing.RIGHT]: Facing.RIGHT_UP,
    [Facing.UP]: Facing.LEFT_UP,
    [Facing.DOWN]: Facing.RIGHT_DOWN,
    [Facing.LEFT_DOWN]: Facing.DOWN,
    [Facing.RIGHT_DOWN]: Facing.RIGHT,
    [Facing.LEFT_UP]: Facing.LEFT,
    [Facing.RIGHT_UP]: Facing.UP,
  };
  return mapping[direction];
};

export const facingToIncrements = (direction: Facing): Point => {
  let incrementX = 0;
  let incrementY = 0;

  switch (direction) {
    case Facing.LEFT: {
      incrementX = -1;
      break;
    }
    case Facing.RIGHT: {
      incrementX = 1;
      break;
    }
    case Facing.UP: {
      incrementY = -1;
      break;
    }
    case Facing.DOWN: {
      incrementY = 1;
      break;
    }
    case Facing.LEFT_UP: {
      incrementX = -1;
      incrementY = -1;
      break;
    }
    case Facing.RIGHT_UP: {
      incrementX = 1;
      incrementY = -1;
      break;
    }
    case Facing.LEFT_DOWN: {
      incrementX = -1;
      incrementY = 1;
      break;
    }
    case Facing.RIGHT_DOWN: {
      incrementX = 1;
      incrementY = 1;
      break;
    }
  }

  return [incrementX, incrementY];
};

export const to1dIndex = (point: Point, width: number) => {
  return point[1] * width + (point[0] % width);
};

export const varyStats = (chTemplate: CharacterTemplate): CharacterTemplate => {
  const stats = chTemplate.stats as BattleStats;
  const keys = Object.keys(stats);
  for (let i = 0; i < keys.length; i++) {
    const statName = keys[i];
    if (statName === 'STAGGER') {
      continue;
    }
    if (Math.random() > 0.5) {
      stats[statName]++;
      i--;
      continue;
    }
  }
  return chTemplate;
};

export const sortItems = (a: Item, b: Item) => {
  return a.label < b.label ? -1 : 1;
};

export const msToTimeLabel = (duration: number) => {
  const portions: string[] = [];

  const msInHour = 1000 * 60 * 60;
  const hours = Math.trunc(duration / msInHour);
  if (hours > 0) {
    portions.push(hours + 'h');
    duration = duration - hours * msInHour;
  }

  const msInMinute = 1000 * 60;
  const minutes = Math.trunc(duration / msInMinute);
  if (minutes > 0) {
    portions.push(minutes + 'm');
    duration = duration - minutes * msInMinute;
  }

  const seconds = Math.trunc(duration / 1000);
  if (seconds > 0) {
    portions.push(seconds + 's');
  }

  return portions.join(' ');
};
