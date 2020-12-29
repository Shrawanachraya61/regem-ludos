import { h } from 'preact';

const Arrow = (props: {
  color: string;
  direction?: 'left' | 'right';
}): h.JSX.Element => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      style={props.direction === 'left' ? 'transform: rotate(180deg)' : ''}
    >
      {/* <path d="M0 0h512v512H0z" fill="rgba(0,0,0,0)" fill-opacity="1"></path> */}
      <g transform="translate(0,0)">
        <path
          d="M106.854 106.002a26.003 26.003 0 0 0-25.64 29.326c16 124 16 117.344 0 241.344a26.003 26.003 0 0 0 35.776 27.332l298-124a26.003 26.003 0 0 0 0-48.008l-298-124a26.003 26.003 0 0 0-10.136-1.994z"
          fill={props.color}
          fill-opacity="1"
        ></path>
      </g>
    </svg>
  );
};

export default Arrow;
