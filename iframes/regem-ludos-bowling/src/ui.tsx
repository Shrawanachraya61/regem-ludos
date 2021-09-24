import React, { useEffect, useState } from 'react';
import { render } from 'react-dom';
import {
  calculateScoreForFrame,
  calculateScoreUpToFrame,
  calculateTotalScore,
  Frame,
} from './score';
import { Events, States, Game } from './game';

import pubSub from './pubsub';
const { subscribe } = pubSub;

subscribe(Events.GAME_LOAD_COMPLETED, () => {
  getUiInterface().render();
});
subscribe(Events.GAME_COMPLETED, () => {
  getUiInterface().render();
});
subscribe(Events.GAME_TO_MENU, () => {
  getUiInterface().render();
});
subscribe(Events.GAME_STARTED, () => {
  getUiInterface().render();
});
subscribe(Events.FRAME_STARTED, () => {
  getUiInterface().render();
});
subscribe(Events.MID_FRAME_STARTED, () => {
  getUiInterface().render();
});
subscribe(Events.PREPARED, () => {
  getUiInterface().render();
});
subscribe(Events.SPIN_CHOSEN, () => {
  getUiInterface().render();
});
subscribe(Events.BALL_STARTED_ROLLING, () => {
  getUiInterface().render();
});
subscribe(Events.BALL_FINISHED_ROLLING, () => {
  getUiInterface().render();
});

