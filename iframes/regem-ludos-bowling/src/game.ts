import StateMachine from 'javascript-state-machine';
import { calculateTotalScore, Frame } from './score';
import pubSub from './pubsub';
const { subscribe, publish } = pubSub;
import Matter, { Body } from 'matter-js';
import {
  initDraw,
  clearScreen,
  drawCircle,
  drawText,
  drawRectangle,
} from './draw';
const { Composite, Runner, Engine, Bodies } = Matter;

export enum Events {
  GAME_LOAD_COMPLETED,
  GAME_TO_MENU,
  GAME_STARTED,
  FRAME_STARTED,
  MID_FRAME_STARTED,
  PREPARED,
  SPIN_CHOSEN,
  BALL_STARTED_ROLLING,
  BALL_FINISHED_ROLLING,
  BOWLING_FRAME_COMPLETED,
  FRAME_COMPLETED,
  GAME_COMPLETED,
}

export enum States {
  LOADING = 'loading',
  MENU = 'menu',
  GAME_PREPARING = 'game-prepare',
  GAME_CHOOSE_ANGLE = 'game-choose-angle',
  GAME_BOWLING = 'game-bowling',
  GAME_BOWLING_FINISHED = 'game-bowling-finished',
  GAME_COMPLETED = 'game-completed',
}

const globalWindow = window as any;
const getLib = () => globalWindow.Lib;
const SCREEN_WIDTH = 310;
const SCREEN_HEIGHT = Math.round(512 + 412);

globalWindow.Matter = Matter;

function normalize(
  x: number,
  a: number,
  b: number,
  c: number,
  d: number
): number {
  return c + ((x - a) * (d - c)) / (b - a);
}

function normalizeClamp(
  x: number,
  a: number,
  b: number,
  c: number,
  d: number
): number {
  let n = normalize(x, a, b, c, d);
  if (n > d) {
    n = d;
  } else if (n < c) {
    n = c;
  }
  return n;
}

export function getAngleTowards(
  point1: [number, number],
  point2: [number, number]
): number {
  const [x1, y1] = point1;
  const [x2, y2] = point2;
  const lenY = y2 - y1;
  const lenX = x2 - x1;
  const hyp = Math.sqrt(lenX * lenX + lenY * lenY);
  let ret = 0;
  if (y2 >= y1 && x2 >= x1) {
    ret = (Math.asin(lenY / hyp) * 180) / Math.PI + 90;
  } else if (y2 >= y1 && x2 < x1) {
    ret = (Math.asin(lenY / -hyp) * 180) / Math.PI - 90;
  } else if (y2 < y1 && x2 > x1) {
    ret = (Math.asin(lenY / hyp) * 180) / Math.PI + 90;
  } else {
    ret = (Math.asin(-lenY / hyp) * 180) / Math.PI - 90;
  }
  if (ret >= 360) {
    ret = 360 - ret;
  }
  if (ret < 0) {
    ret = 360 + ret;
  }
  return ret;
}

export class Game {
  fsm: any;
  engine: Matter.Engine;

  power: number;

  spin: boolean;

  frameNumber: number;
  shotNumber: number;

  collidedWithFirstPin: boolean;

  frames: Frame[];

  pins: Pin[];
  ball: Ball;

  // if this is being served from Regem Ludos server
  cabinet = false;

