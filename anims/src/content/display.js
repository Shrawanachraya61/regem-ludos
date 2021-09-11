import Animation from './animation';
import AssetLoader, { getZipImageData } from './asset-loader';
import { randomId } from 'utils';

const shouldUseZip = true;

const display = {
  canvases: [],
  canvas: null,
  origCanvas: null,
  ctx: null,
  canvasId: 'canvas',
  loading: false,
  loaded: false,
  resources: [],
  props: [],
  pictures: {},
  sprites: {},
  sounds: {},
  animations: {},
  objects: {},
  frame: 0,
  width: 256,
  height: 256,
  assets_loaded: 0,
  assets_loading: 0,
  isPaused: false,
  isBlurred: false,
  lastFocusTimestamp: 0,
  timePausedMs: 0,
  now: 0,
  nowTotal: 0,
  error: false,
  timeouts: {},
  transform: {
    x: 0,
    y: 0,
  },
  placeholderImage: null,
};

display.loadPlaceholderImage = async function() {
  return new Promise(resolve => {
    const img = new global.Image();
    img.onload = () => {
      display.placeholderImage = img;
      resolve(img);
    };
    img.src = 'placeholder.png';
  });
};

class Sprite {
  constructor(img_name, clip_x, clip_y, clip_w, clip_h) {
    this.img = img_name;
    this.clip_x = clip_x;
    this.clip_y = clip_y;
    this.clip_w = clip_w;
    this.clip_h = clip_h;
    this.is_blank = null;
  }
}

display.checkIfSpritIsBlank = function(spriteName) {
  const sprite = display.getSprite(spriteName);
  const canvas = document.createElement('canvas');
  canvas.width = sprite.clip_w;
  canvas.height = sprite.clip_h;
  display.setCanvas(canvas);
  display.drawSprite(spriteName, 0, 0);
  display.restoreCanvas();
  sprite.is_blank = display.isCanvasBlank(canvas);
};

display.loadPicture = async function(name, url, spriteWidth, spriteHeight) {
  return new Promise(resolve => {
    const cbs = display.pictures[name];

    if (Array.isArray(cbs)) {
      cbs.push(() => {
        resolve(display.pictures[name]);
      });
      return;
    } else if (typeof cbs === 'object') {
      resolve(display.pictures[name]);
      return;
    }

    // console.log('LOAD IMAGE', name, url);

    if (shouldUseZip) {
      display.pictures[name] = [];
      const img = getZipImageData(url);
      if (img) {
        display.sprites[name] = new Sprite(name, 0, 0, img.width, img.height);
        const cbs = display.pictures[name];
        display.pictures[name] = {
          img,
          imageName: name,
          spriteWidth,
          spriteHeight,
          animations: [],
          totalSprites: 0,
        };
        display.updatePictureSpriteSize(
          name,
          spriteWidth || 64,
          spriteHeight || 64
        );
        display.createAnimationFromPicture(name);
        if (cbs) {
          cbs.forEach(cb => cb());
        }
        resolve(img);
      } else {
        throw new Error('Failed to load ZIP image: ' + url);
      }
    } else {
      display.pictures[name] = [];
      const img = new global.Image();
      img.onload = () => {
        display.sprites[name] = new Sprite(name, 0, 0, img.width, img.height);
        const cbs = display.pictures[name];
        display.pictures[name] = {
          img,
          imageName: name,
          spriteWidth,
          spriteHeight,
          animations: [],
          totalSprites: 0,
        };
        display.updatePictureSpriteSize(
          name,
          spriteWidth || 64,
          spriteHeight || 64
        );
        display.createAnimationFromPicture(name);
        cbs.forEach(cb => cb());
        resolve(img);
      };
      img.src = url;
    }
  });
};

display.calculateSpritesheet = (imageName, spriteWidth, spriteHeight) => {
  const image = display.pictures[imageName].img;
  if (!image) {
    console.error(
      'no image exists with name',
      imageName,
      spriteWidth,
      spriteHeight
    );
    throw new Error('loading error');
  }
  spriteWidth = spriteWidth || 1;
  spriteHeight = spriteHeight || 1;
  let nX = Math.round((image ? image.width : 1) / spriteWidth);
  let nY = Math.round((image ? image.height : 1) / spriteHeight);
  nX = nX || 0;
  nY = nY || 0;
  for (let i = 0; i < nY; i++) {
    for (let j = 0; j < nX; j++) {
      const spriteName = imageName + '_' + (i * nX + j);
      display.createSprite(
        spriteName,
        imageName,
        j * spriteWidth,
        i * spriteHeight,
        spriteWidth,
        spriteHeight
      );
      display.checkIfSpritIsBlank(spriteName);
    }
  }
  return nX * nY;
};

