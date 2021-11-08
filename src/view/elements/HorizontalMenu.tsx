import { h, Fragment } from 'preact';
import { useEffect, useReducer, useRef } from 'preact/hooks';
import { style, colors, keyframes } from 'view/style';
import Cursor from 'view/elements/Cursor';
import { playSoundName } from 'model/sound';
import {
  isAuxKey,
  isCancelKey,
  isConfirmKey,
  isLeftKey,
  isRightKey,
} from 'controller/events';
import { useKeyboardEventListener } from 'view/hooks';
import ArrowIcon from 'view/icons/Arrow';

interface IHorizontalMenuProps<T> {
  title: string;
  items: HorizontalMenuItem<T>[];
  isInactive: boolean;
  startingCursorIndex?: number;
  flexAlign?: string;
  onItemClick?: (value: T, i?: number) => void;
  onItemClickSound?: string;
  onAuxClick?: (value: T) => void;
  onAuxClickSound?: string;
  onItemHover?: (value: T, i?: number) => void;
  onItemHoverSound?: string;
  onClose?: () => void;
  onCloseSound?: string;
  style?: Record<string, string>;
  disableMouseHover?: boolean;
  useArrowIndicator?: boolean;
  itemBackgroundColor?: string;
  disableConfirmButtonClick?: boolean;
}

interface HorizontalMenuItem<T> {
  label:
    | number
    | string
    | h.JSX.Element
    | ((props: { cursorIndex: number; i: number }) => h.JSX.Element);
  value: T;
}

const Root = style('div', () => {
  return {
    border: '1px solid ' + colors.WHITE,
  };
});

const InnerRoot = style('div', (props: { flexAlign?: string }) => {
  return {
    border: '1px solid ' + colors.WHITE,
    margin: '2px',
    display: 'flex',
    justifyItems: props.flexAlign ?? 'flex-start',
  };
});

const ItemContainer = style('div', (props: { isInactive: boolean }) => {
  return {
    position: 'relative',
    cursor: 'pointer',
    border: '1px solid ' + colors.WHITE,
    margin: '2px',
    '&:hover': {
      borderColor: colors.YELLOW,
    },
    // cursor: props.isInactive ? 'default' : 'pointer',
    // pointerEvents: props.isInactive ?
  };
});

const arrowPulse = keyframes({
  '0%': {
    opacity: '1',
  },
  '50%': {
    opacity: '0',
  },
  '100%': {
    opacity: '1',
  },
});

const ArrowIndicator = style('div', (props: { left?: boolean }) => {
  return {
    position: 'absolute',
    top: '0px',
    left: props.left ? '0px' : 'unset',
    right: props.left ? 'unset' : '0px',
    width: '16px',
    transform: props.left ? 'rotate(180deg)' : 'unset',
    marginTop: '24px',
    animation: `${arrowPulse} 750ms linear infinite`,
  };
});
interface ReducerState {
  cursorIndex: number;
  isSelecting: boolean;
}

interface ReducerAction {
  type:
    | 'CursorNext'
    | 'CursorPrev'
    | 'Confirm'
    | 'Cancel'
    | 'SetCursor'
    | 'SetSelecting';
  payload?: number | boolean;
}

function HorizontalMenu<T>(props: IHorizontalMenuProps<T>) {
  const [{ cursorIndex, isSelecting }, dispatch] = useReducer<
    ReducerState,
    ReducerAction
  >(
    (oldState, action: ReducerAction) => {
      const newState = { ...oldState };
      switch (action.type) {
        case 'CursorNext': {
          if (props.onItemHoverSound) {
            playSoundName(props.onItemHoverSound);
          }
          newState.cursorIndex =
            (newState.cursorIndex + 1) % props.items.length;

          if (props.onItemHover) {
            const item = props.items[newState.cursorIndex];
            props.onItemHover(item.value, newState.cursorIndex);
          }
          break;
        }
        case 'CursorPrev': {
          if (props.onItemHoverSound) {
            playSoundName(props.onItemHoverSound);
          }
          newState.cursorIndex =
            (newState.cursorIndex + 1 + props.items.length) %
            props.items.length;

          if (props.onItemHover) {
            const item = props.items[newState.cursorIndex];
            props.onItemHover(item.value, newState.cursorIndex);
          }
          break;
        }
        case 'SetCursor': {
          newState.cursorIndex = (action.payload as number) ?? 0;
          break;
        }
        case 'Confirm': {
          const item = props.items[newState.cursorIndex];
          dispatch({ type: 'SetSelecting', payload: true });
          if (props.onItemClickSound) {
            playSoundName(props.onItemClickSound);
          }
          setTimeout(() => {
            dispatch({ type: 'SetSelecting', payload: false });
            if (props.onItemClick) {
              props.onItemClick(item.value, newState.cursorIndex);
            }
          }, 100);
          break;
        }
        case 'Cancel': {
          if (props.onCloseSound) {
            playSoundName(props.onCloseSound);
          }

          if (props.onClose) {
            props.onClose();
          }
          break;
        }
      }
      return newState;
    },
    {
      cursorIndex: props.startingCursorIndex ?? 0,
      isSelecting: false,
    }
  );

  useKeyboardEventListener(
    ev => {
      if (props.isInactive || isSelecting) {
        return;
      }

      if (isConfirmKey(ev.key)) {
        if (props.disableConfirmButtonClick) {
          return;
        }
        dispatch({
          type: 'Confirm',
        });
      } else if (isCancelKey(ev.key)) {
        dispatch({
          type: 'Cancel',
        });
      } else if (isLeftKey(ev.code)) {
        dispatch({
          type: 'CursorPrev',
        });
      } else if (isRightKey(ev.code)) {
        dispatch({
          type: 'CursorNext',
        });
      }
    },
    [props.isInactive, isSelecting, props.disableConfirmButtonClick]
  );

  return (
    <Root id={'horizontal-menu-' + props.title} style={props.style}>
      <InnerRoot flexAlign={props.flexAlign}>
        {props.items.map((item, i) => {
          return (
            <ItemContainer
              style={{
                background: props.itemBackgroundColor,
              }}
              id={
                (typeof item.value === 'object'
                  ? (item.value as any).name
                  : item) + String(i)
              }
              key={
                (typeof item.value === 'object'
                  ? (item.value as any).name
                  : item) + String(i)
              }
              isInactive={props.isInactive}
              onClick={() => {
                if (props.isInactive || isSelecting) {
                  return;
                }
                dispatch({
                  type: 'SetCursor',
                  payload: i,
                });
                setTimeout(() => {
                  dispatch({
                    type: 'Confirm',
                  });
                }, 1);
              }}
              onMouseOver={() => {
                if (
                  props.isInactive ||
                  isSelecting ||
                  props.disableMouseHover
                ) {
                  return;
                }
                dispatch({
                  type: 'SetCursor',
                  payload: i,
                });
              }}
            >
              {typeof item.label === 'function'
                ? item.label({ cursorIndex, i })
                : item.label}
              {cursorIndex === i ? (
                props.useArrowIndicator ? (
                  <>
                    <ArrowIndicator left>
                      <ArrowIcon color={colors.WHITE} />
                    </ArrowIndicator>
                    <ArrowIndicator>
                      <ArrowIcon color={colors.WHITE} />
                    </ArrowIndicator>
                  </>
                ) : (
                  <Cursor
                    offsetX={0}
                    offsetY={0}
                    angle={75}
                    visibility={props.isInactive ? 'hidden' : 'unset'}
                  />
                )
              ) : null}
            </ItemContainer>
          );
        })}
      </InnerRoot>
    </Root>
  );
}

export default HorizontalMenu;
