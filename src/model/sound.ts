import { normalize, normalizeClamp, timeoutPromise } from 'utils';
import { getNow, getSoundEnabled, getVolume } from './generics';

const SOUND_PATH_PREFIX = 'res/snd';

const sounds: Record<string, ISoundLoaded> = ((window as any).sounds = {});
const musicSoundObjects: Record<string, ISound> = {};
const activeSounds: ISound[] = [];

export enum SoundType {
  NORMAL = 'normal',
  MUSIC = 'music',
}

interface ISoundLoaded {
  sound: HTMLAudioElement;
  audio: Node;
  soundDuration: number;
  soundType: SoundType;
  volumeModifier: number;
}

interface ISound extends ISoundLoaded {
  soundName: string;
  duration: number;
  lastStartTimestamp: number;
}

export const loadSound = async (
  name: string,
  url: string,
  type: SoundType,
  volumeModifier: number
) => {
  url = `${SOUND_PATH_PREFIX}/${url}`;
  return new Promise((resolve, reject) => {
    const sound = new Audio(url);
    sound.autoplay = false;
    const onLoad = () => {
      sound.oncanplay = null;
      sound.currentTime = 99999999999;
      const soundDuration = sound.currentTime;
      sound.currentTime = 0;
      sound.onended = function () {
        sound.pause();
        sound.currentTime = 0;
      };
      sounds[name] = {
        sound,
        audio: sound,
        soundDuration,
        soundType: type,
        volumeModifier,
      };
      // console.log('sound loaded', name, url);
      if (type === SoundType.MUSIC) {
        console.log('Adding music track', name, getSound(name));
        musicSoundObjects[name] = getSound(name) as ISound;
      }
      clearTimeout(timeoutId);
      resolve(sound);
    };
    sound.oncanplay = sound.onloadeddata = onLoad;
    const timeoutId = setTimeout(() => {
      console.error('Sound load timed out:', name, url);
      onLoad();
    }, 3000);

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
};

export const getSound = (soundName: string): ISound | null => {
  const soundObj = sounds[soundName];
  if (soundObj) {
    const s: ISound = {
      duration: 0,
      ...soundObj,
      //soundDuration merged in from soundObj
      audio: soundObj.audio.cloneNode(true),
      soundName,
      lastStartTimestamp: getNow(),
    };
    soundObj.sound.currentTime = 0;

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
  const { sound } = soundObj;
  // activeSounds.push(soundObj);
  sound.volume = volume * soundObj.volumeModifier;
  sound.play();
  // sound.onended = () => {
  //   const ind = activeSounds.indexOf(soundObj);
  //   if (ind > -1) {
  //     activeSounds.splice(ind, 1);
  //   }
  // };
  soundObj.lastStartTimestamp = getNow();
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
  music.sound.loop = loop;
  if (!music.sound.paused) {
    console.log('playMusic: Music is already playing:', musicName);
    return;
  }
  music.sound.currentTime = 0;

  playSound(music);
  fadeMs = fadeMs ?? 0;
  if (fadeMs > 0) {
    const fadeStep = 13; //60 fades per second?
    for (let i = 0; i < fadeMs; i += fadeStep) {
      const maxVolume = getVolume(SoundType.MUSIC);
      music.sound.volume = normalizeClamp(i, 0, fadeMs, 0, maxVolume);
      await timeoutPromise(fadeStep);
    }
    music.sound.volume = getVolume(SoundType.MUSIC);
  }
};

export const stopMusic = async (musicName: string, fadeMs?: number) => {
  const music = musicSoundObjects[musicName];
  if (!music) {
    console.error('stopMusic: Could not find music with name:', musicName);
    return;
  }
  if (!music.sound.paused) {
    fadeMs = fadeMs ?? 0;
    if (fadeMs > 0) {
      const fadeStep = 13; //60 fades per second?
      for (let i = 0; i < fadeMs; i += fadeStep) {
        const maxVolume = getVolume(SoundType.MUSIC);
        music.sound.volume =
          maxVolume - normalizeClamp(i, 0, fadeMs, 0, maxVolume);
        await timeoutPromise(fadeStep);
      }
      music.sound.pause();
      music.sound.volume = getVolume(SoundType.MUSIC);
    } else {
      music.sound.pause();
    }
  } else {
    console.log('stopMusic: Music is not playing:', musicName);
  }
};

export const stopCurrentMusic = async (fadeMs?: number) => {
  for (const i in musicSoundObjects) {
    const soundObject = musicSoundObjects[i];
    if (!soundObject.sound.paused) {
      stopMusic(i, fadeMs);
    }
  }
};

export const playSoundName = (soundName: string, volume?: number) => {
  const soundObj = getSound(soundName);
  if (soundObj) {
    playSound(soundObj, volume);
  }
};

export const stopSound = (soundObj: ISound) => {
  const { sound } = soundObj;
  sound.pause();
  sound.currentTime = 0;
};

export const setVolumeForActiveSounds = (n: number) => {
  activeSounds.forEach(soundObj => {
    soundObj.sound.volume = n;
  });
};

export const setVolumeForMusic = (n: number) => {
  for (const i in musicSoundObjects) {
    const soundObject = musicSoundObjects[i];
    soundObject.sound.volume = n;
  }
};
