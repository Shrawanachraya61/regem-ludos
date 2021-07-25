/* @jsx h */
import { h, Ref } from 'preact';
import { useState } from 'preact/hooks';
import { style, MEDIA_QUERY_PHONE_WIDTH } from 'view/style';

interface IIframeShimProps {
  id?: string;
  src: string;
  width: string;
  height: string;
  expanded: boolean;
  loading: boolean;
  style?: Record<string, string>;
  ref?: Ref<any>;
}

const IframeBorder = style(
  'div',
  (props: {
    expanded: boolean;
    borderImageUrl: string;
    width: string;
    height: string;
  }) => {
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
  // prevents iframe from reloading while you're looking at it
  const [memoizedSrc] = useState(props.src);
  return (
    <IframeBorder
      expanded={props.expanded}
      borderImageUrl="res/img/arcade-border-1.png"
      width={props.width}
      height={props.height}
    >
      {props.loading ? (
        <div
          id="iframe-loading"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          Loading game...
          <img src="res/img/flower.svg" alt="loading" id="page-loading-icon" />
        </div>
      ) : null}
      <iframe
        id={props.id}
        ref={props.ref}
        src={memoizedSrc}
        style={{
          border: '0px',
          width: props.width,
          height: props.height,
          display: props.loading ? 'none' : 'block',
          ...(props.style ?? {}),
        }}
      ></iframe>
    </IframeBorder>
  );
};

export default IframeShim;
