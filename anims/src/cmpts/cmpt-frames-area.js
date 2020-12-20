import React from 'react';
import { colors } from 'utils';
import Button from 'elements/button';
import Input from 'elements/input';
import display from '../content/display';

export const addSpriteAtIndex = (anim, spriteName, index, defaultDuration) => {
  if (anim.isCadence) {
    return;
  }
  const sprObj = anim.createSprite({
    name: spriteName,
    duration: defaultDuration || 100,
  });
  anim.sprites.splice(index, 0, sprObj);
  anim.spriteMap[spriteName] = true;
  display.updateAnimation(anim, null, anim.loop, anim.sprites);
};

const replaceSpriteAtIndex = (anim, spriteName, index) => {
  anim.setSpriteNameAtIndex(spriteName, index);
  display.updateAnimation(anim, null, anim.loop, anim.sprites);
};

const removeSpriteAtIndex = (anim, index) => {
  if (anim.isCadence) {
    return;
  }

  const spr = anim.sprites[index];
  anim.sprites.splice(index, 1);
  if (!anim.hasSprite(spr.name)) {
    anim.spriteMap[spr.name] = false;
  }
  display.updateAnimation(anim, null, anim.loop, anim.sprites);
};

const moveSpriteFromIndexToIndex = (anim, index1, index2, swap) => {
  const spr1 = anim.sprites[index1];
  const spr2 = anim.sprites[index2];
  if (swap) {
    anim.sprites[index1] = spr2;
    anim.sprites[index2] = spr1;
    return;
  }

  if (index1 === index2) {
    return;
  } else if (index1 < index2) {
    anim.sprites.splice(index2, 0, spr1);
    anim.sprites.splice(index1, 1);
  } else {
    anim.sprites.splice(index2, 0, spr1);
    anim.sprites.splice(index1 + 1, 1);
  }
  anim.remakeMS();
  display.updateAnimation(anim, null, anim.loop, anim.sprites);
};

