#include "Projectile.h"
#include "Asteroid.h"
#include "Game.h"
#include "GameOptions.h"
#include "Physics.h"

Projectile::Projectile(Game& game,
                       double xA,
                       double yA,
                       ProjectileType type,
                       double headingDegA,
                       double speedA,
                       int lifetimeMsA)
    : Actor(game, "invisible"),
      firedByPlayer(type != PROJECTILE_TYPE_ENEMY),
      lifetimeMs(lifetimeMsA) {
  headingDeg = headingDegA;
  maxSpeed = speedA * 4;
  frictionEnabled = false;

  x = xA;
  y = yA;
  r = 4;
  vx = sin(degreesToRadians(headingDegA)) * speedA;
  vy = -cos(degreesToRadians(headingDegA)) * speedA;

  anims["player_bullet"] = SDL2Wrapper::Animation();
  game.window.setAnimationFromDefinition("player_bullet",
                                         anims["player_bullet"]);

  anims["player_bullet_big"] = SDL2Wrapper::Animation();
  game.window.setAnimationFromDefinition("player_bullet_big",
                                         anims["player_bullet_big"]);

  anims["enemy_bullet"] = SDL2Wrapper::Animation();
  game.window.setAnimationFromDefinition("enemy_bullet", anims["enemy_bullet"]);

  switch (type) {
  case PROJECTILE_TYPE_ENEMY: {
    setAnimState("enemy_bullet");
    break;
  }
  case PROJECTILE_TYPE_PLAYER: {
    setAnimState("player_bullet");
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
  if (firedByPlayer) {
    remove();
    // add score
    // asteroid->remove();
  }
}

void Projectile::handleCollision(const Powerup& powerup) {
  if (firedByPlayer) {
    remove();
  }
}

void Projectile::handleCollision(const Enemy& enemy) {
  if (firedByPlayer) {
    remove();
  }
}

void Projectile::update() { Actor::update(); }
void Projectile::draw() { Actor::draw(); }