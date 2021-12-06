#include "Train.h"
#include "Game.h"
#include "GameOptions.h"
#include "Particle.h"
#include "Physics.h"
#include "Projectile.h"

#include <sstream>

Train::Train(Game& game, int xA, int yA) : Actor(game, "invisible") {
  x = xA;
  y = yA;

  frictionEnabled = false;
  wrapEnabled = false;
  r = 7.5;

  maxSpeed = abs(vy);

  createAnimationDefinition("enemy_segments_b_0");
  createAnimationDefinition("enemy_segments_f_0");
  setAnimState("enemy_segments_f_0");

  for (int i = 0; i < 4; i++) {
    createAnimationDefinition("trains_b_horiz_" + std::to_string(i));
    createAnimationDefinition("trains_f_horiz_" + std::to_string(i));
    createAnimationDefinition("trains_b_vert_" + std::to_string(i));
    createAnimationDefinition("trains_f_vert_" + std::to_string(i));
    createAnimationDefinition("trains_b_diag_" + std::to_string(i));
    createAnimationDefinition("trains_f_diag_" + std::to_string(i));
  }
}

Train::~Train() {}

void Train::setDirection(Direction facingA) {
  facing = facingA;
  if (facing == LEFT) {
    spriteDir = SPRITE_LEFT;
    vx = -maxSpeed;
  } else {
    spriteDir = SPRITE_RIGHT;
    vx = maxSpeed;
  }
  setIsHead(isHead);
}
void Train::setIsHead(bool isHeadA) {
  isHead = isHeadA;
  if (isHead) {
    setAnimState("enemy_segments_f_" + std::to_string(variant));
  } else {
    setAnimState("enemy_segments_b_" + std::to_string(variant));
  }
}
void Train::setVariant(int variantA) {
  variant = variantA;
  setIsHead(isHead);
}

void Train::setSpeed(int speed) {
  maxSpeed = abs(speed);
  if (facing == LEFT) {
    vx = -abs(speed);
  } else {
    vx = abs(speed);
  }
}

void Train::swapDirections() {
  if (!canTurn) {
    return;
  }

  vx = 0;
  x = prevX;

  if (isMovingUp) {
    if (y < 512 - TILE_HEIGHT_PX * 6) {
      isMovingUp = false;
      isCascading = false;
      turnIgnoreIds.clear();
      turnIds.clear();
    }
    moveThreshold = y - TILE_HEIGHT_PX;
    vy = -maxSpeed;
  } else {
    if (y > 512 - TILE_HEIGHT_PX * 2) {
      isMovingUp = true;
      isCascading = false;
      turnIgnoreIds.clear();
      turnIds.clear();
    }
    moveThreshold = y + TILE_HEIGHT_PX;
    vy = maxSpeed;
  }
}

bool Train::isMovingDownOrUp() const { return moveThreshold != 0; }
bool Train::isPartOfTrain(const Train* train) const {
  if (train == this) {
    return true;
  }

  Train* currentChild = child;
  while (currentChild != nullptr) {
    if (train == currentChild) {
      return true;
    }
    currentChild = currentChild->child;
  }
  return false;
}

void Train::onRemove() {
  Particle::spawnParticle(game, x, y, PARTICLE_TYPE_ENTITY_EXPL, 50 * 4);
}

void Train::handleCollision(const Rect& blocker) {
  if (!isMovingDownOrUp() && !isCascading) {
    int i = game.pxToTileIndex(x, y);
    auto pair = game.tileIndexToPx(i);
    if (facing == LEFT) {
      x = pair.first;
    } else {
      x = pair.first + TILE_WIDTH_PX;
    }
    swapDirections();
  }
}

void Train::handleCollision(const Projectile& projectile) {
  if (projectile.type != PLAYER) {
    return;
  }

  game.modifyScore(isHead ? 100 : 10);

  int i = game.pxToTileIndex(x, y);
  GameWorld& world = *(game.worldPtr);

  int blockerIndex = i + 1;
  if (facing == LEFT) {
    blockerIndex = i - 1;
  }

  // make sure spawning mushroom doesn't wrap around the array
  auto pair = game.tileIndexToPx(blockerIndex);
  if (abs(pair.first - x) > 44) {
    blockerIndex = i;
  }

  // Hitting head of cascading train causes it to stop cascading
  if (isHead && isCascading) {
    Train* childTrain = child;
    while (childTrain != nullptr) {
      childTrain->cascadeUntil = pair.second;
      childTrain = childTrain->child;
    }
  }


  if (child != nullptr) {
    child->setIsHead(true);
    child->parent = nullptr;
    child = nullptr;
  }
  if (parent != nullptr) {
    parent->child = nullptr;
    parent->turnIgnoreIds.push_back(blockerIndex);
    parent = nullptr;
  }

  game.spawnBlocker(blockerIndex);

  remove();
}

