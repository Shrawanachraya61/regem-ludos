import {
  Battle,
  BattleTemplate,
  BattleTemplateEnemy,
  BattleAllegiance,
  battleCharacterCreateEnemy,
  battleCharacterCreateAlly,
  setCurrentBattle,
  battleSetActorPositions,
  battleGetAllegiance,
  battleGetNearestAttackable,
} from 'model/battle';
import {
  AnimationState,
  Character,
  characterCreateFromTemplate,
  characterGetAnimation,
  characterGetPos,
  characterSetAnimationState,
  characterSetTransform,
} from 'model/character';
import { getRoom } from 'model/room';
import { setCurrentRoom } from 'model/scene';
import { Player, playerGetBattlePosition } from 'model/player';
import { Transform, TransformEase } from 'model/transform';

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

export const attack = async (battle: Battle, ch: Character): Promise<void> => {
  const allegiance = battleGetAllegiance(battle, ch);
  const target = battleGetNearestAttackable(battle, allegiance);
  if (target) {
    const startPoint = characterGetPos(ch);
    const endPoint = characterGetPos(target.ch);
    const transform = new Transform(
      startPoint,
      endPoint,
      500,
      TransformEase.LINEAR
    );
    characterSetTransform(ch, transform);
    characterSetAnimationState(ch, AnimationState.BATTLE_JUMP);
    await transform.timer.onCompletion();
    characterSetAnimationState(ch, AnimationState.BATTLE_ATTACK);
    const anim = characterGetAnimation(ch);
    await anim.onCompletion();
    const transform2 = new Transform(
      endPoint,
      startPoint,
      500,
      TransformEase.LINEAR
    );
    characterSetTransform(ch, transform2);
    await transform2.timer.onCompletion();
    transform2.markForRemoval();
  }
};
