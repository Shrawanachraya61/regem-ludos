import { h } from 'preact';

const SpeakerOff = (props: { color: string }): h.JSX.Element => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <g class="" transform="translate(0,0)" style="">
        <path
          d="M275.5 96l-96 96h-96v128h96l96 96V96zm50.863 89.637l-12.726 12.726L371.273 256l-57.636 57.637 12.726 12.726L384 268.727l57.637 57.636 12.726-12.726L396.727 256l57.636-57.637-12.726-12.726L384 243.273l-57.637-57.636z"
          fill={props.color}
          fill-opacity="1"
        ></path>
      </g>
    </svg>
  );
};

export default SpeakerOff;
