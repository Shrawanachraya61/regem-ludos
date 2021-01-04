#include "Ball.h"
#include "Brick.h"
#include "Game.h"
#include "GameOptions.h"
#include <sstream>

Ball::Ball(Game& gameA)
    : Actor(gameA, "invisible"),
      lastVx(0),
      lastVy(0),
      disableCollisionSpeedIncrease(false),
      stateGauge(SDL2Wrapper::Gauge(gameA.window, 50)),
      ballType("normal"),
      speed(1.0),
      isSticky(false) {
  anims["ball_normal"] = SDL2Wrapper::Animation();
  game.window.setAnimationFromDefinition("ball_normal", anims["ball_normal"]);
  anims["ball_armored"] = SDL2Wrapper::Animation();
  game.window.setAnimationFromDefinition("ball_armored", anims["ball_armored"]);
  anims["ball_extra"] = SDL2Wrapper::Animation();
  game.window.setAnimationFromDefinition("ball_extra", anims["ball_extra"]);

  setAnimState("ball_normal");
  r = 8;
}

Ball::~Ball() {}

void Ball::saveState() {
  previousStates.push_back(std::make_pair(x, y));
  if (previousStates.size() > 3) {
    previousStates.erase(previousStates.begin());
  }
}

void Ball::setSpeed(double speedA) {
  if (speed > 9) {
    speed = 9;
  }
  speed = speedA;
  std::pair<double, double> pair = game.getNormalizedVec(vx, vy);
  vx = pair.first * speed;
  vy = pair.second * speed;
}

void Ball::setSticky(bool val) {
  if (val) {
    if (!isSticky) {
      isSticky = true;
      lastVx = vx;
      lastVy = vy;
      setV(0, 0);
    }
  } else {
    if (isSticky) {
      isSticky = false;
      setV(lastVx, lastVy);
    }
  }
}

void Ball::setType(const std::string& ballTypeA) {
  ballType = ballTypeA;
  setAnimState("ball_" + ballType);
}

void Ball::handleCollision(const Brick& brick, const std::string& side) {
  if (!disableCollisionSpeedIncrease) {
    disableCollisionSpeedIncrease = true;
    if (ballType == "armored") {
      setSpeed(speed + speed * 0.04);
    } else {
      setSpeed(speed + speed * 0.03);
    }
    addBoolTimer(250, disableCollisionSpeedIncrease);
  }
  if (ballType == "armored" && brick.brickType != "metal") {
    return;
  }

  double minX = game.brickWidth / 2 + r + 1;
  double minY = game.brickHeight / 2 + r + 1;
  if (side == "left") {
    set(brick.x - minX, y);
    setVx(-vx);
  } else if (side == "right") {
    set(brick.x + minX, y);
    setVx(-vx);
  } else if (side == "top") {
    set(x, brick.y - minY);
    setVy(-vy);
  } else if (side == "bottom") {
    set(x, brick.y + minY);
    setVy(-vy);
  } else if (side == "top-left") {
    double dEdgeX = abs((brick.x - game.brickWidth / 2) - (x + r));
    double dEdgeY = abs((brick.y - game.brickHeight / 2) - (y + r));
    if (dEdgeX >= dEdgeY) {
      set(x, brick.y - minY);
    } else {
      set(brick.x - minX, y);
    }
    setV(-1, -1);
    setSpeed(speed);
  } else if (side == "top-right") {
    double dEdgeX = abs((brick.x + game.brickWidth / 2) - (x + r));
    double dEdgeY = abs((brick.y - game.brickHeight / 2) - (y + r));
    if (dEdgeX > dEdgeY) {
      set(x, brick.y - minY);
    } else {
      set(brick.x + minX, y);
    }
    setV(1, -1);
    setSpeed(speed);
  } else if (side == "bottom-left") {
    double dEdgeX = abs((brick.x - game.brickWidth / 2) - (x + r));
    double dEdgeY = abs((brick.y + game.brickHeight / 2) - (y + r));
    if (dEdgeX >= dEdgeY) {
      set(x, brick.y + minY);
    } else {
      set(brick.x - minX, y);
    }
    setV(-1, 1);
    setSpeed(speed);
  } else {
    double dEdgeX = abs((brick.x + game.brickWidth / 2) - (x + r));
    double dEdgeY = abs((brick.y + game.brickHeight / 2) - (y + r));
    if (dEdgeX > dEdgeY) {
      set(x, brick.y + minY);
    } else {
      set(brick.x + minX, y);
    }
    setV(1, 1);
    setSpeed(speed);
  }
}

void Ball::update() {
  Actor::update();
  if (x > GameOptions::width) {
    x = GameOptions::width;
    if (!isSticky) {
      vx = -vx;
    }
  } else if (x < 0) {
    x = 0;
    if (!isSticky) {
      vx = -vx;
    }
  }
  if (y > GameOptions::height) {
    y = GameOptions::height;
    vy = -vy;
  } else if (y < 0) {
    y = 0;
    vy = -vy;
  }

  if (abs(vy) < 0.85 && !isSticky) {
    if (vy < 0) {
      vy -= 0.001 * game.window.getFrameRatio();
    } else {
      vy += 0.001 * game.window.getFrameRatio();
    }
  }

  if (y > game.window.height - 8) {
    remove();
  }
}

void Ball::draw() {
  if (!isSticky) {
    for (unsigned int i = 0; i < previousStates.size(); i++) {
      std::pair<double, double> state = previousStates[i];
      SDL2Wrapper::Animation& anim = anims[animState];
      game.window.globalAlpha =
          128.0 * ((static_cast<double>(i + 1)) /
                   static_cast<double>(previousStates.size()));
      game.window.drawAnimation(
          anim, static_cast<int>(state.first), static_cast<int>(state.second));
      game.window.globalAlpha = 255;
    }
  }
  stateGauge.fill();
  if (stateGauge.isFull()) {
    saveState();
    stateGauge.empty();
  }
  Actor::draw();
}