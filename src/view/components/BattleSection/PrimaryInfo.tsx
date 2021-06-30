/* @jsx h */
import { h, Fragment } from 'preact';
import { colors, IntrinsicProps, style } from 'view/style';
import { getCurrentBattle } from 'model/generics';
import {
  BattleCharacter,
  battleCharacterCanAct,
  battleCharacterIsStaggered,
} from 'model/battle-character';
import { ProgressBarWithRender } from 'view/elements/ProgressBar';
import { characterGetHpPct } from 'model/character';
import {
  useBattleSubscriptionWithBattleCharacter,
  useReRender,
} from 'view/hooks';
import { BattleEvent } from 'model/battle';

const PRIMARY_BAR_WIDTH = '100%';
const PRIMARY_BAR_WIDTH_SHORT = '65%';
const PERCENT_BAR_HEIGHT = 24;
const PERCENT_BAR_SHORT_HEIGHT = 6;
const PROGRESS_HP_COLOR = colors.GREEN;
const PROGRESS_ACTION_COLOR = colors.BLUE;
const PROGRESS_STAG_COLOR = colors.YELLOW;
const PROGRESS_RESV_COLOR = colors.PURPLE;

interface IPrimaryInfoProps extends IntrinsicProps {
  id?: string;
  children?: string;
  bCh: BattleCharacter;
}

const PercentBarContainer = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '4px',
    fontSize: '12px',
  };
});

const PercentBarWrapper = style(
  'div',
  (props: { short: boolean; borderColor?: string }) => {
    return {
      width: props.short ? PRIMARY_BAR_WIDTH_SHORT : PRIMARY_BAR_WIDTH,
      border: props.short
        ? 'unset'
        : `2px solid ${props.borderColor ?? colors.WHITE}`,
      borderBottom: props.short ? 'unset' : '0px',
    };
  }
);

const PrimaryInfoProps = (props: IPrimaryInfoProps) => {
  const render = useReRender();

  const createRenderKey = (append: string) => {
    return `${props.bCh.ch.name}_${append}`;
  };

  useBattleSubscriptionWithBattleCharacter(
    getCurrentBattle(),
    props.bCh,
    BattleEvent.onCharacterDamaged,
    () => {
      render();
    }
  );

  useBattleSubscriptionWithBattleCharacter(
    getCurrentBattle(),
    props.bCh,
    BattleEvent.onCharacterStaggered,
    () => {
      render();
    }
  );

  useBattleSubscriptionWithBattleCharacter(
    getCurrentBattle(),
    props.bCh,
    BattleEvent.onCharacterRecovered,
    () => {
      render();
    }
  );

  const battle = getCurrentBattle();
  return (
    <>
      <PercentBarContainer>
        <PercentBarWrapper
          short={false}
          borderColor={
            battleCharacterCanAct(battle, props.bCh) ? colors.YELLOW : undefined
          }
        >
          <ProgressBarWithRender
            id="progress-action"
            renderFunc={() => {
              return props.bCh.actionTimer.getPctComplete();
            }}
            renderKey={createRenderKey('action')}
            backgroundColor={colors.BLACK}
            color={
              battleCharacterIsStaggered(props.bCh)
                ? colors.GREY
                : PROGRESS_ACTION_COLOR
            }
            height={PERCENT_BAR_HEIGHT}
            label=""
          />
        </PercentBarWrapper>
      </PercentBarContainer>
      <PercentBarContainer>
        <PercentBarWrapper short={false}>
          <ProgressBarWithRender
            id="progress-hp"
            renderFunc={() => {
              return characterGetHpPct(props.bCh.ch);
            }}
            renderKey={createRenderKey('hp')}
            backgroundColor={colors.BLACK}
            color={PROGRESS_HP_COLOR}
            height={PERCENT_BAR_HEIGHT}
            label={`HP: ${props.bCh.ch.hp}`}
          />
        </PercentBarWrapper>
      </PercentBarContainer>
      <PercentBarContainer>
        <span> STAG </span>
        <PercentBarWrapper short={true}>
          <ProgressBarWithRender
            id="progress-stagger"
            renderFunc={() => {
              return battleCharacterIsStaggered(props.bCh)
                ? 1 - props.bCh.staggerTimer.getPctComplete()
                : props.bCh.staggerGauge.getPct();
            }}
            renderKey={createRenderKey('stagger')}
            backgroundColor={colors.BLACK}
            color={
              battleCharacterIsStaggered(props.bCh)
                ? colors.WHITE
                : PROGRESS_STAG_COLOR
            }
            height={PERCENT_BAR_SHORT_HEIGHT}
            label=""
          />
        </PercentBarWrapper>
      </PercentBarContainer>
      <PercentBarContainer>
        <span> RESV </span>
        <PercentBarWrapper short={true}>
          <ProgressBarWithRender
            id="progress-reserve"
            renderFunc={() => {
              return 0.25;
            }}
            renderKey={createRenderKey('reserve')}
            backgroundColor={colors.BLACK}
            color={PROGRESS_RESV_COLOR}
            height={PERCENT_BAR_SHORT_HEIGHT}
            label=""
          />
        </PercentBarWrapper>
      </PercentBarContainer>
    </>
  );
};

export default PrimaryInfoProps;
