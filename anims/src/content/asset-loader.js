import Animation from './animation';

class AssetLoader {
  constructor(display) {
    this.isLoading = false;
    this.display = display;
  }

  isLoading() {
    return this.isLoading;
  }

  async processAssetFile(filename, text) {
    const sprite_cbs = [];
    const display = this.display;

    const _Cadence = async function(line) {
      let [_, cadenceName, spr1, spr2, spr3] = line;
      currentAnim.name = cadenceName;
      currentAnim.loop = true;
      currentAnim.isCadence = true;
      currentAnim.sprites.push({
        name: spr1,
        duration: 100,
      });
      currentAnim.sprites.push({
        name: spr2,
        duration: 100,
      });
      currentAnim.sprites.push({
        name: spr3,
        duration: 100,
      });
    };

    const _Picture = async function(line) {
      let [_, pictureName, __, spriteWidth, spriteHeight] = line;
      if (pictureName === 'invisible') {
        return;
      }
      display.updatePictureSpriteSize(pictureName, spriteWidth, spriteHeight);
      const { img } = display.pictures[pictureName];
      return img;
    };

    const _SpriteList = function(line, currentPicture, lastSpriteInd) {
      const sprite = display.getSprite(currentPicture);
      const sprite_pfx = line[1];
      const n = parseInt(line[2]) + lastSpriteInd;
      const w = parseInt(line[3]);
      const h = parseInt(line[4]);
      const num_x = sprite.clip_w / w;
      let ctr = 0;
      for (let i = lastSpriteInd; i < n; i++) {
        const sprite_name = sprite_pfx + '_' + ctr;
        display.createSprite(
          sprite_name,
          currentPicture,
          (i % num_x) * w,
          Math.floor(i / num_x) * h,
          w,
          h
        );
        ctr++;
      }
      lastSpriteInd = n;
    };

    const _Animation = function(line, currentAnim) {
      const animName = line[1];
      const loop = line[2];
      currentAnim.name = animName;
      currentAnim.loop = loop === 'true' ? true : false;
    };

    const _AnimSprite = function(line, currentAnim) {
      const spriteName = line[1];
      const ms = parseFloat(line[2]);

      currentAnim.sprites.push({
        name: spriteName,
        duration: ms,
      });
    };

    const res = (this.display.resources = text.split('\n'));
    let currentPicture = '';
    let currentAnim = null;
    let lastSpriteInd = 0;

    const _FinalizeCurrentAnimation = function() {
      display.createAnimation(
        currentAnim.name,
        currentPicture,
        function(currentAnim) {
          let a = new Animation(currentAnim.loop, display);
          a.name = currentAnim.name;
          a.isCadence = currentAnim.isCadence;
          currentAnim.sprites.forEach(obj => {
            a.addSprite({
              name: obj.name,
              duration: obj.duration,
              opacity: obj.opacity,
              offsetX: obj.offsetX,
              offsetY: obj.offsetY,
            });
          });
          return a;
        }.bind(this, currentAnim)
      );
    };

    for (let line of res) {
      line = line.split(',');
      const [type] = line;
      if (type === 'AnimSprite') {
        if (!currentAnim) {
          console.error(
            `Error reading '${filename}', AnimSprite without Anim`,
            line
          );
          throw new Error('display loading error');
        }
        _AnimSprite(line, currentAnim);
        continue;
      }

      if (currentAnim) {
        _FinalizeCurrentAnimation();
        currentAnim = null;
      }

      if (type === 'Picture') {
        currentPicture = line[1];
        lastSpriteInd = 0;
        await _Picture(line);
      } else if (type === 'SpriteList') {
        const n = parseInt(line[2]);
        sprite_cbs.push(
          _SpriteList.bind(this.display, line, currentPicture, lastSpriteInd)
        );
        lastSpriteInd += n;
      } else if (type === 'Animation') {
        currentAnim = {
          name: '',
          loop: true,
          sprites: [],
        };
        _Animation(line, currentAnim);
        continue;
      } else if (type === 'Cadence') {
        currentAnim = {
          name: '',
          loop: true,
          sprites: [],
        };
        _Cadence(line);
      }
    }

    if (currentAnim) {
      _FinalizeCurrentAnimation();
    }

    sprite_cbs.forEach(f => {
      f();
    });
  }

  async loadAssets(resTxt) {
    this.loading = true;
    await this.processAssetFile('res.txt', resTxt);
    this.loading = false;
  }
}

export default AssetLoader;
