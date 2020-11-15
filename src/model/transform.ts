import { Timer } from 'model/timer';
import { Point, Point3d, normalizeClamp, normalizeEaseOutClamp } from 'utils';
import { TILE_HEIGHT } from 'model/room';

export enum TransformEase {
  LINEAR = 'linear',
  EASE_OUT = 'ease_out',
}

export type TransformOffsetFunc = (
  pctComplete: number,
  transform?: Transform
) => Point3d;

export const transformOffsetFlat: TransformOffsetFunc = (
  pctComplete: number
) => {
  return [0 * pctComplete, 0 * pctComplete, 0 * pctComplete];
};

export const transformOffsetJump: TransformOffsetFunc = (
  pctComplete: number
) => {
  return [0, 0, TILE_HEIGHT * Math.sin(pctComplete * Math.PI)];
};

export class Transform {
  startX: number;
  startY: number;
  startZ: number;
  endX: number;
  endY: number;
  endZ: number;
  timer: Timer;
  ease: TransformEase;
  offsetFunc: TransformOffsetFunc;
  shouldRemove: boolean;

  constructor(
    start: Point3d,
    end: Point3d,
    duration: number,
    ease: TransformEase,
    offsetFunc?: TransformOffsetFunc
  ) {
    this.startX = start[0];
    this.startY = start[1];
    this.startZ = start[2];
    this.endX = end[0];
    this.endY = end[1];
    this.endZ = end[2];
    this.timer = new Timer(duration);
    this.ease = ease;
    this.shouldRemove = false;
    this.offsetFunc = offsetFunc || transformOffsetFlat;
    this.timer.start();
  }

  start(): Point3d {
    return [this.startX, this.startY, this.endZ];
  }
  end(): Point3d {
    return [this.endX, this.endY, this.endZ];
  }
  current(): Point3d {
    const [offsetX, offsetY, offsetZ] = this.offsetFunc(
      this.timer.getPctComplete(),
      this
    );
    const pct = this.timer.getPctComplete();

    const transformEaseFunc =
      this.ease === TransformEase.EASE_OUT
        ? normalizeEaseOutClamp
        : normalizeClamp;

    return [
      transformEaseFunc(pct, 0, 1, this.startX, this.endX) + offsetX,
      transformEaseFunc(pct, 0, 1, this.startY, this.endY) + offsetY,
      transformEaseFunc(pct, 0, 1, this.startZ, this.endZ) + offsetZ,
    ];
  }
  update(): void {
    this.timer.update();
  }

  createInverse(): Transform {
    const t = new Transform(
      [this.endX, this.endY, this.endZ],
      [this.startX, this.startY, this.startZ],
      this.timer.duration,
      this.ease,
      this.offsetFunc
    );
    return t;
  }

  markForRemoval(): void {
    this.shouldRemove = true;
  }
}
