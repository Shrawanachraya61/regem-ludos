/* @jsx h */
import { h, Fragment } from 'preact';
import { colors, style } from 'view/style';
import Button, { ButtonType } from 'view/elements/Button';
import { useInputEventStack, useKeyboardEventListener } from 'view/hooks';
import { isCancelKey, isConfirmKey } from 'controller/events';
import { useEffect, useState } from 'preact/hooks';
import { playSoundName } from 'model/sound';

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
const DialogContainer = style(
  'div',
  (props: { maxWidth?: string; danger?: boolean }) => {
    return {
      margin: '4px',
      padding: '4px',
      minWidth: '50%',
      maxWidth: props.maxWidth ?? '90%',
      border: `2px solid ${props.danger ? colors.RED : colors.BLUE}`,
      background: colors.BGGREY,
      color: colors.WHITE,
      transform: 'scale(0)',
      transition: 'transform 100ms',
    };
  }
);
const DialogTitle = style('div', (props: { danger?: boolean }) => {
  return {
    margin: '8px',
    padding: '8px',
    fontSize: '32px',
    textTransform: 'uppercase',
    borderBottom: `2px solid ${props.danger ? colors.RED : colors.BLUE}`,
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
  onConfirm?: () => void;
  confirmButtonLabel?: string;
  maxWidth?: string;
  closeButtonLabel?: string;
  danger?: boolean;
  children?: any;
}
const DialogBox = (props: IDialogProps) => {
  const [isClosing, setIsClosing] = useState(false);
  const [buttonSelected, setButtonSelected] = useState(-1);
  const [buttonCursorPosition, setButtonCursorPosition] = useState(0);
  const [confirmActive, setConfirmActive] = useState(false);
  const [cancelActive, setCancelActive] = useState(false);

  const isConfirmWindow = !!props.onConfirm;

  const handleClosing = (cb: () => void) => {
    if (isClosing || confirmActive || cancelActive) {
      return;
    }

    setIsClosing(true);
    const elem = document.getElementById('dialog-container');
    if (elem) {
      elem.style.transform = 'scale(0)';
    }
    const elem2 = document.getElementById('dialog-wrapper');
    if (elem2) {
      elem2.style.opacity = '0';
    }
    setTimeout(() => {
      console.log('on close in dialog box');
      cb();
    }, 100);
  };

  useKeyboardEventListener(
    ev => {
      if (isClosing || confirmActive || cancelActive) {
        return;
      }

      if (isConfirmWindow) {
        if (isCancelKey(ev.key)) {
          setButtonSelected(1);
          playSoundName('menu_select');
          setCancelActive(true);
          setTimeout(() => {
            handleClosing(() => {
              props.onClose();
            });
          }, 100);
        }
        if (isConfirmKey(ev.key)) {
          setButtonSelected(buttonCursorPosition);
          if (buttonCursorPosition === 0) {
            playSoundName('menu_select');
            setConfirmActive(true);
            setTimeout(() => {
              handleClosing(() => {
                if (props.onConfirm) {
                  props.onConfirm();
                }
              });
            }, 100);
          } else {
            playSoundName('menu_select');
            setCancelActive(true);
            setTimeout(() => {
              handleClosing(() => {
                props.onClose();
              });
            }, 100);
          }
        }

        if (ev.key === 'ArrowLeft') {
          playSoundName('menu_move');
          setButtonCursorPosition(0);
        } else if (ev.key === 'ArrowRight') {
          playSoundName('menu_move');
          setButtonCursorPosition(1);
        }
      } else {
        if (isCancelKey(ev.key)) {
          setButtonSelected(0);
          playSoundName('menu_choice_close');
          handleClosing(() => {
            props.onClose();
          });
        }
        if (isConfirmKey(ev.key)) {
          setButtonSelected(0);
          playSoundName('menu_select');
          handleClosing(() => {
            props.onClose();
          });
        }
      }
    },
    [buttonCursorPosition]
  );

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
      <DialogContainer
        id="dialog-container"
        maxWidth={props.maxWidth}
        danger={props.danger}
      >
        <DialogTitle danger={props.danger}>{props.title}</DialogTitle>
        <DialogContent>{props.children}</DialogContent>
        <DialogActionButtons>
          {isConfirmWindow ? (
            <>
              <Button
                type={ButtonType.PRIMARY}
                style={{
                  marginRight: '1rem',
                  filter: confirmActive ? 'brightness(80%)' : '',
                  transform: confirmActive ? 'translateY(2px)' : '',
                }}
                onClick={ev => {
                  ev.stopPropagation();
                  ev.preventDefault();
                  handleClosing(() => {
                    if (props.onConfirm) {
                      props.onConfirm();
                    }
                  });
                }}
                showCursor={buttonCursorPosition === 0}
                active={buttonSelected === 0}
              >
                {props.confirmButtonLabel ?? 'OK'}
              </Button>
              <Button
                type={ButtonType.CANCEL}
                style={{
                  marginRight: '1rem',
                  filter: cancelActive ? 'brightness(80%)' : '',
                  transform: cancelActive ? 'translateY(2px)' : '',
                }}
                onClick={ev => {
                  ev.stopPropagation();
                  ev.preventDefault();
                  playSoundName('menu_select');
                  handleClosing(() => {
                    props.onClose();
                  });
                }}
                showCursor={buttonCursorPosition === 1}
                active={buttonSelected === 1}
              >
                {props.closeButtonLabel ?? 'Cancel'}
              </Button>
            </>
          ) : (
            <Button
              type={ButtonType.PRIMARY}
              style={{
                marginRight: '1rem',
                filter: confirmActive ? 'brightness(80%)' : '',
                transform: confirmActive ? 'translateY(2px)' : '',
              }}
              onClick={() => {
                console.log('handle button click in dialog');
                handleClosing(() => {
                  console.log('handle button click in dialog handle closing');
                  props.onClose();
                });
              }}
              showCursor={true}
              active={buttonSelected === 0}
            >
              {props.closeButtonLabel ?? 'Close'}
            </Button>
          )}
        </DialogActionButtons>
      </DialogContainer>
    </DialogWrapper>
  );
};

export default DialogBox;
