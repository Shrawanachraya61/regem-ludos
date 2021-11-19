/* @jsx h */
import { h } from 'preact';
import { colors, style } from 'view/style';
import VerticalMenu from 'view/elements/VerticalMenu';
import { Player } from 'model/player';
import { useEffect, useReducer, useState } from 'preact/hooks';

import CharacterNameLabel from 'view/elements/CharacterNameLabel';
import {
  Character,
  characterEquipItem,
  characterGetEquippedItem,
  characterGetStat,
  characterItemIsEquipped,
  characterUnEquipItem,
} from 'model/character';
import StaticAnimDiv from 'view/elements/StaticAnimDiv';
import { Item, ItemTemplate, ItemType } from 'db/items';
import { useReRender } from 'view/hooks';
import ItemDescription from '../ItemDescription';
import { StatName } from 'model/battle';
import HorizontalMenu from 'view/elements/HorizontalMenu';
import { getIcon } from 'view/icons';

const MAX_HEIGHT = '628px';

const Root = style('div', {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
});

const LowerRoot = style('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  width: 'calc(100% + 2px)',
  margin: '8px',
  // height: '532px',
  // height: '100%',
});

const CharacterSelectWrapper = style('div', {
  width: '33%',
});

const CharacterListItem = style('div', (props: { selected?: boolean }) => {
  return {
    background: props.selected ? colors.DARKBLUE : colors.BLACK,
    borderRadius: props.selected ? '80px 0px 80px 0px' : '0px',
    borderTopRightRadius: '0px',
    width: '180px',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    transition: 'border-radius 300ms',
  };
});

const CharacterAnimDivWrapper = style('div', {});

const CenterWrapper = style('div', {
  width: '45%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
});

const EquipmentTypeSelectWrapper = style('div', {
  maxHeight: '194px',
});

const EquipmentTypeLabel = style('div', (props: { selected: boolean }) => {
  return {
    background: props.selected ? colors.DARKBLUE : colors.BLACK,
    textAlign: 'left',
    paddingLeft: '10px',
  };
});

const EquipmentPreviewWrapper = style('div', {
  border: `1px solid ${colors.WHITE}`,
  background: colors.BLACK,
  width: '22.5%',
  boxSizing: 'border-box',
  padding: '8px',
  marginRight: '2px',
});

const EquipmentPreviewStatsItem = style('div', {
  padding: '2px',
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  '& > span': {
    width: '30px',
  },
  '& > label': {
    textAlign: 'center',
    width: '32px',
  },
});

const ItemSelectWrapper = style('div', {
  width: '45%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  position: 'relative',
});

const EquipmentPreview = (props: {
  hoverItem?: Item;
  replaceItem?: Item;
  ch?: Character;
  stats: StatName[];
}) => {
  const conditionalModifier = (modName: string) => {
    const modifiers = props.hoverItem?.modifiers;
    let mod = modifiers?.[modName];
    let equipped = false;
    if (
      props.hoverItem &&
      props.ch &&
      characterItemIsEquipped(props.ch, props.hoverItem) &&
      mod !== undefined
    ) {
      equipped = true;
    } else {
      const equippedModifiers = props.replaceItem?.modifiers;
      const mod2 = equippedModifiers?.[modName];
      if (mod2 !== undefined) {
        mod = (mod ?? 0) - mod2;
      }
    }
    const width = '38px';
    if (mod === undefined || mod === 0) {
      return <div style={{ width }}></div>;
    } else if (mod > 0) {
      return (
        <div style={{ width, color: colors.BLUE }}>
          {equipped ? `(+${mod})` : `+${mod}`}
        </div>
      );
    } else if (mod < 0) {
      return (
        <div style={{ width, color: colors.RED }}>
          {equipped ? `(${mod})` : `${mod}`}
        </div>
      );
    }
  };

  const ch = props.ch;
  if (!ch) {
    return <EquipmentPreviewWrapper></EquipmentPreviewWrapper>;
  }
  return (
    <EquipmentPreviewWrapper>
      {props.stats.map(stat => {
        return (
          <EquipmentPreviewStatsItem key={stat}>
            <span>{stat.slice(0, 4)}</span>
            <label>{characterGetStat(ch, stat)}</label>
            {conditionalModifier(stat)}
          </EquipmentPreviewStatsItem>
        );
      })}
    </EquipmentPreviewWrapper>
  );
};

