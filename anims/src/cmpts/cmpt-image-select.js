import React from 'react';
import display from 'content/display';
import { colors } from '../utils';
import Button from '../elements/button';

const THUMB_WIDTH = 128;
const THUMB_HEIGHT = 64;

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

const ImageButton = ({ appInterface, imageName }) => {
  const ref = React.useRef(null);
  let spriteWidth, img;
  if (
    !display.pictures[imageName] ||
    Array.isArray(display.pictures[imageName])
  ) {
    spriteWidth = 64;
    img = display.placeholder;
  } else {
    spriteWidth = display.pictures[imageName].spriteWidth;
    img = display.pictures[imageName].img;
  }

  React.useEffect(() => {
    const scale = spriteWidth > 64 ? 0.25 : 1;
    let offsetX = 0;
    let offsetY = 0;

    // this basically means: "is this a spritesheet or a picture"
    if (spriteWidth >= img.width) {
      offsetX = THUMB_WIDTH / 2 - scale * (img.width / 2);
      offsetY = THUMB_HEIGHT / 2 - scale * (img.height / 2);
    }
    display.setCanvas(ref.current);
    display.clearScreen();
    display.drawSprite(imageName, offsetX, offsetY, {
      scale,
    });
    display.restoreCanvas();
  });

  return (
    <div
      title={imageName}
      className="button"
      style={{
        display: 'flex',
        flexDirection: 'column',
        maxHeight: THUMB_HEIGHT + 40,
        margin: 5,
        width: '140px',
        overflow: 'hidden',
      }}
      onClick={() => appInterface.setImageName(imageName)}
    >
      <div
        className="no-select"
        style={{
          marginBottom: '5px',
          whiteSpace: 'pre',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {imageName}
      </div>
      <canvas ref={ref} width={THUMB_WIDTH} height={THUMB_HEIGHT}></canvas>
    </div>
  );
};

const ImageSelect = props => {
  const [filter, setFilter] = React.useState('');

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          position: 'fixed',
          right: '28px',
          top: '15px',
        }}
      >
        <SaveButton />
      </div>
      <div style={{ textAlign: 'center', margin: '10px', fontSize: '24px' }}>
        Select A Spritesheet
      </div>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <input
          placeholder="filter"
          style={{
            width: 200,
          }}
          value={filter}
          onChange={ev => setFilter(ev.target.value)}
        ></input>
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          placeContent: 'center',
          border: '1px solid ' + colors.white,
          background: colors.black,
        }}
      >
        {Object.keys(display.pictures)
          .filter(imageName => {
            if (filter) {
              return (
                imageName !== 'invisible' &&
                imageName.toLowerCase().indexOf(filter.toLowerCase()) > -1
              );
            } else {
              return imageName !== 'invisible';
            }
          })
          .sort((a, b) => {
            return a.toUpperCase() < b.toUpperCase() ? -1 : 1;
          })
          .map(imageName => (
            <ImageButton key={imageName} {...props} imageName={imageName} />
          ))}
      </div>
    </div>
  );
};

export default ImageSelect;
