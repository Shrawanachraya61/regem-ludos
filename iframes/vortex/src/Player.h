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
  bool isShielding;
  int lives;
  bool canFire;
  int fireCooldownMs;
  double rotateRate;
  bool useBigGun;
  bool useFastGun;
  SDL2Wrapper::Gauge shield;
  SDL2Wrapper::ContinuousSound engineSound;
  SDL2Wrapper::ContinuousSound shieldSound;
  explicit Player(Game& gameA);
  ~Player();
  const std::string getAnimationStr();
  void turn(Direction d);
  void handleCollision(const Powerup& powerup);
  void handleCollision(const Asteroid& asteroid);
  void handleCollision(const Projectile& projectile);
  void handleCollision(const Enemy& enemy);
  void fireProjectiles();
  void accelerate();
  void stopAccelerating();
  void enableShields();
  void disableShields();
  void enableFastGun();
  void disableFastGun();
  void enableBigGun();
  void disableBigGun();
  const std::string getSpriteFromHeadingDeg(const double headingDeg);
  void setAnimState(const std::string& state) override;
  void update() override;
  void draw() override;
};
