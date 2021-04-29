/* @jsx h */
import { h } from 'preact';
import { useRenderLoop } from 'view/hooks';
import { style, IntrinsicProps } from 'view/style';
import { getDrawScale } from 'model/canvas';
import {
  Character,
  characterGetPosTopLeft,
  characterGetSize,
} from 'model/character';
import { worldToCanvasCoords4by3 } from 'utils';

interface ICharacterFollowerProps extends IntrinsicProps {
  ch: Character;
  renderKey: string;
}

const Root = style('div', () => {
  return {
    position: 'absolute',
    pointerEvents: 'all',
    // border: '2px solid white',
  };
});

const CharacterFollower = (props: ICharacterFollowerProps): h.JSX.Element => {
  const { renderKey, ch, style, ...rest } = props;
  useRenderLoop(renderKey);

  const [x, y, z] = characterGetPosTopLeft(ch);
  const [spriteWidth, spriteHeight] = characterGetSize(ch);
  const [resultX, resultY] = worldToCanvasCoords4by3(x, y, z);
  return (
    <Root
      style={{
        left: resultX + 'px',
        top: resultY + 'px',
        width: spriteWidth * getDrawScale() + 'px',
        height: spriteHeight * getDrawScale() + 'px',
        ...(style as Record<string, string>),
      }}
      {...rest}
    />
  );
};

export default CharacterFollower;
