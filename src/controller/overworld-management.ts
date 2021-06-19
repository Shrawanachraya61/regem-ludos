import {
  roomAddParticle,
  roomGetTileBelow,
  Tile,
  roomGetTileAt,
  roomAddCharacter,
  Room,
  TriggerActivator,
  roomRemoveProp,
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
  overworldShow,
} from 'model/overworld';
import { Point3d, timeoutPromise } from 'utils';
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
import {
  hideSections,
  setCharacterText,
  showMenu,
  showSection,
  showSettings,
} from 'controller/ui-actions';
import { AppSection } from 'model/store';
import {
  isAuxKey,
  isCancelKey,
  isConfirmKey,
  popKeyHandler,
  pushEmptyKeyHandler,
  pushKeyHandler,
} from 'controller/events';
import HudGamepad from 'lib/hud-gamepad';
import { pause, unpause } from './loop';
import { getImageDataScreenshot } from 'view/draw';
import { getCanvas } from 'model/canvas';
import {
  sceneHasTreasureBeenAcquired,
  sceneSetCurrentOverworld,
  sceneSetTreasureAcquired,
} from 'model/scene';
import { RenderObject } from 'model/render-object';

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

    for (let i = 0; i < room.props.length; i++) {
      const prop = room.props[i];
      if (
        prop.isItem &&
        sceneHasTreasureBeenAcquired(getCurrentScene(), prop.id, overworld.name)
      ) {
        roomRemoveProp(room, prop);
      }
    }

    setCurrentRoom(room);
    setCurrentPlayer(player);
    setCurrentOverworld(overworld);
    setRenderBackgroundColor(template.backgroundColor);

    const scene = getCurrentScene();
    sceneSetCurrentOverworld(scene, template.roomName);

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

    overworldShow(overworld);

    console.log('initiateOverworld trigger', overworld.loadTriggerName);
    if (overworld.loadTriggerName) {
      try {
        console.log('Invoke overworld trigger');

        callScript(getCurrentScene(), overworld.loadTriggerName);

        // const scriptCaller = invokeTrigger(
        //   getCurrentScene(),
        //   overworld.loadTriggerName,
        //   TriggerType.ACTION
        // );
        // if (scriptCaller !== null) {
        //   console.log('calling script caller');
        //   callTriggerScriptCaller(scriptCaller);
        // } else {
        //   console.log(
        //     'no overworld script caller found for trigger:',
        //     overworld.loadTriggerName,
        //     'action'
        //   );
        // }
      } catch (e) {
        console.error(e);
      }
    }

    overworld.playerIsCollidingWithInteractable = true;

    return overworld;
  }
  return null;
};

export const enableOverworldControl = () => {
  pushKeyHandler(overworldKeyHandler);
};

interface IOverworldScriptParams {
  disableKeys: boolean;
  hideUi: boolean;
  setPlayerIdle: boolean;
}

export const callScriptDuringOverworld = async (
  scriptName: string,
  params: IOverworldScriptParams,
  ...args: any[]
) => {
  const overworld = getCurrentOverworld();
  overworldDisableTriggers(overworld);
  if (params.disableKeys) {
    disableKeyUpdate();
  }
  if (params.hideUi) {
    hideSections();
  }
  if (params.setPlayerIdle) {
    characterSetAnimationState(getCurrentPlayer().leader, AnimationState.IDLE);
  }
  await callScript(getCurrentScene(), scriptName, args);
  const possiblyDifferentOverworld = getCurrentOverworld();
  overworldEnableTriggers(possiblyDifferentOverworld);
  if (params.disableKeys) {
    enableKeyUpdate();
  }
  if (params.hideUi && possiblyDifferentOverworld.visible) {
    showSection(AppSection.Debug, true);
  }
};

const callTriggerScriptCaller = async (
  scriptCaller: () => Promise<void>,
  params: IOverworldScriptParams
) => {
  const overworld = getCurrentOverworld();
  overworldDisableTriggers(overworld);
  if (params.disableKeys) {
    disableKeyUpdate();
  }
  if (params.hideUi) {
    hideSections();
  }
  if (params.setPlayerIdle) {
    characterSetAnimationState(getCurrentPlayer().leader, AnimationState.IDLE);
  }
  await scriptCaller();
  const possiblyDifferentOverworld = getCurrentOverworld();
  overworldEnableTriggers(possiblyDifferentOverworld);
  if (params.disableKeys) {
    enableKeyUpdate();
  }
  if (params.hideUi && possiblyDifferentOverworld.visible) {
    showSection(AppSection.Debug, true);
  }
};

const getScriptCallerForTrigger = (
  name: string,
  type: TriggerType,
  dontTriggerOnce?: boolean
) => {
  const scriptCaller = invokeTrigger(
    getCurrentScene(),
    name,
    type,
    dontTriggerOnce
  );
  return scriptCaller;
};

const getCurrentlyCollidedTriggerActivators = (): TriggerActivator[] => {
  const player = getCurrentPlayer();
  const room = getCurrentRoom();
  const leader = player.leader;
  const ret: TriggerActivator[] = [];

  for (let i = 0; i < room.triggerActivators.length; i++) {
    const ta = room.triggerActivators[i];
    if (characterCollidesWithRect(leader, [ta.x, ta.y, ta.width, ta.height])) {
      ret.push(ta);
    }
  }
  return ret;
};

