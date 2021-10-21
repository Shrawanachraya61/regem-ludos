/* @jsx h */
import { h } from 'preact';
import { colors, style } from 'view/style';
import { Item, ItemType } from 'db/items';
import Button, { ButtonType } from 'view/elements/Button';
import { playSoundName } from 'model/sound';
import { getConfirmKeyLabel } from 'controller/events';
import { getIcon } from 'view/icons';
import { getCurrentBattle } from 'model/generics';
import { itemIsCurrentlyUsable } from 'model/item';

const Root = style('div', () => {
  return {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexFlow: 'column',
  };
});

const EquipmentDescriptionTitle = style('div', () => {
  return {
    textAlign: 'center',
    fontSize: '16px',
    padding: '0.5rem',
    minHeight: '16px',
    border: '1px solid' + colors.WHITE,
    background: colors.DARKRED,
    margin: '2px',
  };
});

const EquipmentTitleText = style('div', () => {
  return {
    padding: '8px',
    fontSize: '24px',
  };
});

const EquipmentDescriptionText = style('div', () => {
  return {
    padding: '8px',
  };
});

interface IItemDescriptionProps {
  item?: Item;
  showName?: boolean;
  onUse?: (item: Item) => void;
}

const ItemDescription = (props: IItemDescriptionProps) => {
  const modifiers = props.item?.modifiers || {};
  const modStrings: string[] = [];
  for (const i in modifiers) {
    const mod = modifiers[i];
    modStrings.push(`${i.toUpperCase()}: ${mod > 0 ? '+' : ''}${mod}`);
  }

  const skills = props.item?.skills || [];
  const skillStrings: string[] = [];
  for (const i in skills) {
    const skill = skills[i];
    let str = skill.name;
    const metaSwings: any = skill.meta.swings;
    const metaRanges: any = skill.meta.ranges;
    if (metaSwings) {
      str +=
        ' (MELEE) [' +
        metaSwings.map((s: string) => s.toUpperCase()).join(',') +
        ']';
    } else if (metaRanges) {
      str +=
        ' (RANGE) [' +
        metaRanges.map((s: string) => s.toUpperCase()).join(',') +
        ']';
    }
    skillStrings.push(str);
  }

  const isCurrentlyUsable = itemIsCurrentlyUsable(props.item);

  const Icon = props?.item?.icon
    ? getIcon(props?.item?.icon)
    : () => <div></div>;

  return (
    <Root>
      <div>
        <EquipmentDescriptionTitle>DESCRIPTION</EquipmentDescriptionTitle>
        {props.showName ? (
          <EquipmentTitleText
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '32px',
                marginRight: '12px',
                marginBottom: '8px',
                marginTop: '8px',
              }}
            >
              <Icon color={colors.WHITE} />
            </div>
            <b>{props.item?.label}</b>
          </EquipmentTitleText>
        ) : null}
        {isCurrentlyUsable ? (
          <Button
            type={ButtonType.SECONDARY}
            style={{ width: '100px', marginLeft: '8px', marginBottom: '16px' }}
            onClick={async () => {
              if (props?.item?.onUse && props.onUse) {
                props.onUse(props.item);
              }
            }}
          >
            Use {getConfirmKeyLabel()}
          </Button>
        ) : null}
      </div>
      <div
        // This is used by the parent to scroll bottom/top, don't change
        id="item-description-container"
        style={{
          overflowY: 'auto',
          borderTop: '1px solid ' + colors.WHITE,
          flex: '1',
          background: colors.DARKGREY,
        }}
      >
        {props.item?.effectDescription ? (
          <EquipmentDescriptionText
            style={{
              color: colors.LIGHTGREY,
            }}
          >
            {props.item?.effectDescription}
          </EquipmentDescriptionText>
        ) : null}
        {modStrings.length > 0 ? (
          <EquipmentDescriptionText
            style={{
              color: colors.BLUE,
            }}
          >
            {modStrings.join(', ')}
          </EquipmentDescriptionText>
        ) : null}
        {skillStrings.length > 0 ? (
          <EquipmentDescriptionText>
            {skillStrings.map(str => {
              return (
                <div
                  style={{
                    color: colors.ORANGE,
                  }}
                  key={str}
                >
                  {'Skill: ' + str}
                </div>
              );
            })}
          </EquipmentDescriptionText>
        ) : null}
        <EquipmentDescriptionText
          dangerouslySetInnerHTML={{
            __html: props.item?.description,
          }}
        >
          {props.item?.description ? (
            ''
          ) : (
            <div
              style={{
                color: colors.LIGHTGREY,
                textAlign: 'center',
              }}
            >
              Hover over an item to see a description.
            </div>
          )}
        </EquipmentDescriptionText>
      </div>
    </Root>
  );
};

export default ItemDescription;
