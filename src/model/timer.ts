import { getNow } from 'model/misc';

export class Timer {
  timestampStart: number;
  duration: number;
  shouldRemove: boolean;

  constructor(duration: number) {
    this.timestampStart = getNow();
    this.duration = duration;
    this.shouldRemove = false;
  }

  start(duration?: number): void {
    this.timestampStart = getNow();
    this.duration = duration ?? this.duration;
  }

  updateStart(offsetDuration: number): void {
    this.timestampStart += offsetDuration;
  }

  isComplete(): boolean {
    return getNow() - this.timestampStart >= this.duration;
  }

  markForRemoval(): void {
    this.shouldRemove = true;
  }
}
