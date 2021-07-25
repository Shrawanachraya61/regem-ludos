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
  storageEncounters: Record<string, Record<string, boolean>>;
  storageTreasure: Record<string, Record<string, boolean>>;
  commands: Record<string, any>;
  currentScript: Script | null;
  currentTrigger: Trigger | null;
  scriptStack: IScriptStackItem[];
  onScriptCompleted?: () => void;
  isWaitingForInput: boolean;
  isWaitingForTime: boolean;
  isWaitingForAnimation: boolean;
  inputDisabled: boolean; // used only for dialog input
  waitTimeoutId: number;
}

export const sceneCreate = (): Scene => {
  const scene = {
    storage: {
      'quest_floor1-main': true,
    } as Record<string, string | boolean>,
    storageOnce: {} as Record<string, string>,
    storageOnceKeys: {} as Record<string, boolean>,
    storageEncounters: {} as Record<string, Record<string, boolean>>,
    storageTreasure: {} as Record<string, Record<string, boolean>>,
    commands: {} as Record<string, any>,
    currentScript: null,
    currentTrigger: null,
    scriptStack: [] as IScriptStackItem[],
    isWaitingForInput: false,
    isWaitingForTime: false,
    isWaitingForAnimation: false,
    inputDisabled: false,
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

export const sceneSetEncounterDefeated = (
  scene: Scene,
  roamerName: string,
  overworldName: string
) => {
  if (scene.storageEncounters[overworldName]) {
    scene.storageEncounters[overworldName][roamerName] = true;
  } else {
    scene.storageEncounters[overworldName] = {
      [roamerName]: true,
    } as Record<string, boolean>;
  }
};

export const sceneSetTreasureAcquired = (
  scene: Scene,
  propId: string,
  overworldName: string
) => {
  if (scene.storageTreasure[overworldName]) {
    scene.storageTreasure[overworldName][propId] = true;
  } else {
    scene.storageTreasure[overworldName] = {
      [propId]: true,
    } as Record<string, boolean>;
  }
};

export const sceneIsEncounterDefeated = (
  scene: Scene,
  roamerName: string,
  overworldName: string
) => {
  if (scene.storageEncounters[overworldName]) {
    return !!scene.storageEncounters[overworldName][roamerName];
  } else {
    return false;
  }
};

export const sceneHasTreasureBeenAcquired = (
  scene: Scene,
  propId: string,
  overworldName: string
) => {
  if (scene.storageTreasure[overworldName]) {
    return !!scene.storageTreasure[overworldName][propId];
  } else {
    return false;
  }
};

export const sceneSetCurrentOverworld = (scene: Scene, roomName: string) => {
  scene.storage['current_overworld'] = roomName;
};

export const sceneGetCurrentOverworldName = (scene: Scene) => {
  return scene.storage['current_overworld'] ?? 'test2';
};
