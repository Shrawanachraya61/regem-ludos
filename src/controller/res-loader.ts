import { Animation, createAnimationBuilder } from 'model/animation';
import { loadImageAsSpritesheet, SpriteModification } from 'model/sprite';
import { loadSound, SoundType } from 'model/sound';

class AssetLoader {
  async processAssetFile(text: string): Promise<void> {
    const loadCbs = [] as any[];

    const _Sound = async function (line: any) {
      const [, soundName, soundUrl, volumeModifierStr] = line;
      let volumeModifier = parseFloat(volumeModifierStr);
      if (isNaN(volumeModifier)) {
        volumeModifier = 1;
      }
      return loadSound(soundName, soundUrl, SoundType.NORMAL, volumeModifier);
    };

    const _Music = async function (line: any) {
      const [, soundName, soundUrl, volumeModifierStr] = line;
      let volumeModifier = parseFloat(volumeModifierStr);
      if (isNaN(volumeModifier)) {
        volumeModifier = 1;
      }
      return loadSound(soundName, soundUrl, SoundType.MUSIC, volumeModifier);
    };

    const _Picture = async function (line: any) {
      const [, pictureName, url, spriteWidth, spriteHeight] = line;
      if (pictureName === 'invisible') {
        return;
      }
      const img = await loadImageAsSpritesheet(
        url,
        pictureName,
        Number(spriteWidth),
        Number(spriteHeight)
      );
      return img;
    };

    const _Animation = function (line: any, currentAnim: any) {
      const animName = line[1];
      const loop = line[2].trim();
      currentAnim.name = animName;
      currentAnim.loop = loop.indexOf('true') >= 0;
    };

    const _AnimSprite = function (line: any, currentAnim: Animation) {
      const spriteName = line[1];
      const ms = parseFloat(line[2]);

      currentAnim.addSprite({
        name: spriteName,
        duration: ms,
      });
    };

    const res = text.split('\n');
    let currentAnim = new Animation(false);

    const _FinalizeCurrentAnimation = function () {
      createAnimationBuilder(
        currentAnim.name,
        function (animTemplate: Animation) {
          const a = new Animation(animTemplate.loop);
          animTemplate.sprites.forEach(obj => {
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

      // flipped variant
      createAnimationBuilder(
        currentAnim.name + SpriteModification.FLIPPED,
        function (animTemplate: Animation) {
          const a = new Animation(animTemplate.loop);
          animTemplate.sprites.forEach(obj => {
            a.addSprite({
              name: obj.name + SpriteModification.FLIPPED,
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

    for (const lineArr of res) {
      const line = lineArr.split(',');
      const [type] = line;

      if (type === 'AnimSprite') {
        if (!currentAnim) {
          console.error(`Error reading res.txt, AnimSprite without Anim`, line);
          throw new Error('display loading error');
        }
        _AnimSprite(line, currentAnim);
        continue;
      }

      if (currentAnim) {
        _FinalizeCurrentAnimation();
      }

      switch (type) {
        case 'Picture': {
          loadCbs.push(() => _Picture(line));
          break;
        }
        case 'Animation': {
          currentAnim = new Animation(false);
          _Animation(line, currentAnim);
          continue;
        }
        case 'Sound': {
          loadCbs.push(() => _Sound(line));
          break;
        }
        case 'Music': {
          loadCbs.push(() => _Music(line));
          break;
        }
      }
    }

    if (currentAnim) {
      _FinalizeCurrentAnimation();
    }

    for (let i = 0; i < loadCbs.length; i++) {
      await loadCbs[i]();
    }
  }

  async loadAssets(res: string): Promise<void> {
    await this.processAssetFile(res);
  }
}

export const loadRes = async () => {
  const text = await (await fetch('res/res.txt')).text();
  const foley = await (await fetch('res/res-foley.txt')).text();
  const loader = new AssetLoader();
  return Promise.all([loader.loadAssets(text), loader.loadAssets(foley)]);
};