const EquipmentDescriptionWrapper = style('div', () => {
  return {
    // width: '150%',
    // position: 'absolute',
    // right: '0px',
    // bottom: '0px',
    border: '1px solid ' + colors.WHITE,
    // height: '232px',
    // boxSizing: 'border-box',
    width: '55%',
    height: '145px',
    overflowY: 'auto',
    background: colors.BLACK,
  };
});
const IconContainer = style('div', () => {
  return {
    width: '24px',
    position: 'absolute',
    right: '14px',
    top: '16px',
  };
});

const IconContainerSmall = style('div', () => {
  return {
    width: '24px',
    position: 'absolute',
    left: '14px',
    top: '5px',
  };
});

const itemIsEquippedOnAnotherPartyMember = (
  item: Item,
  player: Player,
  ch?: Character
) => {
  for (let i = 0; i < player.partyStorage.length; i++) {
    const partyMember = player.partyStorage[i];
    if (partyMember === ch) {
      continue;
    }
    if (characterItemIsEquipped(partyMember, item)) {
      return true;
    }
  }
  return false;
};

const accessoryEquipmentTypeToEquipmentKey = (slotType: EquipmentType) => {
  switch (slotType) {
    case EquipmentType.ACCESSORY:
      return 'accessory1';
    case EquipmentType.ACCESSORY2:
      return 'accessory2';
    default:
      return '';
  }
};

const getItemEquippedFromEquipmentType = (
  type: EquipmentType,
  ch: Character
) => {
  return ch.equipment[accessoryEquipmentTypeToEquipmentKey(type)];
};

const accessoryIsEquippedInAnotherEquipSlot = (
  item: Item,
  ch: Character,
  currentEquipSlot: EquipmentType
) => {
  const accessorySlots = [EquipmentType.ACCESSORY, EquipmentType.ACCESSORY2];
  const indOfCurrent = accessorySlots.indexOf(currentEquipSlot);
  if (indOfCurrent > -1) {
    accessorySlots.splice(indOfCurrent, 1);
  }
  for (let i = 0; i < accessorySlots.length; i++) {
    const slotType = accessorySlots[i];
    if (ch.equipment[accessoryEquipmentTypeToEquipmentKey(slotType)] === item) {
      return true;
    }
  }

  return false;
};

enum EquipmentType {
  ARMOR = 'Armor',
  ACCESSORY = 'Accessory',
  ACCESSORY2 = 'Accessory 2',
  WEAPON = 'Weapon',
}

interface IMenuEquipmentProps {
  player: Player;
  onClose: () => void;
}

interface IMenuEquipmentState {
  selectedCharacter?: Character;
  selectedEquipmentType?: EquipmentType;
  hoveredEquipmentType?: EquipmentType;
  hoveredItem?: Item;
}

const getFilteredItems = (
  player: Player,
  ch: Character,
  type: EquipmentType
) => {
  const backpack = player.backpack;
  return backpack.filter(item => {
    if (itemIsEquippedOnAnotherPartyMember(item, player, ch)) {
      return false;
    }

    if (type === EquipmentType.WEAPON) {
      const weaponEquipTypes: any[] = ch.weaponEquipTypes ?? [];
      return (
        item.type === ItemType.WEAPON &&
        weaponEquipTypes.includes(item.weaponType)
      );
    } else if (type === EquipmentType.ARMOR) {
      return item.type === ItemType.ARMOR;
    } else if (
      [EquipmentType.ACCESSORY, EquipmentType.ACCESSORY2].includes(type)
    ) {
      return (
        item.type === ItemType.ACCESSORY &&
        !accessoryIsEquippedInAnotherEquipSlot(item, ch, type)
      );
    }
    return false;
  });
};

interface IMenuEquipmentAction {
  type:
    | 'SET_CHARACTER'
    | 'SET_EQUIPMENT_TYPE'
    | 'SET_HOVERED_ITEM'
    | 'SET_HOVER_EQUIPMENT_TYPE';
  payload?: Character | EquipmentType | Item;
}

