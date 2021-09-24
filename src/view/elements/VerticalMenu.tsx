import { h } from 'preact';
import { useEffect, useReducer, useRef } from 'preact/hooks';
import { style, colors, keyframes } from 'view/style';
import CursorIcon from 'view/icons/Cursor';
import CloseIcon from 'view/icons/Close';
import { playSoundName } from 'model/sound';
import { isAuxKey, isCancelKey, isConfirmKey } from 'controller/events';

interface IVerticalMenuProps<T> {
  items: VerticalMenuItem<T>[];
  onItemClick: (value: T, i?: number) => void;
  onItemClickSound?: string;
  onAuxClick?: (value: T) => void;
  onAuxClickSound?: string;
  onItemHover?: (value: T, i?: number) => void;
  onItemHoverSound?: string;
  open: boolean;
  isInactive?: boolean;
  isCursorSelectInactive?: boolean;
  title?: string;
  hideCloseBox?: boolean;
  onClose?: () => void;
  onCloseSound?: string;
  backgroundColor?: string;
  borderColor?: string;
  lineHeight?: MenuLineHeight;
  startingIndex?: number;
  width?: string;
  maxHeight?: string;
  height?: string;
  style?: Record<string, string>;
  hideTitle?: boolean;
  resetCursor?: boolean;
  useSpaceBarConfirm?: boolean;
}

interface VerticalMenuItem<T> {
  label:
    | number
    | string
    | h.JSX.Element
    | ((props: { cursorIndex: number; i: number }) => h.JSX.Element);
  value: T;
}

export enum MenuLineHeight {
  SMALL,
  MEDIUM,
  LARGE,
}

const defaultProps = {
  backgroundColor:
    'linear-gradient(0deg, rgba(0,0,0,1) 0%, rgba(45,45,45,1) 100%);',
  borderColor: colors.WHITE,
  lineHeight: MenuLineHeight.MEDIUM,
  startingIndex: 0,
  // width defaults to 100%
};

const getMenuLineHeightStyles = (
  lineHeight: MenuLineHeight
): Record<string, string> => {
  switch (lineHeight) {
    case MenuLineHeight.SMALL: {
      return {
        fontSize: '12px',
        padding: '0.25rem',
        minHeight: '12px',
      };
    }
    case MenuLineHeight.MEDIUM: {
      return {
        fontSize: '16px',
        padding: '0.5rem',
        minHeight: '16px',
      };
    }
    case MenuLineHeight.LARGE: {
      return {
        fontSize: '24px',
        padding: '1rem',
        minHeight: '24px',
      };
    }
  }
};

const Root = style(
  'div',
  (props: {
    backgroundColor: string;
    borderColor?: string;
    open: boolean;
    width?: string;
    height?: string;
  }) => {
    return {
      background: colors.BLACK,
      position: 'relative',
      width: props.width || '100%',
      height: props.height || 'unset',
      // height: props.open ? 'unset' : '0px',
      border: `4px double ${props.borderColor}`,
      boxSizing: 'border-box',
      transition: props.open ? 'transform 0.15s ease-out' : 'unset',
      transform: props.open ? 'scale(1.0)' : 'scale(0.0)',
    };
  }
);

const MenuItemWrapper = style(
  'div',
  (props: { borderColor: string; useHover: boolean; isInactive: boolean }) => {
    return {
      position: 'relative',
      borderBottom: `2px solid ${props.borderColor}`,
      borderLeft: props.useHover ? `2px solid ${colors.BLACK}` : 'unset',
      borderRight: props.useHover ? `2px solid ${colors.BLACK}` : 'unset',
      // '&:not(:last-child)': {},
      '&:hover': props.isInactive
        ? 'unset'
        : {
            borderColor: props.useHover ? colors.YELLOW : props.borderColor,
          },
    };
  }
);

const MenuItem = style(
  'div',
  (props: {
    lineHeight: MenuLineHeight;
    active: boolean;
    clickDisabled: boolean;
    selectDisabled: boolean;
    backgroundColor?: string;
    highlighted?: boolean;
  }) => {
    return {
      textAlign: 'center',
      ...getMenuLineHeightStyles(props.lineHeight),
      color: 'white',
      background: props.backgroundColor,
      cursor: props.clickDisabled ? 'default' : 'pointer',
      // transition: 'transform 0.1s linear',
      filter: props.active ? 'brightness(80%)' : '',
      transform: props.active ? 'translateY(2px)' : '',
      // '&:active': {
      //   filter: 'brightness(80%)',
      //   transform: 'translateY(2px)',
      // },
    };
  }
);

