import {
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
  setRenderBackgroundColor,
  getTriggersVisible,
  hideMarkers,
  hideTriggers,
  showMarkers,
  showTriggers,
  getIsPaused,
} from 'model/generics';
import { Player } from 'model/player';
import {
  Overworld,
  OverworldCharacter,
  overworldDisableTriggers,
  overworldEnableTriggers,
  OverworldTemplate,
  createOverworldFromTemplate,
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
  characterStopAi,
  characterStartAi,
} from 'model/character';
import {
  invokeTrigger,
  callScript,
  createAndCallScript,
} from 'controller/scene-management';
import { setCharacterAtMarker } from 'controller/scene-commands';
import { TriggerType } from 'lib/rpgscript';
import { showSection } from 'controller/ui-actions';
import { AppSection } from 'model/store';
import { pushKeyHandler } from 'controller/events';
import HudGamepad from 'lib/hud-gamepad';
import { pause, unpause } from './loop';
import { getImageDataScreenshot } from 'view/draw';
import { getCanvas } from 'model/canvas';

export const initiateOverworld = (
  player: Player,
  template: OverworldTemplate,
  markerName?: string
): Overworld | null => {
  const overworld = createOverworldFromTemplate(template);

  if (overworld) {
    const room = overworld.room;
    const leader = player.leader;
    roomAddCharacter(room, leader);

    setCurrentRoom(room);
    setCurrentPlayer(player);
    setCurrentOverworld(overworld);
    setRenderBackgroundColor(template.backgroundColor);

    const markerForPos = markerName ? room.markers[markerName] : null;

    if (markerForPos) {
      characterSetPos(leader, [markerForPos.x, markerForPos.y, 0]);
    } else {
      const marker = room.markers.MarkerPlayer;
      if (marker) {
        setCharacterAtMarker(leader.name, 'MarkerPlayer');
      } else {
        characterSetPos(leader, [0, 0, 0]);
      }
    }

    pushKeyHandler(overworldKeyHandler);

    if (overworld.loadTriggerName) {
      const scriptCaller = invokeTrigger(
        getCurrentScene(),
        overworld.loadTriggerName,
        TriggerType.ACTION
      );
      if (scriptCaller !== null) {
        callTriggerScriptCaller(scriptCaller);
      }
    }

    return overworld;
  }
  return null;
};

const callTriggerScriptCaller = async (scriptCaller: () => Promise<void>) => {
  const overworld = getCurrentOverworld();
  overworldDisableTriggers(overworld);
  disableKeyUpdate();
  await scriptCaller();
  overworldEnableTriggers(overworld);
  enableKeyUpdate();
  if (overworld.visible) {
    showSection(AppSection.Debug, true);
  }
};

const checkAndCallTriggerOfType = async (
  type: TriggerType
): Promise<boolean> => {
  const player = getCurrentPlayer();
  const room = getCurrentRoom();
  const leader = player.leader;

  for (let i = 0; i < room.triggerActivators.length; i++) {
    const ta = room.triggerActivators[i];
    if (characterCollidesWithRect(leader, [ta.x, ta.y, ta.width, ta.height])) {
      const scriptCaller = invokeTrigger(getCurrentScene(), ta.name, type);
      if (scriptCaller !== null) {
        if (type === TriggerType.ACTION) {
          characterSetAnimationState(leader, AnimationState.IDLE);
        }
        await callTriggerScriptCaller(scriptCaller);
        return true;
      }
    }
  }
  return false;
};

const checkAndCallTalkTrigger = async (): Promise<boolean> => {
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
        characterStopAi(ch);
        characterSetAnimationState(player.leader, AnimationState.IDLE);
        await callTriggerScriptCaller(scriptCaller);
        characterStartAi(ch);
        return true;
      }
    }
  }
  return false;
};

export const overworldKeyHandler = async (ev: KeyboardEvent) => {
  const overworld = getCurrentOverworld();
  const isPaused = getIsPaused();
  switch (ev.key) {
    case ' ': {
      if (isPaused) {
        unpause();
      } else {
        pause();
      }
      break;
    }
    case 'X':
    case 'x': {
      if (overworld.triggersEnabled) {
        if (!(await checkAndCallTriggerOfType(TriggerType.ACTION))) {
          checkAndCallTalkTrigger();
        }
      }
      break;
    }
    case 'b': {
      if (getKeyUpdateEnabled()) {
        console.log('DISABLE KEYS');
        disableKeyUpdate();
        // await callScript(getCurrentScene(), 'floor1-Skye_intro');
        await callScript(getCurrentScene(), 'test-fight');
        if (overworld.visible) {
          showSection(AppSection.Debug, true);
        }
        console.log('ENABLE KEYS');
        enableKeyUpdate();
      }
      break;
    }
    case 'p': {
      disableKeyUpdate();
      await createAndCallScript(
        getCurrentScene(),
        `
        +setConversation('Ada');
        Ada: "You are testing 'createAndCallScript'"
        Ada: "Hopefully you can see me speaking."
        Ada: "This text was not specified in an rpgscript file, but instead in the code directly."
        Ada: "The test will now conclude."
        +endConversation();
      `
      );
      enableKeyUpdate();
      break;
    }
    case 'd': {
      if (getTriggersVisible()) {
        hideTriggers();
        hideMarkers();
      } else {
        showTriggers();
        showMarkers();
      }
      break;
    }
    case 'c': {
      if (getKeyUpdateEnabled()) {
        console.log('DISABLE KEYS');
        disableKeyUpdate();
        // await callScript(getCurrentScene(), 'floor1-Skye_intro');
        await callScript(getCurrentScene(), 'test-awaitChoice');
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
  const leader = player.leader;

  if (!overworld.visible) {
    return;
  }

  const { 'x-dir': xDir, 'y-dir': yDir } = HudGamepad.GamePad.observe();

  let isMoving = false;
  let vx = 0;
  let vy = 0;
  if (getKeyUpdateEnabled()) {
    if (isKeyDown('ArrowLeft') || xDir < 0) {
      isMoving = true;
      vx -= 1;
      vy += 1;
    } else if (isKeyDown('ArrowRight') || xDir > 0) {
      isMoving = true;
      vx += 1;
      vy -= 1;
    }
    if (isKeyDown('ArrowUp') || yDir < 0) {
      isMoving = true;
      vx -= 1;
      vy -= 1;
    } else if (isKeyDown('ArrowDown') || yDir > 0) {
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

  overworld.room.characters.forEach(ch => {
    if (ch.aiEnabled) {
      ch.timers = ch.timers.filter(timer => {
        timer.update();
        if (timer.isComplete()) {
          timer.shouldRemove = true;
          return false;
        }
        return true;
      });

      ch.overworldAi.update(ch);
    }
  });
};
