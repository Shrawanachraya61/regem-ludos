import React from 'react';
import { colors } from 'utils';
import Text from 'elements/text';
import Button from 'elements/button';
import Input from 'elements/input';
import display from 'content/display';
import { addSpriteAtIndex } from 'cmpts/cmpt-frames-area';
import Dialog from 'elements/dialog';

const SetDurationDialog = ({ open, setOpen, appInterface, anim }) => {
  const [duration, setDuration] = React.useState(
    appInterface
      .getMarkedFrames()
      .map(spriteIndex => anim.sprites[spriteIndex])?.[0]?.durationMs ?? 100
  );

  const validate = value => {
    return value === '';
  };

  const onConfirm = async () => {
    const value = duration;
    if (!validate(value)) {
      appInterface.getMarkedFrames().forEach(spriteIndex => {
        anim.sprites[spriteIndex].durationMs = Number(duration);
      });
      display.updateAnimation(anim, null, anim.loop, anim.sprites);
      anim.remakeMS();
      appInterface.setAnimation(null);
      setOpen(false);
      setTimeout(() => {
        appInterface.setAnimation(display.getAnimation(anim.name));
        // appInterface.render();
      });
    }
  };

  return (
    <Dialog
      open={!!open}
      title="Set Duration"
      onConfirm={onConfirm}
      onCancel={() => {
        setOpen(false);
      }}
      content={
        <>
          <div style={{ margin: '5px' }}>
            <div> Duration (MS) </div>
            <Input
              type="number"
              onChange={ev => {
                setDuration(ev.target.value);
              }}
              onKeyDown={ev => {
                if (ev.key === 'Enter') {
                  onConfirm();
                }
              }}
              focus
              value={duration}
            ></Input>
          </div>
        </>
      }
    />
  );
};

const ButtonRow = props => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: props?.style?.justifyContent ?? 'flex-start',
        alignItems: 'center',
        marginTop: '7px',
      }}
    >
      {props.children}
    </div>
  );
};

let previousKeydownListener = function() {};
window.addEventListener('keydown', previousKeydownListener);

const AnimationPreview = ({ anim, appInterface }) => {
  const [scale, setScale] = React.useState(2);
  const ref = React.useRef(null);
  const canvasWidth = 256;
  const canvasHeight = 256;
  React.useEffect(() => {
    display.setLoop(() => {
      if (ref.current) {
        display.setCanvas(ref.current);
        display.clearScreen();
        if (window.appInterface.animation) {
          display.drawAnimation(anim, canvasWidth / 2, canvasHeight / 2, {
            centered: true,
            scale,
          });
        }
        display.restoreCanvas();
      }
    });

    window.removeEventListener('keydown', previousKeydownListener);
    previousKeydownListener = ev => {
      if (ev.key === ' ') {
        if (anim) {
          anim.reset();
          anim.start();
          ev.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', previousKeydownListener);
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
              backgroundColor: 'darkgreen',
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
  const [
    markedDurationDialogOpen,
    setMarkedDurationDialogOpen,
  ] = React.useState(false);
  const imageName = appInterface.imageName;
  const anim = appInterface.animation;
  const { totalSprites } = display.pictures[appInterface.imageName] || {};

  const reverseFrames = indexes => {
    const reversedSprites = anim.sprites
      .filter((_, i) => {
        return indexes.includes(i);
      })
      .reverse();
    const newSprites = [];
    let ctr = 0;
    for (let i = 0; i < anim.sprites.length; i++) {
      if (indexes.includes(i)) {
        newSprites.push(reversedSprites[ctr]);
        ctr++;
      } else {
        newSprites.push(anim.sprites[i]);
      }
    }
    display.updateAnimation(anim, imageName, anim.loop, newSprites);
    appInterface.setAnimation(display.getAnimation(anim.name));
  };

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
          <ButtonRow>
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
          </ButtonRow>
          {/* // Kinda redundant to have this */}
          {/* <ButtonRow>
            <Button
              type="secondary"
              margin={2}
              onClick={() => {
                const indexes = [];
                for (let i = 0; i < anim.sprites.length; i++) {
                  indexes.push(i);
                }
                reverseFrames(indexes);
              }}
            >
              Reverse All
            </Button>
          </ButtonRow> */}
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
          <ButtonRow
            style={{
              justifyContent: 'space-between',
            }}
          >
            <Button
              type="primary"
              margin={2}
              style={{
                width: '90px',
              }}
              onClick={() => {
                appInterface.markAllFrames();
              }}
            >
              Mark All
            </Button>
            <Button
              type="primary"
              margin={2}
              style={{
                width: '90px',
              }}
              onClick={() => {
                appInterface.clearMarkedFrames();
              }}
            >
              UnMark All
            </Button>
          </ButtonRow>
          <ButtonRow>
            <Button
              type="cadence"
              margin={2}
              onClick={() => {
                appInterface.getMarkedFrames().forEach(frameIndex => {
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
              + Clone
            </Button>
            <Button
              type="secondary"
              margin={2}
              onClick={() => {
                reverseFrames(appInterface.getMarkedFrames());
              }}
            >
              Reverse
            </Button>
            <Button
              type="secondary"
              margin={2}
              onClick={() => {
                setMarkedDurationDialogOpen(true);
              }}
            >
              Set Duration
            </Button>
          </ButtonRow>
        </div>
      )}
      {markedDurationDialogOpen ? (
        <SetDurationDialog
          open={markedDurationDialogOpen}
          setOpen={setMarkedDurationDialogOpen}
          appInterface={appInterface}
          anim={anim}
        />
      ) : null}
    </div>
  );
};

export default AnimationArea;
