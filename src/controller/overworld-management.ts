import {
  roomAddParticle,
  roomGetTileBelow,
  Tile,
  roomGetTileAt,
  roomAddCharacter,
  Room,
  TriggerActivator,
  roomRemoveProp,
  roomDoCharactersOccupySameTile,
  roomGetEmptyAdjacentTile,
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
  getCharactersWithSuspendedAi,
  removeCharacterWithSuspendedAi,
  isOverworldUpdateKeysDisabled,
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
import { Point3d, tileToWorldCoords, timeoutPromise } from 'utils';
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
  characterSetWalkTarget,
  characterSetWalkTargetAsync,
  characterCollidesWithOther,
} from 'model/character';
import {
  invokeTrigger,
  callScript,
  createAndCallScript,
  sceneIsPlaying,
} from 'controller/scene-management';
import { setCharacterAtMarker } from 'controller/scene-commands';
import { scriptExists, TriggerType } from 'lib/rpgscript';
import {
  hideSection,
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
  isPauseKey,
  popKeyHandler,
  pushEmptyKeyHandler,
  pushKeyHandler,
} from 'controller/events';
import { pause, unpause } from './loop';
import { getImageDataScreenshot } from 'view/draw';
import { getCanvas } from 'model/canvas';
import {
  sceneHasTreasureBeenAcquired,
  sceneSetCurrentOverworld,
  sceneSetTreasureAcquired,
} from 'model/scene';
import { RenderObject } from 'model/render-object';
import { Timer } from 'model/utility';
import { createEmotionBubbleParticle } from 'model/particle';
import { EmotionBubble } from 'db/particles';
import { getUiInterface, uiInterface } from 'view/ui';
import { playMusic, playSoundName } from 'model/sound';

let overworldKeysDisabledOnLoadVal = false;

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

    const bgTransform = room.bgTransform;
    const restartBgTransform = () => {
      bgTransform.timer = new Timer(bgTransform.timer.duration);
      bgTransform.timer.awaits.push(restartBgTransform);
      bgTransform.timer.start();
    };
    bgTransform.timer.awaits.push(restartBgTransform);
    bgTransform.timer.start();

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
        if (scriptExists(overworld.loadTriggerName)) {
          callScriptDuringOverworld(overworld.loadTriggerName as string, {
            disableKeys: true,
            hideUi: false,
            setPlayerIdle: true,
            pause: false,
          });
        } else {
          console.log(
            'WARNING overworld load trigger script does not exist:',
            overworld.loadTriggerName
          );
        }
      } catch (e) {
        console.error(e);
      }
    }

    overworld.playerIsCollidingWithInteractable = true;
    if (overworld.music) {
      playMusic(overworld.music, true, 500);
    }

    overworldKeysDisabledOnLoadVal = true;
    setTimeout(() => {
      overworldKeysDisabledOnLoadVal = false;
    }, 500);

    return overworld;
  }
  return null;
};

const shouldShowOverworldUi = () => {
  const visibleSections = getUiInterface().appState.sections;
  return (
    getCurrentOverworld().visible &&
    !visibleSections.includes(AppSection.ArcadeCabinet) &&
    !visibleSections.includes(AppSection.Debug)
  );
};

export const enableOverworldControl = () => {
  pushKeyHandler(overworldKeyHandler);
};

export const pauseOverworldAi = () => {
  const overworld = getCurrentOverworld();
  if (overworld) {
    const room = overworld.room;
    room.characters.forEach(ch => {
      characterStopAi(ch);
    });
  }
};

export const resumeOverworldAi = () => {
  const overworld = getCurrentOverworld();
  if (overworld) {
    const room = overworld.room;
    room.characters.forEach(ch => {
      characterStartAi(ch);
    });
  }
};