const MenuEquipment = (props: IMenuEquipmentProps) => {
  const [menuState, dispatch] = useReducer(
    (oldState: IMenuEquipmentState, action: IMenuEquipmentAction) => {
      const nextState = { ...oldState };
      if (action.type === 'SET_CHARACTER') {
        nextState.selectedCharacter = action.payload as Character;
      } else if (action.type === 'SET_EQUIPMENT_TYPE') {
        nextState.selectedEquipmentType = action.payload as EquipmentType;
      } else if (action.type === 'SET_HOVERED_ITEM') {
        nextState.hoveredItem = action.payload as Item;
      } else if (action.type === 'SET_HOVER_EQUIPMENT_TYPE') {
        nextState.hoveredEquipmentType = action.payload as EquipmentType;
      }
      return nextState;
    },
    {
      selectedCharacter: props.player.party[0],
      hoveredEquipmentType: EquipmentType.WEAPON,
    } as IMenuEquipmentState
  );

  const [itemCursorReset, setItemCursorReset] = useState(false);
  const resetItemCursor = () => {
    setItemCursorReset(!itemCursorReset);
    // dispatch({
    //   type: 'SET_HOVERED_ITEM',
    //   payload: val,
    // });
  };

  const [hoverMenuSwitch, resetHoverMenuSwitch] = useState(true);

  const reRender = useReRender();

  const party = props.player.party;
  const backpack = props.player.backpack;

  const chSelectActive = !menuState.selectedCharacter;
  const equipTypeActive =
    menuState.selectedCharacter && !menuState.selectedEquipmentType;
  const itemActive = !!(
    menuState.selectedCharacter && menuState.selectedEquipmentType
  );

  let itemEquippedInHoveredSlot: Item | undefined;
  if (menuState.selectedEquipmentType && menuState.selectedCharacter) {
    itemEquippedInHoveredSlot = getItemEquippedFromEquipmentType(
      menuState.selectedEquipmentType,
      menuState.selectedCharacter
    );
  }

  const filteredItems = getFilteredItems(
    props.player,
    menuState.selectedCharacter as Character,
    menuState.hoveredEquipmentType as EquipmentType
  );

  useEffect(() => {
    if (filteredItems.length === 1 && !menuState.hoveredItem) {
      dispatch({
        type: 'SET_HOVERED_ITEM',
        payload: filteredItems[0],
      });
    }
  });

  const onCharacterSelect = (val: Character) => {
    const lastItemIndex = filteredItems.indexOf(menuState.hoveredItem as Item);

    dispatch({
      type: 'SET_CHARACTER',
      payload: val,
    });
    const filteredItemsNext = getFilteredItems(
      props.player,
      val,
      menuState.hoveredEquipmentType as EquipmentType
    );
    const currentItemIndex = filteredItemsNext.indexOf(
      menuState.hoveredItem as Item
    );
    if (
      !filteredItemsNext.includes(menuState.hoveredItem as Item) ||
      lastItemIndex !== currentItemIndex
    ) {
      dispatch({
        type: 'SET_HOVERED_ITEM',
        payload: filteredItems[0],
      });
      resetItemCursor();
    }
  };

  return (
    <Root>
      <div
        style={{ padding: '8px' }}
      >{`Press Left/Right Arrows to change character.`}</div>
      <HorizontalMenu
        style={{
          width: '100%',
          background: colors.BLACK,
          zIndex: '2',
        }}
        isInactive={false}
        title="Party Member"
        items={party.map(ch => {
          return {
            label: (
              <CharacterListItem selected={menuState.selectedCharacter === ch}>
                <CharacterAnimDivWrapper>
                  <StaticAnimDiv
                    style={{
                      width: '64',
                    }}
                    animName={`${ch.spriteBase.toLowerCase()}_idle_down`}
                  ></StaticAnimDiv>
                </CharacterAnimDivWrapper>
                <CharacterNameLabel
                  style={{
                    fontSize: '14px',
                  }}
                >
                  {ch.name}
                </CharacterNameLabel>
              </CharacterListItem>
            ),
            value: ch,
          };
        })}
        onItemClickSound="menu_select2"
        onItemClick={onCharacterSelect}
        onItemHoverSound="menu_select2"
        onItemHover={onCharacterSelect}
        disableMouseHover={true}
        disableConfirmButtonClick={true}
        useArrowIndicator={true}
      ></HorizontalMenu>
      <LowerRoot>
        <CenterWrapper>
          <EquipmentTypeSelectWrapper>
            <VerticalMenu
              title="Equipment"
              width="100%"
              height="268px"
              // maxHeight={parseInt(MAX_HEIGHT) - 128 + 'px'}
              open={true}
              isCursorSelectInactive={!equipTypeActive}
              isInactive={!menuState.selectedCharacter}
              hideCloseBox={true}
              // style={{
              //   opacity: !menuState.selectedCharacter ? '0.5' : '1',
              // }}
              items={[
                EquipmentType.WEAPON,
                EquipmentType.ARMOR,
                EquipmentType.ACCESSORY,
                EquipmentType.ACCESSORY2,
              ].map(type => {
                let equippedItemLabel = '(none equipped)';
                let equippedItemLabelColor = colors.GREY;
                switch (type) {
                  case EquipmentType.WEAPON: {
                    equippedItemLabel =
                      menuState.selectedCharacter?.equipment?.weapon?.label ??
                      equippedItemLabel;
                    break;
                  }
                  case EquipmentType.ARMOR: {
                    equippedItemLabel =
                      menuState.selectedCharacter?.equipment?.armor?.label ??
                      equippedItemLabel;
                    break;
                  }
                  case EquipmentType.ACCESSORY: {
                    equippedItemLabel =
                      menuState.selectedCharacter?.equipment?.accessory1
                        ?.label ?? equippedItemLabel;
                    break;
                  }
                  case EquipmentType.ACCESSORY2: {
                    equippedItemLabel =
                      menuState.selectedCharacter?.equipment?.accessory2
                        ?.label ?? equippedItemLabel;
                    break;
                  }
                }
                if (equippedItemLabel !== '(none equipped)') {
                  equippedItemLabelColor = colors.YELLOW;
                }

                const item = characterGetEquippedItem(
                  menuState.selectedCharacter as Character,
                  type
                );
                const Icon = item?.icon ? getIcon(item.icon) : null;

                return {
                  label: (
                    <EquipmentTypeLabel
                      selected={menuState.selectedEquipmentType === type}
                    >
                      <div>
                        <b>{type}</b>
                      </div>
                      <div
                        style={{
                          color: equippedItemLabelColor,
                          visibility: menuState.selectedCharacter
                            ? 'visible'
                            : 'hidden',
                        }}
                      >
                        {equippedItemLabel}
                      </div>
                      <IconContainer>
                        {Icon ? <Icon color={colors.WHITE} /> : null}
                      </IconContainer>
                    </EquipmentTypeLabel>
                  ),
                  value: type,
                };
              })}
              onItemClickSound="menu_select"
              onItemClick={(val: EquipmentType) => {
                if (filteredItems.length) {
                  dispatch({
                    type: 'SET_EQUIPMENT_TYPE',
                    payload: val,
                  });
                  dispatch({
                    type: 'SET_HOVERED_ITEM',
                    payload: undefined,
                  });
                  resetItemCursor();
                }
              }}
              onItemHover={(val: EquipmentType) => {
                dispatch({
                  type: 'SET_HOVER_EQUIPMENT_TYPE',
                  payload: val,
                });
                const item = characterGetEquippedItem(
                  menuState.selectedCharacter as Character,
                  val
                );
                if (item) {
                  dispatch({
                    type: 'SET_HOVERED_ITEM',
                    payload: item,
                  });
                } else {
                  dispatch({
                    type: 'SET_HOVERED_ITEM',
                    payload: undefined,
                  });
                }
                // if (characterGetEquippedItem
              }}
              onClose={() => {
                props.onClose();
              }}
              // onClose={() => {
              //   dispatch({
              //     type: 'SET_CHARACTER',
              //     payload: undefined,
              //   });
              //   dispatch({
              //     type: 'SET_EQUIPMENT_TYPE',
              //     payload: undefined,
              //   });
              // }}
              // onCloseSound="menu_choice_close"
              backgroundColor={colors.BLACK}
            />
          </EquipmentTypeSelectWrapper>
        </CenterWrapper>
        <ItemSelectWrapper>
          <VerticalMenu
            title="Items"
            width="100%"
            // height="100%"
            height="268px"
            open={true}
            resetCursor={itemCursorReset}
            isCursorSelectInactive={!itemActive}
            // style={{
            //   opacity: !menuState.selectedEquipmentType ? '0.5' : '1',
            // }}
            items={filteredItems.map(item => {
              const Icon = item?.icon ? getIcon(item.icon) : null;
              return {
                label: (
                  <div
                    style={{
                      textAlign: 'left',
                      background:
                        menuState.selectedCharacter &&
                        characterItemIsEquipped(
                          menuState.selectedCharacter,
                          item
                        )
                          ? colors.DARKGREEN
                          : 'unset',
                    }}
                  >
                    <IconContainerSmall>
                      {Icon ? <Icon color={colors.WHITE} /> : null}
                    </IconContainerSmall>
                    <div style={{ marginLeft: '36px' }}>{item.label}</div>
                  </div>
                ),
                value: item,
              };
            })}
            onItemClickSound="menu_select2"
            onItemClick={(val: Item) => {
              let meta: any;
              if (menuState.hoveredEquipmentType === EquipmentType.ACCESSORY) {
                meta = 0;
              } else if (
                menuState.hoveredEquipmentType === EquipmentType.ACCESSORY2
              ) {
                meta = 1;
              }
              if (
                characterItemIsEquipped(
                  menuState.selectedCharacter as Character,
                  val
                )
              ) {
                characterUnEquipItem(
                  menuState.selectedCharacter as Character,
                  val,
                  meta
                );
              } else {
                characterEquipItem(
                  menuState.selectedCharacter as Character,
                  val,
                  meta
                );
              }
              dispatch({
                type: 'SET_HOVERED_ITEM',
                payload: val,
              });
              // reRender();
              // dispatch({
              //   type: 'SET_HOVERED_ITEM',
              //   payload: undefined,
              // });
            }}
            onItemHover={(val: Item) => {
              console.log('SET HOVERED ITEM', val);
              dispatch({
                type: 'SET_HOVERED_ITEM',
                payload: val,
              });
            }}
            hideCloseBox={true}
            resetIfTooLong={true}
            onClose={() => {
              dispatch({
                type: 'SET_EQUIPMENT_TYPE',
                payload: undefined,
              });
              dispatch({
                type: 'SET_HOVERED_ITEM',
                payload: undefined,
              });
            }}
            onCloseSound="menu_choice_close"
          />
        </ItemSelectWrapper>
      </LowerRoot>
      <div
        style={{
          width: 'calc(100% + 2px)',
          display: 'flex',
          justifyContent: 'flex-start',
        }}
      >
        <EquipmentPreview
          hoverItem={menuState.hoveredItem as ItemTemplate}
          replaceItem={itemEquippedInHoveredSlot}
          ch={menuState.selectedCharacter}
          stats={['HP', 'STAGGER', 'RESV', 'EVA', 'ACC']}
        />
        <EquipmentPreview
          hoverItem={menuState.hoveredItem as ItemTemplate}
          replaceItem={itemEquippedInHoveredSlot}
          ch={menuState.selectedCharacter}
          stats={['POW', 'FOR', 'CON', 'RES', 'SPD']}
        />
        <EquipmentDescriptionWrapper>
          <ItemDescription
            item={menuState.hoveredItem as ItemTemplate}
            disableTitle={true}
          />
        </EquipmentDescriptionWrapper>
      </div>
    </Root>
  );
};

// const stats: StatName[] = [
//   'HP',
//   'STAGGER',
//   'RESV',
//   'POW',
//   'ACC',
//   'FOR',
//   'CON',
//   'RES',
//   'SPD',
//   'EVA',
// ];

export default MenuEquipment;
