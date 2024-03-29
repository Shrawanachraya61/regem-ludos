type Scene = any;

// Code above this line exists for compatibility.

const sceneHasCommand = (scene: Scene, k: string) => {
  return scene.commands.includes(k);
};

function splitNotInParens(str: string, spl: string) {
  const ret: string[] = [];
  let agg = '';
  let quote = '';
  let ignore = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];

    if (quote) {
      if (ch === quote) {
        quote = '';
        ignore = false;
      }
    } else if (ch === `"` || ch === `'`) {
      quote = ch;
      ignore = true;
    } else if (ch === '(') {
      ignore = true;
    } else if (ch === ')') {
      ignore = false;
    }

    if (!ignore && str[i] === spl) {
      ret.push(agg);
      agg = '';
    } else {
      agg += ch;
    }
  }
  if (agg) {
    ret.push(agg);
  }
  return ret;
}

function indexOfNotInParens(str: string, spl: string) {
  let quote = '';
  let ignore = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];

    if (quote) {
      if (ch === quote) {
        quote = '';
        ignore = false;
      }
    } else if (ch === `"` || ch === `'`) {
      quote = ch;
      ignore = true;
    } else if (ch === '(') {
      ignore = true;
    } else if (ch === ')') {
      ignore = false;
    }

    if (!ignore && str[i] === spl) {
      return i;
    }
  }
  return -1;
}

function removeQuotes(args: string[]) {
  return args.map((arg) => {
    if (arg[0] === '"' || arg[0] === "'") {
      return arg.slice(1, -1);
    } else {
      return arg;
    }
  });
}

export function formatArgs(args: string[]) {
  return removeQuotes(args).map((arg) => {
    if (!isNaN(parseFloat(arg))) {
      return parseFloat(arg);
    } else {
      return arg;
    }
  });
}

export enum TriggerType {
  STEP = 'step',
  STEP_FIRST = 'step-first',
  STEP_OFF = 'step-off',
  ACTION = 'action',
}

export interface ScriptCall {
  type: string;
  condition: any;
  scriptName: string;
}

export interface Conditional {
  type: string;
  args: any[];
}

export interface Command {
  i: number;
  conditional?: Conditional | boolean;
  type: string;
  args: (
    | string
    | number
    | {
        text: string;
        target: any;
      }
  )[];
}

export type CommandWithBlock = Command & { block: CommandBlock };

export interface CommandBlock {
  conditional: Conditional | boolean;
  commands: Command[];
  conditionalResult?: boolean;
}

export class Trigger {
  name: string;
  filename: string;
  lineNum: number;
  scriptCalls: ScriptCall[];

  constructor(name: string, filename: string, lineNum: number) {
    this.name = name;
    this.filename = filename;
    this.lineNum = lineNum;
    this.scriptCalls = [];
  }

  addScriptCall(triggerType: string, condition: any, scriptName: string) {
    this.scriptCalls.push({
      type: triggerType,
      condition: condition,
      scriptName: scriptName,
    });
  }
}

export class Script {
  name: string;
  filename: string;
  lineNum: number;
  blocks: CommandBlock[];
  soundNameStorage: Record<string, string>;
  currentBlockIndex: number;
  currentCommandIndex: number;
  sounds: number;
  soundsPerCharacter: Record<string, number>;

  constructor(name: string, filename: string, lineNum: number) {
    this.name = name;
    this.filename = filename;
    this.lineNum = lineNum;
    this.blocks = [];

    this.soundNameStorage = {};

    this.currentBlockIndex = 0;
    this.currentCommandIndex = 0;
    this.sounds = 0;
    this.soundsPerCharacter = {};
  }

  reset() {
    this.currentBlockIndex = 0;
    this.currentCommandIndex = 0;
    this.blocks.forEach((block) => {
      block.conditionalResult = undefined;
    });
  }

