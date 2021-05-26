import { h } from 'preact';

const Cursor = (props: { color: string }): h.JSX.Element => {
  return (
    <svg
      style="transform: rotate(75deg); filter: drop-shadow(1px 1px 0px #222) drop-shadow(-1px -1px 0px #222);"
      stroke={props.color}
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M21.1568 4.15379C21.5068 3.32658 20.6734 2.49321 19.8462 2.84319L3.46966 9.77172C2.60871 10.136 2.67381 11.3772 3.56814 11.6494L8.7707 13.2327C9.72737 13.5239 10.4761 14.2726 10.7672 15.2293L12.3506 20.4318C12.6228 21.3262 13.864 21.3913 14.2283 20.5303L21.1568 4.15379ZM19.0669 1.00125C21.5485 -0.048667 24.0486 2.45145 22.9987 4.93307L16.0702 21.3096C14.9775 23.8924 11.2538 23.6971 10.4373 21.0142L8.85389 15.8116C8.75683 15.4927 8.50727 15.2432 8.18837 15.1461L2.98581 13.5627C0.302836 12.7462 0.107539 9.02252 2.69038 7.92979L19.0669 1.00125Z"
        fill={props.color}
      />
    </svg>
  );
};

export default Cursor;
