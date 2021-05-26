import {
  BattleTemplate,
  BattlePosition,
  BattleStats,
  Battle,
  battleIsVictory,
  battleUnsubscribeEvent,
  BattleEvent,
  battleSubscribeEvent,
} from 'model/battle';
import { BATTLE_AI_ATTACK } from 'controller/battle-ai';
import { get as getEnemy } from 'db/enemies';
import { CharacterTemplate } from 'model/character';
import { callScriptDuringBattle } from 'controller/battle-management';
import { callScriptDuringOverworld } from 'controller/overworld-management';
import { getCurrentBattle } from 'model/generics';

import { init as initTutorialEncounters } from './tutorial-encounters';

import { varyStats } from 'utils';

const exp = {} as { [key: string]: BattleTemplate };
export const get = (key: string) => {
  const result = exp[key];
  if (!result) {
    throw new Error(`No encounter exists with name: ${key}`);
  }
  return result;
};

export const getIfExists = (key: string): BattleTemplate | null => {
  const result = exp[key];
  if (!result) {
    return null;
  }
  return {
    ...result,
  };
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

  exp.ENCOUNTER_TEST_EVENTS = {
    roomName: 'battleTut1',
    enemies: [
      {
        chTemplate: getEnemy('TUT_ROBOT_MELEE'),
        position: BattlePosition.FRONT,
        ai: BATTLE_AI_ATTACK,
      },
    ],
    events: {
      onBattleStart: async (battle: Battle) => {
        await callScriptDuringBattle('test-fight-event-start');
      },
      onBattleEnd: async (battle: Battle) => {
        if (battleIsVictory(battle)) {
          await callScriptDuringBattle('test-fight-event-end');
        }
      },
    },
  };

  exp.ENCOUNTER_TEST_MULTI_DEATH = {
    roomName: 'battleTut1',
    enemies: [
      {
        chTemplate: getEnemy('TUT_ROBOT_MELEE_REALLY_EASY'),
        position: BattlePosition.FRONT,
        ai: BATTLE_AI_ATTACK,
      },
      {
        chTemplate: getEnemy('TUT_ROBOT_MELEE_REALLY_EASY'),
        position: BattlePosition.FRONT,
        ai: BATTLE_AI_ATTACK,
      },
    ],
  };

  initTutorialEncounters(exp);

  // exp.ENCOUNTER_TUT1 = {

  // }
};

export default exp;
