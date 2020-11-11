import { Point } from 'utils';

let now = 0;
export const getNow = (): number => now;
export const setNow = (n: number): void => {
  now = n;
};

let deltaT = 0;
export const getDeltaT = (): number => deltaT;
export const setDeltaT = (n: number): void => {
  deltaT = n;
};

let frameMultiplier = 0;
export const getFrameMultiplier = (): number => frameMultiplier;
export const setFrameMultiplier = (n: number): void => {
  frameMultiplier = n;
};

let mousePos = [0, 0] as Point;
export const getMousePos = (): Point => mousePos;
export const setMousePos = (x: number, y: number): void => {
  mousePos = [x, y];
};

const keyState: { [key: string]: boolean } = {};
export const setKeyDown = (key: string): void => {
  keyState[key] = true;
};
export const setKeyUp = (key: string): void => {
  keyState[key] = false;
};
export const isKeyDown = (key: string): boolean => {
  return keyState[key] ?? false;
};
