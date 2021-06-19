import {
  hideModal,
  showModal,
  showPartyMemberSelectModal,
} from 'controller/ui-actions';
import { Character, characterModifyHp } from 'model/character';
import { getCurrentPlayer } from 'model/generics';
import { playerRemoveItem } from 'model/player';
import { playSoundName } from 'model/sound';
import { ModalSection } from 'model/store';
import { renderUi } from 'view/ui';
import { ItemTemplate, ItemType, Item } from '.';

export const init = (exp: { [key: string]: ItemTemplate }) => {
  exp.FeeblePotion = {
    label: 'Feeble HP Potion',
    description:
      'This bottle contains a green liquid that, when imbibed, restores a rather uninspiring amount of HP.',
    type: ItemType.USABLE,
    onUse: async (item: Item) => {
      return new Promise(resolve => {
        showPartyMemberSelectModal({
          onCharacterSelected: (ch: Character) => {
            playSoundName('use_item');
            characterModifyHp(ch, 5);
            playerRemoveItem(getCurrentPlayer(), item.name as string);
            renderUi();

            setTimeout(() => {
              hideModal();
              resolve();
            }, 1000);
          },
          onClose: resolve,
        });
      });
    },
  };
};
