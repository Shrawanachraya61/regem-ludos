import { BattleStats } from 'model/battle';
import {
  Character,
  characterAddItemStatus,
  characterHasItemStatus,
  characterModifyHp,
  characterRemoveItemStatus,
  characterSetItemStatusState,
  ItemStatus,
} from 'model/character';
import { getCurrentPlayer } from 'model/generics';
import { playerRemoveItem } from 'model/player';
import { playSoundName } from 'model/sound';
import { timeoutPromise } from 'utils';
import { Item, ItemTemplate, ItemType } from '..';
import {
  createOverworldStatusOnUseCb,
  createPartyMemberSelectOnUseCb,
} from '../consumables';

const applyOverworldStatBuff = (
  item: Item,
  duration: number,
  statMeta: Partial<BattleStats>
) => {
  const player = getCurrentPlayer();
  const leader = player.leader;

  if (characterHasItemStatus(leader, ItemStatus.STAT)) {
    characterRemoveItemStatus(leader, ItemStatus.STAT);
  }

  characterAddItemStatus(leader, ItemStatus.STAT, statMeta);
  playerRemoveItem(getCurrentPlayer(), item.name as string);
  timeoutPromise(duration - 5000).then(() => {
    characterSetItemStatusState(leader, ItemStatus.STAT, 'expiring');
  });
  timeoutPromise(duration).then(() => {
    characterRemoveItemStatus(leader, ItemStatus.STAT);
  });
};

export const init = (exp: { [key: string]: ItemTemplate }) => {
  exp.FennelSoda = {
    label: 'Fennel Soda',
    sortName: 'soda-fennel',
    description:
      'A refreshing drink that can get a bit too fizzy if left out for too long.',
    effectDescription: 'Outside of combat, restore 5 HP.',
    type: ItemType.USABLE_OVERWORLD,
    icon: 'soda',
    onUse: createPartyMemberSelectOnUseCb(
      'effect_heal_anim_loop',
      '+5',
      (ch: Character, item: Item) => {
        playSoundName('use_item');
        characterModifyHp(ch, 5);
        playerRemoveItem(getCurrentPlayer(), item.name as string);
      }
    ),
  };
  exp.CarrotSoda = {
    label: 'Carrot Soda',
    sortName: 'soda-carrot',
    description:
      'This delicious soda has an unfortunate reputation for accidentally masquerading as some kind of orange drink due to its color.  Nonetheless it provides a refreshing experience.',
    effectDescription: 'Outside of combat, restore 5 HP.',
    type: ItemType.USABLE_OVERWORLD,
    icon: 'soda',
    onUse: createPartyMemberSelectOnUseCb(
      'effect_heal_anim_loop',
      '+5',
      (ch: Character, item: Item) => {
        playSoundName('use_item');
        characterModifyHp(ch, 5);
        playerRemoveItem(getCurrentPlayer(), item.name as string);
      }
    ),
  };
  exp.DurianSoda = {
    label: 'Durian Soda',
    sortName: 'soda-durian',
    description:
      'One might expect this soda to have a pungent odor, but it is much the opposite: a sweet aroma and subtle savoriness punctuate the smells of this refreshing drink.',
    effectDescription: 'Outside of combat, restore 5 HP.',
    type: ItemType.USABLE_OVERWORLD,
    icon: 'soda',
    onUse: createPartyMemberSelectOnUseCb(
      'effect_heal_anim_loop',
      '+5',
      (ch: Character, item: Item) => {
        playSoundName('use_item');
        characterModifyHp(ch, 5);
        playerRemoveItem(getCurrentPlayer(), item.name as string);
      }
    ),
  };
  exp.OysterSoda = {
    label: 'Oyster Soda',
    sortName: 'soda-oyster',
    description:
      'This savory, bubbly refreshment provides a prefect pallette cleanser for the adventurous individual.',
    effectDescription: 'Outside of combat, restore 5 HP.',
    type: ItemType.USABLE_OVERWORLD,
    icon: 'soda',
    onUse: createPartyMemberSelectOnUseCb(
      'effect_heal_anim_loop',
      '+5',
      (ch: Character, item: Item) => {
        playSoundName('use_item');
        characterModifyHp(ch, 5);
        playerRemoveItem(getCurrentPlayer(), item.name as string);
      }
    ),
  };
  exp.GrilledTortillaChipettes = {
    label: 'Grilled Chip-Ettes',
    sortName: 'snack-grilled-chips',
    description:
      'These tiny chips are perfect fare for one seeking a crunchy, lightly salted delight.',
    effectDescription:
      'Increase POW by 1 for all party members for thirty seconds.',
    type: ItemType.USABLE_OVERWORLD,
    icon: 'snack',
    onUse: createOverworldStatusOnUseCb((item: Item) => {
      playSoundName('use_item');
      applyOverworldStatBuff(item, 30000, {
        POW: 1,
      });
    }),
  };
  exp.GarlicSticks = {
    label: 'Garlic Sticks',
    sortName: 'snack-garlic-sticks',
    description:
      'This short cylinder holds a veritable bevy of delicious garlic treats.',
    effectDescription:
      'Increase ACC by 1  for all party members for thirty seconds.',
    type: ItemType.USABLE_OVERWORLD,
    icon: 'snack',
    onUse: createOverworldStatusOnUseCb((item: Item) => {
      playSoundName('use_item');
      applyOverworldStatBuff(item, 30000, {
        ACC: 1,
      });
    }),
  };
  exp.EspressoTart = {
    label: 'Espresso Tart',
    sortName: 'snack-espresso-tart',
    description:
      "This nondescript rectangle might not look like much, but it's packed with a strong enough concentration of caffeine and flavor to life the spirts of any drowsy individual.",
    effectDescription:
      'Increase EVA by 1  for all party members for thirty seconds.',
    type: ItemType.USABLE_OVERWORLD,
    icon: 'snack',
    onUse: createOverworldStatusOnUseCb((item: Item) => {
      playSoundName('use_item');
      applyOverworldStatBuff(item, 30000, {
        EVA: 1,
      });
    }),
  };
};
