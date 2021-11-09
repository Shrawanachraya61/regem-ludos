#include "Actor.h"
#include "Game.h"
#include "GameOptions.h"
#include "Physics.h"

Actor::Actor(Game& gameA, const std::string& spriteBaseA)
    : game(gameA),
      removeFlag(false),
      animState("invisible"),
      spriteBase(spriteBaseA),
      x(0.0),
      y(0.0),
      vx(0.0),
      vy(0.0),
      ax(0.0),
      ay(0.0),
      accelerationRate(1.0),
      maxSpeed(5.0),
      headingDeg(0.0),
      accelerating(false),
      frictionEnabled(true),
      wrapEnabled(true),
      gravityEnabled(false),
      r(12.0),
      dying(false) {

  createAnimationDefinition("invisible");
  setAnimState("invisible");
}

Actor::~Actor() { anims.clear(); }

void Actor::createAnimationDefinition(const std::string& def) {
  SDL2Wrapper::Animation anim;
  game.window.setAnimationFromDefinition(def, anim);
  anims[def] = anim;
}

std::pair<double, double> Actor::get() const { return std::make_pair(x, y); }

void Actor::set(const double xA, const double yA) {
  x = xA;
  y = yA;
}
void Actor::setV(const double vxA, const double vyA) {
  vx = vxA;
  vy = vyA;
}
void Actor::setA(const double axA, const double ayA) {
  ax = axA;
  ay = ayA;
}
void Actor::setVx(const double vxA) { vx = vxA; }
void Actor::setVy(const double vyA) { vy = vyA; }
void Actor::setAx(const double axA) { ax = axA; }
void Actor::setAy(const double ayA) { ay = ayA; }
void Actor::setHeading(const double heading) {
  double nextHeading = heading;
  while (nextHeading < 0) {
    nextHeading += 360;
  }
  while (nextHeading > 360) {
    nextHeading -= 360;
  }
  headingDeg = nextHeading;
}
void Actor::decelerateX(double rate) {
  double frameRatio = game.window.getFrameRatio();
  double maxVx = 0.0;

  if (vx < maxVx) {
    vx += rate * frameRatio;
  } else if (vx > maxVx) {
    vx -= rate * frameRatio;
  }

  if (abs(vx) < rate) {
    vx = 0.0;
  }
}

void Actor::decelerateY(double rate) {
  double frameRatio = game.window.getFrameRatio();
  double maxVY = 0.0;

  if (vy < maxVY) {
    vy += rate * frameRatio;
  } else if (vy > maxVY) {
    vy -= rate * frameRatio;
  }

  if (abs(vy) < rate) {
    vy = 0.0;
  }
}

Circle Actor::getCollisionCircle() { return Circle(x, y, r); }

void Actor::setAnimState(const std::string& state) {
  if (animState != state) {
    if (anims.find(state) != anims.end()) {
      animState = state;
      SDL2Wrapper::Animation& anim = anims[animState];
      anim.start();
    }
  }
}

void Actor::remove() { removeFlag = true; }

bool Actor::shouldRemove() const { return removeFlag; }

void Actor::onRemove() {}

SDL2Wrapper::Timer& Actor::addBoolTimer(const int maxTimeMs, bool& ref) {
  timers.push_back(
      std::make_unique<SDL2Wrapper::BoolTimer>(game.window, maxTimeMs, ref));
  return *timers.back();
}

SDL2Wrapper::Timer& Actor::addFuncTimer(const int maxTimeMs,
                                        std::function<void()> cb) {
  timers.push_back(
      std::make_unique<SDL2Wrapper::FuncTimer>(game.window, maxTimeMs, cb));
  return *timers.back();
}

void Actor::update() {
  double frameRatio = game.window.getFrameRatio();

  if (accelerating) {
    double headingRad = degreesToRadians(headingDeg);
    ax = sin(float(headingRad)) * accelerationRate;
    ay = -cos(float(headingRad)) * accelerationRate;
  }

  // double vxMod = ax * frameRatio * frameRatio;
  // double vyMod = ay * frameRatio * frameRatio;

  double vxMod = ax * frameRatio;
  double vyMod = ay * frameRatio;

  vx += vxMod;
  vy += vyMod;

  if (abs(vx) > maxSpeed) {
    vx = sgn(vx) * maxSpeed;
  }
  if (abs(vy) > maxSpeed) {
    vy = sgn(vy) * maxSpeed;
  }

  x += vx * frameRatio;
  y += vy * frameRatio;

  unsigned int len = timers.size();
  for (unsigned int i = 0; i < len; i++) {
    SDL2Wrapper::Timer& timer = *timers[i];
    if (timer.shouldRemove()) {
      timers.erase(timers.begin() + i);
      i--;
      len--;
    }
  }
  for (unsigned int i = 0; i < len; i++) {
    SDL2Wrapper::Timer& timer = *timers[i];
    timer.update();
  }

  if (frictionEnabled) {
    if (ax == 0.0) {
      decelerateX(0.02);
    }
    if (ay == 0.0) {
      decelerateY(0.02);
    }
  }
  ax = 0.0;
  ay = 0.0;

  if (wrapEnabled) {
    if (x > GameOptions::width) {
      x = 0;
    } else if (x < 0) {
      x = GameOptions::width;
    }

    // adjusts for ui at the top
    if (y > GameOptions::height) {
      y = 32;
    } else if (y < 32) {
      y = GameOptions::height;
    }
  }
}

void Actor::draw() {
  SDL2Wrapper::Animation& anim = anims[animState];
  game.window.drawAnimation(anim, static_cast<int>(x), static_cast<int>(y));
}