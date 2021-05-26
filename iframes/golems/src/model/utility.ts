const getNow = (): number => window.performance.now();

class Timer {
  timestampStart: number;
  timestampPause: number;
  duration: number;
  awaits: any[];
  paused: boolean;

  constructor(duration: number) {
    this.timestampStart = getNow();
    this.timestampPause = 0;
    this.duration = duration;
    this.paused = false;
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
    return this.paused;
  }

  pause(): void {
    if (!this.paused) {
      this.paused = true;
      this.timestampPause = getNow();
    }
  }

  unpause(): void {
    if (this.paused) {
      this.paused = false;
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
    return this.getPctComplete() >= 1;
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
}
