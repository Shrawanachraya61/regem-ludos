const createExplosionEffect = (x: number, y: number) => {
  const { x: px, y: py } = worldToPx(x, y);

  const elem = getGameInner();
  if (elem) {
    playSound('expl');
    const div = createElement('div');
    div.className = 'expl';
    div.style.position = 'absolute';
    div.style.left = px - 50 + 'px';
    div.style.top = py - 50 + 'px';
    elem.appendChild(div);
    setTimeout(() => {
      div.remove();
    }, 4000);
  }
};
