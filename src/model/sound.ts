import { getNow, getSoundEnabled } from './generics';

const SOUND_PATH = 'res/snd';

const sounds: Record<string, ISoundLoaded> = {};

interface ISoundLoaded {
  sound: HTMLAudioElement;
  audio: Node;
  soundDuration: number;
}

interface ISound extends ISoundLoaded {
  soundName: string;
  duration: number;
  isPlaying: boolean;
  isPaused: boolean;
  lastStartTimestamp: number;
}

export const loadSound = async (name: string, url: string) => {
  url = `${SOUND_PATH}/${url}`;
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
      };
      console.log('sound loaded', name, url);
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
      reject('Cannot load sound: name="' + name + '", url="' + url + '"');
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
      audio: soundObj.audio.cloneNode(),
      soundName,
      lastStartTimestamp: getNow(),
      isPlaying: false,
      isPaused: false,
    };

    return s;
  } else {
    console.error('Could not find sound with name: ', soundName);
    return null;
  }
};

export const playSound = (soundObj: ISound) => {
  if (!getSoundEnabled()) {
    return;
  }
  const { sound } = soundObj;
  sound.play();
  soundObj.lastStartTimestamp = getNow();
  soundObj.isPlaying = true;
};

export const playSoundName = (soundName: string) => {
  const soundObj = getSound(soundName);
  if (soundObj) {
    playSound(soundObj);
  }
};

export const stopSound = (soundObj: ISound) => {
  const { sound } = soundObj;
  sound.pause();
  sound.currentTime = 0;
  soundObj.isPlaying = false;
};