display.updatePictureSpriteSize = function(name, spriteWidth, spriteHeight) {
  const picture = display.pictures[name];
  if (Array.isArray(picture)) {
    picture.push(() =>
      display.updatePictureSpriteSize(name, spriteWidth, spriteHeight)
    );
  } else if (
    picture &&
    (picture.spriteWidth !== spriteWidth ||
      picture.spriteHeight !== spriteHeight)
  ) {
    picture.spriteWidth = spriteWidth || 1;
    picture.spriteHeight = spriteHeight || 1;
    const total = display.calculateSpritesheet(name, spriteWidth, spriteHeight);
    picture.totalSprites = total;
  }
};

display.createSprite = function(name, pic, x, y, w, h) {
  display.sprites[name] = new Sprite(pic, x, y, w, h);
};

display.updateAnimation = function(anim, imageName, loop, sprites) {
  const isCadence = anim.isCadence;
  display.createAnimation(anim.name, imageName, currentAnim => {
    let a = new Animation(loop, display);
    a.name = anim.name;
    a.isCadence = isCadence;
    sprites.forEach(obj => {
      a.addSprite({
        name: obj.name,
        duration: obj.durationMs,
        opacity: obj.opacity,
        offsetX: obj.offsetX,
        offsetY: obj.offsetY,
      });
    });
    return a;
  });
};

display.createAnimation = function(name, picName, cb, i) {
  try {
    display.animations[name] = cb;
    if (picName) {
      const pic = display.pictures[picName];
      if (!pic) {
        throw new Error('Cannot create anim ' + name);
      }

      if (Array.isArray(pic)) {
        if (i === undefined) {
          pic.push(() => display.createAnimation(name, picName, cb));
        } else {
          pic.splice(i, 0, () => display.createAnimation(name, picName, cb));
        }
      } else if (!pic.animations.includes(name)) {
        if (i === undefined) {
          pic.animations.push(name);
        } else {
          pic.animations.splice(i, 0, name);
        }
      }
    }
  } catch (e) {
    console.error('cannot create anim', name, 'for pic', picName);
    delete display.animations[name];
  }
};

display.createAnimationFromPicture = function(name) {
  display.createAnimation(name, null, () => {
    const a = new Animation(false, display);
    a.name = name;
    a.addSprite({ name: name, duration: 100 });
    return a;
  });
};

display.changeAnimationOrder = function(animations, i, direction) {
  if (direction === 'up') {
    if (i <= 0) {
      return;
    }
    const tmp = animations[i - 1];
    animations[i - 1] = animations[i];
    animations[i] = tmp;
  } else if (direction === 'dn') {
    if (i >= animations.length - 1) {
    }
    const tmp = animations[i + 1];
    animations[i + 1] = animations[i];
    animations[i] = tmp;
  }
};

display.setError = function() {
  display.error = true;
};

display.setTimeout = function(cb, ms) {
  const id = randomId(7);
  display.timeouts[id] = {
    cb,
    timeStart: display.now_ms,
    ms,
  };
  return id;
};

display.clearTimeout = function(id) {
  delete display.timeouts[id];
};

display.getCurrentTime = function() {
  return {
    delta_t_ms: Math.min(display.delta_t_ms, 100),
    now: display.now,
  };
};

display.setLoop = function(cb) {
  let then = 0;
  this.loopCb = cb;
  this.now_ms = window.performance.now();
  this.now = this.now_ms * 0.001;
  const _loop = () => {
    if (display.isPaused) {
      return;
    }
    let now = window.performance.now();

    display.delta_t_ms = now - display.now_ms;
    display.now = display.now_ms = now - display.timePausedMs;
    now *= 0.001;
    display.delta_t = now - then;
    then = now;
    display.frame = (display.frame + 1) % 1024;

    const toDelete = [];
    for (let i in display.timeouts) {
      const { cb: cbTimeout, timeStart, ms: msTimeout } = display.timeouts[i];
      if (this.now_ms - timeStart >= msTimeout) {
        cbTimeout();
        toDelete.push(i);
      }
    }
    toDelete.forEach(id => display.clearTimeout(id));

    cb();
    if (!display.error) {
      window.requestAnimationFrame(_loop);
    }
  };
  window.requestAnimationFrame(_loop);
};

