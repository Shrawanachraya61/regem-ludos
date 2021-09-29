import { useEffect, useReducer, useState } from 'preact/hooks';
import { addRenderable, removeRenderable } from 'model/generics';
import {
  Battle,
  BattleEvent,
  battleSubscribeEvent,
  battleUnsubscribeEvent,
} from 'model/battle';
import { BattleCharacter } from 'model/battle-character';

export const initHooks = () => {
  window.addEventListener('keydown', (ev: KeyboardEvent) => {
    const cb = inputEventStack[inputEventStack.length - 1];
    if (cb) {
      cb(ev);
    }
  });
};

export const useReRender = () => {
  const [render, setRender] = useState(false);
  return () => {
    setRender(!render);
  };
};

export const useRenderLoop = (name: string, cb?: () => void) => {
  const [, dispatch] = useReducer(oldState => {
    return !oldState;
  }, false);
  const render = () => {
    dispatch('');
  };
  useEffect(() => {
    addRenderable(name, cb || render);
    return () => {
      removeRenderable(name);
    };
  }, []);
  return render;
};

export type KeyboardEventHandler = (ev: KeyboardEvent) => void;
const inputEventStack: KeyboardEventHandler[] = [];

export const useInputEventStack = (
  cb: KeyboardEventHandler,
  captures?: any[]
) => {
  useEffect(() => {
    inputEventStack.push(cb);
    return () => {
      const ind = inputEventStack.indexOf(cb);
      if (ind > -1) {
        inputEventStack.splice(ind, 1);
      }
    };
  }, captures ?? []);
};

export const useKeyboardEventListener = (
  cb: KeyboardEventHandler,
  captures?: any[]
) => {
  useEffect(() => {
    const handleKeyDown = (ev: KeyboardEvent) => {
      cb(ev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, captures);
};

export const useCursorIndexStateWithKeypress = (
  active: boolean,
  startingIndex: number,
  items: any[],
  onItemClick: (obj: any) => void
): [number, (i: number) => void] => {
  const [{ cursorIndex, active: stateActive }, dispatch] = useReducer(
    (
      { cursorIndex, active },
      action: { type: string; payload?: number | boolean }
    ) => {
      let nextIndex = cursorIndex;
      let nextActive = active;
      if (action.type === 'Increment' && active) {
        nextIndex = (nextIndex + 1) % items.length;
      } else if (action.type === 'Decrement' && active) {
        nextIndex = (nextIndex - 1 + items.length) % items.length;
      } else if (action.type === 'Set') {
        nextIndex = (action.payload as number) ?? 0;
      } else if (action.type === 'Select' && active) {
        const item = items[cursorIndex];
        onItemClick(item);
        nextActive = false;
      } else if (action.type === 'SetActive') {
        nextActive = action.payload as boolean;
      }
      return {
        cursorIndex: nextIndex,
        active: nextActive,
      };
    },
    { cursorIndex: startingIndex ?? 0, active: active }
  );

  useEffect(() => {
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.code === 'ArrowDown') {
        dispatch({ type: 'Increment' });
      } else if (ev.code === 'ArrowUp') {
        dispatch({ type: 'Decrement' });
      } else if (ev.code === 'Enter') {
        dispatch({ type: 'Select' });
        // if (props.onItemClickSound) {
        // playSoundName(props.onItemClickSound);
        // }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (active !== stateActive) {
      dispatch({ type: 'SetActive', payload: active });
    }
  });

  return [
    cursorIndex,
    (i: number) => {
      dispatch({ type: 'Set', payload: i });
    },
  ];
};

export const useBattleSubscription = (
  battle: Battle,
  event: BattleEvent,
  cb: (arg: any) => void
) => {
  useEffect(() => {
    battleSubscribeEvent(battle, event, cb);
    return () => {
      battleUnsubscribeEvent(battle, event, cb);
    };
  }, [battle, event, cb]);
};

export const useBattleSubscriptionWithBattleCharacter = (
  battle: Battle,
  bCh: BattleCharacter,
  event: BattleEvent,
  cb: (arg: any) => void
) => {
  useEffect(() => {
    const _cb = (bChArg: BattleCharacter) => {
      if (bCh === bChArg) {
        cb(bChArg);
      }
    };
    battleSubscribeEvent(battle, event, _cb);
    return () => {
      battleUnsubscribeEvent(battle, event, _cb);
    };
  }, [battle, event, cb]);
};
