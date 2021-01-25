import React from 'react';
import { colors } from 'utils';
import Text from 'elements/text';
import Button from 'elements/button';
import Input from 'elements/input';
import display from 'content/display';
import { addSpriteAtIndex } from 'cmpts/cmpt-frames-area';

const AnimationPreview = ({ anim, appInterface }) => {
  const [scale, setScale] = React.useState(2);
  const ref = React.useRef(null);
  const canvasWidth = 256;
  const canvasHeight = 256;
  React.useEffect(() => {
    display.setLoop(() => {
      display.setCanvas(ref.current);
      display.clearScreen();
      if (window.appInterface.animation) {
        display.drawAnimation(anim, canvasWidth / 2, canvasHeight / 2, {
          centered: true,
          scale,
        });
      }
      display.restoreCanvas();
    });
  }, [anim, scale]);

  return (
    <div
      style={{
        padding: '5px',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: colors.darkBlue,
        borderBottom: '1px solid ' + colors.grey,
      }}
    >
      <div
        style={{
          paddingBottom: '5px',
        }}
      >
        <div
          className="no-select"
          style={{
            paddingBottom: '5px',
            textAlign: 'center',
            color: colors.lightBlue,
          }}
        >
          {anim ? anim.name : '(select animation)'}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <canvas
            style={{
              margin: '5px',
              border: '1px solid ' + colors.white,
              backgroundColor: 'black',
            }}
            ref={ref}
            width={canvasWidth}
            height={canvasHeight}
          ></canvas>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            padding: '5px',
          }}
        >
          <Button
            type={scale === 1 ? 'primary' : null}
            disabled={!anim ? true : false}
            onClick={() => {
              setScale(1);
            }}
          >
            1X
          </Button>
          <Button
            type={scale === 2 ? 'primary' : null}
            disabled={!anim ? true : false}
            onClick={() => {
              setScale(2);
            }}
          >
            2X
          </Button>
          <Button
            type={scale === 4 ? 'primary' : null}
            disabled={!anim ? true : false}
            onClick={() => {
              setScale(4);
            }}
          >
            4X
          </Button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            style={{ width: '140px', marginTop: '10px' }}
            type="secondary"
            disabled={!anim || anim.loop ? true : false}
            onClick={() => {
              if (anim) {
                anim.reset();
                anim.start();
              }
            }}
          >
            Play ▶
          </Button>
        </div>
      </div>
    </div>
  );
};

const AnimationTxt = ({ anim, appInterface }) => {
  const txt = (anim && display.getFormattedTxtForAnimation(anim)) || '';
  return (
    <div>
      <textarea
        style={{
          width: '100%',
          height: '100px',
          backgroundColor: colors.black,
          color: colors.white,
          border: '1px solid ' + colors.grey,
        }}
        readOnly
        value={txt}
        onChange={ev => {}}
      ></textarea>
    </div>
  );
};

