const { exec } = require('child_process');

// This script goes through all the directories given to it and runs the 'yarn build'
// command in each directory.  It will then copy the 'dist' folder from each directory
// into the upper level 'dist' folder.
// use `node build-iframes.js ?dev <iframe1> <iframe2> ... <iframeN>'

const execAsync = async command => {
  return new Promise(resolve => {
    console.log(command);
    const execObj = exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(err, stdout, stderr);
        return;
      }
      resolve(stdout);
    });

    execObj.stdout.on('data', function (data) {
      console.log(data);
    });
  });
};

async function main() {
  const isDev = process.argv[2] === 'dev';
  const folderNames = isDev ? process.argv.slice(3) : process.argv.slice(2);
  if (folderNames.length) {
    for (let i = 0; i < folderNames.length; i++) {
      const folderName = folderNames[i];
      console.log('[BUILD IFRAME]', '------', folderName, '------');
      await execAsync(
        `yarn --cwd ${__dirname}/../iframes/${folderName} build${
          isDev ? ':dev' : ''
        }`
      );
      const dest = `${__dirname}/../iframes/dist/${folderName}/dist`;
      await execAsync(`mkdir -p ${dest}`);
      await execAsync(
        `cp -v ${__dirname}/../iframes/${folderName}/dist/* ${dest}`
      );
    }
  } else {
    throw new Error('No folder specified.');
  }
}
main();
