import {
  Script,
  Trigger,
  CommandBlock,
  Command,
  Conditional,
  ScriptCall,
  parseSingleScript,
  TriggerType,
  formatArgs,
  getScript,
  getTrigger,
} from 'lib/rpgscript';
import { Scene, sceneIsWaiting, sceneGetCommands } from 'model/scene';
import {
  getCurrentOverworld,
  getCurrentPlayer,
  getCurrentRoom,
} from 'model/generics';
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
import sceneCommands, { setStorage } from './scene-commands';
import { playerHasItem } from 'model/player';
import { getIfExists as getCharacterTemplate } from 'db/characters';

const MAX_ARGS = 10;

export const updateScene = (scene: Scene): void => {
  if (scene.currentScript && !sceneIsWaiting(scene)) {
    let cmd: Command | null = null;
    while ((cmd = scene.currentScript.getNextCommand()) !== null) {
      // console.log('EVAL', cmd.conditional);
      if (evalCondition(scene, cmd.conditional)) {
        const commands = sceneGetCommands(scene);
        const commandFunction = commands[cmd.type];
        if (!commandFunction) {
          throw new Error(
            `Script runtime error.  No command exists with name '${cmd.type}'`
          );
        }
        const commandArgs: any[] = cmd?.args.map(arg => {
          if (
            typeof arg === 'string' &&
            arg[0] === '[' &&
            arg[arg.length - 1] === ']'
          ) {
            const argKey = arg.slice(1, -1);
            return scene.storage[argKey];
          } else {
            return arg;
          }
        });
        // console.log('next cmd', cmd.type, cmd.args, commandArgs);
        if (commandFunction(...commandArgs)) {
          break;
        }
      }
    }
    if (cmd === null) {
      // console.log(
      //   `Completed Script '${scene.currentScript.name}' stackLength='${scene.scriptStack.length}'`
      // );
      if (scene.onScriptCompleted) {
        scene.onScriptCompleted();
      }
      if (scene.scriptStack.length) {
        const obj = scene.scriptStack.shift();
        if (obj) {
          const { script, onScriptCompleted, args } = obj;
          scene.currentScript = script;
          scene.onScriptCompleted = onScriptCompleted;
          for (let i = 0; i < MAX_ARGS; i++) {
            const arg = args[i];
            const key = 'ARG' + i;
            if (arg === undefined) {
              delete scene.storage[key];
            } else {
              setStorage(key, arg);
            }
          }
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
  conditional?: Conditional | boolean,
  dontTriggerOnce?: boolean,
  triggerType?: TriggerType
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
      // if the arg is a character name
      if (getCharacterTemplate(args[0])) {
        // if the room has that character
        if (roomGetCharacterByName(getCurrentRoom(), args[0])) {
          return true;
        } else {
          return false;
        }
      }

      return !!scene.storage[args[0]];
    } else if (type === 'isnot') {
      if (typeof args[0] == 'object') {
        return !evalCondition(scene, args[0]);
      } else {
        // if the arg is a character name
        if (getCharacterTemplate(args[0])) {
          // if the room has that character
          if (roomGetCharacterByName(getCurrentRoom(), args[0])) {
            return false;
          } else {
            return true;
          }
        }

        return !scene.storage[args[0]];
      }
    } else if (type === 'gt') {
      return args[0] > args[1];
    } else if (type === 'lt') {
      return args[0] < args[1];
    } else if (type === 'eq') {
      const conditions = [
        args[0] === args[1],
        scene.storage[args[0]] === args[1],
        scene.storage[args[1]] === args[0],
      ];
      if (typeof args[1] !== 'number') {
        conditions.push(scene.storage[args[0]] === scene.storage[args[1]]);
      }
      return conditions.reduce((prev, curr) => {
        return curr || prev;
      }, false);
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
      let arg =
        args[0] ??
        (scene.currentScript || scene.currentTrigger)?.name + '-once';
      if (triggerType) {
        arg =
          args[0] ??
          (scene.currentScript || scene.currentTrigger)?.name +
            '-' +
            triggerType +
            '-once';
      }
      if (scene.storageOnceKeys[arg]) {
        return false;
      }
      if (!dontTriggerOnce) {
        scene.storageOnceKeys[arg] = true;
      }
      return true;
    } else if (type === 'with') {
      const itemName = args[0] ?? '';
      const player = getCurrentPlayer();
      return itemName && playerHasItem(player, itemName);
    }
    return false;
  }
};

export const invokeTrigger = (
  scene: Scene,
  triggerName: string,
  type: TriggerType,
  dontTriggerOnce?: boolean
): null | (() => Promise<void>) => {
  const trigger = getTrigger(triggerName);
  if (!scene.currentScript && trigger) {
    type !== 'step' &&
      type !== 'step-first' &&
      console.log('INVOKE TRIGGER', triggerName, type, trigger);
    for (let i = 0; i < trigger.scriptCalls.length; i++) {
      const scriptCall = trigger.scriptCalls[i];
      if (scriptCall.type === type) {
        scene.currentTrigger = trigger;
        const c = evalCondition(
          scene,
          scriptCall.condition,
          dontTriggerOnce,
          type
        );
        type !== 'step' &&
          type !== 'step-first' &&
          console.log('CONDITION', scriptCall.condition, scriptCall.type, c);
        if (c) {
          return async () => {
            await callScript(scene, scriptCall.scriptName);
            scene.storage[trigger.name] = true;
          };
        } else {
          scene.currentTrigger = null;
        }
      }
    }
  }
  return null;
};

export const callScript = async (
  scene: Scene,
  scriptName: string,
  ...args: any[]
) => {
  return new Promise<void>(resolve => {
    const script = getScript(scriptName);
    script.reset();
    if (scene.currentScript) {
      const currentArgs: any[] = [];
      for (let i = 0; i < MAX_ARGS; i++) {
        const arg = scene.storage['ARG' + i];
        if (arg !== undefined) {
          currentArgs.push(arg);
        }
      }
      scene.scriptStack.unshift({
        script: scene.currentScript,
        onScriptCompleted: scene.onScriptCompleted,
        args: currentArgs,
      });
    }
    scene.currentScript = script;
    scene.onScriptCompleted = resolve;
    for (let i = 0; i < MAX_ARGS; i++) {
      const arg = args[i];
      const key = 'ARG' + i;
      if (arg === undefined) {
        delete scene.storage[key];
      } else {
        setStorage(key, arg);
      }
    }
    updateScene(scene);
  });
};

export const createAndCallScript = (scene: Scene, src: string) => {
  return new Promise<void>(resolve => {
    src = '@tmp\n' + src;
    const scripts = parseSingleScript(src, scene);
    const script = scripts.tmp;
    script.reset();
    if (scene.currentScript) {
      // push to end so that this script runs after the other scripts are done
      scene.scriptStack.push({
        script: scene.currentScript,
        onScriptCompleted: function () {},
        args: [],
      });
    }
    scene.currentScript = script;
    scene.onScriptCompleted = resolve;
    updateScene(scene);
  });
};

export const getSceneCommands = (scene: Scene): Record<string, any> => {
  return sceneCommands;
};
