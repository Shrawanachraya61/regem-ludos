import {
  getRoom,
  roomAddParticle,
  roomGetTileBelow,
  Tile,
  roomGetTileAt,
  roomAddCharacter,
} from 'model/room';
import {
  setCurrentRoom,
  getCurrentRoom,
  setCurrentOverworld,
  setCurrentPlayer,
  getCurrentPlayer,
  isKeyDown,
  getFrameMultiplier,
  getKeyUpdateEnabled,
  getCurrentScene,
  enableKeyUpdate,
  disableKeyUpdate,
  getCurrentOverworld,
} from 'model/generics';
import { Player } from 'model/player';
import {
  Overworld,
  OverworldCharacter,
  overworldDisableTriggers,
  overworldEnableTriggers,
  OverworldTemplate,
} from 'model/overworld';
import { Point3d } from 'utils';
import {
  characterSetAnimationState,
  characterSetFacing,
  characterSetPos,
  Facing,
  AnimationState,
  characterGetPosBottom,
  characterCollidesWithPoint,
  characterCollidesWithRect,
} from 'model/character';
import { invokeTrigger, callScript } from './scene-management';
import { TriggerType } from 'lib/rpgscript';
import { showSection } from './ui-actions';
import { AppSection } from 'model/store';
import { pushKeyHandler } from './events';

export const initiateOverworld = (
  player: Player,
  template: OverworldTemplate,
  playerPos?: Point3d
): Overworld => {
  const room = getRoom(template.roomName);
  const leader = player.leader;
  const oChLeader: OverworldCharacter = {
    ch: leader,
  };

  if (playerPos) {
    characterSetPos(leader, playerPos);
  } else {
    characterSetPos(leader, [0, 0, 0]);
  }

  // room.characters.push(leader);
  roomAddCharacter(room, leader);

  const overworld = {
    room,
    people: [oChLeader],
    triggersEnabled: true,
    characterCollisionEnabled: true,
  };

  setCurrentRoom(room);
  setCurrentPlayer(player);
  setCurrentOverworld(overworld);

  pushKeyHandler(overworldKeyHandler);
  return overworld;
};

const checkAndCallTriggerOfType = async (
  type: TriggerType
): Promise<boolean> => {
  const overworld = getCurrentOverworld();
  const player = getCurrentPlayer();
  const room = getCurrentRoom();
  const leader = player.leader;

  for (let i = 0; i < room.triggerActivators.length; i++) {
    const ta = room.triggerActivators[i];
    if (characterCollidesWithRect(leader, [ta.x, ta.y, ta.width, ta.height])) {
      const scriptCaller = invokeTrigger(getCurrentScene(), ta.name, type);
      if (scriptCaller !== null) {
        overworldDisableTriggers(overworld);
        disableKeyUpdate();
        characterSetAnimationState(leader, AnimationState.IDLE);
        await scriptCaller();
        overworldEnableTriggers(overworld);
        enableKeyUpdate();
        showSection(AppSection.Debug, true);
        return true;
      }
    }
  }
  return false;
};

const checkAndCallTalkTrigger = async (): Promise<boolean> => {
  const overworld = getCurrentOverworld();
  const player = getCurrentPlayer();
  const room = getCurrentRoom();
  const leader = player.leader;

  for (let i = 0; i < room.characters.length; i++) {
    const ch = room.characters[i];
    const [chX, chY] = characterGetPosBottom(ch);
    if (ch.talkTrigger && characterCollidesWithPoint(leader, [chX, chY, 25])) {
      const scriptCaller = invokeTrigger(
        getCurrentScene(),
        ch.talkTrigger,
        TriggerType.ACTION
      );
      if (scriptCaller !== null) {
        overworldDisableTriggers(overworld);
        disableKeyUpdate();
        characterSetAnimationState(leader, AnimationState.IDLE);
        await scriptCaller();
        overworldEnableTriggers(overworld);
        enableKeyUpdate();
        showSection(AppSection.Debug, true);
        return true;
      }
    }
  }
  return false;
};

export const overworldKeyHandler = async (ev: KeyboardEvent) => {
  const overworld = getCurrentOverworld();
  switch (ev.key) {
    case ' ': {
      if (overworld.triggersEnabled) {
        if (!(await checkAndCallTriggerOfType(TriggerType.ACTION))) {
          checkAndCallTalkTrigger();
        }
      }
      break;
    }
    case 'c': {
      if (getKeyUpdateEnabled()) {
        console.log('DISABLE KEYS');
        disableKeyUpdate();
        // await callScript(getCurrentScene(), 'floor1-Skye_intro');
        await callScript(getCurrentScene(), 'test-setConversation2');
        showSection(AppSection.Debug, true);
        console.log('ENABLE KEYS');
        enableKeyUpdate();
      }
      break;
    }
  }
};

const getFacingFromKeyState = (): Facing => {
  if (isKeyDown('ArrowLeft') && isKeyDown('ArrowUp')) {
    return Facing.LEFT_UP;
  } else if (isKeyDown('ArrowLeft') && isKeyDown('ArrowDown')) {
    return Facing.LEFT_DOWN;
  } else if (isKeyDown('ArrowRight') && isKeyDown('ArrowUp')) {
    return Facing.RIGHT_UP;
  } else if (isKeyDown('ArrowRight') && isKeyDown('ArrowDown')) {
    return Facing.RIGHT_DOWN;
  } else if (isKeyDown('ArrowLeft')) {
    return Facing.LEFT;
  } else if (isKeyDown('ArrowRight')) {
    return Facing.RIGHT;
  } else if (isKeyDown('ArrowUp')) {
    return Facing.UP;
  } else if (isKeyDown('ArrowDown')) {
    return Facing.DOWN;
  } else {
    return Facing.DOWN;
  }
};

export const updateOverworld = (overworld: Overworld): void => {
  const player = getCurrentPlayer();
  const room = getCurrentRoom();
  const leader = player.leader;

  let isMoving = false;
  let vx = 0;
  let vy = 0;
  if (getKeyUpdateEnabled()) {
    if (isKeyDown('ArrowLeft')) {
      isMoving = true;
      vx -= 1;
      vy += 1;
    } else if (isKeyDown('ArrowRight')) {
      isMoving = true;
      vx += 1;
      vy -= 1;
    }
    if (isKeyDown('ArrowUp')) {
      isMoving = true;
      vx -= 1;
      vy -= 1;
    } else if (isKeyDown('ArrowDown')) {
      isMoving = true;
      vx += 1;
      vy += 1;
    }

    if (isMoving) {
      characterSetAnimationState(leader, AnimationState.WALK);
    } else {
      characterSetAnimationState(leader, AnimationState.IDLE);
    }
    leader.vx = vx;
    leader.vy = vy;
  }

  if (overworld.triggersEnabled) {
    checkAndCallTriggerOfType(TriggerType.STEP);
  }
};
