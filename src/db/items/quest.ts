import { ItemTemplate, ItemType } from '.';

export const init = (exp: { [key: string]: ItemTemplate }) => {
  exp.HapticBracer = {
    label: 'Haptic Bracer',
    description:
      'A thick bracelet that surrounds the wrist.  Allows the user to interface with the various VR facilities inside the Regem Ludos Arcade.',
    equipType: ItemType.QUEST,
  };
};
