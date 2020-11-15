import { h } from 'preact';
import picostyle, { Styles, StyleProps } from 'picostyle';
const ps = picostyle(h as any);

export default (cmptType: string, style: Styles | StyleProps): any => {
  const cmpt = ps(cmptType)(style);
  return cmpt;
};
