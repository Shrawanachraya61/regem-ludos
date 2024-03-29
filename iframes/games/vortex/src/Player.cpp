#include "Player.h"
#include "Game.h"
#include "GameOptions.h"
#include "Physics.h"
#include "Projectile.h"

#include "Particle.h"
#include "Powerup.h"
#include "Enemy.h"

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
      usePierceGun(false),
      useSpreadGun(false),
      useBigShield(false),
      isInvincible(false),
      armor(1),
      shield(SDL2Wrapper::Gauge(gameA.window, 5000)),
      engineSound(SDL2Wrapper::ContinuousSound(gameA.window, "engine", 100)),
      shieldSound(SDL2Wrapper::ContinuousSound(gameA.window, "shield", 200)) {
  accelerationRate = .1;
  maxSpeed = 5;
  x = 100;
  y = 100;
  r = 16;
  gravityEnabled = true;
  createAnimationDefinition("player_shield");
  createAnimationDefinition("player_invincible");
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

    ProjectileType ptype = PROJECTILE_TYPE_PLAYER;
    if (useBigGun) {
      ptype = PROJECTILE_TYPE_PLAYER_BIG;
    } else if (usePierceGun) {
      ptype = PROJECTILE_TYPE_PIERCE;
    }

    canFire = false;
    addBoolTimer(fireCooldownMs, canFire);

    if (useSpreadGun) {
      for (int i = -5; i <= 5; i += 5) {
        game.projectiles.push_back(std::make_unique<Projectile>(
            game, x, y, ptype, headingDeg + i, 8, 700));
        auto& p = game.projectiles.back();
        p->vx += vx;
        p->vy += vy;
      }
    } else {
      game.projectiles.push_back(
          std::make_unique<Projectile>(game, x, y, ptype, headingDeg, 8, 700));
      auto& p = game.projectiles.back();
      p->vx += vx;
      p->vy += vy;
    }
  }
}

void Player::accelerate() {
  if (isDead) {
    return;
  }

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

  shieldSound.play();
  isShielding = true;
  r = 20;
}

void Player::disableShields() {
  shieldSound.pause();
  isShielding = false;
  r = 16;
}

void Player::enablePowerup(PlayerPowerupType type) {
  if (isDead) {
    return;
  }

  switch (type) {
  case PLAYER_POWERUP_BIG_GUN: {
    useBigGun = true;
    break;
  }
  case PLAYER_POWERUP_FAST_GUN: {
    useFastGun = true;
    fireCooldownMs = 100;
    break;
  }
  case PLAYER_POWERUP_PIERCE_GUN: {
    usePierceGun = true;
    break;
  }
  case PLAYER_POWERUP_SPREAD_GUN: {
    useSpreadGun = true;
    break;
  }
  case PLAYER_POWERUP_INVINCIBLE: {
    isInvincible = true;
    useBigShield = true;
    break;
  }
  }
}

void Player::disablePowerup(PlayerPowerupType type) {
  switch (type) {
  case PLAYER_POWERUP_BIG_GUN: {
    useBigGun = false;
    break;
  }
  case PLAYER_POWERUP_FAST_GUN: {
    useFastGun = false;
    fireCooldownMs = 250;
    break;
  }
  case PLAYER_POWERUP_PIERCE_GUN: {
    usePierceGun = false;
    break;
  }
  case PLAYER_POWERUP_SPREAD_GUN: {
    useSpreadGun = false;
    break;
  }
  case PLAYER_POWERUP_INVINCIBLE: {
    isInvincible = false;
    useBigShield = false;
    break;
  }
  }
}

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
  if (armor > 0) {
    if (accelerating) {
      return "player_ship_armored_boost_" + getSpriteFromHeadingDeg(headingDeg);
    }
    return "player_ship_armored_" + getSpriteFromHeadingDeg(headingDeg);
  } else {
    if (accelerating) {
      return "player_ship_boost_" + getSpriteFromHeadingDeg(headingDeg);
    }
    return "player_ship_" + getSpriteFromHeadingDeg(headingDeg);
  }
}

void Player::setAnimState(const std::string& state) { animState = state; }

