import { QuestTemplate } from '.';

export const init = (exp: { [key: string]: QuestTemplate }) => {
  exp.Part1MainQuest = {
    label: 'Main',
    description: 'Discover what Carl-Arnold wants at the Regem Ludos Arcade.',
    questStartScriptKey: 'quest_floor1-main',
    questEndScriptKey: 'quest_floor1-main1-complete',
    steps: [
      {
        completedScriptKey: 'quest_floor1-main-1',
        label: 'Find Carl-Arnold on the second floor.',
        description:
          'Carl-Arnold said he is waiting for Ada on the second floor of the arcade.  Go and see what he wants.',
      },
      {
        completedScriptKey: 'quest_floor1-main-2',
        label: 'Acquire a "Haptic Bracer".',
        description:
          'Apparently something called a "Haptic Bracer" is required to access further floors of the arcade.  This can be acquired from the employee standing in the eastern side of the atrium.',
      },
      {
        completedScriptKey: 'quest_floor1-main-3',
        label: 'Complete the tutorial VR area.',
        description:
          'Follow Employee Jason through the tutorial VR area and follow his instructions.',
      },
    ],
  };

  exp.Part1MainQuest = {
    label: 'Main',
    description: 'Follow employee Jason through the Regem Ludos tutorial.',
    questStartScriptKey: 'quest_tutorial_active',
    questEndScriptKey: 'quest_tutorial_complete',
    steps: [
      {
        completedScriptKey: 'quest_tutorial1',
        label: 'Complete the tutorial.',
        description:
          'An employee of the Regem Ludos arcade is providing a tutorial.  This must be completed before access is granted to the upper floors.',
      },
    ],
  };

  exp.TicTacToe = {
    label: 'Tic Tac Toe',
    description: 'The sad Tic Tac Toe AI deserves a win.',
    questStartScriptKey: 'quest_floor1-atrium_tic-tac-toe',
    questEndScriptKey: 'quest_floor1-atrium_tic-tac-toe-complete',
    steps: [
      {
        completedScriptKey: 'quest_floor1-atrium_tic-tac-toe-1',
        label: 'Lose at Tic Tac Toe.',
        description:
          'Lose all three games in a row in one round at the Tic Tac Toe arcade cabinets by the entrance on floor 1.',
      },
    ],
  };
};
