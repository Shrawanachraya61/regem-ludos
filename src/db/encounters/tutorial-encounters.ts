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
import { get as getEnemy } from 'db/enemies';
import { CharacterTemplate } from 'model/character';
import { callScriptDuringBattle } from 'controller/battle-management';
import { callScriptDuringOverworld } from 'controller/overworld-management';
import { getCurrentBattle } from 'model/generics';
import { get as getItem } from 'db/items';

import { varyStats } from 'utils';

export const init = (exp: Record<string, BattleTemplate>) => {
  exp.ENCOUNTER_TUT1 = {
    roomName: 'battleTut1',
    baseExperience: 1,
    baseTokens: 0,
    disableFlee: true,
    enemies: [
      {
        chTemplate: getEnemy('TUT_ROBOT_MELEE_EASY'),
        position: BattlePosition.FRONT,
        ai: 'BATTLE_AI_ATTACK',
      },
    ],
    events: {
      onBattleStart: async (battle: Battle) => {
        await callScriptDuringBattle('floor1-tut-vr2-battle1-on-start');
      },
      onAfterBattleEnded: async () => {
        await callScriptDuringOverworld('floor1-tut-vr2-battle1-on-after-end', {
          disableKeys: true,
          hideUi: true,
          setPlayerIdle: true,
        });
      },
    },
  };

  exp.ENCOUNTER_TUT1_5 = {
    roomName: 'battleTut1',
    baseExperience: 1,
    baseTokens: 0,
    disableFlee: true,
    enemies: [
      {
        chTemplate: getEnemy('TUT_ROBOT_MELEE_STAGGERABLE'),
        position: BattlePosition.FRONT,
        ai: 'BATTLE_AI_ATTACK',
      },
    ],
    events: {
      onBattleStart: async (battle: Battle) => {
        await callScriptDuringBattle('floor1-tut-vr2-battle1_5-on-start');
      },
      onAfterBattleEnded: async () => {
        await callScriptDuringOverworld(
          'floor1-tut-vr2-battle1_5-on-after-end',
          {
            disableKeys: true,
            hideUi: true,
            setPlayerIdle: true,
          }
        );
      },
    },
  };

  exp.ENCOUNTER_TUT2 = {
    roomName: 'battleTut1',
    baseExperience: 2,
    baseTokens: 0,
    disableFlee: true,
    enemies: [
      {
        chTemplate: varyStats(getEnemy('TUT_ROBOT_MELEE')),
        position: BattlePosition.FRONT,
        ai: 'BATTLE_AI_ATTACK',
      },
      {
        chTemplate: varyStats(getEnemy('TUT_ROBOT_MELEE_SPEEDY')),
        position: BattlePosition.BACK,
        ai: 'BATTLE_AI_ATTACK',
      },
    ],
    events: {
      onBattleStart: async (battle: Battle) => {
        await callScriptDuringBattle('floor1-tut-vr2-battle2-on-start');
      },
      onAfterBattleEnded: async () => {
        await callScriptDuringOverworld('floor1-tut-vr2-battle2-on-after-end', {
          disableKeys: true,
          hideUi: true,
          setPlayerIdle: true,
        });
      },
    },
  };

  exp.ENCOUNTER_TUT3 = {
    roomName: 'battleTut1',
    baseExperience: 2,
    baseTokens: 0,
    disableFlee: true,
    enemies: [
      {
        chTemplate: varyStats(getEnemy('TUT_ROBOT_MELEE')),
        position: BattlePosition.FRONT,
        ai: 'BATTLE_AI_ATTACK',
      },
      {
        chTemplate: varyStats(getEnemy('TUT_ROBOT_MAGE')),
        position: BattlePosition.MIDDLE,
        ai: 'BATTLE_AI_ATTACK',
      },
    ],
    events: {
      onBattleStart: async (battle: Battle) => {
        await callScriptDuringBattle('floor1-tut-vr2-battle3-on-start');
      },
      onBattleEnd: async (battle: Battle) => {
        await callScriptDuringBattle('floor1-tut-vr2-battle3-on-end');
      },
      onAfterBattleEnded: async () => {
        await callScriptDuringOverworld('floor1-tut-vr2-battle3-on-after-end', {
          disableKeys: true,
          hideUi: true,
          setPlayerIdle: true,
        });
      },
    },
  };

  exp.ENCOUNTER_TUT4 = {
    roomName: 'battleTut1',
    baseExperience: 2,
    baseTokens: 0,
    disableFlee: true,
    enemies: [
      {
        chTemplate: varyStats(getEnemy('TUT_ROBOT_ARMORED')),
        position: BattlePosition.FRONT,
        ai: 'BATTLE_AI_ATTACK',
      },
      {
        chTemplate: varyStats(getEnemy('TUT_ROBOT_MAGE')),
        position: BattlePosition.MIDDLE,
        ai: 'BATTLE_AI_ATTACK',
      },
    ],
    events: {
      onBattleStart: async (battle: Battle) => {
        await callScriptDuringBattle('floor1-tut-vr2-battle4-on-start');
      },
      onBattleEnd: async (battle: Battle) => {
        await callScriptDuringBattle('floor1-tut-vr2-battle4-on-end');
      },
      onAfterBattleEnded: async () => {
        await callScriptDuringOverworld('floor1-tut-vr2-battle4-on-after-end', {
          disableKeys: true,
          hideUi: true,
          setPlayerIdle: true,
        });
      },
    },
  };

  exp.ENCOUNTER_TUT_DUNGEON1 = {
    roomName: 'battleTut1',
    baseExperience: 2,
    baseTokens: 2,
    enemies: [
      {
        chTemplate: varyStats(getEnemy('TUT_ROBOT_MELEE')),
        position: BattlePosition.FRONT,
        ai: 'BATTLE_AI_ATTACK',
      },
      {
        chTemplate: varyStats(getEnemy('TUT_ROBOT_MELEE_SPEEDY')),
        position: BattlePosition.FRONT,
        ai: 'BATTLE_AI_ATTACK',
      },
    ],
  };

  exp.ENCOUNTER_TUT_DUNGEON2 = {
    roomName: 'battleTut1',
    baseExperience: 2,
    baseTokens: 2,
    getDrops: () => {
      if (Math.random() > 0.9) {
        return [getItem('FeeblePotion'), getItem('RezGem')];
      } else if (Math.random() > 0.5) {
        return [
          Math.random() > 0.5 ? getItem('FeeblePotion') : getItem('RezGem'),
        ];
      }
      return [];
    },
    enemies: [
      {
        chTemplate: varyStats(getEnemy('TUT_ROBOT_MELEE')),
        position: BattlePosition.FRONT,
        ai: 'BATTLE_AI_ATTACK',
      },
      {
        chTemplate: varyStats(getEnemy('TUT_ROBOT_MAGE')),
        position: BattlePosition.MIDDLE,
        ai: 'BATTLE_AI_ATTACK',
      },
    ],
  };

  exp.ENCOUNTER_TUT_DUNGEON3 = {
    roomName: 'battleTut1',
    baseExperience: 5,
    baseTokens: 3,
    getDrops: () => {
      if (Math.random() > 0.5) {
        return [getItem('FeeblePotion')];
      }
      return [];
    },
    enemies: [
      {
        chTemplate: varyStats(getEnemy('TUT_ROBOT_MELEE_SPEEDY')),
        position: BattlePosition.FRONT,
        ai: 'BATTLE_AI_ATTACK',
      },
      {
        chTemplate: varyStats(getEnemy('TUT_ROBOT_MELEE_SPEEDY')),
        position: BattlePosition.FRONT,
        ai: 'BATTLE_AI_ATTACK',
      },
      {
        chTemplate: varyStats(getEnemy('TUT_ROBOT_RANGED')),
        position: BattlePosition.MIDDLE,
        ai: 'BATTLE_AI_ATTACK',
      },
    ],
  };

  exp.ENCOUNTER_TUT_DUNGEON4 = {
    roomName: 'battleTut1',
    baseExperience: 5,
    baseTokens: 2,
    getDrops: () => {
      if (Math.random() > 0.5) {
        return [getItem('RezGem')];
      }
      return [];
    },
    enemies: [
      {
        chTemplate: varyStats(getEnemy('TUT_ROBOT_ARMORED')),
        position: BattlePosition.FRONT,
        ai: 'BATTLE_AI_ATTACK',
      },
      // {
      //   chTemplate: varyStats(getEnemy('TUT_ROBOT_MELEE_SPEEDY')),
      //   position: BattlePosition.FRONT,
      //   ai: BATTLE_AI_ATTACK,
      // },
      {
        chTemplate: varyStats(getEnemy('TUT_ROBOT_MAGE')),
        position: BattlePosition.MIDDLE,
        ai: 'BATTLE_AI_ATTACK',
      },
      // {
      //   chTemplate: varyStats(getEnemy('TUT_ROBOT_CHANNELER')),
      //   position: BattlePosition.MIDDLE,
      //   ai: BATTLE_AI_ATTACK,
      // },
    ],
  };

  exp.ENCOUNTER_TUT_BOSS = {
    roomName: 'battleTutBoss',
    baseExperience: 10,
    baseTokens: 25,
    disableFlee: true,
    // music: 'music_tense_battle',
    enemies: [
      {
        chTemplate: getEnemy('TUT_ROBOT_BOSS'),
        position: BattlePosition.FRONT,
        ai: 'BATTLE_AI_TUT_BOSS1',
      },
    ],
  };
};
