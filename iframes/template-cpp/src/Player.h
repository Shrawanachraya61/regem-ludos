#pragma once

#include "Actor.h"

class Powerup;
class Projectile;
class Asteroid;
class Enemy;

enum Direction { LEFT, RIGHT };

class Player : public Actor {

public:
  bool isDead;
  bool canFire;
  explicit Player(Game& gameA);
  ~Player();
  const std::string getAnimationStr();
  void setAnimState(const std::string& state) override;
  void update() override;
  void draw() override;
};
