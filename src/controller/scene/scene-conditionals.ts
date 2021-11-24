import { getIfExists as getQuest } from 'db/quests';
import { getCurrentPlayer, getCurrentScene } from 'model/generics';
import {
  getCurrentQuestStep,
  questIsActive,
  questIsCompleted,
  questIsNotStarted,
} from 'model/quest';

const questActive = (questName: string) => {
  const quest = getQuest(questName);
  if (!quest) {
    console.error(
      `Error in conditional.  Cannot check questActive.  No quest with name: ${questName}`
    );
    return false;
  }

  return questIsActive(getCurrentScene(), quest);
};

const questNotStarted = (questName: string) => {
  const quest = getQuest(questName);
  if (!quest) {
    console.error(
      `Error in conditional.  Cannot check questNotStarted.  No quest with name: ${questName}`
    );
    return false;
  }

  return questIsNotStarted(getCurrentScene(), quest);
};

const questCompleted = (questName: string) => {
  const quest = getQuest(questName);
  if (!quest) {
    console.error(
      `Error in conditional.  Cannot check questCompleted.  No quest with name: ${questName}`
    );
    return false;
  }

  const compl = questIsCompleted(getCurrentScene(), quest);
  return compl;
};

const questNotCompleted = (questName: string) => {
  const quest = getQuest(questName);
  if (!quest) {
    console.error(
      `Error in conditional.  Cannot check questNotCompleted.  No quest with name: ${questName}`
    );
    return false;
  }

  const compl = questIsCompleted(getCurrentScene(), quest);
  return !compl;
};

const questStepGT = (questName: string, stepNumber: string | number) => {
  const i = parseInt(stepNumber as string);

  const quest = getQuest(questName);
  if (!quest) {
    console.error(
      `Error in conditional.  Cannot check questStepGT.  No quest with name: ${questName}`
    );
    return false;
  }
  const step = getCurrentQuestStep(getCurrentScene(), questName);

  if (questIsCompleted(getCurrentScene(), quest)) {
    return false;
  }

  return (step?.i ?? Infinity) > i;
};

const questStepLT = (questName: string, stepNumber: string | number) => {
  const i = parseInt(stepNumber as string);

  const quest = getQuest(questName);
  if (!quest) {
    console.error(
      `Error in conditional.  Cannot check questStepGT.  No quest with name: ${questName}`
    );
    return false;
  }
  const step = getCurrentQuestStep(getCurrentScene(), questName);

  if (questIsCompleted(getCurrentScene(), quest)) {
    return false;
  }

  return (step?.i ?? Infinity) < i;
};

const questStepEQ = (questName: string, stepNumber: string | number) => {
  const i = parseInt(stepNumber as string);

  const quest = getQuest(questName);
  if (!quest) {
    console.error(
      `Error in conditional.  Cannot check questStepGT.  No quest with name: ${questName}`
    );
    return false;
  }
  const step = getCurrentQuestStep(getCurrentScene(), questName);

  if (questIsCompleted(getCurrentScene(), quest)) {
    return false;
  }

  return (step?.i ?? Infinity) === i;
};

const inParty = (chName: string) => {
  const player = getCurrentPlayer();
  const chNameLower = chName.toLowerCase();
  return Boolean(
    player.party.find(ch => ch.name.toLowerCase() === chNameLower)
  );
};

const exp = {
  questActive,
  questNotStarted,
  questCompleted,
  questNotCompleted,
  questStepGT,
  questStepLT,
  questStepEQ,
  inParty,
};

export default exp;
