class Animation {
  constructor(loop, display) {
    this.loop = loop || false;
    this.sprites = [];
    this.done = false;
    this.totalDurationMs = 0;
    this.currentSpriteIndex = 0;
    this.timestampStart = 0;
    this.spriteMap = {};
    this.display = display;
    this.isCadence = false;
  }

  reset() {
    this.done = false;
    this.currentSpriteIndex = 0;
  }

  remakeMS() {
    this.totalDurationMs = 0;
    this.sprites.forEach(spr => {
      spr.timestampBegin = this.totalDurationMs;
      spr.timestampEnd = this.totalDurationMs + spr.duration;
      this.totalDurationMs += spr.duration;
    });
  }

  start() {
    const { now } = this.display.getCurrentTime();
    this.timestampStart = now;
  }

  getDurationMs() {
    return this.totalDurationMs;
  }

  getFirstSpriteName() {
    return this.sprites[0] ? this.sprites[0].name : '';
  }

  hasSprite(spriteName) {
    return this.sprites.reduce((prev, curr) => {
      return prev || curr.name === spriteName;
    }, false);
  }

  setSpriteNameAtIndex(spriteName, i) {
    const spr = this.sprites[i];
    if (spr) {
      const oldName = spr.name;
      spr.name = spriteName;
      this.spriteMap[spriteName] = true;
      if (!this.hasSprite(oldName)) {
        this.spriteMap[oldName] = false;
      }
    }
  }

  createSprite({ name, duration, offsetX, offsetY, opacity }) {
    return {
      name,
      timestampBegin: this.totalDurationMs,
      timestampEnd: this.totalDurationMs + duration,
      durationMs: duration,
      offsetX: offsetX || 0,
      offsetY: offsetY || 0,
      opacity,
    };
  }

  addSprite(params) {
    this.sprites.push(this.createSprite(params));
    this.spriteMap[params.name] = true;
    this.totalDurationMs += params.duration;
  }

  containsSprite(spriteName) {
    return !!this.spriteMap[spriteName];
  }

  getAnimIndex(timestampNow) {
    let lastIndex = 0;
    let leftI = this.currentSpriteIndex;
    let rightI = this.sprites.length - 1;
    while (leftI <= rightI) {
      const midI = leftI + Math.floor((rightI - leftI) / 2);
      lastIndex = midI;
      const { timestampEnd, timestampBegin } = this.sprites[midI];

      const beginTime = timestampBegin + this.timestampStart;
      const endTime = timestampEnd + this.timestampStart;

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

  update() {
    const { now } = this.display.getCurrentTime();
    if (this.currentSpriteIndex === this.sprites.length - 1) {
      if (this.loop && now - this.timestampStart > this.totalDurationMs) {
        let newStart = this.timestampStart + this.totalDurationMs;
        this.reset();
        this.start();
        if (now - newStart < this.totalDurationMs) {
          this.timestampStart = newStart;
        }
      }
    }
    this.currentSpriteIndex = this.getAnimIndex(now);
  }

  getSprite() {
    const spr = this.sprites[this.currentSpriteIndex];
    return spr ? spr.name : 'invisible';
  }

  isDone() {
    return this.done;
  }
}

export { Animation };
