#pragma once

#include "Actor.h"

class Projectile;
class Player;

class DuoMissile : public Actor {
public:
  Direction direction;
  bool isSpawningMushroom = false;

  explicit DuoMissile(Game& gameA, int x, int y);
  ~DuoMissile();

  void setTarget(int x, int y);

  void handleCollision(const Player& Player);
  void handleCollision(const Projectile& projectile);

  void onRemove() override;
  void update() override;
  void draw() override;
};
