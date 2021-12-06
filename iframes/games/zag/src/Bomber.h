#pragma once

#include "Actor.h"

class Player;
class Projectile;

class Bomber : public Actor {

public:
  int walkSpeed = 3;
  int walkX = 512 / 2;
  int walkY = 512;
  bool shootEnabled = false;

  explicit Bomber(Game& gameA, int x, int y);
  ~Bomber();

  void setNextWalkPos();
  void shootBomb();

  void handleCollision(const Rect& blocker);
  void handleCollision(const Player& player);
  void handleCollision(const Projectile& projectile);

  void onRemove() override;
  void update() override;
  void draw() override;
};