  constructor() {
    const canvas = document.createElement('canvas');
    initDraw(canvas, SCREEN_WIDTH, SCREEN_HEIGHT);
    this.collidedWithFirstPin = false;
    canvas.id = 'canv';
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;
    const canvasArea = document.getElementById('canvas-area');
    if (canvasArea) {
      canvasArea.appendChild(canvas);
    }

    this.engine = Engine.create();
    this.engine.gravity.y = 0;

    let hitCtr = 0;
    Matter.Events.on(this.engine, 'collisionStart', () => {
      // const bodyA = event.pairs[0].bodyA;
      // const bodyB = event.pairs[0].bodyB;
      if (this.fsm.state === States.GAME_BOWLING) {
        getLib().playSoundName('pin_hit_' + hitCtr);
        hitCtr++;
        hitCtr = hitCtr % 10;
        this.collidedWithFirstPin = true;
      }
    });

    this.fsm = new StateMachine({
      init: 'loading',
      transitions: [
        { name: 'ready', from: States.LOADING, to: States.MENU },
        { name: 'toMenu', from: States.GAME_COMPLETED, to: States.MENU },
        {
          name: 'startGame',
          from: States.MENU,
          to: States.GAME_PREPARING,
        },
        {
          name: 'walkUpToBowl',
          from: States.GAME_PREPARING,
          to: States.GAME_CHOOSE_ANGLE,
        },
        {
          name: 'bowl',
          from: [States.GAME_CHOOSE_ANGLE],
          to: States.GAME_BOWLING,
        },
        {
          name: 'stopBowl',
          from: States.GAME_BOWLING,
          to: States.GAME_BOWLING_FINISHED,
        },
        {
          name: 'nextShot',
          from: States.GAME_BOWLING_FINISHED,
          to: States.GAME_PREPARING,
        },
        {
          name: 'nextFrame',
          from: States.GAME_BOWLING_FINISHED,
          to: States.GAME_PREPARING,
        },
        {
          name: 'finish',
          from: States.GAME_BOWLING_FINISHED,
          to: States.GAME_COMPLETED,
        },
      ],
      methods: {
        onReady: () => {
          console.log('onReady');
          publish(Events.GAME_LOAD_COMPLETED);
        },
        onToMenu: () => {
          console.log('onToMenu');
          const score = calculateTotalScore(this.frames);
          this.setupNewGame();
          publish(Events.GAME_TO_MENU, score);
        },
        onStartGame: () => {
          console.log('onStartGame');
          publish(Events.GAME_STARTED);
        },
        onWalkUpToBowl: () => {
          console.log('onWalkUpToBowl');
          publish(Events.PREPARED);
        },
        onBowl: () => {
          console.log('onBowl');
          publish(Events.BALL_STARTED_ROLLING);
        },
        onSelectedSpin: () => {
          console.log('onSelectedSpin');
          publish(Events.SPIN_CHOSEN);
        },
        onStopBowl: () => {
          console.log('onStopBowl');
          publish(Events.BALL_FINISHED_ROLLING);
        },
        onNextShot: () => {
          console.log('onNextShot');
          publish(Events.MID_FRAME_STARTED);
        },
        onNextFrame: () => {
          console.log('onNextFrame');
          publish(Events.FRAME_STARTED);
        },
        onFinish: () => {
          console.log('onFinish');
          publish(Events.GAME_COMPLETED, calculateTotalScore(this.frames));
        },
      },
    });

    subscribe(Events.GAME_LOAD_COMPLETED, () => {
      setTimeout(() => {
        this.loop();
      });
    });
    subscribe(Events.BALL_STARTED_ROLLING, () => {
      setTimeout(() => {
        getLib().playSoundName('ball_return');
      }, 4000);

      setTimeout(() => {
        this.fsm.stopBowl();
      }, 3500);
    });
    subscribe(Events.BALL_FINISHED_ROLLING, () => {
      const previousNumRemainingPins = this.pins.length;

      this.removeKnockedDownPins();
      this.ball.remove();

      const numRemainingPins = this.pins.reduce((prev, pin) => {
        return prev + (pin.removeFlag ? 0 : 1);
      }, 0);
      const currentFrame = this.frames[this.frameNumber];
      let nextFrame = false;

      // strike
      if (this.shotNumber === 0 && numRemainingPins === 0) {
        currentFrame.shot0 = 10;
        currentFrame.strike = true;
        nextFrame = true;

        getLib().notifyRPGScript(`
          +:jump(Ada);
        `);
      }
      // spare
      else if (this.shotNumber === 1 && numRemainingPins === 0) {
        currentFrame.shot1 = previousNumRemainingPins;
        currentFrame.spare = true;
        nextFrame = true;
        getLib().notifyRPGScript(`
          +:jump(Ada);
        `);
      }
      // first shot was a dud
      else if (this.shotNumber === 0) {
        currentFrame.shot0 = previousNumRemainingPins - numRemainingPins;
        if (previousNumRemainingPins === numRemainingPins) {
          getLib().notifyRPGScript(`
            +:sad(Ada);
          `);
        } else {
          getLib().notifyRPGScript(`
            +:teardrop(Ada);
          `);
        }
      }
      // second shot was a dud
      else if (this.shotNumber === 1) {
        currentFrame.shot1 = previousNumRemainingPins - numRemainingPins;
        nextFrame = true;
        if (previousNumRemainingPins === numRemainingPins) {
          getLib().notifyRPGScript(`
            +setAnimationAndWait(Ada, 'ada_shake_head_down');
          `);
        } else {
          getLib().notifyRPGScript(`
            +:teardrop(Ada);
          `);
        }
      }

      if (this.frameNumber === 9) {
        if (this.shotNumber === 0) {
          if (numRemainingPins === 0) {
            currentFrame.strike = true;
            getLib().notifyRPGScript(`
              +:jump(Ada);
            `);
            setTimeout(() => {
              this.setupPins();
            }, 900);
          }
          nextFrame = false;
        } else if (
          this.shotNumber === 1 &&
          (currentFrame.strike || currentFrame.spare)
        ) {
          if (numRemainingPins === 0) {
            if (numRemainingPins === 0) {
              if (previousNumRemainingPins === 10) {
                currentFrame.strike = true;
                getLib().notifyRPGScript(`
                +:jump(Ada);
              `);
              } else {
                currentFrame.spare = true;
                getLib().notifyRPGScript(`
                +:jump(Ada);
              `);
              }
            }
            setTimeout(() => {
              this.setupPins();
            }, 900);
          }

          nextFrame = false;
        } else if (this.shotNumber === 2) {
          currentFrame.shot2 = previousNumRemainingPins - numRemainingPins;
          if (numRemainingPins === 0) {
            if (previousNumRemainingPins === 10) {
              currentFrame.strike = true;
              getLib().notifyRPGScript(`
              +:jump(Ada);
            `);
            } else {
              currentFrame.spare = true;
              getLib().notifyRPGScript(`
              +:jump(Ada);
            `);
            }
          }
          nextFrame = true;
        }
      }

      if (nextFrame && this.frameNumber === 9) {
        setTimeout(() => {
          this.fsm.finish();
        }, 1000);
        return;
      }

      if (nextFrame) {
        setTimeout(() => {
          this.fsm.nextFrame();
        }, 1000);
      } else {
        setTimeout(() => {
          this.fsm.nextShot();
        }, 1000);
      }
    });
    subscribe(Events.GAME_STARTED, () => {
      getLib().notifyRPGScript(`
        +walkToMarker(Ada, MarkerBowlReady);
        +setAnimation(Ada, ada_bowl_prepare);
      `);
    });
    subscribe(Events.MID_FRAME_STARTED, () => {
      this.shotNumber++;
      this.reAlignPins();
      this.setupBall();
      getLib().notifyRPGScript(`
        +walkToMarker(Ada, MarkerBowlReady);
        +setAnimation(Ada, ada_bowl_prepare);
      `);
    });
    subscribe(Events.FRAME_STARTED, () => {
      this.frameNumber++;
      this.setupNewFrame();
      getLib().notifyRPGScript(`
        +walkToMarker(Ada, MarkerBowlReady);
        +setAnimation(Ada, ada_bowl_prepare);
      `);
    });
    subscribe(Events.BALL_STARTED_ROLLING, () => {
      getLib().playSoundName('ball_start');
      getLib().notifyRPGScript(`
        +setAnimation(Ada, ada_bowl_ball);
      `);
    });
    // subscribe(Events.BALL_FINISHED_ROLLING, () => {
    //   getLib().notifyRPGScript(`
    //     +setAnimation(Ada, ada_idle_leftup);
    //   `);
    // });
    subscribe(Events.GAME_TO_MENU, () => {
      if (canvasArea) {
        canvasArea.style.display = 'none';
      }
    });
    subscribe(Events.GAME_LOAD_COMPLETED, () => {
      if (canvasArea) {
        canvasArea.style.border = '2px solid white';
        canvasArea.style.display = 'none';
      }
    });
    subscribe(Events.GAME_COMPLETED, () => {
      getLib().playSoundName('game_completed');
      if (canvasArea) {
        canvasArea.style.display = 'none';
      }
    });
    subscribe(Events.GAME_STARTED, () => {
      this.setupNewGame();
      if (canvasArea) {
        canvasArea.style.display = 'block';
      }
    });
    subscribe(Events.PREPARED, () => {
      getLib().notifyRPGScript(`
        +walkToMarker(Ada, MarkerBowlBall);
        +setAnimation(Ada, ada_bowl_prepare);
      `);
    });

    this.load()
      .then(() => {
        this.fsm.ready();
      })
      .catch(e => {
        console.error('Failed to load game', e);
      });
  }

