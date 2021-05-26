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
import {
  Battle,
  battleGetTargetedEnemy,
  battleStatsCreate,
} from 'model/battle';
import { BattleCharacter } from 'model/battle-character';
import SwordIcon from 'view/icons/Sword';
import {
  AnimationState,
  Facing,
  CharacterTemplate,
  WeaponEquipState,
} from 'model/character';
import {
  beginAction,
  endAction,
  setCasting,
} from 'controller/battle-management';
import { EFFECT_TEMPLATE_FIREBALL } from 'model/particle';

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

export const init = () => {
  const exp = {} as { [key: string]: CharacterTemplate };

  const BattleActions = initBattleActions();

  exp.Ada = {
    name: 'Ada',
    spriteBase: 'ada',
    stats: {
      ...battleStatsCreate(),
      HP: 50,
    },
    facing: Facing.DOWN,
    animationState: AnimationState.IDLE,
    skills: [BattleActions.AdaTrainingSwing],
    speed: 1.5,
  };

  exp.Conscience = {
    name: 'Conscience',
    spriteBase: 'conscience',
    talkTrigger: '',
    facing: Facing.DOWN,
    animationState: AnimationState.IDLE,
    skills: [BattleActions.BowLevel1],
    weaponEquipState: WeaponEquipState.RANGED,
    stats: {
      ...battleStatsCreate(),
      HP: 45,
    },
    speed: 1.5,
  };
  return exp;
};
