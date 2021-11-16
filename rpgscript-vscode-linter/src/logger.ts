// This file wraps window console commands, mostly so that tests can disable them.
import * as vscode from 'vscode';

const originalConsole = console;
export let logger: {
  log: (...args: any[]) => void;
  error: (...args: any[]) => void;
} = {} as any;
export const enableConsole = () => {
  const output = vscode.window.createOutputChannel('rpgscript-lint');

  logger = {
    log: (...args: any) => {
      output.appendLine(args.join(' '));
      originalConsole.log(...args);
    },
    error: originalConsole.error,
    // warn: originalConsole.warn,
    // debug: originalConsole.debug,
    // trace: originalConsole.trace,
  };
};

export const disableConsole = () => {
  logger = {
    log: () => {},
    error: () => {},
    // warn: () => {},
    // debug: () => {},
    // trace: originalConsole.trace,
  };
};
