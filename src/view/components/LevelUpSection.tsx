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

interface CostObj {
  stat: string;
  ticketCost: number;
  lvlCost: number;
}

const STATS_COSTS: CostObj[] = [
  { stat: 'HP', ticketCost: 1, lvlCost: 2 },
  { stat: 'STAGGER', ticketCost: 2, lvlCost: 1 },
  { stat: 'RESV', ticketCost: 2, lvlCost: 2 },
  { stat: 'POW', ticketCost: 4, lvlCost: 2 },
  { stat: 'ACC', ticketCost: 4, lvlCost: 1 },
  { stat: 'FOR', ticketCost: 2, lvlCost: 1 },
  { stat: 'CON', ticketCost: 2, lvlCost: 1 },
  // { stat: 'RES', ticketCost: 2, lvlCost: 1 },
  { stat: 'SPD', ticketCost: 2, lvlCost: 1 },
  { stat: 'EVA', ticketCost: 1, lvlCost: 1 },
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
      justifyContent: 'flex-start',
      alignItems: 'center',
      background: colors.BLACK,
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
    color: colors.GREEN,
    textAlign: 'left',
    marginBottom: '1.5rem',
    background: colors.BLACK,
    fontFamily: 'courier',
    padding: '8px',
  };
});

const Primary = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'space-between',
  };
});

const LevelUpContainer = style('div', () => {
  return {
    border: '1px solid ' + colors.WHITE,
    background: colors.BLACK,
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
        },
        onConfirm: () => {
          playSound('menu_sparkle');
          setConfirmVisible(false);
          onConfirm();
          setCh(undefined);
        },
        body: 'Do you wish to confirm this set of stat increases?',
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

  return (
    <MenuBox
      title="Improvement Kiosk"
      hideTitle={true}
      onClose={() => {
        handleBackClick();
      }}
      closeButtonLabel={(ch ? 'Confirm ' : 'Close ') + getCancelKeyLabel()}
      maxWidth={MAX_WIDTH}
      dark={true}
      disableKeyboardShortcut={true}
    >
      <Primary>
        <AnimDiv
          animName="tile_stats_kiosk_menu"
          renderLoopId="stats-kiosk"
          scale={4}
          style={{
            transform: 'translateY(-20px)',
          }}
        ></AnimDiv>
        <Info>
          {partySelectVisible ? (
            <>
              <p>Welcome to the Regem Ludos Improvement Kiosk!</p>
              <p>
                You are currently signed in as <b>{player.leader.fullName}</b>.
                If this is incorrect, please report this incident to the front
                desk.
              </p>
              <p>To begin, please select one of your party members.</p>
            </>
          ) : (
            <>
              <p>
                You have selected <b>{ch?.fullName}</b>.
              </p>
              <p>
                You may now spend <b>LVL Points</b> to increase your stats. A
                small fee of <b>Tickets</b> are also required for the
                improvement.
              </p>
              <p>
                If you make a mistake during this process, please contact the
                front desk.
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
          You have <Number value={localTickets}>{localTickets} Tickets</Number>{' '}
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
            <Number value={localLvlPoints}>{localLvlPoints} LVL Points</Number>{' '}
            available to spend.
          </div>
          <LevelUpContainer>
            <PartyMemberRow ch={ch} hideLvlPoints={true} />
            <VerticalMenu
              title="Stats"
              hideTitle={true}
              isInactive={confirmVisible}
              open={true}
              items={STATS_COSTS.map(costObj => {
                const { lvlCost, ticketCost, stat } = costObj;
                return {
                  label: (
                    <StatRow>
                      <div>
                        {stat} {ch?.stats?.[stat]}
                      </div>
                      <div>{upgrades[stat] ? '+' + upgrades[stat] : ''}</div>
                      <StatRowCosts>
                        <div>
                          <Number value={lvlCost <= localLvlPoints ? 1 : 0}>
                            LVL Cost {lvlCost}
                          </Number>
                          ,
                        </div>
                        <div>
                          <Number value={ticketCost <= localTickets ? 1 : 0}>
                            Ticket Cost: {ticketCost}
                          </Number>
                        </div>
                        <Button
                          type={ButtonType.CANCEL}
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
              })}
              onItemClick={costObj => {
                improveStat(costObj);
              }}
              onAuxClick={() => {
                const costObj = STATS_COSTS[currentCostObjIndex];
                unImproveStat(costObj);
              }}
              onItemHover={costObj => {
                setCurrentCostObj(STATS_COSTS.indexOf(costObj));
              }}
            />
          </LevelUpContainer>
        </>
      ) : null}
    </MenuBox>
  );
};

export default LevelUpModal;
