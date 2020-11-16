import { h } from 'preact';
import {
  Battle,
  BattleCharacter,
  battleCharacterCanAct,
  battleCharacterSetCanActCb,
  battleCharacterRemoveCanActCb,
} from 'model/battle';
import style from 'view/style';
import AnimDiv from 'view/components/AnimDiv';
import ProgressBar from 'view/components/ProgressBar';
import BattleActionMenu from 'view/components/BattleActionMenu';
import { characterGetHpPct } from 'model/character';

const PROGRESS_HP_COLOR = 'green';
const PROGRESS_ACTION_COLOR = 'blue';

interface IBattleCharacterButtonProps {
  bCh: BattleCharacter;
  battle: Battle;
}

const ButtonWrapper = style('div', props => ({
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
  border: '2px solid grey',
  position: 'relative',
});

const NameLabel = style('div', {
  position: 'absolute',
  top: '0',
  left: '1px',
});

const Bar = style('div', props => {
  return {
    border: '2px solid grey',
    width: '100%',
    borderBottomLeftRadius: props.bottom ? '4px' : 0,
    borderBottomRightRadius: props.bottom ? '4px' : 0,
    borderTopLeftRadius: props.top ? '4px' : 0,
    borderTopRightRadius: props.top ? '4px' : 0,
  };
});

const BattleCharacterButton = (
  props: IBattleCharacterButtonProps
): h.JSX.Element => {
  return (
    <ButtonWrapper highlighted={battleCharacterCanAct(props.battle, props.bCh)}>
      <Bar top={true}>
        <ProgressBar
          backgroundColor="black"
          color={PROGRESS_ACTION_COLOR}
          height={20}
          label="Action"
          pct={props.bCh.actionTimer.getPctComplete()}
        />
      </Bar>
      <AnimWrapper>
        <AnimDiv
          animName={'battlePortraits_' + props.bCh.ch.spriteBase}
        ></AnimDiv>
        <NameLabel>{props.bCh.ch.name}</NameLabel>
      </AnimWrapper>
      <Bar top={true}>
        <ProgressBar
          backgroundColor="black"
          color={props.bCh.isStaggered ? 'white' : 'brown'}
          height={4}
          label=""
          pct={props.bCh.isStaggered ? 1 : props.bCh.staggerGauge.getPct()}
        />
      </Bar>
      <Bar bottom={true}>
        <ProgressBar
          backgroundColor="black"
          color={PROGRESS_HP_COLOR}
          height={20}
          label={`HP: ${props.bCh.ch.hp}`}
          pct={characterGetHpPct(props.bCh.ch)}
        />
      </Bar>
      <BattleActionMenu />
    </ButtonWrapper>
  );
};

export default BattleCharacterButton;
