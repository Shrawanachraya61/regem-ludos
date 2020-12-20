import React from 'react';
import display from 'content/display';
import Input from 'elements/input';
import Dialog from 'elements/dialog';
import Button from 'elements/button';
import Text from 'elements/text';
import { colors } from 'utils';

const MAX_SPRITE_WIDTH = 128;
const MAX_SPRITE_HEIGHT = 128;

const SpriteSizeInputDialog = ({ open, setOpen, appInterface }) => {
  const {
    spriteWidth: origSpriteWidth,
    spriteHeight: origSpriteHeight,
  } = display.pictures[appInterface.imageName];

  const [spriteWidth, setSpriteWidth] = React.useState(origSpriteWidth);
  const [spriteHeight, setSpriteHeight] = React.useState(origSpriteHeight);

  return (
    <Dialog
      open={open}
      onConfirm={async () => {
        display.updatePictureSpriteSize(
          appInterface.imageName,
          spriteWidth,
          spriteHeight
        );
        appInterface.forceUpdate();
        setOpen(false);
      }}
      onCancel={() => {
        setOpen(false);
      }}
      content={
        <>
          <div>Set width and height of sprites in this spritesheet.</div>
          <div style={{ margin: '5px' }}>
            <Input
              focus={true}
              type="number"
              width="140"
              name="width"
              label="Width"
              value={spriteWidth}
              onChange={ev => setSpriteWidth(ev.target.value)}
            />
            <Input
              type="number"
              width="140"
              name="height"
              label="Height"
              value={spriteHeight}
              onChange={ev => setSpriteHeight(ev.target.value)}
            />
          </div>
        </>
      }
    />
  );
};

const Tile = ({
  spriteName,
  spriteWidth,
  spriteHeight,
  isSelected,
  appInterface,
}) => {
  const ref = React.useRef(null);
  spriteWidth = spriteWidth || 1;
  spriteHeight = spriteHeight || 1;
  const width = spriteWidth > MAX_SPRITE_WIDTH ? MAX_SPRITE_WIDTH : spriteWidth;
  const height =
    spriteHeight > MAX_SPRITE_HEIGHT ? MAX_SPRITE_HEIGHT : spriteHeight;
  const scale = spriteWidth > MAX_SPRITE_WIDTH ? 0.5 : 1;
  const sprite = display.getSprite(spriteName);
  const spriteSheetScale = appInterface.getSpriteSheetZoom();
  React.useEffect(() => {
    if (sprite) {
      display.setCanvas(ref.current);
      display.drawSprite(
        spriteName,
        (width * spriteSheetScale) / 2,
        (height * spriteSheetScale) / 2,
        {
          centered: true,
          scale: scale * spriteSheetScale,
        }
      );
      display.restoreCanvas();
    }
  }, [
    spriteName,
    spriteWidth,
    spriteHeight,
    width,
    height,
    scale,
    sprite,
    spriteSheetScale,
  ]);

  if (!sprite) {
    return <div />;
  }

  const isBlank = sprite.is_blank;

  return (
    <div
      id={spriteName}
      draggable={true}
      onDragStart={ev => {
        ev.dataTransfer.setData('text', 'sprite,' + ev.target.id);
        appInterface.setIsDragging(true);
      }}
      style={{
        margin: '5px',
        justifyContent: 'center',
        overflow: 'hidden',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        display: isBlank ? 'none' : 'flex',
        backgroundColor: isSelected ? colors.darkGrey : null,
      }}
    >
      <div className="no-select" style={{ marginBottom: '5px' }}>
        {spriteName.slice(spriteName.lastIndexOf('_') + 1)}
      </div>
      <canvas
        style={{
          margin: '5px',
          border: '1px solid ' + (isSelected ? colors.green : colors.white),
          // transform: `scale(${appInterface.getSpriteSheetZoom()})`,
        }}
        ref={ref}
        width={width * spriteSheetScale}
        height={height * spriteSheetScale}
      ></canvas>
    </div>
  );
};

