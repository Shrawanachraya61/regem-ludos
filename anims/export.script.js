require('dotenv').config();
const { exec } = require('child_process');

const execAsync = async command => {
  return new Promise(resolve => {
    console.log(command);
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(err, stdout, stderr);
        return;
      }
      resolve();
    });
  });
};

const main = async () => {
  await execAsync(`cp -r txt/*.txt ${process.env.EXPORT_DIR}`);
  // await execAsync(`cp -r spritesheets/*.png ${process.env.EXPORT_DIR_IMAGES}`);
  // await execAsync(`cp -r props/*.png  ${process.env.EXPORT_DIR_IMAGES}`);
  // await execAsync(`cp -r stages/*.png  ${process.env.EXPORT_DIR_IMAGES}`);
  // await execAsync(`cp -r props/*.png ${process.env.EXPORT_DIR_TILED_PROPS}`);
  // await execAsync(`cp -r stages/*.png ${process.env.EXPORT_DIR_TILED_STAGES}`);
};
console.log(
  'exporting to dirs:',
  process.env.EXPORT_DIR,
  process.env.EXPORT_DIR_IMAGES,
  process.env.EXPORT_DIR_TILED_PROPS,
  process.env.EXPORT_DIR_TILED_STAGES
);
main();
