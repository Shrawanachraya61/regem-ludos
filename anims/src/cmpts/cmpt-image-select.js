import React from 'react';
import display from 'content/display';

const THUMB_WIDTH = 128;
const THUMB_HEIGHT = 64;

const ImageButton = ({ appInterface, imageName }) => {
  const ref = React.useRef(null);
  const { spriteWidth } = display.pictures[imageName];
  React.useEffect(() => {
    display.setCanvas(ref.current);
    display.drawSprite(imageName, 0, 0, {
      scale: spriteWidth > 64 ? 0.25 : 1,
    });
    display.restoreCanvas();
  });

  return (
    <div
      className="button"
      style={{
        display: 'flex',
        flexDirection: 'column',
        maxHeight: THUMB_HEIGHT + 40,
        margin: 5,
      }}
      onClick={() => appInterface.setImageName(imageName)}
    >
      <div className="no-select" style={{ marginBottom: '5px' }}>
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
      <div style={{ textAlign: 'center', margin: '10px', fontSize: '24px' }}>
        Select A Spritesheet
      </div>
      <div style={{ textAlign: 'center' }}>
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
