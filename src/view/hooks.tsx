import { h } from 'preact';
import { useEffect, useReducer, useState } from 'preact/hooks';
import { addRenderable, removeRenderable } from 'model/generics';
import {
  Battle,
  BattleEvent,
  battleSubscribeEvent,
  battleUnsubscribeEvent,
} from 'model/battle';
import { BattleCharacter } from 'model/battle-character';
import { getUiInterface } from './ui';
import { ModalSection } from 'model/store';
import { hideModal, showModal } from 'controller/ui-actions';
import { popKeyHandler, pushEmptyKeyHandler } from 'controller/events';
import { colors } from './style';
import { Point } from 'utils';

let hooksInitialized = false;

export const initHooks = () => {
  if (hooksInitialized) {
    console.log('Hooks have already been initialized.');
    return;
  }
  hooksInitialized = true;

  let debounceResizeId: any;
  window.addEventListener('resize', () => {
    if (debounceResizeId !== false) {
      clearTimeout(debounceResizeId);
    }
    debounceResizeId = setTimeout(() => {
      getUiInterface().render();
      debounceResizeId = false;
    }, 50);
  });

  window.addEventListener('keydown', (ev: KeyboardEvent) => {
    const cb = inputEventStack[inputEventStack.length - 1];
    if (cb && !ev.repeat) {
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
      if (!ev.repeat) {
        cb(ev);
      }
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

export interface IUseConfirmModalArgs {
  onClose?: () => void;
  onConfirm?: () => void;
  body?: string;
  danger?: boolean;
}

export const useConfirmModal = (
  args: IUseConfirmModalArgs
): [boolean, () => void, () => void] => {
  const [confirmVisible, setConfirmVisible] = useState(false);

  const showConfirmModal = () => {
    const emptyStackCb = pushEmptyKeyHandler();
    setConfirmVisible(true);
    showModal(ModalSection.CONFIRM, {
      onClose: () => {
        popKeyHandler(emptyStackCb);
        setConfirmVisible(false);
        if (args.onClose) {
          args.onClose();
        }
      },
      onConfirm: () => {
        popKeyHandler(emptyStackCb);
        if (args.onConfirm) {
          args.onConfirm();
        }
      },
      body: args.body,
      danger: args.danger,
    });
  };

  return [confirmVisible, showConfirmModal, hideModal];
};

export const useSVGLine = (props: {
  svgId: string;
  div1Id: string;
  div2Id: string;
  offset1: Point;
  offset2: Point;
  color?: string;
}) => {
  const svgId = props.svgId;
  const div1Id = props.div1Id;
  const div2Id = props.div2Id;

  useEffect(() => {
    // It takes 100ms for the dialog box transition to finish
    setTimeout(() => {
      const line = document.getElementById(svgId);
      const div1 = document.getElementById(div1Id);
      const div2 = document.getElementById(div2Id);

      console.log('IDS FOR SVG LINE', svgId, div1Id, div2Id, line, div1, div2);
      const rect1 = div1?.getBoundingClientRect();
      const rect2 = div2?.getBoundingClientRect();

      if (line && rect1 && rect2) {
        const x1 = rect1.left + rect1.width / 2 + props.offset1[0];
        const y1 = rect1.top + rect1.height / 2 + props.offset1[1];
        const x2 = rect2.left + rect2.width / 2 + props.offset2[0];
        const y2 = rect2.top + rect2.height / 2 + props.offset2[1];
        line.setAttribute('x1', String(x1));
        line.setAttribute('y1', String(y1));
        line.setAttribute('x2', String(x2));
        line.setAttribute('y2', String(y2));
        line.setAttribute('color', props.color ?? colors.WHITE);
      }
    }, 110);
  });
};

export const SVGLine = (props: { id: string; width?: number }) => {
  return (
    <div
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        top: '0px',
        left: '0px',
        width: '100%',
        height: '100%',
        zIndex: 25,
      }}
    >
      <svg
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        <line
          id={props.id}
          style={{
            strokeWidth: props.width ?? 4 + 'px',
            stroke: colors.WHITE,
          }}
        ></line>
      </svg>
    </div>
  );
};
