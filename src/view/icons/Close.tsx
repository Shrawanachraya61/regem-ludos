import { h } from 'preact';

const Close = (props: { color: string }): h.JSX.Element => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      id="svg2"
      viewBox="0 0 84.853 84.853"
      version="1.0"
    >
      <g id="layer1" transform="translate(-153.29 -132.79)">
        <g
          id="g2762"
          transform="matrix(.70711 -.70711 .70711 .70711 -66.575 189.71)"
          fill={props.color}
        >
          <rect id="rect1872" y="165.22" width="100" x="145.71" height="20" />
          <rect
            id="rect1874"
            transform="rotate(90)"
            height="20"
            width="100"
            y="-205.71"
            x="125.22"
          />
        </g>
      </g>
    </svg>
  );
};

export default Close;
