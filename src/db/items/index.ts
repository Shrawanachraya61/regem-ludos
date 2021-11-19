import { init as initWeapons } from './weapons';
import { init as initQuestItems } from './quest';
import { init as initAccessories } from './accessories';
import { init as initConsumables } from './consumables';
import { init as initVending } from './overworld-consumables/vending';
import { init as initArmor } from './armor';

import { BattleAction } from 'controller/battle-actions';
import { BattleStats } from 'model/battle';

export interface ItemTemplate {
  name?: string;
  label: string;
  sortName?: string;
  description: string;
  effectDescription?: string;
  type?: ItemType;
  weaponType?: WeaponType;
  icon?: string;
  modifiers?: Partial<BattleStats & { armor: number }>;
  skills?: BattleAction[];
  onUse?: (item: Item, isBattle?: boolean) => Promise<boolean>;
  onAcquire?: (item: Item) => Promise<void>;
}

export type Item = ItemTemplate;

export enum ItemType {
  NONE = 'none',
  QUEST = 'quest',
  JUNK = 'junk',
  USABLE = 'usable',
  USABLE_BATTLE = 'usable-battle',
  USABLE_OVERWORLD = 'usable-overworld',
  WEAPON = 'weapon',
  ARMOR = 'armor',
  ACCESSORY = 'accessory',
}

export enum WeaponType {
  SWORD = 'sword',
  SPEAR = 'spear',
  HAMMER = 'hammer',
  BOW = 'bow',
  GUN = 'gun',
  WAND = 'wand',
}

const exp = {} as { [key: string]: ItemTemplate };
export const get = (key: string): Item => {
  const result = exp[key];
  if (!result) {
    throw new Error(`No item template exists with name: ${key}`);
  }
  return {
    ...result,
  };
};

export const getIfExists = (key: string): Item | null => {
  const result = exp[key];
  if (!result) {
    return null;
  }
  return {
    ...result,
  };
};

export const init = () => {
  initWeapons(exp);
  initQuestItems(exp);
  initAccessories(exp);
  initConsumables(exp);
  initVending(exp);
  initArmor(exp);

  for (const i in exp) {
    const item = exp[i];
    if (!item.name) {
      item.name = i;
    }

    if (!item.type) {
      item.type = ItemType.NONE;
    }

    if (!item.icon) {
      switch (item.type) {
      }
      item.icon = 'help';
    }
  }
};
