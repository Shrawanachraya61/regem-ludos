import { getNow, getFrameMultiplier } from 'model/generics';
import { Point3d, normalizeClamp, normalizeEaseOutClamp } from 'utils';
import { TILE_HEIGHT } from 'model/room';

export class Timer {
  timestampStart: number;
  timestampPause: number;
  duration: number;
  shouldRemove: boolean;
  awaits: any[];
  paused: boolean;
  pausedOverridden: boolean;

  constructor(duration: number) {
    this.timestampStart = getNow();
    this.timestampPause = 0;
    this.duration = duration;
    this.shouldRemove = false;
    this.paused = false;
    this.pausedOverridden = false;
    this.awaits = [];
  }

  start(duration?: number): void {
    if (this.paused) {
      this.timestampPause = getNow();
      this.unpause();
    }

    this.timestampStart = getNow();
    this.duration = duration ?? this.duration;
  }

  isPaused() {
    return this.paused || this.pausedOverridden;
  }

  pause(): void {
    if (!this.paused) {
      this.paused = true;
      this.timestampPause = getNow();
    }
  }

  pauseOverride(): void {
    if (!this.pausedOverridden) {
      this.pausedOverridden = true;
      if (!this.paused) {
        this.timestampPause = getNow();
      }
    }
  }

  unpause(): void {
    if (this.paused) {
      this.paused = false;
      this.updateStart(getNow() - this.timestampPause);
    }
  }

  unpauseOverride(): void {
    if (this.pausedOverridden) {
      this.pausedOverridden = false;
      if (!this.paused) {
        this.updateStart(getNow() - this.timestampPause);
      }
    }
  }

  updateStart(offsetDuration: number): void {
    this.timestampStart += offsetDuration;
  }

  update(): void {
    if (this.isComplete()) {
      this.awaits.forEach(r => r());
      this.awaits = [];
    }
  }

  isComplete(): boolean {
    return !this.pausedOverridden && this.getPctComplete() >= 1;
  }

  onCompletion(): Promise<void> {
    return new Promise(resolve => {
      if (this.isComplete()) {
        return;
      }
      this.awaits.push(resolve);
    });
  }

  forceComplete() {
    this.timestampStart = -999999;
  }

  getPctComplete(): number {
    let now = getNow();
    if (this.isPaused()) {
      now -= now - this.timestampPause;
    }
    let diff = now - this.timestampStart;
    if (diff > this.duration) {
      diff = this.duration;
    } else if (diff < 0) {
      diff = -1;
    }
    return Math.min(1, diff / this.duration);
  }

  getDiff() {
    let now = getNow();
    if (this.isPaused()) {
      now -= now - this.timestampPause;
    }
    const diff = now - this.timestampStart;
    return [
      diff,
      now - this.timestampPause,
      this.timestampStart,
      this.timestampPause,
    ];
  }

  markForRemoval(): void {
    this.shouldRemove = true;
  }
}

export class Gauge {
  max: number;
  current: number;
  decayRate: number;
  constructor(max: number, rate: number) {
    this.max = max;
    this.current = 0;
    this.decayRate = rate;
  }
  fill(x: number): void {
    this.current += x;
    if (this.current > this.max) {
      this.current = this.max;
    }
  }
  empty(): void {
    this.current = 0;
  }
  isFull(): boolean {
    return this.current >= this.max;
  }
  getPct(): number {
    return this.current / this.max;
  }
  update(): void {
    this.current -= this.decayRate * getFrameMultiplier();
    if (this.current < 0) {
      this.current = 0;
    }
  }
}

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

export const transformOffsetWeightedParticle: TransformOffsetFunc = (
  pctComplete: number
) => {
  const threshold = 0.6;
  if (pctComplete < threshold) {
    const n = normalizeClamp(pctComplete, 0, threshold, 0, 1);
    return [0, -TILE_HEIGHT * Math.sin(n * Math.PI), 0];
  } else {
    const n = normalizeClamp(pctComplete, threshold, 1, 0, 1);
    return [0, -(TILE_HEIGHT / 4) * Math.sin(n * Math.PI), 0];
  }
};

export const transformOffsetJumpShort: TransformOffsetFunc = (
  pctComplete: number
) => {
  return [0, 0, TILE_HEIGHT * Math.sin(pctComplete * Math.PI)];
};

export const transformOffsetJumpMedium: TransformOffsetFunc = (
  pctComplete: number
) => {
  return [0, 0, TILE_HEIGHT * 2 * Math.sin(pctComplete * Math.PI)];
};

export const transformOffsetJumpFar: TransformOffsetFunc = (
  pctComplete: number
) => {
  return [0, 0, TILE_HEIGHT * 4 * Math.sin(pctComplete * Math.PI)];
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
