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
    leaderboards: {},
    stores: {},
  };

  exp.tutorial1 = {
    id: 'q86qvj2uv',
    debug: true,
    timestampSaved: '2021-11-29T20:52:23.152Z',
    timestampLoaded: '2021-11-29T20:52:02.725Z',
    durationPlayed: 40854,
    overworld: {
      name: 'floor1Atrium',
    },
    questsUpdated: ['OpeningQuest', 'Tutorial'],
    scene: {
      storage: {
        'quest_floor1-main': true,
        current_overworld: 'floor1Atrium',
        quest_tutorial: true,
        'quest_floor1-atrium_acquire-haptic-bracer': true,
        'floor1-atrium-desk-employee': true,
      },
      storageOnce: {},
      storageOnceKeys: {
        '1632453': true,
      },
      storageEncounters: {},
      storageTreasure: {},
    },
    player: {
      tokens: 109,
      tickets: 99,
      backpack: ['HapticBracer'],
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
            STAGGER: 15,
            HP: 50,
            RESV: 10,
          },
          hp: 50,
          resv: 10,
          x: 434.492947569948,
          y: 62.97942610275762,
          z: 0,
          name: 'Ada',
          facing: 'left_f',
          experience: 2,
          experienceCurrency: 10,
          equipment: {
            weapon: -1,
            accessory1: -1,
            accessory2: -1,
            armor: -1,
          },
        },
        {
          stats: {
            POW: 5,
            ACC: 1,
            FOR: 1,
            CON: 1,
            RES: 1,
            SPD: 1,
            EVA: 1,
            STAGGER: 12,
            HP: 35,
            RESV: 10,
          },
          hp: 35,
          resv: 10,
          x: 0,
          y: 0,
          z: 0,
          name: 'Conscience',
          facing: 'down',
          experience: 2,
          experienceCurrency: 10,
          equipment: {
            weapon: 1,
            accessory1: -1,
            accessory2: -1,
            armor: -1,
          },
        },
      ],
      party: [0, 1],
      battlePositions: [0, 1],
    },
    leaderboards: {
      elasticity: [
        {
          playerName: 'CarlArnold',
          playerLabel: 'CarlArnold',
          score: 13665,
        },
        {
          playerLabel: 'Latinature',
          score: 12905,
        },
        {
          playerLabel: 'Wannatt',
          score: 12146,
        },
        {
          playerLabel: 'Annonbok',
          score: 11387,
        },
        {
          playerLabel: 'Wannatt',
          score: 10628,
        },
        {
          playerLabel: 'Tutorksit',
          score: 9869,
        },
        {
          playerLabel: 'Wannatt',
          score: 9110,
        },
        {
          playerLabel: 'WeirdChampion',
          score: 8350,
        },
        {
          playerLabel: 'Tutorksit',
          score: 7591,
        },
        {
          playerLabel: 'Larvinglo',
          score: 6832,
        },
      ],
      vortex: [
        {
          playerName: 'CarlArnold',
          playerLabel: 'CarlArnold',
          score: 152598,
        },
        {
          playerLabel: 'BauerXb',
          score: 144120,
        },
        {
          playerLabel: 'Teamback',
          score: 135642,
        },
        {
          playerLabel: 'Latinature',
          score: 127165,
        },
        {
          playerLabel: 'BauerXb',
          score: 118687,
        },
        {
          playerLabel: 'Berglimis',
          score: 110209,
        },
        {
          playerLabel: 'QuoteAnguris',
          score: 101732,
        },
        {
          playerLabel: 'Vocatee',
          score: 93254,
        },
        {
          playerLabel: 'Moress',
          score: 84776,
        },
        {
          playerLabel: 'Vocatee',
          score: 76299,
        },
      ],
      zag: [
        {
          playerName: 'CarlArnold',
          playerLabel: 'CarlArnold',
          score: 42809,
        },
        {
          playerLabel: 'Taldene',
          score: 40430,
        },
        {
          playerLabel: 'Teamback',
          score: 38052,
        },
        {
          playerLabel: 'Larvinglo',
          score: 35674,
        },
        {
          playerLabel: 'Latinature',
          score: 33295,
        },
        {
          playerLabel: 'Taldene',
          score: 30917,
        },
        {
          playerLabel: 'Variowain',
          score: 28539,
        },
        {
          playerLabel: 'Steinetit',
          score: 26161,
        },
        {
          playerLabel: 'Berglimis',
          score: 23782,
        },
        {
          playerLabel: 'Variowain',
          score: 21404,
        },
      ],
      invaderz: [
        {
          playerName: 'CarlArnold',
          playerLabel: 'CarlArnold',
          score: 3015,
        },
        {
          playerLabel: 'PoshyHerald',
          score: 2847,
        },
        {
          playerLabel: 'Latinature',
          score: 2680,
        },
        {
          playerLabel: 'Moress',
          score: 2512,
        },
        {
          playerLabel: 'Taldene',
          score: 2345,
        },
        {
          playerLabel: 'SaberMagic',
          score: 2177,
        },
        {
          playerLabel: 'Latinature',
          score: 2010,
        },
        {
          playerLabel: 'Bondurain',
          score: 1842,
        },
        {
          playerLabel: 'Vocatee',
          score: 1675,
        },
        {
          playerLabel: 'Vintagentca',
          score: 1507,
        },
      ],
    },
    stores: {},
  };

  exp.tutorial2 = {
    id: 't08cx0g66',
    debug: true,
    timestampSaved: '2021-11-30T16:30:13.405Z',
    timestampLoaded: '2021-11-30T16:28:15.550Z',
    durationPlayed: 276564,
    overworld: {
      name: 'floor1TutVR1',
    },
    questsUpdated: ['OpeningQuest', 'Tutorial'],
    scene: {
      storage: {
        'quest_floor1-main': true,
        current_overworld: 'floor1TutVR1',
        quest_tutorial: true,
        'quest_floor1-atrium_acquire-haptic-bracer': true,
        'floor1-atrium-desk-employee': true,
        quest_tutorial_active: true,
        roomName: 'floor1TutEntrance',
        'quest_tutorial-0': true,
        'floor1-atrium-employee-jason': true,
        'floor1-tut-entrance-vr-portal': true,
      },
      storageOnce: {},
      storageOnceKeys: {
        '1632453': true,
        a567dae3: true,
        'floor1-tut-entrance-vr-portal-action2-once': true,
      },
      storageEncounters: {},
      storageTreasure: {},
    },
    player: {
      tokens: 109,
      tickets: 99,
      backpack: ['HapticBracer'],
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
            STAGGER: 15,
            HP: 50,
            RESV: 10,
          },
          hp: 50,
          resv: 10,
          x: 167.8605748058471,
          y: 173.3232217091791,
          z: 0,
          name: 'Ada',
          facing: 'leftup_f',
          experience: 2,
          experienceCurrency: 10,
          equipment: {
            weapon: -1,
            accessory1: -1,
            accessory2: -1,
            armor: -1,
          },
        },
        {
          stats: {
            POW: 5,
            ACC: 1,
            FOR: 1,
            CON: 1,
            RES: 1,
            SPD: 1,
            EVA: 1,
            STAGGER: 12,
            HP: 35,
            RESV: 10,
          },
          hp: 35,
          resv: 10,
          x: 0,
          y: 0,
          z: 0,
          name: 'Conscience',
          facing: 'down',
          experience: 2,
          experienceCurrency: 10,
          equipment: {
            weapon: -1,
            accessory1: -1,
            accessory2: -1,
            armor: -1,
          },
        },
      ],
      party: [0, 1],
      battlePositions: [0, 1],
    },
    leaderboards: {
      elasticity: [
        {
          playerName: 'CarlArnold',
          playerLabel: 'CarlArnold',
          score: 13665,
        },
        {
          playerLabel: 'Latinature',
          score: 12905,
        },
        {
          playerLabel: 'Wannatt',
          score: 12146,
        },
        {
          playerLabel: 'Annonbok',
          score: 11387,
        },
        {
          playerLabel: 'Wannatt',
          score: 10628,
        },
        {
          playerLabel: 'Tutorksit',
          score: 9869,
        },
        {
          playerLabel: 'Wannatt',
          score: 9110,
        },
        {
          playerLabel: 'WeirdChampion',
          score: 8350,
        },
        {
          playerLabel: 'Tutorksit',
          score: 7591,
        },
        {
          playerLabel: 'Larvinglo',
          score: 6832,
        },
      ],
      vortex: [
        {
          playerName: 'CarlArnold',
          playerLabel: 'CarlArnold',
          score: 152598,
        },
        {
          playerLabel: 'BauerXb',
          score: 144120,
        },
        {
          playerLabel: 'Teamback',
          score: 135642,
        },
        {
          playerLabel: 'Latinature',
          score: 127165,
        },
        {
          playerLabel: 'BauerXb',
          score: 118687,
        },
        {
          playerLabel: 'Berglimis',
          score: 110209,
        },
        {
          playerLabel: 'QuoteAnguris',
          score: 101732,
        },
        {
          playerLabel: 'Vocatee',
          score: 93254,
        },
        {
          playerLabel: 'Moress',
          score: 84776,
        },
        {
          playerLabel: 'Vocatee',
          score: 76299,
        },
      ],
      zag: [
        {
          playerName: 'CarlArnold',
          playerLabel: 'CarlArnold',
          score: 42809,
        },
        {
          playerLabel: 'Taldene',
          score: 40430,
        },
        {
          playerLabel: 'Teamback',
          score: 38052,
        },
        {
          playerLabel: 'Larvinglo',
          score: 35674,
        },
        {
          playerLabel: 'Latinature',
          score: 33295,
        },
        {
          playerLabel: 'Taldene',
          score: 30917,
        },
        {
          playerLabel: 'Variowain',
          score: 28539,
        },
        {
          playerLabel: 'Steinetit',
          score: 26161,
        },
        {
          playerLabel: 'Berglimis',
          score: 23782,
        },
        {
          playerLabel: 'Variowain',
          score: 21404,
        },
      ],
      invaderz: [
        {
          playerName: 'CarlArnold',
          playerLabel: 'CarlArnold',
          score: 3015,
        },
        {
          playerLabel: 'PoshyHerald',
          score: 2847,
        },
        {
          playerLabel: 'Latinature',
          score: 2680,
        },
        {
          playerLabel: 'Moress',
          score: 2512,
        },
        {
          playerLabel: 'Taldene',
          score: 2345,
        },
        {
          playerLabel: 'SaberMagic',
          score: 2177,
        },
        {
          playerLabel: 'Latinature',
          score: 2010,
        },
        {
          playerLabel: 'Bondurain',
          score: 1842,
        },
        {
          playerLabel: 'Vocatee',
          score: 1675,
        },
        {
          playerLabel: 'Vintagentca',
          score: 1507,
        },
      ],
    },
    stores: {},
  };

  exp.tutorial3 = {
    id: '94f2qzc7o',
    debug: true,
    timestampSaved: '2021-11-30T18:28:58.650Z',
    timestampLoaded: '2021-11-30T18:26:17.060Z',
    durationPlayed: 599744,
    overworld: {
      name: 'floor1TutVR2',
    },
    questsUpdated: ['OpeningQuest', 'Tutorial'],
    scene: {
      storage: {
        'quest_floor1-main': true,
        current_overworld: 'floor1TutVR2',
        quest_tutorial: true,
        'quest_floor1-atrium_acquire-haptic-bracer': true,
        'floor1-atrium-desk-employee': true,
        quest_tutorial_active: true,
        roomName: 'floor1TutEntrance',
        'quest_tutorial-0': true,
        'floor1-atrium-employee-jason': true,
        'floor1-tut-entrance-vr-portal': true,
        'floor1-tut-vr1-to-vr2': true,
        ARG0: [] as any,
      },
      storageOnce: {},
      storageOnceKeys: {
        '1632453': true,
        a567dae3: true,
        'floor1-tut-entrance-vr-portal-action2-once': true,
        'floor1-tut-vr1-to-vr21-once': true,
      },
      storageEncounters: {},
      storageTreasure: {},
    },
    player: {
      tokens: 109,
      tickets: 99,
      backpack: ['HapticBracer', 'TrainingSword', 'TrainingBow'],
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
            STAGGER: 15,
            HP: 50,
            RESV: 10,
          },
          hp: 50,
          resv: 10,
          x: 112.43040688317281,
          y: 210.02906186682566,
          z: 0,
          name: 'Ada',
          facing: 'left_f',
          experience: 4,
          experienceCurrency: 20,
          equipment: {
            weapon: 1,
            accessory1: -1,
            accessory2: -1,
            armor: -1,
          },
        },
        {
          stats: {
            POW: 5,
            ACC: 1,
            FOR: 1,
            CON: 1,
            RES: 1,
            SPD: 1,
            EVA: 1,
            STAGGER: 12,
            HP: 35,
            RESV: 10,
          },
          hp: 35,
          resv: 10,
          x: 0,
          y: 0,
          z: 0,
          name: 'Conscience',
          facing: 'down',
          experience: 2,
          experienceCurrency: 10,
          equipment: {
            weapon: 2,
            accessory1: -1,
            accessory2: -1,
            armor: -1,
          },
        },
      ],
      party: [0, 1],
      battlePositions: [0, 1],
    },
    leaderboards: {
      elasticity: [
        {
          playerName: 'CarlArnold',
          playerLabel: 'CarlArnold',
          score: 13665,
        },
        {
          playerLabel: 'Latinature',
          score: 12905,
        },
        {
          playerLabel: 'Wannatt',
          score: 12146,
        },
        {
          playerLabel: 'Annonbok',
          score: 11387,
        },
        {
          playerLabel: 'Wannatt',
          score: 10628,
        },
        {
          playerLabel: 'Tutorksit',
          score: 9869,
        },
        {
          playerLabel: 'Wannatt',
          score: 9110,
        },
        {
          playerLabel: 'WeirdChampion',
          score: 8350,
        },
        {
          playerLabel: 'Tutorksit',
          score: 7591,
        },
        {
          playerLabel: 'Larvinglo',
          score: 6832,
        },
      ],
      vortex: [
        {
          playerName: 'CarlArnold',
          playerLabel: 'CarlArnold',
          score: 152598,
        },
        {
          playerLabel: 'BauerXb',
          score: 144120,
        },
        {
          playerLabel: 'Teamback',
          score: 135642,
        },
        {
          playerLabel: 'Latinature',
          score: 127165,
        },
        {
          playerLabel: 'BauerXb',
          score: 118687,
        },
        {
          playerLabel: 'Berglimis',
          score: 110209,
        },
        {
          playerLabel: 'QuoteAnguris',
          score: 101732,
        },
        {
          playerLabel: 'Vocatee',
          score: 93254,
        },
        {
          playerLabel: 'Moress',
          score: 84776,
        },
        {
          playerLabel: 'Vocatee',
          score: 76299,
        },
      ],
      zag: [
        {
          playerName: 'CarlArnold',
          playerLabel: 'CarlArnold',
          score: 42809,
        },
        {
          playerLabel: 'Taldene',
          score: 40430,
        },
        {
          playerLabel: 'Teamback',
          score: 38052,
        },
        {
          playerLabel: 'Larvinglo',
          score: 35674,
        },
        {
          playerLabel: 'Latinature',
          score: 33295,
        },
        {
          playerLabel: 'Taldene',
          score: 30917,
        },
        {
          playerLabel: 'Variowain',
          score: 28539,
        },
        {
          playerLabel: 'Steinetit',
          score: 26161,
        },
        {
          playerLabel: 'Berglimis',
          score: 23782,
        },
        {
          playerLabel: 'Variowain',
          score: 21404,
        },
      ],
      invaderz: [
        {
          playerName: 'CarlArnold',
          playerLabel: 'CarlArnold',
          score: 3015,
        },
        {
          playerLabel: 'PoshyHerald',
          score: 2847,
        },
        {
          playerLabel: 'Latinature',
          score: 2680,
        },
        {
          playerLabel: 'Moress',
          score: 2512,
        },
        {
          playerLabel: 'Taldene',
          score: 2345,
        },
        {
          playerLabel: 'SaberMagic',
          score: 2177,
        },
        {
          playerLabel: 'Latinature',
          score: 2010,
        },
        {
          playerLabel: 'Bondurain',
          score: 1842,
        },
        {
          playerLabel: 'Vocatee',
          score: 1675,
        },
        {
          playerLabel: 'Vintagentca',
          score: 1507,
        },
      ],
    },
    stores: {},
  };

  exp.tutorial4 = {
    id: '72b765t4b',
    debug: true,
    timestampSaved: '2021-11-30T22:13:07.190Z',
    timestampLoaded: '2021-11-30T22:11:32.960Z',
    durationPlayed: 788204,
    overworld: {
      name: 'floor1TutVR2',
    },
    questsUpdated: ['OpeningQuest', 'Tutorial'],
    scene: {
      storage: {
        'quest_floor1-main': true,
        current_overworld: 'floor1TutVR2',
        quest_tutorial: true,
        'quest_floor1-atrium_acquire-haptic-bracer': true,
        'floor1-atrium-desk-employee': true,
        quest_tutorial_active: true,
        roomName: 'floor1TutEntrance',
        'quest_tutorial-0': true,
        'floor1-atrium-employee-jason': true,
        'floor1-tut-entrance-vr-portal': true,
        'floor1-tut-vr1-to-vr2': true,
        'floor1-tut-vr2-facedown-jason': true,
        'floor1-tut-vr2-battle2-area': true,
        ARG0: [] as any,
      },
      storageOnce: {},
      storageOnceKeys: {
        '1632453': true,
        '2000000000': true,
        a567dae3: true,
        'floor1-tut-entrance-vr-portal-action2-once': true,
        'floor1-tut-vr1-to-vr21-once': true,
        df922503: true,
      },
      storageEncounters: {},
      storageTreasure: {},
    },
    player: {
      tokens: 109,
      tickets: 99,
      backpack: [
        'HapticBracer',
        'TrainingSword',
        'TrainingBow',
        'DilutedPotion',
        'DilutedAcidicCompound',
      ],
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
            STAGGER: 15,
            HP: 50,
            RESV: 10,
          },
          hp: 50,
          resv: 10,
          x: 216.70615446913902,
          y: 77.61093268292079,
          z: 0,
          name: 'Ada',
          facing: 'left_f',
          experience: 8,
          experienceCurrency: 30,
          equipment: {
            weapon: 1,
            accessory1: -1,
            accessory2: -1,
            armor: -1,
          },
        },
        {
          stats: {
            POW: 5,
            ACC: 1,
            FOR: 1,
            CON: 1,
            RES: 1,
            SPD: 1,
            EVA: 1,
            STAGGER: 12,
            HP: 35,
            RESV: 10,
          },
          hp: 35,
          resv: 10,
          x: 128,
          y: 159,
          z: 0,
          name: 'Conscience',
          facing: 'left_f',
          experience: 6,
          experienceCurrency: 20,
          equipment: {
            weapon: 2,
            accessory1: -1,
            accessory2: -1,
            armor: -1,
          },
        },
      ],
      party: [0, 1],
      battlePositions: [0, 1],
    },
    leaderboards: {
      elasticity: [
        {
          playerName: 'CarlArnold',
          playerLabel: 'CarlArnold',
          score: 13665,
        },
        {
          playerLabel: 'Latinature',
          score: 12905,
        },
        {
          playerLabel: 'Wannatt',
          score: 12146,
        },
        {
          playerLabel: 'Annonbok',
          score: 11387,
        },
        {
          playerLabel: 'Wannatt',
          score: 10628,
        },
        {
          playerLabel: 'Tutorksit',
          score: 9869,
        },
        {
          playerLabel: 'Wannatt',
          score: 9110,
        },
        {
          playerLabel: 'WeirdChampion',
          score: 8350,
        },
        {
          playerLabel: 'Tutorksit',
          score: 7591,
        },
        {
          playerLabel: 'Larvinglo',
          score: 6832,
        },
      ],
      vortex: [
        {
          playerName: 'CarlArnold',
          playerLabel: 'CarlArnold',
          score: 152598,
        },
        {
          playerLabel: 'BauerXb',
          score: 144120,
        },
        {
          playerLabel: 'Teamback',
          score: 135642,
        },
        {
          playerLabel: 'Latinature',
          score: 127165,
        },
        {
          playerLabel: 'BauerXb',
          score: 118687,
        },
        {
          playerLabel: 'Berglimis',
          score: 110209,
        },
        {
          playerLabel: 'QuoteAnguris',
          score: 101732,
        },
        {
          playerLabel: 'Vocatee',
          score: 93254,
        },
        {
          playerLabel: 'Moress',
          score: 84776,
        },
        {
          playerLabel: 'Vocatee',
          score: 76299,
        },
      ],
      zag: [
        {
          playerName: 'CarlArnold',
          playerLabel: 'CarlArnold',
          score: 42809,
        },
        {
          playerLabel: 'Taldene',
          score: 40430,
        },
        {
          playerLabel: 'Teamback',
          score: 38052,
        },
        {
          playerLabel: 'Larvinglo',
          score: 35674,
        },
        {
          playerLabel: 'Latinature',
          score: 33295,
        },
        {
          playerLabel: 'Taldene',
          score: 30917,
        },
        {
          playerLabel: 'Variowain',
          score: 28539,
        },
        {
          playerLabel: 'Steinetit',
          score: 26161,
        },
        {
          playerLabel: 'Berglimis',
          score: 23782,
        },
        {
          playerLabel: 'Variowain',
          score: 21404,
        },
      ],
      invaderz: [
        {
          playerName: 'CarlArnold',
          playerLabel: 'CarlArnold',
          score: 3015,
        },
        {
          playerLabel: 'PoshyHerald',
          score: 2847,
        },
        {
          playerLabel: 'Latinature',
          score: 2680,
        },
        {
          playerLabel: 'Moress',
          score: 2512,
        },
        {
          playerLabel: 'Taldene',
          score: 2345,
        },
        {
          playerLabel: 'SaberMagic',
          score: 2177,
        },
        {
          playerLabel: 'Latinature',
          score: 2010,
        },
        {
          playerLabel: 'Bondurain',
          score: 1842,
        },
        {
          playerLabel: 'Vocatee',
          score: 1675,
        },
        {
          playerLabel: 'Vintagentca',
          score: 1507,
        },
      ],
    },
    stores: {},
  };
};
