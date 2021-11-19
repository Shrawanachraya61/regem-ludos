import { ISave } from 'controller/save-management';
import { Facing } from 'model/character';

const exp = {} as Record<string, ISave>;

export const get = (key: string): ISave => {
  const result = exp[key];
  if (!result) {
    throw new Error(`No save exists with name: ${key}`);
  }
  return {
    ...result,
  };
};

export const getIfExists = (key: string): ISave | null => {
  const result = exp[key];
  if (!result) {
    return null;
  }
  return {
    ...result,
  };
};

export const init = () => {
  exp.bowling = {
    id: 'O6vt5dsvr',
    debug: false,
    timestampSaved: new Date(),
    timestampLoaded: new Date(),
    durationPlayed: 0,
    overworld: {
      name: 'bowlingAlleyStandalone',
    },
    scene: {
      storage: {
        current_overworld: 'bowlingAlleyStandalone',
      },
      storageOnce: {},
      storageOnceKeys: {},
      storageEncounters: {},
      storageTreasure: {},
    },
    player: {
      tokens: 0,
      tickets: 0,
      backpack: [],
      leader: 0,
      partyStorage: [
        {
          stats: {
            POW: 5,
            ACC: 1,
            FOR: 1,
            CON: 1,
            RES: 1,
            SPD: 1,
            EVA: 1,
            STAGGER: 10,
            HP: 50,
            RESV: 10,
          },
          hp: 50,
          resv: 10,
          x: 295,
          y: 126,
          z: 0,
          name: 'Ada',
          facing: Facing.DOWN,
          experience: 2,
          experienceCurrency: 0,
          equipment: {
            weapon: -1,
            accessory1: -1,
            accessory2: -1,
            armor: -1,
          },
        },
      ],
      party: [0],
      battlePositions: [0],
    },
    highScores: {
      ticTacToe: 0,
      invaderz: 0,
      elasticity: 0,
      vortex: 0,
      golems: 0,
      president: 0,
    },
    stores: {},
  };
};
