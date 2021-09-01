const { exec } = require('child_process');
const fs = require('fs');
const minifyHtml = require('html-minifier').minify;

const outputDirName = 'public';

const CLIENT_FILES = ['public/client.js'];
const SERVER_FILES = ['public/server.js'];
const SHARED_FILE = 'public/shared.js';

console.log('Client Files', CLIENT_FILES);
console.log('Server Files', SERVER_FILES);
console.log('Shared File', SHARED_FILE);

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

let errorNum = 0;
const replaceErrors = str => {
  let a = str.slice();
  let b;
  do {
    b = a.match(/new Error\((.*)\)/);
    if (b) {
      a = a.slice(0, b.index) + errorNum++ + a.slice(b.index + b[0].length);
    }
  } while (b);
  return a;
};

const build = async () => {
  console.log('Concat files...');

  await execAsync('rm -rf .build && mkdir -p .build');

  let htmlFile = fs
    .readFileSync(`${__dirname}/../public/index.html`)
    .toString();
  const clientFile =
    CLIENT_FILES.reduce((prev, curr) => {
      console.log('read', __dirname + '/../' + curr);
      return (
        prev + '\n' + fs.readFileSync(__dirname + '/../' + curr).toString()
      );
    }, '(() => {\n') + '\n})()';
  const serverFile =
    SERVER_FILES.reduce((prev, curr) => {
      console.log('read', __dirname + '/../' + curr);
      return (
        prev + '\n' + fs.readFileSync(__dirname + '/../' + curr).toString()
      );
    }, '(() => {\n') + '\n})()';

  const sharedFile = fs
    .readFileSync(__dirname + '/../public/shared.js')
    .toString();

  console.log('\nWrite tmp files...');
  fs.writeFileSync(
    `${__dirname}/../.build/client.tmp.js`,
    clientFile.replace(/const /g, 'let ')
  );
  fs.writeFileSync(
    `${__dirname}/../.build/server.tmp.js`,
    replaceErrors(serverFile.replace(/const /g, 'let '))
  );
  fs.writeFileSync(`${__dirname}/../.build/shared.tmp.js`, sharedFile);
  fs.writeFileSync(`${__dirname}/../.build/index.tmp.html`, htmlFile);

  const terserArgs = [
    'passes=3',
    'pure_getters',
    'unsafe',
    'unsafe_math',
    'hoist_funs',
    'toplevel',
    // 'drop_console',
    'pure_funcs=[console.error,console.info,console.log,console.debug,console.warn]',
    'ecma=9',
  ];

  console.log('\nMinify code...');
  await execAsync(
    `${__dirname}/../node_modules/.bin/terser --compress ${terserArgs.join(
      ','
    )} --mangle -o ${__dirname}/../.build/client.js -- ${__dirname}/../.build/client.tmp.js`
  );
  await execAsync(
    `${__dirname}/../node_modules/.bin/terser --compress ${terserArgs.join(
      ','
    )} --mangle -o ${__dirname}/../.build/server.js -- ${__dirname}/../.build/server.tmp.js`
  );
  await execAsync(
    `${__dirname}/../node_modules/.bin/terser --compress ${terserArgs.join(
      ','
    )} --mangle -o ${__dirname}/../.build/shared.js -- ${__dirname}/../.build/shared.tmp.js`
  );
  await execAsync(
    `uglifycss --output ${__dirname}/../.build/style.css ${__dirname}/../public/style.css`
  );
  console.log('\nminify html...');
  fs.writeFileSync(
    '.build/index.html',
    minifyHtml(htmlFile, {
      removeAttributeQuotes: true,
      collapseWhitespace: true,
      html5: true,
      minifyCSS: true,
      minifyJS: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeTagWhitespace: true,
      removeComments: true,
      useShortDoctype: true,
    })
  );

  // console.log('\nerror chicanery...');
  // let minifiedClientFile = String(
  //   fs.readFileSync(`${__dirname}/../.build/client.js`, {
  //     encoding: 'utf8',
  //     flag: 'r',
  //   })
  // );
  // minifiedClientFile = minifiedClientFile.replace(
  //   /Error\((.*?)\)/g,
  //   'Error("")'
  // );
  // fs.writeFileSync(`${__dirname}/../.build/client.js`, minifiedClientFile);
  // let minifiedServerFile = String(
  //   fs.readFileSync(`${__dirname}/../.build/server.js`, {
  //     encoding: 'utf8',
  //     flag: 'r',
  //   })
  // );
  // minifiedServerFile = minifiedServerFile.replace(
  //   /Error\((.*?)\)/g,
  //   'Error("")'
  // );
  // fs.writeFileSync(`${__dirname}/../.build/server.js`, minifiedServerFile);

  await execAsync('rm -rf dist && mkdir -p dist');
  await execAsync(
    `cp .build/client.js dist && cp .build/server.js dist && cp .build/shared.js dist && cp .build/style.css dist && cp .build/index.html dist`
  );

  console.log('\nZip (command line)...');
  try {
    await execAsync(
      `cd .build && zip -9 ${__dirname}/../${outputDirName}.zip client.js server.js shared.js style.css index.html`
    );
    console.log(
      await execAsync(`stat -c '%n %s' ${__dirname}/../${outputDirName}.zip`)
    );
  } catch (e) {
    console.log('failed zip', e);
  }
  try {
    await execAsync(`advzip -z -4 ${__dirname}/../${outputDirName}.zip`);
    console.log(
      await execAsync(`stat -c '%n %s' ${__dirname}/../${outputDirName}.zip`)
    );
  } catch (e) {
    console.log('failed adv zip', e);
  }
  const result = await execAsync(
    `stat -c '%n %s' ${__dirname}/../${outputDirName}.zip`
  );
  await execAsync(`mv ${outputDirName}.zip dist/OrbitalGolfing.zip`);
  const bytes = parseInt(result.split(' ')[1]);
  const kb13 = 13312;
  console.log(`${bytes}b of ${kb13}b (${((bytes * 100) / kb13).toFixed(2)}%)`);
};

build().catch(e => {
  console.log('Build error', e);
});
