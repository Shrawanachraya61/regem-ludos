/* @jsx h */
import { h } from 'preact';
import { getCurrentBattle, getIsPaused } from 'model/generics';
import { style, colors, keyframes } from 'view/style';
import { pause, unpause } from 'controller/loop';

import CharacterInfoCard from './CharacterInfoCard';
import { getUiInterface } from 'view/ui';
import { BattleAction } from 'controller/battle-actions';
import PillButton, { ButtonType } from 'view/elements/PillButton';
import { BattleCharacter } from 'model/battle-character';

import CursorIcon from 'view/icons/Cursor';

interface IActionSelectMenuProps {
  id?: string;
  cursorIndex: number;
  setCursorIndex: (i: number) => void;
  onActionClicked: (i: number) => void;
  disabled: boolean;
  bCh: BattleCharacter;
}

const Root = style('div', () => {
  return {
    width: '100%',
    height: '100%',
  };
});

const ButtonRow = style('div', () => {
  return {
    position: 'relative',
    margin: '10px 6px',
  };
});

const cursorPulse = keyframes({
  '0%': {
    transform: 'translateX(-10px)',
  },
  '20%': {
    transform: 'translateX(-3px)',
  },
  '100%': {
    transform: 'translateX(-10px)',
  },
});
const CursorRoot = style('div', () => {
  return {
    color: colors.WHITE,
    position: 'absolute',
    top: '-8px',
    left: '-32px',
    animation: `${cursorPulse} 750ms linear infinite`,
  };
});

const Cursor = (): h.JSX.Element => {
  return (
    <CursorRoot>
      <CursorIcon color={colors.BLUE} />
    </CursorRoot>
  );
};

const ActionSelectMenu = (props: IActionSelectMenuProps) => {
  const handleButtonClick = (i: number) => () => {
    if (!props.disabled) {
      props.onActionClicked(i);
    }
  };

  const handleButtonHover = (i: number) => () => {
    if (!props.disabled) {
      props.setCursorIndex(i);
    }
  };

  return (
    <Root id={'action-select-menu-' + props.bCh.ch.name}>
      {props.bCh.ch.skills.map((action, i) => {
        const isActive = props.bCh.ch.skillIndex === i;
        const isSelected = props.cursorIndex === i;
        return (
          <ButtonRow id={'action-select-menu-button-row-' + i}>
            {isSelected ? <Cursor /> : null}
            <PillButton
              type={isActive ? ButtonType.PRIMARY : ButtonType.NEUTRAL}
              selected={isSelected}
              onClick={handleButtonClick(i)}
              onMouseOver={handleButtonHover(i)}
              disabled={props.disabled}
            >
              {action.name}
            </PillButton>
          </ButtonRow>
        );
      })}
    </Root>
  );
};

export default ActionSelectMenu;
