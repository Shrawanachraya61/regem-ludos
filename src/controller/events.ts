import { setMousePos } from 'model/misc';

export const initEvents = (): void => {
  const canvasElem = document.getElementById('canv');
  const { left, top, width, height } = canvasElem?.getBoundingClientRect() || {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  };
  window.addEventListener('mousemove', (ev: MouseEvent) => {
    const { clientX, clientY } = ev;
    let mouseX = clientX - left;
    let mouseY = clientY - top;
    if (mouseX > width) {
      mouseX = width;
    }
    if (mouseY > height) {
      mouseY = height;
    }
    setMousePos(mouseX, mouseY);
  });
};
