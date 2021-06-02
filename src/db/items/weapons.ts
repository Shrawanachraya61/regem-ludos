import {
  BattleAction,
  SwingType,
  BattleActionType,
  doSwing,
  getTarget,
  RangeType,
  doRange,
  doSpell,
} from 'controller/battle-actions';
import { Battle, battleGetTargetedEnemy } from 'model/battle';
import { BattleCharacter } from 'model/battle-character';
import {
  beginAction,
  endAction,
  setCasting,
} from 'controller/battle-management';
import { EFFECT_TEMPLATE_FIREBALL } from 'model/particle';
import { ItemTemplate, ItemType } from '.';

import SwordIcon from 'view/icons/Sword';
import BowIcon from 'view/icons/RangedNormal';

const COOLDOWN_MOD = 0.25;

export const initBattleActions = (): Record<string, BattleAction> => {
  const exp = {
    AdaTrainingSwing: {
      name: 'Training Swing',
      description: 'Jump to target and swing your weapon.',
      cooldown: 5000 * COOLDOWN_MOD,
      type: BattleActionType.SWING,
      meta: {
        swings: [SwingType.NORMAL, SwingType.NORMAL],
        icon: SwordIcon,
      },
      cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
        const baseDamage = 3;
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
      cooldown: 3000 * COOLDOWN_MOD,
      type: BattleActionType.RANGED,
      meta: {
        ranges: [RangeType.NORMAL, RangeType.NORMAL],
      },
      cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
        const baseDamage = 1;
        const baseStagger = 1;
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
    Fireball: {
      name: 'Fireball',
      description: 'Shoot a big fireball.',
      cooldown: 8000 * COOLDOWN_MOD,
      type: BattleActionType.CAST,
      meta: {
        castTime: 3000,
        icon: SwordIcon,
      },
      cb: async (battle: Battle, bCh: BattleCharacter) => {
        await beginAction(bCh);
        setCasting(bCh, {
          castTime: exp.Fireball.meta.castTime as number,
          onCast: async () => {
            const target = battleGetTargetedEnemy(
              battle,
              BattleActionType.RANGED
            );
            if (target) {
              await doSpell(battle, exp.Fireball, bCh, target, {
                baseDamage: 15,
                baseStagger: 15,
                particleText: 'Fireball!',
                particleTemplate: EFFECT_TEMPLATE_FIREBALL,
              });
            }
          },
          onInterrupt: async () => {},
        });
        await endAction(bCh);
      },
    },
  };
  return exp;
};

export const init = (exp: { [key: string]: ItemTemplate }) => {
  const battleActions = initBattleActions();

  exp.TrainingSword = {
    label: 'Training Sword',
    icon: BowIcon,
    description: 'A standard issue training sword.',
    equipType: ItemType.WEAPON,
    skills: [battleActions.AdaTrainingSwing],
  };
  exp.TrainingBow = {
    label: 'Training Bow',
    icon: BowIcon,
    description: 'A standard issue training sword.',
    equipType: ItemType.WEAPON,
    skills: [battleActions.BowLevel1],
  };
};
