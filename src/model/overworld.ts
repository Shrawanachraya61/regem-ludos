import { Room } from 'model/room';
import {
  AnimationState,
  Character,
  characterSetAnimationState,
  CharacterTemplate,
} from 'model/character';

export interface Overworld {
  room: Room;
  people: OverworldCharacter[];
  // triggers: Trigger
}

export interface OverworldCharacter {
  ch: Character;
}

export interface OverworldTemplate {
  roomName: string;
  characters: OverworldCharacter[];
}

// export const overworldCreate = (template: OverworldTemplate): Overworld => {
//   const overworld = {

//   };

//   return overworld;
// };

export const overworldCharacterCreate = (
  template: OverworldCharacter
): OverworldCharacter => {
  const oCh = {
    ch: template.ch,
  };

  return oCh;
};
