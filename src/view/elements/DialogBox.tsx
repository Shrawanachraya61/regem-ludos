/* @jsx h */
import { h } from 'preact';
import { colors, style } from 'view/style';
import Button, { ButtonType } from 'view/elements/Button';
import { useInputEventStack } from 'view/hooks';
import { isConfirmKey } from 'controller/events';
import { useState } from 'lib/preact-hooks';
import { timeoutPromise } from 'utils';
import { useEffect } from 'preact/hooks';

const DialogWrapper = style('div', () => {
  return {
    opacity: '0',
    transition: 'opacity 100ms',
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
const DialogContainer = style('div', (props: { maxWidth?: string }) => {
  return {
    margin: '4px',
    padding: '4px',
    minWidth: '50%',
    maxWidth: props.maxWidth ?? '90%',
    border: `2px solid ${colors.BLUE}`,
    background: colors.BGGREY,
    color: colors.WHITE,
    transform: 'scale(0)',
    transition: 'transform 100ms',
  };
});
const DialogTitle = style('div', () => {
  return {
    margin: '8px',
    padding: '8px',
    fontSize: '32px',
    textTransform: 'uppercase',
    borderBottom: `2px solid ${colors.BLUE}`,
  };
});
const DialogContent = style('div', () => {
  return {
    margin: '8px',
    padding: '8px',
    fontSize: '16px',
  };
});
const DialogActionButtons = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '8px',
    margin: '8px',
  };
});
interface IDialogProps {
  title: string;
  onClose: () => void;
  maxWidth?: string;
  closeButtonLabel?: string;
  children?: any;
}
const DialogBox = (props: IDialogProps) => {
  const [buttonSelected, setButtonSelected] = useState(false);

  const handleClosing = () => {
    const elem = document.getElementById('dialog-container');
    if (elem) {
      elem.style.transform = 'scale(0)';
    }
    const elem2 = document.getElementById('dialog-wrapper');
    if (elem2) {
      elem2.style.opacity = '0';
    }
    timeoutPromise(100).then(() => {
      props.onClose();
    });
  };

  useInputEventStack(ev => {
    if (isConfirmKey(ev.key)) {
      setButtonSelected(true);
      timeoutPromise(100).then(() => {
        handleClosing();
      });
    }
  });

  useEffect(() => {
    const elem = document.getElementById('dialog-container');
    if (elem) {
      elem.style.transform = 'scale(1)';
    }
    const elem2 = document.getElementById('dialog-wrapper');
    if (elem2) {
      elem2.style.opacity = '1';
    }
  }, []);

  return (
    <DialogWrapper id="dialog-wrapper">
      <DialogContainer id="dialog-container" maxWidth={props.maxWidth}>
        <DialogTitle>{props.title}</DialogTitle>
        <DialogContent>{props.children}</DialogContent>
        <DialogActionButtons>
          <Button
            type={ButtonType.PRIMARY}
            style={{
              marginRight: '1rem',
            }}
            onClick={handleClosing}
            showCursor={true}
            active={buttonSelected}
          >
            {props.closeButtonLabel ?? 'Close'}
          </Button>
        </DialogActionButtons>
      </DialogContainer>
    </DialogWrapper>
  );
};

export default DialogBox;
