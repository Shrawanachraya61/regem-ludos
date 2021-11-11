#include "Bomber.h"
#include "Game.h"
#include "GameOptions.h"
#include "Particle.h"
#include "Physics.h"
#include "Player.h"
#include "Projectile.h"

Bomber::Bomber(Game& game, int xA, int yA) : Actor(game, "invisible") {
  x = xA;
  y = yA;

  frictionEnabled = false;
  wrapEnabled = false;
  r = 11;
  accelerationRate = 0.25;

  maxSpeed = walkSpeed = 2 + game.worldPtr->round * 0.25;
  shootEnabled = false;
  addBoolTimer(1000, shootEnabled);

  createAnimationDefinition("bomber_0");
  setAnimState("bomber_0");
  setNextWalkPos();
}

Bomber::~Bomber() {}

void Bomber::onRemove() {
  Particle::spawnParticle(game, x, y, PARTICLE_TYPE_ENTITY_EXPL, 50 * 4);
}

void Bomber::setNextWalkPos() {
  int minX = TILE_WIDTH_PX;
  int minY = 512 - 200;
  int maxX = 512 - TILE_WIDTH_PX;
  int maxY = 512 - TILE_HEIGHT_PX;

  walkX = static_cast<int>(normalize(rand() % 100, 0, 99, minX, maxX));
  walkY = static_cast<int>(normalize(rand() % 100, 0, 99, minY, maxY));

  maxSpeed = walkSpeed;

  std::cout << "Set walk pos for bomber: " << walkX << "," << walkY
            << std::endl;
}

void Bomber::shootBomb() {
  shootEnabled = false;
  int r = 75;

  int minX = x - 75;
  if (minX < 0) {
    minX = 0;
  } else if (minX > 512 - r * 2) {
    minX = 512 - r * 2;
  }

  int minY = y - 75;
  if (minY < 512 - 114) {
    minY = 512 - 114;
  } else if (minY > 512 - r * 2) {
    minY = 512 - r * 2;
  }

  int maxX = x + 75;
  int maxY = y + 75;

  int targetX = static_cast<int>(normalize(rand() % 100, 0, 99, minX, maxX));
  int targetY = static_cast<int>(normalize(rand() % 100, 0, 99, minY, maxY));

  game.worldPtr->projectiles.push_back(
      std::make_unique<Projectile>(game, x, y, BOMB));
  Projectile& projectile = *game.worldPtr->projectiles.back();
  projectile.setTarget(targetX, targetY);

  addBoolTimer(750 + (rand() % 100), shootEnabled);
}

void Bomber::handleCollision(const Rect& blocker) {
  // GameWorld& world = *(game.worldPtr);
  // int index = game.pxToTileIndex(blocker.x, blocker.y);
  // world.tiles[index] = 0;
}

void Bomber::handleCollision(const Player& player) { remove(); }

void Bomber::handleCollision(const Projectile& projectile) {
  if (projectile.type == PLAYER) {

    double d =
        distance(x, y, game.worldPtr->player->x, game.worldPtr->player->y);

    if (d < 50) {
      game.modifyScore(900);
    } else if (d < 150) {
      game.modifyScore(600);
    } else {
      game.modifyScore(300);
    }

    remove();
  }
}

void Bomber::update() {
  float d = distance(x, y, walkX, walkY);
  if (d < 50) {
    maxSpeed = walkSpeed / 2;
  }

  if (d < 15) {
    setNextWalkPos();
  }

  double heading =
      getAngleDegTowards(std::make_pair(x, y), std::make_pair(walkX, walkY));
  setHeading(heading);

  accelerating = true;

  if (shootEnabled) {
    shootBomb();
  }

  Actor::update();
}
void Bomber::draw() { Actor::draw(); }