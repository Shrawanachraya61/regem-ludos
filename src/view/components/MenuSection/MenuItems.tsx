/* @jsx h */
import { h } from 'preact';
import { colors, keyframes, style } from 'view/style';
import VerticalMenu from 'view/elements/VerticalMenu';
import { Player, playerGetItemCount } from 'model/player';
import { useState } from 'preact/hooks';
import ItemDescription from '../ItemDescription';
import { getAuxKeyLabel, isAuxKey, isCancelKey } from 'controller/events';

import PurseIcon from 'view/icons/Purse';
import FlowerIcon from 'view/icons/Flower';
import SwordIcon from 'view/icons/Sword';
import PotionIcon from 'view/icons/Potion';
import ArrowIcon from 'view/icons/Arrow';
import { playSound, playSoundName } from 'model/sound';
import { ItemTemplate, ItemType } from 'db/items';
import { useInputEventStack, useKeyboardEventListener } from 'view/hooks';
import { sortItems } from 'utils';
import { itemIsCurrentlyUsable } from 'model/item';
import { getIcon } from 'view/icons';

const MAX_HEIGHT = '628px';

const InnerRoot = style('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  width: '100%',
  zIndex: '1',
  // height: '100%',
});

const LeftDiv = style('div', {
  width: '50%',
  maxHeight: MAX_HEIGHT,
});

const RightDiv = style('div', {
  width: '50%',
});

const DescriptionWrapper = style('div', {
  width: '100%',
  height: '508px',
  border: '1px solid ' + colors.WHITE,
  background: colors.DARKGREY_ALT,
});

const FilterWrapper = style('div', {
  border: '1px solid ' + colors.WHITE,
  background: colors.DARKGREY_ALT,
  height: '89px',
});

const FilterDescription = style('div', {
  textAlign: 'center',
  color: colors.WHITE,
  fontSize: '16px',
});

const FilterItemsWrapper = style('div', {
  display: 'flex',
  justifyContent: 'center',
});

const FilterItem = style('div', (props: { highlighted: boolean }) => {
  return {
    margin: '2px',
    boxSizing: 'border-box',
    border: '1px solid ' + colors.WHITE,
    background: props.highlighted ? colors.DARKBLUE : colors.DARKGREY,
    padding: '4px',
    width: '99px',
    cursor: 'pointer',
    '&:hover': {
      borderColor: colors.YELLOW,
    },
  };
});

const arrowPulse = keyframes({
  '0%': {
    opacity: '1',
  },
  '50%': {
    opacity: '0',
  },
  '100%': {
    opacity: '1',
  },
});

const ArrowIndicator = style('div', (props: { left?: boolean }) => {
  return {
    width: '16px',
    transform: props.left ? 'rotate(180deg)' : 'unset',
    marginTop: '24px',
    animation: `${arrowPulse} 750ms linear infinite`,
  };
});

interface IMenuItemsProps {
  player: Player;
  isInactive: boolean;
  onClose: () => void;
}

