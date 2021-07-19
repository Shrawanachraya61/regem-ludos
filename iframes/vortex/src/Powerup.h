#pragma once

#include "Actor.h"

class Player;
class Projectile;

enum PowerupType {
  POWERUP_TYPE_HEART,
  POWERUP_TYPE_CANDY,
  POWERUP_TYPE_STAR,
  POWERUP_TYPE_DIAMOND
};

class Powerup : public Actor {
public:
  PowerupType powerupType;
  explicit Powerup(Game& gameA,
                   const PowerupType powerupTypeA,
                   const double headingDegA,
                   const double speedA);
  ~Powerup();
  static void spawnPowerup(Game& game,
                           const PowerupType powerupType,
                           const double x,
                           const double y);
  static PowerupType getRandomPowerupType();
  void handleCollision(const Player& player);
  void handleCollision(const Projectile& projectile);
  void update() override;
  void draw() override;
};
