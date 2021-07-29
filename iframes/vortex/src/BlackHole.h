#pragma once

#include "Actor.h"

class Player;
class Projectile;

enum BlackHolePosition {
  BLACK_HOLE_POS_RIGHT_DOWN,
  BLACK_HOLE_POS_RIGHT_UP,
  BLACK_HOLE_POS_LEFT_DOWN,
  BLACK_HOLE_POS_LEFT_UP
};

class BlackHole : public Actor {

public:
  BlackHolePosition position;
  std::string bgSprite;
  SDL2Wrapper::Gauge strengthGauge;

  explicit BlackHole(Game& gameA, const double x, const double y);
  ~BlackHole();

  static void spawnBlackHole(Game& game, const double x, const double y);

  void handleCollision(const Player& player);
  void handleCollision(const Projectile& projectile);
  double getStrength() const;
  void onRemove() override;
  void update() override;
  void draw() override;
};
