import {
  Battle,
  BattleTemplate,
  BattleTemplateEnemy,
  battleCharacterCreateEnemy,
  battleCharacterCreateAlly,
  setCurrentBattle,
  battleSetActorPositions,
} from 'model/battle';
import { Character, characterCreateFromTemplate } from 'model/character';
import { getRoom } from 'model/room';
import { setCurrentRoom } from 'model/scene';
import { Player, playerGetBattlePosition } from 'model/player';

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
