import {
  BattleAction,
  BattleActionType,
  doSwing,
  getTarget,
  SwingType,
} from 'controller/battle-actions';
import { Battle } from 'model/battle';
import { BattleCharacter } from 'model/battle-character';

const exp: Record<string, BattleAction> = {};

export const get = (battleActionName: string) => {
  const b = exp[battleActionName];
  if (!b) {
    throw new Error(
      'Could not get battle action with name: ' + battleActionName
    );
  }
  return b;
};

export const init = () => {
  exp.NoWeapon = {
    name: '(No weapon)',
    description:
      "Jump to target and give 'em a smack.  It probably won't be very effective.",
    cooldown: 5000,
    type: BattleActionType.SWING,
    meta: {
      swings: [SwingType.NORMAL],
      icon: 'sword',
    },
    cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
      const baseDamage = 1;
      const baseStagger = 1;
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
  };
};
