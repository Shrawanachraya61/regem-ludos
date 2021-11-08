/* @jsx h */
import { h } from 'preact';
import { Character } from 'model/character';
import { style } from 'view/style';
import { CharacterFollower } from './CharacterFollower';
import Cursor from 'view/elements/Cursor';
import { useReducer } from 'preact/hooks';
import { playSoundName } from 'model/sound';
import { useKeyboardEventListener } from 'view/hooks';
import {
  isCancelKey,
  isConfirmKey,
  isDownKey,
  isLeftKey,
  isRightKey,
  isUpKey,
} from 'controller/events';

const Root = style('div', () => {
  return {
    position: 'absolute',
    left: '0px',
    top: '0px',
    width: '100%',
    height: '100%',
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

interface ICharacterFollowerMenuProps {
  characters: Character[];
  body?: any;
  startingCursorIndex?: number;
  onCharacterClick: (ch: Character, i: number) => void;
  onClose?: () => void;
  isInactive?: boolean;
  isAll?: boolean;
}

const CharacterFollowerMenu = (props: ICharacterFollowerMenuProps) => {
  const [{ cursorIndex, isSelecting }, dispatch] = useReducer<
    ReducerState,
    ReducerAction
  >(
    (oldState, action: ReducerAction) => {
      const newState = { ...oldState };
      switch (action.type) {
        case 'CursorNext': {
          playSoundName('menu_move');
          newState.cursorIndex =
            (newState.cursorIndex + 1) % props.characters.length;
          break;
        }
        case 'CursorPrev': {
          playSoundName('menu_move');
          newState.cursorIndex =
            (newState.cursorIndex + 1 + props.characters.length) %
            props.characters.length;
          break;
        }
        case 'SetCursor': {
          newState.cursorIndex = (action.payload as number) ?? 0;
          break;
        }
        case 'Confirm': {
          const ch = props.characters[newState.cursorIndex];
          dispatch({ type: 'SetSelecting', payload: true });
          playSoundName('menu_select');
          setTimeout(() => {
            dispatch({ type: 'SetSelecting', payload: false });
            props.onCharacterClick(ch, newState.cursorIndex);
          }, 100);
          break;
        }
        case 'Cancel': {
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
        dispatch({
          type: 'Confirm',
        });
      } else if (isCancelKey(ev.key)) {
        dispatch({
          type: 'Cancel',
        });
      } else if (isLeftKey(ev.code) || isUpKey(ev.code)) {
        dispatch({
          type: 'CursorPrev',
        });
      } else if (isRightKey(ev.code) || isDownKey(ev.code)) {
        dispatch({
          type: 'CursorNext',
        });
      }
    },
    [props.isInactive, isSelecting]
  );

  return (
    <Root>
      <div
        style={{
          position: 'absolute',
          left: '12px', // idk why this is offset and looks wrong with it at 0px
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          bottom: '311px',
          fontSize: '24px',
        }}
      >
        {props.body}
      </div>
      {props.characters.map((ch, i) => {
        return (
          <CharacterFollower
            ch={ch}
            renderKey={'menu-follower-' + ch.name}
            key={'menu-follower-' + ch.name}
            onMouseOver={() => {
              dispatch({
                type: 'SetCursor',
                payload: i,
              });
            }}
            onClick={() => {
              dispatch({
                type: 'SetCursor',
                payload: i,
              });
              dispatch({
                type: 'Confirm',
              });
            }}
            style={{
              border: '1px dashed rgba(255, 255, 255, 0.5)',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <Cursor
              visibility={cursorIndex === i || props.isAll ? 'unset' : 'hidden'}
            />
          </CharacterFollower>
        );
      })}
    </Root>
  );
};

export default CharacterFollowerMenu;
