import {
  getArcadeGameVolume,
  getCurrentOverworld,
  getCurrentPlayer,
  getCurrentScene,
  getCutsceneSpeedMultiplier,
  getDurationPlayed,
  getItemStores,
  getTimeLoaded,
  getVolume,
  isArcadeGameMuted,
  setArcadeGameMuted,
  setArcadeGameVolume,
  setCameraTransform,
  setCurrentPlayer,
  setCutsceneSpeedMultiplier,
  setDebugModeEnabled,
  setDurationPlayed,
  setItemStores,
  setTimeLoaded,
  setVolume,
} from 'model/generics';
import { SoundType } from 'model/sound';
import { randomId } from 'utils';
import { getIfExists as getItem, Item } from 'db/items';
import { getIfExists as getCharacter } from 'db/characters';
import { getIfExists as getOverworld } from 'db/overworlds';
import {
  Character,
  characterCreateFromTemplate,
  characterEquipItem,
  characterGetPos,
  characterSetFacing,
  CharacterTemplate,
  Facing,
} from 'model/character';
import { BattleStats } from 'model/battle';
import {
  enableOverworldControl,
  initiateOverworld,
} from './overworld-management';
import { playerCreateNew } from 'model/player';
import { runMainLoop, unpause } from './loop';
import { renderUi } from 'view/ui';
import { showSection } from './ui-actions';
import { AppSection } from 'model/store';
import { getLastUpdatedQuests, resetLastUpdatedQuests } from 'model/quest';
import { getScores, ILeaderboardEntry, setLeaderboard } from 'model/scores';

const APP_LS_PREFIX = 'regem_ludos';
const APP_SETTINGS_KEY = 'settings';
const APP_SAVE_KEY = 'save';

interface ISaveSettings {
  volumeLevels: {
    [SoundType.NORMAL]: number;
    [SoundType.MUSIC]: number;
    arcadeGame: number;
  };
  arcadeGameMuted: boolean;
  cutsceneSpeed: number;
}

export interface ISave {
  id: string;
  timestampSaved: Date | string;
  timestampLoaded: Date | string;
  durationPlayed: number;
  debug: boolean;
  questsUpdated?: string[];
  overworld: {
    name: string;
  };
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
    backpack: string[];
    leader: number;
    party: number[];
    battlePositions: number[];
    partyStorage: ICharacterSave[];
  };
  leaderboards: Record<string, ILeaderboardEntry[]>;
  stores: Record<string, IItemStoreSave>;
}

interface ICharacterSave {
  stats: BattleStats;
  hp: number;
  resv: number;
  x: number;
  y: number;
  z: number;
  name: string;
  facing: Facing | string;
  experience: number;
  experienceCurrency: number;
  equipment: {
    weapon: number;
    accessory1: number;
    accessory2: number;
    armor: number;
  };
}

export interface IItemStoreSave {
  name: string;
  items: {
    itemName: string;
    quantity: number;
  }[];
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
      arcadeGame: getArcadeGameVolume(),
    },
    arcadeGameMuted: isArcadeGameMuted(),
    cutsceneSpeed: getCutsceneSpeedMultiplier(),
  };
  return settings;
};

export const setCurrentSettings = (settings: ISaveSettings) => {
  setVolume(SoundType.NORMAL, settings.volumeLevels[SoundType.NORMAL]);
  setVolume(SoundType.MUSIC, settings.volumeLevels[SoundType.MUSIC]);
  setArcadeGameVolume(settings.volumeLevels.arcadeGame);
  setArcadeGameMuted(settings.arcadeGameMuted);
  setCutsceneSpeedMultiplier(settings.cutsceneSpeed);
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
        arcadeGame: settingsJson?.volumeLevels?.arcadeGame ?? 100,
      },
      arcadeGameMuted: settingsJson?.arcadeGameMuted ?? false,
      cutsceneSpeed: settingsJson?.cutsceneSpeed ?? 1,
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
          debug: save.debug ?? true,
          timestampSaved: new Date(save.timestampSaved),
          timestampLoaded: new Date(save.timestampLoaded),
          durationPlayed: save.durationPlayed,
          overworld: {
            name: save.overworld.name ?? '',
          },
          questsUpdated: save.questsUpdated ?? [],
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
            backpack: save.player.backpack ?? [],
            leader: save.player.leader ?? 0,
            party: save.player.party ?? [],
            battlePositions: save.player.battlePositions ?? [],
            partyStorage: save.player.partyStorage ?? [],
          },
          leaderboards: save?.leaderboards,
          stores: Object.assign({}, save?.stores ?? {}),
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

