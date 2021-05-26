/* @jsx h */
import { h } from 'preact';
import {
  BattleAllegiance,
  BattleEvent,
  battleGetAllegiance,
  PersistentEffectEventParams,
  battleGetAllPersistentEffectsForAllegiance,
} from 'model/battle';
import { colors, style } from 'view/style';
import AnimDiv from 'view/elements/AnimDiv';
import { useBattleSubscription, useReRender } from 'view/hooks';
import { getCurrentBattle, getIsPaused } from 'model/generics';
import { BattleCharacter } from 'model/battle-character';
import { useCallback } from 'preact/hooks';

interface IChannelIndicators {
  id?: string;
  allegiance: BattleAllegiance;
}

const Root = style(
  'div',
  (props: { placement: 'left' | 'right'; visible: boolean }) => {
    return {
      color: colors.WHITE,
      // border: `2px solid ${colors.WHITE}`,
      fontSize: '14px',
      position: 'absolute',
      padding: '4px',
      margin: '4px',
      top: '25%',
      width: '164px',
      background: 'rgba(0, 0, 0, 0.25)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'space-between',
      justifyContent: props.placement === 'left' ? 'flex-start' : 'flex-end',
      // pointerEvents: 'none',
      [props.placement]: '0px',
      opacity: props.visible ? '1' : '0',
      transition: 'opacity 500ms',
    };
  }
);

const PersistentEventIndicatorRoot = style(
  'div',
  (props: { placement: 'left' | 'right' }) => {
    return {
      display: 'flex',
      justifyContent: props.placement === 'right' ? 'flex-end' : 'unset',
      alignItems: 'center',
      flexDirection: props.placement === 'right' ? 'row-reverse' : 'unset',
    };
  }
);

const PersistentEventIndicatorTitle = style(
  'div',
  (props: { placement: 'left' | 'right' }) => {
    return {
      fontSize: '20px',
      border: `2px solid ${colors.BLACK}`,
      borderBottom: `2px solid ${
        props.placement === 'right' ? colors.RED : colors.BLUE
      }`,
      textAlign: 'center',
      padding: '4px',
      background:
        props.placement === 'right' ? colors.DARKRED : colors.DARKBLUE,
    };
  }
);

const PersistentEventIndicator = (props: {
  params: PersistentEffectEventParams<any>;
  placement: 'left' | 'right';
}) => {
  const isPaused = getIsPaused();
  return (
    <PersistentEventIndicatorRoot placement={props.placement}>
      <span>{props.params.name}</span>
      <AnimDiv
        animName={props.params.icon}
        renderLoopId={`persistent-icon-${props.params.source.ch.name}`}
        scale={2}
      />
    </PersistentEventIndicatorRoot>
  );
};

const determinePlacement = (allegiance: BattleAllegiance): 'left' | 'right' => {
  return allegiance === BattleAllegiance.ENEMY ? 'right' : 'left';
};

const ChannelIndicators = (props: IChannelIndicators) => {
  const reRender = useReRender();
  const battle = getCurrentBattle();

  const persistentEvents = battleGetAllPersistentEffectsForAllegiance(
    battle,
    props.allegiance
  );

  const checkForRender = useCallback(
    (bCh: BattleCharacter) => {
      const battle = getCurrentBattle();
      const allegiance = battleGetAllegiance(battle, bCh.ch);
      if (allegiance === props.allegiance) {
        reRender();
      }
    },
    [props.allegiance, persistentEvents]
  );

  useBattleSubscription(
    getCurrentBattle(),
    BattleEvent.onCharacterDamaged,
    checkForRender
  );
  useBattleSubscription(
    getCurrentBattle(),
    BattleEvent.onCharacterChannelling,
    checkForRender
  );

  const isVisible = persistentEvents.length > 0;

  return (
    <Root placement={determinePlacement(props.allegiance)} visible={isVisible}>
      <PersistentEventIndicatorTitle
        placement={determinePlacement(props.allegiance)}
      >
        {props.allegiance} Effects
      </PersistentEventIndicatorTitle>
      {persistentEvents.map((params, i) => {
        return (
          <PersistentEventIndicator
            key={i}
            params={params}
            placement={determinePlacement(props.allegiance)}
          />
        );
      })}
    </Root>
  );
};

export default ChannelIndicators;
