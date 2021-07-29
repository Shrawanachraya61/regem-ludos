#include "Asteroid.h"
#include "Game.h"
#include "GameOptions.h"
#include "Particle.h"
#include "Physics.h"
#include "Player.h"
#include "Projectile.h"

Asteroid::Asteroid(Game& game,
                   const AsteroidLevel levelA,
                   const double headingDegA,
                   const double speedA)
    : Actor(game, "invisible"), level(levelA) {
  headingDeg = headingDegA;
  maxSpeed = 1.5;
  frictionEnabled = false;

  vx = sin(degreesToRadians(headingDegA)) * speedA;
  vy = -cos(degreesToRadians(headingDegA)) * speedA;

  createAnimationDefinition("asteroid1");
  createAnimationDefinition("asteroid2");
  createAnimationDefinition("asteroid3");
  createAnimationDefinition("steel_ball");

  gravityEnabled = true;

  switch (level) {
  case ASTEROID_LEVEL1: {
    r = 20.0;
    setAnimState("asteroid1");
    break;
  }
  case ASTEROID_LEVEL2: {
    r = 15.0;
    setAnimState("asteroid2");
    break;
  }
  case ASTEROID_LEVEL3: {
    r = 6.0;
    setAnimState("asteroid3");
    break;
  }
  case ASTEROID_LEVEL_METAL: {
    r = 17.0;
    setAnimState("steel_ball");
    maxSpeed = 2;
    break;
  }
  }
}

Asteroid::~Asteroid() {}

void Asteroid::spawnAsteroid(Game& game,
                             const AsteroidLevel level,
                             const double x,
                             const double y,
                             const double maxSpeed) {

  const int maxSpeedRate = floor(maxSpeed * 2);
  const double speed = (double(rand() % maxSpeedRate) + 0.5) / 2.0;

  game.asteroids.push_back(
      std::make_unique<Asteroid>(game, level, rand() % 360, speed));
  auto& a = game.asteroids.back();
  a->set(x, y);
}

void Asteroid::onRemove() {
  game.window.playSound("asteroid_explosion");
  if (level == ASTEROID_LEVEL3) {
    // small explosion
    Particle::spawnParticle(game, x, y, PARTICLE_TYPE_EXPLOSION2, 1000);
  } else {
    Particle::spawnParticle(game, x, y, PARTICLE_TYPE_EXPLOSION, 1000);
  }
}

void Asteroid::handleCollision(const Player& player) {
  if (player.isShielding) {
    game.modifyScore(200);
    remove();
    return;
  }

  if (level != ASTEROID_LEVEL_METAL) {
    remove();
  } else {
    game.modifyScore(500);
  }
}
void Asteroid::handleCollision(const Projectile& projectile) {
  if (projectile.firedByPlayer) {
    switch (level) {
    case ASTEROID_LEVEL1: {
      Asteroid::spawnAsteroid(game, ASTEROID_LEVEL2, x, y, maxSpeed + 2.5);
      Asteroid::spawnAsteroid(game, ASTEROID_LEVEL2, x, y, maxSpeed + 2.5);

      game.modifyScore(100);
      remove();
      break;
    }
    case ASTEROID_LEVEL2: {
      Asteroid::spawnAsteroid(game, ASTEROID_LEVEL3, x, y, maxSpeed + 2.5);
      Asteroid::spawnAsteroid(game, ASTEROID_LEVEL3, x, y, maxSpeed + 2.5);
      // Asteroid::spawnAsteroid(game, ASTEROID_LEVEL3, x, y, maxSpeed + 3.5);
      // Asteroid::spawnAsteroid(game, ASTEROID_LEVEL3, x, y, maxSpeed + 3.5);

      game.modifyScore(150);
      remove();
      break;
    }
    case ASTEROID_LEVEL3: {
      game.modifyScore(200);
      remove();
      break;
    }
    case ASTEROID_LEVEL_METAL: {
      if (projectile.r > 5) {
        game.modifyScore(500);
        remove();
      } else {
        game.window.playSound("metal_hit_" + std::to_string(rand() % 2));
        vx += projectile.vx * 0.1;
        vy += projectile.vy * 0.1;
      }
      break;
    }
    }
  }
}

void Asteroid::update() {
  Actor::update();
  if (x > GameOptions::width) {
    x = 0;
  } else if (x < 0) {
    x = GameOptions::width;
  }
  if (y > GameOptions::height) {
    y = 0;
  } else if (y < 0) {
    y = GameOptions::height;
  }
}
void Asteroid::draw() { Actor::draw(); }