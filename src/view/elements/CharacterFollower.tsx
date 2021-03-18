/* @jsx h */
import { h } from 'preact';
import { useRenderLoop } from 'view/hooks';
import { style, IntrinsicProps } from 'view/style';
import { getDrawScale } from 'model/canvas';
import { Character, characterGetPos } from 'model/character';
import { isoToPixelCoords } from 'utils';
import { getCameraDrawOffset } from 'model/generics';

interface ICharacterFollowerProps extends IntrinsicProps {
  ch: Character;
  renderKey: string;
}

const Root = style('div', () => {
  return {
    position: 'absolute',
    border: '2px solid white',
  };
});

const CharacterFollower = (props: ICharacterFollowerProps): h.JSX.Element => {
  const { renderKey, ch, style, ...rest } = props;
  useRenderLoop(renderKey);

  const [x, y, z] = characterGetPos(ch);
  const [px, py] = isoToPixelCoords(x, y, z);
  const [roomXOffset, roomYOffset] = getCameraDrawOffset();
  const scale = getDrawScale();
  // HACK for scale of 4 at 4:3 resolution
  const resultX = (px + roomXOffset) * scale - 638 - 48;
  const resultY = (py + roomYOffset) * scale - 512;
  return (
    <Root
      style={{
        left: resultX + 'px',
        top: resultY + 'px',
        width: 32 * getDrawScale() + 'px',
        height: 32 * getDrawScale() + 'px',
        ...(style as Record<string, string>),
      }}
      {...rest}
    />
  );
};

export default CharacterFollower;
