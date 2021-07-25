import { h } from 'preact';

const Expand = (props: { color: string }): h.JSX.Element => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <g class="" transform="translate(0,0)" style="">
        <path
          d="M64 64v128l48-48 48 48 32-32-48-48 48-48H64zm256 0l48 48-48 48 32 32 48-48 48 48V64H320zM64 320v128h128l-48-48 48-48-32-32-48 48-48-48zm288 0l-32 32 48 48-48 48h128V320l-48 48-48-48z"
          fill={props.color}
          fill-opacity="1"
        ></path>
      </g>
    </svg>
  );
};

export default Expand;
