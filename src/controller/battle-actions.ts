import {
  Battle,
  BattleAllegiance,
  battleGetAllegiance,
  Status,
  battleGetNearestAttackable,
} from 'model/battle';
import {
  BattleCharacter,
  battleCharacterCanAct,
  battleCharacterAddStatus,
  battleCharacterRemoveStatus,
  battleCharacterSetActonState,
  BattleActionState,
} from 'model/battle-character';
import {
  AnimationState,
  characterGetAnimation,
  characterGetPos,
  characterSetAnimationState,
  characterSetTransform,
  characterGetPosCenterPx,
} from 'model/character';
import { roomAddParticle, TILE_WIDTH } from 'model/room';
import {
  Transform,
  TransformEase,
  transformOffsetJumpShort,
  transformOffsetJumpMedium,
  transformOffsetJumpFar,
} from 'model/utility';
import {
  timeoutPromise,
  getRandBetween,
  Point3d,
  calculateDistance,
  normalize,
} from 'utils';
import {
  particleCreateFromTemplate,
  EFFECT_TEMPLATE_SWORD_LEFT,
  createDamageParticle,
  createStatusParticle,
} from 'model/particle';
import {
  beginAction,
  endAction,
  applyStandardDamage,
  setCasting,
} from 'controller/battle-management';
import { h } from 'preact';
import ShieldIcon from 'view/icons/Shield';
import SwordIcon from 'view/icons/Sword';
import { getCurrentRoom } from 'model/generics';

export interface BattleAction {
  name: string;
  description: string;
  cb: (battle: Battle, bCh: BattleCharacter) => Promise<void>;
  cooldown: number;
  icon: (props: any) => h.JSX.Element;
}

// when jumping further distances, the character should jump higher
const getTransformOffsetFunction = (distance: number) => {
  // 35 and 125 are distance between first column and last column
  if (distance < 45) {
    return transformOffsetJumpShort;
  } else if (distance < 100) {
    return transformOffsetJumpMedium;
  } else {
    return transformOffsetJumpFar;
  }
};

const moveForward = async (
  battle: Battle,
  bCh: BattleCharacter
): Promise<Transform> => {
  const ch = bCh.ch;
  const allegiance = battleGetAllegiance(battle, ch);
  const startPoint = characterGetPos(ch);
  const endPoint: Point3d = [...startPoint];
  if (allegiance === BattleAllegiance.ALLY) {
    endPoint[0] += TILE_WIDTH / 2;
    endPoint[1] -= TILE_WIDTH / 2;
  } else {
    endPoint[0] -= TILE_WIDTH / 2;
    endPoint[1] += TILE_WIDTH / 2;
  }
  const transform = new Transform(
    startPoint,
    endPoint,
    200,
    TransformEase.LINEAR,
    transformOffsetJumpShort
  );
  characterSetTransform(ch, transform);
  characterSetAnimationState(ch, AnimationState.BATTLE_JUMP);
  await transform.timer.onCompletion();
  return transform;
};

const jumpToTarget = async (
  battle: Battle,
  bCh: BattleCharacter,
  target: BattleCharacter
) => {
  const ch = bCh.ch;
  const allegiance = battleGetAllegiance(battle, ch);
  // jump to one tile closer towards the center of target
  const startPoint = characterGetPos(ch);
  const endPoint = characterGetPos(target.ch);
  if (allegiance === BattleAllegiance.ALLY) {
    endPoint[0] -= TILE_WIDTH / 2;
    // if (battleCharacterGetRow(bCh) === BattleRow.BOTTOM) {
    //   endPoint[0] += TILE_WIDTH / 2;
    //   endPoint[1] += TILE_WIDTH / 2;
    // }
  } else {
    endPoint[0] += TILE_WIDTH / 2;
    // if (battleCharacterGetRow(bCh) === BattleRow.TOP) {
    //   endPoint[0] -= TILE_WIDTH / 2;
    //   endPoint[1] -= TILE_WIDTH / 2;
    // }
  }
  const distance = calculateDistance(startPoint, endPoint);
  const transform = new Transform(
    startPoint,
    endPoint,
    250 * normalize(distance, 35, 125, 1, 1.75),
    TransformEase.LINEAR,
    getTransformOffsetFunction(distance)
  );
  characterSetTransform(ch, transform);
  characterSetAnimationState(ch, AnimationState.BATTLE_JUMP);
  await transform.timer.onCompletion();
  return transform;
};

