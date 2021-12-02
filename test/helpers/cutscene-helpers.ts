import {
  invokeTrigger,
  updateScene,
  sceneIsPlaying,
  callScript,
} from 'controller/scene-management';
import {
  getAppState,
  initAppStateReducers,
} from '../helpers/immediate-reducer';
import { getConfirmKey, getCurrentKeyHandler } from 'controller/events';
import { getScript, TriggerType } from 'lib/rpgscript';
import { get as getQuest } from 'db/quests';
import { AppSection } from 'model/store';
import { getCurrentScene } from 'model/generics';
import { get as getCharacter } from 'db/characters';

export const pressCutsceneInput = () => {
  const cb = getCurrentKeyHandler();
  if (cb) {
    cb({ key: getConfirmKey() } as any);
    updateScene(getCurrentScene());
  }
};

export const invokeTalkTriggerSkip = async (chName: string) => {
  const character = getCharacter(chName);
  const scene = getCurrentScene();
  scene.skip = true;
  const scriptCall: any = invokeTrigger(
    scene,
    character.talkTrigger as string,
    TriggerType.ACTION
  );
  scriptCall();
  let ctr = 0;
  while (sceneIsPlaying(scene) && ctr < 500) {
    pressCutsceneInput();
    updateScene(scene);
    if (getAppState().sections.includes(AppSection.Quest)) {
      getAppState().quest.onClose();
    }
    ctr++;
    await Promise.resolve();
  }
};

export const callScriptSkip = async (scriptName: string) => {
  const scene = getCurrentScene();
  scene.skip = true;
  console.log('Call script', scene);
  callScript(scene, scriptName);
  let ctr = 0;
  while (sceneIsPlaying(scene) && ctr < 500) {
    pressCutsceneInput();
    updateScene(scene);
    if (getAppState().sections.includes(AppSection.Quest)) {
      getAppState().quest.onClose();
    }
    ctr++;
    await new Promise(resolve => setTimeout(resolve, 1));
  }
};
