/* @jsx h */
import { h, Fragment } from 'preact';
import { BattleCharacter } from 'model/battle-character';
import { colors, style } from 'view/style';
import { ProgressBarWithRender } from 'view/elements/ProgressBar';
import { characterGetHpPct } from 'model/character';
import AnimDiv from 'view/elements/AnimDiv';
import ActionSelectMenu from './ActionSelectMenu';
import { useState } from 'preact/hooks';
import { useCursorIndexStateWithKeypress } from 'view/hooks';
import {
  setBattleCharacterSelectedAction,
  setBattleCharacterIndexSelected,
} from 'controller/ui-actions';
import { getUiInterface } from 'view/ui';
import { getCurrentBattle, getIsPaused } from 'model/generics';
import ActionInfoTooltip from './ActionInfoTooltip';
import PillButton, { ButtonType } from 'view/elements/PillButton';

const MAX_WIDTH = '256px';
const PRIMARY_CONTAINER_WIDTH = '192px';
const PRIMARY_CONTAINER_HEIGHT = '96px';
const PORTRAIT_WIDTH = '96px';
const PRIMARY_BAR_WIDTH = '100%';
const PRIMARY_BAR_WIDTH_SHORT = '65%';
const PERCENT_BAR_HEIGHT = 24;
const PERCENT_BAR_SHORT_HEIGHT = 6;
const PROGRESS_HP_COLOR = colors.GREEN;
const PROGRESS_ACTION_COLOR = colors.BLUE;
const PROGRESS_STAG_COLOR = colors.YELLOW;
const PROGRESS_RESV_COLOR = colors.PURPLE;
const ACTION_MENU_HEIGHT = 146;
const BOX_SHADOW = '0px 0px 12px 8px rgba(0, 0, 0, 0.75)';

const Root = style('div', () => {
  return {
    boxSizing: 'border-box',
    transition: 'height 250ms',
    height: '180px',
  };
});

const TopRowContainer = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginLeft: '32px',
    marginBottom: '8px',
    pointerEvents: 'none',
  };
});

const CharacterNameLabel = style('div', () => {
  return {
    fontSize: '18px',
    color: colors.WHITE,
    textAlign: 'center',
    padding: '8px',
  };
});

const PrimaryRowContainer = style('div', () => {
  return {
    display: 'flex',
  };
});

const PrimaryRoot = style('div', () => {
  return {
    border: '2px solid ' + colors.BLACK,
    background: colors.DARKRED,
    display: 'flex',
    justifyContent: 'space-between',
    boxShadow: BOX_SHADOW,
    '&:hover': {
      border: '2px solid ' + colors.RED,
    },
  };
});

const ArmorInfoContainer = style('div', () => {
  return {
    display: 'flex',
    alignItems: 'column',
    width: '32px',
  };
});

const PrimaryContainer = style('div', () => {
  return {
    display: 'flex',
    flexDirection: 'column',
    width: PRIMARY_CONTAINER_WIDTH,
    padding: '0px 8px',
  };
});

const PercentBarContainer = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '4px',
  };
});

const PercentBarWrapper = style('div', (props: { short: boolean }) => {
  return {
    width: props.short ? PRIMARY_BAR_WIDTH_SHORT : PRIMARY_BAR_WIDTH,
    border: props.short ? 'unset' : `2px solid ${colors.WHITE}`,
    borderBottom: props.short ? 'unset' : '0px',
  };
});

interface IEnemyInfoCardProps {
  id?: string;
  bCh: BattleCharacter;
  characterIndex: number;
  isSelected: boolean;
}

const EnemyInfoCard = (props: IEnemyInfoCardProps) => {
  const createRenderKey = (append: string) => {
    return `${props.bCh.ch.name}_${append}`;
  };

  const handleSkillSelect = (i: number) => {
    setBattleCharacterSelectedAction(props.bCh, i);
  };

  const handlePrimaryClick = () => {
    if (getIsPaused()) {
      const battle = getCurrentBattle();
      setBattleCharacterIndexSelected(battle.allies.indexOf(props.bCh));
    }
  };

  const [cursorIndex, setCursorIndex] = useCursorIndexStateWithKeypress(
    props.isSelected,
    props.bCh.ch.skillIndex,
    props.bCh.ch.skills.map((_, i) => i),
    handleSkillSelect
  );

  const actionMenuOpen = props.isSelected;
  const chName = props.bCh.ch.name;
  const EVA = 0;
  const actionPct = 1;
  const hpPct = 1;
  const stagPct = 0.5;
  const resPct = 0.25;
  const portraitName = `${props.bCh.ch.spriteBase}_portrait`;
  const selectedAction = props.bCh.ch.skills[props.bCh.ch.skillIndex];
  const isTargeted = true;

  return (
    <>
      <Root>
        <TopRowContainer id="top-row-ctr">
          <PillButton id={'name-label-' + chName} type={ButtonType.SECONDARY}>
            TARGETED
          </PillButton>
        </TopRowContainer>
        <PrimaryRowContainer id="primary-row-ctr">
          <ArmorInfoContainer>ARMOR</ArmorInfoContainer>
          <PrimaryRoot id="primary-root" onClick={handlePrimaryClick}>
            <PrimaryContainer id="primary">
              <CharacterNameLabel id={'name-label-' + chName}>
                {chName}
              </CharacterNameLabel>
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
                    height={PERCENT_BAR_SHORT_HEIGHT}
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
                      return stagPct;
                    }}
                    renderKey={createRenderKey('stagger')}
                    backgroundColor={colors.BLACK}
                    color={PROGRESS_STAG_COLOR}
                    height={PERCENT_BAR_SHORT_HEIGHT}
                    label=""
                  />
                </PercentBarWrapper>
              </PercentBarContainer>
            </PrimaryContainer>
          </PrimaryRoot>
        </PrimaryRowContainer>
      </Root>
    </>
  );
};

export default EnemyInfoCard;
