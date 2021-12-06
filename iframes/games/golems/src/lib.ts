/*
global
G_superfine_h
G_superfine_text
patch
*/

const styleObjToString = (style: { [key: string]: string }): string => {
  const ret: string[] = [];
  for (const origLabel in style) {
    let label = '';
    for (let ind = 0; ind < origLabel.length; ind++) {
      const ch = origLabel[ind];
      const lowerCh = ch.toLowerCase();
      if (ch === lowerCh) {
        label += ch;
      } else {
        label += '-' + lowerCh;
      }
    }
    ret.push(`${label}:${style[origLabel]}`);
  }
  return ret.join(';');
};

// Superfine compatibility with TypeScript
type SuperfineElement = {} | null;
const G_superfine_patch = (parent: HTMLElement, vDom: SuperfineElement) => {
  patch(parent, vDom);
};

// TypeScript compiler changes all jsx to 'React.createElement' calls in *.tsx files
// when jsx is set to 'react'.  This can be leveraged as an alias for the Superfine 'h'
// and 'text' calls with some minor changes to the arguments.
/*eslint-disable-line no-unused-vars*/ const React = {
  createElement: function (type: string, props: any): SuperfineElement {
    const subChildren: any = [];

    const style = props?.style;
    if (style) {
      props.style = styleObjToString(style);
    }

    const children = Array.prototype.slice.call(arguments, 2);
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (typeof child === 'string' || typeof child === 'number') {
        subChildren.push(G_superfine_text(child));
      } else if ((child as SuperfineElement[])?.length !== undefined) {
        for (let j = 0; j < child.length; j++) {
          if (child[j]) {
            subChildren.push(child[j]);
          }
        }
      } else {
        // if (!child.type) {
        //   throw new Error(
        //     'Invalid child provided to superfine: ' + JSON.stringify(child)
        //   );
        // }
        subChildren.push(child);
      }
    }
    return G_superfine_h(type, props || {}, subChildren);
  },
};
