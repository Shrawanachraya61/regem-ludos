/* @jsx h */
import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import {
  getCurrentBattle,
  getCurrentPlayer,
  getIsPaused,
} from 'model/generics';
import { style, colors } from 'view/style';
import { pause, unpause } from 'controller/loop';

import CharacterInfoCard from './CharacterInfoCard';
import EnemyInfoCard from './EnemyInfoCard';
import { getUiInterface, renderUi } from 'view/ui';

import { CharacterFollower } from 'view/elements/CharacterFollower';
import { getDrawScale } from 'model/canvas';
import { Character } from 'model/character';
import {
  BattleAllegiance,
  battleCycleMeleeTarget,
  battleCycleRangeTarget,
  BattleEvent,
  battleGetActingAllegiance,
  battleGetAllPersistentEffectsForAllegiance,
  battleGetTargetedEnemy,
  battleSetEnemyTargetIndex,
} from 'model/battle';
import { useBattleSubscription, useKeyboardEventListener } from 'view/hooks';
import ArmorIcon from 'view/icons/Armor';
import MeleeTargetIcon from 'view/icons/TargetMelee';
import RangeTargetIcon from 'view/icons/Target';
import BattleCharacterFollower from './BattleCharacterFollower';
import ChannelIndicators from './ChannelIndicators';
import TopBar, { TopBarButtons } from '../TopBar';
import {
  setBattleCharacterIndexSelected,
  showSection,
} from 'controller/ui-actions';
import { AppSection } from 'model/store';
import VerticalMenu from 'view/elements/VerticalMenu';
import { isCancelKey, isPauseKey } from 'controller/events';
import { playSoundName } from 'model/sound';
import BattleItems from './BattleItems';
import BattleTurnIndicator from './BattleTurnIndicator';
import { fleeBattle } from 'controller/battle-management';
import CharacterFollowerMenu from 'view/elements/CharacterFollowerMenu';

const BOX_SHADOW = '0px 0px 12px 8px rgba(0, 0, 0, 0.75)';

interface IBattleSectionProps {
  id?: string;
}

const Root = style('div', () => {
  return {
    position: 'absolute',
    top: '0px',
    left: '0px',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  };
});

const PauseTextSection = style('div', () => {
  return {
    position: 'absolute',
    left: '0',
    top: '168px',
    fontSize: '18px',
    width: '100%',
    textAlign: 'right',
  };
});

const CharacterInfoCardsContainer = style('div', () => {
  return {
    position: 'absolute',
    bottom: '0px',
    left: '0px',
    width: 'calc(100% - 64px)',
    margin: '32px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    flexDirection: 'row-reverse',
    pointerEvents: 'all',
  };
});

const EnemyInfoCardsContainer = style('div', () => {
  return {
    position: 'absolute',
    top: '0px',
    right: '0px',
    width: 'calc(100% - 64px)',
    margin: '8px 32px',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    pointerEvents: 'all',
  };
});

const BattleMenuContainer = style('div', (props: { visible: boolean }) => {
  const width = 250;
  return {
    position: 'absolute',
    pointerEvents: 'all',
    margin: '32px',
    left: '0',
    top: '64px',
    width: width + 'px',
    transform: props.visible
      ? 'translateX(0)'
      : `translateX(-${width + 32 + 12}px)`,
    transition: 'transform 200ms ease-out',
    boxShadow: BOX_SHADOW,
  };
});

const BattleMenuItem = style('div', (props: { disabled?: boolean }) => {
  return {
    padding: '8px',
    pointerEvents: props.disabled ? 'none' : 'inherit',
    background: props.disabled ? colors.BGGREY : 'unset',
    borderRadius: '4px',
    color: props.disabled ? colors.GREY : 'unset',
  };
});

const TargetIconContainer = style('div', () => {
  return {
    width: '32px',
    height: '32px',
    display: 'inline-block',
    transform: 'translateY(10px)',
    marginLeft: '8px',
  };
});

