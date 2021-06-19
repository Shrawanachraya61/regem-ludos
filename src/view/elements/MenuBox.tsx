/* @jsx h */
import { h } from 'preact';
import { colors, style } from 'view/style';
import Button, { ButtonType } from 'view/elements/Button';
import { useInputEventStack } from 'view/hooks';
import { isCancelKey } from 'controller/events';
import { playSoundName } from 'model/sound';

const MenuWrapper = style('div', (props: { dark?: boolean }) => {
  return {
    transition: 'opacity 100ms',
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
    background: props.dark ? 'rgba(0, 0, 0, 0.5)' : 'unset',
  };
});
const MenuContainer = style('div', (props: { maxWidth?: string }) => {
  return {
    position: 'relative',
    margin: '4px',
    padding: '4px',
    minWidth: '25%',
    maxWidth: props.maxWidth ?? '90%',
    maxHeight: '1024px',
    border: `2px solid ${colors.BLUE}`,
    background: colors.BGGREY,
    color: colors.WHITE,
  };
});
const MenuTitle = style('div', () => {
  return {
    margin: '8px',
    padding: '8px',
    fontSize: '32px',
    textTransform: 'uppercase',
    borderBottom: `2px solid ${colors.BLUE}`,
  };
});
const MenuContent = style('div', () => {
  return {
    margin: '8px',
    padding: '8px',
    fontSize: '16px',
  };
});
const MenuActionButtons = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '8px',
    margin: '8px',
  };
});
interface IMenuProps {
  title: string;
  onClose: () => void;
  maxWidth?: string;
  closeButtonLabel?: string;
  disableKeyboardShortcut?: boolean;
  hideClose?: boolean;
  hideTitle?: boolean;
  dark?: boolean;
  children?: any;
}
const MenuBox = (props: IMenuProps) => {
  useInputEventStack(ev => {
    if (
      isCancelKey(ev.key) &&
      !props.hideClose &&
      !props.disableKeyboardShortcut
    ) {
      playSoundName('menu_choice_close');
      props.onClose();
    }
  }, []);

  return (
    <MenuWrapper id={'menu-wrapper-' + props.title} dark={props.dark}>
      <MenuContainer
        id={'menu-container-' + props.title}
        maxWidth={props.maxWidth}
      >
        {!props.hideTitle ? <MenuTitle>{props.title}</MenuTitle> : null}
        <MenuContent>{props.children}</MenuContent>
        {props.hideClose ? null : (
          <MenuActionButtons>
            <Button
              type={ButtonType.PRIMARY}
              style={{
                marginRight: '1rem',
              }}
              onClick={() => {
                playSoundName('menu_select');
                props.onClose();
              }}
            >
              {props.closeButtonLabel ?? 'Close'}
            </Button>
          </MenuActionButtons>
        )}
      </MenuContainer>
    </MenuWrapper>
  );
};

export default MenuBox;
