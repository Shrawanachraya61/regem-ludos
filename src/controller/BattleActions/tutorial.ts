import {
  BattleAction,
  SwingType,
  BattleActionType,
  doSwing,
  getTarget,
} from 'controller/battle-actions';
import { Battle } from 'model/battle';
import { BattleCharacter } from 'model/battle-character';

export const init = (): Record<string, BattleAction> => {
  const exp = {
    RobotSwingNormalNNStaggerable: {
      name: 'RobotSwingNormalNNStaggerable',
      description: 'AI',
      cooldown: 1000,
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
      cooldown: 5000,
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
      cooldown: 3000,
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
      cooldown: 7000,
      type: BattleActionType.SWING,
      meta: {
        swings: [SwingType.NORMAL, SwingType.KNOCK_DOWN],
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
      cooldown: 5000,
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
  };
  return exp;
};
