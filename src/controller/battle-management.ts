import {
  Battle,
  BattleTemplate,
  BattleTemplateEnemy,
  battleCharacterCreate,
  setCurrentBattle,
} from 'model/battle';
import { characterCreateFromTemplate } from 'model/character';
import { getRoom } from 'model/room';

export const initiateBattle = (template: BattleTemplate): Battle => {
  const battle = {
    room: getRoom(template.roomName),
    enemies: template.enemies.map((t: BattleTemplateEnemy) => {
      const ch = characterCreateFromTemplate(t.chTemplate);
      return battleCharacterCreate(ch, t);
    }),
    allies: [],
  };
  setCurrentBattle(battle);
  return battle;
};
