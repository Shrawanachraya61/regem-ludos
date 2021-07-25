/* @jsx h */
import { h } from 'preact';
import { hideSection, showPartyMemberSelectModal } from 'controller/ui-actions';
import { AppSection, ModalSection } from 'model/store';
import Card, { CardSize, sizes as cardSizes } from 'view/elements/Card';
import { colors, style } from 'view/style';
import { getUiInterface } from 'view/ui';
import { playSound } from 'controller/scene-commands';
import { timeoutPromise } from 'utils';

import VerticalMenu from 'view/elements/VerticalMenu';
import StaticAnimDiv from 'view/elements/StaticAnimDiv';
import Button, { ButtonType } from 'view/elements/Button';
import { useInputEventStack } from 'view/hooks';
import { playSoundName } from 'model/sound';
import { getCurrentPlayer, getCurrentScene } from 'model/generics';
import { characterGetHpPct } from 'model/character';
import ProgressBar from 'view/elements/ProgressBar';
import { useState } from 'preact/hooks';
import DialogBox from 'view/elements/DialogBox';
import MenuBox from 'view/elements/MenuBox';
import { getCancelKeyLabel, getConfirmKeyLabel } from 'controller/events';

import MenuItems from './MenuItems';
import MenuJournal from './MenuJournal';
import MenuEquipment from './MenuEquipment';
import MenuParty from './MenuPositions';
import CharacterStatus from '../CharacterStatus';
import MenuLoad from './MenuLoad';

const Root = style('div', {
  position: 'absolute',
  top: '0px',
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'rgba(0, 0, 0, 0.5)',
});

const ConfirmButtonArea = style('div', {
  display: 'flex',
  justifyContent: 'center',
  padding: '8px',
});

const InnerRoot = style('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
});

const PartyMember = style(
  'div',
  (props: { color?: string; padding?: string }) => {
    return {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '93px',
      background: props.color ?? 'unset',
      padding: props.padding ?? 'unset',
      boxSizing: 'border-box',
      border: props.color ? `2px solid ${colors.DARKGREEN}` : 'unset',
    };
  }
);

const MenuLabel = style('div', (props: { active: boolean }) => {
  return {
    background: props.active ? colors.BLUE : 'unset',
  };
});

const InnerSection = style('div', {
  border: `1px solid ${colors.WHITE}`,
  margin: '2px',
  padding: '8px',
  textAlign: 'center',
});

const SaveInfoArea = style('div', {
  display: 'flex',
  justifyContent: 'flex-end',
  flexDirection: 'column',
  height: '247px',
  boxSizing: 'border-box',
});
const CurrencyInfoArea = style('div', {
  background: colors.DARKRED,
  border: `1px solid ${colors.WHITE}`,
  margin: '-2px 2px',
  padding: '8px',
});
const CurrencyInfo = style('div', {
  display: 'flex',
  justifyContent: 'flex-start',
  '& > div': {
    marginRight: '16px',
    width: '80px',
  },
});

const PlayTime = () => {
  const d = new Date();
  return <div>{d.toISOString()}</div>;
};

enum MenuCommandItem {
  ITEMS,
  EQUIPMENT,
  STATUS,
  PARTY,
  JOURNAL,
  LOAD,
  QUIT,
}

