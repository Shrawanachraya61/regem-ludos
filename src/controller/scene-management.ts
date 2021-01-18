import {
  Script,
  Trigger,
  CommandBlock,
  Command,
  Conditional,
  ScriptCall,
  TriggerType,
  formatArgs,
  getScript,
  getTrigger,
} from 'lib/rpgscript';
import { Scene, sceneIsWaiting, sceneGetCommands } from 'model/scene';
import { getCurrentOverworld, getCurrentRoom } from 'model/generics';
import { getUiInterface } from 'view/ui';
import {
  setCutsceneText,
  showSection,
  startConversation2,
  startConversation,
  hideSections,
  hideConversation,
  showConversation,
} from 'controller/ui-actions';
import { AppSection, CutsceneSpeaker } from 'model/store';
import { popKeyHandler, pushKeyHandler } from 'controller/events';
import { characterSetFacing, Facing } from 'model/character';
import { roomGetCharacterByName } from 'model/room';

export const updateScene = (scene: Scene): void => {
  if (scene.currentScript && !sceneIsWaiting(scene)) {
    let cmd: Command | null = null;
    while ((cmd = scene.currentScript.getNextCommand()) !== null) {
      console.log('EVAL', cmd.conditional);
      if (evalCondition(scene, cmd.conditional)) {
        const commands = sceneGetCommands(scene);
        console.log('next cmd', cmd.type, cmd.args);
        const command = commands[cmd.type];
        if (!command) {
          throw new Error(
            `Script runtime error.  No command exists with name '${cmd.type}'`
          );
        }
        if (command(...cmd.args)) {
          break;
        }
      }
    }
    if (cmd === null) {
      console.log(
        `Completed Script '${scene.currentScript.name}' stackLength='${scene.scriptStack.length}'`
      );
      if (scene.onScriptCompleted) {
        scene.onScriptCompleted();
      }
      if (scene.scriptStack.length) {
        const obj = scene.scriptStack.shift();
        if (obj) {
          const { script, onScriptCompleted } = obj;
          scene.currentScript = script;
          scene.onScriptCompleted = onScriptCompleted;
          setTimeout(() => updateScene(scene));
        }
      } else {
        scene.currentScript = null;
        scene.currentTrigger = null;
      }
    }
    // scene.gameInterface.render();
  }
};

export const evalCondition = (
  scene: Scene,
  conditional?: Conditional | boolean
) => {
  if (conditional === true) {
    return true;
  } else if (typeof conditional === 'object') {
    const { type, args: originalArgs } = conditional;
    const args = formatArgs(originalArgs).map(arg => {
      if (typeof arg === 'object') {
        return arg;
      }
      const a = arg;
      if (a === 'scene' && scene.currentTrigger) {
        return scene.storage[scene.currentTrigger.name];
      } else if (typeof a === 'string' && a.indexOf('.') > -1) {
        const [a, b] = (arg as string).split('.');
        if (a === 'storage') {
          return scene.storage[b];
        }
        if (!scene.storage[a]) {
          console.error('No storage in scene called:', a);
          return false;
        }
        return scene.storage[a][b];
      } else {
        return arg;
      }
    });
    if (type === 'is') {
      return !!args[0];
    } else if (type === 'isnot') {
      if (typeof args[0] == 'object') {
        return !evalCondition(scene, args[0]);
      } else {
        return !args[0];
      }
    } else if (type === 'gt') {
      return args[0] > args[1];
    } else if (type === 'lt') {
      return args[0] < args[1];
    } else if (type === 'eq') {
      return args[0] === args[1];
    } else if (type === 'any') {
      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (evalCondition(scene, arg)) {
          return true;
        }
      }
      return false;
    } else if (type === 'all') {
      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (!evalCondition(scene, arg)) {
          return false;
        }
      }
      return true;
    } else if (type === 'as') {
      console.error('conditional "as" is not defined for this scene.');
      return false;
    } else if (type === 'once') {
      const arg =
        args[0] ||
        (scene.currentScript || scene.currentTrigger)?.name + '-once';
      if (scene.storageOnceKeys[arg]) {
        return false;
      }
      scene.storageOnceKeys[arg] = true;
      return true;
    } else if (type === 'with') {
      console.error('conditional "with" is not defined for this scene.');
      return false;
    }
    return false;
  }
};

