#include "Actor.h"
#include "Game.h"

Actor::Actor(Game& gameA, const std::string& spriteBaseA)
    : game(gameA),
      animState("default"),
      removeFlag(false),
      spriteBase(spriteBaseA),
      x(0.0),
      y(0.0),
      vx(0.0),
      vy(0.0),
      ax(0.0),
      ay(0.0),
      r(16.0) {
  anims["default"] = SDL2Wrapper::Animation();
  game.window.setAnimationFromDefinition(spriteBaseA, anims["default"]);
  setAnimState("default");
}

Actor::~Actor() { anims.clear(); }

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

SDL2Wrapper::Timer& Actor::addBoolTimer(const int maxFrames, bool& ref) {
  timers.push_back(
      std::make_unique<SDL2Wrapper::BoolTimer>(game.window, maxFrames, ref));
  return *timers.back();
}

SDL2Wrapper::Timer& Actor::addFuncTimer(const int maxFrames,
                                        std::function<void()> cb) {
  timers.push_back(
      std::make_unique<SDL2Wrapper::FuncTimer>(game.window, maxFrames, cb));
  return *timers.back();
}

void Actor::update() {
  double frameRatio = game.window.getFrameRatio();

  vx += ax * frameRatio * frameRatio;
  vy += ay * frameRatio * frameRatio;

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
}

void Actor::draw() {
  SDL2Wrapper::Animation& anim = anims[animState];
  game.window.drawAnimation(anim, static_cast<int>(x), static_cast<int>(y));
}