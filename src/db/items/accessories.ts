import { ItemTemplate, ItemType } from '.';

// POW: number;
// ACC: number;
// FOR: number;
// CON: number;
// RES: number;
// SPD: number;
// EVA: number;
// HP: number;
// STAGGER: number; // stagger hp

export const init = (exp: { [key: string]: ItemTemplate }) => {
  exp.ZoeBracelet = {
    label: "Zoe's Bracelet",
    description:
      'This unassuming bracelet has the name "Zoe" etched into the outside of it in fancy cursive letters.  Although one might feel some guilt about wearing another\'s bracelet, the fact remains that Zoe is not here right now and has no agency in the matter.',
    type: ItemType.ACCESSORY,
    icon: 'bracelet',
    modifiers: {
      HP: 10,
    },
  };

  exp.ShieldRing = {
    label: 'Armor Ring',
    description:
      'When donning this ring, one feels a certain sense of relief; the kind that says, "You are safe, now.  Unless, of course, you engage in something particularly dangerous."',
    type: ItemType.ACCESSORY,
    icon: 'ring',
    modifiers: {
      armor: 1,
    },
  };
};
