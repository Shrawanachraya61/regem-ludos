/* @jsx h */
import { getCurrentPlayer } from 'model/generics';
import { playerGetItemCount } from 'model/player';
import { h } from 'preact';
import { colors } from 'view/style';
import { getIfExists as getItem } from 'db/items';
import { getIcon } from 'view/icons';

interface IUseItemDescriptionProps {
  itemName: string;
}

const UseItemDescription = (props: IUseItemDescriptionProps) => {
  const player = getCurrentPlayer();
  const ct = playerGetItemCount(player, props.itemName ?? '');
  const item = getItem(props.itemName);

  const Icon = getIcon(item?.icon ?? '');

  return (
    <div
      style={{
        marginBottom: '16px',
        padding: '16px',
        fontSize: '18px',
      }}
    >
      {item?.icon ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '8px',
          }}
        >
          <div
            style={{
              width: '48px',
            }}
          >
            <Icon color={colors.WHITE} />
          </div>
        </div>
      ) : null}
      <div
        style={{
          color: colors.ORANGE,
          textAlign: 'center',
          marginBottom: '8px',
        }}
      >
        {item?.label}
      </div>
      <div
        style={{
          color: colors.WHITE,
          textAlign: 'center',
          marginBottom: '8px',
        }}
      >
        {item?.effectDescription}
      </div>
      <div
        style={{
          textAlign: 'center',
        }}
      >
        You have{' '}
        <span
          style={{
            color: ct > 0 ? colors.BLUE : colors.RED,
            transform: 'scale(1.25)',
          }}
        >
          {ct}
        </span>{' '}
        remaining.
      </div>
    </div>
  );
};

export default UseItemDescription;