  async load() {
    // load specific font so it doesn't pop in.
    setTimeout(function () {
      (document as any).fonts.load('16px "TerminalWideRegular"');
    }, 0);

    // bowling hit and ball use sound Attribution Noncommercial License.
    // https://freesound.org/people/Scott_Snailham/sounds/476508/
    for (let i = 0; i < 10; i++) {
      await getLib().loadSound('pin_hit_' + i, 'bowling_pin_hit.mp3');
    }
    await getLib().loadSound('ball_start', 'bowling_ball_shot.mp3');

    // https://www.soundsnap.com/streamers/play2.php?t=l&p=files%2Faudio%2F63%2FEFX+INT+Bowling+ball+return+03.wav
    await getLib().loadSound('ball_return', 'bowling_ball_return.mp3');

    // zzfx
    await getLib().loadSound('game_completed', 'bowling_completed.mp3');
  }

  setupNewGame() {
    this.spin = false;
    this.frameNumber = 0;
    this.shotNumber = 0;
    this.frames = [];
    for (let i = 0; i < 10; i++) {
      this.frames.push({
        shot0: -1,
        shot1: -1,
        shot2: -1,
      });
    }

    this.setupNewFrame();
  }

  setupNewFrame() {
    this.startXOffset = 0;
    this.shotNumber = 0;

    this.setupPins();
    this.setupBall();
  }

