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
  }

  addFuncTimer(10000, [&]() {
    remove();
    game.window.playSound("item_despawn");
  });
}

Powerup::~Powerup() {}

void Powerup::spawnPowerup(Game& game,
                           const PowerupType type,
                           const double x,
                           const double y) {
  game.powerups.push_back(
      std::make_unique<Powerup>(game, type, rand() % 360, 2.5));
  auto& p = game.powerups.back();
  p->set(x, y);
}

PowerupType Powerup::getRandomPowerupType() {
  PowerupType types[] = {POWERUP_TYPE_HEART,
                         POWERUP_TYPE_CANDY,
                         POWERUP_TYPE_STAR,
                         POWERUP_TYPE_DIAMOND};

  return types[rand() % 4];
}

void Powerup::handleCollision(const Player& player) {
  switch (powerupType) {
  case POWERUP_TYPE_HEART: {
    game.window.playSound("oh_yeah");
    break;
  }
  case POWERUP_TYPE_CANDY: {
    game.window.playSound("item_get");
    break;
  }
  case POWERUP_TYPE_STAR: {
    game.window.playSound("star_get");
    break;
  }
  case POWERUP_TYPE_DIAMOND: {
    game.window.playSound("yes");
    break;
  }
  }
  remove();
}

void Powerup::handleCollision(const Projectile& projectile) {
  if (projectile.firedByPlayer) {
    game.window.playSound("no");
    Particle::spawnParticle(game, x, y, PARTICLE_TYPE_EXPLOSION2, 1000);
    remove();
  }
}

void Powerup::update() { Actor::update(); }

void Powerup::draw() { Actor::draw(); }