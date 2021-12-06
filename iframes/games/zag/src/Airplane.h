#pragma once

#include "Actor.h"

class Projectile;

class Airplane : public Actor {
public:
  Direction direction;
  bool isPlayingSound = false;
  explicit Airplane(Game& gameA, int x, int y);
  ~Airplane();

  void setTarget(int x, int y);

  void handleCollision(const Rect& blocker);
  void handleCollision(const Projectile& projectile);

  void onRemove() override;
  void update() override;
  void draw() override;
};
