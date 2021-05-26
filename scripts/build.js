const { exec } = require('child_process');
const fs = require('fs');
const minifyHtml = require('html-minifier').minify;

const outputDirName = process.argv[2];

const CLIENT_FILES = ['../main.js'];

console.log('Client Files', CLIENT_FILES);

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
  console.log('Concat files...');

  let htmlFile = fs
    .readFileSync(`${__dirname}/../index.html`)
    .toString()
    .replace('src/main.js', 'main.js');
  const mainFile = (
    CLIENT_FILES.reduce((prev, curr) => {
      return (
        prev +
        '\n' +
        fs
          .readFileSync(__dirname + '/../' + outputDirName + '/' + curr)
          .toString()
      );
    }, '(() => {\n') + '\n})()'
  ).replace(
    /RPGSCRIPT_LOAD_DIR = '(.*)'/,
    `RPGSCRIPT_LOAD_DIR = 'res/rpgscript'`
  );

  await execAsync(
    `rm -rf ${__dirname}/../.build ${__dirname}/../${outputDirName}.zip`
  );
  await execAsync(`mkdir -p ${__dirname}/../.build/res`);
  await execAsync(`cp -r ${__dirname}/../res/ ${__dirname}/../.build/ || :`);
  await execAsync(
    `cp -r ${__dirname}/../index.html ${__dirname}/../.build/ || :`
  );
  await execAsync(`rm -rf ${__dirname}/../${outputDirName}/*.map`);
  fs.writeFileSync(
    `${__dirname}/../.build/main.tmp.js`,
    mainFile.replace(/const /g, 'let ')
  );
  fs.writeFileSync(`${__dirname}/../.build/index.tmp.html`, htmlFile);

  const terserArgs = [
    'passes=3',
    'pure_getters',
    'unsafe',
    'unsafe_math',
    'hoist_funs',
    'toplevel',
    // 'drop_console',
    'pure_funcs=[console.info,console.log,console.debug,console.warn]',
    'ecma=9',
  ];

  console.log('\nMinify code...');
  await execAsync(`mkdir -p ${__dirname}/../dist`);
  await execAsync(
    `terser --compress ${terserArgs.join(
      ','
    )} --mangle -o ${__dirname}/../.build/main.js -- ${__dirname}/../.build/main.tmp.js`
  );
  await execAsync(
    `terser --keep-fnames -o ${__dirname}/../dist/almond.js -- ${__dirname}/../almond.js`
  );
  await execAsync('uglifycss --output dist/styles.css styles.css');
  console.log('minify html...');
  fs.writeFileSync(
    '.build/index.html',
    // htmlFile
    minifyHtml(htmlFile, {
      removeAttributeQuotes: true,
      // collapseWhitespace: true,
      html5: true,
      // minifyCSS: true,
      // minifyJS: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeTagWhitespace: true,
      removeComments: true,
      useShortDoctype: true,
    })
  );
  await execAsync(
    `cp .build/index.html dist && cp .build/main.js dist && cp -r .build/res dist`
  );

  console.log('\nZip (command line)...');
  await execAsync(
    `cd .build && zip -9 ${__dirname}/../${outputDirName}.zip index.html main.js res/* res/snd/* res/snd/foley/* res/snd/music/* res/img/* res/bg/* res/rpgscript/*`
  );
  console.log(
    await execAsync(`stat -c '%n %s' ${__dirname}/../${outputDirName}.zip`)
  );
  await execAsync(`mv src.zip dist/Main.zip`);
  const result = await execAsync(`stat -c '%n %s' dist/main.js`);
  const bytes = parseInt(result.split(' ')[1]);
  const kb13 = 13312;
  console.log(`${bytes}b of ${kb13}b (${((bytes * 100) / kb13).toFixed(2)}%)`);
};

build();
