const fs = require('fs');
const path = require('path');
const rpgscript = require('./rpgscript');
const commands = require('./commands');

// const EventEmitter = require('events');

// function stdinLineByLine() {
//   const stdin = new EventEmitter();
//   let buff = '';

//   process.stdin
//     .on('data', (data) => {
//       buff += data;
//       const lines = buff.split(/[\r\n|\n]/);
//       buff = lines.pop();
//       lines.forEach((line) => stdin.emit('line', line));
//     })
//     .on('end', () => {
//       if (buff.length > 0) stdin.emit('line', buff);
//     });

//   return stdin;
// }

const printError = (fileName, lineNum, severity, msg) => {
  console.log(`${fileName}:${lineNum}--${severity}--${msg}`);
};

const checkCallScriptCommands = (name) => {
  const scripts = Object.keys(rpgscript.getScripts());
  const callScriptStrings = rpgscript.getCallScriptStrings();
  callScriptStrings.forEach(({ scriptName, lineNum, fileName }) => {
    if (fileName === 'linter' && !scripts.includes(scriptName)) {
      printError(
        name,
        lineNum,
        'Error',
        'No script exists with name "' + scriptName + '".'
      );
    }
  });
};

const getAllRpgscriptFiles = (scriptsDir, ignoreFileName) => {
  const files = fs.readdirSync(scriptsDir);
  let rpgscriptFileNames = [];

  for (let i = 0; i < files.length; i++) {
    const nextFileName = scriptsDir + '/' + files[i];

    if (files[i] === ignoreFileName) {
      continue;
    }

    const stat = fs.statSync(nextFileName);
    if (stat.isDirectory()) {
      rpgscriptFileNames = rpgscriptFileNames.concat(
        getAllRpgscriptFiles(nextFileName, ignoreFileName)
      );
    } else if (path.extname(nextFileName) === '.rpgscript') {
      rpgscriptFileNames.push(nextFileName);
    }
  }

  // console.log('FILENAMES', rpgscriptFileNames);

  return rpgscriptFileNames;
};

const main = async () => {
  const filePath = process.argv[2];
  const folderPath = process.argv[3];

  console.log('Lint: ', filePath, folderPath);

  if (!fs.existsSync(folderPath)) {
    throw new Error('No folder exists with name: ' + folderPath);
  }

  if (!fs.existsSync(filePath)) {
    throw new Error('No file exists with name: ' + filePath);
  }

  const fileName = path.basename(filePath);

  const rpgscriptFileNames = getAllRpgscriptFiles(folderPath, fileName);
  for (let i = 0; i < rpgscriptFileNames.length; i++) {
    const localFileName = rpgscriptFileNames[i];
    console.log('read project file', localFileName);
    const fileSrc = fs.readFileSync(localFileName).toString();
    try {
      rpgscript.parseRPGScript(path.basename(localFileName), fileSrc, {
        commands,
      });
    } catch (e) {
      printError(
        fileName,
        1,
        'error',
        `Problem encountered when parsing project directory in file ${path.basename(
          localFileName
        )}: ${String(e)}`
      );
      return;
    }
  }

  const stdinBuffer = fs.readFileSync(0);
  const fileSrc = stdinBuffer.toString();

  try {
    rpgscript.parseRPGScript('linter', fileSrc, {
      commands,
    });
  } catch (e) {
    const msg = String(e);
    const regex = /(.*): \{Line (\d+)\}(.+?):\s(.*) CONTENTS/;
    const matches = regex.exec(msg);
    if (matches) {
      printError(fileName, matches[2], matches[1], matches[4]);
    } else {
      console.log('Unknown error thrown from parser: ', String(e));
    }
  }

  checkCallScriptCommands(fileName);

  // const stdin = stdinLineByLine();
  // stdin.on('line', console.log);

  console.log('Linting done!');
};

const usage = () => {
  console.log('usage:');
  console.log('node linter <fileName> <folderName>');
};

main().catch((e) => {
  console.error('Encountered an error: ', e);
  console.log('Program exit with failure.');
});
