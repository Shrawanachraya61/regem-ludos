import { IHighScore, ILeaderboardEntry } from 'model/scores';
import { randInArr } from 'utils';

const names = [
  'Admantell',
  'BauerXb',
  'Bozerba',
  'Goldos',
  'Latinature',
  'Moress',
  'Ronziang',
  'Steinetit',
  'Tutorksit',
  'Vocatee',
  'Allureek',
  'Berglimis',
  'ByteDot',
  'Jocktrugi',
  'LifeIntincr',
  'PoshyHerald',
  'SaberMagic',
  'Teamback',
  'Variowain',
  'Wannatt',
  'Annonbok',
  'Bondurain',
  'FrogNewscast',
  'Larvinglo',
  'Lobellign',
  'QuoteAnguris',
  'SmoothSexy',
  'Taldene',
  'Vintagentca',
  'WeirdChampion',
];

const generateLeaderboard = (max: number, amount = 9): ILeaderboardEntry[] => {
  const ret: ILeaderboardEntry[] = [
    {
      playerName: 'CarlArnold',
      playerLabel: 'CarlArnold',
      score: max,
    },
  ];

  for (let i = 1; i <= amount; i++) {
    ret.push({
      playerLabel: randInArr(names),
      score: Math.floor((max * (amount - i / 2)) / amount),
    });
  }

  return ret;
};
let GAMES: Record<string, IHighScore> = {};

export const get = () => {
  return GAMES;
};

export const init = () => {
  GAMES = {
    elasticity: {
      gameName: 'elasticity',
      gameLabel: 'Elasticity',
      payout: {
        max: {
          threshold: 10000,
          tickets: 10,
        },
        med: {
          threshold: 7500,
          tickets: 5,
        },
        min: {
          threshold: 0,
          tickets: 1,
        },
      },
      leaderboard: generateLeaderboard(13665),
    },
    vortex: {
      gameName: 'vortex',
      gameLabel: 'Vortex',
      payout: {
        max: {
          threshold: 10000,
          tickets: 10,
        },
        med: {
          threshold: 7500,
          tickets: 5,
        },
        min: {
          threshold: 0,
          tickets: 1,
        },
      },
      leaderboard: generateLeaderboard(152598),
    },
    zag: {
      gameName: 'zag',
      gameLabel: 'Zag',
      payout: {
        max: {
          threshold: 10000,
          tickets: 10,
        },
        med: {
          threshold: 7500,
          tickets: 5,
        },
        min: {
          threshold: 0,
          tickets: 1,
        },
      },
      leaderboard: generateLeaderboard(42809),
    },
    invaderz: {
      gameName: 'invaderz',
      gameLabel: 'Invaderz',
      payout: {
        max: {
          threshold: 10000,
          tickets: 10,
        },
        med: {
          threshold: 7500,
          tickets: 5,
        },
        min: {
          threshold: 0,
          tickets: 1,
        },
      },
      leaderboard: generateLeaderboard(3015),
    },
  };
};
