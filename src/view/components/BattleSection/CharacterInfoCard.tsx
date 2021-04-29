/* @jsx h */
import { h, Fragment } from 'preact';
import {
  BattleCharacter,
  battleCharacterIsStaggered,
  BattleActionState,
  battleCharacterIsActing,
  battleCharacterIsActingReady,
  battleCharacterCanAct,
  battleCharacterIsCasting,
} from 'model/battle-character';
import { colors, keyframes, style } from 'view/style';
import AnimDiv from 'view/elements/AnimDiv';
import ActionSelectMenu from './ActionSelectMenu';
import {
  useCursorIndexStateWithKeypress,
  useBattleSubscriptionWithBattleCharacter,
  useReRender,
} from 'view/hooks';
import {
  setBattleCharacterSelectedAction,
  setBattleCharacterIndexSelected,
} from 'controller/ui-actions';
import { getCurrentBattle, getIsPaused } from 'model/generics';
import ActionInfoTooltip from './ActionInfoTooltip';
import { BattleEvent } from 'model/battle';

import PrimaryInfo from './PrimaryInfo';
import PrimaryActingWeapon from './PrimaryActingWeapon';
import PrimaryActingRanged from './PrimaryActingRanged';
import PrimaryCasting from './PrimaryCasting';
import Circle from 'view/icons/Circle';
import { BattleActionType } from 'controller/battle-actions';
import SwingPierce from 'view/icons/SwingPierce';

const MAX_WIDTH = '256px';
const PRIMARY_CONTAINER_WIDTH = '192px';
const PRIMARY_CONTAINER_HEIGHT = '96px';
const PORTRAIT_WIDTH = '152px';
const ACTION_MENU_HEIGHT = 146;
const BOX_SHADOW = '0px 0px 12px 8px rgba(0, 0, 0, 0.75)';

const keyMapping = ['X', 'C', 'Z', 'V'];

const Root = style('div', (props: { expanded: boolean }) => {
  return {
    boxSizing: 'border-box',
    transition: 'height 250ms',
    height: props.expanded ? 180 + ACTION_MENU_HEIGHT + 'px' : '180px',
  };
});

const ActionInfoCardContainer = style('div', (props: { visible: boolean }) => {
  return {
    opacity: props.visible ? '1.0' : '0.0',
    transition: 'opacity 100ms linear',
  };
});

const TopRowContainer = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginLeft: '32px',
  };
});

const CharacterNameLabel = style('div', () => {
  return {
    fontSize: '18px',
    color: colors.BLACK,
    background: colors.WHITE,
    boxShadow: BOX_SHADOW,
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    textTransform: 'uppercase',
    border: `2px solid ${colors.BLACK}`,
    padding: '8px',
    marginBottom: '12px',
  };
});

const EVALabel = style('div', () => {
  return {
    fontSize: '16px',
    color: colors.WHITE,
    background: `linear-gradient(${colors.BLUE}, ${colors.DARKBLUE})`,
    boxShadow: BOX_SHADOW,
    borderRadius: '8px',
    padding: '2px 8px',
    borderBottom: '0px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
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
    width: PRIMARY_CONTAINER_HEIGHT,
    height: PRIMARY_CONTAINER_HEIGHT,
    cursor: 'pointer',
    overflow: 'hidden',
  };
});

const pulsePrimary = keyframes({
  '0%': {
    filter: 'brightness(100%)',
  },
  '50%': {
    filter: 'brightness(115%)',
  },
  '100%': {
    filter: 'brightness(100%)',
  },
});

