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
}

const Root = style('div', () => {
  return {
    position: 'absolute',
    width: '32px',
    left: 'calc(50% - 16px)',
    top: '178px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    whiteSpace: 'pre',
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
      <Icon color={color} />
      <div>{text}</div>
    </Root>
  );
};

export default BattleTurnIndicator;
