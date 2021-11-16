import {
  getAll,
  getIfExists,
  QuestTemplate,
  QuestTemplateWithName,
} from 'db/quests';
import { Scene } from 'model/scene';

let lastUpdatedQuests: string[] = [];
const pushLastUpdatedQuest = (questName: string) => {
  const ind = lastUpdatedQuests.indexOf(questName);
  if (ind > -1) {
    lastUpdatedQuests.splice(ind, 1);
  }
  lastUpdatedQuests.push(questName);
};

export const getLastUpdatedQuests = () => lastUpdatedQuests;
export const resetLastUpdatedQuests = (arr?: string[]) => {
  lastUpdatedQuests = arr ?? [];
};

export const questIsActive = (scene: Scene, quest: QuestTemplate) => {
  return (
    scene.storage[quest.questStartScriptKey] &&
    !scene.storage[quest.questEndScriptKey]
  );
};

export const questIsCompleted = (scene: Scene, quest: QuestTemplate) => {
  return !!scene.storage[quest.questEndScriptKey];
};

export const questIsNotStarted = (scene: Scene, quest: QuestTemplate) => {
  return !scene.storage[quest.questStartScriptKey];
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

export const beginQuest = ((window as any).beginQuest = (
  scene: Scene,
  questName: string
) => {
  const quest = getIfExists(questName);
  if (quest) {
    console.log('begin quest', quest);
    if (questIsNotStarted(scene, quest)) {
      scene.storage[quest.questStartScriptKey] = true;
      pushLastUpdatedQuest(questName);
    } else {
      console.log('somehow the quest is started already?');
    }
  } else {
    console.error('cannot beginQuest, quest not found:', questName);
  }
});

export const completeQuest = ((window as any).completeQuest = (
  scene: Scene,
  questName: string
) => {
  const quest = getIfExists(questName);

  console.log('COMPLETE QUEST', questName);
  if (quest) {
    pushLastUpdatedQuest(questName);
    scene.storage[quest.questEndScriptKey] = true;
  } else {
    console.error('cannot beginQuest, quest not found:', questName);
  }
});

export const completeQuestStep = (
  scene: Scene,
  questName: string,
  ind: number
) => {
  const quest = getIfExists(questName);
  if (quest) {
    console.log('COMPLETE STEP', questName, ind);
    if (questIsActive(scene, quest)) {
      for (let i = 0; i < quest.steps.length; i++) {
        const step = quest.steps[i];
        if (!scene.storage[step.completedScriptKey as string]) {
          scene.storage[step.completedScriptKey as string] = true;

          pushLastUpdatedQuest(questName);
          if (i < quest.steps.length - 1) {
            return;
          }
        }
      }
      completeQuest(scene, questName);
    } else {
      console.error(
        `cannot completeQuestStep ${ind}, quest is not active:`,
        questName
      );
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
        if (!scene.storage[step.completedScriptKey as string]) {
          return {
            i,
            ...step,
          };
        }
      }
    }
  } else {
    console.error('cannot getCurrentQuestStep, quest not found:', questName);
  }
};
