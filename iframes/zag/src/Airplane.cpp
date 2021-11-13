#include "Airplane.h"
#include "Game.h"
#include "GameOptions.h"
#include "Particle.h"
#include "Physics.h"
#include "Player.h"

Airplane::Airplane(Game& game, int xA, int yA) : Actor(game, "invisible") {
  x = xA;
  y = yA;

  frictionEnabled = false;
  wrapEnabled = false;
  r = 7.5;

  direction = LEFT;

  createAnimationDefinition("airplane");
  setAnimState("airplane");
}

Airplane::~Airplane() {}

void Airplane::onRemove() {
  Particle::spawnParticle(game, x, y, PARTICLE_TYPE_ENTITY_EXPL, 50 * 4);
}

void Airplane::handleCollision(const Rect& blocker) {
  // GameWorld& world = *(game.worldPtr);
  // int index = game.pxToTileIndex(blocker.x, blocker.y);
  // world.poisonTiles[index] = 1;
}

void Airplane::handleCollision(const Projectile& projectile) {
  game.modifyScore(1000);
  Particle::spawnParticle(game, x, y, PARTICLE_TYPE_TEXT, 1000);
  game.worldPtr->particles.back()->text = std::to_string(1000);
  remove();
}

void Airplane::update() {
  Actor::update();

  if (!isPlayingSound) {
    isPlayingSound = true;
    game.playSound("airplane");
    addBoolTimer(250, isPlayingSound);
  }

  if (direction == LEFT && x < 0 - 22) {
    remove();
  } else if (direction == RIGHT && x > 512 + 22) {
    remove();
  }
}
void Airplane::draw() {
  SDL2Wrapper::Animation& anim = anims[animState];
  game.window.drawAnimation(
      anim,
      static_cast<int>(x),
      static_cast<int>(y),
      true,
      true,
      0,
      std::make_pair(direction == RIGHT ? -1.0 : 1.0, 1.0));
}