/* @jsx h */
import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { style, MEDIA_QUERY_PHONE_WIDTH, colors } from 'view/style';

interface IIframeShimProps {
  id?: string;
  src: string;
  width: string;
  height: string;
  expanded: boolean;
  loading: boolean;
  style?: Record<string, string>;
  ref: any;
  borderImageUrl?: string;
}

const IframeBorder = style(
  'div',
  (props: {
    expanded: boolean;
    borderImageUrl?: string;
    width: string;
    height: string;
  }) => {
    return {
      border: props.borderImageUrl ? '20px solid black' : 'none',
      transition: 'width 0.25s, height 0.25s, marginTop 0.25s',
      borderImage: `url(${props.borderImageUrl}) 20 round`,
      width: props.expanded ? 'calc(100% - 40px)' : props.width,
      height: props.expanded ? 'calc(100% - 40px - 4rem)' : props.height,
      marginTop: props.expanded ? '4rem' : '0',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      pointerEvents: 'all',
      // background: colors.BLACK,
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
  // some games block main thread while loading (wasm stuff), which can cause
  // the audio sprite callback to not run until the game is loaded.  This means
  // that the audio file just keeps playing consecutive sprites until the game finally loads.
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const memoizedSrc = props.src;
    setTimeout(() => {
      if (ref.current) {
        ref.current.src = memoizedSrc;
      }
    }, 500);
  }, []);

  return (
    <IframeBorder
      expanded={props.expanded}
      borderImageUrl={props.borderImageUrl}
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
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '8px',
            borderRadius: '8px',
          }}
        >
          <span
            style={{
              marginBottom: '8px',
            }}
          >
            Loading game...
          </span>
          <img src="res/img/flower.svg" alt="loading" id="page-loading-icon" />
        </div>
      ) : null}
      <iframe
        id={props.id}
        ref={ref}
        allowTransparency={true}
        // src={memoizedSrc}
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
