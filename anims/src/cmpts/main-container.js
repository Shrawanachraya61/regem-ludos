import React from 'react';
import display from 'content/display';
import ImageSelect from 'cmpts/cmpt-image-select';
import AnimationArea from 'cmpts/cmpt-animation-area';
import AnimationSelect from 'cmpts/cmpt-animation-select';
import Spritesheet from 'cmpts/cmpt-spritesheet';
import FramesArea from 'cmpts/cmpt-frames-area';
import { useWindowDimensions } from 'hooks';
import { colors } from 'utils';

export default () => {
  const dims = useWindowDimensions();
  const [imageName, setImageName] = React.useState(
    localStorage.getItem('imageName')
  );
  let anim = null;
  if (localStorage.getItem('animName')) {
    anim = display.getAnimation(localStorage.getItem('animName'));
    if (anim) {
      anim.start();
    }
  }
  const [animation, setAnimation] = React.useState(anim);
  const [spritesheetMode, setSpritesheetMode] = React.useState('');
  const [defaultAnimDuration, setDefaultAnimDuration] = React.useState(100);
  const [isDragging, setIsDragging] = React.useState('');
  const [spriteSheetZoom, setSpriteSheetZoom] = React.useState(1.0);
  const [, updateState] = React.useState();
  const [render, setRender] = React.useState(false);
  const [markedFrames, setMarkedFrames] = React.useState([]);
  const forceUpdate = React.useCallback(() => updateState({}), []);
  const appInterface = (window.appInterface = {
    imageName,
    setImageName: n => {
      setImageName(n);
      localStorage.setItem('imageName', n);
      appInterface.setAnimation(null);
    },
    animations: [],
    animation,
    render: () => {
      setRender(!render);
    },
    setAnimation: n => {
      if (n) {
        if (appInterface.animation && n.name !== appInterface.animation.name) {
          setAnimation(null);
        }
        setTimeout(() => {
          setAnimation(n);
          n.start();
        });
      } else {
        setAnimation(n);
      }
      localStorage.setItem('animName', (n && n.name) || '');
    },
    spritesheetMode,
    spritesheetOnClick: function() {},
    setSpritesheetMode: (mode, cb) => {
      appInterface.spritesheetOnClick = cb;
      setSpritesheetMode(mode);
    },
    defaultAnimDuration,
    setDefaultAnimDuration,
    forceUpdate,
    isDragging,
    setIsDragging,
    isFrameMarked: i => {
      return markedFrames.indexOf(i) > -1;
    },
    addMarkedFrame: i => {
      const ind = markedFrames.indexOf(i);
      if (ind === -1) {
        const newFrames = [...markedFrames];
        newFrames.push(i);
        setMarkedFrames(newFrames);
      }
    },
    removeMarkedFrame: i => {
      const ind = markedFrames.indexOf(i);
      if (ind > -1) {
        const newFrames = [...markedFrames];
        newFrames.splice(ind, 1);
        setMarkedFrames(newFrames);
      }
    },
    markAllFrames: () => {
      setMarkedFrames(
        anim.sprites.map((_, i) => {
          return i;
        })
      );
    },
    getMarkedFrames: () => markedFrames.sort(),
    clearMarkedFrames: () => {
      setMarkedFrames([]);
    },
    setSpriteSheetZoom: n => {
      setSpriteSheetZoom(n);
    },
    getSpriteSheetZoom: () => spriteSheetZoom,
  });

  display.resize(window.innerWidth, window.innerHeight);
  return (
    <div
      onDrop={() => {
        appInterface.setIsDragging(false);
      }}
      onDragOver={ev => {
        ev.stopPropagation();
        ev.preventDefault();
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          height: dims[1] - 200 + 'px',
        }}
      >
        <div
          style={{
            width: '350px',
            height: '100%',
            backgroundColor: colors.darkGrey,
            borderRight: '1px solid ' + colors.grey,
          }}
        >
          <AnimationSelect appInterface={appInterface} />
        </div>
        <div style={{ width: 'calc(100% - 700px)', height: '100%' }}>
          {imageName && display.pictures[imageName] ? (
            <Spritesheet appInterface={appInterface} />
          ) : (
            <ImageSelect appInterface={appInterface} />
          )}
        </div>
        <div
          style={{
            width: '350px',
            height: '100%',
            backgroundColor: colors.darkGrey,
            borderLeft: '1px solid ' + colors.grey,
            overflowY: 'auto',
          }}
        >
          <AnimationArea appInterface={appInterface} />
        </div>
      </div>
      <FramesArea appInterface={appInterface} />
    </div>
  );
};
