import { getVolume, setVolume } from 'model/generics';
import { SoundType } from 'model/sound';

const APP_LS_PREFIX = 'regem_ludos_';
const APP_SETTINGS_KEY = 'settings';
const APP_SAVE_KEY = 'save_';

interface ISaveSettings {
  volumeLevels: {
    [SoundType.NORMAL]: number;
    [SoundType.MUSIC]: number;
  };
}

enum LocalStorageKeyType {
  SETTINGS,
  SAVE,
}

export const getCurrentSettings = (): ISaveSettings => {
  const settings: ISaveSettings = {
    volumeLevels: {
      [SoundType.NORMAL]: getVolume(SoundType.NORMAL),
      [SoundType.MUSIC]: getVolume(SoundType.MUSIC),
    },
  };
  return settings;
};

export const setCurrentSettings = (settings: ISaveSettings) => {
  setVolume(SoundType.NORMAL, settings.volumeLevels[SoundType.NORMAL]);
  setVolume(SoundType.MUSIC, settings.volumeLevels[SoundType.MUSIC]);
};

const getLSKey = (type: LocalStorageKeyType, optional?: string) => {
  return `${APP_LS_PREFIX}_${
    type === LocalStorageKeyType.SETTINGS
      ? APP_SETTINGS_KEY
      : APP_SAVE_KEY + (optional || '')
  }`;
};

export const saveSettingsToLS = (settings: ISaveSettings) => {
  try {
    localStorage.setItem(
      getLSKey(LocalStorageKeyType.SETTINGS),
      JSON.stringify(settings)
    );
  } catch (e) {
    console.error(e);
    throw new Error(`Unable to saveSettingsToLS.`);
  }
};

export const loadSettingsFromLS = (): ISaveSettings => {
  const settingsString = localStorage.getItem(
    getLSKey(LocalStorageKeyType.SETTINGS)
  );
  if (!settingsString) {
    throw new Error(`Unable to loadSettingsFromLS, no settings were found.`);
  }
  try {
    const settingsJson = JSON.parse(settingsString);
    const settings: ISaveSettings = {
      volumeLevels: {
        [SoundType.NORMAL]: settingsJson?.volumeLevels?.[SoundType.NORMAL] ?? 1,
        [SoundType.MUSIC]: settingsJson?.volumeLevels?.[SoundType.MUSIC] ?? 1,
      },
    };
    return settings;
  } catch (e) {
    console.error(e);
    throw new Error(
      `Unable to loadSettingsFromLS, malformed JSON in localStorage item.`
    );
  }
};
