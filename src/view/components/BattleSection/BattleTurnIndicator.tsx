/* @jsx h */
import { h } from 'preact';
import { colors, style } from 'view/style';

import EnemyTurnIcon from 'view/icons/Hazard';
import PlayerTurnIcon from 'view/icons/Flower';
import ReadyTurnIcon from 'view/icons/Signal';
import { BattleAllegiance } from 'model/battle';

interface IBattleTurnIndicatorProps {
  id?: string;
  allegiance: BattleAllegiance;
  isEffectActive: boolean;
}

const Root = style('div', () => {
  return {
    position: 'absolute',
    left: 'calc(50% - 90px)',
    top: '178px',
    width: '180px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    whiteSpace: 'pre',
    background: 'rgba(0, 0, 0, 0.25)',
    boxShadow: '0px 0px 12px 8px rgb(0 0 0 / 25%)',
    borderRadius: '16px',
  };
});

const BattleTurnIndicator = (props: IBattleTurnIndicatorProps) => {
  const { Icon, color, text } = {
    [BattleAllegiance.ENEMY]: {
      Icon: EnemyTurnIcon,
      color: colors.RED,
      text: 'Enemy Acting...',
    },
    [BattleAllegiance.ALLY]: {
      Icon: PlayerTurnIcon,
      color: colors.BLUE,
      text: 'Player Acting...',
    },
    [BattleAllegiance.NONE]: {
      Icon: ReadyTurnIcon,
      color: colors.YELLOW,
      text: 'Awaiting Action',
    },
  }[props.allegiance];

  return (
    <Root id={'battle-turn-indicator'}>
      <div
        style={{
          width: '32px',
        }}
      >
        <Icon color={color} />
      </div>
      <div>{props.isEffectActive ? 'Using item' : text}</div>
    </Root>
  );
};

export default BattleTurnIndicator;
