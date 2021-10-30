import {
  Character,
  characterCreateFromTemplate,
  characterGetLevel,
  CharacterTemplate,
} from 'model/character';
import { BattlePosition } from 'model/battle';
import { removeIfPresent, isoToPixelCoords, Point } from 'utils';
import { getScreenSize } from './canvas';
import { Item, get as getItemStrict, getIfExists as getItem } from 'db/items';

export interface Player {
  leader: Character;
  tokens: number;
  tickets: number;
  backpack: Item[];
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
    backpack: [
      getItemStrict('TrainingSword'),
      getItemStrict('TrainingBow'),
      getItemStrict('TrainingSword'),
      getItemStrict('TrainingSword'),
      getItemStrict('FeeblePotion'),
      getItemStrict('FeeblePotion'),
      getItemStrict('RezGem'),
      getItemStrict('DeVisibleCloak'),
      getItemStrict('ShieldRing'),
      getItemStrict('ZoeBracelet'),
      getItemStrict('HasteFlavoring'),
      // getItemStrict('HapticBracer'),
    ],
    // backpack: [],
    party: [leader],
    battlePositions: [leader],
    partyStorage: [leader],
  };
  return player;
};

export const playerCreateNew = (leaderTemplate: CharacterTemplate): Player => {
  const leader = characterCreateFromTemplate(leaderTemplate);
  const player: Player = {
    leader,
    tokens: 0,
    tickets: 0,
    backpack: [],
    // backpack: [],
    party: [leader],
    battlePositions: [leader],
    partyStorage: [leader],
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
  const roomYOffset = Math.floor(screenH / 2 - y - 16);
  return [roomXOffset, roomYOffset];
};

export const playerAddItem = (player: Player, itemName: string): boolean => {
  const item = getItem(itemName);
  if (item) {
    player.backpack.push(item);
  }
  return true;
};

export const playerRemoveItem = (player: Player, itemName: string): boolean => {
  const ind = player.backpack.findIndex(item => item.name === itemName);
  if (ind > -1) {
    player.backpack.splice(ind, 1);
    return true;
  }
  return false;
};

export const playerHasItem = (player: Player, itemName: string): boolean => {
  const ind = player.backpack.findIndex(item => item.name === itemName);
  if (ind > -1) {
    return true;
  }
  return false;
};

export const playerGetItemCount = (
  player: Player,
  itemName: string
): number => {
  let ct = 0;
  for (let i = 0; i < player.backpack.length; i++) {
    const item = player.backpack[i];
    if (item.name === itemName) {
      ct++;
    }
  }
  return ct;
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

export const playerAddExperience = (player: Player, amount: number) => {
  const charactersWhoLeveledUp: Character[] = [];
  player.partyStorage.forEach(ch => {
    const prevLevel = characterGetLevel(ch);
    ch.experience += amount;
    const postLevel = characterGetLevel(ch);
    if (prevLevel < postLevel) {
      charactersWhoLeveledUp.push(ch);
    }
  });

  return charactersWhoLeveledUp;
};

export const playerAddToActiveParty = (
  player: Player,
  partyMemberName: string
) => {
  const chInStorage = player.partyStorage.find(
    ch => ch.name.toLowerCase() === partyMemberName.toLowerCase()
  );
  if (chInStorage && !player.party.includes(chInStorage)) {
    player.party.push(chInStorage);
  }
  if (chInStorage && !player.battlePositions.includes(chInStorage)) {
    player.battlePositions.push(chInStorage);
  }
};

export const playerRemoveFromActiveParty = (
  player: Player,
  partyMemberName: string
) => {
  const chInStorage = player.partyStorage.find(
    ch => ch.name.toLowerCase() === partyMemberName.toLowerCase()
  );
  const ind = player.party.indexOf(chInStorage as any);
  if (chInStorage && ind > -1) {
    player.party.splice(ind, 1);
  }
  const indBattle = player.battlePositions.indexOf(chInStorage as any);
  if (chInStorage && indBattle > -1) {
    player.battlePositions.splice(indBattle, 1);
  }
};
