import { colors } from 'view/style';
import { QuestTemplate } from '.';

export const init = (exp: { [key: string]: QuestTemplate }) => {
  exp.OpeningQuest = {
    label: 'A Benign Request',
    summary:
      'Discover what Carl-Arnold wants with Ada at the Regem Ludos Arcade.',
    description:
      'Carl-Arnold, an acquaintance from the school they both attend, wants to meet Ada at an arcade in the city. ',
    questStartScriptKey: 'quest_floor1-main',
    questEndScriptKey: 'quest_floor1-main1-complete',
    steps: [
      {
        label: 'Find out where Carl-Arnold is inside the Regem Ludos Arcade.',
        description:
          'Carl-Arnold is waiting in the Regem Ludos Arcade.  Discover why he insists on Ada coming here to meet him today.',
      },
      {
        label: 'Go to the second floor of the Regem Ludos Arcade.',
        description:
          'Carl-Arnold is waiting for Ada on the second floor of the Regem Ludos Arcade.  Go there and meet him.',
      },
      {
        label: 'Follow Lotte.',
        description:
          'A girl named Lotte will lead the way to Carl-Arnold.  Follow her.',
      },
    ],
  };

  exp.Tutorial = {
    label: 'Mandatory Tutorial',
    summary: 'Complete the Regem Ludos tutorial.',
    description:
      'The Regem Ludos arcade requires the completion of a tutorial before anyone is allowed to ascend to further floors.',
    questStartScriptKey: 'quest_tutorial',
    questEndScriptKey: 'quest_tutorial_complete',
    steps: [
      {
        completedScriptKey: 'quest_tutorial1',
        label: 'Speak with Employee Jason.',
        description:
          'An employee standing in the atrium of the Regem Ludos arcade will provide a tutorial on how to use their fancy VR.  Ask him to do so.',
      },
      {
        completedScriptKey: 'quest_tutorial2',
        label: 'Follow Employee Jason through the tutorial.',
        description:
          'Employee Jason will guide Ada through the tutorial.  Follow his instructions to complete it.',
      },
      {
        completedScriptKey: 'quest_tutorial3',
        label: 'Find a way to escape the tutorial.',
        description:
          'Ada and Conscience arrived in the tutorial area via some kind of portal.  Find out if there is another one.',
      },
      {
        completedScriptKey: 'quest_tutorial4',
        label: 'Access the escape portal.',
        description:
          'An escape portal is on the northern side of the tutorial area.  Find a way to access the platform on which it resides.',
      },
    ],
  };

  exp.TicTacToe = {
    label: 'Tic Tac Woe',
    summary: 'The sad Tic Tac Toe AI deserves a few wins.',
    description:
      "A girl standing by the Tic Tac Toe machines feels sorry for the AI programmed inside of them.  After all, the game is so simple that it does an awful lot of losing.  Someone ought to let it win a couple of games so that it doesn't need to have it so rough.",
    questStartScriptKey: 'quest_floor1-atrium_tic-tac-toe',
    questEndScriptKey: 'quest_floor1-atrium_tic-tac-toe-complete',
    icon: 'tic-tac-toe',
    iconColor: colors.WHITE,
    experienceReward: 3,
    ticketsReward: 10,
    itemsReward: () => [],
    steps: [
      {
        completedScriptKey: 'quest_floor1-atrium_tic-tac-toe-1',
        label: 'Lose at Tic Tac Toe.',
        description:
          'Lose all three games in a single round at the Tic Tac Toe arcade cabinets by the entrance on floor 1.',
      },
    ],
  };

  exp.PingPong = {
    label: 'The Ping Pong Girl',
    summary: "A girl by the ping pong tables can't find any extra equipment.",
    description:
      'A girl is moping around the ping pong tables in the atrium lamenting the fact that there are no extra balls and paddles.  There has to be some ping pong equipment somewhere in this arcade, right?',
    questStartScriptKey: 'quest_floor1PingPongGirl',
    questEndScriptKey: 'quest_floor1PingPongGirl_complete',
    icon: 'star',
    iconColor: colors.WHITE,
    experienceReward: 3,
    ticketsReward: 10,
    itemsReward: () => [],
    steps: [
      {
        completedScriptKey: 'quest_floor1PingPongGirl_0',
        label: 'Speak to the greeter employee.',
        description:
          'Speak with the employee greeting people at the entrance to see if she knows where to get ping pong equipment.',
      },
      {
        completedScriptKey: 'quest_floor1PingPongGirl_1',
        label: 'Speak to the employee at the prize counter on floor 1.',
        description:
          'Speak with the employee at the prize counter to see if they have some ping pong equipment.',
      },
      {
        completedScriptKey: 'quest_floor1PingPongGirl_2',
        label: 'Speak to the boys playing Ping Pong in the atrium on floor 1.',
        description:
          'It seems that there is no extra equipment available right now.  Try to get the boys to share their paddles.',
      },
      {
        completedScriptKey: 'quest_floor1PingPongGirl_3',
        label: 'Keep searching for Ping Pong Equipment.',
        description:
          'The boys will not give up their paddles, but there has to be someone around here who knows how to get more equipment...',
      },
      {
        completedScriptKey: 'quest_floor1PingPongGirl_4',
        label: 'Meet the secretive person by the elevator on floor 1.',
        description:
          'Somebody approached and said that they know of a way to get ping pong equipment.  Speak with this individual by the elevator on floor 1.',
      },
      {
        completedScriptKey: 'quest_floor1PingPongGirl_5',
        label:
          'Enter the secret storage area in the room with the prize counter on floor 1.',
        description:
          'Apparantly there is a secret storage room accessible via a door on the south wall of the room with the prize counter on floor 1.  Find it and give the password "ZOOFA" to whomever is inside.',
      },
      {
        completedScriptKey: 'quest_floor1PingPongGirl_6',
        label:
          "Get an employee's vest and give it to the employee in the storage room.",
        description:
          'An employee inside the storage room requires an Employee Vest before he will help. He mentioned that "somebody is bound to be selling it somewhere."',
      },
      {
        completedScriptKey: 'quest_floor1PingPongGirl_7',
        label: 'Return to the employee in the storage room.',
        description: 'Give the employee in the storage room the Employee Vest.',
      },
      {
        completedScriptKey: 'quest_floor1PingPongGirl_8',
        label: 'Return to the Ping Pong Girl.',
        description: 'Give the Ping Pong Equipment to the Ping Pong Girl.',
      },
    ],
  };
};
