import { Script, Trigger } from 'lib/rpgscript';
import { getSceneCommands } from 'controller/scene-management';
import { setCurrentScene } from 'model/generics';

interface IScriptStackItem {
  script: Script;
  onScriptCompleted?: () => void;
  args: any[];
}

export interface Scene {
  storage: Record<string, string | boolean | number>;
  storageOnce: Record<string, string | boolean>;
  storageOnceKeys: Record<string, boolean>;
  commands: Record<string, any>;
  currentScript: Script | null;
  currentTrigger: Trigger | null;
  scriptStack: IScriptStackItem[];
  onScriptCompleted?: () => void;
  isWaitingForInput: boolean;
  isWaitingForTime: boolean;
  isWaitingForAnimation: boolean;
  waitTimeoutId: number;
}

export const sceneCreate = (): Scene => {
  const scene = {
    storage: {
      quest_tutorial_active: 'true',
    } as Record<string, string>,
    storageOnce: {} as Record<string, string>,
    storageOnceKeys: {} as Record<string, boolean>,
    commands: {} as Record<string, any>,
    currentScript: null,
    currentTrigger: null,
    scriptStack: [] as IScriptStackItem[],
    isWaitingForInput: false,
    isWaitingForTime: false,
    isWaitingForAnimation: false,
    waitTimeoutId: -1,
  };
  Object.assign(scene.commands, getSceneCommands(scene));
  return scene;
};

export const initScene = () => {
  setCurrentScene(sceneCreate());
};

export const sceneIsWaiting = (scene: Scene): boolean => {
  return (
    scene.isWaitingForInput ||
    scene.isWaitingForTime ||
    scene.isWaitingForAnimation
  );
};

export const sceneStopWaitingUntil = (scene: Scene) => {
  scene.isWaitingForTime = false;
};

export const sceneHasCommand = (scene: Scene, commandName: string): boolean => {
  const commands = sceneGetCommands(scene);
  return !!commands[commandName];
};

export const sceneGetCommands = (scene: Scene): Record<string, any> => {
  return scene.commands;
};
