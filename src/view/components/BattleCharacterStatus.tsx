/* @jsx h */
import { h } from 'preact';
import { Battle } from 'model/battle';
import {
  BattleCharacter,
  battleCharacterCanAct,
  battleCharacterSetCanActCb,
  battleCharacterRemoveCanActCb,
  battleCharacterIsStaggered,
} from 'model/battle-character';
import { style, colors } from 'view/style';

import AnimDiv from 'view/elements/StaticAnimDiv';
import { ProgressBarWithRender } from 'view/elements/ProgressBar';
import { characterGetHpPct } from 'model/character';
import { useRenderLoop } from 'view/hooks';
import { hasAnimation } from 'model/animation';

const PROGRESS_HP_COLOR = colors.GREEN;
const PROGRESS_ACTION_COLOR = colors.BLUE;

interface IBattleCharacterButtonProps {
  bCh: BattleCharacter;
  battle: Battle;
}

const ButtonWrapper = style('div', (props: { highlighted?: boolean }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column',
  width: '64px',
  boxShadow: props.highlighted
    ? '0px 0px 67px 21px rgba(255, 255, 255,0.75)'
    : 'unset',
}));

const AnimWrapper = style('div', {
  background: 'black',
  border: `2px solid ${colors.GREY}`,
  position: 'relative',
});

const NameLabel = style('div', {
  position: 'absolute',
  top: '0',
  left: '1px',
});

const Bar = style(
  'div',
  (props: { omitBorder?: boolean; bottom?: boolean; top?: boolean }) => {
    return {
      border: props.omitBorder ? '' : `2px solid ${colors.WHITE}`,
      width: '100%',
      borderBottomLeftRadius: props.bottom ? '4px' : 0,
      borderBottomRightRadius: props.bottom ? '4px' : 0,
      borderTopLeftRadius: props.top ? '4px' : 0,
      borderTopRightRadius: props.top ? '4px' : 0,
    };
  }
);

const BattleCharacterStatus = (
  props: IBattleCharacterButtonProps
): h.JSX.Element => {
  const createRenderKey = (append: string) => {
    return `${props.bCh.ch.name}_${append}`;
  };
  const selectedAction = props.bCh.ch.skills[props.bCh.ch.skillIndex];
  let portraitName = 'battlePortraits_' + props.bCh.ch.spriteBase;
  if (!hasAnimation(portraitName)) {
    portraitName = 'bartolo_portrait';
  }

  console.log('RENDER BATTLE CHARACTER STATUS', props.bCh.ch.name);
  return (
    <ButtonWrapper>
      <Bar top={true}>
        <ProgressBarWithRender
          renderFunc={() => {
            return props.bCh.actionTimer.getPctComplete();
          }}
          renderKey={createRenderKey('action')}
          backgroundColor={colors.BLACK}
          color={PROGRESS_ACTION_COLOR}
          height={20}
          label={selectedAction?.name}
          // pct={props.bCh.actionTimer.getPctComplete()}
        />
      </Bar>
      <AnimWrapper>
        <AnimDiv style={{ width: '64px' }} animName={portraitName}></AnimDiv>
        <NameLabel>{props.bCh.ch.name}</NameLabel>
      </AnimWrapper>
      <Bar top={true} omitBorder>
        <ProgressBarWithRender
          renderFunc={() => {
            return battleCharacterIsStaggered(props.bCh)
              ? 1
              : props.bCh.staggerGauge.getPct();
          }}
          renderKey={createRenderKey('stagger')}
          backgroundColor={colors.BLACK}
          color={
            battleCharacterIsStaggered(props.bCh) ? colors.WHITE : colors.ORANGE
          }
          height={4}
          label=""
          // pct={props.bCh.isStaggered ? 1 : props.bCh.staggerGauge.getPct()}
        />
      </Bar>
      <Bar bottom={true}>
        <ProgressBarWithRender
          renderFunc={() => {
            return characterGetHpPct(props.bCh.ch);
          }}
          renderKey={createRenderKey('hp')}
          backgroundColor={colors.BLACK}
          color={PROGRESS_HP_COLOR}
          height={20}
          label={`HP: ${props.bCh.ch.hp}`}
          // pct={characterGetHpPct(props.bCh.ch)}
        />
      </Bar>
    </ButtonWrapper>
  );
};

export default BattleCharacterStatus;
