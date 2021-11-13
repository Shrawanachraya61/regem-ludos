#include "Player.h"
#include "Bomber.h"
#include "Game.h"
#include "GameOptions.h"
#include "Particle.h"
#include "Physics.h"
#include "Projectile.h"
#include "Train.h"

#include <sstream>

Player::Player(Game& gameA)
    : Actor(gameA, "invisible"), isDead(false), canFire(true) {
  maxSpeed = 4.3;
  accelerationRate = 0.7;
  x = 0;
  y = 0;
  r = 7;
  wrapEnabled = false;
  frictionRate = 0.3;
}

Player::~Player() {}

void Player::setNextWalkPos() {
  int minX = TILE_WIDTH_PX;
  int minY = 512 - 125;
  int maxX = 512 - TILE_WIDTH_PX * 3;
  int maxY = 512 - TILE_HEIGHT_PX * 3;

  walkX = static_cast<int>(normalize(rand() % 100, 0, 99, minX, maxX));
  walkY = static_cast<int>(normalize(rand() % 100, 0, 99, minY, maxY));

  maxSpeed = walkSpeed;
}

void Player::shootMissile() {
  if (canFire && !game.isTransitioning) {
    game.playSound("player_missile");
    game.worldPtr->projectiles.push_back(
        std::make_unique<Projectile>(game, x, y, PLAYER));
    canFire = false;
  }
}

void Player::setAi(bool isAiA) {
  isAi = isAiA;
  if (isAi) {
    isSettingNextWalkPos = false;
    setNextWalkPos();
  }
}

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
  if (isDead) {
    return;
  }

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

void Player::handleCollision(const Projectile& projectile) {
  if (projectile.type == PLAYER) {
    return;
  }

  if (isDead) {
    return;
  }

  Particle::spawnParticle(game, x, y, PARTICLE_TYPE_ENTITY_EXPL, 50 * 4);
  game.playSound("player_hit");
  isDead = true;
}

void Player::handleCollision(const Train& train) {
  if (isDead) {
    return;
  }

  Particle::spawnParticle(game, x, y, PARTICLE_TYPE_ENTITY_EXPL, 50 * 4);
  game.playSound("player_hit");
  isDead = true;
}

void Player::handleCollision(const Bomber& bomber) {
  if (isDead) {
    return;
  }

  Particle::spawnParticle(game, x, y, PARTICLE_TYPE_ENTITY_EXPL, 50 * 4);
  game.playSound("player_hit");
  isDead = true;
}

void Player::handleCollision(const DuoMissile& missile) {
  if (isDead) {
    return;
  }

  Particle::spawnParticle(game, x, y, PARTICLE_TYPE_ENTITY_EXPL, 50 * 4);
  game.playSound("player_hit");
  isDead = true;
}

// bool logStuff = true;

void Player::update() {
  if (isAi) {
    float d = distance(x, y, walkX, walkY);
    if (d < 50) {
      maxSpeed = walkSpeed / 2;
    }

    if (d < 30) {
      setNextWalkPos();
      clearTimers();
    }

    double heading =
        getAngleDegTowards(std::make_pair(x, y), std::make_pair(walkX, walkY));
    setHeading(heading);

    accelerating = true;

    if (canFire) {
      shootMissile();
      // addFuncTimer(rand() % 100, [=]() { shootMissile(); });
    }
    if (!isSettingNextWalkPos) {
      isSettingNextWalkPos = true;
      addFuncTimer(250 + rand() % 1000, [&]() {
        isSettingNextWalkPos = false;
        setNextWalkPos();
      });
    }
  }

  Actor::update();
  GameWorld& world = *(game.worldPtr);
  setAnimState(getAnimationStr());

  // if (logStuff) {
  //   logStuff = false;
  //   addBoolTimer(250, logStuff);
  //   std::cout << game.window.getFrameRatio() << " "
  //             << game.window.getDeltaTime()
  //             << ", freq=" << SDL_GetPerformanceFrequency() << std::endl;
  // }


  if (y < 512 - 114 + 8) {
    y = 512 - 114 + 8;
  } else if (y > 512 - 12) {
    y = 512 - 12;
  } else if (x < 0) {
    x = 0;
  } else if (x > 512) {
    x = 512;
  }
  

  accelerating = false;

  bool playerProjExists = false;
  for (unsigned int i = 0; i < world.projectiles.size(); i++) {
    const Projectile& p = *world.projectiles[i];
    if (p.type == PLAYER) {
      playerProjExists = true;
      break;
    }
  }
  if (!playerProjExists) {
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

  // int tileX = (x - BLOCKER_PX_OFFSET) / TILE_WIDTH_PX;
  // int tileY = y / TILE_HEIGHT_PX;

  // int i = game.pxToTileIndex(x, y);

  // std::stringstream ss;
  // ss << "POS: " << world.tiles[i] << " i=" << i << " tilePos=" << tileX <<
  // ","
  //    << tileY;

  // game.window.drawTextCentered(
  //     ss.str(), 512 / 2, 512 - 32, game.window.makeColor(255, 255, 255));
}