void Train::handleCollision(const Train& train) {
  if (isHead && !isMovingDownOrUp() && !isCascading) {
    int i = game.pxToTileIndex(train.x, train.y);
    int blockerIndex = i;
    auto pair = game.tileIndexToPx(i);

    if (facing == LEFT) {
      x = pair.first + TILE_WIDTH_PX;
    } else {
      x = pair.first;
    }

    turnIds.push_back(blockerIndex);
    Train* currentChild = child;
    while (currentChild != nullptr) {
      currentChild->turnIds.push_back(blockerIndex);
      currentChild = currentChild->child;
    }
  }
}

void Train::handleCollision(const Player& player) {
  if (shouldRemove()) {
    return;
  }

  remove();
}

void Train::update() {
  Actor::update();

  if (isMovingDownOrUp()) {
    if (isMovingUp) {
      if (y <= moveThreshold) {
        y = moveThreshold;
        vy = 0;
        moveThreshold = 0;
        if (facing == LEFT) {
          facing = RIGHT;
          vx = maxSpeed;
          spriteDir = SPRITE_RIGHT;
        } else {
          facing = LEFT;
          vx = -maxSpeed;
          spriteDir = SPRITE_LEFT;
        }
        if (!canTurn) {
          addBoolTimer(100, canTurn);
        }
      } else {
        if (facing == LEFT) {
          spriteDir = SPRITE_LEFT_UP;
        } else {
          spriteDir = SPRITE_RIGHT_UP;
        }
      }
    } else {
      if (y >= moveThreshold) {
        y = moveThreshold;
        vy = 0;
        moveThreshold = 0;
        if (facing == LEFT) {
          facing = RIGHT;
          vx = maxSpeed;
          spriteDir = SPRITE_RIGHT;
        } else {
          facing = LEFT;
          vx = -maxSpeed;
          spriteDir = SPRITE_LEFT;
        }
        if (!canTurn) {
          addBoolTimer(100, canTurn);
        }
      } else {
        if (facing == LEFT) {
          if (moveThreshold - y < TILE_HEIGHT_PX / 2) {
            spriteDir = SPRITE_DOWN;
          } else {
            spriteDir = SPRITE_LEFT_DOWN;
          }
        } else {
          if (moveThreshold - y < TILE_HEIGHT_PX / 2) {
            spriteDir = SPRITE_DOWN;
          } else {
            spriteDir = SPRITE_RIGHT_DOWN;
          }
        }
      }
    }
  }

  if (isCascading && cascadeUntil > 0 && y >= cascadeUntil) {
    isCascading = false;
    cascadeUntil = 0;
  }

  if (!isMovingDownOrUp()) {
    if (isCascading && canTurn) {
      swapDirections();
      canTurn = false;
    } else if (x < TILE_WIDTH_PX / 2 && facing == LEFT) {
      swapDirections();
    } else if (x > 512 - TILE_WIDTH_PX / 2 && facing == RIGHT) {
      swapDirections();
    }
  }
}
void Train::draw() {
  // this is for rotating a sprite instead of determining what sprite
  // int angleDeg = 0;
  // if (spriteDir == SPRITE_LEFT) {
  //   angleDeg = 180;
  // } else if (spriteDir == SPRITE_LEFT_DOWN) {
  //   angleDeg = 90 + 45;
  // } else if (spriteDir == SPRITE_DOWN) {
  //   angleDeg = 90;
  // } else if (spriteDir == SPRITE_RIGHT_DOWN) {
  //   angleDeg = 90 - 45;
  // } else if (spriteDir == SPRITE_LEFT_UP) {
  //   angleDeg = 270 + 45;
  // } else if (spriteDir == SPRITE_UP) {
  //   angleDeg = 270;
  // } else if (spriteDir == SPRITE_RIGHT_UP) {
  //   angleDeg = 270 - 45;
  // }

  // SDL2Wrapper::Animation& anim = anims[animState];
  // game.window.drawAnimation(
  //     anim, static_cast<int>(x), static_cast<int>(y), true, true, angleDeg);

  bool flipped = false;
  std::string orientation = "diag";

  if (spriteDir == SPRITE_LEFT || spriteDir == SPRITE_LEFT_DOWN ||
      spriteDir == SPRITE_LEFT_UP) {
    flipped = true;
  }

  if (spriteDir == SPRITE_UP || spriteDir == SPRITE_DOWN) {
    orientation = "vert";
  } else if (spriteDir == SPRITE_LEFT || spriteDir == SPRITE_RIGHT) {
    orientation = "horiz";
  }

  std::stringstream derivedAnimName;
  derivedAnimName << "trains_" << (isHead ? "f" : "b") << "_" << orientation
                  << "_" << variant;

  SDL2Wrapper::Animation& anim = anims[derivedAnimName.str()];
  game.window.drawAnimation(anim,
                            static_cast<int>(x),
                            static_cast<int>(y),
                            true,
                            true,
                            0,
                            std::make_pair(flipped ? -1.0 : 1.0, 1.0));
}