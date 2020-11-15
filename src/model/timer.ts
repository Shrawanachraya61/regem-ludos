import { getNow } from 'model/misc';

export class Timer {
  timestampStart: number;
  timestampPause: number;
  duration: number;
  shouldRemove: boolean;
  awaits: any[];
  isPaused: boolean;

  constructor(duration: number) {
    this.timestampStart = getNow();
    this.timestampPause = 0;
    this.duration = duration;
    this.shouldRemove = false;
    this.isPaused = false;
    this.awaits = [];
  }

  start(duration?: number): void {
    this.timestampStart = getNow();
    this.duration = duration ?? this.duration;
  }

  pause(): void {
    if (!this.isPaused) {
      this.isPaused = true;
      this.timestampPause = getNow();
    }
  }
  unpause(): void {
    if (this.isPaused) {
      this.isPaused = false;
      this.updateStart(getNow() - this.timestampPause);
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
    return getNow() - this.timestampStart >= this.duration;
  }

  onCompletion(): Promise<void> {
    return new Promise(resolve => {
      if (this.isComplete()) {
        return;
      }
      this.awaits.push(resolve);
    });
  }

  getPctComplete(): number {
    let now = getNow();
    if (this.isPaused)  {
      now -= now - this.timestampPause;
    }
    let diff = now - this.timestampStart;
    if (diff > this.duration) {
      diff = this.duration;
    } else if (diff < 0) {
      diff = 0;
    }
    return diff / this.duration;
  }

  markForRemoval(): void {
    this.shouldRemove = true;
  }
}
