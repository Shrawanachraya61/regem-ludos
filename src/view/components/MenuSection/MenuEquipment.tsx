/* @jsx h */
import { h } from 'preact';
import { colors, style } from 'view/style';
import VerticalMenu from 'view/elements/VerticalMenu';
import { Player } from 'model/player';
import { useReducer } from 'preact/hooks';

import CharacterNameLabel from 'view/elements/CharacterNameLabel';
import {
  Character,
  characterEquipItem,
  characterItemIsEquipped,
} from 'model/character';
import StaticAnimDiv from 'view/elements/StaticAnimDiv';
import { Item, ItemTemplate, ItemType } from 'db/items';

const MAX_HEIGHT = '628px';

const Root = style('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  width: '686px',
  height: '612px',
  // height: '100%',
});

const CharacterSelectWrapper = style('div', {
  width: '33%',
});

const CharacterListItem = style('div', (props: { selected?: boolean }) => {
  return {
    background: props.selected ? colors.DARKBLUE : colors.BLACK,
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
});

const EquipmentPreviewStatsItem = style('div', {
  padding: '8px',
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  background: colors.DARKGREY_ALT,
});

const ItemSelectWrapper = style('div', {
  width: '33%',
});

const EquipmentPreview = (props: { item?: Item | null; ch?: Character }) => {
  const modifiers = props.item?.modifiers;

  const conditionalModifier = (modName: string) => {
    const mod = modifiers?.[modName];
    if (mod === undefined) {
      return undefined;
    } else if (mod > 0) {
      return <div style={{ color: colors.GREEN }}>+{mod}</div>;
    } else if (mod < 0) {
      return <div style={{ color: colors.RED }}>-{mod}</div>;
    }
  };

  return (
    <EquipmentPreviewWrapper>
      <EquipmentPreviewStatsItem>
        <span>HP</span>
        <label>{props.ch?.stats.HP}</label>
        {conditionalModifier('HP')}
      </EquipmentPreviewStatsItem>
      <EquipmentPreviewStatsItem>
        <span>STAG</span>
        <label>{props.ch?.stats.STAGGER}</label>
        {conditionalModifier('STAGGER')}
      </EquipmentPreviewStatsItem>
      <EquipmentPreviewStatsItem>
        <span>RESV</span>
        <label>{props.ch?.stats.RESV}</label>
        {conditionalModifier('RESV')}
      </EquipmentPreviewStatsItem>
      <EquipmentPreviewStatsItem>
        <span>POW</span>
        <label>{props.ch?.stats.POW}</label>
        {conditionalModifier('POW')}
      </EquipmentPreviewStatsItem>
      <EquipmentPreviewStatsItem>
        <span>ACC</span>
        <label>{props.ch?.stats.ACC}</label>
        {conditionalModifier('ACC')}
      </EquipmentPreviewStatsItem>
      <EquipmentPreviewStatsItem>
        <span>FOR</span>
        <label>{props.ch?.stats.FOR}</label>
        {conditionalModifier('FOR')}
      </EquipmentPreviewStatsItem>
      <EquipmentPreviewStatsItem>
        <span>CON</span>
        <label>{props.ch?.stats.CON}</label>
        {conditionalModifier('CON')}
      </EquipmentPreviewStatsItem>
      <EquipmentPreviewStatsItem>
        <span>RES</span>
        <label>{props.ch?.stats.RES}</label>
        {conditionalModifier('RES')}
      </EquipmentPreviewStatsItem>
      <EquipmentPreviewStatsItem>
        <span>SPD</span>
        <label>{props.ch?.stats.SPD}</label>
        {conditionalModifier('SPD')}
      </EquipmentPreviewStatsItem>
      <EquipmentPreviewStatsItem>
        <span>EVA</span>
        <label>{props.ch?.stats.EVA}</label>
        {conditionalModifier('EVA')}
      </EquipmentPreviewStatsItem>
    </EquipmentPreviewWrapper>
  );
};

const itemIsEquippedOnAnotherPartyMember = (
  item: Item,
  player: Player,
  ch: Character
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

enum EquipmentType {
  ARMOR = 'Armor',
  ACCESSORY = 'Accessory',
  ACCESSORY2 = 'Accessory 2',
  WEAPON = 'Weapon',
}

interface IMenuEquipmentProps {
  player: Player;
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

  const party = props.player.party;
  const backpack = props.player.backpack;

  const chSelectActive = !menuState.selectedCharacter;
  const equipTypeActive =
    menuState.selectedCharacter && !menuState.selectedEquipmentType;
  const itemActive = !!(
    menuState.selectedCharacter && menuState.selectedEquipmentType
  );

  return (
    <Root>
      <CharacterSelectWrapper>
        <VerticalMenu
          width="100%"
          height="100%"
          maxHeight={parseInt(MAX_HEIGHT) - 128 + 'px'}
          open={true}
          isInactive={!chSelectActive}
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
            dispatch({
              type: 'SET_CHARACTER',
              payload: undefined,
            });
          }}
        />
      </CharacterSelectWrapper>
      <CenterWrapper>
        <EquipmentTypeSelectWrapper>
          <VerticalMenu
            width="100%"
            height="194px"
            maxHeight={parseInt(MAX_HEIGHT) - 128 + 'px'}
            open={true}
            isInactive={!equipTypeActive}
            title="Equipment Type"
            items={[
              EquipmentType.WEAPON,
              EquipmentType.ARMOR,
              EquipmentType.ACCESSORY,
              EquipmentType.ACCESSORY2,
            ].map(type => {
              return {
                label: (
                  <EquipmentTypeLabel
                    selected={menuState.selectedEquipmentType === type}
                  >
                    {type}
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
            }}
            hideCloseBox={true}
            onClose={() => {
              dispatch({
                type: 'SET_CHARACTER',
                payload: undefined,
              });
            }}
          />
        </EquipmentTypeSelectWrapper>
        <EquipmentPreview
          item={menuState.hoveredItem as ItemTemplate | null}
          ch={menuState.selectedCharacter}
        />
      </CenterWrapper>
      <ItemSelectWrapper>
        <VerticalMenu
          width="100%"
          height="100%"
          maxHeight={parseInt(MAX_HEIGHT) - 128 + 'px'}
          open={true}
          isInactive={!itemActive}
          title="Equipment"
          items={(itemActive ? backpack : [])
            .filter(item => {
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
                return item.type === ItemType.WEAPON;
              } else if (
                menuState.selectedEquipmentType === EquipmentType.ARMOR
              ) {
                return item.type === ItemType.ARMOR;
              } else if (
                [EquipmentType.ACCESSORY, EquipmentType.ACCESSORY2].includes(
                  menuState.selectedEquipmentType as EquipmentType
                )
              ) {
                return item.type === ItemType.ACCESSORY;
              }
              return false;
            })
            .map(item => {
              return {
                label: (
                  <div
                    style={{
                      background:
                        menuState.selectedCharacter &&
                        characterItemIsEquipped(
                          menuState.selectedCharacter,
                          item
                        )
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
          onItemClickSound="menu_select"
          onItemClick={(val: Item) => {
            characterEquipItem(menuState.selectedCharacter as Character, val);
            dispatch({
              type: 'SET_HOVERED_ITEM',
              payload: undefined,
            });
          }}
          onItemHover={(val: Item) => {
            // characterEquipItem(menuState.selectedCharacter as Character, val);
            dispatch({
              type: 'SET_HOVERED_ITEM',
              payload: val,
            });
          }}
          hideCloseBox={true}
          onClose={() => {
            dispatch({
              type: 'SET_EQUIPMENT_TYPE',
              payload: undefined,
            });
          }}
        />
      </ItemSelectWrapper>
    </Root>
  );
};

export default MenuEquipment;
