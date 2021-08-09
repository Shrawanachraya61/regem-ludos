import { normalizeClamp, timeoutPromise } from 'utils';
import { getNow, getSoundEnabled, getVolume } from './generics';

const SOUND_PATH_PREFIX = 'res/snd';

interface ISoundSpritesheetMetadata {
  resources: string[];
  spritemap: {
    [key: string]: ISoundSprite;
  };
}
interface ISoundSprite {
  start: number;
  end: number;
  loop: boolean;
}
let spritesheetMetadata: ISoundSpritesheetMetadata = {
  resources: [],
  spritemap: {},
};

export const sounds: Record<
  string,
  ISoundLoaded
> = ((window as any).sounds = {});
export const musicSoundObjects: Record<string, ISound> = {};
const activeSounds: ISound[] = [];

export enum SoundType {
  NORMAL = 'normal',
  MUSIC = 'music',
  SPRITESHEET = 'spritesheet',
}

interface ISoundLoaded {
  nodes: HTMLAudioElement[];
  currentNodeIndex: number;
  soundDuration: number;
  soundType: SoundType;
  volumeModifier: number;
  useSpritesheet: boolean;
  sprite?: ISoundSprite;
}

interface ISound extends ISoundLoaded {
  soundName: string;
  duration: number;
  lastStartTimestamp: number;
}

const soundSprites: Record<string, ISoundSprite> = {};
const getSoundSprite = (id: string) => {
  return soundSprites[id] ?? null;
};
const setSoundSprite = (audio: HTMLAudioElement, sprite: ISoundSprite) => {
  soundSprites[audio.id] = sprite;
};
const addSpritesheetUpdateListener = (audio: HTMLAudioElement) => {
  audio.addEventListener(
    'timeupdate',
    function () {
      const sound: HTMLAudioElement = this;
      const sprite = getSoundSprite(sound.id);
      if (sprite) {
        if (
          sound.currentTime > sprite.end ||
          sound.currentTime < sprite.start
        ) {
          sound.pause();
        }
      }
    }.bind(audio)
  );
};

export const loadSoundSpritesheet = async (url: string) => {
  const metaUrl = SOUND_PATH_PREFIX + '/' + url.slice(0, -4) + '.json';
  spritesheetMetadata = await fetch(metaUrl)
    .then(res => res.json())
    .catch(e => {
      console.error('Failed to load json metadata for sound spritesheet', e);
    });

  const blob = await fetch(SOUND_PATH_PREFIX + '/' + url).then(res =>
    res.blob()
  );
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  const dataUrl: string = await new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject('failed to read blob: ' + url);
    }, 10000);
    reader.addEventListener('loadend', () => {
      const result = reader?.result;
      if (result) {
        clearTimeout(timeoutId);
        resolve(result.toString());
      }
    });
  });
  const audio = new Audio(dataUrl);
  audio.autoplay = false;
  audio.id = 'audio1';
  addSpritesheetUpdateListener(audio);
  const loadedSound = addSoundToLoadedSounds(
    audio,
    SoundType.SPRITESHEET,
    'spritesheet',
    1.0
  );

  for (let i = 0; i < 4; i++) {
    const audio = new Audio(dataUrl);
    audio.autoplay = false;
    audio.id = 'audio' + (i + 2);
    addSpritesheetUpdateListener(audio);
    loadedSound.nodes.push(audio);
  }

  // await loadSound('spritesheet', url, SoundType.SPRITESHEET, 1.0);
};

export const getSoundSpriteMetadata = (url: string) => {
  const nameFromUrl = url.slice(url.lastIndexOf('/') + 1, -4);
  const meta = spritesheetMetadata.spritemap[nameFromUrl];
  if (!meta) {
    throw new Error(
      `No spritesheet meta exists for url='${url}' nameFromUrl='${nameFromUrl}'`
    );
  }
  return meta;
};

const addSoundToLoadedSounds = (
  sound: HTMLAudioElement,
  type: SoundType,
  name: string,
  volumeModifier: number
) => {
  sound.oncanplay = null;
  sound.currentTime = 99999999999;
  const soundDuration = sound.currentTime;
  sound.currentTime = 0;
  sound.onended = function () {
    sound.pause();
    sound.currentTime = 0;
  };
  sounds[name] = {
    nodes: [sound],
    currentNodeIndex: 0,
    soundDuration,
    soundType: type,
    volumeModifier,
    useSpritesheet: false,
  };
  if (type === SoundType.MUSIC) {
    console.log('Adding music track', name, getSound(name));
    musicSoundObjects[name] = getSound(name) as ISound;
  }
  return sounds[name];
};

export const loadSound = async (
  name: string,
  url: string,
  type: SoundType,
  volumeModifier: number,
  useSpritesheet?: boolean
) => {
  if (useSpritesheet) {
    try {
      const spritesheetSound = getSound('spritesheet');
      const meta = getSoundSpriteMetadata(url);
      if (spritesheetSound) {
        sounds[name] = {
          nodes: spritesheetSound.nodes,
          currentNodeIndex: 0,
          soundDuration: meta.end - meta.start,
          soundType: SoundType.NORMAL,
          volumeModifier,
          useSpritesheet: true,
          sprite: meta,
        };
      }
    } catch (e) {
      console.error('Failed to load spritesheet sound', e);
    }
  } else {
    url = `${SOUND_PATH_PREFIX}/${url}`;
    return new Promise((resolve, reject) => {
      const sound = new Audio(url);
      sound.autoplay = false;
      const onLoad = () => {
        addSoundToLoadedSounds(sound, type, name, volumeModifier);
        clearTimeout(timeoutId);
        resolve(sound);
      };
      sound.oncanplay = sound.onloadeddata = onLoad;
      const timeoutId = setTimeout(() => {
        console.error('Sound load timed out:', name, url);
        onLoad();
      }, 5000);

      sound.addEventListener('error', (e: Event) => {
        console.error('sound error', e);
        reject(
          'Cannot load sound: name="' +
            name +
            '", url="' +
            url +
            '", type=' +
            type
        );
      });
      sound.src = url;
    });
  }
};

