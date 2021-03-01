import {
  Character,
  characterCreateFromTemplate,
  CharacterTemplate,
} from 'model/character';
import { BattlePosition } from 'model/battle';
import { removeIfPresent, isoToPixelCoords, Point } from 'utils';

export interface Player {
  leader: Character;
  tokens: number;
  tickets: number;
  backpack: string[];
  party: Character[];
  battlePositions: Record<string, Character[]>;
}

export const playerCreate = (leaderTemplate: CharacterTemplate): Player => {
  const leader = characterCreateFromTemplate(leaderTemplate);
  const player: Player = {
    leader,
    tokens: 0,
    tickets: 0,
    backpack: ['Haptic Bracer'],
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

export const playerAddItem = (player: Player, itemName: string): boolean => {
  player.backpack.push(itemName);
  return true;
};

export const playerRemoveItem = (player: Player, itemName: string): boolean => {
  const ind = player.backpack.indexOf(itemName);
  if (ind > -1) {
    player.backpack.splice(ind, 1);
    return true;
  }
  return false;
};

export const playerHasItem = (player: Player, itemName: string): boolean => {
  const ind = player.backpack.indexOf(itemName);
  if (ind > -1) {
    return true;
  }
  return false;
};

export const playerModifyTokens = (player: Player, amount: number) => {
  player.tokens += amount;
  if (player.tokens < 0) {
    player.tokens = 0;
  }
};

export const playerModifyTickets = (player: Player, amount: number) => {
  player.tickets += amount;
  if (player.tickets < 0) {
    player.tickets = 0;
  }
};