const MenuSection = () => {
  const [selectedSection, setSelectedSection] = useState(MenuCommandItem.ITEMS);
  const [outerMenuActive, setOuterMenuActive] = useState(true);
  const [closeButtonActive, setCloseButtonActive] = useState(false);

  const handleCloseClick = () => {
    console.trace('close click');
    setCloseButtonActive(true);
    setTimeout(() => {
      setCloseButtonActive(false);
      const onClose = getUiInterface().appState.menu.onClose;
      playSoundName('menu_choice_close');
      onClose();
    }, 100);
  };

  const handleMenuCommandItemClick = (section: MenuCommandItem) => {
    setSelectedSection(section);
    setOuterMenuActive(false);
  };

  const renderInnerSection = () => {
    if (outerMenuActive) {
      return null;
    }
    switch (selectedSection) {
      case MenuCommandItem.ITEMS: {
        return (
          <MenuBox
            title="Items"
            onClose={() => {
              setOuterMenuActive(true);
            }}
            maxWidth={cardSizes[CardSize.XLARGE].width}
            closeButtonLabel={'Back ' + getCancelKeyLabel()}
          >
            <MenuItems
              player={player}
              isInactive={outerMenuActive}
              onClose={() => {
                playSoundName('menu_choice_close');
                setOuterMenuActive(true);
              }}
            />
          </MenuBox>
        );
      }
      case MenuCommandItem.JOURNAL: {
        return (
          <MenuBox
            title="Journal"
            onClose={() => {
              setOuterMenuActive(true);
            }}
            maxWidth={cardSizes[CardSize.XLARGE].width}
            closeButtonLabel={'Back ' + getCancelKeyLabel()}
          >
            <MenuJournal
              scene={getCurrentScene()}
              isInactive={outerMenuActive}
              onClose={() => {
                playSoundName('menu_choice_close');
                setOuterMenuActive(true);
              }}
            />
          </MenuBox>
        );
      }
      case MenuCommandItem.EQUIPMENT: {
        return (
          <MenuBox
            title="Equipment"
            onClose={() => {
              setOuterMenuActive(true);
            }}
            maxWidth={cardSizes[CardSize.XLARGE].width}
            closeButtonLabel={'Back'}
            disableKeyboardShortcut={true}
            // hideClose={true}
          >
            <MenuEquipment
              player={player}
              onClose={() => {
                playSoundName('menu_choice_close');
                setOuterMenuActive(true);
              }}
            />
          </MenuBox>
        );
      }
      case MenuCommandItem.STATUS: {
        return (
          <MenuBox
            title="Status"
            onClose={() => {
              playSoundName('menu_choice_close');
              setOuterMenuActive(true);
            }}
            maxWidth={cardSizes[CardSize.XLARGE].width}
            closeButtonLabel={'Back ' + getCancelKeyLabel()}
            disableKeyboardShortcut={true}
          >
            <CharacterStatus ch={getCurrentPlayer().leader} />
          </MenuBox>
        );
      }
      case MenuCommandItem.PARTY: {
        return (
          <MenuBox
            title="Battle Positions"
            onClose={() => {
              setOuterMenuActive(true);
            }}
            maxWidth={cardSizes[CardSize.XLARGE].width}
            closeButtonLabel={'Back ' + getCancelKeyLabel()}
            disableKeyboardShortcut={true}
          >
            <MenuParty
              player={player}
              isInactive={false}
              onClose={() => {
                playSoundName('menu_choice_close');
                setOuterMenuActive(true);
              }}
            />
          </MenuBox>
        );
      }
      case MenuCommandItem.LOAD: {
        return (
          <MenuBox
            title="Load"
            onClose={() => {
              setOuterMenuActive(true);
            }}
            maxWidth={cardSizes[CardSize.XLARGE].width}
            closeButtonLabel={'Back ' + getCancelKeyLabel()}
            disableKeyboardShortcut={true}
          >
            <MenuLoad
              onClose={() => {
                playSoundName('menu_choice_close');
                setOuterMenuActive(true);
              }}
            />
          </MenuBox>
        );
      }
      default:
        return (
          <MenuBox
            title="Menu"
            onClose={() => {
              playSoundName('menu_choice_close');
              setOuterMenuActive(true);
            }}
            maxWidth={cardSizes[CardSize.XLARGE].width}
            closeButtonLabel={'Back'}
            disableKeyboardShortcut={true}
          ></MenuBox>
        );
    }
  };

  const player = getCurrentPlayer();

  // ensures that empty spaces show up if no party members are available (so it looks nicer)
  const party = [...player.party, null, null, null, null].slice(0, 5);

  return (
    <Root>
      <Card size={CardSize.XLARGE}>
        <InnerRoot id="menu-inner-root">
          <VerticalMenu
            title="Party"
            width="60%"
            open={true}
            isInactive={true}
            backgroundColor={'#302C2E'}
            items={party.map(ch => {
              return {
                label: (
                  <PartyMember>
                    {ch ? (
                      <CharacterStatus
                        ch={ch}
                        usePortrait={true}
                        style={{
                          filter:
                            ch.hp <= 0
                              ? 'sepia(75%) invert(25%) brightness(0.5)'
                              : 'unset',
                        }}
                      />
                    ) : null}
                  </PartyMember>
                ),
                value: ch,
              };
            })}
            onItemClickSound="menu_select"
            onItemClick={() => {}}
            onClose={() => {
              handleCloseClick();
            }}
          />
          <div
            style={{
              width: '40%',
            }}
          >
            <VerticalMenu
              title="Menu"
              open={true}
              isInactive={!outerMenuActive}
              items={[
                {
                  label: (
                    <MenuLabel
                      active={
                        !outerMenuActive &&
                        selectedSection === MenuCommandItem.EQUIPMENT
                      }
                    >
                      Equipment
                    </MenuLabel>
                  ),
                  value: MenuCommandItem.EQUIPMENT,
                },
                {
                  label: (
                    <MenuLabel
                      active={
                        !outerMenuActive &&
                        selectedSection === MenuCommandItem.JOURNAL
                      }
                    >
                      Journal
                    </MenuLabel>
                  ),
                  value: MenuCommandItem.JOURNAL,
                },
                {
                  label: (
                    <MenuLabel
                      active={
                        !outerMenuActive &&
                        selectedSection === MenuCommandItem.ITEMS
                      }
                    >
                      Items
                    </MenuLabel>
                  ),
                  value: MenuCommandItem.ITEMS,
                },
                {
                  label: (
                    <MenuLabel
                      active={
                        !outerMenuActive &&
                        selectedSection === MenuCommandItem.STATUS
                      }
                    >
                      Status
                    </MenuLabel>
                  ),
                  value: MenuCommandItem.STATUS,
                },
                {
                  label: (
                    <MenuLabel
                      active={
                        !outerMenuActive &&
                        selectedSection === MenuCommandItem.PARTY
                      }
                    >
                      Positions
                    </MenuLabel>
                  ),
                  value: MenuCommandItem.PARTY,
                },
                {
                  label: (
                    <MenuLabel
                      active={
                        !outerMenuActive &&
                        selectedSection === MenuCommandItem.LOAD
                      }
                    >
                      Load
                    </MenuLabel>
                  ),
                  value: MenuCommandItem.LOAD,
                },
                {
                  label: (
                    <MenuLabel
                      active={
                        !outerMenuActive &&
                        selectedSection === MenuCommandItem.QUIT
                      }
                    >
                      Quit
                    </MenuLabel>
                  ),
                  value: MenuCommandItem.QUIT,
                },
              ]}
              onItemClickSound="menu_select"
              onItemClick={handleMenuCommandItemClick}
              onClose={handleCloseClick}
              hideCloseBox={true}
            />
            <ConfirmButtonArea>
              <Button
                type={ButtonType.PRIMARY}
                onClick={handleCloseClick}
                active={closeButtonActive}
              >
                Close {getCancelKeyLabel()}
              </Button>
            </ConfirmButtonArea>
            <SaveInfoArea>
              <CurrencyInfoArea>
                <CurrencyInfo>
                  <div>Tickets</div>
                  <div>{player.tickets}</div>
                </CurrencyInfo>
                <CurrencyInfo>
                  <div>Tokens</div>
                  <div>{player.tokens}</div>
                </CurrencyInfo>
                <PlayTime />
              </CurrencyInfoArea>
            </SaveInfoArea>
          </div>
        </InnerRoot>
        <InnerSection>
          <div>Select a menu option {getConfirmKeyLabel()}.</div>
        </InnerSection>
        {renderInnerSection()}
      </Card>
    </Root>
  );
};

export default MenuSection;