const DragDivider = ({
  appInterface,
  spriteIndex,
  setParentIsDraggingOver,
}) => {
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);
  const color = isDraggingOver ? colors.lightBlue : 'transparent';
  return (
    <div style={{ display: 'inline-block' }}>
      <div
        onDragEnter={ev => {
          setIsDraggingOver(true);
          ev.stopPropagation();
          ev.preventDefault();
        }}
        onDragLeave={ev => {
          setIsDraggingOver(false);
          ev.stopPropagation();
          ev.preventDefault();
        }}
        onDrop={ev => {
          setIsDraggingOver(false);

          const anim = appInterface.animation;
          const [dragType, spriteName] = ev.dataTransfer
            .getData('text')
            .split(',');
          if (dragType === 'sprite') {
            addSpriteAtIndex(
              anim,
              spriteName,
              spriteIndex >= 0 ? spriteIndex : anim.sprites.length,
              appInterface.defaultAnimDuration
            );
            setParentIsDraggingOver(spriteIndex === -1 ? 'scroll' : null);
          } else if (dragType.slice(0, 5) === 'frame') {
            const frameIndex = Number(dragType.slice(5));
            moveSpriteFromIndexToIndex(
              anim,
              frameIndex,
              spriteIndex >= 0 ? spriteIndex : anim.sprites.length,
              false
            );
          }
          appInterface.setAnimation(display.getAnimation(anim.name));
        }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          width: spriteIndex === -1 ? '200px' : '30px',
          height: '170px',
          transition: 'background-color 0.5s',
          backgroundColor:
            isDraggingOver && spriteIndex !== -1 ? colors.darkGreen : null,
        }}
      >
        {spriteIndex === -1 ? (
          <div
            style={{
              pointerEvents: 'none',
              fontSize: '42px',
              width: '150px',
              height: '150px',
              border:
                '1px solid ' +
                (!isDraggingOver ? colors.grey : colors.lightBlue),
              color: !isDraggingOver ? colors.grey : colors.lightBlue,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: isDraggingOver ? colors.darkGreen : null,
              transition: 'background-color 0.5s',
            }}
          >
            +
          </div>
        ) : (
          <>
            <div
              style={{
                pointerEvents: 'none',
                borderRight: '1px solid ' + color,
                borderTop: '1px solid ' + color,
                borderBottom: '1px solid ' + color,
                width: '50%',
                height: 'calc(100% - 2px)',
              }}
            />
            <div
              style={{
                pointerEvents: 'none',
                borderLeft: '1px solid ' + color,
                borderTop: '1px solid ' + color,
                borderBottom: '1px solid ' + color,
                width: '50%',
                height: 'calc(100% - 2px)',
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

const Frame = ({ appInterface, spriteIndex, setParentIsDraggingOver }) => {
  const anim = appInterface.animation;
  const { name: spriteName, durationMs } = anim.sprites[spriteIndex];
  const [isDraggable, setIsDraggable] = React.useState(true);
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);
  const ref = React.useRef();
  const [duration, setDuration] = React.useState(durationMs);

  React.useEffect(() => {
    display.setCanvas(ref.current);
    display.clearScreen();
    display.drawSprite(spriteName, 32, 32, { centered: true });
    display.restoreCanvas();
  }, [spriteName, ref]);

  return (
    <div style={{ display: 'inline-block' }}>
      <div
        draggable={isDraggable}
        onDragStart={ev => {
          ev.dataTransfer.setData('text', `frame${spriteIndex},` + spriteName);
          appInterface.setIsDragging(true);
        }}
        onDragEnter={ev => {
          setIsDraggingOver(true);
          ev.stopPropagation();
          ev.preventDefault();
        }}
        onDragLeave={ev => {
          setIsDraggingOver(false);
          ev.stopPropagation();
          ev.preventDefault();
        }}
        onDrop={ev => {
          setParentIsDraggingOver(false);
          setIsDraggingOver(false);
          const anim = appInterface.animation;
          const [dragType, spriteName] = ev.dataTransfer
            .getData('text')
            .split(',');
          if (dragType === 'sprite') {
            replaceSpriteAtIndex(
              anim,
              spriteName,
              spriteIndex >= 0 ? spriteIndex : anim.sprites.length
            );
          } else if (dragType.slice(0, 5) === 'frame') {
            const frameIndex = Number(dragType.slice(5));
            moveSpriteFromIndexToIndex(
              anim,
              frameIndex,
              spriteIndex >= 0 ? spriteIndex : anim.sprites.length,
              true
            );
          }
        }}
        style={{
          marginTop: '10px',
          marginBottom: '10px',
          justifyContent: 'center',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          display: 'flex',
          overflow: 'hidden',
          width: '150px',
          height: '150px',
          border: '1px solid ' + colors.lightBlue,
          transition: 'background-color 0.5s',
          backgroundColor: isDraggingOver ? colors.darkRed : colors.darkBlue,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            width: '140px',
            height: '30px',
            pointerEvents: appInterface.isDragging ? 'none' : null,
          }}
        >
          <div
            className="no-select"
            style={{
              marginBottom: '5px',
              pointerEvents: 'none',
              textAlign: 'left',
            }}
          >
            {spriteName}
          </div>
          <Button
            type="cancel"
            style={{
              pointerEvents: appInterface.isDragging ? 'none' : null,
              padding: '2px',
              minWidth: '20px',
              borderRadius: '12px',
            }}
            onClick={() => {
              removeSpriteAtIndex(appInterface.animation, spriteIndex);
              appInterface.setAnimation(display.getAnimation(anim.name));
            }}
          >
            X
          </Button>
        </div>
        <div style={{ pointerEvents: appInterface.isDragging ? 'none' : null }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '136px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <input
                id={'select-frame-' + spriteIndex}
                name={'select-frame-' + spriteIndex}
                type="checkbox"
                checked={appInterface.isFrameMarked(spriteIndex)}
                onChange={ev => {
                  if (ev.target.checked) {
                    appInterface.addMarkedFrame(spriteIndex);
                  } else {
                    appInterface.removeMarkedFrame(spriteIndex);
                  }
                }}
              ></input>
              <label htmlFor={'select-frame-' + spriteIndex}>Mark</label>
            </div>
            <Input
              type="number"
              name="duration"
              label="Duration"
              width={60}
              value={duration}
              onChange={ev => setDuration(ev.target.value)}
              onBlur={() => {
                anim.sprites[spriteIndex].durationMs = Number(duration);
                display.updateAnimation(anim, null, anim.loop, anim.sprites);
                anim.remakeMS();
                appInterface.setAnimation(display.getAnimation(anim.name));
              }}
              style={{ pointerEvents: appInterface.isDragging ? 'none' : null }}
              inputStyle={{
                pointerEvents: appInterface.isDragging ? 'none' : null,
                margin: null,
                marginTop: '5px',
              }}
              onMouseEnter={() => setIsDraggable(false)}
              onMouseLeave={() => setIsDraggable(true)}
            />
          </div>
        </div>
        <canvas
          style={{
            pointerEvents: 'none',
            margin: '5px',
            border:
              '1px solid ' + (isDraggingOver ? colors.green : colors.white),
            backgroundColor: 'black',
          }}
          ref={ref}
          width={64}
          height={64}
        ></canvas>
      </div>
    </div>
  );
};

const FramesArea = ({ appInterface }) => {
  const ref = React.useRef();
  const [shouldScrollToRight, setShouldScrollToRight] = React.useState(false);
  React.useEffect(() => {
    if (shouldScrollToRight) {
      ref.current.scrollLeft = 999999999;
      setShouldScrollToRight(false);
    }
  }, [shouldScrollToRight, setShouldScrollToRight]);

  const isDragging = appInterface.isDragging;
  const anim = appInterface.animation;
  return (
    <div
      style={{
        backgroundColor: isDragging ? colors.darkGrey : colors.darkGrey,
        width: '100%',
        border: '1px solid ' + (isDragging ? colors.lightGreen : colors.grey),
        pointerEvents: anim ? null : 'none',
      }}
    >
      <div
        style={{
          paddingTop: '5px',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          height: '193px',
          overflowX: 'scroll',
          overflowY: 'hidden',
        }}
        ref={ref}
      >
        {anim && (
          <>
            {anim.sprites.map((_, i) => (
              <React.Fragment key={i}>
                <DragDivider
                  key={'drag_' + i}
                  spriteIndex={i}
                  appInterface={appInterface}
                  setParentIsDraggingOver={shouldScroll => {
                    if (shouldScroll === 'scroll') {
                      setShouldScrollToRight(true);
                    }
                  }}
                />
                <Frame
                  key={i}
                  spriteIndex={i}
                  appInterface={appInterface}
                  setParentIsDraggingOver={function() {}}
                />
              </React.Fragment>
            ))}
            <DragDivider
              spriteIndex={-1}
              appInterface={appInterface}
              setParentIsDraggingOver={shouldScroll => {
                if (shouldScroll === 'scroll') {
                  setShouldScrollToRight(true);
                }
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default FramesArea;
