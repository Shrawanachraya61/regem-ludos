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
  triggersEnabled: boolean;
  characterCollisionEnabled: boolean;
  // triggers: Trigger
}

export interface OverworldCharacter {
  ch: Character;
}

export interface OverworldTemplate {
  roomName: string;
  characters: OverworldCharacter[];
}

export const overworldDisableTriggers = (overworld: Overworld) => {
  overworld.triggersEnabled = false;
};

export const overworldEnableTriggers = (overworld: Overworld) => {
  overworld.triggersEnabled = true;
};

export const overworldCharacterCreate = (
  template: OverworldCharacter
): OverworldCharacter => {
  const oCh = {
    ch: template.ch,
  };

  return oCh;
};