  setupPins() {
    const engine = this.engine;
    this.pins?.forEach(p => p.remove());
    this.pins = this.getPinPositions().map(({ x, y }, i) => {
      return new Pin(i, x, y, engine);
    });
  }

  setupBall() {
    this.ball = new Ball(
      SCREEN_WIDTH / 2 + this.startXOffset,
      SCREEN_HEIGHT - 60,
      this.engine
    );
    if (this.ball.body) {
      this.ball.setPosition(
        SCREEN_WIDTH / 2 + this.startXOffset,
        this.ball.body?.position.y
      );
    }
  }

  getPinPositions(): { x: number; y: number }[] {
    const offsetX = SCREEN_WIDTH / 2;
    const offsetY = 0;
    const rowHeight = 40;
    const ret: { x: number; y: number }[] = [];
    for (let row = 0; row < 4; row++) {
      let x = offsetX;
      const y = offsetY + (4 - row) * rowHeight;
      for (let i = 0; i <= row; i++) {
        switch (row) {
          case 0: {
            x = offsetX + i * rowHeight;
            break;
          }
          case 1: {
            x = offsetX - rowHeight / 2 + i * rowHeight;
            break;
          }
          case 2: {
            x = offsetX - rowHeight + i * rowHeight;
            break;
          }
          case 3: {
            x = offsetX - rowHeight / 2 - rowHeight + i * rowHeight;
            break;
          }
        }
        ret.push({ x, y });
      }
    }
    return ret;
  }

  removeKnockedDownPins() {
    const pins = this.pins;

    return pins.forEach(pin => {
      const d = pin.getDistanceFromStartingPosition();
      if (d > 15) {
        pin.remove();
      }
    });
  }

  reAlignPins() {
    this.getPinPositions().forEach(({ x, y }, i) => {
      const pin = this.pins.find(p => p.id === i);
      if (pin) {
        pin.setPosition(x, y);
      }
    });
  }

  bowlBall() {
    this.collidedWithFirstPin = false;
    const ball = this.ball;
    if (ball.body) {
      Matter.Body.setStatic(ball.body, false);
      const angleDeg = getAngleTowards(
        [ball.body.position.x, ball.body.position.y],
        [SCREEN_WIDTH / 2 + this.targetXOffset, SCREEN_WIDTH / 2]
      );
      const force = {
        x: 36 * Math.sin((angleDeg * Math.PI) / 180),
        y: -18.85,
      };
      console.log('APPLY FORCE', force);
      Matter.Body.applyForce(ball.body, ball.body.position, force);
      // Matter.Body.setAngularVelocity(ball.body, -3);
      this.fsm.bowl();
    }
  }

  getPhysicsObjectFromBody(body: Matter.Body) {
    const pin = this.pins.find(p => p.body === body);
    if (pin) {
      return pin;
    }

    if (this.ball.body === body) {
      return this.ball;
    }
  }