const MenuItems = (props: IMenuItemsProps) => {
  const [filterIndex, setFilterIndex] = useState(1);
  const [menuOpen, setMenuOpen] = useState(true);

  const backpack = props.player.backpack;
  const filteredBackpackA = backpack
    .filter(item => {
      switch (filterIndex) {
        case 1: {
          return (
            item.type === ItemType.USABLE ||
            item.type === ItemType.USABLE_BATTLE ||
            item.type === ItemType.USABLE_OVERWORLD
          );
        }
        case 2: {
          return [ItemType.WEAPON, ItemType.ARMOR, ItemType.ACCESSORY].includes(
            item.type as ItemType
          );
        }
        case 3: {
          return item.type === ItemType.QUEST;
        }
        default: {
          return true;
        }
      }
    })
    .sort(sortItems);

  const filteredBackpack: ItemTemplate[] = [];
  for (let i = 0; i < filteredBackpackA.length; i++) {
    const item = filteredBackpackA[i];
    if (!filteredBackpack.find(item2 => item2.name === item.name)) {
      filteredBackpack.push(item);
    }
  }

  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const selectedItem = filteredBackpack[selectedItemIndex];

  const setFilter = (i: number) => {
    playSoundName('menu_select2');
    setFilterIndex(i);
    setSelectedItemIndex(0);
    setMenuOpen(false);
    // hack: re-render the vertical menu twice so the cursor appears in the right spot
    setTimeout(() => {
      setMenuOpen(true);
    }, 20);
  };

  const handleItemClick = async () => {
    if (itemIsCurrentlyUsable(selectedItem) && selectedItem.onUse) {
      setMenuOpen(false);
      // playSoundName('menu_select');
      await selectedItem.onUse(selectedItem);
      setMenuOpen(true);
    }
  };

  let descScrollToggle = true;
  useKeyboardEventListener(
    ev => {
      if (menuOpen) {
        if (ev.key === 'ArrowLeft') {
          setFilter((filterIndex - 1 + 4) % 4);
        } else if (ev.key === 'ArrowRight') {
          setFilter((filterIndex + 1) % 4);
        } else if (isAuxKey(ev.key)) {
          // HACK: Toggle scroll of description when pressing AUX button.
          // This doesn't even work properly, somebody should fix this.
          const descDiv = document.getElementById('item-description-container');
          if (descDiv) {
            if (descScrollToggle) {
              descDiv.scrollTop = 9999;
            } else {
              descDiv.scrollTop = 0;
            }
            descScrollToggle = !descScrollToggle;
          }
        }
      }
    },
    [filterIndex, menuOpen]
  );

  const modifiers = selectedItem?.modifiers || {};
  const modStrings: string[] = [];
  for (const i in modifiers) {
    const mod = modifiers[i];
    modStrings.push(`${i.toUpperCase()}: ${mod > 0 ? '+' : ''}${mod}`);
  }

  const skills = selectedItem?.skills || [];
  const skillStrings: string[] = [];
  for (const i in skills) {
    const skill = skills[i];
    skillStrings.push(skill.name);
  }

  const filters = [
    {
      label: 'All',
      icon: PurseIcon,
    },
    {
      label: 'Consumable',
      icon: PotionIcon,
    },
    {
      label: 'Equipment',
      icon: SwordIcon,
    },
    {
      label: 'Quest',
      icon: FlowerIcon,
    },
  ];
  return (
    <InnerRoot>
      <LeftDiv>
        <FilterWrapper>
          <FilterDescription>
            <div
              style={{ padding: '8px' }}
            >{`Press Left/Right Arrows to change filter.`}</div>
            <FilterItemsWrapper>
              {filters.map((obj, i) => {
                return (
                  <FilterItem
                    key={obj.label + i}
                    highlighted={i === filterIndex}
                    onClick={() => {
                      setFilter(i);
                    }}
                  >
                    {i === filterIndex ? (
                      <div
                        style={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          height: '0px',
                          position: 'relative',
                          alignItems: 'center',
                        }}
                      >
                        <ArrowIndicator left>
                          <ArrowIcon color={colors.WHITE} />
                        </ArrowIndicator>
                        <ArrowIndicator>
                          <ArrowIcon color={colors.WHITE} />
                        </ArrowIndicator>
                      </div>
                    ) : null}
                    <div
                      style={{
                        width: '22px',
                        margin: 'auto',
                      }}
                    >
                      <obj.icon color={colors.WHITE} />
                    </div>
                    {obj.label}
                  </FilterItem>
                );
              })}
            </FilterItemsWrapper>
          </FilterDescription>
        </FilterWrapper>
        <VerticalMenu
          width="100%"
          maxHeight={'409px'}
          open={true}
          isInactive={!menuOpen || props.isInactive}
          hideTitle={true}
          startingIndex={0}
          itemHeight={48}
          items={filteredBackpack.map((item, i) => {
            const count = playerGetItemCount(props.player, item.name as string);
            const Icon = getIcon(item.icon ?? 'help');
            return {
              label: (
                <div
                  style={{
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                    textDecoration: itemIsCurrentlyUsable(item)
                      ? 'underline'
                      : 'unset',
                    background:
                      i === selectedItemIndex ? colors.DARKGREEN : 'unset',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      marginRight: '16px',
                      marginLeft: '32px',
                    }}
                  >
                    <Icon color={colors.WHITE} />
                  </div>
                  {item.label} {count > 1 ? `(${count})` : ''}
                </div>
              ),
              value: i,
            };
          })}
          onItemClickSound="menu_select"
          onItemClick={() => {
            handleItemClick();
          }}
          onItemHover={(val: number) => {
            setSelectedItemIndex(val);
          }}
        />
      </LeftDiv>
      <RightDiv>
        <DescriptionWrapper>
          <ItemDescription
            item={selectedItem}
            showName={true}
            onUse={() => {
              playSoundName('menu_select');
              handleItemClick();
            }}
          />
        </DescriptionWrapper>
      </RightDiv>
    </InnerRoot>
  );
};

export default MenuItems;
