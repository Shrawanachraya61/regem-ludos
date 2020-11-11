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
