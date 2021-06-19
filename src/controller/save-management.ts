import {
  getCurrentPlayer,
  getCurrentScene,
  getVolume,
  setVolume,
} from 'model/generics';
import { SoundType } from 'model/sound';
import { randomId } from 'utils';

const APP_LS_PREFIX = 'regem_ludos_';
const APP_SETTINGS_KEY = 'settings';
const APP_SAVE_KEY = 'save_';

interface ISaveSettings {
  volumeLevels: {
    [SoundType.NORMAL]: number;
    [SoundType.MUSIC]: number;
  };
}

export interface ISave {
  id: string;
  timestampSaved: Date;
  timestampLoaded: Date;
  durationPlayed: number;
  scene: {
    storage: Record<string, string | boolean | number>;
    storageOnce: Record<string, string | boolean>;
    storageOnceKeys: Record<string, boolean>;
    storageEncounters: Record<string, Record<string, boolean>>;
    storageTreasure: Record<string, Record<string, boolean>>;
  };
  player: {
    tokens: number;
    tickets: number;
    // leader;
    // backpack: [];
    // party: [];
    // battlePositions: [];
    // partyStorage: [];
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

export const loadSaveListFromLS = (): ISave[] => {
  const settingsString = localStorage.getItem(
    getLSKey(LocalStorageKeyType.SAVE)
  );
  if (!settingsString) {
    return [];
  }
  try {
    const settingsJsonArray = JSON.parse(settingsString);
    const saves = settingsJsonArray.map(
      (save: any): ISave => {
        return {
          id: save.id,
          timestampSaved: new Date(save.timestampSaved),
          timestampLoaded: new Date(save.timestampLoaded),
          durationPlayed: save.durationPlayed,
          scene: {
            storage: save.scene.storage ?? {},
            storageOnce: save.scene.storageOnce ?? {},
            storageOnceKeys: save.scene.storageOnceKeys ?? {},
            storageEncounters: save.scene.storageEncounters ?? {},
            storageTreasure: save.scene.storageTreasure ?? {},
          },
          player: {
            tokens: save.player.tokens ?? 0,
            tickets: save.player.tickets ?? 0,
            // leader;
            // backpack: [];
            // party: [];
            // battlePositions: [];
            // partyStorage: [];
          },
        };
      }
    );
    return saves;
  } catch (e) {
    console.error('Malformed Save List in LS', e);
    return [];
  }
};

export const saveSaveListToLS = (saves: ISave[]) => {
  try {
    localStorage.setItem(
      getLSKey(LocalStorageKeyType.SAVE),
      JSON.stringify(saves)
    );
  } catch (e) {
    console.error(e);
    throw new Error(`Unable to saveSaveListToLS.`);
  }
};

export const createSave = (params: {
  saveId: string;
  durationPlayed: number;
  lastTimestampLoaded: Date;
}): ISave => {
  const scene = getCurrentScene();
  const player = getCurrentPlayer();

  const save: ISave = {
    id: params.saveId,
    timestampSaved: new Date(),
    timestampLoaded: new Date(),
    durationPlayed: params.durationPlayed,
    scene: {
      storage: scene.storage ?? {},
      storageOnce: scene.storageOnce ?? {},
      storageOnceKeys: scene.storageOnceKeys ?? {},
      storageEncounters: scene.storageEncounters ?? {},
      storageTreasure: scene.storageTreasure ?? {},
    },
    player: {
      tokens: player.tokens ?? 0,
      tickets: player.tickets ?? 0,
      // leader;
      // backpack: [];
      // party: [];
      // battlePositions: [];
      // partyStorage: [];
    },
  };

  const durationSinceLastSave = +new Date() - +params.lastTimestampLoaded;
  save.durationPlayed += durationSinceLastSave;

  return save;
};

export const deleteSave = (saveIndex: number) => {
  const saveList = loadSaveListFromLS();
  if (saveIndex < 0) {
    return;
  }
  if (saveIndex >= saveList.length) {
    return;
  } else {
    saveList.splice(saveIndex, 1);
    saveSaveListToLS(saveList);
  }
};

export const saveGame = (saveIndex: number) => {
  const saveList = loadSaveListFromLS();
  if (saveIndex < 0) {
    saveIndex = 0;
  }
  if (saveIndex >= saveList.length) {
    const save = createSave({
      saveId: randomId(),
      durationPlayed: 0,
      lastTimestampLoaded: new Date(),
    });
    saveList.push(save);
  } else {
    const oldSave = saveList[saveIndex];
    const save = createSave({
      saveId: randomId(),
      durationPlayed: oldSave.durationPlayed,
      lastTimestampLoaded: new Date(),
    });
    saveList[saveIndex] = save;
  }
  saveSaveListToLS(saveList);
};

export const loadGame = (save: ISave) => {
  const scene = getCurrentScene();
  const player = getCurrentPlayer();
  scene.storage = {
    ...save.scene.storage,
  };
  scene.storageOnce = {
    ...save.scene.storageOnce,
  };
  scene.storageOnceKeys = {
    ...save.scene.storageOnceKeys,
  };
  scene.storageEncounters = {
    ...save.scene.storageEncounters,
  };
  player.tokens = save.player.tokens;
  player.tickets = save.player.tickets;
};
