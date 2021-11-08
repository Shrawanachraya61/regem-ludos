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
import CircleIcon from 'view/icons/Circle';
import CloseIcon from 'view/icons/Close';
import SwingNormalIcon from 'view/icons/SwingNormal';
import SwingPierceIcon from 'view/icons/SwingPierce';
import SwingFinisherIcon from 'view/icons/SwingFinisher';
import { useEffect, useState, useRef } from 'preact/hooks';
import {
  useBattleSubscriptionWithBattleCharacter,
  useReRender,
} from 'view/hooks';
import { BattleEvent } from 'model/battle';
import { ProgressBarWithRender } from 'view/elements/ProgressBar';

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
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '20px',
  };
});

const ProgressBarWrapper = style('div', () => {
  return {
    border: '2px solid ' + colors.WHITE,
    borderBottom: '0px',
    width: '100%',
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
  const id = 'casting-primary-' + props.bCh.ch.name;
  const createRenderKey = (append: string) => {
    return `${props.bCh.ch.name}_${append}`;
  };
  return (
    <Root id={id}>
      <div>{action.name}</div>
      <ProgressBarWrapper>
        <ProgressBarWithRender
          id={'progress-cast-' + props.bCh.ch.name}
          renderFunc={() => {
            return props.bCh.castTimer.getPctComplete();
          }}
          renderKey={createRenderKey('cast')}
          backgroundColor={colors.BLACK}
          color={colors.PURPLE}
          height={32}
          label=""
        />
      </ProgressBarWrapper>
    </Root>
  );
};

export default ActingWeaponPrimary;
