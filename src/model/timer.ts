import { getNow } from 'model/misc';

export class Timer {
  timestampStart: number;
  duration: number;
  shouldRemove: boolean;
  awaits: any[];

  constructor(duration: number) {
    this.timestampStart = getNow();
    this.duration = duration;
    this.shouldRemove = false;
    this.awaits = [];
  }

  start(duration?: number): void {
    this.timestampStart = getNow();
    this.duration = duration ?? this.duration;
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
    const now = getNow();
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
