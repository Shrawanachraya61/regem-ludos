/* @jsx h */
import { h } from 'preact';
import { colors, style } from 'view/style';
import VerticalMenu from 'view/elements/VerticalMenu';
import { Player } from 'model/player';
import { useState } from 'preact/hooks';
import ItemDescription from '../ItemDescription';
import { getAuxKeyLabel, isAuxKey } from 'controller/events';

import PurseIcon from 'view/icons/Purse';
import FlowerIcon from 'view/icons/Flower';
import SwordIcon from 'view/icons/Sword';
import PotionIcon from 'view/icons/Potion';
import { playSound, playSoundName } from 'model/sound';
import { ItemType } from 'db/items';
import { useInputEventStack, useKeyboardEventListener } from 'view/hooks';

const MAX_HEIGHT = '628px';

const InnerRoot = style('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  width: '800px',
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
    margin: '1px',
    boxSizing: 'border-box',
    border: '1px solid ' + colors.WHITE,
    background: props.highlighted ? colors.DARKBLUE : colors.DARKGREY,
    padding: '4px',
    width: '96px',
    cursor: 'pointer',
    '&:hover': {
      borderColor: colors.YELLOW,
    },
  };
});

interface IMenuItemsProps {
  player: Player;
  isInactive: boolean;
  onClose: () => void;
}

const MenuItems = (props: IMenuItemsProps) => {
  const [filterIndex, setFilterIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(true);

  const backpack = props.player.backpack.sort();
  const filteredBackpack = backpack.filter(item => {
    switch (filterIndex) {
      case 1: {
        return item.type === ItemType.USABLE;
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
  });

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

  const handleAuxClick = async () => {
    if (selectedItem?.onUse) {
      setMenuOpen(false);
      // playSoundName('menu_select');
      await selectedItem.onUse(selectedItem);
      setMenuOpen(true);
    }
  };

  useKeyboardEventListener(
    ev => {
      if (menuOpen) {
        if (ev.key === 'ArrowLeft') {
          setFilter((filterIndex - 1 + 4) % 4);
        } else if (ev.key === 'ArrowRight') {
          setFilter((filterIndex + 1) % 4);
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
      label: 'Usable',
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
                    highlighted={i === filterIndex}
                    onClick={() => {
                      setFilter(i);
                    }}
                  >
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
          items={filteredBackpack.map((item, i) => {
            return {
              label: (
                <div
                  style={{
                    background:
                      i === selectedItemIndex ? colors.DARKGREEN : colors.BLACK,
                  }}
                >
                  {item.label}
                </div>
              ),
              value: i,
            };
          })}
          onItemClickSound="menu_select"
          onItemClick={() => {
            handleAuxClick();
          }}
          onItemHover={(val: number) => {
            setSelectedItemIndex(val);
          }}
          onAuxClick={handleAuxClick}
        />
      </LeftDiv>
      <RightDiv>
        <DescriptionWrapper>
          <ItemDescription
            item={selectedItem}
            showName={true}
            onUse={() => {
              playSoundName('menu_select');
              handleAuxClick();
            }}
          />
        </DescriptionWrapper>
      </RightDiv>
    </InnerRoot>
  );
};

export default MenuItems;