const cursorPulse = keyframes({
  '0%': {
    transform: 'translateX(-5px)',
  },
  '20%': {
    transform: 'translateX(0px)',
  },
  '100%': {
    transform: 'translateX(-5px)',
  },
});
const CursorRoot = style(
  'div',
  (props: { offsetX: number; offsetY: number }) => {
    return {
      pointerEvents: 'none',
      color: colors.WHITE,
      position: 'absolute',
      top: -4 + props.offsetY + 'px',
      left: -32 + props.offsetX + 'px',
      animation: `${cursorPulse} 500ms linear infinite`,
    };
  }
);
const Cursor = (props: {
  offsetX: number;
  offsetY: number;
  angle: number;
  visibility: 'hidden' | 'unset';
}): h.JSX.Element => {
  return (
    <CursorRoot
      offsetX={props.offsetX}
      offsetY={props.offsetY}
      style={{
        visibility: props.visibility,
      }}
    >
      <CursorIcon color={colors.BLUE} angle={props.angle} />
    </CursorRoot>
  );
};

const MenuTitleRoot = style('div', (props: { title?: string }) => ({
  textAlign: 'center',
  position: 'relative',
  background: colors.DARKBLUE,
  // display: 'flex',
  // justifyContent: props.title ? 'space-around' : 'center',
  alignItems: 'baseline',
  textTransform: 'uppercase',
}));
const CloseButtonIconWrapper = style(
  'div',
  (props: { lineHeight: MenuLineHeight; backgroundColor: string }) => {
    return {
      ...getMenuLineHeightStyles(props.lineHeight),
      width: '1rem',
      cursor: 'pointer',
      background: props.backgroundColor,
      borderRight: `2px solid ${colors.WHITE}`,
      marginTop: `0.15rem`,
      position: 'absolute',
      '&:hover': {
        filter: 'brightness(120%)',
      },
      '&:active': {
        filter: 'brightness(80%)',
      },
    };
  }
);
const TitleTextWrapper = style(
  'div',
  (props: { lineHeight: MenuLineHeight }) => {
    return {
      ...getMenuLineHeightStyles(props.lineHeight),
      // width: 'calc(100% - 34px)',
    };
  }
);
const MenuTitle = (props: {
  onClick?: () => void;
  hideCloseBox?: boolean;
  lineHeight?: MenuLineHeight;
  title?: string;
  backgroundColor: string;
}): h.JSX.Element => {
  const lineHeight = props.lineHeight ?? MenuLineHeight.MEDIUM;
  return (
    <MenuTitleRoot title={props.title}>
      {props.onClick && !props.hideCloseBox ? (
        <CloseButtonIconWrapper
          backgroundColor={props.backgroundColor}
          onClick={props.onClick}
          lineHeight={lineHeight}
        >
          <CloseIcon color={colors.RED} />
        </CloseButtonIconWrapper>
      ) : null}
      <TitleTextWrapper lineHeight={lineHeight}>
        {props.title || ''}
      </TitleTextWrapper>
    </MenuTitleRoot>
  );
};

