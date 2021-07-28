#include "Enemy.h"
#include "Game.h"
#include "GameOptions.h"
#include "Particle.h"
#include "Physics.h"
#include "Player.h"
#include "Projectile.h"

Enemy::Enemy(Game& gameA,
             const EnemyType enemyTypeA,
             const double headingDegA,
             const double speedA)
    : Actor(gameA, "invisible"),
      enemyType(enemyTypeA),
      lazerGauge(gameA.window, 1000 + rand() % 250) {

  headingDeg = headingDegA;
  maxSpeed = 1;
  frictionEnabled = false;

  vx = sin(degreesToRadians(headingDegA)) * speedA;
  vy = -cos(degreesToRadians(headingDegA)) * speedA;

  createAnimationDefinition("enemy_ship");
  createAnimationDefinition("mine");

  switch (enemyType) {
  case ENEMY_TYPE_SHIP: {
    setAnimState("enemy_ship");
    wrapEnabled = false;
    break;
  }
  case ENEMY_TYPE_MINE: {
    r = 15.0;
    setAnimState("mine");
    break;
  }
  }
}

Enemy::~Enemy() {}

void Enemy::spawnEnemy(Game& game,
                       const EnemyType type,
                       const double x,
                       const double y) {
  game.enemies.push_back(
      std::make_unique<Enemy>(game, type, x > 100 ? 270 : 90, 2));
  auto& p = game.enemies.back();
  p->set(x, y);
  if (type == ENEMY_TYPE_MINE) {
    p->accelerationRate = .15;
    game.window.playSound("alien_ship");
    p->maxSpeed = 3.5;
    if (p->headingDeg == 270) {
      p->vy = 1;
      p->vx = -1.5;
    } else {
      p->vy = -1;
      p->vx = 1.5;
    }
  }
}

void Enemy::handleCollision(const Player& player) {
  game.window.playSound("explosion");
  if (player.isShielding) {
    game.modifyScore(1000);
  }
  Particle::spawnParticle(game, x, y, PARTICLE_TYPE_EXPLOSION, 1000);
  remove();
}

void Enemy::handleCollision(const Projectile& projectile) {
  if (projectile.firedByPlayer) {
    if (enemyType == ENEMY_TYPE_MINE) {
      if (projectile.r > 5) {
        Particle::spawnParticle(game, x, y, PARTICLE_TYPE_EXPLOSION, 1000);
        remove();
        game.modifyScore(1000);
        game.window.playSound("explosion");
      } else {
        game.window.playSound("metal_hit_" + std::to_string(rand() % 2));
        vx += projectile.vx * 0.1;
        vy += projectile.vy * 0.1;
      }
    } else {

      std::cout << "Player killed enemy ship" << std::endl;
      Particle::spawnParticle(game, x, y, PARTICLE_TYPE_EXPLOSION, 1000);
      remove();
      game.window.playSound("asteroid_explosion");
      game.modifyScore(500);
    }
  }
}

void Enemy::update() {
  Actor::update();
  switch (enemyType) {
  case ENEMY_TYPE_SHIP: {
    lazerGauge.fill();
    if (lazerGauge.isFull()) {
      lazerGauge.empty();
      game.window.playSound("lazer");
      const double headingTowardsPlayer = getAngleDegTowards(
          std::make_pair(x, y), std::make_pair(game.player->x, game.player->y));
      game.projectiles.push_back(std::make_unique<Projectile>(
          game, x, y, PROJECTILE_TYPE_ENEMY, headingTowardsPlayer, 5, 800));
    }

    if (x < 0 || x > GameOptions::width) {
      remove();
    }

    break;
  }
  case ENEMY_TYPE_MINE: {
    const double newHeading = getAngleDegTowards(
        std::make_pair(x, y), std::make_pair(game.player->x, game.player->y));
    headingDeg = newHeading;
    accelerating = true;
    break;
  }
  default: {
  }
  }
}

void Enemy::draw() { Actor::draw(); }