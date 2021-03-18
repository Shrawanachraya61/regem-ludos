import { h } from 'preact';

const Circle = (props: { color: string }): h.JSX.Element => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <path
        d="M0 0h512v512H0z"
        fill="rgba(0, 0, 0, 0.0)"
        fill-opacity="1"
      ></path>
      <g class="" transform="translate(0,0)" style="">
        <path
          d="M256 23.05C127.5 23.05 23.05 127.5 23.05 256S127.5 488.9 256 488.9 488.9 384.5 488.9 256 384.5 23.05 256 23.05z"
          fill={props.color}
          fill-opacity="1"
        ></path>
      </g>
    </svg>
  );
};

export default Circle;
