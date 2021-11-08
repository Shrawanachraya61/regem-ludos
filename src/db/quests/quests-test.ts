import { QuestTemplate } from '.';
import { colors } from 'view/style';

export const init = (exp: { [key: string]: QuestTemplate }) => {
  exp.TestQuest1 = {
    label: 'Test Quest 1',
    summary: 'This is a test quest.',
    description:
      'The test construct in the test room has a quest for you.  It wants you to talk to it a bunch of times for some reason.',
    questStartScriptKey: 'quest_test1',
    questEndScriptKey: 'quest_test1_complete',
    icon: 'gear',
    iconColor: colors.RED,
    experienceReward: 50,
    itemsReward: () => [],
    steps: [
      {
        completedScriptKey: 'quest_test1_1',
        label: 'Complete task 1.',
        description: 'Talk to TestDialogD to complete task 1.',
      },
      {
        completedScriptKey: 'quest_test1_2',
        label: 'Complete task 2.',
        description: 'Talk to TestDialogD to complete task 2.',
      },
    ],
  };
};
