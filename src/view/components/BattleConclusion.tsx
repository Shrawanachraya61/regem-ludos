/* @jsx h */
import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { colors, keyframes, style } from 'view/style';
import { getCurrentBattle, getCurrentPlayer } from 'model/generics';
import { BattleEvent, battleGetRewards, battleInvokeEvent } from 'model/battle';
import VerticalMenu from 'view/elements/VerticalMenu';
import StaticAnimDiv from 'view/elements/StaticAnimDiv';
import CharacterNameLabel from 'view/elements/CharacterNameLabel';
import ProgressBar from 'view/elements/ProgressBar';
import { characterGetExperiencePct, characterGetLevel } from 'model/character';
import { timeoutPromise } from 'utils';
import { playSoundName } from 'model/sound';
import { fadeIn, fadeOut, playSound } from 'controller/scene/scene-commands';
import { playerAddItem } from 'model/player';
import MenuBox from 'view/elements/MenuBox';
import { CardSize, sizes as cardSizes } from 'view/elements/Card';
import {
  getMostRecentSave,
  ISave,
  loadSavedGame,
} from 'controller/save-management';
import MenuLoad from './MenuSection/MenuLoad';
import { getCancelKeyLabel } from 'controller/events';

interface IBattleConclusionProps {
  isVictory: boolean;
}

const Root = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    height: '100%',
    fontSize: '4rem',
    color: colors.WHITE,
    transition: 'background-color 2000ms',
    transform: 'scale(1)',
    backgroundColor: 'rgba(0, 0, 0, 0.0)',
  };
});

const RewardsList = style('div', () => {
  return {
    fontSize: '16px',
    width: '288px',
    boxSizing: 'border-box',
    padding: '8px',
    margin: '8px',
    border: `2px solid ${colors.WHITE}`,
    background: 'rgba(0, 0, 0, 0.5)',
  };
});

const ChItemList = style('div', () => {
  return {
    width: '288px',
    boxSizing: 'border-box',
    margin: '8px',
    border: `2px solid ${colors.WHITE}`,
    background: 'rgba(0, 0, 0, 0.5)',
  };
});

const ChItem = style('div', () => {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '4px',
  };
});

const pulse = keyframes({
  '0%': {
    transform: 'translateX(18px) translateY(-5px)',
  },
  '50%': {
    transform: 'translateX(18px) translateY(5px)',
  },
  '100%': {
    transform: 'translateX(18px) translateY(-5px)',
  },
});

const pulseO = keyframes({
  '0%': {
    transform: 'translateX(20px) translateY(-4px)',
  },
  '50%': {
    transform: 'translateX(20px) translateY(6px)',
  },
  '100%': {
    transform: 'translateX(20px) translateY(-4px)',
  },
});

const LevelUpText = style('div', (props: { offset?: boolean }) => {
  return {
    fontSize: '24px',
    width: '2px',
    whiteSpace: 'pre',
    marginLeft: props.offset ? 'unset' : '16px',
    animation: `3s ${props.offset ? pulse : pulseO} linear infinite`,
    color: props.offset ? colors.WHITE : colors.BLACK,
  };
});