export const callTrigger = async (
  scene: Scene,
  triggerName: string,
  type: TriggerType
) => {
  const trigger = getTrigger(triggerName);
  if (!scene.currentScript && trigger) {
    console.log('CALL TRIGGER', trigger);
    for (let i = 0; i < trigger.scriptCalls.length; i++) {
      const scriptCall = trigger.scriptCalls[i];
      scene.currentTrigger = trigger;
      const c = evalCondition(scene, scriptCall.condition);
      console.log('CONDITION', scriptCall.condition, scriptCall.type, c);
      if (scriptCall.type === type && c) {
        // scene.unsetActiveItem();
        await callScript(scene, scriptCall.scriptName);
        scene.storage[trigger.name] = true;
        break;
      } else {
        scene.currentTrigger = null;
      }
    }
  }
};

export const callScript = async (scene: Scene, scriptName: string) => {
  return new Promise<void>(resolve => {
    const script = getScript(scriptName);
    script.reset();
    if (scene.currentScript) {
      scene.scriptStack.unshift({
        script: scene.currentScript,
        onScriptCompleted: scene.onScriptCompleted,
      });
    }
    scene.currentScript = script;
    scene.onScriptCompleted = resolve;
    updateScene(scene);
  });
};

export const createAndCallScript = (scene: Scene, scriptName: string) => {
  const commands = scene.commands;
  const script = new Script(scriptName, 'internal', -1);
  const block = script.addCommandBlock();
  block.commands = commands.slice();
  script.reset();
  if (scene.currentScript) {
    scene.scriptStack.unshift({
      script: scene.currentScript,
      onScriptCompleted: function () {},
    });
  }
  scene.currentScript = script;
};

