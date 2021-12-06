#include "Projectile.h"
#include "Airplane.h"
#include "DuoMissile.h"
#include "Game.h"
#include "GameOptions.h"
#include "Particle.h"
#include "Physics.h"
#include "Player.h"

Projectile::Projectile(Game& game, int xA, int yA, ProjectileType typeA)
    : Actor(game, "invisible"), type(typeA) {
  x = xA;
  y = yA;

  frictionEnabled = false;
  wrapEnabled = false;

  if (type == BOMB) {
    animState = "bomb_0";
    collisionEnabled = false;
    prevX = x;
    prevY = y;
    r = 28;
  } else if (type == PLAYER) {
    animState = "bullet_0";
    vy = -15;
    maxSpeed = abs(vy);
  } else if (type == MISSILE) {
    collisionEnabled = false;
    addBoolTimer(100, collisionEnabled);
    animState = "duo_missile_2";
    maxSpeed = 10;
    targetX = x;
    targetY = y;
  }
}

Projectile::~Projectile() {}

void Projectile::setTarget(int tx, int ty) {
  targetX = tx;
  targetY = ty;
}

void Projectile::onRemove() {
  // spawn particle
}

void Projectile::handleCollision(const Rect& blocker) {
  if (!collisionEnabled) {
    return;
  }

  GameWorld& world = *(game.worldPtr);
  int index = game.pxToTileIndex(blocker.x, blocker.y);
  if (type == PLAYER) {
    world.tiles[index] += 1;

    if (world.tiles[index] >= 5) {
      game.modifyScore(1);
    }
  } else if (type == BOMB) {
    world.tiles[index] += 4;
  }

  if (type == PLAYER) {
    remove();
  }
}

void Projectile::handleCollision(const Train& train) {
  if (!collisionEnabled) {
    return;
  }
  if (type == PLAYER) {
    remove();
  }
}

void Projectile::handleCollision(const Bomber& bomber) {
  if (!collisionEnabled) {
    return;
  }
  if (type == PLAYER) {
    remove();
  }
}

void Projectile::handleCollision(const Airplane& airplane) {
  if (!collisionEnabled) {
    return;
  }
  if (type == PLAYER) {
    remove();
  }
}

void Projectile::handleCollision(const DuoMissile& missile) {
  if (!collisionEnabled) {
    return;
  }
  if (type == PLAYER) {
    remove();
  }
}

void Projectile::handleCollision(const Player& player) {
  if (type != PLAYER) {
    remove();
  }
}

void Projectile::handleCollision(const Projectile& projectile) {
  // This matters I promise
  if (projectile.type == PLAYER && type == MISSILE) {
    Particle::spawnParticle(game, x, y, PARTICLE_TYPE_ENTITY_EXPL, 50 * 4);
    remove();
  } else if (projectile.type == MISSILE && type == PLAYER) {
    remove();
  }
}

void handleCollision(const Projectile& projectile);

void Projectile::update() {
  if (type == PLAYER) {
    Actor::update();
    if (y < 0) {
      remove();
    }
  } else if (type == BOMB) {
    double tMax = 60 * 1;
    t += game.window.getFrameRatio();

    x = normalize(t, 0, tMax, prevX, targetX);
    y = normalize(t, 0, tMax, prevY, targetY) -
        TILE_HEIGHT_PX * 4 * sin(normalize(t, 0, tMax, 0, GLOBAL_PI));

    if (t > tMax) {
      collisionEnabled = true;
    }

    if (!exploding && t > tMax) {
      exploding = true;
      Particle::spawnParticle(game, x, y, PARTICLE_TYPE_BOMB_EXPL, 50 * 8);
    }

    if (t > tMax + 15) {
      remove();
    }
  } else if (type == MISSILE) {
    Actor::update();
    double d = distance(x, y, targetX, targetY);
    if (d > 3 * TILE_WIDTH_PX || x > 512 - 16 || x < 16) {
      vx = 0;
      vy = maxSpeed;
      animState = "duo_missile_3";

      if (!isPlayingSound) {
        isPlayingSound = true;
        game.playSound("missile_speed");
      }

    } else {
      animState = "duo_missile_2";
      if (vx < 0) {
        flipped = true;
      }
    }
    if (y > 512 + 44) {
      remove();
    }
  }
}
void Projectile::draw() {
  if (type == BOMB) {
    game.window.drawSprite("bomb_target_0",
                           targetX,
                           targetY,
                           true,
                           0,
                           std::make_pair(flipped ? -1.0 : 1.0, 1.0));
  }

  game.window.drawSprite(
      animState, x, y, true, 0, std::make_pair(flipped ? -1.0 : 1.0, 1.0));
}