import {
  Conditional,
  parseSingleScript,
  TriggerType,
  formatArgs,
  getScript,
  getTrigger,
  CommandWithBlock,
} from 'lib/rpgscript';
import { Scene, sceneIsWaiting } from 'model/scene';
import {
  getCurrentPlayer,
  getCurrentRoom,
  getCurrentScene,
} from 'model/generics';
import { roomGetCharacterByName } from 'model/room';
import sceneCommands, { setStorage } from './scene-commands';
import sceneCommandsSkip from './scene-commands-skip';
import { playerHasItem } from 'model/player';
import { getIfExists as getCharacterTemplate } from 'db/characters';
import { getIfExists as getQuest } from 'db/quests';
import {
  getCurrentQuestStep,
  questIsActive,
  questIsCompleted,
  questIsNotStarted,
} from './quest';
import { getUiInterface } from 'view/ui';
import { AppSection } from 'model/store';

// if you increase this, you have to change the arg matcher to check for the length
// of the integer string (number of decimal places) rather than just assuming it's 1
const MAX_ARGS = 10;
const argRegex = /\[ARG\d\]/;
const mapGetSceneArgs = (arg: string | number | object) => {
  const scene = getCurrentScene();
  if (typeof arg === 'string') {
    let match: any;
    while ((match = arg.match(argRegex))) {
      const argKey = arg.slice(match.index + 1, match.index + 5);
      arg =
        arg.slice(0, match.index) +
        scene.storage[argKey] +
        arg.slice(match.index + 6);
    }
    // HACK replace '--' with '+' so negative negative numbers parse as positive
    let argRet: boolean | string = arg.replace(/--/g, '+');
    if (argRet === 'true') {
      argRet = true;
    } else if (argRet === 'false') {
      argRet = false;
    }
    return argRet;
  } else {
    return arg;
  }
};

export const updateScene = (scene: Scene): void => {
  if (scene.currentScript && !sceneIsWaiting(scene)) {
    let cmd: CommandWithBlock | null = null;
    while ((cmd = scene.currentScript.getNextCommand()) !== null) {
      if (cmd.block.conditionalResult === undefined) {
        cmd.block.conditionalResult = evalCondition(
          scene,
          cmd.conditional,
          undefined,
          undefined,
          cmd.i
        );
        // console.log(
        //   'EVAL',
        //   cmd.i,
        //   cmd.type,
        //   cmd.conditional,
        //   cmd.block.conditionalResult
        // );
      } else {
        // console.log(
        //   'command is part of the same block, continuing',
        //   cmd.type,
        //   cmd.i
        // );
      }
      if (cmd.block.conditionalResult) {
        const commands = getSceneCommands(scene);
        const commandFunction = commands[cmd.type];
        if (!commandFunction) {
          throw new Error(
            `Script runtime error.  No command exists with name '${cmd.type}'`
          );
        }
        // console.log('MAP COMMAND ARGS', cmd);
        const commandArgs: any[] = cmd?.args.map(mapGetSceneArgs);

        console.log('next cmd', cmd.type, cmd.args, commandArgs);
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
        scene.postSceneCallbacks.forEach(cb => {
          cb();
        });
        scene.skip = false;
        scene.postSceneCallbacks = [];
        scene.currentScript = null;
        scene.currentTrigger = null;
        scene.currentTriggerType = null;
        scene.onceKeysToCommit.forEach(arg => {
          scene.storageOnceKeys[arg] = true;
        });
        scene.onceKeysToCommit = [];
      }
    }
  }
};

