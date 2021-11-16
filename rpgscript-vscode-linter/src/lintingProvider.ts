import * as cp from 'child_process';
import * as vscode from 'vscode';
import * as fs from 'fs';

import { ThrottledDelayer } from './async';
import { LineDecoder } from './lineDecoder';
import { logger } from './logger';

enum RunTrigger {
  onSave,
  onType,
  off,
}

const RunTriggerNamespace = {
  strings: {
    onSave: 'onSave',
    onType: 'onType',
    off: 'off',
  },
  from: function (value: string): RunTrigger {
    if (value === 'onType') {
      return RunTrigger.onType;
    } else if (value === 'onSave') {
      return RunTrigger.onSave;
    } else {
      return RunTrigger.off;
    }
  },
};

export interface LinterConfiguration {
  executable?: string;
  scriptsRoot?: string;
  runTrigger?: string;
}

export interface Linter {
  languageId: string;
  loadConfiguration: () => LinterConfiguration;
  process: (output: string[]) => vscode.Diagnostic[];
}

export class LintingProvider {
  public linterConfiguration: LinterConfiguration = {};

  private executableNotFound: boolean;

  private documentListener: vscode.Disposable | null = null;
  private diagnosticCollection: vscode.DiagnosticCollection | null = null;
  private delayers: { [key: string]: ThrottledDelayer<void> } | null = null;

  private linter: Linter;
  constructor(linter: Linter) {
    this.linter = linter;
    this.executableNotFound = false;
  }

  public activate(subscriptions: vscode.Disposable[]) {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection();
    subscriptions.push(this);
    vscode.workspace.onDidChangeConfiguration(
      this.loadConfiguration,
      this,
      subscriptions
    );
    this.loadConfiguration();

    vscode.workspace.onDidOpenTextDocument(
      this.triggerLint,
      this,
      subscriptions
    );
    vscode.workspace.onDidCloseTextDocument(
      (textDocument) => {
        this.diagnosticCollection?.delete(textDocument.uri);
        if (this.delayers) {
          delete this.delayers[textDocument.uri.toString()];
        }
      },
      null,
      subscriptions
    );

    // Lint all open documents documents
    vscode.workspace.textDocuments.forEach(this.triggerLint, this);
  }

  public dispose(): void {
    this.diagnosticCollection?.clear();
    this.diagnosticCollection?.dispose();
  }

  private loadConfiguration(): void {
    const oldExecutable =
      this.linterConfiguration && this.linterConfiguration.executable;
    this.linterConfiguration = this.linter.loadConfiguration();

    this.delayers = Object.create(null);
    if (this.executableNotFound) {
      this.executableNotFound =
        oldExecutable === this.linterConfiguration.executable;
    }
    if (this.documentListener) {
      this.documentListener.dispose();
    }
    if (
      RunTriggerNamespace.from(this.linterConfiguration.runTrigger ?? '') ===
      RunTrigger.onType
    ) {
      this.documentListener = vscode.workspace.onDidChangeTextDocument((e) => {
        this.triggerLint(e.document);
      });
    } else {
      this.documentListener = vscode.workspace.onDidSaveTextDocument(
        this.triggerLint,
        this
      );
    }
    this.documentListener = vscode.workspace.onDidSaveTextDocument(
      this.triggerLint,
      this
    );
    // Configuration has changed. Reevaluate all documents.
    vscode.workspace.textDocuments.forEach(this.triggerLint, this);
  }

  private triggerLint(textDocument: vscode.TextDocument): void {
    if (
      textDocument.languageId !== this.linter.languageId ||
      this.executableNotFound ||
      RunTriggerNamespace.from(this.linterConfiguration.runTrigger ?? '') ===
        RunTrigger.off
    ) {
      return;
    }
    const key = textDocument.uri.toString();
    let delayer = this.delayers?.[key];
    if (!delayer && this.delayers) {
      delayer = new ThrottledDelayer<void>(
        RunTriggerNamespace.from(this.linterConfiguration.runTrigger ?? '') ===
        RunTrigger.onType
          ? 250
          : 0
      );
      this.delayers[key] = delayer;
    }
    delayer?.trigger(() => this.doLint(textDocument));
  }

