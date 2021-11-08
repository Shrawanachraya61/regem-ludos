/* @jsx h */
import { h, Fragment } from 'preact';
import { colors, IntrinsicProps, style, keyframes } from 'view/style';
import { getCurrentBattle, getIsPaused } from 'model/generics';
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
  battleSetEnemyRangeTargetIndex,
  battleSetEnemyTargetIndex,
} from 'model/battle';
import { CharacterFollower } from 'view/elements/CharacterFollower';
import { renderUi } from 'view/ui';
import { useState } from 'preact/hooks';
import MeleeTargetIcon from 'view/icons/TargetMelee';
import RangeTargetIcon from 'view/icons/Target';
import ArmorIcon from 'view/icons/Armor';
import { BattleActionType } from 'controller/battle-actions';
import AnimDiv from 'view/elements/AnimDiv';
import { getDrawScale } from 'model/canvas';

interface IBattleCharacterProps {
  bCh: BattleCharacter;
  battleIndex: number;
  isEnemy: boolean;
  animName?: string;
  hideTargets?: boolean;
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

const targetBounce = keyframes({
  '0%': {
    transform: 'translateY(-2px)',
  },
  '30%': {
    transform: 'translateY(2px)',
  },
  '100%': {
    transform: 'translateY(-2px)',
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

const TargetIconContainerMelee = style('div', () => {
  return {
    // animation: `${targetRotate} 3000ms linear infinite`,
    animation: `${targetBounce} 750ms linear infinite`,
    width: '48px',
    height: '48px',
  };
});

const TargetIconContainerRanged = style('div', () => {
  return {
    animation: `${targetRotate} 3000ms linear infinite`,
    // animation: `${targetBounce} 1000ms linear infinite`,
    width: '48px',
    height: '48px',
  };
});

const ArmorIconsContainer = style(
  'div',
  (props: { align: 'left' | 'right' }) => {
    return {
      position: 'absolute',
      top: '0px',
      right: props.align === 'right' ? '0px' : 'unset',
      left: props.align === 'left' ? '14px' : 'unset',
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

  const render = useReRender();

  const [
    currentlyActingAllegiance,
    setCurrentlyActingAllegiance,
  ] = useState<BattleAllegiance | null>(null);
  useBattleSubscription(
    getCurrentBattle(),
    BattleEvent.onTurnStarted,
    (allegiance: BattleAllegiance) => {
      setCurrentlyActingAllegiance(allegiance);
    }
  );
  useBattleSubscription(getCurrentBattle(), BattleEvent.onTurnEnded, () => {
    setCurrentlyActingAllegiance(null);
  });

  useBattleSubscription(
    getCurrentBattle(),
    BattleEvent.onCharacterDamaged,
    (bCh: BattleCharacter) => {
      if (bCh === props.bCh) {
        render();
      }
    }
  );

  const targetedByMelee =
    battleGetTargetedEnemy(battle, BattleActionType.SWING) === bCh;
  const targetedByRanged =
    battleGetTargetedEnemy(battle, BattleActionType.RANGED) === bCh;

  const handleEnemyClick = () => {
    if (props.isEnemy) {
      if (battleGetActingAllegiance(battle) === null) {
        if (!targetedByMelee) {
          const wasTargetSet = battleSetEnemyTargetIndex(
            battle,
            props.battleIndex
          );
          if (!wasTargetSet) {
            battleSetEnemyRangeTargetIndex(battle, props.battleIndex);
          }
        } else {
          battleSetEnemyRangeTargetIndex(battle, props.battleIndex);
        }
        //HACK Sort of... need to re-render this and also the enemy info cards
        renderUi();
      }
    }
  };

  const armorIcons: any[] = [];
  if (props.bCh.armor > 0) {
    armorIcons.push(
      <div>
        <ArmorIcon key={0} color={colors.GREY} />
      </div>
    );
  }

  const isNobodyActing = currentlyActingAllegiance === null;
  const isPaused = getIsPaused();
  const targetsVisible =
    !props.hideTargets && !bCh.isDefeated && (isPaused || isNobodyActing);

  return (
    <CharacterFollower
      ch={bCh.ch}
      renderKey={'follower-' + bCh.ch.name}
      onClick={handleEnemyClick}
      onMouseOver={() => {
        bCh.ch.highlighted = true;
      }}
      onMouseOut={() => {
        bCh.ch.highlighted = false;
      }}
    >
      {props.animName ? (
        <AnimDiv
          id={bCh.ch.name + '_anim-div'}
          animName={props.animName}
          renderLoopId={bCh.ch.name + '_' + props.animName}
          scale={4}
          // width={128}
          // height={100}
          rootStyle={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '128px',
            height: '128px',
          }}
        ></AnimDiv>
      ) : null}
      {targetedByMelee && targetsVisible ? (
        <TargetIndicatorContainer>
          {/* <span>Target</span> */}
          <TargetIconContainerMelee>
            <MeleeTargetIcon color={colors.YELLOW} />
          </TargetIconContainerMelee>
        </TargetIndicatorContainer>
      ) : null}
      {targetedByRanged && targetsVisible ? (
        <TargetIndicatorContainer>
          {/* <span>Target</span> */}
          <TargetIconContainerRanged>
            <RangeTargetIcon color={colors.RED} />
          </TargetIconContainerRanged>
        </TargetIndicatorContainer>
      ) : null}
      <ArmorIconsContainer align={props.isEnemy ? 'right' : 'left'}>
        {armorIcons}
        {armorIcons.length > 0 ? (
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: props.isEnemy ? '-3px' : 'unset',
              left: props.isEnemy ? 'unset' : '-4px',
              fontSize: '20px',
            }}
          >
            {props.bCh.armor}
          </div>
        ) : null}
      </ArmorIconsContainer>
    </CharacterFollower>
  );
};

export default BattleCharacterFollower;
