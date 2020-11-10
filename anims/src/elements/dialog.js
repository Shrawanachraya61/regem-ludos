import React from 'react';
import Button from 'elements/button';
import { colors } from 'utils';

const Dialog = ({
  title,
  content,
  onConfirm,
  confirmText,
  onCancel,
  cancelText,
  open,
}) => {
  if (!open) {
    return <></>;
  }

  return (
    <div
      style={{
        zIndex: 99,
        position: 'fixed',
        left: 0,
        top: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      }}
    >
      <div
        style={{
          minWidth: 100,
          border: `2px solid ${colors.white}`,
          backgroundColor: colors.black,
          textAlign: 'left',
          padding: '10px',
        }}
      >
        {title ? (
          <div style={{ fontSize: 32, textAlign: 'center' }}>{title}</div>
        ) : null}
        <div style={{ margin: '5px' }}>{content}</div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div
            style={{
              margin: '10px',
            }}
          >
            <Button onClick={onConfirm} type="primary">
              {confirmText || 'OK'}
            </Button>
          </div>
          {onCancel && (
            <div
              style={{
                margin: '10px',
              }}
            >
              <Button onClick={onCancel} type="cancel">
                {cancelText || 'Cancel'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dialog;
