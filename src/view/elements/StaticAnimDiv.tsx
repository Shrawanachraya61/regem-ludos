/* @jsx h */
import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { drawAnimation } from 'view/draw';
import { createAnimation } from 'model/animation';

interface IAnimDivProps {
  animName: string;
  style?: Record<string, string>;
  scale?: number;
  width?: number;
  height?: number;
}

const StaticAnimDiv = (props: IAnimDivProps): h.JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [anim, setAnim] = useState(createAnimation(props.animName));
  const width = props.width;
  const height = props.height;
  const s = props.scale;
  const animName = props.animName;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (anim.name !== animName) {
      setAnim(createAnimation(animName));
    } else if (canvas) {
      const [w, h] = anim.getSpriteSize(0);
      const scale = s ?? 1;
      canvas.width = (width ?? w) * scale;
      canvas.height = (height ?? h) * scale;
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawAnimation(anim, 0, 0, scale, ctx);
    }
  }, [s, width, height, animName, anim]);
  return (
    <div>
      <canvas style={props.style} ref={canvasRef as any}></canvas>
    </div>
  );
};

export default StaticAnimDiv;
