import { Item, ItemType } from 'db/items';
import { getCurrentBattle } from './generics';

export const itemIsCurrentlyUsable = (item?: Item) => {
  if (!item) {
    return false;
  }

  let isCurrentlyUsable = Boolean(item?.onUse);
  if (getCurrentBattle() && item.type === ItemType.USABLE_OVERWORLD) {
    isCurrentlyUsable = false;
  }
  if (!getCurrentBattle() && item.type === ItemType.USABLE_BATTLE) {
    isCurrentlyUsable = false;
  }
  return isCurrentlyUsable;
};