export const getSceneCommands = (scene: Scene): Record<string, any> => {
  const playDialogue = (
    actorName: string,
    subtitle: string,
    soundName?: string
  ) => {
    const { cutscene } = getUiInterface().appState;
    let speaker = CutsceneSpeaker.None;
    actorName = actorName.toLowerCase() + '_portrait';
    if (cutscene.portraitLeft === actorName) {
      speaker = CutsceneSpeaker.Left;
    } else if (cutscene.portraitLeft2 === actorName) {
      speaker = CutsceneSpeaker.Left2;
    } else if (cutscene.portraitRight === actorName) {
      speaker = CutsceneSpeaker.Right;
    } else if (cutscene.portraitRight2 === actorName) {
      speaker = CutsceneSpeaker.Right2;
    }
    console.log('play dialog', actorName, subtitle, speaker);
    setCutsceneText(subtitle, speaker);
    return waitForUserInput();
  };
  const setConversation2 = (actorNameLeft: string, actorNameRight: string) => {
    startConversation2(
      `${actorNameLeft.toLowerCase()}_portrait`,
      `${actorNameRight.toLowerCase()}_portrait`
    );
  };
  const setConversation = (actorName: string) => {
    startConversation(`${actorName.toLowerCase()}_portrait`);
  };
  const endConversation = (ms?: number) => {
    setCutsceneText('');
    hideConversation();
    return waitMS(ms ?? 1000, () => {
      showSection(AppSection.Debug, true);
    });
  };
  const pauseConversation = (ms?: number) => {
    hideConversation();
    return waitMS(ms ?? 1000, () => {
      showConversation();
    });
  };
  const setConversationSpeaker = (speaker: CutsceneSpeaker) => {
    setCutsceneText('', speaker);
  };
  const waitMS = (ms: number, cb?: () => void) => {
    scene.isWaitingForTime = true;
    clearTimeout(scene.waitTimeoutId);
    scene.waitTimeoutId = setTimeout(() => {
      scene.isWaitingForTime = false;
      if (cb) {
        cb();
      }
    }, ms) as any;
    return true;
  };
  const waitMSPreemptible = (ms: number, cb: () => void) => {
    const keyHandler = (ev: KeyboardEvent) => {
      switch (ev.key) {
        case 'Return':
        case ' ': {
          clearTimeout(scene.waitTimeoutId);
          popKeyHandler(keyHandler);
          _cb();
          break;
        }
      }
    };
    pushKeyHandler(keyHandler);
    const _cb = () => {
      scene.isWaitingForTime = false;
      if (cb) {
        cb();
      }
      popKeyHandler(keyHandler);
    };
    scene.isWaitingForTime = true;
    clearTimeout(scene.waitTimeoutId);
    scene.waitTimeoutId = setTimeout(_cb, ms) as any;
    return true;
  };
  const waitUntilPreemptible = () => {
    scene.isWaitingForTime = true;
    return () => {
      scene.isWaitingForTime = false;
    };
  };
  const waitForUserInput = (cb?: () => void) => {
    scene.isWaitingForInput = true;

    const keyHandler = (ev: KeyboardEvent) => {
      switch (ev.key) {
        case 'Return':
        case 'Enter':
        case ' ': {
          clearTimeout(scene.waitTimeoutId);
          popKeyHandler(keyHandler);
          _cb();
          break;
        }
      }
    };
    pushKeyHandler(keyHandler);
    const _cb = () => {
      scene.isWaitingForInput = false;
      if (cb) {
        cb();
      }
      popKeyHandler(keyHandler);
    };

    return _cb;
  };
  const setStorage = (key: string, value: string) => {
    scene[key] = value;
  };
  const setFacing = (actorName: string, facing: Facing) => {
    const ch = roomGetCharacterByName(getCurrentRoom(), actorName);
    if (ch) {
      characterSetFacing(ch, facing);
    } else {
      console.error(
        'Cannot set facing, no character named:',
        actorName,
        'facing=',
        facing
      );
    }
  };
  const shakeScreen = (ms?: number) => {
    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer) {
      canvasContainer.className = 'shake';
    }
    return waitMS(ms ?? 1000, () => {
      if (canvasContainer) {
        canvasContainer.className = '';
      }
    });
  };
  return {
    playDialogue,
    setConversation2,
    setConversation,
    endConversation,
    pauseConversation,
    setConversationSpeaker,
    waitMS,
    waitMSPreemptible,
    waitUntilPreemptible,
    waitForUserInput,
    setStorage,
    setFacing,
    shakeScreen,
  };
};

// class Scene {
//   constructor() {
//     scene.storage = {
//       activeItem: '',
//       Rydo: {
//         items: {},
//       },
//       Ferelith: {
//         items: {},
//       },
//     };
//     scene.storageOnceKeys = {};

//     scene.room = null;
//     scene.battle = null;

//     scene.props = [];
//     scene.triggers = [];
//     scene.blockers = [];

//     scene.voiceEnabled = true;
//     scene.isWaitingForAnimation = false;
//     scene.isWaitingForTime = false;
//     scene.waitTimeoutId = 0;
//     scene.isWaitingForInput = false;
//     scene.currentTrigger = null;
//     scene.currentScript = null;
//     scene.scriptStack = [];
//     scene.onScriptCompleted = function () {};

//     // return true to break evaluation of commands (for waiting mostly)

