#include "Projectile.h"
#include "Game.h"
#include "GameOptions.h"
#include "Physics.h"

Projectile::Projectile(Game& game, int xA, int yA) : Actor(game, "invisible") {
  x = xA;
  y = yA;

  frictionEnabled = false;
  wrapEnabled = false;
  animState = "bullet_0";

  vy = -8;
  maxSpeed = abs(vy);
}

Projectile::~Projectile() {}

void Projectile::onRemove() {
  // spawn particle
}

void Projectile::handleCollision(const Rect& blocker) {
  GameWorld& world = *(game.worldPtr);
  int index = game.pxToTileIndex(blocker.x, blocker.y);
  world.tiles[index]++;
  remove();
}

void Projectile::handleCollision(const Train& train) { remove(); }

void Projectile::update() {
  Actor::update();
  if (y < 0) {
    remove();
  }
}
void Projectile::draw() { game.window.drawSprite(animState, x, y); }