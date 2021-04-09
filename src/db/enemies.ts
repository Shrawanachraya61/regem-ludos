import { battleStatsCreate, BattleStats } from 'model/battle';
import { AnimationState, Facing, CharacterTemplate } from 'model/character';
import { BattleActions } from 'controller/battle-actions';

const exp = {} as { [key: string]: CharacterTemplate };
export const get = (key: string): CharacterTemplate => {
  const result = exp[key];
  if (!result) {
    throw new Error(`No enemy template exists with name: ${key}`);
  }
  return {
    ...result,
    stats: {
      ...result.stats,
    } as BattleStats,
  };
};

export const init = () => {
  exp.ENEMY_GUY = {
    name: 'guy',
    spriteBase: 'guy-battle',
    stats: {
      ...battleStatsCreate(),
      HP: 15,
      STAGGER: 25,
    },
    facing: Facing.LEFT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [BattleActions.SwingSlow],
    armor: 1,
  };

  exp.TUT_ROBOT_MELEE_STAGGERABLE = {
    name: 'Robot M',
    spriteBase: 'tut_robot_melee',
    stats: {
      ...battleStatsCreate(),
      HP: 15,
      STAGGER: 5,
    },
    facing: Facing.LEFT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [BattleActions.RobotSwingNormalNNStaggerable],
    armor: 0,
  };

  exp.TUT_ROBOT_MELEE = {
    name: 'Robot M',
    spriteBase: 'tut_robot_melee',
    stats: {
      ...battleStatsCreate(),
      HP: 15,
      STAGGER: 25,
    },
    facing: Facing.LEFT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [BattleActions.RobotSwingNormalNN],
    armor: 0,
  };

  exp.TUT_ROBOT_MELEE_SPEEDY = {
    name: 'Robot M Fast',
    spriteBase: 'tut_robot_melee_speedy',
    stats: {
      ...battleStatsCreate(),
      HP: 12,
      STAGGER: 25,
    },
    facing: Facing.LEFT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [BattleActions.RobotSwingSpeedyN],
    armor: 0,
  };

  exp.TUT_ROBOT_ARMORED = {
    name: 'Robot Armored',
    spriteBase: 'tut_robot_armored',
    spriteSize: [40, 40],
    stats: {
      ...battleStatsCreate(),
      HP: 15,
      STAGGER: 25,
    },
    facing: Facing.LEFT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [BattleActions.RobotSwingArmoredNK, BattleActions.RobotSwingPierce],
    armor: 1,
  };

  exp.TUT_ROBOT_BOSS = {
    name: 'Giga Robot',
    spriteBase: 'tut_robot_boss',
    spriteSize: [96, 96],
    stats: {
      ...battleStatsCreate(),
      HP: 100,
      STAGGER: 25,
    },
    facing: Facing.LEFT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [BattleActions.RobotSwingArmoredNK, BattleActions.RobotSwingPierce],
    armor: 1,
  };
};