//     const setMode = mode => {
//       scene.gameInterface.setMode(mode);
//     };
//     const save = () => {
//       scene.gameInterface.save();
//     };
//     const restore = () => {
//       scene.gameInterface.restore();
//     };
//     const remove = actorName => {
//       const commands = scene.getCommands();
//       commands.removeActor(actorName);
//     };
//     const removeActor = actorName => {
//       const act = scene.gameInterface.getActor(actorName);
//       if (act) {
//         act.remove();
//       } else {
//         console.error('Cannot get actor to remove', actorName);
//       }
//     };
//     const changeRoom = (roomName, nextMarkerName, direction) => {
//       scene.gameInterface.setRoom(roomName);
//       if (nextMarkerName && direction) {
//         const player = scene.gameInterface.getPlayer();
//         const marker = scene.gameInterface.getMarker(nextMarkerName);
//         if (!marker) {
//           console.error('Could not get marker named', nextMarkerName);
//         }
//         player.setAtWalkPosition(pt(marker.x, marker.y));
//         player.setHeading(direction);
//       }
//     };
//     const playDialogue = (actorName, subtitle, soundName) => {
//       console.log('play dialog', actorName, subtitle, soundName);
//       const commands = scene.getCommands();
//       const actor = scene.gameInterface.getActor(actorName);
//       let ms = null;
//       if (scene.voiceEnabled) {
//         const soundObject = display.getSound(soundName);
//         if (soundObject) {
//           ms = soundObject.soundDuration * 1000;
//         } else {
//           ms = normalizeClamp(subtitle.length, 5, 40, 750, 3000);
//         }
//         actor.sayDialogue(subtitle, soundName);
//       } else {
//         ms = normalizeClamp(subtitle.length, 5, 40, 750, 3000);
//         actor.sayDialogue(subtitle);
//       }
//       // input.setUIInputDisabled(true);
//       return commands.waitMSPreemptible(ms, () => {
//         actor.stopDialogue();
//         // input.setUIInputDisabled(false);
//       });
//     };
//     const playDialogueInterruptable = (actorName, subtitle, soundName) => {
//       const commands = scene.getCommands();
//       const actor = scene.gameInterface.getActor(actorName);
//       let ms = null;
//       if (scene.voiceEnabled) {
//         const soundObject = display.getSound(soundName);
//         if (soundObject) {
//           ms = soundObject.soundDuration * 1000;
//         } else {
//           ms = normalizeClamp(subtitle.length, 5, 40, 750, 3000);
//         }
//         actor.sayDialogue(subtitle, soundName);
//       } else {
//         ms = normalizeClamp(subtitle.length, 5, 40, 750, 3000);
//         actor.sayDialogue(subtitle);
//       }
//       commands.waitMSPreemptible(ms, () => {
//         actor.stopDialogue();
//       });
//     };
//     const playSound = soundName => {
//       const soundObject = display.getSound(soundName);
//       if (soundObject) {
//         display.playSound(soundObject);
//       }
//     };
//     const defaultDialogue = actorName => {};
//     const callScript = scriptName => {
//       scene.callScript(scriptName);
//       return true;
//     };
//     const setStorage = (key, value) => {};
//     const setStorageOnce = (key, value) => {
//       if (scene.storage[key] === undefined) {
//         scene.storage[key] = value;
//       }
//     };
//     const walkTowards = (x, y, time) => {};
//     const addActor = (actorName, x, y) => {};
//     const addActorAtMarker = (actorName, markerName) => {};
//     const lookAt = (actorName, targetActorName, cb) => {
//       const act = scene.gameInterface.getActor(actorName);
//       const act2 = scene.gameInterface.getActor(targetActorName);
//       scene.isWaitingForAnimation = true;
//       act.setPositionToTurnTowards(act2.getWalkPosition(), () => {
//         if (cb) {
//           cb();
//         } else {
//           scene.isWaitingForAnimation = false;
//         }
//       });
//       return true;
//     };
//     const lookAtPoint = (actorName, point, cb) => {
//       const act = scene.gameInterface.getActor(actorName);
//       scene.isWaitingForAnimation = true;
//       act.setPositionToTurnTowards(point, () => {
//         if (cb) {
//           cb();
//         } else {
//           scene.isWaitingForAnimation = false;
//         }
//       });
//       return true;
//     };
//     const lookAtEachOther = (actorName, actorName2) => {
//       const commands = scene.getCommands();
//       let ctr = 0;
//       scene.isWaitingForAnimation = true;
//       const cb = () => {
//         ctr++;
//         if (ctr === 2) {
//           scene.isWaitingForAnimation = false;
//         }
//       };
//       commands.lookAt(actorName, actorName2, cb);
//       commands.lookAt(actorName2, actorName, cb);
//       return true;
//     };
//     const lookDirection = (actorName, direction) => {
//       const commands = scene.getCommands();
//       const act = scene.gameInterface.getActor(actorName);
//       let point = null;
//       switch (direction) {
//         case HEADING.UP:
//           point = pt(act.x, act.y - 100);
//           break;
//         case HEADING.DOWN:
//           point = pt(act.x, act.y + 100);
//           break;
//         case HEADING.LEFT:
//           point = pt(act.x - 100, act.y);
//           break;
//         case HEADING.RIGHT:
//           point = pt(act.x + 100, act.y);
//           break;
//         default:
//           console.warn(
//             `[SCENE] Specified direction is not valid: '${direction}'`
//           );
//       }

