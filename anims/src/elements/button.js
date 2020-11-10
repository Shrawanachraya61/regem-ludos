import React from 'react';

const Button = ({
  style,
  onClick,
  children,
  margin,
  type,
  disabled,
  className,
}) => {
  return (
    <div
      className={
        'button' +
        (type ? ' button-' + type : '') +
        (className ? ' ' + className : '') +
        (disabled ? ' button-disabled' : '')
      }
      style={{ display: 'inline-block', margin, ...style }}
      onMouseDown={ev => {
        ev.stopPropagation();
        ev.preventDefault();
      }}
      onClick={ev => {
        ev.stopPropagation();
        ev.preventDefault();
        if (onClick) {
          onClick(ev);
        }
      }}
    >
      <span className="no-select">{children}</span>
    </div>
  );
};

export default Button;
