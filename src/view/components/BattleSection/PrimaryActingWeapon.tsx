/* @jsx h */
import { h } from 'preact';
import { colors, IntrinsicProps, style } from 'view/style';
import { getCurrentBattle } from 'model/generics';
import {
  BattleAction,
  BattleActions,
  BattleActionType,
  SwingType,
} from 'controller/battle-actions';
import { BattleCharacter } from 'model/battle-character';
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  useBattleSubscriptionWithBattleCharacter,
  useReRender,
} from 'view/hooks';
import { BattleEvent } from 'model/battle';

import CircleIcon from 'view/icons/Circle';
import CloseIcon from 'view/icons/Close';
import SwingNormalIcon from 'view/icons/SwingNormal';
import SwingPierceIcon from 'view/icons/SwingPierce';
import SwingFinisherIcon from 'view/icons/SwingFinisher';

interface IActingWeaponPrimaryProps extends IntrinsicProps {
  id?: string;
  children?: string;
  bCh: BattleCharacter;
  battleAction: BattleAction;
}

const Root = style('div', () => {
  return {
    pointerEvents: 'none',
    width: '100%',
    height: '100%',
  };
});

const SwingTable = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    // border: '2px solid ' + colors.WHITE
  };
});

const SwingTableCell = style('div', () => {
  return {
    border: '2px solid ' + colors.WHITE,
    borderBottom: '2px solid ' + colors.GREEN,
    background: colors.DARKGREY,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'column',
    width: '28px',
    padding: '8px',
    '& > span': {
      width: '24px',
      marginTop: '8px',
    },
    // minHeight: '64px',
    // '&:first-child': {
    //   borderBottom: '2px solid ' + colors.WHITE,
    //   marginBottom: '8px',
    // },
    // '&:last-child': {
    //   marginTop: '8px',
    // },
  };
});

const getIcon = (swingType: SwingType, color: string) => {
  const SwingTypeToIconType = {
    [SwingType.NORMAL]: <SwingNormalIcon color={color} />,
    [SwingType.PIERCE]: <SwingPierceIcon color={color} />,
    [SwingType.FINISH]: <SwingFinisherIcon color={color} />,
  };

  return SwingTypeToIconType[swingType];
};

const ActingWeaponPrimary = (props: IActingWeaponPrimaryProps) => {
  const action = props.battleAction;
  const actionStateIndex = props.bCh.actionStateIndex;
  const ref = useRef(null);
  const id = 'acting-weapon-primary-' + props.bCh.ch.name;
  const render = useReRender();

  useEffect(() => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.style.transition = 'unset';
      elem.style.transform = 'scale(0.9)';
      elem.style.transition = 'transform 150ms';
      setTimeout(() => {
        elem.style.transform = 'scale(1.0)';
      }, 100);
    }
  }, [actionStateIndex, ref, id]);

  useBattleSubscriptionWithBattleCharacter(
    getCurrentBattle(),
    props.bCh,
    BattleEvent.onCharacterAction,
    () => {
      console.log(props.bCh.ch.name, 'Action!');
      render();
    }
  );

  return (
    <Root ref={ref} id={id}>
      <SwingTable>
        {action.meta.swings?.map((swingType: SwingType, i: number) => {
          const hasConsumedSwing =
            i < actionStateIndex || actionStateIndex === 0;
          switch (swingType) {
            case SwingType.PIERCE:
            case SwingType.NORMAL: {
              return (
                <SwingTableCell
                  id={'swing-table-cell-' + props.bCh.ch.name + '-' + i}
                >
                  {getIcon(swingType, colors.BLUE)}
                  {hasConsumedSwing ? (
                    <span>
                      <CloseIcon color={colors.LIGHTGREEN} />
                    </span>
                  ) : (
                    <span>
                      <CircleIcon color={colors.WHITE} />
                    </span>
                  )}
                </SwingTableCell>
              );
            }
            default:
              return <SwingTableCell></SwingTableCell>;
          }
        })}
      </SwingTable>
    </Root>
  );
};

export default ActingWeaponPrimary;
