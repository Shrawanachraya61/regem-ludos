/* @jsx h */
import { h } from 'preact';
import { colors, style } from 'view/style';
import VerticalMenu from 'view/elements/VerticalMenu';
import { Player } from 'model/player';
import { useState } from 'preact/hooks';

const MAX_HEIGHT = '628px';

const InnerRoot = style('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  width: '100%',
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
  height: '475px',
});

const DescriptionName = style('div', {
  border: '1px solid ' + colors.WHITE,
  background: colors.DARKBLUE,
  // margin: '2px',
  padding: '16px',
});

const DescriptionBody = style('div', {
  border: '1px solid ' + colors.WHITE,
  background: colors.DARKGREY_ALT,
  margin: '2px 0px',
  padding: '16px',
  height: 'calc(100% - 54px)',
});

interface IMenuItemsProps {
  player: Player;
  isInactive: boolean;
  onClose: () => void;
}

const MenuItems = (props: IMenuItemsProps) => {
  const backpack = props.player.backpack.sort();
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);

  const selectedItem = backpack[selectedItemIndex];

  return (
    <InnerRoot>
      <LeftDiv>
        <VerticalMenu
          width="100%"
          maxHeight={parseInt(MAX_HEIGHT) - 128 + 'px'}
          open={true}
          isInactive={props.isInactive}
          hideTitle={true}
          items={backpack.map((item, i) => {
            return {
              label: (
                <div
                  style={{
                    background:
                      i === selectedItemIndex ? colors.DARKGREEN : colors.BLACK,
                  }}
                >
                  {item.name}
                </div>
              ),
              value: i,
            };
          })}
          onItemClickSound=""
          onItemClick={(val: number) => {
            setSelectedItemIndex(val);
          }}
        />
      </LeftDiv>
      <RightDiv>
        <DescriptionWrapper>
          <DescriptionName>{selectedItem?.name ?? ''}</DescriptionName>
          <DescriptionBody>{selectedItem?.description ?? ''}</DescriptionBody>
        </DescriptionWrapper>
      </RightDiv>
    </InnerRoot>
  );
};

export default MenuItems;