  private doLint(textDocument: vscode.TextDocument): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const executable = this.linterConfiguration.executable;
      const filePath = textDocument.fileName;
      const decoder = new LineDecoder();
      const decoded = [];
      let diagnostics: vscode.Diagnostic[] = [];

      const options = vscode.workspace.rootPath
        ? { cwd: vscode.workspace.rootPath }
        : undefined;
      const args: string[] = [];

      // Not keen on actually implementing this
      // if (
      //   RunTriggerNamespace.from(this.linterConfiguration.runTrigger ?? '') ===
      //   RunTrigger.onSave
      // ) {
      //   args = (this.linterConfiguration?.fileArgs ?? []).slice(0);
      //   args.push(textDocument.fileName);
      // } else {
      //   args = this.linterConfiguration.bufferArgs ?? [];
      // }
      // args = args.concat(this.linterConfiguration.extraArgs as any[]);

      let workspacePath = '.';
      if (vscode.workspace.workspaceFolders !== undefined) {
        for (let i = 0; i < vscode.workspace.workspaceFolders.length; i++) {
          const f = vscode.workspace.workspaceFolders[i].uri.fsPath;
          workspacePath = f;
          console.log(
            'Check workspaceFolder against file path',
            workspacePath,
            filePath
          );
          if (filePath.includes(workspacePath)) {
            console.log('Chose this path.');
            break;
          }
        }
      }

      const scriptsDir =
        workspacePath + (this.linterConfiguration.scriptsRoot ?? '');

      logger.log('Workspace path: ', workspacePath);
      logger.log('Scripts dir: ', scriptsDir);

      if (!fs.existsSync(scriptsDir)) {
        vscode.window.showErrorMessage(
          'Cannot lint RPGScript: No folder exists with name: ' +
            scriptsDir +
            '. Please check that scriptsRoot is correct.'
        );
        workspacePath = '.';
      }

      if (!fs.existsSync(filePath)) {
        vscode.window.showErrorMessage(
          'Cannot lint RPGScript: No file exists with name: ' + filePath
        );
        throw new Error(
          'Cannot lint RPGScript: No file exists with name: ' + filePath
        );
      }

      args.push(__dirname + '/../linter');
      args.push(filePath);
      args.push(scriptsDir);

      logger.log('Do lint: ', executable, '|', args, '|', filePath);
      const childProcess = cp.spawn(executable as any, args, options);
      childProcess.on('error', (error: Error) => {
        if (this.executableNotFound) {
          resolve();
          return;
        }
        let message = '';
        if ((error as any).code === 'ENOENT') {
          message = `Cannot lint ${textDocument.fileName}. The executable 'node' was not found. Use the '${this.linter.languageId}.executablePath' setting to configure the location of the executable`;
        } else {
          message = error.message
            ? error.message
            : `Failed to run executable using path: ${executable}. Reason is unknown.`;
        }
        vscode.window.showInformationMessage(message);
        this.executableNotFound = true;
        resolve();
      });

      const onDataEvent = (data: Buffer) => {
        decoder.write(data);
      };
      const onEndEvent = () => {
        decoder.end();
        const lines = decoder.getLines();
        if (lines && lines.length > 0) {
          diagnostics = this.linter.process(lines);
        }
        if (this.diagnosticCollection) {
          this.diagnosticCollection.set(textDocument.uri, diagnostics);
        }
        resolve();
      };

      if (childProcess.pid) {
        if (
          RunTriggerNamespace.from(
            this.linterConfiguration.runTrigger ?? ''
          ) === RunTrigger.onType
        ) {
          childProcess.stdin.write(textDocument.getText());
          childProcess.stdin.end();
        }
        childProcess.stderr.on('data', onDataEvent);
        childProcess.stderr.on('end', onEndEvent);
        childProcess.stdout.on('data', onDataEvent);
        childProcess.stdout.on('end', onEndEvent);
      } else {
        resolve();
      }
    });
  }
}