export const getMostRecentSave = (): ISave | null => {
  const saveList = loadSaveListFromLS();

  let retSave = saveList[0];

  for (let i = 1; i < saveList.length; i++) {
    const save = saveList[i];
    if (save.timestampSaved > retSave?.timestampSaved) {
      retSave = save;
    }
  }

  return retSave;
};

export const createSave = (params: {
  saveId: string;
  durationPlayed: number;
  lastTimestampLoaded: Date;
}): ISave => {
  const scene = getCurrentScene();
  const player = getCurrentPlayer();

  const scores = getScores();
  const leaderboards: Record<string, ILeaderboardEntry[]> = {};
  for (const i in scores) {
    leaderboards[i] = scores[i].leaderboard;
  }

  const save: ISave = {
    id: params.saveId,
    debug: true,
    timestampSaved: new Date(),
    timestampLoaded: params.lastTimestampLoaded,
    durationPlayed:
      params.durationPlayed + +new Date() - +params.lastTimestampLoaded,
    overworld: {
      name: getCurrentOverworld().name,
    },
    questsUpdated: getLastUpdatedQuests(),
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
      backpack: player.backpack.map(item => item.name ?? ''),
      leader: player.partyStorage.indexOf(player.leader),
      partyStorage: player.partyStorage.map(ch =>
        characterToICharacterSave(ch, player.backpack)
      ),
      party: player.party.map(ch => player.partyStorage.indexOf(ch)),
      battlePositions: player.battlePositions.map(ch =>
        player.partyStorage.indexOf(ch as Character)
      ),
    },
    leaderboards,
    stores: getItemStores(),
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

export const saveGame = (saveIndex = 0) => {
  const saveList = loadSaveListFromLS();
  if (saveIndex < 0) {
    saveIndex = 0;
  }
  let save: ISave | null = null;
  if (saveIndex >= saveList.length) {
    save = createSave({
      saveId: randomId(),
      durationPlayed: getDurationPlayed(),
      lastTimestampLoaded: new Date(getTimeLoaded()),
    });
    console.log('CREATE SAVE', save);
    saveList.push(save);
  } else {
    const oldSave = saveList[saveIndex];
    console.log('CREATE SAVE2', oldSave);
    save = createSave({
      saveId: oldSave.id,
      durationPlayed: getDurationPlayed(),
      lastTimestampLoaded: new Date(getTimeLoaded()),
    });
    saveList[saveIndex] = save;
  }
  saveSaveListToLS(saveList);
  return save;
};

(window as any).save = () => {
  const save = createSave({
    saveId: randomId(),
    durationPlayed: getDurationPlayed(),
    lastTimestampLoaded: new Date(getTimeLoaded()),
  });
  return save;
};

const loadGame = (save: ISave) => {
  console.log('LOAD GAME', save);
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
  scene.storageTreasure = {
    ...save.scene.storageTreasure,
  };

  resetLastUpdatedQuests(save.questsUpdated);

  setItemStores(save.stores ?? {});

  if (save.leaderboards) {
    for (const i in save.leaderboards) {
      setLeaderboard(i, save.leaderboards[i]);
    }
  }

  player.tokens = save.player.tokens;
  player.tickets = save.player.tickets;
  player.backpack = save.player.backpack
    .map(itemName => {
      const item = getItem(itemName);
      if (item) {
        return item;
      } else {
        console.error(
          'Failed to load item from save: ',
          itemName,
          'item is not in db.'
        );
        return null;
      }
    })
    .filter(item => !!item) as Item[];
  player.partyStorage = save.player.partyStorage.map(chSave =>
    iCharacterSaveToCharacter(chSave, player.backpack)
  );
  player.party = save.player.party.map(i => player.partyStorage[i]);
  player.battlePositions = save.player.battlePositions.map(
    i => player.partyStorage[i]
  );
  player.leader = player.partyStorage[save.player.leader];

  const pos = characterGetPos(player.leader);

  const overworldName = save.overworld.name;
  const overworldTemplate = getOverworld(overworldName);
  if (overworldTemplate) {
    initiateOverworld(player, overworldTemplate);
  } else {
    throw new Error(
      `Could not load save, overworld template not found in db: ${overworldName}`
    );
  }

  player.leader.x = pos[0];
  player.leader.y = pos[1];
  player.leader.z = pos[2];

  setTimeLoaded(+new Date());
  setDurationPlayed(save.durationPlayed);
  setDebugModeEnabled(save.debug ?? true);
};

export const loadSavedGame = async (save: ISave) => {
  const adaTemplate = getCharacter('Ada');
  const player = playerCreateNew(adaTemplate as CharacterTemplate);
  setCurrentPlayer(player);

  loadGame(save);

  enableOverworldControl();

  // wont run again if its already running
  runMainLoop();

  setCameraTransform(null);

  (document.getElementById('controls') as any).style.display = 'none';
  showSection(AppSection.Debug, true);

  unpause();
};

const characterToICharacterSave = (
  ch: Character,
  backpack: Item[]
): ICharacterSave => {
  return {
    stats: {
      POW: ch.stats.POW,
      ACC: ch.stats.ACC,
      FOR: ch.stats.FOR,
      CON: ch.stats.CON,
      RES: ch.stats.RES,
      SPD: ch.stats.SPD,
      EVA: ch.stats.EVA,
      STAGGER: ch.stats.STAGGER,
      HP: ch.stats.HP,
      RESV: ch.stats.RESV,
    },
    hp: ch.hp,
    resv: ch.resv,
    x: ch.x,
    y: ch.y,
    z: ch.z,
    name: ch.name,
    facing: ch.facing,
    experience: ch.experience,
    experienceCurrency: ch.experienceCurrency,
    equipment: {
      weapon: backpack.indexOf(ch.equipment.weapon as Item),
      accessory1: backpack.indexOf(ch.equipment.accessory1 as Item),
      accessory2: backpack.indexOf(ch.equipment.accessory2 as Item),
      armor: backpack.indexOf(ch.equipment.armor as Item),
    },
  };
};

const iCharacterSaveToCharacter = (
  chSave: ICharacterSave,
  backpack: Item[]
): Character => {
  const chTemplate = getCharacter(chSave.name);
  if (!chTemplate) {
    throw new Error(
      'Cannot transform saved character to character: "' +
        chSave.name +
        '" does not exist in db.'
    );
  }

  const ch = characterCreateFromTemplate(chTemplate);

  ch.stats = chSave.stats;
  ch.hp = chSave.hp;
  ch.resv = chSave.resv;
  ch.x = chSave.x;
  ch.y = chSave.y;
  ch.z = chSave.z;
  ch.experience = chSave.experience;
  ch.experienceCurrency = chSave.experienceCurrency;

  if (chSave.equipment.weapon >= 0) {
    const ind = chSave.equipment.weapon;
    const item = backpack[ind];
    if (item) {
      characterEquipItem(ch, item);
    } else {
      console.error(
        `Failed to equip weapon for ${ch.name} weaponInd=${ind}, index out of bounds`
      );
    }
  }
  if (chSave.equipment.accessory1 >= 0) {
    const ind = chSave.equipment.accessory1;
    const item = backpack[ind];
    if (item) {
      characterEquipItem(ch, item, 0);
    } else {
      console.error(
        `Failed to equip accessory1 for ${ch.name} accessory1=${ind}, index out of bounds`
      );
    }
  }
  if (chSave.equipment.accessory2 >= 0) {
    const ind = chSave.equipment.accessory2;
    const item = backpack[ind];
    if (item) {
      characterEquipItem(ch, item, 1);
    } else {
      console.error(
        `Failed to equip accessory2 for ${ch.name} accessory2=${ind}, index out of bounds`
      );
    }
  }
  if (chSave.equipment.armor >= 0) {
    const ind = chSave.equipment.armor;
    const item = backpack[ind];
    if (item) {
      characterEquipItem(ch, item);
    } else {
      console.error(
        `Failed to equip armor for ${ch.name} armor=${ind}, index out of bounds`
      );
    }
  }

  characterSetFacing(ch, chSave.facing as Facing);

  return ch;
};
