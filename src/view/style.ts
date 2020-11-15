import { h } from 'preact';
import picostyle, { Styles, StyleProps } from 'picostyle';
const ps = picostyle(h as any);

// const zoom = keyframes({
//   from: {
//     transform: 'scale(0.5)'
//   },
//   to: {
//     transform: 'scale(2)'
//   },
// })

// const Container = ps('div')({
//   animation: `${zoom} 300ms`,
// })

export default (cmptType: string, style: Styles | StyleProps): any => {
  const cmpt = ps(cmptType)(style);
  return cmpt;
};