const PrimaryRoot = style('div', (props: { ready: boolean }) => {
  return {
    border: '2px solid ' + colors.BLACK,
    background: colors.DARKBLUE,
    display: 'flex',
    justifyContent: 'space-between',
    animation: props.ready ? `${pulsePrimary} 1000ms linear infinite` : 'unset',
    boxShadow: BOX_SHADOW,
    height: PRIMARY_CONTAINER_HEIGHT,
    '&:hover': {
      border: '2px solid ' + colors.BLUE,
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

const BottomRowContainer = style(
  'div',
  (props: { actionsEnabled: boolean }) => {
    return {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: props.actionsEnabled ? 'flex-end' : 'center',
      position: 'relative',
    };
  }
);

const pulseButtonIcon = keyframes({
  '0%': {
    filter: 'brightness(100%)',
    transform: 'scale(1)',
  },
  '30%': {
    filter: 'brightness(200%)',
    transform: 'scale(1.2)',
  },
  '100%': {
    filter: 'brightness(100%)',
    transform: 'scale(1)',
  },
});

const BottomRowButtonIcon = style('div', (props: { active: boolean }) => {
  return {
    position: 'relative',
    fontSize: '16px',
    textAlign: 'center',
    width: '32px',
    height: '32px',
    padding: '0px 8px',
    color: colors.BLACK,
    marginLeft: '57px',
    marginTop: '8px',
    animation: props.active
      ? `${pulseButtonIcon} 750ms linear infinite`
      : 'unset',
  };
});

const BottomRowButtonIconText = style('div', () => {
  return {
    position: 'absolute',
    top: '0px',
    padding: '6px 12px',
  };
});

const BottomRowSelectedActionName = style('div', () => {
  return {
    fontSize: '16px',
    textAlign: 'center',
    width: PRIMARY_CONTAINER_WIDTH,
    padding: '2px 8px',
    background: `linear-gradient(${colors.GREY}, ${colors.BGGREY})`,
    borderRadius: '8px',
    boxShadow: BOX_SHADOW,
    marginTop: '8px',
  };
});

const BottomRowActionMenuWrapper = style(
  'div',
  (props: { expanded: boolean }) => {
    return {
      transition: 'transform 250ms, border 250ms, opacity 250ms',
      transformOrigin: 'top left',
      opacity: props.expanded ? '1' : '0',
      transform: props.expanded ? 'scaleY(1)' : 'scaleY(0)',
      maxHeight: ACTION_MENU_HEIGHT,
      width: '208px',
      background: colors.DARKGREY,
      border: props.expanded
        ? '2px solid ' + colors.BLACK
        : '2px solid ' + colors.BLACK,
      position: props.expanded ? 'unset' : 'absolute',
      top: '0px',
      right: '0px',
    };
  }
);

const BottomSwapButtonWrapper = style('div', () => {
  return {
    color: colors.WHITE,
    fontSize: '16px',
    width: PRIMARY_CONTAINER_HEIGHT,
    marginLeft: '32px',
  };
});

interface ICharacterInfoCardProps {
  id?: string;
  bCh: BattleCharacter;
  characterIndex: number;
  isSelected: boolean;
}

const CharacterInfoCard = (props: ICharacterInfoCardProps) => {
  const render = useReRender();

  const handleSkillSelect = (i: number) => {
    if (!actionMenuDisabled) {
      setBattleCharacterSelectedAction(props.bCh, i);
    }
  };

  const handlePrimaryClick = () => {
    if (getIsPaused()) {
      const battle = getCurrentBattle();
      setBattleCharacterIndexSelected(battle.allies.indexOf(props.bCh));
    }
  };

  useBattleSubscriptionWithBattleCharacter(
    getCurrentBattle(),
    props.bCh,
    BattleEvent.onCharacterReady,
    () => {
      render();
    }
  );
  useBattleSubscriptionWithBattleCharacter(
    getCurrentBattle(),
    props.bCh,
    BattleEvent.onCharacterActionStarted,
    () => {
      console.log(props.bCh.ch.name, 'Action started');
      render();
    }
  );
  useBattleSubscriptionWithBattleCharacter(
    getCurrentBattle(),
    props.bCh,
    BattleEvent.onCharacterActionEnded,
    () => {
      console.log(props.bCh.ch.name, 'Action ended');
      render();
    }
  );
  useBattleSubscriptionWithBattleCharacter(
    getCurrentBattle(),
    props.bCh,
    BattleEvent.onCharacterCasting,
    () => {
      console.log(props.bCh.ch.name, 'Casting started');
      render();
    }
  );

  const [cursorIndex, setCursorIndex] = useCursorIndexStateWithKeypress(
    props.isSelected,
    props.bCh.ch.skillIndex,
    props.bCh.ch.skills.map((_, i) => i),
    handleSkillSelect
  );

  const battle = getCurrentBattle();
  const chName = props.bCh.ch.name;
  const EVA = 0;
  const portraitName = `${props.bCh.ch.spriteBase}_portrait_f`;
  const selectedAction = props.bCh.ch.skills[props.bCh.ch.skillIndex];
  const chBattleState = props.bCh.actionState;
  const isInvokingSpell =
    selectedAction.type === BattleActionType.CAST &&
    battleCharacterIsActing(props.bCh);
  const actingWeaponVisible =
    battleCharacterIsActing(props.bCh) &&
    !isInvokingSpell &&
    selectedAction.type === BattleActionType.SWING;
  const actingRangeVisible =
    battleCharacterIsActing(props.bCh) &&
    !isInvokingSpell &&
    selectedAction.type === BattleActionType.RANGED;
  const castingVisible = battleCharacterIsCasting(props.bCh) || isInvokingSpell;
  const infoVisible =
    !battleCharacterIsActing(props.bCh) && !battleCharacterIsCasting(props.bCh);
  const actionMenuOpen = props.isSelected;
  const actionMenuDisabled =
    battleCharacterIsCasting(props.bCh) || battleCharacterIsActing(props.bCh);

  return (
    <>
      <ActionInfoCardContainer visible={actionMenuOpen}>
        <ActionInfoTooltip characterIndexSelected={props.characterIndex}>
          {props.bCh.ch.skills[cursorIndex]?.description}
        </ActionInfoTooltip>
      </ActionInfoCardContainer>
      <Root expanded={actionMenuOpen}>
        <TopRowContainer id="top-row-ctr">
          <CharacterNameLabel id={'name-label-' + chName}>
            {chName}
          </CharacterNameLabel>
          <EVALabel>EVA: {EVA}%</EVALabel>
        </TopRowContainer>
        <PrimaryRowContainer id="primary-row-ctr">
          <ArmorInfoContainer></ArmorInfoContainer>
          <PrimaryRoot
            id="primary-root"
            onClick={handlePrimaryClick}
            ready={chBattleState === BattleActionState.IDLE}
          >
            <PortraitContainer id={`portrait-${portraitName}`}>
              <AnimDiv
                style={{ width: PORTRAIT_WIDTH }}
                animName={portraitName}
              ></AnimDiv>
            </PortraitContainer>
            <PrimaryContainer id={'primary-' + props.bCh.ch.name}>
              {actingWeaponVisible ? (
                <PrimaryActingWeapon
                  bCh={props.bCh}
                  battleAction={selectedAction}
                />
              ) : null}
              {actingRangeVisible ? (
                <PrimaryActingRanged
                  bCh={props.bCh}
                  battleAction={selectedAction}
                />
              ) : null}
              {castingVisible ? (
                <PrimaryCasting bCh={props.bCh} battleAction={selectedAction} />
              ) : null}
              {infoVisible ? <PrimaryInfo bCh={props.bCh} /> : null}
            </PrimaryContainer>
          </PrimaryRoot>
        </PrimaryRowContainer>
        <BottomRowContainer
          actionsEnabled={actionMenuOpen}
          id={'bottom-row-ctr-' + props.bCh.ch.name}
        >
          {actionMenuOpen ? (
            <BottomSwapButtonWrapper>SWAP</BottomSwapButtonWrapper>
          ) : null}
          <BottomRowActionMenuWrapper expanded={actionMenuOpen}>
            <ActionSelectMenu
              bCh={props.bCh}
              cursorIndex={cursorIndex}
              setCursorIndex={setCursorIndex}
              onActionClicked={handleSkillSelect}
              disabled={actionMenuDisabled}
            />
          </BottomRowActionMenuWrapper>
          {actionMenuOpen ? null : (
            <BottomRowButtonIcon
              active={
                (battleCharacterCanAct(battle, props.bCh) ||
                  battleCharacterIsActingReady(props.bCh)) &&
                !getIsPaused()
              }
            >
              <Circle color={colors.GREY}></Circle>
              <BottomRowButtonIconText>
                {keyMapping[props.characterIndex]}
              </BottomRowButtonIconText>
            </BottomRowButtonIcon>
          )}
          {actionMenuOpen ? null : (
            <BottomRowSelectedActionName>
              {selectedAction.name}
            </BottomRowSelectedActionName>
          )}
        </BottomRowContainer>
      </Root>
    </>
  );
};

export default CharacterInfoCard;
