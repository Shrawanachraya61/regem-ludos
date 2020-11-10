import React from 'react';
import { render } from 'react-dom';
import MainContainer from './cmpts/main-container';
import display from 'content/display';

async function init() {
  await display.loadImages();
  const txt = await display.loadTxt();
  await display.init(null, txt);
  Array.prototype.forEach.call(
    document.querySelectorAll('.loading'),
    el => (el.style.display = 'none')
  );
}

const div = document.createElement('div');
document.body.append(div);
async function main() {
  await init();
  render(<MainContainer />, div);
}
main().catch(e => {
  console.error(e);
  throw e;
});
