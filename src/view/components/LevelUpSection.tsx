/* @jsx h */
import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { hideSection, showModal } from 'controller/ui-actions';
import { AppSection, ModalSection } from 'model/store';
import DialogBox from 'view/elements/DialogBox';
import MenuBox from 'view/elements/MenuBox';
import { colors, style } from 'view/style';
import { getUiInterface } from 'view/ui';
import { playSound } from 'controller/scene-commands';
import { timeoutPromise } from 'utils';
import {
  getAuxKeyLabel,
  getCancelKeyLabel,
  isCancelKey,
} from 'controller/events';
import { getCurrentPlayer } from 'model/generics';
import VerticalMenu from 'view/elements/VerticalMenu';
import StaticAnimDiv from 'view/elements/StaticAnimDiv';
import {
  Character,
  characterGetHpPct,
  characterGetLevel,
} from 'model/character';
import ProgressBar from 'view/elements/ProgressBar';
import CharacterNameLabel from 'view/elements/CharacterNameLabel';
import CharacterStatus from 'view/components/CharacterStatus';
import Modal, {
  ICustomModalProps,
  MAX_WIDTH,
} from './ModalSection/ModalSection';
import { unpause } from 'controller/loop';
import { useKeyboardEventListener } from 'view/hooks';
import AnimDiv from 'view/elements/AnimDiv';
import { playerModifyTickets } from 'model/player';
import Button, { ButtonType } from 'view/elements/Button';
import Card, { CardSize, sizes as cardSizes } from 'view/elements/Card';

interface CostObj {
  stat: string;
  ticketCost: number;
  lvlCost: number;
  desc: string;
}

const STATS_COSTS: CostObj[] = [
  {
    stat: 'HP',
    ticketCost: 1,
    lvlCost: 2,
    desc: 'Hit Points. The number of Hit Points a character has.',
  },
  {
    stat: 'STAGGER',
    ticketCost: 2,
    lvlCost: 1,
    desc:
      'Stagger.  The more of this, the longer it takes to become staggered.',
  },
  {
    stat: 'RESV',
    ticketCost: 2,
    lvlCost: 2,
    desc:
      'Reserve.  A representation of how much energy a character has before becoming exhausted.',
  },
  {
    stat: 'POW',
    ticketCost: 4,
    lvlCost: 2,
    desc: 'Power.  More of this means more damage when attacking.',
  },
  {
    stat: 'ACC',
    ticketCost: 4,
    lvlCost: 1,
    desc: 'Accuracy.  More of this means higher chance of critical hits.',
  },
  {
    stat: 'FOR',
    ticketCost: 2,
    lvlCost: 1,
    desc:
      'Fortitude.  More of this means a character takes less damage from Weapon-based attacks.',
  },
  {
    stat: 'CON',
    ticketCost: 2,
    lvlCost: 1,
    desc:
      'Constitution.  Determines what kind of armor a character can wear.  The mor CON, the better quality armor.',
  },
  {
    stat: 'RES',
    ticketCost: 2,
    lvlCost: 1,
    desc: 'Resistance.  Determines damage reduction from Wand-based attacks.',
  },
  {
    stat: 'SPD',
    ticketCost: 2,
    lvlCost: 1,
    desc: 'Speed.  More of this reduces cooldown timer of abilities.',
  },
  {
    stat: 'EVA',
    ticketCost: 1,
    lvlCost: 1,
    desc: 'Evasion.  Each point of EVA adds 1% chance to dodge an attack.',
  },
];

const INITIAL_STATE = {
  HP: 0,
  STAGGER: 0,
  RESV: 0,
  POW: 0,
  ACC: 0,
  FOR: 0,
  CON: 0,
  SPD: 0,
  RES: 0,
  EVA: 0,
};

const PartySelectContainer = style('div', (props: { visible: boolean }) => {
  return {
    position: props.visible ? 'unset' : 'absolute',
    // width: MAX_WIDTH,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  };
});

const PartyMember = style(
  'div',
  (props: { color?: string; padding?: string }) => {
    return {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '4px',
      boxSizing: 'border-box',
      border: props.color ? `2px solid ${colors.DARKGREEN}` : 'unset',
      '& > div': {
        marginRight: '8px',
      },
    };
  }
);

const Info = style('div', () => {
  return {
    border: `1px solid ${colors.WHITE}`,
    color: colors.LIGHTGREEN,
    textAlign: 'left',
    marginBottom: '1.5rem',
    background: colors.BLACK,
    fontFamily: 'courier',
    padding: '16px',
    width: '100%',
    boxSizing: 'border-box',
    zIndex: '1',
    fontSize: '20px',
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
  };
});

const Primary = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '2px',
  };
});

const LevelUpContainer = style('div', () => {
  return {
    border: '1px solid ' + colors.WHITE,
    background: colors.BLACK,
  };
});

const ConfirmButton = style('div', () => {
  return {
    background: colors.DARKGREEN,
    border: '1px solid ' + colors.WHITE,
    borderRadius: '26px',
    padding: '4px',
  };
});

