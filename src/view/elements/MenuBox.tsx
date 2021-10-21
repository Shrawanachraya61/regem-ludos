/* @jsx h */
import { h } from 'preact';
import { colors, style } from 'view/style';
import Button, { ButtonType } from 'view/elements/Button';
import { useInputEventStack, useKeyboardEventListener } from 'view/hooks';
import { isCancelKey } from 'controller/events';
import { playSoundName } from 'model/sound';
import { useEffect, useState } from 'preact/hooks';
import { getUiInterface } from 'view/ui';
import { AppSection } from 'model/store';

const MenuWrapper = style('div', (props: { dark?: boolean }) => {
  return {
    position: 'fixed',
    left: '0px',
    top: '0px',
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '2',
    pointerEvents: 'none',
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
    width: props.maxWidth,
    border: `2px solid ${colors.BLUE}`,
    background: colors.BGGREY,
    color: colors.WHITE,
    transform: 'scale(0)',
    transition: 'opacity 100ms, transform 100ms',
    pointerEvents: 'all',
  };
});
const MenuBackground = style('div', () => {
  return {
    position: 'absolute',
    left: '0',
    top: '0',
    width: '100%',
    height: '100%',
    opacity: '0.04',
    backgroundImage: 'url(res/bg/flowers_menu_bg.png)',
    zIndex: 0,
    pointerEvents: 'none',
  };
});
const MenuTitle = style('div', () => {
  return {
    margin: '8px',
    padding: '8px',
    fontSize: '32px',
    textTransform: 'uppercase',
    borderBottom: `2px solid ${colors.BLUE}`,
    zIndex: 2,
  };
});
const MenuContent = style('div', () => {
  return {
    margin: '8px',
    padding: '8px',
    fontSize: '16px',
    display: 'flex',
    justifyContent: 'center',
    zIndex: 2,
  };
});
const MenuActionButtons = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '8px',
    margin: '8px',
    zIndex: 2,
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
  isModal?: boolean;
  disableCloseSound?: boolean;
}
const MenuBox = (props: IMenuProps) => {
  const [closeButtonActive, setCloseButtonActive] = useState(false);
  useKeyboardEventListener(ev => {
    if (
      isCancelKey(ev.key) &&
      !props.hideClose &&
      !props.disableKeyboardShortcut
    ) {
      if (
        !props.isModal &&
        getUiInterface().appState.sections.includes(AppSection.Modal)
      ) {
        return;
      }

      setCloseButtonActive(true);
      setTimeout(() => {
        if (!props.disableCloseSound) {
          playSoundName('menu_choice_close');
        }
        setCloseButtonActive(false);
        props.onClose();
      }, 100);
    }
  }, []);

  const rootId = 'menu-wrapper-' + props.title;
  const containerId = 'menu-container-' + props.title;

  useEffect(() => {
    const elem = document.getElementById(containerId);
    if (elem) {
      elem.style.transform = 'scale(1)';
    }
  });

  return (
    <MenuWrapper id={rootId} dark={props.dark}>
      <MenuContainer id={containerId} maxWidth={props.maxWidth}>
        <MenuBackground />
        {!props.hideTitle ? <MenuTitle>{props.title}</MenuTitle> : null}
        <MenuContent>{props.children}</MenuContent>
        {props.hideClose ? null : (
          <MenuActionButtons>
            <Button
              type={ButtonType.PRIMARY}
              style={{
                marginRight: '1rem',
              }}
              active={closeButtonActive}
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
