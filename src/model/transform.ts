import { Timer } from 'model/timer';
import { Point, normalizeClamp, normalizeEaseOutClamp } from 'utils';

export enum TransformEase {
  LINEAR = 'linear',
  EASE_OUT = 'ease_out',
}

export class Transform {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  timer: Timer;
  ease: TransformEase;
  constructor(duration: number, ease: TransformEase) {
    this.startX = 0;
    this.startY = 0;
    this.endX = 0;
    this.endY = 0;
    this.timer = new Timer(duration);
    this.ease = ease;
  }

  start(): Point {
    return [this.startX, this.startY];
  }
  end(): Point {
    return [this.endX, this.endY];
  }
  current(multiplier?: Point): Point {
    const [multX, multY] = multiplier || [1, 1];
    const pct = this.timer.getPctComplete();

    const transformEaseFunc =
      this.ease === TransformEase.EASE_OUT
        ? normalizeEaseOutClamp
        : normalizeClamp;

    return [
      transformEaseFunc(pct, 0, 1, this.startX, this.endX) * multX,
      transformEaseFunc(pct, 0, 1, this.startY, this.endY) * multY,
    ];
  }
}
