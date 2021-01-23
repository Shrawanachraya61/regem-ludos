import {
  Character,
  characterCreateFromTemplate,
  CharacterTemplate,
} from 'model/character';
import { BattlePosition } from 'model/battle';
import { removeIfPresent, isoToPixelCoords, Point } from 'utils';

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

export const playerSetBattlePosition = (
  player: Player,
  ch: Character,
  pos: BattlePosition
): void => {
  removeIfPresent(player.battlePositions[BattlePosition.FRONT], ch);
  removeIfPresent(player.battlePositions[BattlePosition.MIDDLE], ch);
  removeIfPresent(player.battlePositions[BattlePosition.BACK], ch);

  if (player.party.includes(ch)) {
    player.battlePositions[pos].push(ch);
  } else {
    console.error(player, ch, pos);
    throw new Error(
      'Cannot set battle position for player, the given character is not in the party.'
    );
  }
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

export const playerGetCameraOffset = (player: Player): Point => {
  const leader = player.leader;
  const [x, y] = isoToPixelCoords(leader.x, leader.y);
  const roomXOffset = 512 / 2 - x - 16;
  const roomYOffset = 512 / 2 - y;
  return [roomXOffset, roomYOffset];
};
