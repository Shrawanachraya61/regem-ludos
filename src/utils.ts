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
