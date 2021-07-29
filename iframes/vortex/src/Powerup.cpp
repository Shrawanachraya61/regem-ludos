#include "Powerup.h"
#include "Game.h"
#include "GameOptions.h"
#include "Particle.h"
#include "Physics.h"
#include "Player.h"
#include "Projectile.h"

Powerup::Powerup(Game& gameA,
                 const PowerupType powerupTypeA,
                 const double headingDegA,
                 const double speedA)
    : Actor(gameA, "invisible"), powerupType(powerupTypeA) {

  headingDeg = headingDegA;
  maxSpeed = 5;
  frictionEnabled = false;

  vx = sin(degreesToRadians(headingDegA)) * speedA;
  vy = -cos(degreesToRadians(headingDegA)) * speedA;

  createAnimationDefinition("heart");
  createAnimationDefinition("candy");
  createAnimationDefinition("star");
  createAnimationDefinition("diamond");
  createAnimationDefinition("capsule");
  createAnimationDefinition("capsule_shatter");
  createAnimationDefinition("shooting_star");

  int removeTimeoutMs = 10000;

  switch (powerupType) {
  case POWERUP_TYPE_HEART: {
    setAnimState("heart");
    break;
  }
  case POWERUP_TYPE_CANDY: {
    setAnimState("candy");
    break;
  }
  case POWERUP_TYPE_STAR: {
    setAnimState("star");
    break;
  }
  case POWERUP_TYPE_DIAMOND: {
    setAnimState("diamond");
    break;
  }
  case POWERUP_TYPE_CAPSULE: {
    setAnimState("capsule");
    break;
  }
  case POWERUP_TYPE_SHOOTING_STAR: {
    setAnimState("shooting_star");
    removeTimeoutMs = 4000;
    break;
  }
  }

  addFuncTimer(removeTimeoutMs, [=]() {
    game.window.playSound("item_despawn");
    remove();
  });
}

Powerup::~Powerup() {}

void Powerup::spawnPowerup(Game& game,
                           const PowerupType type,
                           const double x,
                           const double y) {
  if (type == POWERUP_TYPE_SHOOTING_STAR) {
    int heading = 180 + 30 + rand() % 30;
    int speed = 2;
    game.powerups.push_back(
        std::make_unique<Powerup>(game, type, heading, speed));
    auto& p = game.powerups.back();
    p->set(512 - rand() % 32, rand() % 32);
  } else {
    game.powerups.push_back(
        std::make_unique<Powerup>(game, type, rand() % 360, 2.5));
    auto& p = game.powerups.back();
    p->set(x, y);
  }
}

PowerupType Powerup::getRandomPowerupType() {
  PowerupType types[] = {
      POWERUP_TYPE_CANDY, POWERUP_TYPE_CAPSULE, POWERUP_TYPE_DIAMOND};

  return types[rand() % 3];
}

void Powerup::handleCollision(const Player& player) { remove(); }

void Powerup::handleCollision(const Projectile& projectile) {
  if (projectile.firedByPlayer) {
    switch (powerupType) {
    case POWERUP_TYPE_SHOOTING_STAR: {
      game.window.playSound("star_get");
      game.score += 5000;
      Particle::spawnTextParticle(game, x, y, "+5000");
      remove();
      break;
    }
    case POWERUP_TYPE_CAPSULE: {
      game.window.playSound("no");
      Particle::spawnParticle(game, x, y, PARTICLE_TYPE_NO, 1000);
      remove();
      break;
    }
    default: {
      game.window.playSound("no");
      Particle::spawnParticle(game, x, y, PARTICLE_TYPE_NO, 1000);
      remove();
    }
    }
  }
}

void Powerup::update() { Actor::update(); }

void Powerup::draw() { Actor::draw(); }