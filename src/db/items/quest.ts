import { ItemTemplate, ItemType } from '.';

export const init = (exp: { [key: string]: ItemTemplate }) => {
  exp.HapticBracer = {
    label: 'Haptic Bracer',
    description:
      'A thick bracelet that surrounds the wrist.  Allows the user to interface with the various VR facilities inside the Regem Ludos Arcade.',
    type: ItemType.QUEST,
    icon: 'bracer',
  };

  exp.PingPongEquipment = {
    label: 'Ping Pong Equipment',
    description:
      'A standard set of Ping Pong equipment includes two rubber-shielded paddles (one side red, one side blue) and a shiny, three-star ping pong ball.',
    type: ItemType.QUEST,
    icon: 'star',
  };
};