const VerticalMenu = function <T>(props: IVerticalMenuProps<T>): h.JSX.Element {
  const menuRef = useRef<HTMLDivElement>();
  const DEFAULT_ITEM_HEIGHT = 37;

  const [{ cursorIndex, active }, dispatch] = useReducer(
    ({ cursorIndex, active }, action: { type: string; payload?: number }) => {
      let nextIndex = cursorIndex;
      let nextActive = active;
      if (action.type === 'Increment') {
        nextIndex = (nextIndex + 1) % props.items.length;
        if (menuRef.current && props.maxHeight) {
          const { height } = menuRef.current.getBoundingClientRect();
          menuRef.current.scrollTop = Math.max(
            0,
            -height + nextIndex * DEFAULT_ITEM_HEIGHT + 2 * DEFAULT_ITEM_HEIGHT
          );
        }
        if (isNaN(nextIndex) || nextIndex < 0) {
          nextIndex = 0;
        }
      } else if (action.type === 'Decrement') {
        nextIndex = (nextIndex - 1 + props.items.length) % props.items.length;
        if (menuRef.current && props.maxHeight) {
          const { height } = menuRef.current.getBoundingClientRect();
          menuRef.current.scrollTop = Math.max(
            0,
            -height + nextIndex * DEFAULT_ITEM_HEIGHT + 3 * DEFAULT_ITEM_HEIGHT
          );
        }
        if (isNaN(nextIndex) || nextIndex < 0) {
          nextIndex = 0;
        }
      } else if (action.type === 'Set') {
        if (!active) {
          nextIndex = action.payload ?? 0;
        }
      } else if (action.type === 'Select') {
        if (!active) {
          nextActive = true;
          setTimeout(() => {
            dispatch({ type: 'SelectInactive' });
          }, 100);
        }
      } else if (action.type === 'SelectInactive') {
        const item = props.items[cursorIndex];
        if (item) {
          props.onItemClick(item.value, cursorIndex);
          nextActive = false;
        }
      } else if (action.type === 'ResetCursor') {
        nextIndex = 0;
        nextActive = false;

        const item = props.items[nextIndex];
        if (item && props.onItemHover) {
          props.onItemHover(item.value, nextIndex);
        }

        return {
          cursorIndex: nextIndex,
          active: nextActive,
        };
      }
      if (cursorIndex !== nextIndex) {
        const item = props.items[nextIndex];
        if (item && props.onItemHover) {
          props.onItemHover(item.value, nextIndex);
          // HACK check -1 here for resetting cursor index after reusing a vertical menu
          if (props.onItemHoverSound && cursorIndex > -1) {
            playSoundName(props.onItemHoverSound);
          }
        }
      }
      return {
        cursorIndex: nextIndex,
        active: nextActive,
      };
    },
    { cursorIndex: props.startingIndex ?? 0, active: false }
  );

  useEffect(() => {
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (props.open && !props.isInactive && !props.isCursorSelectInactive) {
        if (ev.code === 'ArrowDown') {
          playSoundName('menu_move');
          dispatch({ type: 'Increment' });
        } else if (ev.code === 'ArrowUp') {
          playSoundName('menu_move');
          dispatch({ type: 'Decrement' });
        } else if (
          isConfirmKey(ev.code) ||
          (props.useSpaceBarConfirm && ev.key === ' ')
        ) {
          dispatch({ type: 'Select' });
          if (props.onItemClickSound) {
            playSoundName(props.onItemClickSound);
          }
        } else if (isCancelKey(ev.code)) {
          if (props.onClose) {
            if (props.onCloseSound) {
              playSoundName(props.onCloseSound);
            }
            props.onClose();
          }
        } else if (isAuxKey(ev.code)) {
          if (props.onAuxClick) {
            if (props.onAuxClickSound) {
              playSoundName(props.onAuxClickSound);
            }
            const item = props.items[cursorIndex];
            props.onAuxClick(item.value);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    if (cursorIndex >= props.items?.length ?? 0) {
      dispatch({ type: 'Set', payload: 0 });
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    props.open,
    props.isInactive,
    props.isCursorSelectInactive,
    props.onAuxClick,
  ]);

  useEffect(() => {
    dispatch({ type: 'ResetCursor' });
  }, [props.resetCursor]);

  const lineHeight = props.lineHeight || MenuLineHeight.MEDIUM;

  return (
    <Root
      id={'vertical-menu-' + props.title}
      backgroundColor={props.backgroundColor ?? colors.BLACK}
      borderColor={props.borderColor ?? colors.WHITE}
      width={props.width}
      height={props.height}
      open={props.open}
      style={props.style}
    >
      <MenuItemWrapper
        key="title"
        borderColor={
          props.hideTitle ? 'transparent' : props.borderColor ?? colors.WHITE
        }
        useHover={false}
        isInactive={true}
      >
        {props.hideTitle ? null : (
          <MenuTitle
            backgroundColor={props.backgroundColor || colors.BLACK}
            onClick={props.onClose}
            hideCloseBox={props.hideCloseBox}
            lineHeight={props.lineHeight}
            title={props.title}
          />
        )}
      </MenuItemWrapper>
      <div
        ref={menuRef}
        style={{
          width: '100%',
          height: props.maxHeight ?? 'unset',
          overflowY: props.maxHeight ? 'auto' : 'unset',
        }}
      >
        {props.items.map((item: VerticalMenuItem<T>, i: number) => {
          return (
            <MenuItemWrapper
              key={i}
              borderColor={props.borderColor ?? colors.WHITE}
              useHover={true}
              isInactive={Boolean(props.isInactive)}
            >
              <MenuItem
                key={i}
                backgroundColor={props.backgroundColor}
                highlighted={cursorIndex === i}
                lineHeight={lineHeight}
                active={
                  active &&
                  cursorIndex === i &&
                  !props.isInactive &&
                  !props.isCursorSelectInactive
                }
                clickDisabled={Boolean(props.isInactive)}
                selectDisabled={Boolean(
                  props.isInactive || props.isCursorSelectInactive
                )}
                onClick={() => {
                  if (!props.isInactive) {
                    dispatch({ type: 'Set', payload: i });
                    if (props.onItemClickSound) {
                      playSoundName(props.onItemClickSound);
                    }
                    setTimeout(() => {
                      dispatch({ type: 'Select' });
                    });
                  }
                }}
                onMouseOver={ev => {
                  ev.preventDefault();
                  if (!props.isInactive && !props.isCursorSelectInactive) {
                    dispatch({ type: 'Set', payload: i });
                  }
                }}
              >
                {typeof item.label === 'function'
                  ? item.label({ cursorIndex, i })
                  : item.label}
              </MenuItem>
              {cursorIndex === i ? (
                <Cursor
                  offsetX={props.maxHeight ? 40 : 0}
                  offsetY={props.maxHeight ? 4 : 0}
                  angle={props.maxHeight ? 62 : 75}
                  visibility={
                    props.isInactive || props.isCursorSelectInactive
                      ? 'hidden'
                      : 'unset'
                  }
                />
              ) : null}
            </MenuItemWrapper>
          );
        })}
      </div>
    </Root>
  );
};

VerticalMenu.defaultProps = defaultProps;
export default VerticalMenu;
