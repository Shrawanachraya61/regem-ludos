import { h } from 'preact';

const Menu = (props: { color: string }): h.JSX.Element => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      {/* <path d="M0 0h512v512H0z" fill="rgba(0,0,0,255)" fill-opacity="1"></path> */}
      <g class="" transform="translate(0,0)" style="">
        <g class="" transform="translate(0,0)" style="">
          <path
            d="M32 96v64h448V96H32zm0 128v64h448v-64H32zm0 128v64h448v-64H32z"
            fill={props.color}
            fill-opacity="1"
          ></path>
        </g>
      </g>
    </svg>
  );
};

export default Menu;
