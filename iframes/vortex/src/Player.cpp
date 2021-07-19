#include "Player.h"
#include "Game.h"
#include "GameOptions.h"
#include "Particle.h"
#include "Physics.h"
#include "Powerup.h"
#include "Projectile.h"

Player::Player(Game& gameA)
    : Actor(gameA, "invisible"),
      isDead(false),
      isShielding(false),
      lives(3),
      canFire(true),
      fireCooldownMs(250),
      rotateRate(4.5),
      useBigGun(false),
      useFastGun(false),
      shield(SDL2Wrapper::Gauge(gameA.window, 5000)),
      engineSound(SDL2Wrapper::ContinuousSound(gameA.window, "engine", 100)),
      shieldSound(SDL2Wrapper::ContinuousSound(gameA.window, "engine", 100)) {
  accelerationRate = .1;
  maxSpeed = 5;
  x = 100;
  y = 100;
  r = 16;
  anims["player_shield"] = SDL2Wrapper::Animation();
  game.window.setAnimationFromDefinition("player_shield",
                                         anims["player_shield"]);
  anims["player_shield"].start();
}

Player::~Player() {}

void Player::turn(Direction d) {
  if (isDead) {
    return;
  }

  const double frameRatio = game.window.getFrameRatio();
  double vr = rotateRate * frameRatio;
  if (d == LEFT) {
    setHeading(headingDeg - vr);
  } else if (d == RIGHT) {
    setHeading(headingDeg + vr);
  }
}

void Player::fireProjectiles() {
  if (isDead) {
    return;
  }

  if (canFire) {
    if (useBigGun) {
      game.window.playSound("lazer_big");
    } else {
      game.window.playSound("lazer");
    }
    canFire = false;
    addBoolTimer(fireCooldownMs, canFire);
    game.projectiles.push_back(std::make_unique<Projectile>(
        game,
        x,
        y,
        useBigGun ? PROJECTILE_TYPE_PLAYER_BIG : PROJECTILE_TYPE_PLAYER,
        headingDeg,
        8,
        700));
    auto& p = game.projectiles.back();
    p->vx += vx;
    p->vy += vy;
  }
}

void Player::accelerate() {
  accelerating = true;
  engineSound.play();
}

void Player::stopAccelerating() {
  accelerating = false;
  engineSound.pause();
}

void Player::enableShields() {
  if (isDead) {
    return;
  }

  // gauge is inverse of fuel tank
  if (shield.isFull()) {
    return;
  }

  isShielding = true;
  r = 20;
}

void Player::disableShields() {
  isShielding = false;
  r = 16;
}

void Player::enableFastGun() {
  useFastGun = true;
  fireCooldownMs = 100;
}
void Player::disableFastGun() {
  useFastGun = false;
  fireCooldownMs = 250;
}
void Player::enableBigGun() { useBigGun = true; }
void Player::disableBigGun() { useBigGun = false; }

const std::string Player::getSpriteFromHeadingDeg(const double headingDeg) {
  double step = 360.0 / 20.0;

  if (headingDeg > 360.0 - step / 2.0) {
    return "0";
  }

  int ctr = 0;
  for (double i = step / 2.0; i < 360.0; i += step) {
    if (headingDeg < i) {
      return std::to_string(ctr);
    }
    ctr++;
  }

  return "0";
}

const std::string Player::getAnimationStr() {
  if (accelerating) {
    return "player_ship_boost_" + getSpriteFromHeadingDeg(headingDeg);
  }
  return "player_ship_" + getSpriteFromHeadingDeg(headingDeg);
}

void Player::setAnimState(const std::string& state) { animState = state; }

void Player::handleCollision(const Asteroid& asteroid) {
  if (isDead) {
    return;
  }

  if (isShielding) {
    game.window.playSound("shield_hit");
    return;
  }

  Particle::spawnParticle(game, x, y, PARTICLE_TYPE_EXPLOSION, 1000);
  isDead = true;
}
void Player::handleCollision(const Projectile& projectile) {
  if (isDead) {
    return;
  }

  if (isShielding) {
    game.window.playSound("shield_hit");
    return;
  }

  if (!projectile.firedByPlayer) {
    Particle::spawnParticle(game, x, y, PARTICLE_TYPE_EXPLOSION, 1000);
    isDead = true;
    game.window.playSound("explosion");
  }
}
void Player::handleCollision(const Powerup& powerup) {
  if (isDead) {
    return;
  }

  switch (powerup.powerupType) {
  case POWERUP_TYPE_HEART: {
    Particle::spawnTextParticle(game, x, y, "+1 Life!", 2000);
    lives++;
    break;
  }
  case POWERUP_TYPE_CANDY: {
    int v = rand() % 3;
    if (v == 0 || useBigGun || useFastGun) {
      Particle::spawnTextParticle(game, x, y, "+Shields", 2000);
      shield.empty();
    } else if (v == 1) {
      enableFastGun();
      game.addFuncTimer(8000, [&]() {
        disableFastGun();
        if (game.state == GAME_STATE_GAME && !game.isTransitioning) {
          game.window.playSound("powerup_gone");
        }
      });
      Particle::spawnTextParticle(game, x, y, "Machine Gun!", 2000);
    } else if (v == 2) {
      enableBigGun();
      game.addFuncTimer(8000, [&]() {
        disableBigGun();
        if (game.state == GAME_STATE_GAME && !game.isTransitioning) {
          game.window.playSound("powerup_gone");
        }
      });
      Particle::spawnTextParticle(game, x, y, "Big Gun!", 2000);
    }
    break;
  }
  case POWERUP_TYPE_STAR: {
    Particle::spawnTextParticle(game, x, y, "Bonus Multiplier!", 2000);
    game.stars++;
    break;
  }
  case POWERUP_TYPE_DIAMOND: {
    Particle::spawnParticle(game, x, y, PARTICLE_TYPE_YES, 1000);
    game.diamonds++;
    break;
  }
  }
}
void Player::handleCollision(const Enemy& enemy) {
  if (isDead) {
    return;
  }

  if (isShielding) {
    game.window.playSound("shield_hit");
    return;
  }

  isDead = true;
  Particle::spawnParticle(game, x, y, PARTICLE_TYPE_EXPLOSION, 1000);
}

// bool logStuff = true;

void Player::update() {
  Actor::update();
  setAnimState(getAnimationStr());

  // if (logStuff) {
  //   logStuff = false;
  //   addBoolTimer(250, logStuff);
  //   std::cout << game.window.getFrameRatio() << " "
  //             << game.window.getDeltaTime()
  //             << ", freq=" << SDL_GetPerformanceFrequency() << std::endl;
  // }

  accelerating = false;
}

void Player::draw() {
  if (isDead) {
    return;
  }

  game.window.drawSprite(animState, x, y);
  engineSound.update();

  if (isShielding) {
    shield.fill();

    if (shield.isFull()) {
      disableShields();
    } else {
      game.window.drawAnimation(anims["player_shield"], x, y);
    }
  }
}