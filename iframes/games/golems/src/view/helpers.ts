/*
global
G_model_getCtx
G_model_getScale
G_view_drawSprite
TILE_SIZE
*/

enum Colors {
  ENEMY = '#db604c',
  PLAYER = '#e0fc80',
  NEUTRAL_LIGHT = '#74c99e',
  NEUTRAL = '#317c87',
  ALT = '#b13353',
  BLACK = '#1a1016',
  WHITE = '#f6dbba',
}

const G_view_hexToRgba = (hex: string, alpha: number) => {
  const [r, g, b] = (hex.match(/\w\w/g) as any).map((x: string) =>
    parseInt(x, 16)
  );
  return `rgba(${r},${g},${b},${alpha})`;
};

const G_VIEW_INNER_HTML = 'innerHTML';

const G_VIEW_STYLE_ABSOLUTE = {
  position: 'absolute',
  left: '0',
  top: '0',
  width: '100%',
  height: '100%',
  boxSizing: 'border-box',
  padding: '8px',
};

const G_VIEW_STYLE_PANEL = {
  height: 'unset',
  border: '2px solid ' + Colors.WHITE,
  background: G_view_hexToRgba(Colors.BLACK, 0.75),
  pointerEvents: 'all',
  fontSize: '22px',
};

const G_view_appendChild = (parent: HTMLElement, child: HTMLElement) => {
  parent.appendChild(child);
};
const G_view_setClassName = (elem: HTMLElement, className: string) => {
  elem.className = className;
};
const G_view_getElementById = (id: string): HTMLElement | null =>
  document.getElementById(id);
const G_view_createElement = (
  name: string,
  innerHTML?: string,
  style?: { [key: string]: string }
): HTMLElement => {
  const elem = document.createElement(name);
  if (innerHTML) {
    elem[G_VIEW_INNER_HTML] = innerHTML;
  }
  if (style) {
    G_view_setStyle(elem, style);
  }
  return elem;
};
const G_view_setStyle = (
  elem: HTMLElement,
  style: { [key: string]: string | undefined }
) => {
  for (const i in style) {
    elem.style[i] = style[i];
  }
};

function G_view_fireEvent(el: any, type: string) {
  if (el.fireEvent) {
    el.fireEvent('on' + type);
  } else {
    var evObj = document.createEvent('Events');
    evObj.initEvent(type, true, false);
    el.dispatchEvent(evObj);
  }
}

const G_view_alignPosToOutsideOfBoundingBox = (
  innerBox: Rect,
  outerBox: Rect
) => {
  const [rx, ry, rw, rh] = innerBox;
  const [orx, ory, orw, orh] = outerBox;
  const ctx = G_model_getCtx();
  const { width, height } = ctx.canvas;
  const centerX = rx + rw / 2;
  const centerY = ry + rh / 2;
  const _leftAlign = () => {
    if (centerX <= width / 2) {
      return rx + rw;
    } else {
      return rx - orw;
    }
  };

  const _topAlign = () => {
    let ret = 0;
    if (ry < 0) {
      ret = 0;
    } else if (ry + orh > height) {
      ret = height - orh;
    } else {
      ret = ry;
    }

    return Math.min(672, ret);
  };

  return {
    left: _leftAlign(),
    top: Math.max(64, _topAlign()),
  };
};

const G_view_tileCoordsToPxCoords = (p: Point): Point => {
  const scale = G_model_getScale();
  return [p[0] * scale * TILE_SIZE, p[1] * scale * TILE_SIZE];
};
