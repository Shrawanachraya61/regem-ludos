const { exec } = require('child_process');
const fs = require('fs');
const minifyHtml = require('html-minifier').minify;

const execAsync = async command => {
  return new Promise(resolve => {
    console.log(command);
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(err, stdout, stderr);
        return;
      }
      resolve(stdout);
    });
  });
};

const build = async () => {
  // await execAsync('uglifycss --output dist/styles.css styles.css');
  await execAsync(`cp ${__dirname}/../src/styles.css ${__dirname}/dist`);
};

build();
