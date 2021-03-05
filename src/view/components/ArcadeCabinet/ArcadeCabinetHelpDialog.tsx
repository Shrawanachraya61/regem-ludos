import { h } from 'preact';
import { colors, style } from 'view/style';
import Button, { ButtonType } from 'view/elements/Button';

const HelpDialogWrapper = style('div', () => {
  return {
    background: 'rgba(0, 0, 0, 0.5)',
    position: 'fixed',
    left: '0px',
    top: '0px',
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '2',
    pointerEvents: 'all',
  };
});
const HelpDialogContainer = style('div', () => {
  return {
    margin: '4px',
    padding: '4px',
    minWidth: '50%',
    maxWidth: '90%',
    border: `2px solid ${colors.BLUE}`,
    background: colors.BGGREY,
    color: colors.WHITE,
  };
});
const HelpDialogTitle = style('div', () => {
  return {
    margin: '8px',
    padding: '8px',
    fontSize: '32px',
    textTransform: 'uppercase',
    borderBottom: `2px solid ${colors.BLACK}`,
  };
});
const HelpDialogContent = style('div', () => {
  return {
    margin: '8px',
    padding: '8px',
    fontSize: '16px',
  };
});
const HelpDialogActionButtons = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '8px',
    margin: '8px',
  };
});
interface IHelpDialogProps {
  title: string;
  setOpen: (v: boolean) => void;
  children?: any;
}
const HelpDialog = (props: IHelpDialogProps) => {
  return (
    <HelpDialogWrapper>
      <HelpDialogContainer>
        <HelpDialogTitle>{props.title}</HelpDialogTitle>
        <HelpDialogContent>{props.children}</HelpDialogContent>
        <HelpDialogActionButtons>
          <Button
            type={ButtonType.PRIMARY}
            style={{
              marginRight: '1rem',
            }}
            onClick={() => {
              props.setOpen(false);
            }}
          >
            Close
          </Button>
        </HelpDialogActionButtons>
      </HelpDialogContainer>
    </HelpDialogWrapper>
  );
};

export default HelpDialog;
