import { h } from 'preact';

const Sword = (props: { color: string }): h.JSX.Element => {
  return (
    <svg
      fill={props.color}
      stroke={props.color}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
    >
      <path d="M0 0h512v512H0z" fill="rgba(0, 0, 0, 0)" fill-opacity="0"></path>
      <g class="" transform="translate(0,0)" style="">
        <path
          d="M256 16c25 24 100 72 150 72v96c0 96-75 240-150 312-75-72-150-216-150-312V88c50 0 125-48 150-72z"
          fill={props.color}
          fill-opacity="1"
        ></path>
      </g>
    </svg>
  );
};

export default Sword;
