#include "Projectile.h"
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
    vy = -8;
    maxSpeed = abs(vy);
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

void Projectile::handleCollision(const Player& player) {}

void Projectile::update() {
  if (type == PLAYER) {
    Actor::update();
    if (y < 0) {
      remove();
    }
  } else {
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
  }
}
void Projectile::draw() {
  if (type == BOMB) {
    game.window.drawSprite("bomb_target_0", targetX, targetY);
  }

  game.window.drawSprite(animState, x, y);
}