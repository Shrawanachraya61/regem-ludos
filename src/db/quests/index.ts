import { Item } from 'db/items';
import { init as initPart1 } from './quests-part1';
import { init as initTest } from './quests-test';

export interface QuestTemplate {
  name?: string;
  label: string;
  summary: string;
  description: string;
  steps: IQuestStep[];
  questStartScriptKey: string;
  questEndScriptKey: string;
  tokensReward?: number;
  ticketsReward?: number;
  experienceReward?: number;
  itemsReward?: () => Item[];
  icon?: string;
  iconColor?: string;
}

export type QuestTemplateWithName = QuestTemplate & { name: string };

export interface IQuestStep {
  i?: number;
  label: string;
  description: string;
  completedScriptKey?: string;
}

const exp = {} as { [key: string]: QuestTemplate };
export const get = (key: string): QuestTemplateWithName => {
  const result = exp[key];
  if (!result) {
    throw new Error(`No quest template exists with name: ${key}`);
  }
  return {
    name: key,
    ...result,
  };
};

export const getIfExists = (key: string): QuestTemplateWithName | null => {
  const result = exp[key];
  if (!result) {
    return null;
  }
  return {
    name: key,
    ...result,
  };
};

export const getAll = () => {
  return exp;
};

export const init = () => {
  initPart1(exp);
  initTest(exp);

  for (const i in exp) {
    const quest = exp[i];
    quest.name = i;
    quest.steps.forEach((step, i) => {
      step.i = i;
      step.completedScriptKey = quest.questStartScriptKey + '-' + i;
    });
  }
};
