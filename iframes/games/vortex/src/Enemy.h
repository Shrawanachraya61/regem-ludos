#pragma once

#include "Actor.h"

class Player;
class Projectile;

enum EnemyType {
  ENEMY_TYPE_SHIP,
  ENEMY_TYPE_MINE,
};

class Enemy : public Actor {
public:
  EnemyType enemyType;
  SDL2Wrapper::Gauge lazerGauge;
  explicit Enemy(Game& gameA,
                 const EnemyType enemyTypeA,
                 const double headingDegA,
                 const double speedA);
  ~Enemy();
  static void spawnEnemy(Game& game,
                           const EnemyType enemyType,
                           const double x,
                           const double y);
  void handleCollision(const Player& player);
  void handleCollision(const Projectile& projectile);
  void update() override;
  void draw() override;
};
