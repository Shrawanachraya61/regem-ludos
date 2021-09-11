import React from 'react';
import { render } from 'react-dom';
import MainContainer from './cmpts/main-container';
import display from 'content/display';

async function loadPrimary() {
  console.log('load file list');
  const files = await display.getImageList();
  await display.loadImages(files);
  console.log('load txt');
  const txt = await display.loadTxt();
  await display.loadRes(txt);
}

async function init() {
  console.time('load');
  console.log('load placeholder');
  await display.loadPlaceholderImage();
  console.log('load init');
  await display.init(null);
  console.log('load primary');
  await loadPrimary();
  Array.prototype.forEach.call(
    document.querySelectorAll('.loading'),
    el => (el.style.display = 'none')
  );
  console.timeEnd('load');
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
