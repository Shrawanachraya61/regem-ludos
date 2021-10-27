import { h } from 'preact';

const Contract = (props: { color: string }): h.JSX.Element => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <g class="" transform="translate(0,0)" style="">
        <path
          d="M96 64L64 96l48 48-48 48h128V64l-48 48-48-48zm224 0v128h128l-48-48 48-48-32-32-48 48-48-48zM64 320l48 48-48 48 32 32 48-48 48 48V320H64zm256 0v128l48-48 48 48 32-32-48-48 48-48H320z"
          fill={props.color}
          fill-opacity="1"
        ></path>
      </g>
    </svg>
  );
};

export default Contract;