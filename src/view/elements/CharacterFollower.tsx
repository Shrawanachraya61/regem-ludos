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
import { useEffect } from 'preact/hooks';

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

const canvasContainer = document.getElementById('canvas-container');
let rect = canvasContainer?.getBoundingClientRect();

export const CharacterFollower = (
  props: ICharacterFollowerProps
): h.JSX.Element => {
  const { renderKey, ch, style, ...rest } = props;
  useRenderLoop(renderKey);

  useEffect(() => {
    rect = canvasContainer?.getBoundingClientRect();
  }, []);

  const [x, y, z] = characterGetPosTopLeft(ch);
  const [spriteWidth, spriteHeight] = characterGetSize(ch);
  let [resultX, resultY] = worldToCanvasCoords4by3(x, y, z);

  let followerWidth = spriteWidth;
  let followerHeight = spriteHeight;

  if (ch.template?.followerSize) {
    followerWidth = ch.template?.followerSize[0];
    followerHeight = ch.template?.followerSize[0];
  }

  const canvasHeight = 512 * 2;
  // const canvasWidth = 1366;
  if (window.innerHeight < canvasHeight) {
    resultX += rect?.left ?? 0;
    resultY += 0;
  }

  return (
    <Root
      id={renderKey}
      style={{
        left:
          resultX + ((spriteWidth - followerWidth) * getDrawScale()) / 2 + 'px',
        top:
          resultY +
          ((spriteHeight - followerHeight) * getDrawScale()) / 2 +
          'px',
        width: followerWidth * getDrawScale() + 'px',
        height: followerHeight * getDrawScale() + 'px',
        ...(style as Record<string, string>),
      }}
      {...rest}
    />
  );
};

export default CharacterFollower;
