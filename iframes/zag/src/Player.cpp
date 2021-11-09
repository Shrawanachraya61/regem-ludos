#include "Player.h"
#include "Game.h"
#include "GameOptions.h"
#include "Physics.h"

#include <sstream>

Player::Player(Game& gameA)
    : Actor(gameA, "invisible"), isDead(false), canFire(true) {
  maxSpeed = 3.0;
  accelerationRate = 1;
  x = 0;
  y = 0;
  r = 7;
  wrapEnabled = false;
  frictionRate = 0.2;
}

Player::~Player() {}

const std::string Player::getAnimationStr() {
  if (isDead) {
    return "invisible";
  } else if (canFire) {
    return "player_ready_0";
  } else {
    return "player_wait_0";
  }
}

void Player::setAnimState(const std::string& state) { animState = state; }

void Player::handleCollision(const Rect& blocker,
                             const std::string& collisionResult) {

  if (collisionResult == "top") {
    y = blocker.y - r;
  } else if (collisionResult == "bottom") {
    y = blocker.y + blocker.h + r;
  } else if (collisionResult == "left") {
    x = blocker.x - r;
  } else if (collisionResult == "right") {
    x = blocker.x + blocker.w + r;
  } else if (collisionResult == "top-left") {
    y = blocker.y - r - 1;
    x = blocker.x - r - 1;
  } else if (collisionResult == "top-right") {
    y = blocker.y - r - 1;
    x = blocker.x + blocker.w + r + 1;
  } else if (collisionResult == "bottom-left") {
    y = blocker.y + blocker.h + r + 1;
    x = blocker.x - r - 1;
  } else if (collisionResult == "bottom-right") {
    y = blocker.y + blocker.h + r + 1;
    x = blocker.x + blocker.w + r + 1;
  }
}

// bool logStuff = true;

void Player::update() {
  GameWorld& world = *(game.worldPtr);
  Actor::update();
  setAnimState(getAnimationStr());

  // if (logStuff) {
  //   logStuff = false;
  //   addBoolTimer(250, logStuff);
  //   std::cout << game.window.getFrameRatio() << " "
  //             << game.window.getDeltaTime()
  //             << ", freq=" << SDL_GetPerformanceFrequency() << std::endl;
  // }

  if (y < 512 - 114) {
    y = 512 - 114;
  } else if (y > 512 - 12) {
    y = 512 - 12;
  } else if (x < 0) {
    x = 0;
  } else if (x > 512) {
    x = 512;
  }

  accelerating = false;

  if (world.projectiles.size() == 0) {
    canFire = true;
  }
}

void Player::draw() {
  if (isDead) {
    return;
  }

  GameWorld& world = *(game.worldPtr);

  game.window.drawSprite(animState, x, y);

  // auto pair = game.pxToTileIndex();

  int tileX = (x - BLOCKER_PX_OFFSET) / TILE_WIDTH_PX;
  int tileY = y / TILE_HEIGHT_PX;

  int i = game.pxToTileIndex(x, y);

  std::stringstream ss;
  ss << "POS: " << world.tiles[i] << " i=" << i << " tilePos=" << tileX << ","
     << tileY;

  game.window.drawTextCentered(
      ss.str(), 512 / 2, 512 - 32, game.window.makeColor(255, 255, 255));
}