display.getCtx = function() {
  return display.canvas.getContext('2d');
};

display.setCanvas = function(canvas) {
  display.canvasId = canvas.id;
  display.canvas = canvas;
  display.ctx = canvas.getContext('2d');
  display.ctx.mozImageSmoothingEnabled = false;
  display.ctx.webkitImageSmoothingEnabled = false;
  display.ctx.imageSmoothingEnabled = false;
};

display.restoreCanvas = function() {
  display.canvas = display.origCanvas;
};

display.getSprite = function(k, suppressError) {
  if (display.sprites[k]) {
    return display.sprites[k];
  } else {
    if (suppressError) {
      return null;
    }
    console.error('[DISPLAY] No sprite named: ', k);
    // display.setError();
    return null;
  }
};

display.getPictureFromSprite = function(k) {
  const sprite = display.getSprite(k, true);
  if (sprite) {
    return display.pictures[sprite.img];
  } else {
    return {};
  }
};

display.hasAnimation = function(k) {
  return !!display.animations[k];
};

display.getAnimation = function(k, t) {
  let key = k;
  if (t) {
    key = k + '_' + t;
  }

  if (display.animations[key]) {
    return display.animations[key]();
  } else {
    console.error('[DISPLAY] No animation named: ', key);
    return null;
  }
};

display.getAnimationMs = function(k) {
  const anim = this.getAnimation(k);
  return anim.totalDurationMs;
};

display.animExists = function(k, t) {
  let key = k;
  if (t) {
    key = k + '_' + t;
  }
  if (display.animations[key]) {
    return true;
  } else {
    return false;
  }
};

