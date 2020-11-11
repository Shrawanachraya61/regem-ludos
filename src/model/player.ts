import {
  Character,
  characterCreateFromTemplate,
  CharacterTemplate,
} from 'model/character';
import { BattlePosition } from 'model/battle';

export interface Player {
  leader: Character;
  party: Character[];
  battlePositions: { [key: string]: Character[] };
}

export const playerCreate = (leaderTemplate: CharacterTemplate): Player => {
  const leader = characterCreateFromTemplate(leaderTemplate);
  const player = {
    leader,
    party: [leader],
    battlePositions: {
      [BattlePosition.FRONT]: [leader],
      [BattlePosition.MIDDLE]: [],
      [BattlePosition.BACK]: [],
    },
  };
  return player;
};

export const playerGetBattlePosition = (
  player: Player,
  partyMember: Character
): BattlePosition => {
  if (player.battlePositions[BattlePosition.FRONT].includes(partyMember)) {
    return BattlePosition.FRONT;
  }
  if (player.battlePositions[BattlePosition.MIDDLE].includes(partyMember)) {
    return BattlePosition.MIDDLE;
  }
  if (player.battlePositions[BattlePosition.BACK].includes(partyMember)) {
    return BattlePosition.BACK;
  }
  throw new Error(
    `Cannot get battle position for party member who isn't in the player's party: ${JSON.stringify(
      partyMember
    )}`
  );
};
