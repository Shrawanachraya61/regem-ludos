/* @jsx h */
import { h } from 'preact';
import { colors, style } from 'view/style';
import VerticalMenu from 'view/elements/VerticalMenu';
import { Player } from 'model/player';
import { useEffect, useReducer } from 'preact/hooks';

import CharacterNameLabel from 'view/elements/CharacterNameLabel';
import {
  Character,
  characterEquipItem,
  characterGetStat,
  characterItemIsEquipped,
  characterUnEquipItem,
} from 'model/character';
import StaticAnimDiv from 'view/elements/StaticAnimDiv';
import { Item, ItemTemplate, ItemType } from 'db/items';
import { useReRender } from 'view/hooks';
import ItemDescription from '../ItemDescription';

const MAX_HEIGHT = '628px';

const Root = style('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  width: '800px',
  height: '532px',
  // height: '100%',
});

const CharacterSelectWrapper = style('div', {
  width: '33%',
});

const CharacterListItem = style('div', (props: { selected?: boolean }) => {
  return {
    background: props.selected ? colors.DARKBLUE : colors.BLACK,
    borderRadius: '80px 0px 80px 0px',
    borderTopRightRadius: '0px',
  };
});

const CharacterAnimDivWrapper = style('div', {});

const CenterWrapper = style('div', {
  width: '33%',
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
  };
});