const isCollidingWithTriggersOfType = (types: TriggerType[]) => {
  const activators = getCurrentlyCollidedTriggerActivators();
  for (let i = 0; i < activators.length; i++) {
    const ta = activators[i];
    for (let j = 0; j < types.length; j++) {
      const type = types[j];
      const scriptCaller = getScriptCallerForTrigger(ta.name, type, true);
      if (scriptCaller) {
        return true;
      }
    }
  }
  return false;
};

const checkAndCallTriggerOfType = async (
  typeOrTypes: TriggerType | TriggerType[]
): Promise<string> => {
  const player = getCurrentPlayer();
  const leader = player.leader;

  const types = Array.isArray(typeOrTypes) ? typeOrTypes : [typeOrTypes];
  const activators = getCurrentlyCollidedTriggerActivators();
  for (let i = 0; i < activators.length; i++) {
    const ta = activators[i];
    for (let j = 0; j < types.length; j++) {
      const type = types[j];
      const scriptCaller = getScriptCallerForTrigger(ta.name, type);
      if (scriptCaller !== null) {
        if (type === TriggerType.ACTION || type === TriggerType.STEP_FIRST) {
          characterSetAnimationState(leader, AnimationState.IDLE);
        }
        await callTriggerScriptCaller(scriptCaller, {
          hideUi: false,
          disableKeys: true,
          setPlayerIdle: false,
        });
        return ta.name;
      }
    }
  }

  return '';
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
        await callTriggerScriptCaller(scriptCaller, {
          hideUi: true,
          disableKeys: true,
          setPlayerIdle: true,
        });
        characterStartAi(ch);
        return true;
      }
    }
  }
  return false;
};

const checkAndCallTreasure = async (): Promise<boolean> => {
  const player = getCurrentPlayer();
  const room = getCurrentRoom();
  const leader = player.leader;
  const scene = getCurrentScene();

  for (let i = 0; i < room.props.length; i++) {
    const prop = room.props[i];
    if (!prop.isItem) {
      continue;
    }
    const { x, y } = prop;
    // prop sprite is 64 px tall, offsets check if Ada's feet are kinda in the middle of the
    // sprite radius
    if (characterCollidesWithPoint(leader, [x + 32 + 12, y + 32 + 12, 16])) {
      // hack: looks weird for some reason without this delay
      setTimeout(() => {
        roomRemoveProp(room, prop);
      }, 100);

      await callScriptDuringOverworld(
        'utils-get-treasure',
        {
          disableKeys: true,
          hideUi: true,
          setPlayerIdle: true,
        },
        prop.itemName
      );

      const overworld = getCurrentOverworld();
      sceneSetTreasureAcquired(scene, prop.id, overworld.name);
      return true;
    }
  }
  return false;
};

export const overworldKeyHandler = async (ev: KeyboardEvent) => {
  const overworld = getCurrentOverworld();
  const isPaused = getIsPaused();

  if (isCancelKey(ev.key)) {
    if (!isPaused) {
      pause();
      showMenu(() => {
        unpause();
        showSection(AppSection.Debug, true);
      });
    }
    return;
  }

  if (isConfirmKey(ev.key)) {
    if (!isPaused && overworld.triggersEnabled) {
      if (!(await checkAndCallTriggerOfType(TriggerType.ACTION))) {
        if (!(await checkAndCallTalkTrigger())) {
          await checkAndCallTreasure();
        }
      }
    }
    return;
  }

  if (isAuxKey(ev.key)) {
    if (!isPaused) {
      pause();
      showSettings(() => {
        showSection(AppSection.Debug, true);
        unpause();
      });
    }
    return;
  }

  switch (ev.key) {
    case ' ': {
      if (isPaused) {
        unpause();
      } else {
        pause();
      }
      break;
    }
    case 'b': {
      if (getKeyUpdateEnabled()) {
        console.log('DISABLE KEYS');
        disableKeyUpdate();
        // await callScript(getCurrentScene(), 'floor1-Skye_intro');
        await callScript(getCurrentScene(), 'test-combat');
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
    // case 'l': {
    //   if (getTriggersVisible()) {
    //     hideTriggers();
    //     hideMarkers();
    //   } else {
    //     showTriggers();
    //     showMarkers();
    //   }
    //   break;
    // }
    case 's': {
      if (getKeyUpdateEnabled()) {
        callScriptDuringOverworld('intro', {
          disableKeys: true,
          hideUi: true,
          setPlayerIdle: true,
        });
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

export const callStepTriggers = async (overworld: Overworld) => {
  const isStandingOnActiveStepTrigger = isCollidingWithTriggersOfType([
    TriggerType.STEP_FIRST,
    TriggerType.STEP,
  ]);

  if (isStandingOnActiveStepTrigger) {
    if (overworld.playerIsCollidingWithInteractable) {
      await checkAndCallTriggerOfType(TriggerType.STEP);
    } else {
      await checkAndCallTriggerOfType([
        TriggerType.STEP_FIRST,
        TriggerType.STEP,
      ]);
    }
  }

  if (
    isStandingOnActiveStepTrigger !==
    overworld.playerIsCollidingWithInteractable
  ) {
    if (!isStandingOnActiveStepTrigger) {
      setCharacterText('');
    }
  }
  overworld.playerIsCollidingWithInteractable =
    !!getCurrentScene().currentScript || isStandingOnActiveStepTrigger;
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

  if (overworld.triggersEnabled && overworld.stepTimer.isComplete()) {
    callStepTriggers(overworld);
    overworld.stepTimer.start();
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
