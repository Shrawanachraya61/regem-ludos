#pragma once

#include "Actor.h"

class Player;
class Projectile;

enum AsteroidLevel {
  ASTEROID_LEVEL1,
  ASTEROID_LEVEL2,
  ASTEROID_LEVEL3,
  ASTEROID_LEVEL_METAL
};

class Asteroid : public Actor {

public:
  AsteroidLevel level;
  explicit Asteroid(Game& gameA,
                    const AsteroidLevel levelA,
                    const double headingDegA,
                    const double speedA);
  ~Asteroid();

  static void spawnAsteroid(Game& game,
                            const AsteroidLevel level,
                            const double x,
                            const double y,
                            const double maxSpeed);

  void handleCollision(const Player& player);
  void handleCollision(const Projectile& projectile);
  void onRemove() override;
  void update() override;
  void draw() override;
};
