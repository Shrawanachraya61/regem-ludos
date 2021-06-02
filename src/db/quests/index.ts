import { init as initPart1 } from './quests-part1';

export interface QuestTemplate {
  label: string;
  description: string;
  steps: IQuestStep[];
  questStartScriptKey: string;
  questEndScriptKey: string;
}

export type QuestTemplateWithName = QuestTemplate & { name: string };

export interface IQuestStep {
  label: string;
  description: string;
  completedScriptKey: string;
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
};
