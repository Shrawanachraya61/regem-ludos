/* @jsx h */
import { h } from 'preact';
import { colors, style } from 'view/style';
import VerticalMenu from 'view/elements/VerticalMenu';
import { Player } from 'model/player';
import { useState } from 'preact/hooks';
import ItemDescription from '../ItemDescription';

import { playSoundName } from 'model/sound';
import { ItemType } from 'db/items';
import { CardSize, sizes as cardSizes } from 'view/elements/Card';
import MenuBox from 'view/elements/MenuBox';
import { getCancelKeyLabel } from 'controller/events';
import { battleResetItemTimer } from 'model/battle';
import { getCurrentBattle } from 'model/generics';
import { renderUi } from 'view/ui';

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

interface IBattleItemsProps {
  player: Player;
  onClose: () => void;
}

const BattleItems = (props: IBattleItemsProps) => {
  const [menuOpen, setMenuOpen] = useState(true);

  const backpack = props.player.backpack.sort();
  const filteredBackpack = backpack.filter(item => {
    return item.type === ItemType.USABLE;
  });

  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const selectedItem = filteredBackpack[selectedItemIndex];

  const handleAuxClick = async () => {
    if (selectedItem?.onUse) {
      setMenuOpen(false);
      // playSoundName('menu_select');
      await selectedItem.onUse(selectedItem, true);
      battleResetItemTimer(getCurrentBattle());
      // renderUi();
      props.onClose();
    }
  };

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

  return (
    <MenuBox
      title="Items"
      onClose={() => {
        props.onClose();
      }}
      maxWidth={cardSizes[CardSize.XLARGE].width}
      closeButtonLabel={'Back ' + getCancelKeyLabel()}
      dark={true}
    >
      <InnerRoot>
        <LeftDiv>
          <VerticalMenu
            width="100%"
            maxHeight={'465px'}
            open={true}
            isInactive={!menuOpen}
            // hideTitle={true}
            title={'Usable Items'}
            startingIndex={0}
            items={filteredBackpack.map((item, i) => {
              return {
                label: (
                  <div
                    style={{
                      background:
                        i === selectedItemIndex
                          ? colors.DARKGREEN
                          : colors.BLACK,
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
    </MenuBox>
  );
};

export default BattleItems;
