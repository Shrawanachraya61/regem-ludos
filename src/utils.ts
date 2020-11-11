export const isoToPixelCoords = (x: number, y: number): [number, number] => {
  return [x - y, (x + y) / 2];
};

export const pixelToIsoCoords = (x: number, y: number): [number, number] => {
  return [(2 * y + x) / 2, (2 * y - x) / 2];
};

export const removeFileExtension = (fileName: string): string => {
  const ind = fileName.lastIndexOf('.');
  if (ind > -1) {
    fileName = fileName.slice(0, ind);
  }
  return fileName;
};

export type Point = [number, number];

export type Rect = [number, number, number, number];

function easeOut(t: number, b: number, c: number, d: number): number {
  const t2 = t / d;
  return -c * t2 * (t2 - 2) + b;
}

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
