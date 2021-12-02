import { Animation, createAnimationBuilder } from 'model/animation';
import { loadImageAsSpritesheet, SpriteModification } from 'model/sprite';
import { loadSound, SoundType } from 'model/sound';
import { getResPath, shouldUseZip } from 'model/generics';

const getJSZip = () => {
  return (window as any).JSZip;
};


const zipImages = {};
const zipAudio = {};

class AssetLoader {
  async processAssetFile(text: string): Promise<void> {
    const loadCbs = [] as any[];
    const _Sound = async function (line: any) {
      const [, soundName, soundUrl, volumeModifierStr] = line;
      let volumeModifier = parseFloat(volumeModifierStr);
      if (isNaN(volumeModifier)) {
        volumeModifier = 1;
      }
      return loadSound(
        soundName,
        soundUrl,
        SoundType.NORMAL,
        volumeModifier,
        true
      );
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

export const loadRes = async (loadingTick?: () => void) => {
  const PATH_PREFIX = `${getResPath()}/`;

  const text = await (await fetch(PATH_PREFIX + 'res.txt')).text();
  const foley = await (await fetch(PATH_PREFIX + 'res-foley.txt')).text();
  const bg = await (await fetch(PATH_PREFIX + 'res-bg.txt')).text();
  if (loadingTick) {
    loadingTick();
  }

  if (shouldUseZip()) {
    const zips = await Promise.all([
      fetchZipArchive(PATH_PREFIX + 'images.zip'),
      // fetchZipArchive('res/snd/foley/foley.zip'),
    ]);
    const imagesArchive = zips[0];
    await processZipImagesArchiveJSZip(imagesArchive);
    // const soundsArchive = zips[1];
    // await processZipSoundArchiveJSZip(soundsArchive);
  }

  const loader = new AssetLoader();
  return Promise.all([
    loader.loadAssets(text).then(loadingTick || function () {}),
    loader.loadAssets(foley).then(loadingTick || function () {}),
    loader.loadAssets(bg).then(loadingTick || function () {}),
  ]);
};

const processZipImagesArchiveJSZip = async imagesArchive => {
  return Promise.all(
    Object.keys(imagesArchive.files).map(async imageName => {
      const zip = imagesArchive.files[imageName];
      const blob = new Blob([await zip.async('arraybuffer')], {
        type: 'image/png',
      });
      const imgData = URL.createObjectURL(blob);
      const image = document.createElement('img');
      image.src = imgData;
      zipImages[imageName] = image;
    })
  ).catch(e => {
    console.error('Failed to fetch images archive', e);
  });
};

// probably don't need this, but it's fine to have for justin
const processZipSoundArchiveJSZip = async soundsArchive => {
  return Promise.all(
    Object.keys(soundsArchive.files).map(async soundName => {
      const zip = soundsArchive.files[soundName];
      const blob = new Blob([await zip.async('arraybuffer')], {
        type: 'audio/mpeg',
      });
      const soundData = URL.createObjectURL(blob);
      const audio = new Audio(soundData);
      audio.autoplay = false;
      zipAudio[soundName] = audio;
    })
  ).catch(e => {
    console.error('Failed to fetch sounds archive', e);
  });
};

const fetchZipArchive = async (url: string) => {
  const zip: any = await fetch(url)
    .then(function (response) {
      if (response.status === 200 || response.status === 0) {
        return Promise.resolve(response.blob());
      } else {
        return Promise.reject(new Error(response.statusText));
      }
    })
    .then(getJSZip().loadAsync);
  return zip;
};

export const getZipImageData = (imageName: string): HTMLImageElement | null => {
  const imgData = zipImages[imageName];
  if (imgData) {
    return imgData;
  } else {
    return null;
  }
};

export const getZipAudioData = (audioName: string): HTMLAudioElement | null => {
  const audioData = zipAudio[audioName];
  if (audioName) {
    return audioData;
  } else {
    return null;
  }
};
