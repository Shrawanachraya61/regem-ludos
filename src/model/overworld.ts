import { Room } from 'model/room';
import {
  AnimationState,
  Character,
  characterSetAnimationState,
  CharacterTemplate,
} from 'model/character';
import { Trigger } from 'lib/rpgscript';
import { invokeTrigger } from 'controller/scene-management';

export interface Overworld {
  room: Room;
  triggersEnabled: boolean;
  characterCollisionEnabled: boolean;
  loadTriggerName?: string;
  // triggers: Trigger
}

export interface OverworldCharacter {
  ch: Character;
}

export interface OverworldTemplate {
  roomName: string;
  backgroundColor: string;
  loadTriggerName?: string;
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
