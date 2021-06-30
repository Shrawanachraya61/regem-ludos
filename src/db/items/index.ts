import { h } from 'preact';
import { init as initWeapons } from './weapons';
import { init as initQuestItems } from './quest';
import { init as initAccessories } from './accessories';
import { init as initConsumables } from './consumables';

import DefaultIcon from 'view/icons/Help';
import { BattleAction } from 'controller/battle-actions';
import { BattleStats } from 'model/battle';

export interface ItemTemplate {
  name?: string;
  label: string;
  description: string;
  effectDescription?: string;
  type?: ItemType;
  weaponType?: WeaponType;
  icon?: (...args: any[]) => h.JSX.Element;
  modifiers?: Partial<BattleStats & { armor: number }>;
  skills?: BattleAction[];
  onUse?: (item: Item, isBattle?: boolean) => Promise<void>;
}

export type Item = ItemTemplate;

export enum ItemType {
  NONE = 'none',
  QUEST = 'quest',
  JUNK = 'junk',
  USABLE = 'usable',
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

  for (const i in exp) {
    const item = exp[i];
    item.name = i;

    if (!item.type) {
      item.type = ItemType.NONE;
    }

    if (!item.icon) {
      switch (item.type) {
      }
      item.icon = DefaultIcon;
    }
  }
};
