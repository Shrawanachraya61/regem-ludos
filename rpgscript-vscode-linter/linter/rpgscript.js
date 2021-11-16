"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.getCallScriptStrings = exports.getTriggers = exports.getScripts = exports.triggerExists = exports.scriptExists = exports.getTrigger = exports.getScript = exports.parseSingleScript = exports.parseRPGScript = exports.ScriptParser = exports.Script = exports.Trigger = exports.TriggerType = exports.formatArgs = void 0;
// Code above this line exists for compatibility.
var sceneHasCommand = function (scene, k) {
    return scene.commands.includes(k);
};
function splitNotInParens(str, spl) {
    var ret = [];
    var agg = '';
    var quote = '';
    var ignore = false;
    for (var i = 0; i < str.length; i++) {
        var ch = str[i];
        if (quote) {
            if (ch === quote) {
                quote = '';
                ignore = false;
            }
        }
        else if (ch === "\"" || ch === "'") {
            quote = ch;
            ignore = true;
        }
        else if (ch === '(') {
            ignore = true;
        }
        else if (ch === ')') {
            ignore = false;
        }
        if (!ignore && str[i] === spl) {
            ret.push(agg);
            agg = '';
        }
        else {
            agg += ch;
        }
    }
    if (agg) {
        ret.push(agg);
    }
    return ret;
}
function indexOfNotInParens(str, spl) {
    var quote = '';
    var ignore = false;
    for (var i = 0; i < str.length; i++) {
        var ch = str[i];
        if (quote) {
            if (ch === quote) {
                quote = '';
                ignore = false;
            }
        }
        else if (ch === "\"" || ch === "'") {
            quote = ch;
            ignore = true;
        }
        else if (ch === '(') {
            ignore = true;
        }
        else if (ch === ')') {
            ignore = false;
        }
        if (!ignore && str[i] === spl) {
            return i;
        }
    }
    return -1;
}
function removeQuotes(args) {
    return args.map(function (arg) {
        if (arg[0] === '"' || arg[0] === "'") {
            return arg.slice(1, -1);
        }
        else {
            return arg;
        }
    });
}
function formatArgs(args) {
    return removeQuotes(args).map(function (arg) {
        if (!isNaN(parseFloat(arg))) {
            return parseFloat(arg);
        }
        else {
            return arg;
        }
    });
}
exports.formatArgs = formatArgs;
var TriggerType;
(function (TriggerType) {
    TriggerType["STEP"] = "step";
    TriggerType["STEP_FIRST"] = "step-first";
    TriggerType["STEP_OFF"] = "step-off";
    TriggerType["ACTION"] = "action";
})(TriggerType = exports.TriggerType || (exports.TriggerType = {}));
var Trigger = /** @class */ (function () {
    function Trigger(name, filename, lineNum) {
        this.name = name;
        this.filename = filename;
        this.lineNum = lineNum;
        this.scriptCalls = [];
    }
    Trigger.prototype.addScriptCall = function (triggerType, condition, scriptName) {
        this.scriptCalls.push({
            type: triggerType,
            condition: condition,
            scriptName: scriptName
        });
    };
    return Trigger;
}());
exports.Trigger = Trigger;
var Script = /** @class */ (function () {
    function Script(name, filename, lineNum) {
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
    Script.prototype.reset = function () {
        this.currentBlockIndex = 0;
        this.currentCommandIndex = 0;
        this.blocks.forEach(function (block) {
            block.conditionalResult = undefined;
        });
    };
    Script.prototype.isValid = function (scene) {
        if (!scene) {
            return {};
        }
        var lineNumOffset = 0;
        for (var i = 0; i < this.blocks.length; i++) {
            var block = this.blocks[i];
            if (i > 0) {
                lineNumOffset += 2;
            }
            for (var j = 0; j < block.commands.length; j++) {
                lineNumOffset++;
                var command = block.commands[j];
                if (command.type[0] !== ':' && !sceneHasCommand(scene, command.type)) {
                    // this.lineNum = block.li
                    return {
                        msg: "No command exists with name \"" + command.type + "\" " +
                            ("and args \"" + command.args.join(',') + "\" "),
                        lineNum: command.i
                    };
                }
            }
        }
        return {};
    };
    Script.prototype.getNextCommand = function () {
        var block = this.blocks[this.currentBlockIndex];
        if (block) {
            var cmd = block.commands[this.currentCommandIndex];
            if (cmd) {
                this.currentCommandIndex++;
                var ret = {
                    i: this.currentBlockIndex,
                    args: cmd.args,
                    type: cmd.type,
                    conditional: block.conditional,
                    block: block
                };
                return ret;
            }
            else {
                this.currentBlockIndex++;
                this.currentCommandIndex = 0;
                return this.getNextCommand();
            }
        }
        else {
            return null;
        }
    };
    Script.prototype.getNextDialog = function (actorName) {
        if (this.soundsPerCharacter[actorName]) {
            this.soundsPerCharacter[actorName]++;
        }
        else {
            this.soundsPerCharacter[actorName] = 1;
        }
        var n = this.soundsPerCharacter[actorName];
        if (n < 10) {
            n = '0' + n;
        }
        var soundNameIndexed = this.name + '/' + this.sounds;
        var soundNameCh = this.name + '/' + actorName + '-' + n;
        this.sounds++;
        return { soundNameIndexed: soundNameIndexed, soundNameCh: soundNameCh, n: n };
    };
    Script.prototype.addCommandBlock = function () {
        var block = {
            conditional: true,
            commands: []
        };
        this.blocks.push(block);
        return block;
    };
    return Script;
}());
exports.Script = Script;
var ScriptParser = /** @class */ (function () {
    function ScriptParser(name) {
        this.name = name;
        this.soundsToLoad = [];
    }
    ScriptParser.prototype.throwParsingError = function (err, lineNum, lineContents) {
        var error = "{Line " + (lineNum === -1 ? 0 : lineNum) + "} Script parsing error " + this.name + ": " + err + " CONTENTS [\n\"" + lineContents + "\"\n]";
        console.error(error);
        throw new Error(error);
    };
    ScriptParser.prototype.parseCommand = function (commandSrc, lineNum, script) {
        var _this = this;
        commandSrc = commandSrc.trim();
        // shorthand for callScript(scriptName, ...args)
        if (commandSrc[0] === ':') {
            var src = commandSrc.slice();
            var indFirstOpen = src.indexOf('(');
            var indLastClose = src.lastIndexOf(')');
            if (indFirstOpen === -1) {
                this.throwParsingError("Invalid callScript shorthand, no open paren.'", lineNum, commandSrc);
            }
            if (indLastClose === -1) {
                this.throwParsingError("Invalid callScript shorthand, no close paren.'", lineNum, commandSrc);
            }
            var scriptName = src.slice(1, indFirstOpen);
            var scriptArgs = src.slice(indFirstOpen + 1, indLastClose).split(',');
            callScriptStrings.push({ scriptName: scriptName, lineNum: lineNum, fileName: this.name });
            commandSrc = "callScript(" + scriptName + "," + scriptArgs.join(',') + ");";
        }
        var firstParenIndex = commandSrc.indexOf('(');
        var lastParenIndex = commandSrc.lastIndexOf(')');
        if (commandSrc.match(/^(\w)+:/) && script) {
            return this.createDialogCommand(commandSrc, script, lineNum);
        }
        if (firstParenIndex === -1 || firstParenIndex === 0) {
            this.throwParsingError('Invalid command, no name provided', lineNum, commandSrc);
        }
        if (lastParenIndex === -1 || lastParenIndex === 0) {
            this.throwParsingError('Invalid command, no end parens', lineNum, commandSrc);
        }
        var args = commandSrc.substr(firstParenIndex + 1, commandSrc.length -
            (firstParenIndex + 1) -
            (commandSrc.length - lastParenIndex));
        args = splitNotInParens(args, ',').map(function (arg) { return arg.trim(); });
        args.forEach(function (arg) {
            if (arg[0] === "'") {
                if (arg[arg.length - 1] !== "'") {
                    _this.throwParsingError('Invalid command, unterminated single quote "\'"', lineNum, commandSrc);
                }
            }
            else if (arg[0] === '"') {
                if (arg[arg.length - 1] !== '"') {
                    _this.throwParsingError("Invalid command, unterminated double quote '\"'", lineNum, commandSrc);
                }
            }
        });
        return {
            i: lineNum,
            type: commandSrc.substr(0, firstParenIndex),
            args: formatArgs(args)
        };
    };
    ScriptParser.prototype.parseConditional = function (conditionalSrc, lineNum, script) {
        var _this = this;
        var _a = this.parseCommand(conditionalSrc, lineNum, script), type = _a.type, args = _a.args;
        var validTypes = [
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
            this.throwParsingError("Invalid conditional, no type named \"" + type + "\"", lineNum, conditionalSrc);
        }
        return {
            type: type,
            args: args.map(function (arg) {
                if (typeof arg === 'string' &&
                    type !== 'func' &&
                    arg.indexOf('(') !== -1) {
                    return _this.parseCommand(arg, lineNum, script);
                }
                else {
                    return arg;
                }
            })
        };
    };
    ScriptParser.prototype.combineConditionals = function (c1, c2, type) {
        return {
            type: type,
            args: [c1, c2]
        };
    };
    ScriptParser.prototype.createAllConditional = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return {
            type: 'all',
            args: __spreadArray([], args, true)
        };
    };
    ScriptParser.prototype.getConditionalFromLine = function (line, lineNum, script) {
        var conditionalStartIndex = indexOfNotInParens(line, '?');
        if (conditionalStartIndex > -1) {
            var colonIndex = line.indexOf(':');
            if (colonIndex === -1) {
                this.throwParsingError("Invalid conditional, no ending ':'", lineNum, line);
            }
            var conditionalSrc = line.slice(conditionalStartIndex + 1, colonIndex);
            var conditional = this.parseConditional(conditionalSrc.trim(), lineNum, script);
            return { conditional: conditional, endIndex: colonIndex + 1 };
        }
        else {
            return { conditional: true, endIndex: 0 };
        }
    };
    ScriptParser.prototype.createDialogCommand = function (line, script, lineNum) {
        var firstIndOfColon = line.indexOf(':');
        if (firstIndOfColon === -1) {
            this.throwParsingError('Dialog command did not have a ":" character.', lineNum, line);
        }
        var actorName = line.slice(0, firstIndOfColon);
        var subtitle = line.slice(firstIndOfColon + 1);
        var type = 'playDialogue';
        if (actorName[0] === '_') {
            actorName = actorName.slice(1);
            type = 'playDialogueInterruptable';
        }
        subtitle = subtitle.trim();
        var _a = script.getNextDialog(actorName), soundNameCh = _a.soundNameCh, soundNameIndexed = _a.soundNameIndexed, n = _a.n;
        this.soundsToLoad.push({ soundNameCh: soundNameCh, soundNameIndexed: soundNameIndexed });
        return {
            i: parseInt(String(n)),
            type: type,
            args: formatArgs([actorName, subtitle, soundNameCh])
        };
    };
    ScriptParser.prototype.parse = function (src, scene) {
        var _this = this;
        var triggers = {};
        var scripts = {};
        var addTrigger = function (n, s) { return (triggers[n] = s); };
        var addScript = function (n, s) { return (scripts[n] = s); };
        var isCodeBlock = false;
        var isTrigger = false;
        var isChoice = false;
        var currentBlock = null;
        var currentScript = null;
        var currentTrigger = null;
        var currentTriggerName = null;
        var conditionalStack = [];
        var lines = src.split('\n');
        var lastValidLine = 0;
        lines.forEach(function (line, lineNum) {
            lineNum = lineNum + 1;
            line = line.trim();
            if (line.length === 0) {
                return;
            }
            if (line[0] === '/' && line[1] === '/') {
                return;
            }
            lastValidLine = lineNum;
            var firstCh = line[0];
            if (firstCh === '{') {
                isCodeBlock = true;
                conditionalStack.push(true);
            }
            else if (firstCh === '}') {
                isCodeBlock = false;
                currentBlock = null;
                conditionalStack.pop();
            }
            else if (firstCh === '@' && !isCodeBlock) {
                var scriptName = line.substr(1, line.length - 1);
                if (scriptName === 'this') {
                    scriptName = currentTriggerName || '';
                }
                if (scriptName.length === 0) {
                    _this.throwParsingError('Invalid script name', lineNum, line);
                }
                if (currentScript) {
                    var obj = currentScript.isValid(scene);
                    var err = obj.msg;
                    if (err) {
                        _this.throwParsingError(err, obj.lineNum, '');
                    }
                }
                currentScript = new Script(scriptName, _this.name, lineNum);
                addScript(scriptName, currentScript);
                isTrigger = false;
                isChoice = false;
            }
            else if (firstCh === '$') {
                isChoice = true;
                isTrigger = false;
                if (currentScript) {
                    currentBlock = currentScript.addCommandBlock();
                    currentBlock.conditional = true;
                    currentBlock.commands.push({
                        i: lineNum,
                        type: 'showChoices',
                        args: []
                    });
                }
            }
            else if (firstCh === '#') {
                isTrigger = true;
                isChoice = false;
                currentTriggerName = line.substr(1);
                currentTrigger = new Trigger(line.substr(1), _this.name, lineNum);
                addTrigger(line.substr(1), currentTrigger);
            }
            else if (firstCh === '+' || isCodeBlock) {
                var commandContents = line.substr(isCodeBlock ? 0 : 1);
                if (currentScript) {
                    var _a = _this.getConditionalFromLine(commandContents, lineNum, currentScript), conditional = _a.conditional, endIndex = _a.endIndex;
                    if (typeof conditional === 'object') {
                        if (commandContents[endIndex] === '{') {
                            conditionalStack.push(conditional);
                            isCodeBlock = true;
                            currentBlock = currentScript.addCommandBlock();
                            currentBlock.conditional = _this.createAllConditional.apply(_this, conditionalStack);
                            return;
                        }
                        else if (endIndex === commandContents.length) {
                            currentBlock = currentScript.addCommandBlock();
                            currentBlock.conditional = conditional;
                            return;
                        }
                    }
                    var block = null;
                    if (isCodeBlock) {
                        if (currentBlock === null) {
                            currentBlock = currentScript.addCommandBlock();
                            currentBlock.conditional = conditional;
                        }
                        block = currentBlock;
                    }
                    else {
                        block = currentBlock = currentScript.addCommandBlock();
                        block.conditional = conditional;
                    }
                    var commandSrc = commandContents.substr(endIndex);
                    var isDialog = /(.*): "(.*)"/.test(commandSrc);
                    if (commandSrc[0] === '?') {
                        _this.throwParsingError("Invalid conditional, did you forget '+' at the start?", lineNum, line);
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
                    }
                    else if (isDialog) {
                        var command_1 = _this.createDialogCommand(commandSrc, currentScript, lineNum);
                        block.commands.push(command_1);
                        return;
                    }
                    var _b = _this.parseCommand(commandSrc, lineNum, currentScript), type = _b.type, args = _b.args;
                    var command = {
                        i: lineNum,
                        type: type,
                        args: args
                    };
                    block.commands.push(command);
                }
            }
            else if (isChoice) {
                var colonIndex = line.indexOf(':');
                if (colonIndex === -1) {
                    _this.throwParsingError("Invalid choice definition, no colon '\"'", lineNum, line);
                }
                var choiceText = line.substr(0, colonIndex);
                var target = line.substr(colonIndex + 1);
                if (currentBlock) {
                    currentBlock.commands[0].args.push({
                        text: choiceText,
                        target: target
                    });
                }
            }
            else if (isTrigger) {
                var firstCommaIndex = line.indexOf(',');
                if (firstCommaIndex === -1) {
                    _this.throwParsingError("Invalid trigger script call, invalid number of arguments", lineNum, line);
                }
                var triggerType = line.substr(0, firstCommaIndex);
                var triggerContents = line.substr(firstCommaIndex + 1);
                var itemConditional = null;
                if (triggerType === 'item') {
                    var itemName = triggerContents.slice(0, triggerContents.indexOf(','));
                    itemConditional = {
                        type: 'with',
                        args: [itemName]
                    };
                    triggerContents = triggerContents.slice(triggerContents.indexOf(',') + 1);
                }
                var _c = _this.getConditionalFromLine(triggerContents, lineNum, currentScript), localConditional = _c.conditional, endIndex = _c.endIndex;
                var conditional = localConditional;
                if (itemConditional) {
                    conditional = _this.combineConditionals(itemConditional, localConditional, 'all');
                }
                var scriptName = triggerContents.substr(endIndex);
                if (scriptName === 'this' && currentTriggerName) {
                    scriptName = currentTriggerName;
                }
                if (currentTrigger) {
                    currentTrigger.addScriptCall(triggerType, conditional, scriptName);
                }
            }
            else if (firstCh === '>') {
                if (currentBlock) {
                    currentBlock.commands.push({
                        i: lineNum,
                        type: 'callScript',
                        args: [line.substr(1)]
                    });
                }
            }
            else {
                isTrigger = false;
                if (currentScript) {
                    if (line[0] === '?') {
                        _this.throwParsingError("Invalid conditional, did you forget '+' at the start?", lineNum, line);
                        return;
                    }
                    var block = currentScript.addCommandBlock();
                    var command = _this.createDialogCommand(line, currentScript, lineNum);
                    block.commands.push(command);
                }
            }
        });
        if (currentScript) {
            var obj = currentScript.isValid(scene);
            var err = obj === null || obj === void 0 ? void 0 : obj.msg;
            if (err) {
                this.throwParsingError(err, obj.lineNum, lines[lines.length - 1]);
            }
        }
        return { triggers: triggers, scripts: scripts };
    };
    return ScriptParser;
}());
exports.ScriptParser = ScriptParser;
var scripts = {};
var triggers = {};
var callScriptStrings = [];
// export const loadRPGScript = async (scriptFileName: string, scene: Scene) => {
//   const url = `${RPGSCRIPT_LOAD_DIR}/${scriptFileName}.rpgscript`;
//   console.log('Loading script', url);
//   const src = await (await fetch(url)).text();
//   parseRPGScript(scriptFileName, src, scene);
// };
var parseRPGScript = function (scriptName, scriptSrc, scene) {
    var parser = new ScriptParser(scriptName);
    var _a = parser.parse(scriptSrc, scene), localTriggers = _a.triggers, localScripts = _a.scripts;
    Object.assign(scripts, localScripts);
    Object.assign(triggers, localTriggers);
};
exports.parseRPGScript = parseRPGScript;
var parseSingleScript = function (scriptSrc, scene) {
    var parser = new ScriptParser(scriptSrc);
    var localScripts = parser.parse(scriptSrc, scene).scripts;
    return localScripts;
};
exports.parseSingleScript = parseSingleScript;
var getScript = function (scriptName) {
    var script = scripts[scriptName];
    if (!script) {
        throw new Error("Cannot get script with name " + scriptName);
    }
    return script;
};
exports.getScript = getScript;
var getTrigger = function (triggerName) {
    var trigger = triggers[triggerName];
    if (!trigger) {
        throw new Error("Cannot get trigger with name " + triggerName);
    }
    return trigger;
};
exports.getTrigger = getTrigger;
var scriptExists = function (scriptName) {
    var script = scripts[scriptName];
    if (!script) {
        return false;
    }
    return true;
};
exports.scriptExists = scriptExists;
var triggerExists = function (triggerName) {
    var trigger = triggers[triggerName];
    if (!trigger) {
        return false;
    }
    return true;
};
exports.triggerExists = triggerExists;
var getScripts = function () { return scripts; };
exports.getScripts = getScripts;
var getTriggers = function () { return triggers; };
exports.getTriggers = getTriggers;
var getCallScriptStrings = function () { return callScriptStrings; };
exports.getCallScriptStrings = getCallScriptStrings;
