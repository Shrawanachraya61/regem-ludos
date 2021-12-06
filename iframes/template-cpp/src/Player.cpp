#include "Player.h"
#include "Game.h"
#include "GameOptions.h"
#include "Physics.h"

Player::Player(Game &gameA)
    : Actor(gameA, "invisible"), isDead(false), canFire(true) {
  accelerationRate = .1;
  maxSpeed = 3;
  x = 0;
  y = 0;
  r = 16;
  gravityEnabled = true;
}

Player::~Player() {}

const std::string Player::getAnimationStr() { return animState; }

void Player::setAnimState(const std::string &state) { animState = state; }

// bool logStuff = true;

void Player::update() {
  Actor::update();
  setAnimState(getAnimationStr());

  // if (logStuff) {
  //   logStuff = false;
  //   addBoolTimer(250, logStuff);
  //   std::cout << game.window.getFrameRatio() << " "
  //             << game.window.getDeltaTime()
  //             << ", freq=" << SDL_GetPerformanceFrequency() << std::endl;
  // }

  accelerating = false;
}

void Player::draw() {
  if (isDead) {
    return;
  }

  game.window.drawSprite(animState, x, y);
}