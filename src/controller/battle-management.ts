import {
  Battle,
  BattleTemplate,
  BattleTemplateEnemy,
  BattleAllegiance,
  battleCharacterCreateEnemy,
  battleCharacterCreateAlly,
  battleCharacterSetStaggered,
  battleCharacterApplyDamage,
  setCurrentBattle,
  battleSetActorPositions,
  battleGetAllegiance,
  battleGetNearestAttackable,
  BattleCharacter,
  battleCharacterCanAct,
} from 'model/battle';
import {
  AnimationState,
  Character,
  characterCreateFromTemplate,
  characterGetAnimation,
  characterGetPos,
  characterGetPosPx,
  characterSetAnimationState,
  characterSetTransform,
  characterGetSize,
  characterGetPosCenterPx,
} from 'model/character';
import { getRoom, roomAddParticle } from 'model/room';
import { setCurrentRoom } from 'model/scene';
import { Player, playerGetBattlePosition } from 'model/player';
import { Transform, TransformEase, transformOffsetJump } from 'model/transform';
import { timeoutPromise, getRandBetween } from 'utils';
import {
  particleCreateFromTemplate,
  EFFECT_TEMPLATE_SWORD_LEFT,
  createDamageParticle,
} from 'model/particle';

export const initiateBattle = (
  player: Player,
  template: BattleTemplate
): Battle => {
  const room = getRoom(template.roomName);
  room.characters = [];

  const enemies = template.enemies.map((t: BattleTemplateEnemy) => {
    const ch = characterCreateFromTemplate(t.chTemplate);
    room.characters.push(ch);
    return battleCharacterCreateEnemy(ch, t);
  });

  const battle = {
    room,
    enemies,
    allies: player.party.map((ch: Character) => {
      room.characters.push(ch);
      return battleCharacterCreateAlly(ch, {
        position: playerGetBattlePosition(player, ch),
      });
    }),
  };

  battleSetActorPositions(battle);

  setCurrentBattle(battle);
  setCurrentRoom(room);
  return battle;
};

export const beginAction = (battle: Battle, bCh: BattleCharacter): void => {
  console.log('begin action', bCh);
  bCh.isActing = true;
  bCh.actionTimer.start();
  bCh.actionTimer.pause();
};
export const endAction = (battle: Battle, bCh: BattleCharacter): void => {
  console.log('end action', bCh);
  bCh.isActing = false;
  bCh.actionTimer.unpause();
};

export const applyDamage = (
  battle: Battle,
  attacker: BattleCharacter,
  victim: BattleCharacter
): void => {
  let damage = 10; //getRandBetween(attacker.ch.stats.POW / 2, attacker.ch.stats.POW);
  if (victim.isStaggered) {
    victim.staggerTimer.start();
    damage *= 2;
  } else {
    victim.staggerGauge.fill(damage);
    console.log(
      'fill gauge',
      damage,
      victim.staggerGauge.current,
      victim.staggerGauge.max
    );
    if (victim.staggerGauge.isFull()) {
      console.log('STAGGER!');
      battleCharacterSetStaggered(victim);
    }
  }
  const [centerPx, centerPy] = characterGetPosCenterPx(victim.ch);
  roomAddParticle(
    battle.room,
    createDamageParticle(
      String(Math.floor(Math.random() * 10) + 1),
      centerPx,
      centerPy
    )
  );
  battleCharacterApplyDamage(victim);
};

export const attack = async (
  battle: Battle,
  bCh: BattleCharacter
): Promise<void> => {
  if (!battleCharacterCanAct(bCh)) {
    console.log('cannot attack, battle character cannot act yet', bCh);
    return;
  }

  const ch = bCh.ch;
  const allegiance = battleGetAllegiance(battle, ch);
  const target = battleGetNearestAttackable(battle, allegiance);

  if (target) {
    beginAction(battle, bCh);

    // jump to one tile closer towards the center of target
    const startPoint = characterGetPos(ch);
    const endPoint = characterGetPos(target.ch);
    endPoint[0] -=
      ((Math.abs(endPoint[0] - battle.room.width) /
        (endPoint[0] - battle.room.width)) *
        32) /
      2;
    const transform = new Transform(
      startPoint,
      endPoint,
      250,
      TransformEase.LINEAR,
      transformOffsetJump
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
      applyDamage(battle, bCh, target);
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
};