export type KeyboardEventHandler = (ev: KeyboardEvent) => void;
export const useKeyboardEventListener = (
  cb: KeyboardEventHandler,
  captures?: any[]
) => {
  useEffect(() => {
    const handleKeyDown = (ev: KeyboardEvent) => {
      cb(ev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, captures);
};

const globalWindow = window as any;
const getLib = () => globalWindow.Lib;
const getGame = (): Game => globalWindow.game;

const div = document.createElement('div');
document.body.append(div);
export const mountUi = () => {
  render(<ScoreContainer />, div);
  const inputArea = document.getElementById('input-area');
  if (inputArea) {
    render(<InputMain />, inputArea);
  }
};

const uiInterface = {
  renderControls: () => {},
  renderScore: () => {},
  render: () => {
    uiInterface.renderControls();
    uiInterface.renderScore();
  },
};

export const getUiInterface = () => {
  return uiInterface;
};

const InputMain = () => {
  const [r, setRender] = useState(false);

  uiInterface.renderControls = () => {
    setRender(!r);
  };

  const game = getGame();
  if (game.fsm.state === States.MENU) {
    return <MenuContainer />;
  } else if (game.fsm.state === States.GAME_COMPLETED) {
    return <GameCompletedContainer />;
  } else {
    return <InputContainer />;
  }
};

const MenuContainer = () => {
  const handleStartGameClick = () => {
    getGame().fsm.startGame();
  };

  useKeyboardEventListener(ev => {
    if (ev.key === getLib().getActionKey().key) {
      handleStartGameClick();
    }
  });

  return (
    <div
      style={{
        width: '400px',
        border: '2px solid white',
        background: '#333',
        padding: '8px',
        fontFamily: 'TerminalWideRegular',
        transform: 'translateY(-60px)',
      }}
    >
      <h2 style={{ textAlign: 'center', textDecoration: 'underline' }}>
        Regem Ludos Bowling
      </h2>
      <button
        onClick={handleStartGameClick}
        style={{
          width: '100%',
        }}
      >
        Play! ({getLib().getActionKey().label})
      </button>
      <div
        style={{
          margin: '16px 0px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      ></div>
    </div>
  );
};

const GameCompletedContainer = () => {
  const handleToMenuClick = () => {
    getGame().fsm.toMenu();
  };

  useKeyboardEventListener(() => {
    handleToMenuClick();
  });

  return (
    <div
      style={{
        width: '400px',
        border: '2px solid white',
        background: '#333',
        padding: '8px',
        fontFamily: 'TerminalWideRegular',
        transform: 'translateY(-60px)',
      }}
    >
      <h2 style={{ textAlign: 'center', textDecoration: 'underline' }}>
        Game Completed!
      </h2>
      <div
        style={{
          textAlign: 'center',
        }}
      >
        Press any key to accept score.
      </div>
      <div
        style={{
          margin: '16px 0px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      ></div>
    </div>
  );
};

const InputContainer = () => {
  const handleLeftArrowDown = () => {
    getGame().beginSettingStartingXOffset(-1);
  };

  const handleRightArrowDown = () => {
    getGame().beginSettingStartingXOffset(1);
  };

  const handleToggleSpin = () => {
    getGame().spin = !getGame().spin;
    getUiInterface().render();
  };

  useEffect(() => {
    const handleMouseDown = () => {
      const game = getGame();
      if (game.isSettingTargetXOffset) {
        game.stopSettingTargetXOffset();
        game.bowlBall();
      }
    };

    const handleMouseUp = () => {
      getGame().stopSettingStartingXOffset();
    };

    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'ArrowLeft') {
        handleLeftArrowDown();
      } else if (ev.key === 'ArrowRight') {
        handleRightArrowDown();
      } else if (ev.key === ' ') {
        const game = getGame();
        if (game.isSettingTargetXOffset) {
          game.stopSettingTargetXOffset();
          game.bowlBall();
        } else {
          game.beginSettingTargetXOffset();
        }
      } else if (ev.key === getLib().getAuxKey().key) {
        handleToggleSpin();
      }
    };

    const handleKeyUp = (ev: KeyboardEvent) => {
      if (ev.key === 'ArrowLeft') {
        getGame().stopSettingStartingXOffset();
      } else if (ev.key === 'ArrowRight') {
        getGame().stopSettingStartingXOffset();
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('touchstart', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('touchstart', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div
      className="prepare-area"
      style={{
        width: '400px',
        border: '2px solid white',
        background: '#333',
        padding: '8px',
        fontFamily: 'TerminalWideRegular',
        opacity: getGame().fsm.state === States.GAME_PREPARING ? '1' : '0',
        transform: getGame().cabinet ? 'translateX(85px)' : 'unset',
      }}
    >
      <h2 style={{ textAlign: 'center', textDecoration: 'underline' }}>
        Prepare
      </h2>
      <div
        style={{
          margin: '16px 0px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <button
          onMouseDown={handleLeftArrowDown}
          onTouchStart={handleLeftArrowDown}
        >
          <ArrowIcon
            color="white"
            style={{
              cursor: 'pointer',
              userSelect: 'none',
              transform: 'scaleX(-1)',
              // animation: '0.75s pulse-left ease-out infinite',
              width: '60px',
            }}
          />
        </button>
        <div
          style={{
            textAlign: 'center',
            margin: '8px',
            fontSize: '16px',
          }}
        >
          Adjust Ball Position (Left/Right Arrows)
        </div>
        <button
          onMouseDown={handleRightArrowDown}
          onTouchStart={handleRightArrowDown}
        >
          <ArrowIcon
            color="white"
            style={{
              cursor: 'pointer',
              userSelect: 'none',
              // animation: '0.75s pulse-right ease-out infinite',
              width: '60px',
            }}
          />
        </button>
      </div>
      <div
        style={{
          margin: '16px 0px',
          textAlign: 'center',
        }}
      >
        Spin: <span style={{ color: 'rgb(74, 205, 255)' }}>{0}%</span>
      </div>
      <div
        style={{
          margin: '16px 0px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            fontSize: '16px',
            marginLeft: '12px',
          }}
        >
          <input
            id="spin"
            name="spin"
            style={{
              transform: 'translateX(17px) scale(2.0)',
            }}
            type="checkbox"
            onChange={handleToggleSpin}
            checked={Boolean(getGame().spin)}
          />
          <label
            htmlFor="spin"
            style={{
              width: '80%',
            }}
          >
            Counter-Clockwise Spin ({getLib().getAuxKey().label})
          </label>
        </div>
      </div>
      <div
        style={{
          margin: '8px 0px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={() => {
            getGame().beginSettingTargetXOffset();
          }}
          style={{
            width: '100%',
          }}
        >
          Bowl! ({getLib().getActionKey().label})
        </button>
      </div>
    </div>
  );
};

const ArrowIcon: React.FC<{
  className?: string;
  color: string;
  style?: Record<string, string>;
}> = props => {
  return (
    <svg
      className={props.className}
      version="1.1"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      style={props.style}
    >
      <path
        d="M1.06,29.897c0.011,0,0.023,0,0.034-0.001c0.506-0.017,0.825-0.409,0.868-0.913  c0.034-0.371,1.03-9.347,15.039-9.337l0.031,5.739c0,0.387,0.223,0.739,0.573,0.904c0.347,0.166,0.764,0.115,1.061-0.132  l12.968-10.743c0.232-0.19,0.366-0.475,0.365-0.774c-0.001-0.3-0.136-0.584-0.368-0.773L18.664,3.224  c-0.299-0.244-0.712-0.291-1.06-0.128c-0.349,0.166-0.571,0.518-0.571,0.903l-0.031,5.613c-5.812,0.185-10.312,2.054-13.23,5.468  c-4.748,5.556-3.688,13.63-3.639,13.966C0.207,29.536,0.566,29.897,1.06,29.897z M18.032,17.63c-0.001,0-0.002,0-0.002,0  C8.023,17.636,4.199,21.015,2.016,23.999c0.319-2.391,1.252-5.272,3.281-7.626c2.698-3.128,7.045-4.776,12.735-4.776  c0.553,0,1-0.447,1-1V6.104l10.389,8.542l-10.389,8.622V18.63c0-0.266-0.105-0.521-0.294-0.708  C18.551,17.735,18.297,17.63,18.032,17.63z"
        fill={props.color}
      />
    </svg>
  );
};

const ScoreContainer = () => {
  const [r, setRender] = useState(false);

  const game: Game = globalWindow.game;

  uiInterface.renderScore = () => {
    setRender(!r);
  };

  return (
    <div style={{}}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <ScoreCard frames={game.frames} />
      </div>
    </div>
  );
};

const ScoreCard = (props: { frames?: Frame[] }) => {
  const frames = props.frames;

  if (!frames || getGame().fsm.state === States.MENU) {
    return <div></div>;
  }

  return (
    <table
      style={{
        background: '#333',
        fontSize: '16px',
        border: '2px solid white',
        transform: 'translateY(50px)',
      }}
    >
      <thead>
        <tr>
          <th>1</th>
          <th>2</th>
          <th>3</th>
          <th>4</th>
          <th>5</th>
          <th>6</th>
          <th>7</th>
          <th>8</th>
          <th>9</th>
          <th>10</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          {frames.map((frame, i) => {
            const frameScore = calculateScoreForFrame(i, frames);
            const scoreUpToFrame = calculateScoreUpToFrame(i, frames);

            let shot0 = frame.shot0 >= 0 ? frame.shot0 : ' ';
            let shot1 = frame.shot1 >= 0 ? frame.shot1 : ' ';
            let shot2 = '';

            if (frame.strike && shot0 === 10) {
              shot0 = 'X';
            }
            if (frame.spare && frame.shot0 + frame.shot1 === 10) {
              shot1 = '/';
            }

            if (frame.strike && frame.shot1 === 10) {
              shot1 = 'X';
            }

            if (
              frame.spare &&
              frame.shot1 + frame.shot2 === 10 &&
              !(frame.shot0 + frame.shot1 === 10)
            ) {
              shot2 = '/';
            }
            if (frame.strike && frame.shot2 === 10) {
              shot2 = 'X';
            }

            return (
              <td key={'frame' + i}>
                <div
                  style={{
                    background: 'grey',
                    display: 'flex',
                    height: '30px',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                  }}
                >
                  <span>{shot0}</span>
                  <span>{shot1}</span>
                  {frame.shot2 >= 0 ? (
                    <span>{frame.shot2 >= 0 ? shot2 : ''}</span>
                  ) : null}
                </div>
                <div
                  style={{
                    width: '60px',
                    height: '30px',
                    background: 'black',
                    textAlign: 'center',
                    fontSize: '18px',
                    lineHeight: '30px',
                  }}
                >
                  {frameScore > -1 ? scoreUpToFrame : ''}
                </div>
              </td>
            );
          })}
          <td
            style={{
              background: 'black',
            }}
          >
            <div
              style={{
                height: '100%',
                fontSize: '18px',
                textAlign: 'center',
              }}
            >
              {calculateTotalScore(frames)}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
};
