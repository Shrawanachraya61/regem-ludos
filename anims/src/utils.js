export function normalize(x, a, b, c, d) {
  return c + ((x - a) * (d - c)) / (b - a);
}

export function randomId() {
  let ret = '';
  const str = '0123456789abcdefghijklmnopqrstuvwxyz';
  for (let i = 0; i < 6; i++) {
    ret += str[Math.floor(Math.random() * str.length)];
  }
  return ret;
}

export const localStore = (function(a) {
  return function(c, d) {
    return d === undefined ? a[c] : (a[c] = d);
  };
})(window.localStorage || {});

export const colors = {
  white: '#F8F8F8',
  grey: '#8D87A2',
  darkGrey: '#302C2E',
  lightBlue: '#42CAFD',
  blue: '#3978A8',
  darkBlue: '#2E3740',
  veryDarkBlue: '#101E29',
  black: '#000',
  lightGreen: '#B6D53C',
  green: '#3F7E00',
  darkGreen: '#005F1B',
  lightRed: '#E1534A',
  red: '#A93B3B',
  darkRed: '#5E3643',
  purple: '#AE57A4',
  darkPurple: '#564064',
  darkerPurple: '#39314B',
  lightBlack: '#101E29',
};

export const spritesheetModes = {
  ADD_FRAME: 'add-frame',
  REMOVE_FRAME: 'remove-frame',
  CADENCE: 'cadence',
  PROP: 'prop',
};

global.localStore = localStore;
