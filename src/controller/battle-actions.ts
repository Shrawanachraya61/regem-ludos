import {
  Battle,
  BattleAllegiance,
  battleGetAllegiance,
  battleGetNearestAttackable,
  BattleCharacter,
  battleCharacterCanAct,
  battleCharacterAddStatus,
  battleCharacterRemoveStatus,
  Status,
  battleCharacterGetRow,
  BattleRow,
} from 'model/battle';
import {
  AnimationState,
  characterGetAnimation,
  characterGetPos,
  characterSetAnimationState,
  characterSetTransform,
  characterGetPosCenterPx,
} from 'model/character';
import { roomAddParticle, TILE_WIDTH } from 'model/room';
import { getRoom } from 'db/overworlds';
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
} from 'model/particle';
import {
  beginAction,
  endAction,
  applyWeaponDamage,
  setCasting,
} from 'controller/battle-management';
import { h } from 'preact';
import ShieldIcon from 'view/icons/Shield';
import SwordIcon from 'view/icons/Sword';

const assertMayAct = (battle: Battle, bCh: BattleCharacter): boolean => {
  if (!battleCharacterCanAct(battle, bCh)) {
    console.log('cannot attack, battle character cannot act yet', bCh);
    return false;
  }
  return true;
};

export interface BattleAction {
  name: string;
  description: string;
  cb: (battle: Battle, bCh: BattleCharacter) => Promise<void>;
  cooldown: number;
  icon: (props: any) => h.JSX.Element;
}

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

export const BattleActions: { [key: string]: BattleAction } = {
  Swing: {
    name: 'Swing',
    description: 'Jump to target and swing your weapon.',
    cooldown: 10000,
    icon: SwordIcon,
    cb: async (battle: Battle, bCh: BattleCharacter): Promise<void> => {
      if (!assertMayAct(battle, bCh)) {
        return;
      }

      const baseDamage = 1;
      const baseStagger = 1;

      const ch = bCh.ch;
      const allegiance = battleGetAllegiance(battle, ch);
      const target = battleGetNearestAttackable(battle, allegiance);

      if (target) {
        beginAction(battle, bCh);

        // jump to one tile closer towards the center of target
        const startPoint = characterGetPos(ch);
        const endPoint = characterGetPos(target.ch);
        if (allegiance === BattleAllegiance.ALLY) {
          endPoint[0] -= TILE_WIDTH / 2;
          if (battleCharacterGetRow(bCh) === BattleRow.BOTTOM) {
            endPoint[0] += TILE_WIDTH / 2;
            endPoint[1] += TILE_WIDTH / 2;
          }
        } else {
          endPoint[0] += TILE_WIDTH / 2;
          if (battleCharacterGetRow(bCh) === BattleRow.TOP) {
            endPoint[0] -= TILE_WIDTH / 2;
            endPoint[1] -= TILE_WIDTH / 2;
          }
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

        // swing weapon and show effect particles
        timeoutPromise(300).then(() => {
          const [centerPx, centerPy] = characterGetPosCenterPx(target.ch);
          const particle = particleCreateFromTemplate(
            [centerPx, centerPy],
            EFFECT_TEMPLATE_SWORD_LEFT
          );
          roomAddParticle(battle.room, particle);
          applyWeaponDamage(battle, bCh, target, baseDamage, baseStagger);
        });
        characterSetAnimationState(ch, AnimationState.BATTLE_ATTACK);
        const anim = characterGetAnimation(ch);
        await anim.onCompletion();

        // show damage particle and jump back to start
        const inverseTransform = transform.createInverse();
        characterSetTransform(ch, inverseTransform);
        characterSetAnimationState(ch, AnimationState.BATTLE_JUMP);
        await inverseTransform.timer.onCompletion();
        inverseTransform.markForRemoval();
        characterSetAnimationState(ch, AnimationState.BATTLE_IDLE);
        endAction(battle, bCh);
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
  Defend: {
    name: 'Defend',
    description:
      'Brace yourself for an attack, taking less damage and reducing stagger for a short time.',
    cooldown: 5000,
    icon: ShieldIcon,
    cb: async (battle: Battle, bCh: BattleCharacter) => {
      if (!assertMayAct(battle, bCh)) {
        return;
      }

      beginAction(battle, bCh);

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
        onCast: () => {
          console.log('Defense completed');
          battleCharacterRemoveStatus(bCh, Status.DEFEND);
        },
        onInterrupt: () => {
          console.log('Defense interrupted');
          battleCharacterRemoveStatus(bCh, Status.DEFEND);
        },
      });

      endAction(battle, bCh);
    },
  },
};
