import { showPartyMemberSelectModal } from 'controller/ui-actions';
import { Character, characterModifyHp } from 'model/character';
import { getCurrentPlayer } from 'model/generics';
import { playerRemoveItem } from 'model/player';
import { playSoundName } from 'model/sound';
import { ItemTemplate, ItemType, Item } from '.';

export const init = (exp: { [key: string]: ItemTemplate }) => {
  exp.FeeblePotion = {
    label: 'Feeble Potion',
    description:
      'This bottle contains a green liquid that, when imbibed, restores a rather uninspiring amount of HP.',
    type: ItemType.USABLE,
    onUse: (item: Item) => {
      showPartyMemberSelectModal({
        onCharacterSelected: (ch: Character) => {
          playSoundName('blip');
          characterModifyHp(ch, 5);
          playerRemoveItem(getCurrentPlayer(), item.name as string);
        },
        onClose: () => {},
      });
    },
  };
};
