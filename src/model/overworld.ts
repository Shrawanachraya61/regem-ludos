import { Room, roomShow, roomHide } from 'model/room';
import {
  AnimationState,
  Character,
  characterSetAnimationState,
  CharacterTemplate,
} from 'model/character';
import { Trigger } from 'lib/rpgscript';
import { invokeTrigger } from 'controller/scene-management';
import { Timer } from './utility';
import { getRoom } from 'db/overworlds';

export interface Overworld {
  room: Room;
  visible: boolean;
  triggersEnabled: boolean;
  characterCollisionEnabled: boolean;
  playerIsCollidingWithInteractable: boolean;
  loadTriggerName?: string;
  timers: Timer[];
  stepTimer: Timer;
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

export const createOverworldFromTemplate = (
  template: OverworldTemplate
): Overworld | null => {
  const room = getRoom(template.roomName);
  if (!room) {
    console.error(
      'Cannot initiate overworld, no room exists with name: ',
      template.roomName
    );
    return null;
  }

  const overworld: Overworld = {
    room,
    visible: true,
    triggersEnabled: true,
    characterCollisionEnabled: true,
    playerIsCollidingWithInteractable: false,
    loadTriggerName: template.loadTriggerName,
    timers: [] as Timer[],
    stepTimer: new Timer(50),
  };
  overworld.stepTimer.start();
  return overworld;
};

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

export const overworldShow = (overworld: Overworld) => {
  overworld.visible = true;
  roomShow(overworld.room);
};

export const overworldHide = (overworld: Overworld) => {
  overworld.visible = false;
  roomHide(overworld.room);
};