//       return commands.lookAtPoint(actorName, point);
//     };
//     const setFacing = (actorName, direction) => {};
//     const setFacingTowards = (actorName, otherActorName) => {};
//     const setAnimation = (actorName, animationName) => {
//       const act = scene.gameInterface.getActor(actorName);
//       act.setAnimation(animationName);
//     };
//     const setAnimationAndWait = (actorName, animationName) => {
//       const commands = scene.getCommands();
//       const act = scene.gameInterface.getActor(actorName);
//       const animation = display.getAnimation(animationName);
//       act.setAnimation(animationName);
//       commands.waitMS(animation.getDurationMs());
//       return true;
//     };
//     const setAnimationState = (actorName, stateName) => {
//       const act = scene.gameInterface.getActor(actorName);
//       act.setAnimationState(stateName, stateName === 'default' ? true : false);
//     };
//     const setAnimationStateAndWait = (actorName, stateName) => {
//       const commands = scene.getCommands();
//       const act = scene.gameInterface.getActor(actorName);
//       const animation = act.setAnimationState(
//         stateName,
//         stateName === 'default' ? true : false
//       );
//       commands.waitMS(animation.getDurationMs());
//       return true;
//     };
//     const walkToMarker = (actorName, markerName, concurrent) => {
//       const commands = scene.getCommands();
//       const act = scene.gameInterface.getActor(actorName);
//       const marker = scene.gameInterface.getMarker(markerName);
//       if (!marker) {
//         console.error('No marker exists with name', markerName);
//         return;
//       }
//       const room = scene.gameInterface.getRoom();
//       const path = getWaypointPath(
//         act.getWalkPosition(),
//         marker,
//         room.walls,
//         room
//       );
//       if (path.length) {
//         const cb = commands.waitUntilPreemptible();
//         act.setWalkPath(path, cb);
//         return true;
//       }
//     };
//     const walkToActor = (actorName, actorName2, concurrent) => {
//       const commands = scene.getCommands();
//       const act = scene.gameInterface.getActor(actorName);
//       const otherActor = scene.gameInterface.getActor(actorName2);
//       if (!otherActor) {
//         console.error('No other actor exists with name', actorName2);
//         return;
//       }
//       const room = scene.gameInterface.getRoom();
//       const path = getWaypointPath(
//         act.getWalkPosition(),
//         otherActor,
//         room.walls,
//         room
//       );
//       if (path.length) {
//         const cb = commands.waitUntilPreemptible();
//         act.setWalkPath(path, cb);
//         return true;
//       }
//     };
//     const moveFixed = (actorName, xOffset, yOffset) => {
//       const act = scene.gameInterface.getActor(actorName);
//       act.setAt(act.x + xOffset, act.y + yOffset);
//     };
//     const acquireItem = (actorName, itemName) => {
//       const actStorage = scene.storage[actorName];
//       if (!actStorage) {
//         console.error(
//           'Cannot acquireItem, no actor storage exists with actorName:',
//           actorName
//         );
//         return;
//       }
//       actStorage.items[itemName] = actStorage.items[itemName]
//         ? actStorage.items[itemName] + 1
//         : 1;
//       scene.gameInterface.render();
//     };
//     const acquireItemFromGround = (actorName, itemName) => {
//       const room = scene.gameInterface.getRoom();
//       acquireItem(actorName, itemName);
//       const itemAct = room.getActor(itemName);
//       playSound('get_small_item');
//       itemAct.remove();
//     };
//     const removeItem = (actorName, itemName) => {
//       const actStorage = scene.storage[actorName];
//       if (!actStorage) {
//         console.error(
//           'Cannot removeItem, no actor storage exists with actorName:',
//           actorName
//         );
//         return;
//       }
//       actStorage.items[itemName] = actStorage.items[itemName]
//         ? actStorage.items[itemName] - 1
//         : 0;
//     };
//     const dropItem = (actorName, itemName) => {
//       removeItem(actorName, itemName);
//     };
//     const openMenu = () => {};
//     const shakeScreen = () => {};
//     const walkWait = function () {};
//     const waitSeconds = (seconds, cb) => {
//       scene.isWaitingForTime = true;
//       display.clearTimeout(scene.waitTimeoutId);
//       scene.waitTimeoutId = display.setTimeout(() => {
//         scene.isWaitingForTime = false;
//         cb();
//       }, seconds * 1000);
//       return true;
//     };
//     const waitMS = (ms, cb) => {
//       scene.isWaitingForTime = true;
//       display.clearTimeout(scene.waitTimeoutId);
//       scene.waitTimeoutId = display.setTimeout(() => {
//         scene.isWaitingForTime = false;
//         if (cb) {
//           cb();
//         }
//       }, ms);
//       return true;
//     };
//     const waitMSPreemptible = (ms, cb) => {
//       const mouseEvents = {
//         1: () => {
//           display.clearTimeout(scene.waitTimeoutId);
//           _cb();
//         },
//       };
//       const keyboardEvents = {
//         Enter: () => {
//           display.clearTimeout(scene.waitTimeoutId);
//           _cb();
//         },
//       };
//       const _cb = () => {
//         scene.isWaitingForTime = false;
//         if (cb) {
//           cb();
//         }
//         input.popEventListeners('mousedown', mouseEvents);
//         input.popEventListeners('keydown', keyboardEvents);
//       };
//       scene.isWaitingForTime = true;
//       display.clearTimeout(scene.waitTimeoutId);
//       input.pushEventListeners('mousedown', mouseEvents);
//       input.pushEventListeners('keydown', keyboardEvents);
//       scene.waitTimeoutId = display.setTimeout(_cb, ms);
//       return true;
//     };
//     const waitUntilPreemptible = () => {
//       scene.isWaitingForTime = true;
//       return () => {
//         scene.isWaitingForTime = false;
//       };
//     };
//     const waitForUserInput = cb => {
//       scene.isWaitingForInput = true;
//       return () => {
//         scene.isWaitingForInput = false;
//         if (cb) {
//           cb();
//         }
//       };
//     };

