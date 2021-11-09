#pragma once

enum SpriteDirection {
  SPRITE_LEFT,
  SPRITE_RIGHT,
  SPRITE_LEFT_DOWN,
  SPRITE_RIGHT_DOWN,
  SPRITE_LEFT_UP,
  SPRITE_RIGHT_UP,
  SPRITE_DOWN,
  SPRITE_UP,
};

// class Train : public Actor {
// public:
//   bool isHead;
//   SpriteDirection spriteDir;
//   Direction facing;
//   unsigned int variant;

//   bool isMovingUp;
//   bool isCascading;

//   int moveThreshold;

//   explicit Train(Game& gameA,
//                  int xA,
//                  int yA,
//                  bool isHeadA,
//                  Direction facingA,
//                  int variantA,
//                  int speedA);
//   ~Train();

//   void setSpeed(int speed);
//   void swapDirections();

//   bool isMovingDownOrUp() const;

//   void handleCollision(const Rect& blocker);

//   void onRemove() override;
//   void update() override;
//   void draw() override;
// };

#include "Actor.h"

class Projectile;

class Train : public Actor {

public:
  bool isHead = true;
  SpriteDirection spriteDir = SPRITE_LEFT;
  Direction facing = LEFT;
  unsigned int variant = 0;
  bool isMovingUp = false;
  bool isCascading = false;
  int moveThreshold = 0;
  Train* child = nullptr;
  Train* parent = nullptr;

  std::vector<int> turnIds;
  std::vector<int> turnIgnoreIds;

  explicit Train(Game& gameA, int x, int y);
  ~Train();

  void setDirection(Direction facingA);
  void setIsHead(bool isHeadA);
  void setVariant(int variantA);
  void setSpeed(int speed);
  void swapDirections();
  bool isMovingDownOrUp() const;
  bool isPartOfTrain(const Train* train) const;

  void handleCollision(const Rect& blocker);
  void handleCollision(const Projectile& projectile);
  void handleCollision(const Train& train);

  void onRemove() override;
  void update() override;
  void draw() override;
};
