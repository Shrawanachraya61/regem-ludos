import fetchMock from 'jest-fetch-mock';
import fs from 'fs';

import { initConsole, disableConsole } from '../src/view/console';

initConsole();
disableConsole();
(window as any).TEST = true;

jest.mock('preact/hooks', () => ({
  ...jest.requireActual('preact/hooks'),
  useEffect: jest.fn(),
}));

jest.mock('model/sound', () => ({
  ...jest.requireActual('model/sound'),
  playSound: jest.fn(),
  playSoundName: jest.fn(),
  getCurrentMusic: jest.fn(),
  stopCurrentMusic: jest.fn(),
}));

// jest.mock('preact/hooks', () => {
//   return {
//     useState: defaultValue => {
//       return [defaultValue];
//     },
//     useReducer: useReducer,
//     useEffect: () => {},
//     useRef: () => {
//       return null;
//     },
//   };
// });

import * as animsImport from 'model/animation';
const anims = animsImport as any;

import * as spritesImport from 'model/sprite';
const sprites = spritesImport as any;

fetchMock.enableMocks();
fetchMock.mockResponse(async req => {
  let respText = '';

  if (/rpgscript/.test(req.url)) {
    respText = fs.readFileSync(__dirname + '/../' + req.url).toString();
  }
  if (/res.txt/.test(req.url)) {
    respText = fs.readFileSync(__dirname + '/../' + req.url).toString();
  }
  // console.log('MOCK RESPONSE', req.url);

  return respText;
});

HTMLCanvasElement.prototype.getContext = (() => {
  return {};
}) as any;

(window as any).JSZip = {
  loadAsync: jest.fn().mockImplementation(() => {
    return {
      files: [],
    };
  }),
};

jest.spyOn(anims, 'createAnimation');
anims.createAnimation.mockImplementation(() => {
  return new anims.Animation();
});
jest.spyOn(anims, 'hasAnimation');
anims.hasAnimation.mockImplementation(() => {
  return true;
});

jest.spyOn(sprites, 'getSprite');
sprites.getSprite.mockImplementation(() => {
  return [null, 0, 0, 0, 0];
});

jest.spyOn(sprites, 'loadImageAsSprite');
sprites.loadImageAsSprite.mockImplementation(() => {
  return [null, 0, 0, 0, 0];
});

jest.spyOn(sprites, 'loadImageAsSpritesheet');
sprites.loadImageAsSpritesheet.mockImplementation(() => {
  return [null, 0, 0, 0, 0];
});
