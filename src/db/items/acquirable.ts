import { callScript } from 'controller/scene/scene-commands';
import { getCurrentPlayer } from 'model/generics';
import { playerRemoveItem } from 'model/player';
import { Item, ItemTemplate, ItemType } from '.';

export const init = (exp: { [key: string]: ItemTemplate }) => {
  exp.TicketCache10 = {
    label: '10 Tickets',
    description: 'Some tickets that are acquirable.',
    effectDescription: `Some tickets.`,
    type: ItemType.JUNK,
    icon: 'help',
    onAcquire: async (item: Item) => {
      callScript('utils-get-acquirable-tickets', 10);
      playerRemoveItem(getCurrentPlayer(), item.name as string);
    },
  };
};
