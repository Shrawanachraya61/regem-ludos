import { h } from 'preact';
import { useState } from 'preact/hooks';
import { style, MEDIA_QUERY_PHONE_WIDTH } from 'view/style';

interface IIframeShimProps {
  src: string;
  width: string;
  height: string;
  expanded: boolean;
}

const IframeBorder = style(
  'div',
  (props: { expanded: boolean; borderImageUrl: string, width: string, height: string }) => {
    return {
      border: '20px solid black',
      transition: 'width 0.25s, height 0.25s, marginTop 0.25s',
      borderImage: `url(${props.borderImageUrl}) 20 round`,
      width: props.expanded ? 'calc(100% - 40px)' : props.width,
      height: props.expanded ? 'calc(100% - 40px - 4rem)' : props.height,
      marginTop: props.expanded ? '4rem' : '0',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      pointerEvents: 'all',
      [MEDIA_QUERY_PHONE_WIDTH]: {
        width: props.expanded ? 'calc(100% - 40px)' : props.width,
        height: props.expanded ? 'calc(100% - 40px - 7.75rem)' : props.height,
        marginTop: props.expanded ? '7.75rem' : '0',
      },
    };
  }
);

const IframeShim = (props: IIframeShimProps) => {
  return (
    <IframeBorder
      expanded={props.expanded}
      borderImageUrl="res/img/arcade-border-1.png"
      width={props.width}
      height={props.height}
    >
      <iframe
        src={props.src}
        style={{
          border: '0px',
          width: props.width,
          height: props.height,
        }}
      ></iframe>
    </IframeBorder>
  );
};

export default IframeShim;
