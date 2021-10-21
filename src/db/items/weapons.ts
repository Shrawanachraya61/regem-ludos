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
import { ItemTemplate, ItemType, WeaponType } from '.';

const COOLDOWN_MOD = 1;

export const initBattleActions = (): Record<string, BattleAction> => {
  const exp = {
    NoWeapon: {
      name: '(No weapon)',
      description:
        "Jump to target and give 'em a smack.  It probably won't be very effective.",
      cooldown: 5000 * COOLDOWN_MOD,
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
    },
    TrainingSwordSwing: {
      name: 'Swing Sword',
      description: 'Jump to target and swing your weapon.',
      cooldown: 4500 * COOLDOWN_MOD,
      type: BattleActionType.SWING,
      meta: {
        swings: [SwingType.NORMAL, SwingType.NORMAL],
        icon: 'sword',
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
    TrainingSwordSwingPlus: {
      name: 'Swing Sword',
      description: 'Jump to target and swing your weapon.',
      cooldown: 4000 * COOLDOWN_MOD,
      type: BattleActionType.SWING,
      meta: {
        swings: [SwingType.NORMAL, SwingType.PIERCE],
        icon: 'sword',
      },
      cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
        const baseDamage = 4;
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
    TrainingBowShoot: {
      name: 'Shoot Bow',
      description: 'Fire at the ranged target.',
      cooldown: 3500 * COOLDOWN_MOD,
      type: BattleActionType.RANGED,
      meta: {
        ranges: [RangeType.NORMAL, RangeType.NORMAL],
      },
      cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
        const baseDamage = 2;
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
        icon: 'sword',
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

  exp.NoWeapon = {
    label: 'No Weapon',
    description: 'No weapon is equipped.',
    type: ItemType.WEAPON,
    skills: [battleActions.NoWeapon],
  };
  exp.TrainingSword = {
    label: 'Training Sword',
    description: 'A standard issue training sword.',
    type: ItemType.WEAPON,
    weaponType: WeaponType.SWORD,
    skills: [battleActions.TrainingSwordSwing],
    icon: 'sword',
  };
  exp.TrainingBow = {
    label: 'Training Bow',
    description: 'A standard issue training bow.',
    type: ItemType.WEAPON,
    weaponType: WeaponType.BOW,
    skills: [battleActions.TrainingBowShoot],
    icon: 'bow',
  };
  exp.PierceSword = {
    label: 'Pierce Sword',
    description:
      'A slightly more refined version of the standard issue Training Sword.  The hilt is balanced slightly differently to allow for more force on the followup swing.',
    type: ItemType.WEAPON,
    weaponType: WeaponType.SWORD,
    skills: [battleActions.TrainingSwordSwingPlus],
    icon: 'sword',
  };
};
