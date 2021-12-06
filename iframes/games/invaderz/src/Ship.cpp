#include "Ship.h"
#include "Game.h"
#include "GameOptions.h"
#include "Projectile.h"

Ship::Ship(Game& gameA,
           const std::string& spriteBaseA,
           const int allegianceA,
           const int hpA)
    : Actor(gameA, spriteBaseA),
      speed(2),
      shouldSwitchToDefaultState(false),
      allegiance(allegianceA),
      hp(hpA) {
  anims["damaged"] = SDL2Wrapper::Animation();
  game.window.setAnimationFromDefinition(spriteBaseA + "_Damaged",
                                         anims["damaged"]);
  anims["explosion"] = SDL2Wrapper::Animation();
  game.window.setAnimationFromDefinition("explosion", anims["explosion"]);
}

Ship::~Ship() {}

void Ship::onCollision(Projectile& proj) {
  if (isExploding() || proj.allegiance == allegiance) {
    return;
  }

  const std::string& projType = proj.getType();
  if (allegiance == PLAYER) {
    if (projType == "enemy") {
      hp -= GameOptions::enemyProjDamage;
    } else if (projType == "enemy2") {
      hp -= GameOptions::enemyProjDamage2;
    }
  } else {
    hp -= GameOptions::playerProjDamage;
  }

  if (hp <= 0) {
    timers.clear();
    setAnimState("explosion");
    addBoolTimer(28, removeFlag);
    setV(vx / 2.0, vy / 2);
    if (allegiance == ENEMY) {
      game.modifyScore(GameOptions::pointsPerDestroyedShip);
      game.spawnEnemyShips(2);
    }
    game.window.playSound("explosion");
  } else {
    if (allegiance == ENEMY) {
      game.window.playSound("damagedEnemy");
    } else {
      game.window.playSound("damaged");
    }
    setAnimState("damaged");
    shouldSwitchToDefaultState = false;
    addBoolTimer(40, shouldSwitchToDefaultState);
  }
}

void Ship::onCollision(Ship& ship) {
  if (isExploding() || ship.allegiance == allegiance) {
    return;
  }

  hp -= GameOptions::shipCollideDamage;
  if (hp <= 0 || allegiance == ENEMY) {
    timers.clear();
    setAnimState("explosion");
    addBoolTimer(28, removeFlag);
    setV(0.0, 0.0);
    game.spawnEnemyShips(1);
    game.window.playSound("explosion");
  } else if (allegiance == PLAYER) {
    game.window.playSound("damaged");
    setAnimState("damaged");
    shouldSwitchToDefaultState = false;
    addBoolTimer(40, shouldSwitchToDefaultState);
  }
}

bool Ship::isExploding() const { return animState == "explosion"; }

void Ship::update() {
  Actor::update();

  if (shouldSwitchToDefaultState) {
    shouldSwitchToDefaultState = false;
    setAnimState("default");
  }

  if (x > GameOptions::width) {
    x = GameOptions::width;
  } else if (x < 0) {
    x = 0;
  }
  if (y > GameOptions::height) {
    y = GameOptions::height;
  } else if (y < 0) {
    y = 0;
  }
}
