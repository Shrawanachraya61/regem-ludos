// This file alters the html file in the public dir to point at the
// debug version of lib.jss and lib.css so the game can be tested from
// the command line

const fs = require('fs');
let indexHtml = fs.readFileSync('public/index.html').toString();
indexHtml = indexHtml.replace(/\.\.\/lib.js/g, '../../lib.js');
indexHtml = indexHtml.replace(/\.\.\/lib.css/g, '../../lib.css');
console.log('Writing debug version of index.html in dist folder...');
fs.writeFileSync('dist/index.html', indexHtml);
console.log('Done!');
