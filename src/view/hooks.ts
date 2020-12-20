import { useEffect, useReducer, useState } from 'preact/hooks';
import { addRenderable, removeRenderable } from 'model/generics';

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

export const useInputEventStack = (cb: KeyboardEventHandler) => {
  useEffect(() => {
    console.log('Add keyboard event');
    inputEventStack.push(cb);
    return () => {
      console.log('Remove keyboard event');
      const ind = inputEventStack.indexOf(cb);
      if (ind > -1) {
        inputEventStack.splice(ind, 1);
      }
    };
  }, []);
};
