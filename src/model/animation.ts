import { getNow } from 'model/misc';
import { Point } from 'utils';
import { getSprite } from 'model/sprite';

export interface AnimSprite {
  name: string;
  duration: number;
  timestampBegin?: number;
  timestampEnd?: number;
  offsetX?: number;
  offsetY?: number;
  opacity?: number;
}

export class Animation {
  name: string;
  loop: boolean;
  sprites: AnimSprite[];
  done: boolean;
  totalDurationMs: number;
  currentSpriteIndex: number;
  timestampStart: number;
  awaits: any[];

  constructor(loop: boolean) {
    this.loop = loop || false;
    this.sprites = [];
    this.done = false;
    this.totalDurationMs = 0;
    this.currentSpriteIndex = 0;
    this.timestampStart = 0;
    this.name = '';
    this.awaits = [];
  }

  reset(): void {
    this.done = false;
    this.currentSpriteIndex = 0;
  }

  start(): void {
    this.timestampStart = getNow();
  }

  getDurationMs(): number {
    return this.totalDurationMs;
  }

  addSprite({ name, duration, offsetX, offsetY, opacity }: AnimSprite): void {
    this.sprites.push({
      name,
      timestampBegin: this.totalDurationMs,
      timestampEnd: this.totalDurationMs + duration,
      duration,
      offsetX: offsetX || 0,
      offsetY: offsetY || 0,
      opacity,
    });
    this.totalDurationMs += duration;
  }

  getAnimIndex(timestampNow: number): number {
    let lastIndex = 0;
    let leftI = this.currentSpriteIndex;
    let rightI = this.sprites.length - 1;
    while (leftI <= rightI) {
      const midI = leftI + Math.floor((rightI - leftI) / 2);
      lastIndex = midI;
      const { timestampEnd, timestampBegin } = this.sprites[midI];

      const beginTime = (timestampBegin || 0) + this.timestampStart;
      const endTime = (timestampEnd || 0) + this.timestampStart;

      if (timestampNow < endTime && timestampNow > beginTime) {
        return midI;
      }

      if (timestampNow >= endTime) {
        leftI = midI + 1;
      } else {
        rightI = midI - 1;
      }
    }
    return lastIndex;
  }

  update(): void {
    const now = getNow();
    if (this.currentSpriteIndex === this.sprites.length - 1) {
      if (this.loop && now - this.timestampStart > this.totalDurationMs) {
        const newStart = this.timestampStart + this.totalDurationMs;
        this.reset();
        this.start();
        if (now - newStart < this.totalDurationMs) {
          this.timestampStart = newStart;
        }
      }
    }
    this.currentSpriteIndex = this.getAnimIndex(now);
    if (!this.loop) {
      if (now - this.timestampStart >= this.totalDurationMs) {
        this.done = true;
        this.awaits.forEach(r => r());
        this.awaits = [];
      }
    }
  }

  onCompletion(): Promise<void> {
    return new Promise(resolve => {
      if (this.isDone() || this.loop) {
        return;
      }
      this.awaits.push(resolve);
    });
  }

  getSprite(): string {
    return this.sprites[this.currentSpriteIndex].name;
  }

  getSpriteSize(i: number): Point {
    const now = getNow();
    i = i || this.getAnimIndex(now);
    const { name } = this.sprites[i];
    const [, , , width, height] = getSprite(name);
    return [width, height];
  }

  isDone(): boolean {
    return this.done;
  }
}

type AnimationBuilder = () => Animation;
const animationBuilders: { [key: string]: AnimationBuilder } = {};
export const createAnimationBuilder = (
  name: string,
  builder: () => Animation
): void => {
  animationBuilders[name] = builder;
};

export const createAnimation = (animName: string): Animation => {
  const builder = animationBuilders[animName];
  if (builder) {
    return builder();
  } else {
    throw new Error(`No animation exists which is named '${animName}'`);
  }
};
