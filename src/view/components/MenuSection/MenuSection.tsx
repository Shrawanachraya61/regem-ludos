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

const PartyMemberMain = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    width: '100%',
    '& > div': {
      marginRight: '4px',
    },
  };
});

const PortraitContainer = style('div', () => {
  return {
    background: colors.DARKGREY,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    // borderRight: '2px solid ' + colors.BLACK,
    border: `2px solid ${colors.WHITE}`,
    width: '93',
    height: '93',
    cursor: 'pointer',
    overflow: 'hidden',
  };
});

const CharacterNameLabel = style('div', () => {
  return {
    fontSize: '18px',
    color: colors.BLACK,
    background: colors.WHITE,
    // boxShadow: BOX_SHADOW,
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    textTransform: 'uppercase',
    // border: `2px solid ${colors.BLACK}`,
    padding: '8px',
    marginBottom: '2px',
  };
});

const ChInfoContainer = style('div', () => {
  return {
    width: '50%',
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'flex-start',
  };
});

const PercentBarWrapper = style(
  'div',
  (props: { short: boolean; borderColor?: string }) => {
    return {
      // width: ,
      width: '100%',
      border: props.short
        ? 'unset'
        : `2px solid ${props.borderColor ?? colors.WHITE}`,
      borderBottom: props.short ? 'unset' : '0px',
    };
  }
);

const MenuLabel = style('div', (props: { active: boolean }) => {
  return {
    background: props.active ? colors.BLUE : 'unset',
  };
});

const InnerSection = style('div', {
  // display: 'flex',
  // justifyContent: 'center',
  // alignItems: 'center',
  border: `1px solid ${colors.WHITE}`,
  margin: '2px',
  padding: '8px',
  textAlign: 'center',
  // fontSize: '22px',
});

// const MenuCommandItem = style('div', props => {
//   return {};
// });

enum MenuCommandItem {
  ITEMS,
  EQUIPMENT,
  STATUS,
  PARTY,
  JOURNAL,
  QUIT,
}

const MenuSection = () => {
  const [selectedSection, setSelectedSection] = useState(MenuCommandItem.ITEMS);
  const [outerMenuActive, setOuterMenuActive] = useState(true);

  const handleCloseClick = () => {
    const onClose = getUiInterface().appState.menu.onClose;
    playSoundName('menu_choice_close');
    onClose();
  };

  const handleMenuCommandItemClick = (section: MenuCommandItem) => {
    if (section === MenuCommandItem.PARTY) {
      showPartyMemberSelectModal({
        onCharacterSelected: ch => {
          console.log('SELCTED ', ch);
        },
        onClose: () => {
          console.log('clsoe');
        },
      });
      return;
    }
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
              setOuterMenuActive(true);
            }}
            maxWidth={cardSizes[CardSize.XLARGE].width}
            closeButtonLabel={'Back ' + getCancelKeyLabel()}
          ></MenuBox>
        );
    }
  };

  const player = getCurrentPlayer();

  const party = [...player.party, null, null, null, null].slice(0, 4);

  return (
    <Root>
      <Card size={CardSize.XLARGE}>
        <InnerRoot id="menu-inner-root">
          <VerticalMenu
            title="Party"
            width="60%"
            open={true}
            isInactive={true}
            items={party.map(ch => {
              return {
                label: (
                  <PartyMember>
                    {ch ? (
                      <PartyMemberMain>
                        <PortraitContainer>
                          <StaticAnimDiv
                            style={{
                              width: '128',
                            }}
                            animName={`${ch.name.toLowerCase()}_portrait_f`}
                          ></StaticAnimDiv>
                        </PortraitContainer>
                        <ChInfoContainer id={`ch-info-${ch.name}`}>
                          <CharacterNameLabel id={'name-label-' + ch.name}>
                            {ch.name}
                          </CharacterNameLabel>
                          <PercentBarWrapper short={false}>
                            <ProgressBar
                              pct={characterGetHpPct(ch)}
                              backgroundColor={colors.BLACK}
                              color={colors.GREEN}
                              height={20}
                              label={`HP: ${ch.hp}`}
                            />
                          </PercentBarWrapper>
                        </ChInfoContainer>
                      </PartyMemberMain>
                    ) : null}
                  </PartyMember>
                ),
                value: ch,
              };
            })}
            onItemClickSound="menu_select"
            onItemClick={() => {}}
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
                      Party
                    </MenuLabel>
                  ),
                  value: MenuCommandItem.PARTY,
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
              <Button type={ButtonType.PRIMARY} onClick={handleCloseClick}>
                Close {getCancelKeyLabel()}
              </Button>
            </ConfirmButtonArea>
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
