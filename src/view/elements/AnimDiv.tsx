import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { drawAnimation } from 'view/draw';
import { createAnimation } from 'model/animation';

interface IAnimDivProps {
  animName: string;
  scale?: number;
  width?: number;
  height?: number;
}

const AnimDiv = (props: IAnimDivProps): h.JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [anim] = useState(createAnimation(props.animName));
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const [w, h] = anim.getSpriteSize(0);
      const scale = props.scale || 1;
      canvas.width = (props.width ?? w) * scale;
      canvas.height = (props.height ?? h) * scale;
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      ctx.imageSmoothingEnabled = false;
      drawAnimation(anim, 0, 0, scale, ctx);
    }
  }, [anim, props]);
  return (
    <div>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

export default AnimDiv;
