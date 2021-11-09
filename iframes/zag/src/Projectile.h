#pragma once

#include "Actor.h"

class Train;

class Projectile : public Actor {

public:
  explicit Projectile(Game& gameA, int x, int y);
  ~Projectile();

  void handleCollision(const Rect& blocker);
  void handleCollision(const Train& train);

  void onRemove() override;
  void update() override;
  void draw() override;
};