const Number = style('span', (props: { value: number }) => {
  return {
    color: props.value <= 0 ? colors.RED : colors.BLUE,
  };
});

const Red = style('span', () => {
  return {
    color: colors.RED,
  };
});

const Blue = style('span', () => {
  return {
    color: colors.BLUE,
  };
});

const PartyMemberRow = (props: { ch: Character; hideLvlPoints?: boolean }) => {
  const innerCh = props.ch;
  return (
    <PartyMember>
      <StaticAnimDiv
        style={{
          width: '64',
        }}
        animName={`${innerCh.spriteBase.toLowerCase()}_idle_down`}
      ></StaticAnimDiv>
      <div>{innerCh.fullName},</div>
      <div>
        Level: {characterGetLevel(innerCh)}
        {!props.hideLvlPoints ? ',' : ''}
      </div>
      {!props.hideLvlPoints ? (
        <div>LVL Points: {innerCh.experienceCurrency}</div>
      ) : null}
    </PartyMember>
  );
};

const StatRow = style('div', () => {
  return {
    textAlign: 'left',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };
});

const StatRowCosts = style('div', () => {
  return {
    textAlign: 'right',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    '& > div': {
      marginLeft: '8px',
    },
  };
});

const LevelUpModal = () => {
  const player = getCurrentPlayer();
  const party = player.party;

  const [ch, setCh] = useState<Character | undefined>(undefined);
  const [localTickets, setLocalTickets] = useState(player.tickets);
  const [localLvlPoints, setLocalLvlPoints] = useState(0);
  const [currentCostObjIndex, setCurrentCostObj] = useState(0);
  const [confirmVisible, setConfirmVisible] = useState(false);

  // HACK: only used to re-render the level up menu after confirm close so the cursor doesn't
  // get lost
  const [levelUpVisible, setLevelUpVisible] = useState(true);

  const [upgrades, setUpgrades] = useState(INITIAL_STATE);

  useKeyboardEventListener(ev => {
    if (isCancelKey(ev.key)) {
      handleBackClick();
    }
  });

  const handleBackClick = () => {
    if (confirmVisible) {
      return;
    }

    if (ch) {
      playSound('menu_select2');
      if (localTickets === player.tickets) {
        setCh(undefined);
        return;
      }
      setConfirmVisible(true);
      showModal(ModalSection.CONFIRM, {
        onClose: () => {
          setConfirmVisible(false);
          setLevelUpVisible(false);
          setTimeout(() => {
            setLevelUpVisible(true);
          }, 1);
        },
        onConfirm: () => {
          playSound('terminal_cancel');
          setConfirmVisible(false);
          setLocalTickets(player.tickets);
          setCh(undefined);
        },
        body: 'Do you wish to disregard this set of stat increases?',
        danger: true,
      });
    } else {
      playSound('blip');
      unpause();
      getUiInterface().appState.levelUp.onClose();
    }
  };

  const onConfirm = () => {
    playerModifyTickets(player, -(player.tickets - localTickets));
    if (ch) {
      ch.experienceCurrency -= ch.experienceCurrency - localLvlPoints;
      for (const statName in upgrades) {
        ch.stats[statName] += upgrades[statName];
      }
      if (ch.hp > 0) {
        ch.hp += upgrades.HP;
      }
      ch.resv += upgrades.RESV;
    }
  };

  const improveStat = (costObj: CostObj) => {
    const { stat, lvlCost, ticketCost } = costObj;

    if (localTickets >= ticketCost && localLvlPoints >= lvlCost) {
      playSound('blip');
      setLocalTickets(localTickets - ticketCost);
      setLocalLvlPoints(localLvlPoints - lvlCost);

      setUpgrades({
        ...upgrades,
        [stat]: upgrades[stat] + 1,
      });
    } else {
      playSound('terminal_cancel');
    }
  };

  const unImproveStat = (costObj: CostObj) => {
    const { stat, lvlCost, ticketCost } = costObj;
    if (upgrades[stat] > 0) {
      playSound('blip');
      setLocalTickets(localTickets + ticketCost);
      setLocalLvlPoints(localLvlPoints + lvlCost);
      setUpgrades({
        ...upgrades,
        [stat]: upgrades[stat] - 1,
      });
    } else {
      playSound('terminal_cancel');
    }
  };

  const partySelectVisible = Boolean(!ch);
  const currentCostObj = STATS_COSTS[currentCostObjIndex];

  return (
    <MenuBox
      title="VR Improvement Kiosk"
      hideTitle={true}
      onClose={() => {
        handleBackClick();
      }}
      closeButtonLabel={'Back ' + getCancelKeyLabel()}
      // maxWidth={MAX_WIDTH}
      dark={true}
      disableKeyboardShortcut={true}
    >
      <Card
        id="menu-main"
        size={CardSize.XLARGE}
        // style={{
        //   transform: 'scale(0)',
        //   transition: 'opacity 100ms, transform 100ms',
        // }}
      >
        <Primary>
          {partySelectVisible ? (
            <AnimDiv
              animName="tile_stats_kiosk_menu"
              renderLoopId="stats-kiosk"
              scale={4}
              style={{
                transform: 'translateY(-20px)',
                margin: '64px',
              }}
            ></AnimDiv>
          ) : null}
          <Info>
            {partySelectVisible ? (
              <>
                <p>Welcome to the Regem Ludos Improvement Kiosk!</p>
                <p>To begin, please select one of your party members.</p>
              </>
            ) : (
              <>
                <p style={{ width: '520px' }}>
                  You have selected <b>{ch?.fullName}</b>.
                </p>
                <p style={{ color: colors.YELLOW, height: '54px' }}>
                  {currentCostObj
                    ? `${currentCostObj.stat}: ${currentCostObj.desc}`
                    : null}
                </p>
              </>
            )}
          </Info>
        </Primary>
        <PartySelectContainer visible={partySelectVisible}>
          <div
            style={{
              paddingBottom: '8px',
              display: partySelectVisible ? 'unset' : 'none',
            }}
          >
            You have{' '}
            <Number value={localTickets}>{localTickets} Tickets</Number>{' '}
            available to spend.
          </div>
          <VerticalMenu
            title="Party"
            hideTitle={true}
            open={true}
            isInactive={!partySelectVisible || confirmVisible}
            style={{
              display: partySelectVisible ? 'unset' : 'none',
            }}
            // width="400px"
            items={party.map(innerCh => {
              return {
                label: <PartyMemberRow ch={innerCh} />,
                value: innerCh,
              };
            })}
            onItemClickSound="blip"
            onItemClick={c => {
              setCh(c);
              setLocalLvlPoints(c.experienceCurrency);
              setLocalTickets(player.tickets);
              setUpgrades(INITIAL_STATE);
            }}
          />
        </PartySelectContainer>
        {ch ? (
          <>
            <div
              style={{
                paddingBottom: '8px',
                textAlign: 'center',
              }}
            >
              You have{' '}
              <Number value={localTickets}>{localTickets} Tickets</Number> and{' '}
              <Number value={localLvlPoints}>
                {localLvlPoints} LVL Points
              </Number>{' '}
              available to spend.
            </div>
            <LevelUpContainer>
              <PartyMemberRow ch={ch} hideLvlPoints={true} />
              <VerticalMenu
                title="Stats"
                hideTitle={true}
                isInactive={confirmVisible}
                resetCursor={levelUpVisible}
                open={true}
                items={[
                  ...STATS_COSTS.map(costObj => {
                    const { lvlCost, ticketCost, stat } = costObj;
                    return {
                      label: (
                        <StatRow>
                          <div
                            style={{
                              width: '120px',
                            }}
                          >
                            {stat} {ch?.stats?.[stat]}
                          </div>
                          <div>
                            {upgrades[stat] ? '+' + upgrades[stat] : ''}
                          </div>
                          <StatRowCosts>
                            <div>
                              <Number value={lvlCost <= localLvlPoints ? 1 : 0}>
                                LVL Cost: {lvlCost}
                              </Number>
                              ,
                            </div>
                            <div>
                              <Number
                                value={ticketCost <= localTickets ? 1 : 0}
                              >
                                Ticket Cost: {ticketCost}
                              </Number>
                            </div>
                            <Button
                              type={ButtonType.CANCEL}
                              disabled={upgrades[stat] === 0}
                              style={{
                                fontSize: '12px',
                              }}
                              onClick={ev => {
                                ev.stopPropagation();
                                unImproveStat(costObj);
                              }}
                            >
                              Undo {getAuxKeyLabel()}
                            </Button>
                          </StatRowCosts>
                        </StatRow>
                      ),
                      value: costObj,
                    };
                  }),
                  {
                    label: <ConfirmButton>Confirm!</ConfirmButton>,
                    value: null,
                  },
                ]}
                onItemClick={costObj => {
                  if (costObj) {
                    improveStat(costObj);
                  } else {
                    let hasUpgrade = false;
                    for (const i in upgrades) {
                      if (upgrades[i] > 0) {
                        hasUpgrade = true;
                        break;
                      }
                    }
                    if (hasUpgrade) {
                      playSound('menu_sparkle');
                      onConfirm();
                    } else {
                      playSound('blip');
                    }
                    setCh(undefined);
                  }
                }}
                onAuxClick={() => {
                  const costObj = STATS_COSTS[currentCostObjIndex];
                  if (costObj) {
                    unImproveStat(costObj);
                  }
                }}
                onItemHover={costObj => {
                  if (costObj) {
                    setCurrentCostObj(STATS_COSTS.indexOf(costObj));
                  } else {
                    setCurrentCostObj(-1);
                  }
                }}
              />
            </LevelUpContainer>
          </>
        ) : null}
      </Card>
    </MenuBox>
  );
};

export default LevelUpModal;
