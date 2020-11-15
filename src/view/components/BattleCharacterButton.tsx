import { h } from 'preact';
import { BattleCharacter } from 'model/battle';
import AnimDiv from 'view/components/AnimDiv';
import style from 'view/style';
import ProgressBar from './ProgressBar';

const PROGRESS_HP_COLOR = 'green';
const PROGRESS_ACTION_COLOR = 'blue';

interface IBattleCharacterButtonProps {
  bCh: BattleCharacter;
}

const ButtonWrapper = style('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column',
  width: '64px',
  height: 'calc(16px + 64px + 16px + 16px)',
});

const Bar = style('div', {
  border: '2px solid grey',
  width: '100%',
});

const BattleActionMenu = style('div', {
  background: 'blue',
  width: '32px',
  height: '16px',
});

const BattleCharacterButton = (
  props: IBattleCharacterButtonProps
): h.JSX.Element => {
  return (
    <ButtonWrapper>
      <Bar>
        <ProgressBar
          backgroundColor="black"
          color={PROGRESS_ACTION_COLOR}
          height={16 - 4}
          label="Action"
          pct={props.bCh.actionTimer.getPctComplete()}
        />
      </Bar>
      <AnimDiv
        animName={'battlePortraits_' + props.bCh.ch.spriteBase}
      ></AnimDiv>
      <Bar>
        <ProgressBar
          backgroundColor="black"
          color={PROGRESS_HP_COLOR}
          height={16 - 4}
          label="HP"
          pct={props.bCh.ch.hp / props.bCh.ch.stats.HP}
        />
      </Bar>
      <BattleActionMenu>MENU</BattleActionMenu>
    </ButtonWrapper>
  );
};

export default BattleCharacterButton;
