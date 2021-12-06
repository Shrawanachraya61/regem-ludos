#pragma once

#include "Actor.h"

class Train;
class Bomber;
class Airplane;
class Player;
class DuoMissile;

enum ProjectileType { PLAYER, BOMB, MISSILE };

class Projectile : public Actor {

public:
  ProjectileType type;

  int targetX = 0;
  int targetY = 0;
  double t = 0;
  bool exploding = false;
  bool flipped = false;

  bool collisionEnabled = true;
  bool isPlayingSound = false;

  explicit Projectile(Game& gameA, int x, int y, ProjectileType typeA);
  ~Projectile();

  void setTarget(int x, int y);

  void handleCollision(const Rect& blocker);
  void handleCollision(const Train& train);
  void handleCollision(const Bomber& bomber);
  void handleCollision(const Airplane& airplane);
  void handleCollision(const DuoMissile& missile);
  void handleCollision(const Player& player);
  void handleCollision(const Projectile& projectile);

  void onRemove() override;
  void update() override;
  void draw() override;
};
