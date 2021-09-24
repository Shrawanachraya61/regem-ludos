/* @jsx h */
import { h } from 'preact';
import { colors, style } from 'view/style';
import { Item } from 'db/items';
import Button, { ButtonType } from 'view/elements/Button';
import { playSoundName } from 'model/sound';
import { getConfirmKeyLabel } from 'controller/events';

const Root = style('div', () => {
  return {
    height: '100%',
    width: '100%',
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

  return (
    <Root>
      <EquipmentDescriptionTitle>DESCRIPTION</EquipmentDescriptionTitle>
      {props.showName ? (
        <EquipmentTitleText>
          <b>{props.item?.label}</b>
        </EquipmentTitleText>
      ) : null}
      {props.onUse && props.item?.onUse ? (
        <Button
          type={ButtonType.SECONDARY}
          style={{ width: '100px', marginLeft: '8px' }}
          onClick={async () => {
            if (props?.item?.onUse && props.onUse) {
              props.onUse(props.item);
            }
          }}
        >
          Use {getConfirmKeyLabel()}
        </Button>
      ) : null}
      <EquipmentDescriptionText>
        {props.item?.description ?? (
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
      {modStrings.length > 0 ? (
        <EquipmentDescriptionText>
          {modStrings.join(', ')}
        </EquipmentDescriptionText>
      ) : null}
      {skillStrings.length > 0 ? (
        <EquipmentDescriptionText>
          {skillStrings.map(str => {
            return <div key={str}>{'Skill: ' + str}</div>;
          })}
        </EquipmentDescriptionText>
      ) : null}
    </Root>
  );
};

export default ItemDescription;
