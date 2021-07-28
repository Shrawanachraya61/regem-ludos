#include "Projectile.h"
#include "Asteroid.h"
#include "Game.h"
#include "GameOptions.h"
#include "Physics.h"

Projectile::Projectile(Game& game,
                       double xA,
                       double yA,
                       ProjectileType typeA,
                       double headingDegA,
                       double speedA,
                       int lifetimeMsA)
    : Actor(game, "invisible"),
      firedByPlayer(true),
      lifetimeMs(lifetimeMsA),
      type(typeA),
      collisionEnabled(true) {
  headingDeg = headingDegA;
  maxSpeed = speedA * 4;
  frictionEnabled = false;

  x = xA;
  y = yA;
  r = 4;
  vx = sin(degreesToRadians(headingDegA)) * speedA;
  vy = -cos(degreesToRadians(headingDegA)) * speedA;

  createAnimationDefinition("player_bullet");
  createAnimationDefinition("player_bullet_big");
  createAnimationDefinition("enemy_bullet");

  switch (type) {
  case PROJECTILE_TYPE_ENEMY: {
    setAnimState("enemy_bullet");
    firedByPlayer = false;
    break;
  }
  case PROJECTILE_TYPE_PLAYER: {
    setAnimState("player_bullet");
    break;
  }
  case PROJECTILE_TYPE_PIERCE: {
    setAnimState("enemy_bullet");
    break;
  }
  case PROJECTILE_TYPE_PLAYER_BIG: {
    setAnimState("player_bullet_big");
    r = 16;
    break;
  }
  }

  addBoolTimer(lifetimeMsA, removeFlag);
}

Projectile::~Projectile() {}

void Projectile::onRemove() {
  // spawn particle
}

void Projectile::handleCollision(const Player& player) {
  if (!firedByPlayer) {
    remove();
  }
}
void Projectile::handleCollision(const Asteroid& asteroid) {
  if (firedByPlayer && collisionEnabled) {
    if (type == PROJECTILE_TYPE_PIERCE) {
      collisionEnabled = false;
      addBoolTimer(250, collisionEnabled);
    } else {
      remove();
    }
  }
}

void Projectile::handleCollision(const Powerup& powerup) {
  if (firedByPlayer && collisionEnabled) {
    if (type == PROJECTILE_TYPE_PIERCE) {
      collisionEnabled = false;
      addBoolTimer(250, collisionEnabled);
    } else {
      remove();
    }
  }
}

void Projectile::handleCollision(const Enemy& enemy) {
  if (firedByPlayer && collisionEnabled) {
    if (type == PROJECTILE_TYPE_PIERCE) {
      collisionEnabled = false;
      addBoolTimer(250, collisionEnabled);
    } else {
      remove();
    }
  }
}

void Projectile::update() { Actor::update(); }
void Projectile::draw() { Actor::draw(); }