//     const playDialogNarrative = (actorName, subtitle, soundName) => {
//       scene.gameInterface.setNarrativeText(actorName, subtitle);
//       return waitForUserInput();
//     };

//     const setNarrativeBackground = imageName => {
//       // const narrative = scene.gameInterface.
//       scene.gameInterface.setNarrativeBackground(imageName);
//     };

//     const setNarrativeTextLocation = (locX, locY) => {
//       const style = {};
//       if (locX === 'right') {
//         style.right = 0;
//         style.width = '40%';
//       } else if (locX === 'center') {
//         style.right = 0;
//         style.left = 0;
//       } else {
//         style.left = 0;
//         style.width = '40%';
//       }

//       if (locY === 'top') {
//         style.top = 0;
//       } else if (locY === 'bottom') {
//         style.bottom = 0;
//       }

//       scene.gameInterface.setNarrativeTextPosition(style);
//     };

//     scene.defaultCommands = {
//       setMode,
//       setStorage,
//       setStorageOnce,
//       callScript,
//       playSound,
//       shakeScreen,
//       save,
//       restore,
//       waitSeconds,
//       waitMS,
//       waitMSPreemptible,
//       waitUntilPreemptible,
//     };

//     scene.roomCommands = {
//       ...scene.defaultCommands,
//       remove,
//       removeActor,
//       changeRoom,
//       playDialogue,
//       playDialogueInterruptable,
//       defaultDialogue,
//       acquireItemFromGround,
//       walkTowards,
//       addActor,
//       addActorAtMarker,
//       lookAt,
//       lookAtPoint,
//       lookAtEachOther,
//       lookDirection,
//       setFacing,
//       setFacingTowards,
//       setAnimation,
//       setAnimationAndWait,
//       setAnimationState,
//       setAnimationStateAndWait,
//       walkToMarker,
//       walkToActor,
//       moveFixed,
//       acquireItem,
//       removeItem,
//       dropItem,
//       openMenu,
//       walkWait,
//     };