const Image = ({ imageName }) => {
  const ref = React.useRef(null);
  const image = display.pictures[imageName].img;
  React.useEffect(() => {
    display.setCanvas(ref.current);
    display.drawSprite(imageName, 0, 0);
    display.restoreCanvas();
  }, [imageName]);
  return (
    <div
      style={{
        borderTop: '1px solid ' + colors.grey,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      <Text type="container-label">
        Image: {image.width}x{image.height}
      </Text>
      <canvas
        style={{ margin: '5px', border: '1px solid white' }}
        ref={ref}
        width={image.width}
        height={image.height}
      ></canvas>
    </div>
  );
};

const SaveButton = ({ appInterface }) => {
  const [isSaving, setIsSaving] = React.useState(false);

  const save = async () => {
    setIsSaving(true);
    await display.saveToTxt();
    setIsSaving(false);
  };

  React.useEffect(() => {
    const keydown = ev => {
      if (ev.key === 's' && ev.ctrlKey) {
        save();
        ev.preventDefault();
      }
    };
    window.addEventListener('keydown', keydown);
    return () => {
      window.removeEventListener('keydown', keydown);
    };
  });

  return (
    <Button
      type="secondary"
      style={{
        width: '116px',
        float: 'right',
        margin: '4px',
      }}
      onClick={save}
    >
      {isSaving ? '....' : 'Save'}
    </Button>
  );
};

const Spritesheet = props => {
  const { appInterface } = props;
  const [spriteInputOpen, setSpriteInputOpen] = React.useState(false);
  const { spriteWidth, spriteHeight, totalSprites } = display.pictures[
    appInterface.imageName
  ];

  const animation = appInterface.animation;

  const tiles = [];
  for (let i = 0; i < totalSprites; i++) {
    const spriteName = appInterface.imageName + '_' + i;
    let isSelected = false;
    if (animation) {
      isSelected = animation.containsSprite(spriteName);
    }
    tiles.push(
      <Tile
        key={appInterface.imageName + '_' + i}
        appInterface={appInterface}
        spriteName={spriteName}
        spriteWidth={spriteWidth}
        spriteHeight={spriteHeight}
        isSelected={isSelected}
      />
    );
  }

  return (
    <div
      style={{
        height: window.innerHeight - 200,
      }}
    >
      <div style={{ backgroundColor: colors.darkGrey }}>
        <Button
          style={{ float: 'left', margin: '4px 48px 4px 4px' }}
          onClick={() => {
            appInterface.clearMarkedFrames();
            appInterface.setImageName('');
          }}
        >
          ← Back
        </Button>
        <SaveButton appInterface={appInterface} />
        <div
          className="no-select"
          style={{
            textAlign: 'center',
            fontSize: '24px',
            padding: '10px',
          }}
        >
          {props.appInterface.imageName}
        </div>
      </div>
      <div
        style={{
          borderTop: '1px solid ' + colors.grey,
        }}
      >
        <div
          style={{
            backgroundColor: colors.lightBlack,
            padding: '5px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid ' + colors.grey,
          }}
        >
          <div>
            <Text ownLine={true} lineHeight={5} type="container-label">
              Spritesheet Properties
            </Text>
            <Text ownLine={true} lineHeight={5}>
              Sprite Width: {spriteWidth}
            </Text>
            <Text ownLine={true} lineHeight={5}>
              Sprite Height: {spriteHeight}
            </Text>
          </div>
          <Button type="primary" onClick={() => setSpriteInputOpen(true)}>
            Set Sprite Size
          </Button>
        </div>
        <div
          style={{
            backgroundColor: colors.lightBlack,
            padding: '5px',
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
            alignItems: 'center',
            borderBottom: '1px solid ' + colors.grey,
          }}
        >
          <Text ownLine={true} lineHeight={5} type="container-label">
            Zoom {appInterface.getSpriteSheetZoom()}x
          </Text>
          <input
            style={{
              width: '50%',
            }}
            type="range"
            min={0.5}
            max={2.0}
            step={0.1}
            value={appInterface.getSpriteSheetZoom()}
            onChange={ev => {
              appInterface.setSpriteSheetZoom(ev.target.value);
            }}
          ></input>
        </div>
        <div style={{ overflowY: 'auto', height: 'calc(100% - 187px)' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              placeContent: 'center',
            }}
          >
            {tiles}
          </div>
          <Image imageName={appInterface.imageName} />
        </div>
      </div>
      <SpriteSizeInputDialog
        open={spriteInputOpen}
        setOpen={setSpriteInputOpen}
        appInterface={props.appInterface}
      />
    </div>
  );
};

export default Spritesheet;
