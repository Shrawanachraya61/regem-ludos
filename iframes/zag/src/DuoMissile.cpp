#include "DuoMissile.h"
#include "Game.h"
#include "GameOptions.h"
#include "Particle.h"
#include "Physics.h"
#include "Player.h"
#include "Projectile.h"

DuoMissile::DuoMissile(Game& game, int xA, int yA) : Actor(game, "invisible") {
  x = xA;
  y = yA;

  frictionEnabled = false;
  wrapEnabled = false;
  r = 7;
  maxSpeed = 10;

  direction = LEFT;

  createAnimationDefinition("duo_missile");
  setAnimState("duo_missile");
}

DuoMissile::~DuoMissile() {}

void DuoMissile::onRemove() {
  Particle::spawnParticle(game, x, y, PARTICLE_TYPE_ENTITY_EXPL, 50 * 4);
  game.playSound("missile_split");

  game.worldPtr->projectiles.push_back(
      std::make_unique<Projectile>(game, x, y, MISSILE));
  game.worldPtr->projectiles.back()->vx = vy + 1;

  game.worldPtr->projectiles.push_back(
      std::make_unique<Projectile>(game, x, y, MISSILE));
  game.worldPtr->projectiles.back()->vx = -vy - 1;
  ;
}

void DuoMissile::handleCollision(const Player& player) { remove(); }

void DuoMissile::handleCollision(const Projectile& projectile) {
  if (projectile.type == PLAYER) {
    game.modifyScore(250);
    Particle::spawnParticle(game, x, y, PARTICLE_TYPE_TEXT, 1000);
    game.worldPtr->particles.back()->text = std::to_string(250);

    remove();
  }
}

void DuoMissile::update() {
  Actor::update();

  if (!isSpawningMushroom) {
    isSpawningMushroom = true;
    addFuncTimer(100, [=] {
      isSpawningMushroom = false;
      // std::cout << "CHECK MISSILE SPAWN " << std::endl;
      if (rand() % 4 == 0) {
        int i = game.pxToTileIndex(x, y);
        game.spawnBlocker(i);
      }
    });
  }

  if (y > 512 + 64) {
    remove();
  }
}
void DuoMissile::draw() {
  SDL2Wrapper::Animation& anim = anims[animState];
  game.window.drawAnimation(
      anim,
      static_cast<int>(x),
      static_cast<int>(y),
      true,
      true,
      0,
      std::make_pair(1.0, direction == RIGHT ? -1.0 : 1.0));
}