  isValid(scene: Scene) {
    if (!scene) {
      return {};
    }
    for (let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i];
      for (let j = 0; j < block.commands.length; j++) {
        const command = block.commands[j];
        if (command.type[0] !== ':' && !sceneHasCommand(scene, command.type)) {
          return {
            msg:
              `No command exists with name "${command.type}" ` +
              `and args "${command.args.join(',')}" `,
            lineNum: command.i,
          };
        }
      }
    }
    return {};
  }

  getNextCommand(): CommandWithBlock | null {
    const block = this.blocks[this.currentBlockIndex];
    if (block) {
      const cmd = block.commands[this.currentCommandIndex];
      if (cmd) {
        this.currentCommandIndex++;
        const ret = {
          i: this.currentBlockIndex,
          args: cmd.args,
          type: cmd.type,
          conditional: block.conditional,
          block,
        };
        return ret;
      } else {
        this.currentBlockIndex++;
        this.currentCommandIndex = 0;
        return this.getNextCommand();
      }
    } else {
      return null;
    }
  }

  getNextDialog(actorName: string) {
    if (this.soundsPerCharacter[actorName]) {
      this.soundsPerCharacter[actorName]++;
    } else {
      this.soundsPerCharacter[actorName] = 1;
    }
    let n: number | string = this.soundsPerCharacter[actorName];
    if (n < 10) {
      n = '0' + n;
    }
    const soundNameIndexed = this.name + '/' + this.sounds;
    const soundNameCh = this.name + '/' + actorName + '-' + n;

    this.sounds++;
    return { soundNameIndexed, soundNameCh, n };
  }

  addCommandBlock(): CommandBlock {
    const block = {
      conditional: true,
      commands: [],
    };
    this.blocks.push(block);
    return block;
  }
}

export class ScriptParser {
  name: string;
  soundsToLoad: any[];
  constructor(name: string) {
    this.name = name;
    this.soundsToLoad = [];
  }

  throwParsingError(err: string, lineNum: number, lineContents: string) {
    const error = `{Line ${
      lineNum === -1 ? 0 : lineNum
    }} Script parsing error ${
      this.name
    }: ${err} CONTENTS [\n"${lineContents}"\n]`;
    console.error(error);
    throw new Error(error);
  }

  parseCommand(commandSrc: string, lineNum: number, script?: Script): Command {
    commandSrc = commandSrc.trim();

    // shorthand for callScript(scriptName, ...args)
    if (commandSrc[0] === ':') {
      const src = commandSrc.slice();
      const indFirstOpen = src.indexOf('(');
      const indLastClose = src.lastIndexOf(')');
      if (indFirstOpen === -1) {
        this.throwParsingError(
          `Invalid callScript shorthand, no open paren.'`,
          lineNum,
          commandSrc
        );
      }
      if (indLastClose === -1) {
        this.throwParsingError(
          `Invalid callScript shorthand, no close paren.'`,
          lineNum,
          commandSrc
        );
      }
      const scriptName = src.slice(1, indFirstOpen);
      const scriptArgs = src.slice(indFirstOpen + 1, indLastClose).split(',');
      callScriptStrings.push({ scriptName, lineNum, fileName: this.name });
      commandSrc = `callScript(${scriptName},${scriptArgs.join(',')});`;
    }

    const firstParenIndex = commandSrc.indexOf('(');
    const lastParenIndex = commandSrc.lastIndexOf(')');

    if (commandSrc.match(/^(\w)+:/) && script) {
      return this.createDialogCommand(commandSrc, script, lineNum);
    }

    if (firstParenIndex === -1 || firstParenIndex === 0) {
      this.throwParsingError(
        'Invalid command, no name provided',
        lineNum,
        commandSrc
      );
    }
    if (lastParenIndex === -1 || lastParenIndex === 0) {
      this.throwParsingError(
        'Invalid command, no end parens',
        lineNum,
        commandSrc
      );
    }

    let args: string | string[] = commandSrc.substr(
      firstParenIndex + 1,
      commandSrc.length -
        (firstParenIndex + 1) -
        (commandSrc.length - lastParenIndex)
    );
    args = splitNotInParens(args, ',').map((arg) => arg.trim());
    args.forEach((arg) => {
      if (arg[0] === "'") {
        if (arg[arg.length - 1] !== "'") {
          this.throwParsingError(
            'Invalid command, unterminated single quote "\'"',
            lineNum,
            commandSrc
          );
        }
      } else if (arg[0] === '"') {
        if (arg[arg.length - 1] !== '"') {
          this.throwParsingError(
            "Invalid command, unterminated double quote '\"'",
            lineNum,
            commandSrc
          );
        }
      }
    });

    return {
      i: lineNum,
      type: commandSrc.substr(0, firstParenIndex),
      args: formatArgs(args),
    };
  }

