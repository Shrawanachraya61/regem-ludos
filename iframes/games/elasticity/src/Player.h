#pragma once

#include "Actor.h"

class Powerup;
class Ball;

class Player : public Actor {
  bool isBouncing;
  std::string direction;

public:
  int paddleCollisionRadius;
  int paddleShortCollisionRadius;
  std::string paddleState;
  int mana;
  bool isPlayingIntro;

  explicit Player(Game& gameA);
  ~Player();
  const std::string getAnimationStr();
  void setDirection(const std::string& direction);
  void setPaddleState(const std::string& paddleState);
  void setBouncing();
  void startIntro();
  bool isPaddleShort() const;
  void handleCollision(const Ball& ball);
  void handleCollision(const Powerup& powerup);
  void update() override;
  void draw() override;
};
