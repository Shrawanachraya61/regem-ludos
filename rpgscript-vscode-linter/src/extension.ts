// // The module 'vscode' contains the VS Code extensibility API
// // Import the module and reference it with the alias vscode in your code below
// import * as vscode from 'vscode';

// // this method is called when your extension is activated
// // your extension is activated the very first time the command is executed
// export function activate(context: vscode.ExtensionContext) {
//   // Use the console to output diagnostic information (console.log) and errors (console.error)
//   // This line of code will only be executed once when your extension is activated
//   console.log(
//     'Congratulations, your extension "rpgscript-vscode-linter" is now active!'
//   );

//   // The command has been defined in the package.json file
//   // Now provide the implementation of the command with registerCommand
//   // The commandId parameter must match the command field in package.json
//   let disposable = vscode.commands.registerCommand(
//     'rpgscript-vscode-linter.helloWorld',
//     () => {
//       // The code you place here will be executed every time your command is executed
//       // Display a message box to the user
//       vscode.window.showInformationMessage(
//         'Hello World from rpgscript-vscode-linter!'
//       );
//     }
//   );

//   context.subscriptions.push(disposable);
// }

// // this method is called when your extension is deactivated
// export function deactivate() {}

import {
  workspace,
  Disposable,
  Diagnostic,
  DiagnosticSeverity,
  Range,
} from 'vscode';
import * as vscode from 'vscode';

import {
  LintingProvider,
  LinterConfiguration,
  Linter,
} from './lintingProvider';
import { enableConsole, disableConsole, logger } from './logger';

class RPGScriptLintingProvider implements Linter {
  public languageId = 'rpgscript';

  public activate(context: vscode.ExtensionContext) {
    const subscriptions = context.subscriptions;
    const provider = new LintingProvider(this);
    provider.activate(subscriptions);
  }

  public loadConfiguration(): LinterConfiguration {
    const section = workspace.getConfiguration(this.languageId);
    logger.log(
      'scriptsRoot',
      section.get<string>('linter.scriptsRoot', '/src')
    );

    return {
      executable: 'node',
      scriptsRoot: section.get<string>('linter.scriptsRoot', '/src'),
      runTrigger: section.get<string>('linter.run', 'onType'),
    };
  }

  public process(lines: string[]): Diagnostic[] {
    logger.log('RPGScript Process lines', lines.join('\n'));
    const diagnostics: Diagnostic[] = [];
    lines.forEach(function (line) {
      const regex = /.+:(\d+)--(.*)--(.*)/;
      const matches = regex.exec(line);
      if (matches === null) {
        return;
      }
      diagnostics.push({
        range: new Range(
          parseInt(matches[1]) - 1,
          0,
          parseInt(matches[1]) - 1,
          Number.MAX_VALUE
        ),
        severity: matches[2].toLowerCase().includes('error')
          ? DiagnosticSeverity.Error
          : DiagnosticSeverity.Warning,
        message: matches[3],
        source: 'RPGScript VSCode Linter',
        code: '',
      });
    });
    return diagnostics;
  }
}

export function activate(context: vscode.ExtensionContext) {
  const section = workspace.getConfiguration('rpgscript');
  const debugEnabled = section.get<boolean>('linter.debug', false);
  if (debugEnabled) {
    enableConsole();
  } else {
    disableConsole();
  }
  logger.log('RPGScript Linter Activated.');
  if (debugEnabled) {
    logger.log('Debug mode enabled.');
  }

  const linter = new RPGScriptLintingProvider();
  linter.activate(context);
}

export function deactivate() {
  logger.log('RPGScript Linter Deactivated.');
}
