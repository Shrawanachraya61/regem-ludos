#pragma once

#include "Actor.h"

class Rect;
class Projectile;
class Bomber;
class Train;

class Player : public Actor {
public:
  bool isDead;
  bool canFire;
  explicit Player(Game &gameA);
  ~Player();
  const std::string getAnimationStr();
  void setAnimState(const std::string &state) override;

  void handleCollision(const Rect &blocker, const std::string &collisionResult);
  void handleCollision(const Projectile& projectile);
  void handleCollision(const Train& train);
  void handleCollision(const Bomber& bomber);

  void update() override;
  void draw() override;
};
