import React from 'react';
import { colors } from 'utils';

const Text = ({
  type,
  style,
  ownLine,
  lineHeight,
  centered,
  color,
  noSelect,
  children,
  styles,
}) => {
  let elem = null;
  switch (type) {
    case 'title':
      elem = (
        <span
          style={{
            fontWeight: 'bold',
            fontSize: '32px',
            ...style,
          }}
        >
          {children}
        </span>
      );
      break;
    case 'bold':
      elem = <span style={{ fontWeight: 'bold', ...style }}>{children}</span>;
      break;
    case 'container-label':
      elem = (
        <span style={{ fontWeight: 'bold', fontSize: '18px', ...style }}>
          {children}
        </span>
      );
      break;
    case 'body':
      elem = <span style={{ ...style }}>{children}</span>;
      break;
    case 'body-ellipsis':
      elem = <div style={{ ...style }}>{children}</div>;
      break;
    case 'error':
      elem = (
        <span style={{ color: colors.lightRed, fontSize: '14px', ...style }}>
          {children}
        </span>
      );
      break;
    default:
      elem = <span style={{ ...style }}>{children}</span>;
  }

  const cStyles = {
    marginBottom: lineHeight,
    textAlign: centered ? 'center' : null,
    color,
    ...styles,
  };

  if (ownLine) {
    return (
      <div className={noSelect ? 'no-select' : ''} style={cStyles}>
        {elem}
      </div>
    );
  } else {
    return (
      <span className={noSelect ? 'no-select' : ''} style={cStyles}>
        {elem}
      </span>
    );
  }
};

export default Text;