const BattleConclusion = (props: IBattleConclusionProps): h.JSX.Element => {
  const [onwardClicked, setOnwardClicked] = useState(false);
  const [loadVisible, setLoadVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const player = getCurrentPlayer();
  const party = player.party;

  const initialState = {
    ind: 0,
    working: false,
  };
  party.forEach(ch => {
    initialState[ch.name] = {
      name: ch.name,
      levelDiff: 0,
      initialLevel: characterGetLevel(ch),
      exp: ch.experience,
      pct: characterGetExperiencePct(ch),
    };
  });

  const [state, setState] = useState(initialState);
  const [rewards] = useState(battleGetRewards(getCurrentBattle()));

  const handleContinueClick = () => {
    const battle = getCurrentBattle();
    setOnwardClicked(true);
    if (battle) {
      battleInvokeEvent(battle, BattleEvent.onCompletion, battle);
    }
  };

  const applyRewards = async () => {
    player.tokens += rewards.tokens;
    rewards.items.forEach(item => {
      if (item.name) {
        playerAddItem(player, item.name);
      }
    });

    party.forEach(async ch => {
      const s = state[ch.name];
      ch.experience += rewards.experience;
      s.exp = ch.experience;
      const currentLevel = characterGetLevel(ch);
      const initialLevel = s.initialLevel;
      if (currentLevel > initialLevel) {
        s.pct = 1;
        for (let i = initialLevel; i <= currentLevel; i++) {
          ch.experienceCurrency += 5;
        }
      } else {
        s.pct = characterGetExperiencePct(ch);
      }
    });
    setState({
      ...state,
      ind: 1,
      working: true,
    });
    playSoundName('exp_gain');
    await new Promise(resolve => setTimeout(resolve, 500));
    party.forEach(async (ch, i) => {
      await new Promise(resolve => setTimeout(resolve, i * 250));
      const s = state[ch.name];
      if (s.pct === 1) {
        const currentLevel = characterGetLevel(ch);
        const initialLevel = s.initialLevel;
        playSoundName('level_up');
        s.levelDiff = currentLevel - initialLevel;
        s.pct = 0;
        setState({
          ...state,
          ind: 1,
          working: true,
        });
      }
    });
    setState({
      ...state,
      ind: 1,
      working: true,
    });
    await new Promise(resolve => setTimeout(resolve, 300));
    party.forEach(async ch => {
      const s = state[ch.name];
      s.pct = characterGetExperiencePct(ch);
    });
    setState({
      ...state,
      ind: 1,
      working: false,
    });
  };

  useEffect(() => {
    if (onwardClicked) {
      const elem = document.getElementById('battle-conclusion-root');
      if (elem) {
        elem.style.transform = 'scale(0)';
      }
    }
  }, [onwardClicked]);

  useEffect(() => {
    const elem = document.getElementById('battle-conclusion-root');
    if (elem && !props.isVictory) {
      elem.style['background-color'] = 'rgba(0, 0, 0, 0.8)';
    }
  }, [props.isVictory]);

  return (
    <Root id="battle-conclusion-root">
      {props.isVictory ? (
        <>
          <span>VICTORY!</span>
          <RewardsList>
            {rewards.tokens ? (
              <div>
                {rewards.tokens} Token{rewards.tokens > 1 ? 's' : ''}
              </div>
            ) : null}
            {rewards.items.map((item, i) => {
              return <div key={i}>{item.label}</div>;
            })}
          </RewardsList>
          <ChItemList>
            {party.map(ch => {
              const s = state[ch.name];
              return (
                <ChItem key={ch.name}>
                  <div
                    style={{
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      height: '64px',
                    }}
                  >
                    <StaticAnimDiv
                      style={{
                        width: '128',
                      }}
                      animName={`${ch.name.toLowerCase()}_portrait_f`}
                    ></StaticAnimDiv>
                  </div>
                  <div>
                    <CharacterNameLabel>{ch.name}</CharacterNameLabel>
                    <div
                      style={{
                        width: '128px',
                      }}
                    >
                      <ProgressBar
                        backgroundColor={colors.BLACK}
                        color={colors.YELLOW}
                        height={24}
                        label={'Level ' + characterGetLevel(s.exp)}
                        transitionDuration={500}
                        pct={s.pct}
                      ></ProgressBar>
                    </div>
                  </div>
                  <LevelUpText>
                    {s.levelDiff ? `Level Up! +${s.levelDiff}` : ''}
                  </LevelUpText>
                  <LevelUpText offset>
                    {s.levelDiff ? `Level Up! +${s.levelDiff}` : ''}
                  </LevelUpText>
                </ChItem>
              );
            })}
          </ChItemList>
        </>
      ) : (
        <>
          <span>DEFEAT!</span>
        </>
      )}
      <VerticalMenu
        title=""
        width={'50%'}
        open={!loadVisible && !loading}
        hideTitle
        style={{
          transition: 'transform 0.15s',
          transform: loading ? 'scale(0)' : 'scaleX(1)',
          width: !props.isVictory ? '256px' : '128px',
        }}
        items={
          [
            props.isVictory
              ? {
                  label: (
                    <div>
                      {state.ind === 0 ? <span>Next</span> : null}
                      {state.ind === 1 ? (
                        <span
                          style={{
                            color: state.working ? colors.GREY : colors.BLUE,
                          }}
                        >
                          Onward!
                        </span>
                      ) : null}
                    </div>
                  ),
                  value: 0,
                }
              : null,
            !props.isVictory
              ? {
                  label: (
                    <div>
                      <span>Load Last Save</span>
                    </div>
                  ),
                  value: 1,
                }
              : null,
            !props.isVictory
              ? {
                  label: (
                    <div>
                      <span>Load Another Save</span>
                    </div>
                  ),
                  value: 2,
                }
              : null,
            !props.isVictory
              ? {
                  label: (
                    <div>
                      <span>Quit To Menu</span>
                    </div>
                  ),
                  value: 3,
                }
              : null,
          ].filter(v => Boolean(v)) as { label: any; value: number }[]
        }
        onItemClickSound="menu_select"
        onItemClick={v => {
          // victory
          if (v === 0) {
            if (state.working || onwardClicked) {
              return;
            }
            if (state.ind === 1) {
              handleContinueClick();
            } else {
              applyRewards();
            }
          }

          // defeat load last save
          if (v === 1) {
            const save = getMostRecentSave();
            if (save) {
              setLoading(true);
              fadeOut(500, true);
              setTimeout(() => {
                loadSavedGame(save);
                fadeIn(500, true);
              }, 500);
            } else {
              playSoundName('terminal_cancel');
            }
          }

          // load another save
          if (v === 2) {
            setLoadVisible(true);
          }

          // quit to menu
          if (v === 3) {
            (window as any).location = '/menu.html';
          }
        }}
      />
      {loadVisible && !loading ? (
        <MenuBox
          title="Load"
          onClose={() => {}}
          maxWidth={cardSizes[CardSize.XLARGE].width}
          closeButtonLabel={'Back ' + getCancelKeyLabel()}
          disableKeyboardShortcut={true}
        >
          <MenuLoad
            onClose={() => {
              setLoadVisible(false);
              playSoundName('menu_choice_close');
            }}
            onSaveClicked={(save: ISave) => {
              setLoading(true);
              fadeOut(500, true);
              setTimeout(() => {
                loadSavedGame(save);
                fadeIn(500, true);
              }, 500);
            }}
          />
        </MenuBox>
      ) : null}
    </Root>
  );
};

export default BattleConclusion;
