import {
  BattleAction,
  SwingType,
  BattleActionType,
  doSwing,
  getTarget,
  RangeType,
  doRange,
} from 'controller/battle-actions';
import { Battle } from 'model/battle';
import { BattleCharacter } from 'model/battle-character';
import SwordIcon from 'view/icons/Sword';

export const init = (): Record<string, BattleAction> => {
  const exp = {
    AdaTrainingSwing: {
      name: 'Training Swing',
      description: 'Jump to target and swing your weapon.',
      cooldown: 1000,
      type: BattleActionType.SWING,
      meta: {
        swings: [SwingType.NORMAL, SwingType.NORMAL],
        icon: SwordIcon,
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
    BowLevel1: {
      name: 'BowLevel1',
      description: 'Fire an arrow at a target.',
      cooldown: 1000,
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