//     scene.narrativeCommands = {
//       ...scene.defaultCommands,
//       setNarrativeBackground,
//       setNarrativeTextLocation,
//       playDialogue: playDialogNarrative,
//     };

//     scene.allCommands = {
//       ...scene.roomCommands,
//       ...scene.narrativeCommands,
//     };
//   }
//   getCommands(all) {
//     if (all) {
//       return scene.allCommands;
//     }

//     const mode = scene.gameInterface.getMode();

//     if (mode === MODES.ROOM) {
//       return scene.roomCommands;
//     } else if (mode === MODES.NARRATIVE) {
//       return scene.narrativeCommands;
//     }

//     return scene.allCommands;
//   }

//   getInventory(actorName) {
//     return (
//       (
//         scene.storage[actorName] && Object.keys(scene.storage[actorName].items)
//       ).filter(itemName => scene.storage[actorName].items[itemName]) || []
//     );
//   }

//   stopWaitingForInput() {
//     scene.isWaitingForInput = false;
//     scene.update();
//   }

//   isExecutingBlockingScene() {
//     return scene.isWaiting();
//   }

//   setGameInterface(gameInterface) {
//     scene.gameInterface = gameInterface;
//   }

//   getActiveItem() {
//     return scene.storage.activeItem;
//   }

//   setActiveItem(itemName) {
//     scene.storage.activeItem = itemName;
//   }

//   unsetActiveItem(itemName) {
//     scene.storage.activeItem = '';
//   }

//   setRoom(room) {
//     scene.room = room;
//   }

//   setBattle(battle) {
//     scene.battle = battle;
//   }

//   update() {
//     if (scene.currentScript && !scene.isWaiting()) {
//       let cmd = null;
//       while ((cmd = scene.currentScript.getNextCommand()) !== null) {
//         console.log('EVAL', cmd.conditional);
//         if (scene.evalCondition(cmd.conditional)) {
//           const commands = scene.getCommands();
//           console.log('next cmd', cmd.type, cmd.args);
//           const command = commands[cmd.type];
//           if (!command) {
//             throw new Error(
//               `Script runtime error.  No command exists with name '${
//                 cmd.type
//               }' as mode '${scene.gameInterface.getMode()}'`
//             );
//           }
//           if (command(...cmd.args)) {
//             break;
//           }
//         }
//       }
//       if (cmd === null) {
//         console.log(
//           `Completed Script '${scene.currentScript.name}' stackLength='${scene.scriptStack.length}'`
//         );
//         scene.onScriptCompleted();
//         if (scene.scriptStack.length) {
//           const { script, onScriptCompleted } = scene.scriptStack.shift();
//           scene.currentScript = script;
//           scene.onScriptCompleted = onScriptCompleted;
//           setTimeout(() => scene.update());
//         } else {
//           scene.currentScript = null;
//           scene.currentTrigger = null;
//         }
//       }
//       scene.gameInterface.render();
//     }
//   }