export const evalCondition = (
  scene: Scene,
  conditional?: Conditional | boolean,
  dontTriggerOnce?: boolean,
  triggerType?: TriggerType,
  scriptCallIndex?: number
) => {
  if (conditional === true) {
    return true;
  } else if (typeof conditional === 'object') {
    const { type, args: originalArgs } = conditional;
    const args = formatArgs(originalArgs)
      .map(mapGetSceneArgs)
      .map(arg => {
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
      } else if (typeof args[0] === 'boolean') {
        return args[0];
      }

      // if the arg
      return !!scene.storage[args[0]];
    } else if (type === 'isnot') {
      if (typeof args[0] == 'object') {
        return !evalCondition(
          scene,
          args[0],
          dontTriggerOnce,
          triggerType,
          scriptCallIndex
        );
      } else if (typeof args[0] === 'boolean') {
        return !args[0];
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
      if (typeof args[0] === 'string') {
        args[0] = scene.storage[args[0]];
      }
      if (typeof args[1] === 'string') {
        args[1] = scene.storage[args[1]];
      }
      return args[0] > args[1];
    } else if (type === 'lt') {
      if (typeof args[0] === 'string') {
        args[0] = scene.storage[args[0]];
      }
      if (typeof args[1] === 'string') {
        args[1] = scene.storage[args[1]];
      }
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
        if (
          evalCondition(
            scene,
            arg,
            dontTriggerOnce,
            triggerType,
            scriptCallIndex
          )
        ) {
          return true;
        }
      }
      return false;
    } else if (type === 'all') {
      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (
          !evalCondition(
            scene,
            arg,
            dontTriggerOnce,
            triggerType,
            scriptCallIndex
          )
        ) {
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

      if (!arg[0]) {
        if (scene.currentScript) {
          arg = scene.currentScript.name + scriptCallIndex + '-once';
        } else if (scene.currentTrigger) {
          arg = scene.currentTrigger.name + scriptCallIndex + '-once';
        }
      }
      if (triggerType) {
        arg =
          args[0] ??
          (scene.currentScript || scene.currentTrigger)?.name +
            '-' +
            triggerType +
            scriptCallIndex +
            '-once';
      }
      if (scene.storageOnceKeys[arg]) {
        return false;
      }
      if (!dontTriggerOnce) {
        scene.onceKeysToCommit.push(arg);
        // scene.storageOnceKeys[arg] = true;
      }

      return true;
    } else if (type === 'with') {
      const itemName = args[0] ?? '';
      const player = getCurrentPlayer();
      return itemName && playerHasItem(player, itemName);
    } else if (type === 'func') {
      const funcName = args[0] ?? '';
      const funcArg: string = args[1] ?? '';
      const funcArg2: string = args[2] ?? '';
      if (funcName === 'questActive') {
        const quest = getQuest(funcArg);
        if (!quest) {
          console.error(
            `Error in conditional.  Cannot check questActive.  No quest with name: ${funcArg}`
          );
          return false;
        }

        return questIsActive(scene, quest);
      } else if (funcName === 'questNotStarted') {
        const quest = getQuest(funcArg);
        if (!quest) {
          console.error(
            `Error in conditional.  Cannot check questActive.  No quest with name: ${funcArg}`
          );
          return false;
        }

        return questIsNotStarted(scene, quest);
      } else if (funcName === 'questCompleted') {
        const quest = getQuest(funcArg);
        if (!quest) {
          console.error(
            `Error in conditional.  Cannot check questActive.  No quest with name: ${funcArg}`
          );
          return false;
        }

        const compl = questIsCompleted(scene, quest);
        return compl;
      } else if (
        funcName === 'questStepGT' ||
        funcName === 'questStepLT' ||
        funcName === 'questStepEQ'
      ) {
        const quest = getQuest(funcArg);
        if (!quest) {
          console.error(
            `Error in conditional.  Cannot check questActive.  No quest with name: ${funcArg}`
          );
          return false;
        }
        const step = getCurrentQuestStep(scene, funcArg);

        if (questIsCompleted(scene, quest)) {
          return false;
        }

        if (funcName === 'questStepEQ') {
          return step?.i === parseInt(funcArg2);
        }

        return funcName === 'questStepGT'
          ? (step?.i ?? Infinity) > parseInt(funcArg2)
          : (step?.i ?? Infinity) < parseInt(funcArg2);
      } else if (funcName === 'inParty') {
        const player = getCurrentPlayer();
        const chName = funcArg.toLowerCase();
        return Boolean(
          player.party.find(ch => ch.name.toLowerCase() === chName)
        );
      }

      console.error(
        'Error in conditional.  func condition is not registered: ' + funcName,
        args
      );
      return false;
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
        scene.currentTriggerType = type;
        const c = evalCondition(
          scene,
          scriptCall.condition,
          dontTriggerOnce,
          type,
          i
        );
        // type !== 'step' &&
        //   type !== 'step-first' &&
        //   console.log('CONDITION', scriptCall.condition, scriptCall.type, c);
        if (c) {
          return async () => {
            await callScript(scene, scriptCall.scriptName);
            scene.storage[trigger.name] = true;
            scene.currentTrigger = null;
            scene.currentTriggerType = null;
          };
        } else {
          scene.currentTrigger = null;
          scene.currentTriggerType = null;
        }
      }
    }
  }
  return null;
};

export const callScript = ((window as any).callScript = async (
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
});

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

export const sceneIsPlaying = (scene: Scene) => {
  return scene.currentScript || sceneIsWaiting(scene);
};

export const getSceneCommands = (scene: Scene): Record<string, any> => {
  if (scene.skip) {
    return sceneCommandsSkip;
  } else {
    return sceneCommands;
  }
};

export const skipCurrentScript = (scene: Scene) => {
  const isCutsceneVisible = getUiInterface().appState.sections.includes(
    AppSection.Cutscene
  );

  if (!scene.skip && isCutsceneVisible) {
    clearTimeout(scene.waitTimeoutId);
    scene.skip = true;
    if (scene.waitTimeoutCb) {
      scene.waitTimeoutCb();
    }
  }
};