const AnimationArea = ({ appInterface }) => {
  const [defaultDuration, setDefaultDuration] = React.useState(100);
  const imageName = appInterface.imageName;
  const anim = appInterface.animation;
  const { totalSprites } = display.pictures[appInterface.imageName] || {};
  return (
    <div>
      <div
        style={{
          borderBottom: '1px solid ' + colors.grey,
          paddingTop: '5px',
          paddingBottom: '6px',
        }}
      >
        <Text type="title" ownLine={true} centered={true}>
          Preview
        </Text>
      </div>
      <AnimationPreview anim={anim} appInterface={appInterface} />
      <AnimationTxt anim={anim} appInterface={appInterface} />
      {anim && (
        <div style={{ margin: '5px' }}>
          <Text type="bold" ownLine={true} centered={false} lineHeight={5}>
            Total Duration MS: {anim.totalDurationMs}
          </Text>
          {/* <Text type="bold" ownLine={true} centered={false} lineHeight={5}>
            Number of Frames: {anim.sprites.length}
          </Text> */}
          <Input
            type="checkbox"
            name="loop"
            label="Loop"
            value={anim.loop}
            checked={anim.loop}
            style={{
              width: '160px',
            }}
            onChange={() => {
              display.updateAnimation(
                anim,
                imageName,
                !anim.loop,
                anim.sprites
              );
              appInterface.setAnimation(display.getAnimation(anim.name));
            }}
          />
          <Input
            type="number"
            name="duration"
            label="Default Frame Duration"
            value={defaultDuration}
            style={{
              width: '160px',
            }}
            onChange={ev => setDefaultDuration(Number(ev.target.value))}
            onBlur={() => {
              appInterface.setDefaultAnimDuration(defaultDuration);
            }}
          />
          <div
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              padding: '6px 0px',
              margin: '6px 0px',
              borderBottom: '1px solid ' + colors.white,
            }}
          >
            Spritesheet Helpers
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: '7px',
              justifyContent: 'space-around',
            }}
          >
            <Button
              type="primary"
              margin={2}
              onClick={() => {
                for (let i = 0; i < totalSprites; i++) {
                  const a = display.getAnimation(anim.name);
                  const spriteName = appInterface.imageName + '_' + i;
                  const sprite = display.getSprite(spriteName);
                  if (sprite.is_blank) {
                    continue;
                  }
                  addSpriteAtIndex(
                    a,
                    spriteName,
                    a.sprites.length,
                    defaultDuration
                  );
                }
                appInterface.setAnimation(display.getAnimation(anim.name));
              }}
            >
              + All
            </Button>
            <Button
              type="secondary"
              margin={2}
              onClick={() => {
                for (let i = totalSprites - 1; i >= 0; i--) {
                  const a = display.getAnimation(anim.name);
                  const spriteName = appInterface.imageName + '_' + i;
                  const sprite = display.getSprite(spriteName);
                  if (sprite.is_blank) {
                    continue;
                  }
                  addSpriteAtIndex(
                    a,
                    spriteName,
                    a.sprites.length,
                    defaultDuration
                  );
                }
                appInterface.setAnimation(display.getAnimation(anim.name));
              }}
            >
              + All Reverse
            </Button>
            <Button
              type="cadence"
              margin={2}
              onClick={() => {
                addSpriteAtIndex(
                  anim,
                  'invisible',
                  anim.sprites.length,
                  defaultDuration
                );
                appInterface.setAnimation(display.getAnimation(anim.name));
              }}
            >
              + Invisible
            </Button>
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: '7px',
              justifyContent: 'flex-start',
            }}
          >
            <Button
              type="secondary"
              margin={2}
              onClick={() => {
                const sprites = anim.sprites.reverse();
                display.updateAnimation(anim, imageName, anim.loop, sprites);
                appInterface.setAnimation(display.getAnimation(anim.name));
              }}
            >
              Reverse All
            </Button>
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              padding: '6px 0px',
              margin: '6px 0px',
              borderBottom: '1px solid ' + colors.white,
            }}
          >
            Marked Frames
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: '7px',
              justifyContent: 'space-around',
            }}
          >
            <Button
              type="primary"
              margin={2}
              onClick={() => {
                appInterface.markAllFrames();
              }}
            >
              Mark All
            </Button>
            <Button
              type="secondary"
              margin={2}
              onClick={() => {
                appInterface.clearMarkedFrames();
              }}
            >
              UnMark All
            </Button>
            <Button
              type="cadence"
              margin={2}
              onClick={() => {
                appInterface.getMarkedFrames().forEach(frameIndex => {
                  console.log(
                    'add sprite at index',
                    frameIndex,
                    anim,
                    anim.sprites[frameIndex].name,
                    anim.sprites.length,
                    defaultDuration
                  );
                  addSpriteAtIndex(
                    anim,
                    anim.sprites[frameIndex].name,
                    anim.sprites.length,
                    defaultDuration
                  );
                });
                appInterface.setAnimation(display.getAnimation(anim.name));
              }}
            >
              + Clone Marked
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimationArea;
