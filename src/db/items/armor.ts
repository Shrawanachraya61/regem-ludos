import { ItemTemplate, ItemType } from '.';

export const init = (exp: { [key: string]: ItemTemplate }) => {
  exp.StarterArmor = {
    label: 'Starter Armor',
    description:
      'A standard-issue vestment that provides a paltry bare-minimum of defense.',
    type: ItemType.ARMOR,
    icon: 'armor',
    modifiers: {
      FOR: 1,
    },
  };

  exp.ResilientHoodie = {
    label: 'Resilient Hoodie',
    description:
      'This hoodie is made of an itchy, but also surprisingly resilient material.  Although it may not be very comfortable to wear, it can provide some protection from an everyday sword swing or arrow to the chest.',
    type: ItemType.ARMOR,
    icon: 'armor',
    modifiers: {
      CON: 2,
      FOR: 2,
    },
  };

  exp.MantleOfQuickness = {
    label: 'Mantle Of Quickness',
    description:
      'This wispy-then mantle makes one just a bit quicker on the uptake, especially when potentially sharp objects come hurtling in their general direction.',
    type: ItemType.ARMOR,
    icon: 'armor',
    modifiers: {
      EVA: 10,
    },
  };
};