//   evalCondition(conditional) {
//     if (conditional === true) {
//       return true;
//     } else {
//       const { type, args: originalArgs } = conditional;
//       const args = formatArgs(originalArgs).map(arg => {
//         if (typeof arg === 'object') {
//           return arg;
//         }
//         const a = arg;
//         if (a === 'scene' && scene.currentTrigger) {
//           return scene.storage[scene.currentTrigger.name];
//         } else if (typeof a === 'string' && a.indexOf('.') > -1) {
//           const [a, b] = arg.split('.');
//           if (a === 'storage') {
//             return scene.storage[b];
//           }
//           if (!scene.storage[a]) {
//             console.error('No storage in scene called:', a);
//             return false;
//           }
//           return scene.storage[a][b];
//         } else {
//           return arg;
//         }
//       });
//       if (type === 'is') {
//         return !!args[0];
//       } else if (type === 'isnot') {
//         if (typeof args[0] == 'object') {
//           return !scene.evalCondition(args[0]);
//         } else {
//           return !args[0];
//         }
//       } else if (type === 'gt') {
//         return args[0] > args[1];
//       } else if (type === 'lt') {
//         return args[0] < args[1];
//       } else if (type === 'eq') {
//         return args[0] === args[1];
//       } else if (type === 'any') {
//         for (let i = 0; i < args.length; i++) {
//           const arg = args[i];
//           if (scene.evalCondition(arg)) {
//             return true;
//           }
//         }
//         return false;
//       } else if (type === 'all') {
//         for (let i = 0; i < args.length; i++) {
//           const arg = args[i];
//           if (!scene.evalCondition(arg)) {
//             return false;
//           }
//         }
//         return true;
//       } else if (type === 'as') {
//         const act = scene.gameInterface.getRoom().getActiveActor();
//         return act.name === args[0];
//       } else if (type === 'once') {
//         const arg =
//           args[0] || (scene.currentScript || scene.currentTrigger).name + '-once';
//         if (scene.storageOnceKeys[arg]) {
//           return false;
//         }
//         scene.storageOnceKeys[arg] = true;
//         return true;
//       } else if (type === 'with') {
//         const arg = args[0];
//         return arg === scene.getActiveItem();
//       }
//       return false;
//     }
//   }

//   async callTrigger(triggerName, type) {
//     const trigger = getElem('triggers', triggerName);
//     if (!scene.currentScript && trigger) {
//       console.log('CALL TRIGGER', trigger);
//       for (let i = 0; i < trigger.scriptCalls.length; i++) {
//         const scriptCall = trigger.scriptCalls[i];
//         scene.currentTrigger = trigger;
//         const c = scene.evalCondition(scriptCall.condition);
//         console.log('CONDITION', scriptCall.condition, scriptCall.type, c);
//         if (scriptCall.type === type && c) {
//           scene.unsetActiveItem();
//           await scene.callScript(scriptCall.scriptName);
//           scene.storage[trigger.name] = true;
//           break;
//         } else {
//           scene.currentTrigger = null;
//         }
//       }
//     }
//   }

//   async callScript(scriptName) {
//     return new Promise(resolve => {
//       const script = getElem('scripts', scriptName);
//       if (!script) {
//         throw new Error(
//           'Scene cannot run script.  No script exists with name "' +
//             scriptName +
//             '".'
//         );
//       }
//       script.reset();
//       if (scene.currentScript) {
//         scene.scriptStack.unshift({
//           script: scene.currentScript,
//           onScriptCompleted: scene.onScriptCompleted,
//         });
//       }
//       scene.currentScript = script;
//       scene.onScriptCompleted = resolve;
//       scene.update();
//     });
//   }

//   createAndCallScript(scriptName, commands) {
//     const script = new Script(scriptName, 'internal', -1);
//     const block = script.addCommandBlock();
//     block.commands = commands.slice();
//     script.reset();
//     if (scene.currentScript) {
//       scene.scriptStack.unshift(scene.currentScript);
//     }
//     scene.currentScript = script;
//   }

//   isWaiting() {
//     return (
//       scene.isWaitingForInput ||
//       scene.isWaitingForTime ||
//       scene.isWaitingForAnimation
//     );
//   }

//   hasCommand(commandName) {
//     const commands = scene.getCommands(true);
//     return !!commands[commandName];
//   }
// }

// window.scene = scene = new Scene();

// export function hasCommand(commandName) {
//   const commands = scene.getCommands(true);
//   return !!commands[commandName];
// }

// export default scene;
