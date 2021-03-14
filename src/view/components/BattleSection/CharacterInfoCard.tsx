/* @jsx h */
import { h, Fragment } from 'preact';
import { BattleCharacter } from 'model/battle-character';
import { colors, style } from 'view/style';
import { ProgressBarWithRender } from 'view/elements/ProgressBar';
import { characterGetHpPct } from 'model/character';
import AnimDiv from 'view/elements/AnimDiv';

const PRIMARY_CONTAINER_WIDTH = '192px';
const PRIMARY_CONTAINER_HEIGHT = '64px';
const PORTRAIT_WIDTH = '64px';
const PRIMARY_BAR_WIDTH = 192 - 8 - 8 + 'px';
const PRIMARY_BAR_WIDTH_SHORT = '128px';
const PERCENT_BAR_HEIGHT = 24;
const PERCENT_BAR_SHORT_HEIGHT = 8;
const PROGRESS_HP_COLOR = colors.GREEN;
const PROGRESS_ACTION_COLOR = colors.BLUE;
const PROGRESS_STAG_COLOR = colors.YELLOW;
const PROGRESS_RESV_COLOR = colors.PURPLE;

const Root = style('div', () => {
  return {
    boxSizing: 'border-box',
    // border: '2px solid ' + colors.BLACK,
    // width: 196 + 32 + 'px',
    // background: colors.DARKBLUE,
  };
});

const TopRowContainer = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: '32px',
  };
});

const CharacterNameLabel = style('div', () => {
  return {
    color: colors.WHITE,
    textStrokeWidth: '2px',
    textStrokeColor: colors.BLACK,
    fontSize: '16px',
  };
});

const EVALabel = style('div', () => {
  return {
    color: colors.BLUE,
    textStrokeWidth: '2px',
    textStrokeColor: colors.BLACK,
    fontSize: '16px',
  };
});

const PrimaryRowContainer = style('div', () => {
  return {
    display: 'flex',
  };
});

const PortraitContainer = style('div', () => {
  return {
    background: colors.DARKGREY,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRight: '2px solid ' + colors.BLACK,
    width: PORTRAIT_WIDTH,
    height: PRIMARY_CONTAINER_HEIGHT,
  };
});

const PrimaryRoot = style('div', () => {
  return {
    border: '2px solid ' + colors.BLACK,
    width: 196 + 32 + 'px',
    background: colors.DARKBLUE,
  };
});

const ArmorInfoContainer = style('div', () => {
  return {
    display: 'flex',
    alignItems: 'column',
  };
});

const PrimaryContainer = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'center',
    // alignItems: 'center',
    flexDirection: 'column',
    width: PRIMARY_CONTAINER_WIDTH,
    height: PRIMARY_CONTAINER_HEIGHT,
    padding: '8px',
  };
});

const PercentBarContainer = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'space-between',
  };
});

const PercentBarWrapper = style('div', (props: { short: boolean }) => {
  return {
    width: props.short ? PRIMARY_BAR_WIDTH_SHORT : PRIMARY_BAR_WIDTH,
  };
});

const BottomRowContainer = style(
  'div',
  (props: { actionsEnabled: boolean }) => {
    return {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: props.actionsEnabled ? 'bottom' : 'center',
    };
  }
);

const BottomRowButtonIcon = style('div', () => {
  return {
    fontSize: '16px',
    textAlign: 'center',
    width: PORTRAIT_WIDTH,
    padding: '0px 8px',
  };
});

const BottomRowActionName = style('div', () => {
  return {
    fontSize: '16px',
    textAlign: 'center',
    width: PRIMARY_CONTAINER_WIDTH,
    padding: '0px 8px',
  };
});

const BottomRowActionMenuWrapper = style('div', () => {
  return {
    height: '192px',
    overflowY: 'auto',
    background: colors.DARKGREY,
    border: '2px solid ' + colors.BLACK,
  };
});

