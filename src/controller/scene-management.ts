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
import sceneCommands from './scene-commands';

export const updateScene = (scene: Scene): void => {
  if (scene.currentScript && !sceneIsWaiting(scene)) {
    let cmd: Command | null = null;
    while ((cmd = scene.currentScript.getNextCommand()) !== null) {
      // console.log('EVAL', cmd.conditional);
      if (evalCondition(scene, cmd.conditional)) {
        const commands = sceneGetCommands(scene);
        // console.log('next cmd', cmd.type, cmd.args);
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
      // console.log(
      //   `Completed Script '${scene.currentScript.name}' stackLength='${scene.scriptStack.length}'`
      // );
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

export const invokeTrigger = (
  scene: Scene,
  triggerName: string,
  type: TriggerType
): null | (() => Promise<void>) => {
  const trigger = getTrigger(triggerName);
  if (!scene.currentScript && trigger) {
    // console.log('INVOKE TRIGGER', trigger);
    for (let i = 0; i < trigger.scriptCalls.length; i++) {
      const scriptCall = trigger.scriptCalls[i];
      scene.currentTrigger = trigger;
      const c = evalCondition(scene, scriptCall.condition);
      // console.log('CONDITION', scriptCall.condition, scriptCall.type, c);
      if (scriptCall.type === type && c) {
        return async () => {
          await callScript(scene, scriptCall.scriptName);
          scene.storage[trigger.name] = true;
        };
      } else {
        scene.currentTrigger = null;
      }
    }
  }
  return null;
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
  return sceneCommands;
};
