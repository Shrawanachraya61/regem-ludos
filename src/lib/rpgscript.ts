import { Scene, sceneHasCommand } from 'model/scene';

const RPGSCRIPT_LOAD_DIR = 'src/rpgscript';

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
  return args.map(arg => {
    if (arg[0] === '"' || arg[0] === "'") {
      return arg.slice(1, -1);
    } else {
      return arg;
    }
  });
}

export function formatArgs(args: string[]) {
  return removeQuotes(args).map(arg => {
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

export interface CommandBlock {
  conditional: Conditional | boolean;
  commands: Command[];
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
  }

  isValid(scene: Scene | null) {
    if (!scene) {
      return true;
    }
    for (let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i];

      for (let j = 0; j < block.commands.length; j++) {
        const command = block.commands[j];
        if (!sceneHasCommand(scene, command.type)) {
          return (
            `Error in script "${this.name}"\n\n` +
            `No command exists with name "${command.type}" ` +
            `and args "${command.args.join(',')}" `
          );
        }
      }
    }
    return true;
  }

  getNextCommand(): Command | null {
    const block = this.blocks[this.currentBlockIndex];
    if (block) {
      const cmd = block.commands[this.currentCommandIndex];
      if (cmd) {
        this.currentCommandIndex++;
        const ret = {
          args: cmd.args,
          type: cmd.type,
          conditional: block.conditional,
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
    return { soundNameIndexed, soundNameCh };
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
    console.error(
      `{Line ${lineNum}} Script parsing error ${this.name}: ${err} CONTENTS [\n"${lineContents}"\n]`
    );
    throw new Error('Parsing error');
  }

  parseCommand(commandSrc: string, lineNum: number, script?: Script) {
    commandSrc = commandSrc.trim();
    const firstParenIndex = commandSrc.indexOf('(');
    const lastParenIndex = commandSrc.lastIndexOf(')');

    if (commandSrc.match(/^(\w)+:/) && script) {
      return this.createDialogCommand(commandSrc, script);
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
    args = splitNotInParens(args, ',').map(arg => arg.trim());
    args.forEach(arg => {
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
      args: args.map(arg => {
        if (typeof arg === 'string' && arg.indexOf('(') !== -1) {
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

  createDialogCommand(line: string, script: Script): Command {
    let [actorName, subtitle] = line.split(':');
    let type = 'playDialogue';
    if (actorName[0] === '_') {
      actorName = actorName.slice(1);
      type = 'playDialogueInterruptable';
    }
    subtitle = subtitle.trim();
    const { soundNameCh, soundNameIndexed } = script.getNextDialog(actorName);
    this.soundsToLoad.push({ soundNameCh, soundNameIndexed });
    return {
      type,
      args: formatArgs([actorName, subtitle, soundNameCh]),
    };
  }

  parse(src: string, scene: Scene) {
    const triggers = {};
    const scripts = {};

    const addTrigger = (n: string, s: Trigger) => (triggers[n] = s);
    const addScript = (n: string, s: Script) => (scripts[n] = s);

    let isCodeBlock = false;
    let isTrigger = false;
    let isChoice = false;
    let currentBlock: CommandBlock | null = null;
    let currentScript: Script | null = null;
    let currentTrigger: Trigger | null = null;
    let currentTriggerName: string | null = null;
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
      } else if (firstCh === '}') {
        isCodeBlock = false;
        currentBlock = null;
      } else if (firstCh === '@' && !isCodeBlock) {
        let scriptName: string = line.substr(1, line.length - 1);
        if (scriptName === 'this') {
          scriptName = currentTriggerName || '';
        }
        if (scriptName.length === 0) {
          this.throwParsingError('Invalid script name', lineNum, line);
        }
        if (currentScript) {
          const err = currentScript.isValid(scene);
          if (err !== true) {
            this.throwParsingError(err, lineNum - 1, '');
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
              isCodeBlock = true;
              currentBlock = currentScript.addCommandBlock();
              currentBlock.conditional = conditional;
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
          } else if (isDialog) {
            const command = this.createDialogCommand(commandSrc, currentScript);
            block.commands.push(command);
            return;
          }

          const { type, args } = this.parseCommand(
            commandSrc,
            lineNum,
            currentScript
          );
          const command = {
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

        const {
          conditional: localConditional,
          endIndex,
        } = this.getConditionalFromLine(
          triggerContents,
          lineNum,
          currentScript as Script | undefined
        );
        let conditional = localConditional;
        if (itemConditional) {
          conditional = this.combineConditionals(
            itemConditional,
            localConditional,
            'and'
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
          const command = this.createDialogCommand(line, currentScript);
          block.commands.push(command);
        }
      }
    });
    if (currentScript) {
      const err = (currentScript as Script).isValid(scene);
      if (err !== true) {
        this.throwParsingError(err, lines.length, lines[lines.length - 1]);
      }
    }
    return { triggers, scripts };
  }
}

const scripts: Record<string, Script> = ((window as any).scripts = {});
const triggers: Record<string, Trigger> = ((window as any).triggers = {});

export const loadRPGScript = async (scriptFileName: string, scene: Scene) => {
  const url = `${RPGSCRIPT_LOAD_DIR}/${scriptFileName}.rpgscript`;
  console.log('Loading script', url);
  const src = await (await fetch(url)).text();
  parseRPGScript(scriptFileName, src, scene);
};

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