display.clearScreen = function() {
  const ctx = display.getCtx();
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

display.drawSprite = function(sprite, x, y, params) {
  const ctx = display.getCtx();
  let s = null;
  let img = null;
  let { width, height, centered, bottom, rotation, opacity, scale } =
    params || {};
  if (typeof sprite === 'string') {
    s = display.getSprite(sprite);
  } else {
    s = true;
    img = sprite;
  }
  if (s) {
    ctx.save();
    if (opacity !== undefined) {
      ctx.globalAlpha = params.opacity;
    }
    let w = width ? width : s.clip_w;
    let h = height ? height : s.clip_h;
    if (scale !== undefined) {
      w = s.clip_w * scale;
      h = s.clip_h * scale;
    }
    if (rotation !== undefined) {
      centered = false;
      x -= w / 2;
      y -= w / 2;
      ctx.translate(x, y);
      ctx.translate(w / 2, h / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      x = -w / 2;
      y = -h / 2;
    }

    if (s !== true) {
      img = display.pictures[s.img].img;
      if (!img) {
        return;
      }
      let _x = Math.round(x);
      let _y = Math.round(y);
      if (centered) {
        _x = Math.round(x - w / 2);
        _y = Math.round(y - h / 2);
      } else if (bottom) {
        _x = Math.round(x - w / 2);
        _y = Math.round(y - h);
      }

      _x += display.transform.x;
      _y += display.transform.y;

      ctx.drawImage(
        img,
        s.clip_x,
        s.clip_y,
        s.clip_w,
        s.clip_h,
        _x,
        _y,
        Math.round(w),
        Math.round(h)
      );
    } else {
      ctx.drawImage(img, x, y);
    }
    ctx.restore();
  }
};

display.getImageFromAnimName = function(animName) {
  for (let i in display.pictures) {
    const anims = display.pictures[i].animations;
    for (let j in anims) {
      const animName2 = anims[j];
      if (animName2 === animName) {
        return i;
      }
    }
  }
  return null;
};

display.drawAnim = function(anim, x, y, params) {
  if (anim) {
    const spriteName = anim.getSprite();
    display.drawSprite(spriteName, x, y, params);
    anim.update();
  }
};
display.drawAnimation = display.drawAnim;

display.drawRect = function(x, y, w, h, color) {
  const ctx = display.getCtx();
  ctx.lineWidth = 2;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
};

display.drawRectOutline = function(x, y, w, h, color, line_width) {
  const ctx = display.getCtx();
  ctx.lineWidth = line_width || 2;
  ctx.strokeStyle = color;
  ctx.strokeRect(x, y, w, h);
};

display.resize = function(width, height) {
  display.width = width;
  display.height = height;
  const ctx = display.getCtx();
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  display.setCanvas(ctx.canvas);
};

display.isCanvasBlank = function(canvas) {
  const context = canvas.getContext('2d');

  const pixelBuffer = new Uint32Array(
    context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
  );

  return !pixelBuffer.some(color => color !== 0);
};

display.loadTxt = async function loadTxt() {
  const type = 'GET';
  const url = '/txt';
  const opts = {
    method: type,
    headers: {},
  };
  console.log('[fetch]', type, url);
  const data = await fetch(url, opts)
    .then(async function(response) {
      const json = await response.json();
      console.log('[fetch]', 'result', type, url, json);
      return json;
    })
    .catch(err => {
      throw err;
    });

  return data.files.reduce((prev, curr) => prev + '\n' + curr, '');
};

display.getImageList = async function getImageList() {
  const type = 'GET';
  const url = '/spritesheets';
  const opts = {
    method: type,
    headers: {},
  };
  console.log('[fetch]', type, url);
  const data = await fetch(url, opts)
    .then(async function(response) {
      let json;
      try {
        json = await response.json();
      } catch (e) {
        console.error('failed to parse json?', e);
        throw e;
      }
      console.log('[fetch]', 'result', type, url, json);
      return json;
    })
    .catch(err => {
      throw err;
    });
  return data.files;
};

display.loadImages = async function loadImages(files) {
  console.log('load zip');
  const l = new AssetLoader(display);
  await l.loadZip();

  console.log('load pictures');
  const callbacks = files.map(async fileName => {
    return display.loadPicture(fileName.slice(0, -4), fileName);
  });
  await Promise.all(callbacks);
};

display.getFormattedTxtForAnimation = function(animation) {
  if (!animation) {
    return '';
  }
  if (animation.isCadence) {
    let txt = `Cadence,${animation.name},`;
    txt += animation.sprites.slice(0, 3).map(spr => {
      return `${spr.name}`;
    });
    return txt + '\n';
  } else {
    let txt = `Animation,${animation.name},${animation.loop}\n`;
    txt += animation.sprites
      .map(spr => {
        return `AnimSprite,${spr.name},${spr.durationMs}`;
      })
      .join('\n');
    return txt + '\n';
  }
};

display.getFormattedTxtForImage = function(imageName) {
  const picture = display.pictures[imageName];
  if (!picture) {
    return '';
  }
  const { spriteWidth, spriteHeight, animations } = picture;
  let txt = `Picture,${imageName},${imageName}.png,${spriteWidth},${spriteHeight}\n`;
  for (let i in animations) {
    const animName = animations[i];
    const anim = display.getAnimation(animName);
    if (display.pictures[anim.name]) {
      continue;
    }
    txt += display.getFormattedTxtForAnimation(anim);
  }
  return txt;
};

display.saveToTxt = async function() {
  let txt = '';
  for (let imageName in display.pictures) {
    txt += display.getFormattedTxtForImage(imageName);
  }
  // for (let animName in display.animations) {
  //   const anim = display.getAnimation(animName);
  //   if (display.pictures[anim.name]) {
  //     continue;
  //   }
  //   txt += display.getFormattedTxtForAnimation(anim);
  // }

  const type = 'POST';
  const url = '/txt';
  const opts = {
    method: type,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      txt,
    }),
  };
  console.log('[fetch]', type, url, opts.body);
  const data = await fetch(url, opts)
    .then(async function(response) {
      const json = await response.json();
      console.log('[fetch]', 'result', type, url, json);
      return json;
    })
    .catch(err => {
      throw err;
    });
  if (data.err) {
    console.error(data.err);
  }
};

display.loadRes = async function(resTxt) {
  const l = new AssetLoader(display);
  await l.loadAssets(resTxt);
  display.resize(window.innerWidth, window.innerHeight);
  console.log('[DISPLAY] successfully loaded.');
};

display.init = async function(canvasId) {
  if (display.loaded) {
    console.warn('[DISPLAY] already loaded!');
    return;
  }
  if (display.loading) {
    console.warn('[DISPLAY] already loading...');
    return;
  }
  if (canvasId) {
    display.canvasId = canvasId;
  }

  display.pictures.invisible = {
    img: null,
    imageName: 'invisible',
    spriteWidth: 0,
    spriteHeight: 0,
    animations: [],
    totalSprites: 0,
  };
  display.sprites.invisible = new Sprite('invisible', 'invisible', 0, 0, 0, 0);

  display.loading = true;
  display.setCanvas(
    document.getElementById(display.canvasId) ||
      document.createElement('canvas')
  );
  display.origCanvas = display.canvas;
  display.width = display.canvas.width;
  display.height = display.canvas.height;
  display.loading = false;
};

global.display = display;

export default display;
