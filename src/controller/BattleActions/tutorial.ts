import {
  BattleAction,
  SwingType,
  BattleActionType,
  doSwing,
  getTarget,
  doRange,
  RangeType,
} from 'controller/battle-actions';
import { Battle } from 'model/battle';
import { BattleCharacter } from 'model/battle-character';

const COOLDOWN_MOD = 1;

export const init = (): Record<string, BattleAction> => {
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
      cooldown: 8000 * COOLDOWN_MOD,
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
  };
  return exp;
};