void Player::handleCollision(const Asteroid& asteroid) {
  if (isDead) {
    return;
  }

  if (useBigShield || isInvincible) {
    game.window.playSound("shield_hit");
    return;
  }

  if (isShielding) {
    game.window.playSound("shield_hit");
    return;
  }

  if (armor > 0 && !isInvincible) {
    game.window.playSound("armor");
    isInvincible = true;
    armor--;
    game.addBoolTimer(100, isInvincible);
    return;
  }

  Particle::spawnParticle(game, x, y, PARTICLE_TYPE_EXPLOSION, 1000);
  isDead = true;
}
void Player::handleCollision(const Projectile& projectile) {
  if (isDead) {
    return;
  }

  if (useBigShield || isInvincible) {
    game.window.playSound("shield_hit");
    return;
  }

  if (isShielding) {
    game.window.playSound("shield_hit");
    return;
  }

  if (armor > 0 && !isInvincible) {
    game.window.playSound("armor");
    isInvincible = true;
    armor--;
    game.addBoolTimer(100, isInvincible);
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
    game.window.playSound("oh_yeah");
    Particle::spawnTextParticle(game, x, y, "+1 Life!", 2000);
    lives++;
    break;
  }
  case POWERUP_TYPE_CANDY: {
    int v = rand() % 3;
    if (v == 0) {
      game.window.playSound("invincible");
      enablePowerup(PLAYER_POWERUP_INVINCIBLE);
      game.addFuncTimer(8000, [=]() {
        disablePowerup(PLAYER_POWERUP_INVINCIBLE);
        if (game.state == GAME_STATE_GAME && !game.isTransitioning) {
          game.window.playSound("invincible_off");
        }
      });
      Particle::spawnTextParticle(game, x, y, "Invincible!", 2000);
    } else if (v == 1) {
      game.window.playSound("armor_get");
      armor++;
      Particle::spawnTextParticle(game, x, y, "Armor++", 2000);

    } else if (v == 2) {
      game.window.playSound("full_shield");
      Particle::spawnTextParticle(game, x, y, "Full Shields", 2000);
      shield.empty();
    }

    break;
  }
  case POWERUP_TYPE_CAPSULE: {
    game.window.playSound("item_get");
    int v = rand() % 4;
    if (v == 0) {
      enablePowerup(PLAYER_POWERUP_PIERCE_GUN);
      game.addFuncTimer(25000, [=]() {
        disablePowerup(PLAYER_POWERUP_PIERCE_GUN);
        if (game.state == GAME_STATE_GAME && !game.isTransitioning) {
          game.window.playSound("powerup_gone");
        }
      });
      Particle::spawnTextParticle(game, x, y, "Pierce Gun!", 2000);
    } else if (v == 1) {
      enablePowerup(PLAYER_POWERUP_BIG_GUN);
      game.addFuncTimer(25000, [=]() {
        disablePowerup(PLAYER_POWERUP_BIG_GUN);
        if (game.state == GAME_STATE_GAME && !game.isTransitioning) {
          game.window.playSound("powerup_gone");
        }
      });
      Particle::spawnTextParticle(game, x, y, "Big Gun!", 2000);
    } else if (v == 2) {
      enablePowerup(PLAYER_POWERUP_FAST_GUN);
      game.addFuncTimer(25000, [=]() {
        disablePowerup(PLAYER_POWERUP_FAST_GUN);
        if (game.state == GAME_STATE_GAME && !game.isTransitioning) {
          game.window.playSound("powerup_gone");
        }
      });
      Particle::spawnTextParticle(game, x, y, "Fast Gun!", 2000);
    } else if (v == 3) {
      enablePowerup(PLAYER_POWERUP_SPREAD_GUN);
      game.addFuncTimer(25000, [=]() {
        disablePowerup(PLAYER_POWERUP_SPREAD_GUN);
        if (game.state == GAME_STATE_GAME && !game.isTransitioning) {
          game.window.playSound("powerup_gone");
        }
      });
      Particle::spawnTextParticle(game, x, y, "Spread Gun!", 2000);
    }
    break;
  }
  case POWERUP_TYPE_STAR: {
    game.window.playSound("star_get");
    game.stars++;
    Particle::spawnTextParticle(
        game, x, y, "Bonus x" + std::to_string(game.stars + 1), 2000);
    game.bonusGauge.empty();
    break;
  }
  case POWERUP_TYPE_DIAMOND: {
    game.window.playSound("yes");
    Particle::spawnParticle(game, x, y, PARTICLE_TYPE_YES, 1000);
    game.diamonds++;
    break;
  }
  case POWERUP_TYPE_SHOOTING_STAR: {
    game.window.playSound("star_get");
    game.score += 5000;
    Particle::spawnTextParticle(game, x, y, "+5000");
    break;
  }
  }
}
void Player::handleCollision(const Enemy& enemy) {
  if (isDead) {
    return;
  }

  if (useBigShield || isInvincible) {
    game.window.playSound("shield_hit");
    return;
  }

  if (isShielding) {
    game.window.playSound("shield_hit");
    return;
  }

  if (armor > 0 && !isInvincible) {
    game.window.playSound("armor");
    isInvincible = true;
    armor--;
    game.addBoolTimer(100, isInvincible);
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
  shieldSound.update();

  if (isShielding) {
    shield.fill();

    if (shield.isFull()) {
      disableShields();
    } else {
      game.window.drawAnimation(anims["player_shield"], x, y);
    }
  }

  if (useBigShield) {
    game.window.drawAnimation(anims["player_invincible"], x, y);
  }
}