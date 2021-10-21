/* @jsx h */
import { Player } from 'model/player';
import { h } from 'preact';
import VerticalMenu from 'view/elements/VerticalMenu';
import { colors, style } from 'view/style';
import CharacterStatus from '../CharacterStatus';

const InnerRoot = style('div', {
  width: '800px',
});

const PartyMember = style(
  'div',
  (props: { color?: string; padding?: string }) => {
    return {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '93px',
      background: props.color ?? 'unset',
      padding: props.padding ?? 'unset',
      boxSizing: 'border-box',
      border: props.color ? `2px solid ${colors.DARKGREEN}` : 'unset',
    };
  }
);

interface IMenuStatusProps {
  player?: Player;
  isInactive: boolean;
  onClose: () => void;
}

const MenuStatus = (props: IMenuStatusProps) => {
  if (!props.player) {
    return <div></div>;
  }

  const party = props.player.party;

  return (
    <InnerRoot>
      <VerticalMenu
        title="Party"
        width="100%"
        open={true}
        hideCloseBox={true}
        backgroundColor={colors.BLACK}
        items={party.map(ch => {
          return {
            label: (
              <PartyMember>
                {ch ? <CharacterStatus ch={ch} usePortrait={false} /> : null}
              </PartyMember>
            ),
            value: ch,
          };
        })}
        onItemClickSound="menu_select"
        onItemClick={() => {}}
        // onClose={() => {
        //   props.onClose();
        // }}
      />
    </InnerRoot>
  );
};

export default MenuStatus;
