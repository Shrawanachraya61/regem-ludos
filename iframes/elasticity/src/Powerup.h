#pragma once

#include "Actor.h"

class Player;

class Powerup : public Actor {
public:
  std::string powerupType;
  explicit Powerup(Game& gameA, const std::string& powerupTypeA);
  ~Powerup();
  void handleCollision(const Player& player);
  void update() override;
  void draw() override;
};
