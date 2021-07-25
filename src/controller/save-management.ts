import {
  getArcadeGameVolume,
  getCurrentOverworld,
  getCurrentPlayer,
  getCurrentScene,
  getDurationPlayed,
  getTimeLoaded,
  getVolume,
  isArcadeGameMuted,
  setArcadeGameMuted,
  setArcadeGameVolume,
  setDurationPlayed,
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
  Facing,
} from 'model/character';
import { BattleStats } from 'model/battle';
import { initiateOverworld } from './overworld-management';

const APP_LS_PREFIX = 'regem_ludos_';
const APP_SETTINGS_KEY = 'settings';
const APP_SAVE_KEY = 'save_';

interface ISaveSettings {
  volumeLevels: {
    [SoundType.NORMAL]: number;
    [SoundType.MUSIC]: number;
    arcadeGame: number;
  };
  arcadeGameMuted: boolean;
}

export interface ISave {
  id: string;
  timestampSaved: Date;
  timestampLoaded: Date;
  durationPlayed: number;
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
  highScores: {
    ticTacToe: number;
    invaderz: number;
    elasticity: number;
    vortex: number;
    golems: number;
    president: number;
  };
}

interface ICharacterSave {
  stats: BattleStats;
  hp: number;
  resv: number;
  x: number;
  y: number;
  z: number;
  name: string;
  facing: Facing;
  experience: number;
  experienceCurrency: number;
  equipment: {
    weapon: number;
    accessory1: number;
    accessory2: number;
    armor: number;
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
      arcadeGame: getArcadeGameVolume(),
    },
    arcadeGameMuted: isArcadeGameMuted(),
  };
  return settings;
};

export const setCurrentSettings = (settings: ISaveSettings) => {
  setVolume(SoundType.NORMAL, settings.volumeLevels[SoundType.NORMAL]);
  setVolume(SoundType.MUSIC, settings.volumeLevels[SoundType.MUSIC]);
  setArcadeGameVolume(settings.volumeLevels.arcadeGame);
  setArcadeGameMuted(settings.arcadeGameMuted);
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
          overworld: {
            name: save.overworld.name ?? '',
          },
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
          highScores: {
            ticTacToe: save?.highScores?.ticTacToe ?? 0,
            invaderz: save?.highScores?.invaderz ?? 0,
            elasticity: save?.highScores?.elasticity ?? 0,
            vortex: save?.highScores?.vortex ?? 0,
            golems: save?.highScores?.golems ?? 0,
            president: save?.highScores?.president ?? 0,
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
    timestampLoaded: params.lastTimestampLoaded,
    durationPlayed:
      params.durationPlayed + +new Date() - +params.lastTimestampLoaded,
    overworld: {
      name: getCurrentOverworld().name,
    },
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
    highScores: {
      ticTacToe: 0,
      invaderz: 0,
      elasticity: 0,
      vortex: 0,
      golems: 0,
      president: 0,
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
      durationPlayed: getDurationPlayed(),
      lastTimestampLoaded: new Date(getTimeLoaded()),
    });
    console.log('CREATE SAVE', save);
    saveList.push(save);
  } else {
    const oldSave = saveList[saveIndex];
    console.log('CREATE SAVE2', oldSave);
    const save = createSave({
      saveId: oldSave.id,
      durationPlayed: getDurationPlayed(),
      lastTimestampLoaded: new Date(getTimeLoaded()),
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
  scene.storageTreasure = {
    ...save.scene.storageTreasure,
  };
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

  characterSetFacing(ch, chSave.facing);

  return ch;
};
