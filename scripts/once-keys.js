const fs = require('fs');
const uuid = require('uuid');

/*
  The purpose of this script is to analyze all RPGSCRIPT files inside the src/rpgscript
  directory and replace all invocations of 'once()' to instead be 'once(<random-id>)'.

  The game engine generates an id for 'once()' lines based on the line of code it's on,
  which is not reliable in a production release, since a tweak to the file may break
  every single generated 'once()' id inside of a player's save file.  If each 'once()'
  invocation has instead its own random id, then modifying the file will keep that
  reference and the player's save file remains valid.
*/

const isDirectoryAsync = fileName => {
  return new Promise((resolve, reject) => {
    fs.stat(fileName, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats.isDirectory());
      }
    });
  });
};

const readdirAsync = dirName => {
  return new Promise((resolve, reject) => {
    fs.readdir(dirName, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

const readFileAsStringAsync = filePath => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, file) => {
      if (err) {
        reject(err);
      } else {
        resolve(file.toString());
      }
    });
  });
};

const writeFileAsync = (filePath, strBody) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, strBody, err => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
};

const getFilePaths = async dirName => {
  let ret = [];
  const files = await readdirAsync(dirName);
  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    if (await isDirectoryAsync(dirName + '/' + fileName)) {
      ret = ret.concat(await getFilePaths(dirName + '/' + fileName));
    } else {
      ret.push(dirName + '/' + fileName);
    }
  }
  return ret;
};

const replaceOnceKeys = async filePath => {
  let strBody = await readFileAsStringAsync(filePath);
  const regex = /once\([\s]*\)/;
  let ct = 0;
  while (strBody.search(regex) > -1) {
    ct++;
    strBody = strBody.replace(
      regex,
      `once('${uuid.v4().replace('-', '').substring(0, 8)}')`
    );
  }

  if (ct > 0) {
    console.log('- writing', filePath);
    console.log('  ' + ct + ' replacements made.');
    return writeFileAsync(filePath, strBody);
  }
};

const main = async () => {
  const root = __dirname + '/../src/rpgscript';
  console.log('Replace once keys in dir: ' + root);
  const filePaths = await getFilePaths(root);
  await Promise.all(filePaths.map(replaceOnceKeys));
  console.log('Replace once keys completed.');
};

main();
