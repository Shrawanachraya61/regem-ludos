import {
  getAll,
  getIfExists,
  QuestTemplate,
  QuestTemplateWithName,
} from 'db/quests';
import { Scene } from 'model/scene';

export const questIsActive = (scene: Scene, quest: QuestTemplate) => {
  console.log(
    'QUEST IS ACTIVE?',
    quest,
    scene.storage[quest.questStartScriptKey],
    !scene.storage[quest.questEndScriptKey]
  );
  return (
    scene.storage[quest.questStartScriptKey] &&
    !scene.storage[quest.questEndScriptKey]
  );
};

export const questIsCompleted = (scene: Scene, quest: QuestTemplate) => {
  return !!scene.storage[quest.questEndScriptKey];
};

export const questIsNotStarted = (scene: Scene, quest: QuestTemplate) => {
  return !!scene.storage[quest.questStartScriptKey];
};

export const getAllActiveQuests = (scene: Scene) => {
  const quests = getAll();
  const startedQuests: QuestTemplateWithName[] = [];
  for (const i in quests) {
    const questTemplate = quests[i];
    if (questIsActive(scene, questTemplate)) {
      startedQuests.push({
        name: i,
        ...questTemplate,
      });
    }
  }
  return startedQuests.sort((a, b) => {
    return a.label < b.label ? -1 : 1;
  });
};

export const getAllCompletedQuests = (scene: Scene) => {
  const quests = getAll();
  const completedQuests: QuestTemplateWithName[] = [];
  for (const i in quests) {
    const questTemplate = quests[i];
    if (scene.storage[questTemplate.questEndScriptKey]) {
      completedQuests.push({
        name: i,
        ...questTemplate,
      });
    }
  }
  return completedQuests.sort((a, b) => {
    return a.label < b.label ? -1 : 1;
  });
};

export const beginQuest = (scene: Scene, questName: string) => {
  const quest = getIfExists(questName);
  if (quest) {
    if (questIsNotStarted(scene, quest)) {
      scene.storage[quest.questStartScriptKey] = true;
    }
  } else {
    console.error('cannot beginQuest, quest not found:', questName);
  }
};

export const completeQuest = (scene: Scene, questName: string) => {
  const quest = getIfExists(questName);
  if (quest) {
    if (questIsNotStarted(scene, quest)) {
      scene.storage[quest.questEndScriptKey] = true;
    }
  } else {
    console.error('cannot beginQuest, quest not found:', questName);
  }
};

export const completeQuestStep = (
  scene: Scene,
  questName: string,
  ind: number
) => {
  const quest = getIfExists(questName);
  if (quest) {
    if (questIsActive(scene, quest)) {
      for (let i = 0; i < quest.steps.length; i++) {
        const step = quest.steps[i];
        if (!scene.storage[step.completedScriptKey]) {
          scene.storage[step.completedScriptKey] = true;
          if (i >= ind) {
            return;
          }
        }
      }
      completeQuest(scene, questName);
    }
  } else {
    console.error('cannot completeQuestStep, quest not found:', questName);
  }
};

export const getCurrentQuestStep = (scene: Scene, questName: string) => {
  const quest = getIfExists(questName);
  if (quest) {
    if (questIsActive(scene, quest)) {
      for (let i = 0; i < quest.steps.length; i++) {
        const step = quest.steps[i];
        if (!scene.storage[step.completedScriptKey]) {
          return step;
        }
      }
    }
  } else {
    console.error('cannot getCurrentQuestStep, quest not found:', questName);
  }
};
