#pragma once

#include "Actor.h"

class Rect;
class Projectile;
class Bomber;
class Train;
class DuoMissile;

class Player : public Actor {
public:
  bool isDead;
  bool canFire;

  bool isAi = false;
  bool isSettingNextWalkPos = false;
  int walkSpeed = 3;
  int walkX = 512 / 2;
  int walkY = 512;

  explicit Player(Game& gameA);
  ~Player();
  const std::string getAnimationStr();
  void setAnimState(const std::string& state) override;

  void setNextWalkPos();
  void shootMissile();
  void setAi(bool isAiA);

  void handleCollision(const Rect& blocker, const std::string& collisionResult);
  void handleCollision(const Projectile& projectile);
  void handleCollision(const Train& train);
  void handleCollision(const Bomber& bomber);
  void handleCollision(const DuoMissile& missile);

  void update() override;
  void draw() override;
};
