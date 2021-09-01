const panZoomState = {
  x: 0,
  y: 0,
  prevX: 0,
  prevY: 0,
  mx: 0,
  my: 0,
  scale: 1,
  panning: false,
  zooming: false,
  touchStartX: 0,
  touchStartY: 0,
  touchDist: 0,
};
const gameWidth = 8000;
const gameHeight = 8000;
const panZoomTransition = 'transform 200ms ease-out';

const setPanZoomPosition = async (x: number, y: number, scale: number) => {
  panZoomState.x = x;
  panZoomState.y = y;
  panZoomState.scale = 1;
  panZoom();

  await new Promise(resolve => setTimeout(resolve, 200));

  panZoomState.mx = window.innerWidth / 2;
  panZoomState.my = window.innerHeight / 2;
  panZoomToFocalWithScale(scale);
};

const panZoomToFocalWithScale = (scale: number) => {
  const [focalX, focalY] = clientToPanZoomCoords(
    panZoomState.mx,
    panZoomState.my
  );
  panZoomState.scale = scale;
  const [postClientX, postClientY] = panZoomToClientCoords(focalX, focalY);
  const clientXDiff = panZoomState.mx - postClientX;
  const clientYDiff = panZoomState.my - postClientY;
  panZoomState.x -= clientXDiff;
  panZoomState.y += clientYDiff;
  panZoom();
};

const clientToPanZoomCoords = (clientX: number, clientY: number) => {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  return [
    Math.round(
      (panZoomState.x + clientX - screenWidth / 2) / panZoomState.scale
    ),
    Math.round(
      (panZoomState.y + screenHeight / 2 - clientY) / panZoomState.scale
    ),
  ];
};

const panZoomToClientCoords = (x: number, y: number) => {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  return [
    Math.round(screenWidth / 2 + panZoomState.scale * x - panZoomState.x),
    Math.round(screenHeight / 2 - panZoomState.scale * y + panZoomState.y),
  ];
};

const getTouchCenterAndDistance = touches => {
  const getDistance = (x1, y1, x2, y2) => {
    return Math.round(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
  };

  const getCenter = (x1, y1, x2, y2) => {
    return {
      x: Math.min(x1, x2) + Math.abs(x2 - x1) / 2,
      y: Math.min(y1, y2) + Math.abs(y2 - y1) / 2,
    };
  };

  const { clientX: x1, clientY: y1 } = touches[1];
  const { clientX: x2, clientY: y2 } = touches[0];
  return {
    center: getCenter(x1, y1, x2, y2),
    d: getDistance(x1, y1, x2, y2),
  };
};

const registerPanZoomListeners = () => {
  console.log('register panzoom listeners');

  const game = getGame();
  game.style.transition = panZoomTransition;
  game.addEventListener('mousedown', e => {
    if (e.button === 0) {
      getGame().style.transition = 'unset';
      e.preventDefault();
      panZoomState.panning = true;
      panZoomState.touchStartX = e.clientX;
      panZoomState.touchStartY = e.clientY;
      panZoomState.prevX = panZoomState.x;
      panZoomState.prevY = panZoomState.y;
      panZoom();
    }
  });
  game.addEventListener('mouseup', e => {
    if (e.button === 0) {
      getGame().style.transition = panZoomTransition;
      panZoomState.panning = false;
      panZoomState.zooming = false;
      // G_isPanning = false;
    }
  });
  game.addEventListener('mouseleave', () => {
    panZoomState.zooming = false;
    panZoomState.panning = false;
    // G_isPanning = false;
  });
  game.addEventListener('mousemove', e => {
    panZoomState.mx = e.clientX;
    panZoomState.my = e.clientY;
    if (panZoomState.panning) {
      const deltaX = e.clientX - panZoomState.touchStartX;
      const deltaY = e.clientY - panZoomState.touchStartY;
      panZoomState.x = panZoomState.prevX - deltaX;
      panZoomState.y = panZoomState.prevY + deltaY;
      panZoom();
    }
  });

  game.addEventListener('touchstart', e => {
    e.preventDefault();
    const touches = e.touches;
    const numTouches = touches.length;
    if (numTouches) {
      getGame().style.transition = 'unset';
      panZoomState.panning = true;
      if (numTouches >= 2) {
        panZoomState.zooming = true;
        // G_isPanning = true;
        const {
          center: { x, y },
          d,
        } = getTouchCenterAndDistance(touches);
        panZoomState.touchDist = d;
        panZoomState.touchStartX = x;
        panZoomState.touchStartY = y;
      } else {
        panZoomState.touchStartX = touches[0].clientX;
        panZoomState.touchStartY = touches[0].clientY;
      }
      panZoomState.prevX = panZoomState.x;
      panZoomState.prevY = panZoomState.y;
      panZoom();
    }
  });

  game.addEventListener('touchend', ev => {
    if (ev.touches.length === 0) {
      getGame().style.transition = panZoomTransition;
      panZoomState.panning = false;
      panZoomState.zooming = false;
      // G_isPanning = false;
    }
  });

  game.addEventListener('touchmove', e => {
    const touches = e.touches;
    const numTouches = touches.length;
    if (panZoomState.panning || panZoomState.zooming) {
      let deltaX = 0;
      let deltaY = 0;
      if (numTouches >= 2) {
        const {
          center: { x, y },
          d,
        } = getTouchCenterAndDistance(touches);

        // deltaX = x - panZoomState.touchStartX;
        // deltaY = y - panZoomState.touchStartY;
        // panZoomState.x = panZoomState.prevX - deltaX;
        // panZoomState.y = panZoomState.prevY + deltaY;
        // panZoom();

        if (Math.abs(d - panZoomState.touchDist) > 2) {
          const increment = 0.042;
          let nextScale =
            panZoomState.scale +
            (d < panZoomState.touchDist ? -increment : increment);
          if (nextScale < 0.25) {
            nextScale = 0.25;
          } else if (nextScale > 1.5) {
            nextScale = 1.5;
          }
          panZoomState.mx = x;
          panZoomState.my = y;
          panZoomToFocalWithScale(nextScale);
          panZoomState.touchDist = d;
        }
      } else {
        if (!panZoomState.zooming) {
          const touch = e.touches[0];
          deltaX = touch.clientX - panZoomState.touchStartX;
          deltaY = touch.clientY - panZoomState.touchStartY;
          panZoomState.x = panZoomState.prevX - deltaX;
          panZoomState.y = panZoomState.prevY + deltaY;
          panZoom();
        }
      }
    }
  });

  const getScrollDirection = e => {
    const increment = 0.15;
    const delta = Math.max(-1, Math.min(1, e.wheelDelta || -e.detail));
    let nextScale = panZoomState.scale + (delta < 0 ? -increment : increment);
    if (nextScale < 0.5) {
      nextScale = 0.5;
    } else if (nextScale > 1.5) {
      nextScale = 1.5;
    }
    panZoomToFocalWithScale(nextScale);
  };

  game.addEventListener('DOMMouseScroll', getScrollDirection, false);
  game.addEventListener('mousewheel', getScrollDirection, false);
};

const panZoom = () => {
  const game: any = getGame();
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  const transform = `translate(${
    -gameWidth / 2 + screenWidth / 2 - panZoomState.x
  }px, ${-gameHeight / 2 + screenHeight / 2 + panZoomState.y}px) scale(${
    panZoomState.scale
  })`;
  game.style.transform = transform;
};

document.addEventListener(
  'touchmove',
  function (event: any) {
    event = event.originalEvent || event;
    if (event.scale !== undefined && event.scale !== 1) {
      event.preventDefault();
    }
  },
  false
);