const BottomSwapButtonWrapper = style('div', () => {
  return {
    color: colors.WHITE,
    fontSize: '16px',
    width: PORTRAIT_WIDTH,
  };
});

interface ICharacterInfoCardProps {
  id?: string;
  bCh: BattleCharacter;
}

const CharacterInfoCard = (props: ICharacterInfoCardProps) => {
  const createRenderKey = (append: string) => {
    return `${props.bCh.ch.name}_${append}`;
  };

  const actionMenuOpen = false;
  const chName = 'Character Name';
  const EVA = 0;
  const actionPct = 100;
  const hpPct = 100;
  const stagPct = 50;
  const resPct = 25;
  const portraitName = 'bartolo_portrait';
  const selectedAction = props.bCh.ch.skills[props.bCh.ch.skillIndex];

  return (
    <Root>
      <TopRowContainer id="top-row-ctr">
        <CharacterNameLabel>{chName}</CharacterNameLabel>
        <EVALabel>EVA: {EVA}</EVALabel>
      </TopRowContainer>
      <PrimaryRowContainer id="primary-row-ctr">
        <ArmorInfoContainer></ArmorInfoContainer>
        <PrimaryRoot id="primary-root">
          <PortraitContainer id={`portrait-${portraitName}`}>
            <AnimDiv
              style={{ width: PORTRAIT_WIDTH }}
              animName={portraitName}
            ></AnimDiv>
          </PortraitContainer>
          <PrimaryContainer id="primary">
            <PercentBarContainer>
              <PercentBarWrapper short={false}>
                <ProgressBarWithRender
                  id="progress-action"
                  renderFunc={() => {
                    return props.bCh.actionTimer.getPctComplete();
                  }}
                  renderKey={createRenderKey('action')}
                  backgroundColor={colors.BLACK}
                  color={PROGRESS_ACTION_COLOR}
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
                  height={20}
                  label={`HP: ${props.bCh.ch.hp}`}
                  // pct={characterGetHpPct(props.bCh.ch)}
                />
              </PercentBarWrapper>
            </PercentBarContainer>
            <PercentBarContainer>
              <span> STAG </span>
              <PercentBarWrapper short={true}>
                <ProgressBarWithRender
                  id="progress-stagger"
                  renderFunc={() => {
                    return stagPct;
                  }}
                  renderKey={createRenderKey('stagger')}
                  backgroundColor={colors.BLACK}
                  color={PROGRESS_STAG_COLOR}
                  height={PERCENT_BAR_SHORT_HEIGHT}
                  label=""
                  // pct={characterGetHpPct(props.bCh.ch)}
                />
              </PercentBarWrapper>
            </PercentBarContainer>
            <PercentBarContainer>
              <span> RESV </span>
              <PercentBarWrapper short={true}>
                <ProgressBarWithRender
                  id="progress-reserve"
                  renderFunc={() => {
                    return resPct;
                  }}
                  renderKey={createRenderKey('reserve')}
                  backgroundColor={colors.BLACK}
                  color={PROGRESS_RESV_COLOR}
                  height={PERCENT_BAR_SHORT_HEIGHT}
                  label=""
                  // pct={characterGetHpPct(props.bCh.ch)}
                />
              </PercentBarWrapper>
            </PercentBarContainer>
          </PrimaryContainer>
        </PrimaryRoot>
      </PrimaryRowContainer>
      <BottomRowContainer actionsEnabled={actionMenuOpen} id="bottom-row-ctr">
        {actionMenuOpen ? (
          <>
            <BottomSwapButtonWrapper>SWAP</BottomSwapButtonWrapper>
            <BottomRowActionMenuWrapper></BottomRowActionMenuWrapper>
          </>
        ) : (
          <>
            <BottomRowButtonIcon>X</BottomRowButtonIcon>
            <BottomRowActionName>{selectedAction.name}</BottomRowActionName>
          </>
        )}
      </BottomRowContainer>
    </Root>
  );
};

export default CharacterInfoCard;