const EquipmentPreviewWrapper = style('div', {
  border: `1px solid ${colors.WHITE}`,
  background: colors.DARKGREEN,
  width: '50%',
  minHeight: '232px',
  boxSizing: 'border-box',
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
  width: '33%',
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

  const stats = [
    'HP',
    'STAGGER',
    'RESV',
    'POW',
    'ACC',
    'FOR',
    'CON',
    'RES',
    'SPD',
    'EVA',
  ];

  return (
    <EquipmentPreviewWrapper>
      {stats.map(stat => {
        return (
          <EquipmentPreviewStatsItem>
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
    width: '150%',
    position: 'absolute',
    right: '0px',
    bottom: '0px',
    border: '1px solid ' + colors.WHITE,
    height: '232px',
    boxSizing: 'border-box',
    overflowY: 'auto',
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
  hoveredItem?: Item;
}

interface IMenuEquipmentAction {
  type: 'SET_CHARACTER' | 'SET_EQUIPMENT_TYPE' | 'SET_HOVERED_ITEM';
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
      }
      return nextState;
    },
    {} as IMenuEquipmentState
  );

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

  const filteredItems = (itemActive ? backpack : []).filter(item => {
    if (
      itemIsEquippedOnAnotherPartyMember(
        item,
        props.player,
        menuState.selectedCharacter as Character
      )
    ) {
      return false;
    }

    if (menuState.selectedEquipmentType === EquipmentType.WEAPON) {
      const weaponEquipTypes: any[] =
        menuState.selectedCharacter?.weaponEquipTypes ?? [];
      return (
        item.type === ItemType.WEAPON &&
        weaponEquipTypes.includes(item.weaponType)
      );
    } else if (menuState.selectedEquipmentType === EquipmentType.ARMOR) {
      return item.type === ItemType.ARMOR;
    } else if (
      [EquipmentType.ACCESSORY, EquipmentType.ACCESSORY2].includes(
        menuState.selectedEquipmentType as EquipmentType
      )
    ) {
      return (
        item.type === ItemType.ACCESSORY &&
        !accessoryIsEquippedInAnotherEquipSlot(
          item,
          menuState.selectedCharacter as Character,
          menuState.selectedEquipmentType as EquipmentType
        )
      );
    }
    return false;
  });

  useEffect(() => {
    if (filteredItems.length === 1 && !menuState.hoveredItem) {
      dispatch({
        type: 'SET_HOVERED_ITEM',
        payload: filteredItems[0],
      });
    }
  });

  return (
    <Root>
      <CharacterSelectWrapper>
        <VerticalMenu
          width="100%"
          height="100%"
          maxHeight={parseInt(MAX_HEIGHT) - 128 + 'px'}
          open={true}
          isCursorSelectInactive={!chSelectActive}
          title="Party Member"
          items={party.map(ch => {
            return {
              label: (
                <CharacterListItem
                  selected={menuState.selectedCharacter === ch}
                >
                  <CharacterAnimDivWrapper>
                    <StaticAnimDiv
                      style={{
                        width: '64',
                      }}
                      animName={`${ch.spriteBase.toLowerCase()}_idle_down`}
                    ></StaticAnimDiv>
                  </CharacterAnimDivWrapper>
                  <CharacterNameLabel>{ch.name}</CharacterNameLabel>
                </CharacterListItem>
              ),
              value: ch,
            };
          })}
          onItemClickSound="menu_select"
          onItemClick={(val: Character) => {
            dispatch({
              type: 'SET_CHARACTER',
              payload: val,
            });
          }}
          hideCloseBox={true}
          onClose={() => {
            props.onClose();
          }}
        />
      </CharacterSelectWrapper>
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
            style={{
              opacity: !menuState.selectedCharacter ? '0.5' : '1',
            }}
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
                    menuState.selectedCharacter?.equipment?.accessory1?.label ??
                    equippedItemLabel;
                  break;
                }
                case EquipmentType.ACCESSORY2: {
                  equippedItemLabel =
                    menuState.selectedCharacter?.equipment?.accessory2?.label ??
                    equippedItemLabel;
                  break;
                }
              }
              if (equippedItemLabel !== '(none equipped)') {
                equippedItemLabelColor = colors.YELLOW;
              }

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
                  </EquipmentTypeLabel>
                ),
                value: type,
              };
            })}
            onItemClickSound="menu_select"
            onItemClick={(val: EquipmentType) => {
              dispatch({
                type: 'SET_EQUIPMENT_TYPE',
                payload: val,
              });
              dispatch({
                type: 'SET_HOVERED_ITEM',
                payload: undefined,
              });
            }}
            hideCloseBox={!equipTypeActive && !itemActive}
            onClose={() => {
              dispatch({
                type: 'SET_CHARACTER',
                payload: undefined,
              });
              dispatch({
                type: 'SET_EQUIPMENT_TYPE',
                payload: undefined,
              });
            }}
            onCloseSound="menu_choice_close"
          />
        </EquipmentTypeSelectWrapper>
        <EquipmentPreview
          hoverItem={menuState.hoveredItem as ItemTemplate}
          replaceItem={itemEquippedInHoveredSlot}
          ch={menuState.selectedCharacter}
        />
      </CenterWrapper>
      <ItemSelectWrapper>
        <VerticalMenu
          title="Items"
          width="100%"
          // height="100%"
          maxHeight="223px"
          open={true}
          isCursorSelectInactive={!itemActive}
          style={{
            opacity: !menuState.selectedEquipmentType ? '0.5' : '1',
          }}
          items={filteredItems.map(item => {
            return {
              label: (
                <div
                  style={{
                    background:
                      menuState.selectedCharacter &&
                      characterItemIsEquipped(menuState.selectedCharacter, item)
                        ? colors.DARKGREEN
                        : colors.BLACK,
                  }}
                >
                  {item.label}
                </div>
              ),
              value: item,
            };
          })}
          onItemClickSound="menu_select2"
          onItemClick={(val: Item) => {
            let meta: any;
            if (menuState.selectedEquipmentType === EquipmentType.ACCESSORY) {
              meta = 0;
            } else if (
              menuState.selectedEquipmentType === EquipmentType.ACCESSORY2
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
            reRender();
            // dispatch({
            //   type: 'SET_HOVERED_ITEM',
            //   payload: undefined,
            // });
          }}
          onItemHover={(val: Item) => {
            dispatch({
              type: 'SET_HOVERED_ITEM',
              payload: val,
            });
          }}
          hideCloseBox={!itemActive}
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
        <EquipmentDescriptionWrapper>
          <ItemDescription item={menuState.hoveredItem as ItemTemplate} />
        </EquipmentDescriptionWrapper>
      </ItemSelectWrapper>
    </Root>
  );
};

export default MenuEquipment;