  settingXOffsetIntervalId: NodeJS.Timeout | null = null;
  isSettingXOffset: boolean;
  startXOffset = 0;
  beginSettingStartingXOffset(direction: -1 | 1) {
    if (this.isSettingXOffset || this.fsm.state !== States.GAME_PREPARING) {
      return;
    }

    this.isSettingXOffset = true;
    const moveBall = () => {
      const limit = SCREEN_WIDTH / 2 - 25;
      if (direction === -1) {
        this.startXOffset -= 3;
        if (this.startXOffset < -limit) {
          this.startXOffset = -limit;
        }
      } else {
        this.startXOffset += 3;
        if (this.startXOffset > limit) {
          this.startXOffset = limit;
        }
      }
      if (this.ball.body) {
        this.ball.setPosition(
          SCREEN_WIDTH / 2 + this.startXOffset,
          this.ball.body?.position.y
        );
      }
    };
    this.settingXOffsetIntervalId = setInterval(moveBall, 33);
    moveBall();
  }
  stopSettingStartingXOffset() {
    this.isSettingXOffset = false;
    if (this.settingXOffsetIntervalId) {
      clearInterval(this.settingXOffsetIntervalId);
      this.settingXOffsetIntervalId = null;
    }
  }

  settingTargetIntervalId: NodeJS.Timeout | null = null;
  isSettingTargetXOffset: boolean;
  targetXOffset = 0;
  beginSettingTargetXOffset() {
    if (
      this.isSettingTargetXOffset ||
      this.fsm.state !== States.GAME_PREPARING
    ) {
      return;
    }

    this.isSettingTargetXOffset = true;
    const limit = SCREEN_WIDTH / 2 - 25;
    let moveDirection = 1;
    this.targetXOffset = -limit;
    const moveTarget = () => {
      if (moveDirection === -1) {
        this.targetXOffset -= 10;
        if (this.targetXOffset < -limit) {
          this.targetXOffset = -limit;
          moveDirection = 1;
        }
      } else {
        this.targetXOffset += 10;
        if (this.targetXOffset > limit) {
          this.targetXOffset = limit;
          moveDirection = -1;
        }
      }
    };
    this.settingTargetIntervalId = setInterval(moveTarget, 33);
    this.fsm.walkUpToBowl();
  }
  stopSettingTargetXOffset() {
    this.isSettingTargetXOffset = false;
    if (this.settingTargetIntervalId) {
      clearInterval(this.settingTargetIntervalId);
      this.settingTargetIntervalId = null;
    }
  }

  loop() {
    const runner = Runner.create({
      delta: 1000 / 60,
    });
    Runner.run(runner, this.engine);

    globalWindow.engine = this.engine;
    this.setupNewGame();
    // this.fsm.startGame();

    // create a renderer
    // var render = Render.create({
    //   element: document.body,
    //   engine: engine,
    // });

    // spin loop
    setInterval(() => {
      const maxSpeed = 8.8;
      const minSpeed = 8;
      const body = this.ball.body;

      if (
        this.fsm.state === States.GAME_BOWLING &&
        !this.collidedWithFirstPin &&
        body &&
        this.spin
      ) {
        const vy = body.velocity.y;
        const speed = Math.abs(vy);
        const ang = normalizeClamp(speed, minSpeed, maxSpeed, 0, 90);
        const mult = Math.cos((ang * Math.PI) / 180);
        Matter.Body.applyForce(body, body.position, {
          x: -0.25 * mult,
          y: 0,
        });
      }
    }, 33);

    const _loop = () => {
      window.requestAnimationFrame(_loop);
      clearScreen();
      drawRectangle(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, '#333');
      if (
        this.fsm.state === States.GAME_COMPLETED ||
        this.fsm.state === States.MENU ||
        this.fsm.state === States.LOADING
      ) {
        return;
      }

      const pins = this.pins;
      for (let i = 0; i < pins.length; i++) {
        const pin = pins[i];
        pin.draw();
        if (pin.removeFlag) {
          pins.splice(i, 1);
          i--;
        }
      }

      const ball = this.ball;
      ball.draw();

      if (this.isSettingTargetXOffset) {
        const yOffset = 10;
        drawCircle(
          SCREEN_WIDTH / 2 + this.targetXOffset,
          SCREEN_HEIGHT / 2 - 10 + yOffset,
          3,
          'white'
        );
        drawCircle(
          SCREEN_WIDTH / 2 + this.targetXOffset,
          SCREEN_HEIGHT / 2 - 5 + yOffset,
          4,
          'white'
        );
        drawCircle(
          SCREEN_WIDTH / 2 + this.targetXOffset,
          SCREEN_HEIGHT / 2 + yOffset,
          5,
          'white'
        );
      }

      if (this.isSettingTargetXOffset) {
        const textYOffset = 80;
        drawText(
          'Tap Here!',
          SCREEN_WIDTH / 2,
          SCREEN_HEIGHT / 2 - 30 + textYOffset,
          {
            font: 'TerminalWideRegular',
            size: 20,
            align: 'center',
          }
        );
        drawText('OR', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + textYOffset, {
          font: 'TerminalWideRegular',
          size: 20,
          align: 'center',
        });
        drawText(
          'Press ' + getLib().getActionKey().label + '!',
          SCREEN_WIDTH / 2,
          SCREEN_HEIGHT / 2 + 30 + textYOffset,
          {
            font: 'TerminalWideRegular',
            size: 20,
            align: 'center',
          }
        );
      }

      // debug
      // ctx.beginPath();

      // var bodies = Composite.allBodies(engine.world);
      // for (var i = 0; i < bodies.length; i += 1) {
      //   var vertices = bodies[i].vertices;

      //   ctx.moveTo(vertices[0].x, vertices[0].y);

      //   for (var j = 1; j < vertices.length; j += 1) {
      //     ctx.lineTo(vertices[j].x, vertices[j].y);
      //   }

      //   ctx.lineTo(vertices[0].x, vertices[0].y);
      // }

      // ctx.lineWidth = 1;
      // ctx.strokeStyle = 'white';
      // ctx.stroke();
    };
    _loop();
  }
}