export const BattleActions: { [key: string]: BattleAction } = {
  Swing: {
    name: 'Swing',
    description: 'Jump to target and swing your weapon.',
    cooldown: 1000,
    icon: SwordIcon,
    cb: async (battle: Battle, bCh: BattleCharacter): Promise<void> => {
      const baseDamage = 1;
      const baseStagger = 10;

      const ch = bCh.ch;
      const allegiance = battleGetAllegiance(battle, ch);
      const target = battleGetNearestAttackable(battle, allegiance);
      const actionStateIndex = bCh.actionStateIndex;

      if (target) {
        if (actionStateIndex === 0) {
          await beginAction(bCh);

          bCh.actionReadyTimer.start();
          await jumpToTarget(battle, bCh, target);

          bCh.actionReadyTimer.start();
          bCh.actionReadyTimer.pause();

          // swing weapon and show effect particles
          battleCharacterSetActonState(bCh, BattleActionState.ACTING);
          timeoutPromise(300).then(() => {
            const [centerPx, centerPy] = characterGetPosCenterPx(target.ch);
            const particle = particleCreateFromTemplate(
              [centerPx, centerPy],
              EFFECT_TEMPLATE_SWORD_LEFT
            );
            roomAddParticle(battle.room, particle);
            applyStandardDamage(battle, bCh, target, baseDamage, baseStagger);
          });
          characterSetAnimationState(ch, AnimationState.BATTLE_ATTACK);
          const anim = characterGetAnimation(ch);
          await anim.onCompletion();
          await timeoutPromise(400);
          battleCharacterSetActonState(bCh, BattleActionState.ACTING_READY);
          characterSetAnimationState(ch, AnimationState.BATTLE_IDLE);
          bCh.actionReadyTimer.unpause();
        } else if (actionStateIndex === 1) {
          bCh.actionReadyTimer.start();
          bCh.actionReadyTimer.pause();
          // swing weapon and show effect particles
          battleCharacterSetActonState(bCh, BattleActionState.ACTING);
          timeoutPromise(300).then(() => {
            const [centerPx, centerPy] = characterGetPosCenterPx(target.ch);
            const particle = particleCreateFromTemplate(
              [centerPx, centerPy],
              EFFECT_TEMPLATE_SWORD_LEFT
            );
            roomAddParticle(battle.room, particle);
            applyStandardDamage(battle, bCh, target, baseDamage, baseStagger);
          });
          characterSetAnimationState(ch, AnimationState.BATTLE_ATTACK);
          const anim = characterGetAnimation(ch);
          await anim.onCompletion();
          await timeoutPromise(400);
          battleCharacterSetActonState(bCh, BattleActionState.ACTING_READY);
          characterSetAnimationState(ch, AnimationState.BATTLE_IDLE);
          bCh.actionReadyTimer.unpause();
        } else if (actionStateIndex === 2) {
          bCh.actionReadyTimer.start();
          bCh.actionReadyTimer.pause();
          // swing weapon and show effect particles
          battleCharacterSetActonState(bCh, BattleActionState.ACTING);
          timeoutPromise(300).then(() => {
            const [centerPx, centerPy] = characterGetPosCenterPx(target.ch);
            const particle = particleCreateFromTemplate(
              [centerPx, centerPy],
              EFFECT_TEMPLATE_SWORD_LEFT
            );
            roomAddParticle(battle.room, particle);
            applyStandardDamage(battle, bCh, target, baseDamage, baseStagger);
          });
          characterSetAnimationState(ch, AnimationState.BATTLE_ATTACK);
          const anim = characterGetAnimation(ch);
          await anim.onCompletion();
          await timeoutPromise(750);
          battleCharacterSetActonState(bCh, BattleActionState.ACTING_READY);
          characterSetAnimationState(ch, AnimationState.BATTLE_IDLE);
          bCh.actionReadyTimer.unpause();
          await endAction(bCh);
        }
        bCh.actionStateIndex = (bCh.actionStateIndex + 1) % 3;
      }
    },
  },
  SwingSlow: {
    name: 'SwingSlow',
    description: 'A slower version of the swing.',
    cooldown: 100000,
    icon: SwordIcon,
    cb: async (battle: Battle, bCh: BattleCharacter) => {
      return BattleActions.Swing.cb(battle, bCh);
    },
  },
  SwingWithLongDescription: {
    name: 'Swing LD',
    description:
      'This version of Swing is identical to Swing, except it kind of has a super duper long description.  This is done so that it can be TESTED.',
    cooldown: 100000,
    icon: SwordIcon,
    cb: async (battle: Battle, bCh: BattleCharacter) => {
      return BattleActions.Swing.cb(battle, bCh);
    },
  },
  Defend: {
    name: 'Defend',
    description:
      'Brace yourself for an attack, taking less damage and reducing stagger for a short time.',
    cooldown: 5000,
    icon: ShieldIcon,
    cb: async (battle: Battle, bCh: BattleCharacter) => {
      beginAction(bCh);

      const ch = bCh.ch;
      const transform = await moveForward(battle, bCh);

      characterSetAnimationState(ch, AnimationState.BATTLE_ITEM);
      const anim = characterGetAnimation(ch);
      await anim.onCompletion();
      battleCharacterAddStatus(bCh, Status.DEFEND);

      const inverseTransform = transform.createInverse();
      characterSetTransform(ch, inverseTransform);
      characterSetAnimationState(ch, AnimationState.BATTLE_JUMP);
      await inverseTransform.timer.onCompletion();

      inverseTransform.markForRemoval();
      characterSetAnimationState(ch, AnimationState.BATTLE_IDLE);

      setCasting(bCh, {
        castTime: 5000,
        onCast: async () => {
          console.log('Defense completed');
          battleCharacterRemoveStatus(bCh, Status.DEFEND);
        },
        onInterrupt: async () => {
          console.log('Defense interrupted');
          battleCharacterRemoveStatus(bCh, Status.DEFEND);
        },
      });

      endAction(bCh);
    },
  },
  Fireball: {
    name: 'Fireball',
    description: 'Shoot a big fireball.',
    cooldown: 1000,
    icon: ShieldIcon,
    cb: async (battle: Battle, bCh: BattleCharacter) => {
      await beginAction(bCh);
      setCasting(bCh, {
        castTime: 5000,
        onCast: async () => {
          await moveForward(battle, bCh);
          const [centerPx, centerPy] = characterGetPosCenterPx(bCh.ch);
          roomAddParticle(
            getCurrentRoom(),
            createStatusParticle('Fireball!', centerPx, centerPy, 'red')
          );
          await timeoutPromise(150);
          characterSetAnimationState(bCh.ch, AnimationState.BATTLE_SPELL);
          await timeoutPromise(1000);
        },
        onInterrupt: async () => {},
      });
    },
  },
};
