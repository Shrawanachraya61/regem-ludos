import { h } from 'preact';
import { useState, useEffect, useReducer } from 'preact/hooks';
import { style, colors, keyframes } from 'view/style';
import CursorIcon from 'view/icons/Cursor';
import CloseIcon from 'view/icons/Close';
import { playSoundName } from 'model/sound';

interface IVerticalMenuProps<T> {
  items: VerticalMenuItem<T>[];
  onItemClick: (value: T) => void;
  onItemClickSound?: string;
  open: boolean;
  isInactive?: boolean;
  title?: string;
  onClose?: () => void;
  backgroundColor?: string;
  borderColor?: string;
  lineHeight?: MenuLineHeight;
  startingIndex?: number;
  width?: string;
  style?: Record<string, string>;
}

interface VerticalMenuItem<T> {
  label: number | string | h.JSX.Element;
  value: T;
}

export enum MenuLineHeight {
  SMALL,
  MEDIUM,
  LARGE,
}

const defaultProps = {
  backgroundColor: colors.BLACK,
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
  }) => {
    return {
      background: props.backgroundColor,
      position: 'relative',
      width: props.width || '100%',
      // height: props.open ? 'unset' : '0px',
      border: `4px double ${props.borderColor}`,
      boxSizing: 'border-box',
      transition: props.open ? 'transform 0.15s ease-out' : 'unset',
      transform: props.open ? 'scale(1.0)' : 'scale(0.0)',
    };
  }
);

const MenuItemWrapper = style('div', (props: { borderColor?: string }) => {
  return {
    position: 'relative',
    '&:not(:last-child)': {
      borderBottom: `2px solid ${props.borderColor}`,
    },
  };
});

const MenuItem = style(
  'div',
  (props: {
    lineHeight: MenuLineHeight;
    backgroundColor?: string;
    active: boolean;
    highlighted?: boolean;
  }) => {
    return {
      textAlign: 'center',
      ...getMenuLineHeightStyles(props.lineHeight),
      color: 'white',
      backgroundColor: props.backgroundColor,
      cursor: 'pointer',
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
const CursorRoot = style('div', () => {
  return {
    color: colors.WHITE,
    position: 'absolute',
    top: '0px',
    left: '-32px',
    animation: `${cursorPulse} 500ms linear infinite`,
  };
});
const Cursor = (): h.JSX.Element => {
  return (
    <CursorRoot>
      <CursorIcon color={colors.BLUE} />
    </CursorRoot>
  );
};

const MenuTitleRoot = style('div', (props: { title?: string }) => ({
  textAlign: 'center',
  position: 'relative',
  background: colors.DARKBLUE,
  display: 'flex',
  justifyContent: props.title ? 'space-around' : 'center',
  alignItems: 'baseline',
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
      width: 'calc(100% - 34px)',
    };
  }
);
const MenuTitle = (props: {
  onClick?: () => void;
  lineHeight?: MenuLineHeight;
  title?: string;
  backgroundColor: string;
}): h.JSX.Element => {
  const lineHeight = props.lineHeight ?? MenuLineHeight.MEDIUM;
  return (
    <MenuTitleRoot title={props.title}>
      {props.onClick ? (
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
  const [{ cursorIndex, active }, dispatch] = useReducer(
    ({ cursorIndex, active }, action: { type: string; payload?: number }) => {
      let nextIndex = cursorIndex;
      let nextActive = active;
      if (action.type === 'Increment') {
        nextIndex = (nextIndex + 1) % props.items.length;
      } else if (action.type === 'Decrement') {
        nextIndex = (nextIndex - 1 + props.items.length) % props.items.length;
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
        props.onItemClick(item.value);
        nextActive = false;
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
      if (props.open && !props.isInactive) {
        let nextIndex = cursorIndex;
        if (ev.code === 'ArrowDown') {
          dispatch({ type: 'Increment' });
        } else if (ev.code === 'ArrowUp') {
          dispatch({ type: 'Decrement' });
          nextIndex = (nextIndex - 1 + props.items.length) % props.items.length;
        } else if (ev.code === 'Enter') {
          dispatch({ type: 'Select' });
          if (props.onItemClickSound) {
            playSoundName(props.onItemClickSound);
          }
        } else if (ev.code === 'Escape') {
          if (props.onClose) {
            props.onClose();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [props.open, props.isInactive]);

  const lineHeight = props.lineHeight || MenuLineHeight.MEDIUM;

  return (
    <Root
      backgroundColor={props.backgroundColor ?? colors.BLACK}
      borderColor={props.borderColor ?? colors.WHITE}
      width={props.width}
      open={props.open}
      style={props.style}
    >
      <MenuItemWrapper key="title" borderColor={props.borderColor}>
        <MenuTitle
          backgroundColor={props.backgroundColor || colors.BLACK}
          onClick={props.onClose}
          lineHeight={props.lineHeight}
          title={props.title}
        />
      </MenuItemWrapper>
      {props.items.map((item: VerticalMenuItem<T>, i: number) => {
        return (
          <MenuItemWrapper key={i} borderColor={props.borderColor}>
            <MenuItem
              key={i}
              backgroundColor={props.backgroundColor}
              highlighted={cursorIndex === i}
              lineHeight={lineHeight}
              active={active && cursorIndex === i}
              onClick={() => {
                dispatch({ type: 'Set', payload: i });
                if (props.onItemClickSound) {
                  playSoundName(props.onItemClickSound);
                }
                setTimeout(() => {
                  dispatch({ type: 'Select' });
                });
              }}
              onMouseOver={() => {
                dispatch({ type: 'Set', payload: i });
              }}
            >
              {item.label}
            </MenuItem>
            {cursorIndex === i ? <Cursor /> : null}
          </MenuItemWrapper>
        );
      })}
    </Root>
  );
};

VerticalMenu.defaultProps = defaultProps;
export default VerticalMenu;
