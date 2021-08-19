const getElement = (id: string) => {
  return document.getElementById(id) as HTMLElement;
};

const showElement = (elem: HTMLElement, flex?: boolean) => {
  elem.style.display = flex ? 'flex' : 'block';
};

const hideElement = (elem: HTMLElement) => {
  elem.style.display = 'none';
};

const setHTML = (elem: HTMLElement, html: string) => {
  elem.innerHTML = html;
};