export const getSound = (soundName: string): ISound | null => {
  const soundObj = sounds[soundName];
  if (soundObj) {
    const s: ISound = {
      duration: 0,
      ...soundObj,
      //soundDuration merged in from soundObj
      soundName,
      lastStartTimestamp: getNow(),
    };
    return s;
  } else {
    console.error('Could not find sound with name: ', soundName);
    return null;
  }
};

export const playSound = (soundObj: ISound, volume?: number) => {
  if (!getSoundEnabled()) {
    return;
  }
  volume = volume ?? getVolume(soundObj.soundType);

  if (soundObj.useSpritesheet && soundObj.sprite) {
    const spritesheetSound = sounds.spritesheet;
    if (spritesheetSound) {
      const sprite = soundObj.sprite;
      const sound: any =
        spritesheetSound.nodes[spritesheetSound.currentNodeIndex]; //spritesheetSound.sound;
      console.log(
        'play sound from node',
        spritesheetSound.currentNodeIndex,
        sound.id,
        'len=' + spritesheetSound.nodes.length,
        'next=' +
          ((spritesheetSound.currentNodeIndex + 1) %
            spritesheetSound.nodes.length)
      );
      sound.volume = (volume || 1) * soundObj.volumeModifier;
      sound.currentTime = sprite.start;
      setSoundSprite(sound, sprite);
      sound.play();
      soundObj.lastStartTimestamp = getNow();
      spritesheetSound.currentNodeIndex =
        (spritesheetSound.currentNodeIndex + 1) % spritesheetSound.nodes.length;
    }
  } else {
    const sound = soundObj.nodes[0];
    sound.volume = (volume || 1) * soundObj.volumeModifier;
    sound.play();
    soundObj.lastStartTimestamp = getNow();
  }
};

export const playMusic = async (
  musicName: string,
  loop: boolean,
  fadeMs?: number
) => {
  const music = musicSoundObjects[musicName];
  if (!music) {
    console.error('playMusic: Could not find music with name:', musicName);
    return;
  }
  const sound = music.nodes[0];
  sound.loop = loop;
  if (!sound.paused) {
    console.log('playMusic: Music is already playing:', musicName);
    return;
  }
  sound.currentTime = 0;

  playSound(music);
  fadeMs = fadeMs ?? 0;
  if (fadeMs > 0) {
    const fadeStep = 13; //60 fades per second?
    for (let i = 0; i < fadeMs; i += fadeStep) {
      const maxVolume = getVolume(SoundType.MUSIC);
      sound.volume = normalizeClamp(i, 0, fadeMs, 0, maxVolume);
      await timeoutPromise(fadeStep);
    }
    sound.volume = getVolume(SoundType.MUSIC);
  }
};

export const stopMusic = async (musicName: string, fadeMs?: number) => {
  const music = musicSoundObjects[musicName];
  if (!music) {
    console.error('stopMusic: Could not find music with name:', musicName);
    return;
  }
  const sound = music.nodes[0];
  if (!sound.paused) {
    fadeMs = fadeMs ?? 0;
    if (fadeMs > 0) {
      const fadeStep = 13; //60 fades per second?
      for (let i = 0; i < fadeMs; i += fadeStep) {
        const maxVolume = getVolume(SoundType.MUSIC);
        sound.volume = maxVolume - normalizeClamp(i, 0, fadeMs, 0, maxVolume);
        await timeoutPromise(fadeStep);
      }
      sound.pause();
      sound.volume = getVolume(SoundType.MUSIC);
    } else {
      sound.pause();
    }
  } else {
    console.log('stopMusic: Music is not playing:', musicName);
  }
};

export const stopCurrentMusic = async (fadeMs?: number) => {
  for (const i in musicSoundObjects) {
    const soundObject = musicSoundObjects[i];
    const sound = soundObject.nodes[0];
    if (!sound.paused) {
      stopMusic(i, fadeMs);
    }
  }
};

export const playSoundName = ((window as any).playSoundName = (
  soundName: string,
  volume?: number
) => {
  const soundObj = getSound(soundName);
  if (soundObj) {
    // console.trace('sound:' + soundName);
    playSound(soundObj, volume);
  }
});

export const stopSound = (soundObj: ISound) => {
  const sound = soundObj.nodes[soundObj.currentNodeIndex];
  sound.pause();
  sound.currentTime = 0;
};

export const setVolumeForActiveSounds = (n: number) => {
  activeSounds.forEach(soundObject => {
    const sound = soundObject.nodes[soundObject.currentNodeIndex];
    sound.volume = n;
  });
};

export const setVolumeForMusic = (n: number) => {
  for (const i in musicSoundObjects) {
    const soundObject = musicSoundObjects[i];
    const sound = soundObject.nodes[soundObject.currentNodeIndex];
    sound.volume = n;
  }
};
