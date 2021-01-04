const { exec } = require('child_process');

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
  const folderNames = process.argv.slice(2);
  if (folderNames.length) {
    for (let i = 0; i < folderNames.length; i++) {
      const folderName = folderNames[i];
      console.log('[BUILD IFRAME]', folderName, '------');
      await execAsync(`yarn --cwd ${__dirname}/../iframes/${folderName} build`);
      const dest = `${__dirname}/../iframes/dist/${folderName}/`;
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
