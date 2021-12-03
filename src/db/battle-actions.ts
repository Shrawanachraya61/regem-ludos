import {
  BattleAction,
  BattleActionType,
  doSwing,
  getTarget,
  moveBackward,
  moveForward,
  SwingType,
} from 'controller/battle-actions';
import { beginAction, endAction } from 'controller/battle-management';
import { spawnParticleAtCharacter } from 'controller/scene/scene-commands';
import {
  Battle,
  BattleAllegiance,
  battleGetActingAllegiance,
} from 'model/battle';
import {
  BattleCharacter,
  battleCharacterSetAnimationIdle,
} from 'model/battle-character';
import {
  AnimationState,
  characterSetAnimationState,
  characterSetFacing,
  Facing,
} from 'model/character';
import { playSoundName } from 'model/sound';
import { timeoutPromise } from 'utils';

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
    description: "You don't have a weapon equipped!",
    cooldown: 5000,
    type: BattleActionType.SWING,
    meta: {
      swings: [SwingType.NORMAL],
      icon: 'sword',
    },
    cb: async function (battle: Battle, bCh: BattleCharacter): Promise<void> {
      const target = getTarget(battle, bCh);

      if (target) {
        await beginAction(bCh);
        await moveForward(battle, bCh);
        // battleCharacterSetAnimationIdle(bCh);
        characterSetFacing(bCh.ch, Facing.DOWN);
        characterSetAnimationState(bCh.ch, AnimationState.IDLE);
        await timeoutPromise(750);
        spawnParticleAtCharacter('EFFECT_TEMPLATE_SHRUG', bCh.ch.name, 'rise');
        playSoundName('emotion');
        await timeoutPromise(750);
        characterSetFacing(
          bCh.ch,
          battleGetActingAllegiance(battle) === BattleAllegiance.ALLY
            ? Facing.RIGHT
            : Facing.LEFT
        );
        await endAction(bCh);
      }
    },
  };
};
