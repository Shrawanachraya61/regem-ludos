import { BattleTemplate, BattlePosition, BattleStats } from 'model/battle';
import { BATTLE_AI_ATTACK } from 'controller/battle-ai';
import { get as getEnemy } from './enemies';
import { CharacterTemplate } from 'model/character';

export const varyStats = (chTemplate: CharacterTemplate): CharacterTemplate => {
  const stats = chTemplate.stats as BattleStats;
  const keys = Object.keys(stats);
  for (let i = 0; i < keys.length; i++) {
    const statName = keys[i];
    if (statName === 'STAGGER') {
      continue;
    }
    if (Math.random() > 0.5) {
      stats[statName]++;
      i--;
      continue;
    }
  }
  return chTemplate;
};

const exp = {} as { [key: string]: BattleTemplate };
export const get = (key: string) => {
  const result = exp[key];
  if (!result) {
    throw new Error(`No encounter exists with name: ${key}`);
  }
  return result;
};

export const init = () => {
  exp.ENCOUNTER_ONE_VS_ONE = {
    roomName: 'battle1',
    enemies: [
      {
        chTemplate: varyStats(getEnemy('ENEMY_GUY')),
        position: BattlePosition.FRONT,
        ai: BATTLE_AI_ATTACK,
      },
    ],
  };

  exp.ENCOUNTER_ONE_VS_TWO = {
    roomName: 'battle1',
    enemies: [
      {
        chTemplate: varyStats(getEnemy('ENEMY_GUY')),
        position: BattlePosition.FRONT,
        ai: BATTLE_AI_ATTACK,
      },
      {
        chTemplate: varyStats(getEnemy('ENEMY_GUY')),
        position: BattlePosition.FRONT,
        ai: BATTLE_AI_ATTACK,
      },
    ],
  };

  exp.ENCOUNTER_ONE_VS_THREE = {
    roomName: 'battle1',
    enemies: [
      {
        chTemplate: varyStats(getEnemy('ENEMY_GUY')),
        position: BattlePosition.FRONT,
        ai: BATTLE_AI_ATTACK,
      },
      {
        chTemplate: varyStats(getEnemy('ENEMY_GUY')),
        position: BattlePosition.FRONT,
        ai: BATTLE_AI_ATTACK,
      },
      {
        chTemplate: varyStats(getEnemy('ENEMY_GUY')),
        position: BattlePosition.MIDDLE,
        ai: BATTLE_AI_ATTACK,
      },
    ],
  };
};

export default exp;
