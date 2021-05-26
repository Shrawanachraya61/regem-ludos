import {
  Character,
  characterCreateFromTemplate,
  CharacterTemplate,
} from 'model/character';
import { BattlePosition } from 'model/battle';
import { removeIfPresent, isoToPixelCoords, Point } from 'utils';
import { getScreenSize } from './canvas';

export interface Player {
  leader: Character;
  tokens: number;
  tickets: number;
  backpack: string[];
  party: Character[];
  partyStorage: Character[];
  battlePositions: (Character | undefined)[];
}

export const playerCreate = (leaderTemplate: CharacterTemplate): Player => {
  const leader = characterCreateFromTemplate(leaderTemplate);
  const player: Player = {
    leader,
    tokens: 99,
    tickets: 99,
    // backpack: ['Haptic Bracer'],
    backpack: [],
    party: [leader],
    battlePositions: [leader],
    partyStorage: [],
  };
  return player;
};

export const playerSetBattlePosition = (
  player: Player,
  ch: Character,
  pos: BattlePosition
): void => {
  removeIfPresent(player.battlePositions, ch);
  if (pos === BattlePosition.FRONT) {
    player.battlePositions.unshift(ch);
  } else {
    player.battlePositions.push(ch);
  }
};

export const playerGetBattlePosition = (
  player: Player,
  partyMember: Character
): BattlePosition => {
  const ind = player.battlePositions.indexOf(partyMember);
  if (ind >= 4) {
    return BattlePosition.BACK;
  } else if (ind >= 2) {
    return BattlePosition.MIDDLE;
  } else {
    return BattlePosition.FRONT;
  }
};

export const playerGetCameraOffset = (player: Player): Point => {
  const leader = player.leader;
  const [x, y] = isoToPixelCoords(leader.x, leader.y);
  const [screenW, screenH] = getScreenSize();
  // HACK: round x because it's odd, floor Y because it's even.  Might not always be the case
  const roomXOffset = Math.round(screenW / 2 - x - 16);
  const roomYOffset = Math.floor(screenH / 2 - y);
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