const BattleSection = (props: IBattleSectionProps) => {
  const battle = getCurrentBattle();
  const uiState = getUiInterface().appState.battle;
  const [menuState, setMenuState] = useState('');

  const isPaused = getIsPaused();
  const isEffectActive = uiState.effect.active;
  const isCutsceneVisible = getUiInterface().appState.sections.includes(
    AppSection.Cutscene
  );

  const [
    currentlyActingAllegiance,
    setCurrentlyActingAllegiance,
  ] = useState<null | BattleAllegiance>(null);
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

  useKeyboardEventListener(
    ev => {
      if (isEffectActive || isCutsceneVisible) {
        return;
      }

      if (isPaused && menuState === '') {
        if (isCancelKey(ev.key) || isPauseKey(ev.key)) {
          playSoundName('woosh_reverse');
          unpause();
        } else if (ev.key === 'ArrowLeft') {
          if (battleCycleMeleeTarget(battle)) {
            playSoundName('menu_select');
          } else {
            playSoundName('menu_cancel');
          }
          renderUi();
        } else if (ev.key === 'ArrowRight') {
          if (battleCycleRangeTarget(battle)) {
            playSoundName('menu_select');
          } else {
            playSoundName('menu_cancel');
          }
          renderUi();
        }
      } else if (isPaused && menuState === 'actions') {
        if (ev.key === 'Tab' || ev.key === 'ArrowLeft') {
          const uiState = getUiInterface().appState.battle;
          const battle = getCurrentBattle();
          let nextIndex =
            (uiState.characterIndexSelected + 1) % battle.allies.length;
          if (nextIndex === -1) {
            nextIndex = battle.allies.length - 1;
          }
          playSoundName('menu_select');
          setBattleCharacterIndexSelected(nextIndex);
          ev.preventDefault();
        } else if (ev.key === 'ArrowRight') {
          const uiState = getUiInterface().appState.battle;
          let nextIndex = uiState.characterIndexSelected - 1;
          if (nextIndex === -1) {
            nextIndex = 0;
          }
          playSoundName('menu_select');
          setBattleCharacterIndexSelected(nextIndex);
          ev.preventDefault();
        } else if (isCancelKey(ev.key)) {
          playSoundName('menu_select2');
          setMenuState('');
        }
      }
    },
    [isPaused, menuState, isEffectActive]
  );

  const isActionsVisible = menuState === 'actions';
  const areBattleMenuItemsDisabled =
    battleGetActingAllegiance(getCurrentBattle()) !== null;

  const selectedStyles = {
    background: colors.DARKGREEN,
  };

  console.log(
    'RENDER BATTLE SECTION',
    isPaused,
    isEffectActive,
    uiState.effect
  );

  return (
    <Root id="battle-section-root">
      <CharacterInfoCardsContainer id="ch-info-cards-ctr">
        {battle.allies.map((bCh, i) => {
          // HACK: I hate this so much but it fixes a problem where there's a ui de-sync
          // when a character starts the battle with 0 hp
          if (bCh.shouldRemove) {
            return <div></div>;
          }

          return (
            <CharacterInfoCard
              bCh={bCh}
              isSelected={
                isActionsVisible &&
                uiState.characterIndexSelected === i &&
                isPaused
              }
              characterIndex={i}
              key={bCh.ch.name}
              id={'ch-info-card-' + bCh.ch.name}
            />
          );
        })}
      </CharacterInfoCardsContainer>
      <EnemyInfoCardsContainer id="enemy-info-cards-ctr">
        {battle.enemies.map((bCh, i) => {
          return (
            <EnemyInfoCard
              bCh={bCh}
              isSelected={false && isPaused}
              characterIndex={i}
              key={bCh.ch.name}
              id={'ch-info-card-' + bCh.ch.name}
            />
          );
        })}
      </EnemyInfoCardsContainer>
      <ChannelIndicators allegiance={BattleAllegiance.ENEMY} />
      <ChannelIndicators allegiance={BattleAllegiance.ALLY} />
      {battle.alliesStorage.map(bCh => {
        return (
          <BattleCharacterFollower
            key={bCh.ch.name}
            bCh={bCh}
            battleIndex={battle.alliesStorage.indexOf(bCh)}
            isEnemy={false}
            animName={
              isEffectActive && uiState.effect.bChList.includes(bCh)
                ? uiState.effect.effectAnimName
                : undefined
            }
          />
        );
      })}
      {battle.enemies.map(bCh => {
        return (
          <BattleCharacterFollower
            key={bCh.ch.name}
            bCh={bCh}
            battleIndex={battle.enemies.indexOf(bCh)}
            isEnemy={true}
            hideTargets={isEffectActive}
            animName={
              isEffectActive && uiState.effect.bChList.includes(bCh)
                ? uiState.effect.effectAnimName
                : undefined
            }
          />
        );
      })}
      <PauseTextSection>
        {isPaused && !isEffectActive ? (
          <>
            <p style={{ marginRight: '8px' }}>
              Press Left Arrow to cycle Melee Target.
              <TargetIconContainer>
                <MeleeTargetIcon color={colors.YELLOW} />
              </TargetIconContainer>
            </p>
            <p style={{ marginRight: '8px' }}>
              Press Right Arrow to cycle Range Target.
              <TargetIconContainer>
                <RangeTargetIcon color={colors.RED} />
              </TargetIconContainer>
            </p>
          </>
        ) : null}
      </PauseTextSection>
      {!isEffectActive ? (
        <>
          <TopBar
            disabled={isCutsceneVisible}
            buttons={[
              TopBarButtons.BATTLE_MENU,
              TopBarButtons.SETTINGS,
              TopBarButtons.DEBUG,
            ]}
            onSettingsClick={() => {
              pause();
            }}
            onSettingsClose={() => {
              showSection(AppSection.BattleUI, true);
            }}
            onMenuClick={() => {
              if (isPaused) {
                playSoundName('woosh_reverse');
                unpause();
              } else {
                playSoundName('woosh');
                pause();
              }
            }}
          />
          <BattleMenuContainer visible={isPaused}>
            <VerticalMenu
              width="100%"
              open={true}
              isCursorSelectInactive={!isPaused || menuState !== ''}
              title="Battle Menu"
              items={[
                {
                  label: (
                    <BattleMenuItem
                      style={
                        menuState === 'resume'
                          ? selectedStyles
                          : { color: colors.BLUE }
                      }
                    >
                      Resume
                    </BattleMenuItem>
                  ),
                  value: 'resume',
                },
                {
                  label: (
                    <BattleMenuItem
                      style={
                        menuState === 'actions' ? selectedStyles : undefined
                      }
                      disabled={areBattleMenuItemsDisabled}
                    >
                      Actions
                    </BattleMenuItem>
                  ),
                  value: 'actions',
                },
                {
                  label: (
                    <BattleMenuItem
                      style={menuState === 'items' ? selectedStyles : undefined}
                      disabled={
                        areBattleMenuItemsDisabled ||
                        // cant use isComplete because a timer cannot be complete if pauseOverridden which will always
                        // be the case in this menu
                        battle.itemTimer.getPctComplete() < 1
                      }
                    >
                      Items{' '}
                      {battle.itemTimer.getPctComplete() >= 1
                        ? ''
                        : (
                            (battle.itemTimer.duration -
                              battle.itemTimer.getDiff()[0]) /
                            1000
                          ).toFixed(2) + 's'}
                    </BattleMenuItem>
                  ),
                  value: 'items',
                },
                {
                  label: (
                    <BattleMenuItem
                      // style={
                      //   menuState === 'flee'
                      //     ? selectedStyles
                      //     : { color: colors.YELLOW }
                      // }
                      disabled={
                        areBattleMenuItemsDisabled ||
                        battle.template?.disableFlee
                      }
                    >
                      Flee
                    </BattleMenuItem>
                  ),
                  value: 'flee',
                },
              ]}
              onItemClickSound="menu_select"
              onItemClick={(val: string) => {
                if (val === 'resume') {
                  playSoundName('woosh_reverse');
                  unpause();
                  setMenuState('');
                } else if (!areBattleMenuItemsDisabled) {
                  if (
                    val === 'items' &&
                    battle.itemTimer.getPctComplete() < 1
                  ) {
                    playSoundName('menu_cancel');
                  } else if (val === 'flee') {
                    if (battle.template?.disableFlee) {
                      playSoundName('menu_cancel');
                    } else {
                      unpause();
                      fleeBattle(battle);
                    }
                  } else {
                    setMenuState(val);
                  }
                } else {
                  playSoundName('menu_cancel');
                }
              }}
              onClose={() => {
                playSoundName('woosh_reverse');
                setMenuState('');
                unpause();
              }}
            />
          </BattleMenuContainer>
        </>
      ) : null}
      {menuState === 'items' && !isEffectActive ? (
        <BattleItems
          player={getCurrentPlayer()}
          onClose={() => {
            setMenuState('');
          }}
        />
      ) : null}
      <BattleTurnIndicator
        isEffectActive={isEffectActive}
        allegiance={currentlyActingAllegiance ?? BattleAllegiance.NONE}
      />
    </Root>
  );
};

export default BattleSection;