interface IOverworldScriptParams {
  disableKeys: boolean;
  hideUi: boolean;
  setPlayerIdle: boolean;
  pause?: boolean;
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
  if (params.pause) {
    pause();
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
  const overworld = getCurrentOverworld();
  const activators = overworld.collidingTriggerActivators; //getCurrentlyCollidedTriggerActivators();
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

  const overworld = getCurrentOverworld();
  const activators = overworld.collidingTriggerActivators;
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
        if (
          type === TriggerType.ACTION &&
          getCurrentOverworld().visible &&
          !getUiInterface().appState.sections.includes(AppSection.ArcadeCabinet)
        ) {
          console.log('SHOW SECTION AFTER CALLING A TRIGGER');
          showSection(AppSection.Debug, false);
        }
        const charactersWithSuspendedAi = getCharactersWithSuspendedAi();
        charactersWithSuspendedAi.forEach(ch => {
          characterStartAi(ch);
          removeCharacterWithSuspendedAi(ch);
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
    if (ch.talkTrigger && characterCollidesWithPoint(leader, [chX, chY, 16])) {
      const scriptCaller = invokeTrigger(
        getCurrentScene(),
        ch.talkTrigger,
        TriggerType.ACTION
      );
      if (scriptCaller !== null) {
        characterStopAi(ch);

        if (
          roomDoCharactersOccupySameTile(room, ch, leader) ||
          characterCollidesWithOther(ch, leader)
        ) {
          const tile = roomGetEmptyAdjacentTile(room, ch, leader);
          if (tile) {
            await characterSetWalkTargetAsync(
              leader,
              tileToWorldCoords(tile.x, tile.y)
            );
          }
        }
        // playSoundName('dialog_start');
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
      roomRemoveProp(room, prop);
      await callScriptDuringOverworld(
        'utils-get-treasure',
        {
          disableKeys: true,
          hideUi: true,
          setPlayerIdle: true,
          pause: false,
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

  if (
    isOverworldUpdateKeysDisabled() ||
    !getUiInterface().appState.sections.includes(AppSection.Debug) ||
    getUiInterface().appState.sections.includes(AppSection.Menu) ||
    overworldKeysDisabledOnLoadVal
  ) {
    return;
  }

  if (isCancelKey(ev.key)) {
    if (!isPaused) {
      pause();
      showMenu(() => {
        unpause();
        hideSection(AppSection.Menu);
      });
    }
    return;
  }

  if (isConfirmKey(ev.key)) {
    if (!isPaused && overworld.triggersEnabled) {
      if (await checkAndCallTriggerOfType(TriggerType.ACTION)) {
        if (shouldShowOverworldUi()) {
          showSection(AppSection.Debug, true);
        }
        return;
      } else if (await checkAndCallTreasure()) {
        showSection(AppSection.Debug, true);
        return;
      } else if (await checkAndCallTalkTrigger()) {
        // don't need this, show section called from talk trigger
        // showSection(AppSection.Debug, true);
        return;
      }
    }
    return;
  }

  if (isAuxKey(ev.key)) {
    if (!isPaused) {
      pause();
      showSettings(() => {
        const isCutsceneRunning = sceneIsPlaying(getCurrentScene());
        if (!isCutsceneRunning) {
          showSection(AppSection.Debug, true);
        }
        unpause();
      });
    }
    return;
  }

  switch (ev.key) {
    // case ' ': {
    //   if (isPaused) {
    //     unpause();
    //   } else {
    //     pause();
    //   }
    //   break;
    // }
    case 'm': {
      const room = getCurrentRoom();
      const player = getCurrentPlayer();
      const particle = createEmotionBubbleParticle(
        player.leader,
        EmotionBubble.BLUSH
      );
      roomAddParticle(room, particle);
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
      if (shouldShowOverworldUi()) {
        showSection(AppSection.Debug, true);
      }
    } else {
      await checkAndCallTriggerOfType([
        TriggerType.STEP_FIRST,
        TriggerType.STEP,
      ]);
      if (shouldShowOverworldUi()) {
        showSection(AppSection.Debug, true);
      }
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

export const callStepOffTriggers = async (overworld: Overworld) => {
  for (
    let i = 0;
    i < overworld.previouslyCollidingTriggerActivators.length;
    i++
  ) {
    const prevTa = overworld.previouslyCollidingTriggerActivators[i];
    if (!overworld.collidingTriggerActivators.includes(prevTa)) {
      const scriptCaller = getScriptCallerForTrigger(
        prevTa.name,
        TriggerType.STEP_OFF
      );
      if (scriptCaller !== null) {
        await callTriggerScriptCaller(scriptCaller, {
          hideUi: false,
          disableKeys: true,
          setPlayerIdle: false,
        });
        // if (type === TriggerType.ACTION) {
        //   showSection(AppSection.Debug, false);
        // }
        // return ta.name;
      }
      // await checkAndCallTriggerOfType(TriggerType.STEP_OFF);
    }
  }
};

export const updateOverworld = (overworld: Overworld): void => {
  const player = getCurrentPlayer();
  const leader = player.leader;

  if (!overworld.visible) {
    overworld.previouslyCollidingTriggerActivators = [];
    overworld.collidingTriggerActivators = [];
    return;
  }
  overworld.previouslyCollidingTriggerActivators =
    overworld.collidingTriggerActivators;
  overworld.collidingTriggerActivators = getCurrentlyCollidedTriggerActivators();

  let isMoving = false;
  let vx = 0;
  let vy = 0;
  if (getKeyUpdateEnabled() && !isOverworldUpdateKeysDisabled()) {
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

    if (isMoving || leader.walkTarget) {
      characterSetAnimationState(leader, AnimationState.WALK);
    } else if (!isOverworldUpdateKeysDisabled()) {
      characterSetAnimationState(leader, AnimationState.IDLE);
    }
    leader.vx = vx;
    leader.vy = vy;
  }

  if (overworld.triggersEnabled && overworld.stepTimer.isComplete()) {
    callStepTriggers(overworld);
    overworld.stepTimer.start();
  }
  // cant use step timer for this cuz the colliding triggers updates every frame.
  if (overworld.triggersEnabled) {
    callStepOffTriggers(overworld);
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