  parseConditional(
    conditionalSrc: string,
    lineNum: number,
    script?: Script
  ): Conditional | boolean {
    const { type, args } = this.parseCommand(conditionalSrc, lineNum, script);
    const validTypes = [
      'is',
      'isnot',
      'gt',
      'lt',
      'eq',
      'any',
      'all',
      'as',
      'once',
      'with',
      'func',
    ];
    if (!validTypes.includes(type)) {
      this.throwParsingError(
        `Invalid conditional, no type named "${type}"`,
        lineNum,
        conditionalSrc
      );
    }

    return {
      type: type,
      args: args.map((arg) => {
        if (
          typeof arg === 'string' &&
          type !== 'func' &&
          arg.indexOf('(') !== -1
        ) {
          return this.parseCommand(arg, lineNum, script);
        } else {
          return arg;
        }
      }),
    };
  }

  combineConditionals(
    c1: Conditional | boolean,
    c2: Conditional | boolean,
    type: string
  ): Conditional {
    return {
      type,
      args: [c1, c2],
    };
  }

  createAllConditional(...args: (Conditional | boolean)[]): Conditional {
    return {
      type: 'all',
      args: [...args],
    };
  }

  getConditionalFromLine(
    line: string,
    lineNum: number,
    script?: Script
  ): {
    conditional: Conditional | boolean;
    endIndex: number;
  } {
    const conditionalStartIndex = indexOfNotInParens(line, '?');
    if (conditionalStartIndex > -1) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) {
        this.throwParsingError(
          `Invalid conditional, no ending ':'`,
          lineNum,
          line
        );
      }
      const conditionalSrc = line.slice(conditionalStartIndex + 1, colonIndex);
      const conditional = this.parseConditional(
        conditionalSrc.trim(),
        lineNum,
        script
      );
      return { conditional, endIndex: colonIndex + 1 };
    } else {
      return { conditional: true, endIndex: 0 };
    }
  }

  createDialogCommand(line: string, script: Script, lineNum: number): Command {
    const firstIndOfColon = line.indexOf(':');
    if (firstIndOfColon === -1) {
      this.throwParsingError(
        'Dialog command did not have a ":" character.',
        lineNum,
        line
      );
    }

    let actorName = line.slice(0, firstIndOfColon);
    let subtitle = line.slice(firstIndOfColon + 1);

    let type = 'playDialogue';
    if (actorName[0] === '_') {
      actorName = actorName.slice(1);
      type = 'playDialogueInterruptable';
    }
    subtitle = subtitle.trim();
    const { soundNameCh, soundNameIndexed, n } =
      script.getNextDialog(actorName);
    this.soundsToLoad.push({ soundNameCh, soundNameIndexed });
    return {
      i: parseInt(String(n)),
      type,
      args: formatArgs([actorName, subtitle, soundNameCh]),
    };
  }

  parse(src: string, scene: Scene) {
    const triggers: Record<string, Trigger> = {};
    const scripts: Record<string, Script> = {};

    const addTrigger = (n: string, s: Trigger) => (triggers[n] = s);
    const addScript = (n: string, s: Script) => (scripts[n] = s);

    let isCodeBlock = false;
    let isTrigger = false;
    let isChoice = false;
    let currentBlock: CommandBlock | null = null;
    let currentScript: Script | null = null;
    let currentTrigger: Trigger | null = null;
    let currentTriggerName: string | null = null;
    const conditionalStack: (Conditional | boolean)[] = [];
    const lines = src.split('\n');

    lines.forEach((line: string, lineNum: number) => {
      lineNum = lineNum + 1;
      line = line.trim();
      if (line.length === 0) {
        return;
      }
      if (line[0] === '/' && line[1] === '/') {
        return;
      }

      const firstCh = line[0];
      if (firstCh === '{') {
        isCodeBlock = true;
        conditionalStack.push(true);
      } else if (firstCh === '}') {
        isCodeBlock = false;
        currentBlock = null;
        conditionalStack.pop();
      } else if (firstCh === '@' && !isCodeBlock) {
        let scriptName: string = line.substr(1, line.length - 1);
        if (scriptName === 'this') {
          scriptName = currentTriggerName || '';
        }
        if (scriptName.length === 0) {
          this.throwParsingError('Invalid script name', lineNum, line);
        }
        if (currentScript) {
          const obj = currentScript.isValid(scene);
          const err = obj.msg;
          if (err) {
            this.throwParsingError(err, obj.lineNum, '');
          }
        }
        currentScript = new Script(scriptName, this.name, lineNum);
        addScript(scriptName, currentScript);
        isTrigger = false;
        isChoice = false;
      } else if (firstCh === '$') {
        isChoice = true;
        isTrigger = false;
        if (currentScript) {
          currentBlock = currentScript.addCommandBlock();
          currentBlock.conditional = true;
          currentBlock.commands.push({
            i: lineNum,
            type: 'showChoices',
            args: [],
          });
        }
      } else if (firstCh === '#') {
        isTrigger = true;
        isChoice = false;
        currentTriggerName = line.substr(1);
        currentTrigger = new Trigger(line.substr(1), this.name, lineNum);
        addTrigger(line.substr(1), currentTrigger);
      } else if (firstCh === '+' || isCodeBlock) {
        const commandContents = line.substr(isCodeBlock ? 0 : 1);
        if (currentScript) {
          const { conditional, endIndex } = this.getConditionalFromLine(
            commandContents,
            lineNum,
            currentScript
          );
          if (typeof conditional === 'object') {
            if (commandContents[endIndex] === '{') {
              conditionalStack.push(conditional);
              isCodeBlock = true;
              currentBlock = currentScript.addCommandBlock();
              currentBlock.conditional = this.createAllConditional(
                ...conditionalStack
              );
              return;
            } else if (endIndex === commandContents.length) {
              currentBlock = currentScript.addCommandBlock();
              currentBlock.conditional = conditional;
              return;
            }
          }

          let block: CommandBlock | null = null;
          if (isCodeBlock) {
            if (currentBlock === null) {
              currentBlock = currentScript.addCommandBlock();
              currentBlock.conditional = conditional;
            }
            block = currentBlock;
          } else {
            block = currentBlock = currentScript.addCommandBlock();
            block.conditional = conditional;
          }

          let commandSrc = commandContents.substr(endIndex);
          const isDialog = /(.*): "(.*)"/.test(commandSrc);
          if (commandSrc[0] === '?') {
            this.throwParsingError(
              `Invalid conditional, did you forget '+' at the start?`,
              lineNum,
              line
            );
            return;
          }

          if (commandSrc[0] === '+') {
            commandSrc = commandSrc.slice(1);
            // console.log('cmd src', commandSrc);
            // if (commandSrc[0] === ':') {
            //   let src = commandSrc;
            //   const indFirstOpen = src.indexOf('(');
            //   const indLastClose = src.lastIndexOf(')');
            //   if (indFirstOpen === -1) {
            //     this.throwParsingError(
            //       `Invalid callScript shorthand, no open paren.'`,
            //       lineNum,
            //       line
            //     );
            //   }
            //   if (indLastClose === -1) {
            //     this.throwParsingError(
            //       `Invalid callScript shorthand, no close paren.'`,
            //       lineNum,
            //       line
            //     );
            //   }
            //   // :jump(ada, bob);
            //   let scriptName = src.slice(1, indFirstOpen);
            //   let scriptArgs = src
            //     .slice(indFirstOpen + 1, indLastClose)
            //     .split(',');
            //   const args = src.split(',').slice(1);
            //   commandSrc = `callScript(${scriptName},${scriptArgs.join(',')})`;
            //   console.log('created a shorthand callScript', commandSrc);
            // }
          } else if (isDialog) {
            const command = this.createDialogCommand(
              commandSrc,
              currentScript,
              lineNum
            );
            block.commands.push(command);
            return;
          }

          const { type, args } = this.parseCommand(
            commandSrc,
            lineNum,
            currentScript
          );
          const command = {
            i: lineNum,
            type,
            args,
          };
          block.commands.push(command);
        }
      } else if (isChoice) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) {
          this.throwParsingError(
            `Invalid choice definition, no colon '"'`,
            lineNum,
            line
          );
        }
        const choiceText = line.substr(0, colonIndex);
        const target = line.substr(colonIndex + 1);
        if (currentBlock) {
          currentBlock.commands[0].args.push({
            text: choiceText,
            target: target,
          });
        }
      } else if (isTrigger) {
        const firstCommaIndex = line.indexOf(',');
        if (firstCommaIndex === -1) {
          this.throwParsingError(
            `Invalid trigger script call, invalid number of arguments`,
            lineNum,
            line
          );
        }
        const triggerType = line.substr(0, firstCommaIndex);
        let triggerContents = line.substr(firstCommaIndex + 1);
        let itemConditional: Conditional | null = null;
        if (triggerType === 'item') {
          const itemName = triggerContents.slice(
            0,
            triggerContents.indexOf(',')
          );
          itemConditional = {
            type: 'with',
            args: [itemName],
          };
          triggerContents = triggerContents.slice(
            triggerContents.indexOf(',') + 1
          );
        }

        const { conditional: localConditional, endIndex } =
          this.getConditionalFromLine(
            triggerContents,
            lineNum,
            currentScript as Script | undefined
          );
        let conditional = localConditional;
        if (itemConditional) {
          conditional = this.combineConditionals(
            itemConditional,
            localConditional,
            'all'
          );
        }

        let scriptName = triggerContents.substr(endIndex);
        if (scriptName === 'this' && currentTriggerName) {
          scriptName = currentTriggerName;
        }
        if (currentTrigger) {
          currentTrigger.addScriptCall(triggerType, conditional, scriptName);
        }
      } else if (firstCh === '>') {
        if (currentBlock) {
          currentBlock.commands.push({
            i: lineNum,
            type: 'callScript',
            args: [line.substr(1)],
          });
        }
      } else {
        isTrigger = false;
        if (currentScript) {
          if (line[0] === '?') {
            this.throwParsingError(
              `Invalid conditional, did you forget '+' at the start?`,
              lineNum,
              line
            );
            return;
          }

          const block = currentScript.addCommandBlock();
          const command = this.createDialogCommand(
            line,
            currentScript,
            lineNum
          );
          block.commands.push(command);
        }
      }
    });
    if (currentScript) {
      const obj = (currentScript as Script).isValid(scene);
      const err = obj?.msg;
      if (err) {
        this.throwParsingError(err, obj.lineNum, lines[lines.length - 1]);
      }
    }
    return { triggers, scripts };
  }
}

