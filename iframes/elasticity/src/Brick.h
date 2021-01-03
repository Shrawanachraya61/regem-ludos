#pragma once

#include "Actor.h"

class Ball;

class Brick : public Actor {
public:
  std::string brickType;
  bool isExploding;
  explicit Brick(Game& gameA, const std::string& brickTypeA);
  ~Brick();
  void handleCollision(const Ball& ball);
  void destroy();
  int indexOfBrickOnSide(const std::string& side);

  std::string getBaseAnimString();

  void update() override;
  void draw() override;
};
