#pragma once

#include "Actor.h"

class Brick;

class Ball : public Actor {
  std::vector<std::pair<double, double>> previousStates;
  std::function<void()> stateSaver;
  double lastVx;
  double lastVy;
  bool disableCollisionSpeedIncrease;

public:
  std::string ballType;
  double speed;
  bool isSticky;
  explicit Ball(Game& gameA);
  ~Ball();
  void setSpeed(double speed);
  void setSticky(bool val);
  void setType(const std::string& ballType);
  void handleCollision(const Brick& brick, const std::string& side);
  void update() override;
  void draw() override;
};
