const getElement = (id: string) => {
  return document.getElementById(id) as HTMLElement;
};

const showElement = (elem: HTMLElement, flex?: boolean) => {
  elem.style.display = flex ? 'flex' : 'block';
};

const hideElement = (elem: HTMLElement) => {
  elem.style.display = 'none';
};

const createElement = (name: string) => {
  return document.createElement(name);
};

const setHTML = (elem: HTMLElement, html: string) => {
  elem.innerHTML = html;
};

const getColor = (color: string, dark?: boolean): string => {
  if (!dark) {
    return (
      {
        blue: '#bbf',
        red: '#fbb',
        green: '#bfb',
        purple: '#b52db5',
      }[color] ?? color
    );
  }

  return (
    {
      blue: '#005',
      red: '#500',
      grey: 'black',
      orange: '#563903',
      yellow: 'brown',
      purple: '#340667',
      green: '#020',
    }[color] ?? color
  );
};

const getColorStyles = (color: string) => {
  return `color: ${getColor(color, true)}; background: ${getColor(color)}`;
};
