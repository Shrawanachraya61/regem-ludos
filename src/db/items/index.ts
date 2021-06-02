import { h } from 'preact';
import { init as initWeapons } from './weapons';
import { init as initQuestItems } from './quest';

import DefaultIcon from 'view/icons/Help';
import { BattleAction } from 'controller/battle-actions';

export interface ItemTemplate {
  name?: string;
  label: string;
  description: string;
  equipType?: ItemType;
  icon?: (...args: any[]) => h.JSX.Element;
  skills?: BattleAction[];
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

export interface IItemEquip {
  label: string;
  description: string;
  completedScriptKey: string;
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

  for (const i in exp) {
    const item = exp[i];
    item.name = i;

    if (!item.equipType) {
      item.equipType = ItemType.NONE;
    }

    if (!item.icon) {
      item.icon = DefaultIcon;
    }
  }
};
