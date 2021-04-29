import { Battle, battleStatsCreate, BattleStats } from 'model/battle';
import { AnimationState, Facing, CharacterTemplate } from 'model/character';
import {
  BattleAction,
  SwingType,
  BattleActionType,
  doSwing,
  getTarget,
  doRange,
  RangeType,
  doSpell,
} from 'controller/battle-actions';
import { setCasting } from 'controller/battle-management';
import { BattleCharacter } from 'model/battle-character';
import { EFFECT_TEMPLATE_FIREBALL } from 'model/particle';

const COOLDOWN_MOD = 1;

export const initBattleActions = (): Record<string, BattleAction> => {
  const exp = {
    RobotSwingNormalNNStaggerable: {
      name: 'RobotSwingNormalNNStaggerable',
      description: 'AI',
      cooldown: 10000 * COOLDOWN_MOD,
      type: BattleActionType.SWING,
      meta: {
        swings: [SwingType.NORMAL, SwingType.NORMAL],
      },
      cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
        const baseDamage = 1;
        const baseStagger = 5;
        const target = getTarget(battle, bCh);
        if (target) {
          await doSwing(battle, this, bCh, target, {
            baseDamage,
            baseStagger,
            swingType:
              this.meta?.swings?.[bCh.actionStateIndex] ?? SwingType.NORMAL,
          });
        }
      },
    },
    RobotSwingNormalNN: {
      name: 'RobotSwingNormalNN',
      description: 'AI',
      cooldown: 10000 * COOLDOWN_MOD,
      type: BattleActionType.SWING,
      meta: {
        swings: [SwingType.NORMAL, SwingType.NORMAL],
      },
      cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
        const baseDamage = 1;
        const baseStagger = 5;
        const target = getTarget(battle, bCh);
        if (target) {
          await doSwing(battle, this, bCh, target, {
            baseDamage,
            baseStagger,
            swingType:
              this.meta?.swings?.[bCh.actionStateIndex] ?? SwingType.NORMAL,
          });
        }
      },
    },
    RobotSwingSpeedyN: {
      name: 'RobotSwingSpeedyN',
      description: 'AI',
      cooldown: 4000 * COOLDOWN_MOD,
      type: BattleActionType.SWING,
      meta: {
        swings: [SwingType.NORMAL],
      },
      cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
        const baseDamage = 1;
        const baseStagger = 5;
        const target = getTarget(battle, bCh);
        if (target) {
          await doSwing(battle, this, bCh, target, {
            baseDamage,
            baseStagger,
            swingType:
              this.meta?.swings?.[bCh.actionStateIndex] ?? SwingType.NORMAL,
          });
        }
      },
    },
    RobotSwingArmoredNK: {
      name: 'RobotSwingArmoredNK',
      description: 'AI',
      cooldown: 11000 * COOLDOWN_MOD,
      type: BattleActionType.SWING,
      meta: {
        swings: [SwingType.KNOCK_DOWN, SwingType.KNOCK_DOWN],
      },
      cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
        const baseDamage = 3;
        const baseStagger = 6;
        const target = getTarget(battle, bCh);
        if (target) {
          await doSwing(battle, this, bCh, target, {
            baseDamage,
            baseStagger,
            swingType:
              this.meta?.swings?.[bCh.actionStateIndex] ?? SwingType.NORMAL,
          });
        }
      },
    },
    RobotSwingPierce: {
      name: 'RobotSwingPierce',
      description: 'AI',
      cooldown: 9000 * COOLDOWN_MOD,
      type: BattleActionType.SWING,
      meta: {
        swings: [SwingType.PIERCE],
      },
      cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
        const baseDamage = 1;
        const baseStagger = 5;
        const target = getTarget(battle, bCh);
        if (target) {
          await doSwing(battle, this, bCh, target, {
            baseDamage,
            baseStagger,
            swingType:
              this.meta?.swings?.[bCh.actionStateIndex] ?? SwingType.NORMAL,
          });
        }
      },
    },
    RobotRanged: {
      name: 'RobotRanged',
      description: 'AI',
      cooldown: 5000 * COOLDOWN_MOD,
      type: BattleActionType.RANGED,
      meta: {
        ranges: [RangeType.NORMAL, RangeType.NORMAL],
      },
      cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
        const baseDamage = 1;
        const baseStagger = 0;
        const target = getTarget(battle, bCh);
        if (target) {
          await doRange(battle, this, bCh, target, {
            baseDamage,
            baseStagger,
            rangeType:
              this.meta?.ranges?.[bCh.actionStateIndex] ?? RangeType.NORMAL,
          });
        }
      },
    },
    RobotBlackFireSnap: {
      name: 'RobotBlackFireSnap',
      description: 'AI',
      cooldown: 3000 * COOLDOWN_MOD,
      type: BattleActionType.CAST,
      meta: {
        castTime: 3000,
        // icon: SwordIcon,
      },
      cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
        const baseDamage = 5;
        const baseStagger = 15;
        const target = getTarget(battle, bCh);
        if (target) {
          setCasting(bCh, {
            castTime: exp.RobotBlackFireSnap.meta.castTime as number,
            onCast: async () => {
              const target = getTarget(battle, bCh);
              if (target) {
                await doSpell(battle, exp.RobotBlackFireSnap, bCh, target, {
                  baseDamage,
                  baseStagger,
                  particleText: 'Black Fire Snap!',
                  particleTemplate: EFFECT_TEMPLATE_FIREBALL,
                });
              }
            },
            onInterrupt: async () => {},
          });
        }
      },
    },
  };
  return exp;
};

export const init = (exp: { [key: string]: CharacterTemplate }) => {
  const BattleActions = initBattleActions();

  exp.TUT_ROBOT_MELEE_REALLY_EASY = {
    name: 'Robot M',
    spriteBase: 'tut_robot_melee',
    stats: {
      ...battleStatsCreate(),
      HP: 1,
      STAGGER: 5,
    },
    facing: Facing.LEFT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [BattleActions.RobotSwingNormalNNStaggerable],
    armor: 0,
  };

  exp.TUT_ROBOT_MELEE_EASY = {
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

  exp.TUT_ROBOT_MELEE_STAGGERABLE = {
    name: 'Robot M',
    spriteBase: 'tut_robot_melee',
    stats: {
      ...battleStatsCreate(),
      HP: 25,
      STAGGER: 1,
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
      HP: 25,
      STAGGER: 5,
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
      HP: 20,
      STAGGER: 3,
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
      HP: 28,
      STAGGER: 5,
    },
    facing: Facing.LEFT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [BattleActions.RobotSwingArmoredNK, BattleActions.RobotSwingPierce],
    armor: 1,
  };

  exp.TUT_ROBOT_RANGED = {
    name: 'Robot R',
    spriteBase: 'tut_robot_ranged',
    stats: {
      ...battleStatsCreate(),
      HP: 20,
      STAGGER: 5,
    },
    facing: Facing.LEFT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [BattleActions.RobotRanged],
    armor: 0,
  };

  exp.TUT_ROBOT_MAGE = {
    name: 'Robot Mage',
    spriteBase: 'tut_robot_mage',
    stats: {
      ...battleStatsCreate(),
      HP: 18,
      STAGGER: 5,
    },
    facing: Facing.LEFT,
    animationState: AnimationState.BATTLE_IDLE,
    skills: [BattleActions.RobotBlackFireSnap],
    armor: 0,
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
