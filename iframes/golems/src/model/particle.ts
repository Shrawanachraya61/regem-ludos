/*
global
Timer
*/

interface Particle {
  x: number;
  y: number;
  text: string;
  timer: Timer;
}

const G_model_createParticle = (
  x: number,
  y: number,
  text: string,
  ms: number
) => {
  const timer = new Timer(ms);
  timer.start();
  return {
    x,
    y,
    text,
    timer,
  };
};
