// This file wraps window console commands, mostly so that tests can disable them.

const originalConsole = window.console;
export const enableConsole = () => {
  (window as any).console = {
    log: originalConsole.log,
    error: originalConsole.error,
    warn: originalConsole.warn,
    debug: originalConsole.debug,
    time: originalConsole.time,
    timeEnd: originalConsole.timeEnd,
  };
};

export const disableConsole = () => {
  (window as any).console = {
    log: () => {},
    error: () => {},
    warn: () => {},
    debug: () => {},
    time: originalConsole.time,
    timeEnd: originalConsole.timeEnd,
  };
};

export const initConsole = () => {
  enableConsole();
};