class PhysicsBody {
  engine: Matter.Engine;
  width: number;
  height: number;
  body: Matter.Body | null;
  removeFlag: boolean;
  constructor(engine: Matter.Engine) {
    this.engine = engine;
    this.width = 10;
    this.height = 10;
    this.body = null;
    this.removeFlag = false;
  }

  setBody(body: Matter.Body) {
    this.body = body;
    Composite.add(this.engine.world, this.body);
  }

  setPosition(x: number, y: number) {
    if (this.body) {
      Matter.Body.set(this.body, 'position', { x, y });
    }
  }

  remove() {
    this.removeFlag = true;
    if (this.body) {
      Matter.Composite.remove(this.engine.world, this.body);
    }
  }

  draw() {}
}

class Pin extends PhysicsBody {
  id: number;
  width: number;
  height: number;
  startX: number;
  startY: number;
  color: string;

  constructor(id: number, x: number, y: number, engine: Matter.Engine) {
    super(engine);
    this.id = id;
    this.width = 20;
    this.height = 20;
    this.color = 'lightblue';
    this.startX = x;
    this.startY = y;

    this.setBody(
      Bodies.circle(x, y, this.width / 2, {
        friction: 1,
        frictionAir: 0.02,
        frictionStatic: 0.4,
        restitution: 0.9,
        density: 0.3,
      })
    );
  }

  getDistanceFromStartingPosition() {
    if (this.body) {
      return Math.sqrt(
        (this.body.position.x - this.startX) ** 2 +
          (this.body.position.y - this.startY) ** 2
      );
    } else {
      return Infinity;
    }
  }

  draw() {
    if (this.body) {
      const pos = this.body.position;
      drawCircle(pos.x, pos.y, this.width / 2, this.color);
      if (this.getDistanceFromStartingPosition() > this.width - 5) {
        this.color = 'orange';
      }
    }
  }
}

class Ball extends PhysicsBody {
  constructor(x: number, y: number, engine: Matter.Engine) {
    super(engine);
    this.width = 40;
    this.height = 40;
    this.removeFlag = false;
    this.setBody(
      Bodies.circle(x, y, this.width / 2, {
        frictionAir: 0.001,
        restitution: 0.2,
        density: 0.85,
        isStatic: true,
      })
    );
  }

  draw() {
    if (this.body) {
      const pos = this.body.position;
      drawCircle(pos.x, pos.y, this.width / 2, 'red');
    }
  }

  drawWithXOffset(offsetX: number) {
    if (this.body) {
      const pos = this.body.position;
      drawCircle(pos.x + offsetX, pos.y, this.width / 2, 'red');
    }
  }
}
