#pragma once

#include "Actor.h"

class Player;
class Asteroid;
class Powerup;
class Enemy;

enum ProjectileType {
  PROJECTILE_TYPE_PLAYER,
  PROJECTILE_TYPE_PLAYER_BIG,
  PROJECTILE_TYPE_PIERCE,
  PROJECTILE_TYPE_ENEMY
};

class Projectile : public Actor {

public:
  bool firedByPlayer;
  int lifetimeMs;
  ProjectileType type;
  bool collisionEnabled;
  explicit Projectile(Game& gameA,
                      double xA,
                      double yA,
                      ProjectileType typeA,
                      double headingDeg,
                      double speed,
                      int lifetimeMsA);
  ~Projectile();
  void handleCollision(const Player& player);
  void handleCollision(const Asteroid& asteroid);
  void handleCollision(const Powerup& powerup);
  void handleCollision(const Enemy& enemy);
  void onRemove() override;
  void update() override;
  void draw() override;
};
