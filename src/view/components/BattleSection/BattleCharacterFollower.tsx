/* @jsx h */
import { h, Fragment } from 'preact';
import { colors, IntrinsicProps, style, keyframes } from 'view/style';
import { getCurrentBattle } from 'model/generics';
import {
  BattleCharacter,
  battleCharacterCanAct,
  battleCharacterIsStaggered,
} from 'model/battle-character';
import { ProgressBarWithRender } from 'view/elements/ProgressBar';
import { characterGetHpPct } from 'model/character';
import {
  useBattleSubscription,
  useBattleSubscriptionWithBattleCharacter,
  useReRender,
} from 'view/hooks';
import {
  BattleAllegiance,
  BattleEvent,
  battleGetActingAllegiance,
  battleGetTargetedEnemy,
  battleSetEnemyTargetIndex,
} from 'model/battle';
import CharacterFollower from 'view/elements/CharacterFollower';
import { renderUi } from 'view/ui';
import { useState } from 'lib/preact-hooks';
import TargetIcon from 'view/icons/Target';
import ArmorIcon from 'view/icons/Armor';

interface IBattleCharacterProps {
  bCh: BattleCharacter;
  battleIndex: number;
  isEnemy: boolean;
}

const targetRotate = keyframes({
  '0%': {
    transform: 'rotateZ(0deg)',
  },
  '50%': {
    transform: 'rotateZ(180deg)',
  },
  '100%': {
    transform: 'rotateZ(360deg)',
  },
});

const TargetIndicatorContainer = style('div', () => {
  return {
    position: 'absolute',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    top: '-42px',
    '& > span': {
      marginLeft: '3px',
      fontSize: '20px',
      textTransform: 'uppercase',
      marginBottom: '8px',
    },
  };
});

const TargetIconContainer = style('div', () => {
  return {
    animation: `${targetRotate} 3000ms linear infinite`,
    width: '48px',
    height: '48px',
  };
});

const ArmorIconsContainer = style(
  'div',
  (props: { align: 'left' | 'right' }) => {
    return {
      position: 'absolute',
      right: props.align === 'right' ? '0px' : 'unset',
      left: props.align === 'left' ? '0px' : 'unset',
      width: '32px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      '& > div': {
        width: '28px',
        marginTop: '4px',
      },
    };
  }
);

const BattleCharacterFollower = (props: IBattleCharacterProps) => {
  const bCh = props.bCh;
  const battle = getCurrentBattle();

  const [currentlyActingAllegiance, setCurrentlyActingAllegiance] = useState(
    null
  );
  useBattleSubscription(
    getCurrentBattle(),
    BattleEvent.onTurnStarted,
    (allegiance: BattleAllegiance) => {
      console.log('turn started');
      setCurrentlyActingAllegiance(allegiance);
    }
  );
  useBattleSubscription(getCurrentBattle(), BattleEvent.onTurnEnded, () => {
    console.log('turn ended');
    setCurrentlyActingAllegiance(null);
  });

  const armorIcons: any[] = [];
  for (let i = 0; i < props.bCh.armor; i++) {
    armorIcons.push(
      <div>
        <ArmorIcon key={i} color={colors.LIGHTGREY} />
      </div>
    );
  }

  return (
    <CharacterFollower
      ch={bCh.ch}
      renderKey={'follower-' + bCh.ch.name}
      onClick={() => {
        if (props.isEnemy) {
          if (battleGetActingAllegiance(battle) === null) {
            battleSetEnemyTargetIndex(battle, props.battleIndex);

            //HACK Sort of... need to re-render this and also the enemy info cards
            renderUi();
          }
        }
      }}
      onMouseOver={() => {
        bCh.ch.highlighted = true;
      }}
      onMouseOut={() => {
        bCh.ch.highlighted = false;
      }}
    >
      {battleGetTargetedEnemy(battle) === bCh &&
      currentlyActingAllegiance === null ? (
        <TargetIndicatorContainer>
          <span>Target</span>
          <TargetIconContainer>
            <TargetIcon color={colors.RED} />
          </TargetIconContainer>
        </TargetIndicatorContainer>
      ) : null}
      <ArmorIconsContainer align={props.isEnemy ? 'right' : 'left'}>
        {armorIcons}
      </ArmorIconsContainer>
    </CharacterFollower>
  );
};

export default BattleCharacterFollower;
