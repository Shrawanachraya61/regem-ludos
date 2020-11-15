import { h } from 'preact';
import { useState } from 'preact/hooks';
import { BattleCharacter } from 'model/battle';
import style from 'view/style';

const Button = style('div', props => ({
  textAlign: 'center',
  width: '100%',
  margin: '2px',
  padding: '8px 0px',
  borderRadius: '4px',
  background: 'gray',
  cursor: props.open ? 'default' : 'pointer',
  '&:hover': {
    filter: props.open ? '' : 'brightness(120%)',
  },
}));

const BattleActionMenu = (): h.JSX.Element => {
  const [open, setOpen] = useState(false);
  if (open) {
    return <div></div>;
  } else {
    return <Button open={open}>Menu</Button>;
  }
};

export default BattleActionMenu;