const scripts: Record<string, Script> = {};
const triggers: Record<string, Trigger> = {};
const callScriptStrings: {
  scriptName: string;
  lineNum: number;
  fileName: string;
}[] = [];

// export const loadRPGScript = async (scriptFileName: string, scene: Scene) => {
//   const url = `${RPGSCRIPT_LOAD_DIR}/${scriptFileName}.rpgscript`;
//   console.log('Loading script', url);
//   const src = await (await fetch(url)).text();
//   parseRPGScript(scriptFileName, src, scene);
// };

export const parseRPGScript = (
  scriptName: string,
  scriptSrc: string,
  scene: Scene
) => {
  const parser = new ScriptParser(scriptName);
  const { triggers: localTriggers, scripts: localScripts } = parser.parse(
    scriptSrc,
    scene
  );

  Object.assign(scripts, localScripts);
  Object.assign(triggers, localTriggers);
};

export const parseSingleScript = (
  scriptSrc: string,
  scene: Scene
): Record<string, Script> => {
  const parser = new ScriptParser(scriptSrc);
  const { scripts: localScripts } = parser.parse(scriptSrc, scene);

  return localScripts;
};

export const getScript = (scriptName: string): Script => {
  const script = scripts[scriptName];
  if (!script) {
    throw new Error(`Cannot get script with name ${scriptName}`);
  }
  return script;
};

export const getTrigger = (triggerName: string): Trigger => {
  const trigger = triggers[triggerName];
  if (!trigger) {
    throw new Error(`Cannot get trigger with name ${triggerName}`);
  }
  return trigger;
};

export const scriptExists = (scriptName: string) => {
  const script = scripts[scriptName];
  if (!script) {
    return false;
  }
  return true;
};

export const triggerExists = (triggerName: string) => {
  const trigger = triggers[triggerName];
  if (!trigger) {
    return false;
  }
  return true;
};

export const getScripts = () => scripts;
export const getTriggers = () => triggers;
export const getCallScriptStrings = () => callScriptStrings;
