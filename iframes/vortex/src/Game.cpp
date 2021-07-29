#include "Game.h"
#include "Actor.h"
#include "GameOptions.h"
#include "LibHTML.h"
#include "Particle.h"
#include "Physics.h"
#include "Player.h"

#include "Asteroid.h"
#include "BlackHole.h"
#include "Enemy.h"
#include "Powerup.h"
#include "Projectile.h"

#include <algorithm>
#include <cctype>
#include <sstream>
#include <string>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/html5.h>
#endif

const int GameOptions::width = 512;
const int GameOptions::height = 512;

GameOptions::GameOptions() {}

void spawnPowerups(Game& game) {}

void spawnAlienShips(Game& game) {}

void spawnEnemies(Game& game) {}

Game::Game(SDL2Wrapper::Window& windowA)
    : shouldExit(false),
      shouldClearTimers(false),
      isTransitioning(false),
      state(GAME_STATE_MENU),
      window(windowA),
      score(0),
      bonus(0),
      stars(0),
      diamonds(0),
      lastScore(0),
      bonusAfterWaveCompleted(0),
      updateEntities(true),
      initWorldNextTick(false),
      clearEntitiesNextTick(false),
      bonusGauge(SDL2Wrapper::Gauge(windowA, 60000)),
      wave(2) {
  SDL2Wrapper::Store::createFont("default", "assets/monofonto.ttf");
  window.setCurrentFont("default", 18);

  SDL2Wrapper::loadAssetsFromFile("sprite", "assets/sprites.txt");
  SDL2Wrapper::loadAssetsFromFile("animation", "assets/anims.txt");
  SDL2Wrapper::loadAssetsFromFile("sound", "assets/sounds.txt");

  player = std::make_unique<Player>(*this);
  window.setAnimationFromDefinition("asteroid128", titleAnimation);
  titleAnimation.start();

  int tileWidth = GameOptions::width / 32.0;
  int tileHeight = GameOptions::height / 32.0;
  for (int i = 0; i < tileHeight; i++) {
    for (int j = 0; j < tileWidth; j++) {
      background.push_back(rand() % 4);
    }
  }

  // is this necessary?
  SDL2Wrapper::Events& events = window.getEvents();
  events.setKeyboardEvent(
      "keydown", std::bind(&Game::handleKeyDown, this, std::placeholders::_1));
  events.setKeyboardEvent(
      "keyup", std::bind(&Game::handleKeyUp, this, std::placeholders::_1));
}

Game::~Game() {}

void Game::setState(GameState stateA) {
  state = stateA;
  SDL2Wrapper::Events& events = window.getEvents();
  // events.popRouteNextTick();
  // events.pushRoute();

  switch (state) {
  case GAME_STATE_MENU: {
    window.playMusic("menu");
    events.setKeyboardEvent(
        "keydown",
        std::bind(&Game::handleKeyMenu, this, std::placeholders::_1));
    break;
  }
  case GAME_STATE_GAME: {
    updateEntities = true;
    addWorldSpawnTimers();
    events.setKeyboardEvent(
        "keydown",
        std::bind(&Game::handleKeyDown, this, std::placeholders::_1));
    events.setKeyboardEvent(
        "keyup", std::bind(&Game::handleKeyUp, this, std::placeholders::_1));
    break;
  }
  case GAME_STATE_WAVE_COMPLETED: {
    clearEntitiesNextTick = true;
    bonus = bonusAfterWaveCompleted;

    addFuncTimer(1000, [=]() {
      if (diamonds > 0) {
        window.playSound("score_add");
        bonus += 2500 * diamonds;
        diamonds = 0;
      }
    });

    addFuncTimer(1000 + 750, [=]() {
      if (stars > 0) {
        window.playSound("score_add");
        bonus *= (stars + 1);
        stars = 0;
      }
    });

    addFuncTimer(1000 + 750 * 2, [=]() {
      if (bonus > 0) {
        window.playSound("score_add");
        modifyScore(bonus);
        bonus = 0;
        bonusAfterWaveCompleted = 0;
      } else {
        window.playSound("no_bonus");
      }
    });

    isTransitioning = true;
    addBoolTimer(1000 + 750 * 3, isTransitioning);
    events.setKeyboardEvent(
        "keydown",
        std::bind(&Game::handleKeyWaveCompleted, this, std::placeholders::_1));
    break;
  }
  case GAME_STATE_READY_TO_START: {
    updateEntities = false;
    window.playSound("level_ready");
    events.setKeyboardEvent(
        "keydown",
        std::bind(&Game::handleKeyReadyToStart, this, std::placeholders::_1));
    break;
  }
  case GAME_STATE_GAME_OVER: {
    clearEntitiesNextTick = true;
    if (score > lastScore) {
      shouldPlayHiscoreSound = true;
    }
    isTransitioning = true;
    addBoolTimer(1000, isTransitioning);
    events.setKeyboardEvent(
        "keydown",
        std::bind(&Game::handleKeyGameOver, this, std::placeholders::_1));
    break;
  }
  }
}

void Game::startNewGame() {
  wave = 2;
  score = 0;
  bonus = 0;
  stars = 0;
  diamonds = 0;
  player->lives = 3;
  player->isDead = false;
  player->armor = 0;
  player->shield.empty();
  updateEntities = true;
  shouldPlayHiscoreSound = false;
  window.playSound("start_game");
  // might be causing a segfault
  // initWorld();
  initWorldNextTick = true;
  heartSpawns.clear();
  setState(GAME_STATE_READY_TO_START);
  notifyGameStarted();
}

void Game::initWorld() {
  projectiles.clear();
  particles.clear();
  asteroids.clear();
  powerups.clear();
  enemies.clear();
  blackHoles.clear();
  timers.clear();

  player->set(GameOptions::width / 2, GameOptions::height / 2);
  player->setV(0, 0);
  player->setA(0, 0);
  player->headingDeg = 0;
  player->stopAccelerating();
  player->disablePowerup(PLAYER_POWERUP_BIG_GUN);
  player->disablePowerup(PLAYER_POWERUP_FAST_GUN);
  player->disablePowerup(PLAYER_POWERUP_PIERCE_GUN);
  player->disableShields();
  player->update();

  stars = 0;
  diamonds = 0;
  bonus = 1000 + (wave - 2) * 500;
  bonusGauge.empty();
  bonusGauge.setMs(60000 + 1500 * (wave - 2));

  // randomly put asteroids in a donut around the player.
  // spawn the same number of asteroids as the wave number.
  // increase their max speeds every 4 rounds.
  const std::vector<double> asteroidMaxSpeeds = {
      1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5};
  for (unsigned int i = 0; i < wave; i++) {
    const int asteroidMinRange = 150;
    const int r = asteroidMinRange +
                  rand() % (GameOptions::width / 2 - asteroidMinRange - 32);
    const int angle = rand() % 360;
    const double x = GameOptions::width / 2 + r * cos(degreesToRadians(angle));
    const double y = GameOptions::height / 2 + r * sin(degreesToRadians(angle));
    Asteroid::spawnAsteroid(
        *this,
        ASTEROID_LEVEL1,
        x,
        y,
        asteroidMaxSpeeds[std::min(
            static_cast<unsigned int>(asteroidMaxSpeeds.size() - 1),
            wave / 4)]);
  }

  // spawn additional metal ball every 3 waves
  for (unsigned int i = 0; i < wave / 3; i++) {
    const int r = GameOptions::width / 2 - 64;
    const int angle = rand() % 360;
    const double x = GameOptions::width / 2 + r * cos(degreesToRadians(angle));
    const double y = GameOptions::height / 2 + r * sin(degreesToRadians(angle));
    Asteroid::spawnAsteroid(
        *this, ASTEROID_LEVEL_METAL, x, y, asteroidMaxSpeeds[1]);
  }
}

// needs to be separate from initWorld because the player can wait on the READY
// screen for any amount of time.
void Game::addWorldSpawnTimers() {

  // on and after wave 4 spawn an additional alien ship every 2 waves
  if (wave >= 4 && wave % 2 == 0) {
    int lastMsValue = 0;
    for (unsigned int i = 0; i < std::max(1u, wave / 4); i++) {
      int ms = lastMsValue + 2000 + rand() % 10000 + 2000 * i;
      lastMsValue = ms;
      addFuncTimer(ms, [=]() {
        if (!isTransitioning && state == GAME_STATE_GAME) {
          const int y = 36 + rand() % int(ceil(GameOptions::width * 0.8));
          const int x = rand() % 2 * GameOptions::width;
          Enemy::spawnEnemy(*this, ENEMY_TYPE_SHIP, x, y);
        }
      });
    }
  }

  // on and after wave 5 spawn an additional mine every 3 waves
  if (wave >= 5 && (wave == 5 || wave % 3 == 0)) {
    int lastMsValue = 0;
    for (unsigned int i = 0; i < std::max(1u, wave / 5); i++) {
      int ms = lastMsValue + 5000 + rand() % 10000 + 2000 * i;
      lastMsValue = ms;
      addFuncTimer(ms, [=]() {
        if (!isTransitioning && state == GAME_STATE_GAME) {
          const int y = 36 + rand() % int(ceil(GameOptions::width * 0.8));
          const int x = rand() % 2 * GameOptions::width;
          Enemy::spawnEnemy(*this, ENEMY_TYPE_MINE, x, y);
        }
      });
    }
  }

  // on waves 5 + 3 + 2 + 2 + 1 spawn an extra life, then spawn an extra life on
  // every wave
  const std::vector<unsigned int> heartWaves = {
      5, 5 + 3, 5 + 3 + 2, 5 + 3 + 2 + 2, 5 + 3 + 2 + 2 + 1};
  if (wave > heartWaves[heartWaves.size() - 1] ||
      std::find(heartWaves.begin(), heartWaves.end(), wave) !=
          heartWaves.end()) {

    // only spawn a heart on a wave if you haven't spawned one before.  This
    // prevents death spamming for hearts on the same wave over and over.
    if (std::find(heartSpawns.begin(), heartSpawns.end(), wave) ==
        heartSpawns.end()) {
      addFuncTimer(2000 + rand() % 10000, [=]() {
        if (!isTransitioning && state == GAME_STATE_GAME) {
          heartSpawns.push_back(wave);
          const int r = GameOptions::width / 2;
          const int angle = rand() % 360;
          double x = GameOptions::width / 2 + r * cos(degreesToRadians(angle));
          double y = GameOptions::height / 2 + r * sin(degreesToRadians(angle));
          Powerup::spawnPowerup(*this, POWERUP_TYPE_HEART, x, y);
        }
      });
    }
  }

  // black hole 33% chance after wave 5
  if (wave > 5 && rand() % 3 == 0) {
    addFuncTimer(5000 + rand() % 10000, [=]() {
      if (!isTransitioning && state == GAME_STATE_GAME) {
        int v = rand() % 4;
        if (v == 0) {
          BlackHole::spawnBlackHole(*this, 32, 28 + 32);
        } else if (v == 1) {
          BlackHole::spawnBlackHole(*this, 512 - 32, 28 + 32);
        } else if (v == 2) {
          BlackHole::spawnBlackHole(*this, 32, 512 - 32);
        } else if (v == 3) {
          BlackHole::spawnBlackHole(*this, 512 - 32, 512 - 32);
        }
      }
    });
  }

  // spawn a shooting star 33% chance
  if (rand() % 3 == 0) {
    addFuncTimer(5000 + rand() % 10000, [=]() {
      if (!isTransitioning && state == GAME_STATE_GAME) {
        Powerup::spawnPowerup(*this, POWERUP_TYPE_SHOOTING_STAR, 0, 0);
      }
    });
  }

  // spawn a stationary star 33% chance
  if (rand() % 3 == 0) {
    addFuncTimer(5000 + rand() % 10000, [=]() {
      if (!isTransitioning && state == GAME_STATE_GAME) {
        int sz = (512 - 64);
        int x = 32 + (rand() % sz);
        int y = 32 + (rand() % sz);
        Powerup::spawnPowerup(*this, POWERUP_TYPE_STAR, x, y);
      }
    });
  }

  // spawn powerups at specific intervals during the wave
  const std::vector<unsigned int> powerupIntervals = {
      5000,
      12000,
      17000,
      25000,
      33000,
      45000,
  };
  const unsigned int numPowerups = std::min(
      static_cast<unsigned int>(powerupIntervals.size() - 1), 3 + wave / 4);
  for (unsigned int i = 0; i < numPowerups; i++) {
    addFuncTimer(powerupIntervals[i] * (i + 1), [=]() {
      if (!isTransitioning && state == GAME_STATE_GAME) {
        const int r = GameOptions::width / 2;
        const int angle = rand() % 360;
        double x = GameOptions::width / 2 + r * cos(degreesToRadians(angle));
        double y = GameOptions::height / 2 + r * sin(degreesToRadians(angle));
        Powerup::spawnPowerup(*this, Powerup::getRandomPowerupType(), x, y);
      }
    });
  }
}

void Game::modifyScore(const int value) {
  score += value;
  if (score < 0) {
    score = 0;
  }
}

void Game::addBoolTimer(const int maxFrames, bool& ref) {
  timers.push_back(
      std::make_unique<SDL2Wrapper::BoolTimer>(window, maxFrames, ref));
}

void Game::addFuncTimer(const int maxFrames, std::function<void()> cb) {
  timers.push_back(
      std::make_unique<SDL2Wrapper::FuncTimer>(window, maxFrames, cb));
}

void Game::handleKeyDown(const std::string& key) {
  // std::cout << "KEY: " << key << std::endl;
}

void Game::handleKeyUp(const std::string& key) {
  if (key == "Left Shift") {
    player->disableShields();
  }
  if (key == "Up") {
    player->stopAccelerating();
  }
}

void Game::handleKeyUpdate() {
  const SDL2Wrapper::Events& events = window.getEvents();

  if (state != GAME_STATE_GAME) {
    return;
  }

  if (events.isKeyPressed("Left")) {
    player->turn(LEFT);
  } else if (events.isKeyPressed("Right")) {
    player->turn(RIGHT);
  }

  if (events.isKeyPressed("Up")) {
    player->accelerate();
  }
  if (events.isKeyPressed("Space") || events.isKeyPressed("Return")) {
    if (!isTransitioning && state == GAME_STATE_GAME) {
      player->fireProjectiles();
    }
  }
  if (events.isKeyPressed("Left Shift")) {
    player->enableShields();
  }
}

void Game::handleKeyMenu(const std::string& key) {
  if (key == "Escape") {
    shouldExit = true;
  } else {
    window.stopMusic();
    startNewGame();
  }
}

void Game::handleKeyWaveCompleted(const std::string& key) {
  if (!isTransitioning) {
    wave++;
    // initWorld();
    initWorldNextTick = true;
    setState(GAME_STATE_READY_TO_START);
  }
}

void Game::handleKeyGameOver(const std::string& key) {
  notifyGameCompleted(score);
  setState(GAME_STATE_MENU);
}

void Game::handleKeyReadyToStart(const std::string& key) {
  isTransitioning = true;
  addFuncTimer(100, [=] {
    isTransitioning = false;
    setState(GAME_STATE_GAME);
  });
}

std::pair<double, double> Game::getGravitationalPull(const double x,
                                                     const double y) {

  double ax = 0;
  double ay = 0;
  for (auto& blackHole : blackHoles) {
    const double str = blackHole->getStrength();
    const double headingDeg =
        getAngleDegTowards(std::make_pair(x, y), blackHole->get());
    double headingRad = degreesToRadians(headingDeg);
    ax = sin(headingRad) * str * 0.15;
    ay = -cos(headingRad) * str * 0.15;
  }
  return std::make_pair(ax, ay);
}

struct CollisionAsteroidPlayer {
  Asteroid& asteroid;
};

struct CollisionProjectilePlayer {
  Projectile& projectile;
};

struct CollisionEnemyPlayer {
  Enemy& enemy;
};

struct CollisionAsteroidProjectile {
  Asteroid& asteroid;
  Projectile& projectile;
};

struct CollisionProjectilePowerup {
  Projectile& projectile;
  Powerup& powerup;
};

struct CollisionProjectileEnemy {
  Projectile& projectile;
  Enemy& enemy;
};

void Game::checkCollisions() {
  const Circle playerCircle = player->getCollisionCircle();

  std::vector<CollisionAsteroidPlayer> asteroidPlayerCollisions;
  std::vector<CollisionProjectilePlayer> projectilePlayerCollisions;
  std::vector<CollisionEnemyPlayer> enemyPlayerCollisions;
  std::vector<CollisionAsteroidProjectile> asteroidProjectileCollisions;
  std::vector<CollisionProjectilePowerup> projectilePowerupCollisions;
  std::vector<CollisionProjectileEnemy> projectileEnemyCollisions;

  for (auto& asteroid : asteroids) {
    const Circle asteroidCircle = asteroid->getCollisionCircle();
    if (asteroid->shouldRemove()) {
      continue;
    }

    if (collidesCircleCircle(asteroidCircle, playerCircle)) {
      asteroidPlayerCollisions.push_back(CollisionAsteroidPlayer{*asteroid});
      continue;
    }

    for (auto& projectile : projectiles) {
      if (projectile->shouldRemove() || !projectile->collisionEnabled) {
        continue;
      }

      if (collidesCircleCircle(asteroidCircle,
                               projectile->getCollisionCircle())) {
        asteroidProjectileCollisions.push_back(
            CollisionAsteroidProjectile{*asteroid, *projectile});
        break;
      }
    }
  }

  for (auto& projectile : projectiles) {
    const Circle projectileCircle = projectile->getCollisionCircle();
    if (projectile->shouldRemove() || !projectile->collisionEnabled) {
      continue;
    }
    if (!projectile->firedByPlayer &&
        collidesCircleCircle(projectileCircle, playerCircle)) {
      projectilePlayerCollisions.push_back(
          CollisionProjectilePlayer{*projectile});
      continue;
    }

    for (auto& powerup : powerups) {
      const Circle powerupCircle = powerup->getCollisionCircle();
      if (powerup->shouldRemove()) {
        continue;
      }

      if (collidesCircleCircle(powerupCircle, projectileCircle)) {
        projectilePowerupCollisions.push_back(
            CollisionProjectilePowerup{*projectile, *powerup});
      }
    }

    for (auto& enemy : enemies) {
      const Circle enemyCircle = enemy->getCollisionCircle();
      if (enemy->shouldRemove()) {
        continue;
      }

      if (collidesCircleCircle(enemyCircle, projectileCircle)) {
        projectileEnemyCollisions.push_back(
            CollisionProjectileEnemy{*projectile, *enemy});
      }
    }
  }

  for (auto& powerup : powerups) {
    const Circle powerupCircle = powerup->getCollisionCircle();
    if (powerup->shouldRemove()) {
      continue;
    }

    if (collidesCircleCircle(powerupCircle, playerCircle)) {
      player->handleCollision(*powerup);
      powerup->handleCollision(*player);
    }
  }

  for (auto& enemy : enemies) {
    const Circle enemyCircle = enemy->getCollisionCircle();
    if (enemy->shouldRemove()) {
      continue;
    }
    if (collidesCircleCircle(enemyCircle, playerCircle)) {
      enemyPlayerCollisions.push_back(CollisionEnemyPlayer{*enemy});
    }
  }

  for (auto& c : asteroidPlayerCollisions) {
    player->handleCollision(c.asteroid);
    c.asteroid.handleCollision(*player);
  }

  for (auto& c : projectilePlayerCollisions) {
    player->handleCollision(c.projectile);
    c.projectile.handleCollision(*player);
  }

  for (auto& c : enemyPlayerCollisions) {
    player->handleCollision(c.enemy);
    c.enemy.handleCollision(*player);
  }

  for (auto& c : asteroidProjectileCollisions) {
    c.projectile.handleCollision(c.asteroid);
    c.asteroid.handleCollision(c.projectile);
  }

  for (auto& c : projectilePowerupCollisions) {
    c.projectile.handleCollision(c.powerup);
    c.powerup.handleCollision(c.projectile);
  }

  for (auto& c : projectileEnemyCollisions) {
    c.projectile.handleCollision(c.enemy);
    c.enemy.handleCollision(c.projectile);
  }
}

void Game::checkGameOver() {
  if (player->isDead && !isTransitioning) {
    isTransitioning = true;
    addFuncTimer(500, [=]() { window.playSound("level_lose"); });
    addFuncTimer(1500, [=]() {
      Particle::spawnParticle(*this, 0, 0, PARTICLE_TYPE_FADE_OUT, 750);
      updateEntities = false;
    });
    addFuncTimer(1500 + 750, [=]() {
      isTransitioning = false;
      player->lives--;
      if (player->lives < 0) {
        setState(GAME_STATE_GAME_OVER);
      } else {
        setState(GAME_STATE_READY_TO_START);
        player->isDead = false;
        player->shield.empty();
        player->armor = 0;
        initWorld();
      }
    });
  }
}
void Game::checkWaveCompleted() {
  if (player->isDead) {
    return;
  }

  bool isWaveCompleted = true;

  for (auto& a : asteroids) {
    if (a->level != ASTEROID_LEVEL_METAL) {
      isWaveCompleted = false;
      break;
    }
  }

  if (isWaveCompleted && !isTransitioning) {
    bonusAfterWaveCompleted =
        int(double(bonus) * (1.0 - bonusGauge.getPctFull()));
    addFuncTimer(500, [=]() { window.playSound("wave_completed"); });
    powerups.clear();
    isTransitioning = true;
    addFuncTimer(1500, [=]() {
      Particle::spawnParticle(*this, 0, 0, PARTICLE_TYPE_FADE_OUT, 750);
      updateEntities = false;
      addFuncTimer(750, [=]() {
        isTransitioning = false;
        setState(GAME_STATE_WAVE_COMPLETED);
      });
    });
  }
}

void Game::drawUI() {
  window.drawSprite("red", 0, 0, true, 0, std::make_pair(512.0, 1.2));
  window.setCurrentFont("default", 16);
  window.drawText("Score: " + std::to_string(score),
                  16,
                  0,
                  window.makeColor(255, 255, 255));

  window.drawText("Shield: ", 128 + 48, 0, window.makeColor(255, 255, 255));

  double shieldBarWidthPx = 48;
  window.drawSprite("white",
                    128 + 128 - 8,
                    23,
                    true,
                    0,
                    std::make_pair(shieldBarWidthPx / 32.0, 0.30));
  window.drawSprite("blue",
                    128 + 128 - 8 + 2,
                    25,
                    true,
                    0,
                    std::make_pair((shieldBarWidthPx / 32.0 - 0.1) *
                                       (1.0 - player->shield.getPctFull()),
                                   0.18));

  if (player->armor > 0) {
    window.drawText("+" + std::to_string(player->armor),
                    256 + 30,
                    0,
                    window.makeColor(255, 255, 0));
  }

  window.drawText("Lives: " + std::to_string(player->lives),
                  256 + 48,
                  0,
                  window.makeColor(255, 255, 255));

  window.drawText(
      "Bonus: " +
          std::to_string(int(double(bonus) * (1.0 - bonusGauge.getPctFull()))),
      256 + 128,
      0,
      window.makeColor(255, 255, 255));
}

bool Game::menuLoop() {
  window.drawSprite("red", 0, 0, true, 0, std::make_pair(512.0, 1.2));
  window.drawSprite(
      "red", 0, GameOptions::height - 12, true, 0, std::make_pair(512.0, 1.2));

  window.globalAlpha = 128;
  window.drawSprite("red", 0, 0, true, 0, std::make_pair(1.2, 512.0));
  window.drawSprite(
      "red", GameOptions::width - 12, 0, true, 0, std::make_pair(1.2, 512.0));
  window.globalAlpha = 255;

  int titleX = GameOptions::width / 2;
  int titleY = GameOptions::height / 2 - 128;
  window.setCurrentFont("default", 72);
  window.drawTextCentered(GameOptions::programName,
                          titleX,
                          titleY,
                          window.makeColor(255, 255, 255));

  int startTextX = GameOptions::width / 2;
  int startTextY = GameOptions::height - GameOptions::height / 4;
  window.setCurrentFont("default", 36);
  window.drawTextCentered("Press button to start.",
                          startTextX,
                          startTextY,
                          window.makeColor(255, 255, 255));

  if (score) {
    int scoreTextX = GameOptions::width / 2;
    int scoreTextY = GameOptions::height - GameOptions::height / 3;
    window.setCurrentFont("default", 18);
    window.drawTextCentered("Last Score: " + std::to_string(score),
                            scoreTextX,
                            scoreTextY,
                            window.makeColor(255, 255, 255));
  }

  titleAnimation.update();
  window.drawAnimation(titleAnimation, 256, 256);

  return !shouldExit;
}

bool Game::gameLoop() {
  handleKeyUpdate();

  if (state == GAME_STATE_READY_TO_START || state == GAME_STATE_GAME) {
    int tileWidth = GameOptions::width / 32.0;
    int tileHeight = GameOptions::height / 32.0;
    for (int i = 0; i < tileHeight; i++) {
      for (int j = 0; j < tileWidth; j++) {
        unsigned int ind = background[i * tileWidth + j];
        window.drawSprite("stars_" + std::to_string(ind), j * 32, i * 32);
      }
    }
  }

  {
    auto& arr = blackHoles;
    for (unsigned int i = 0; i < arr.size(); i++) {
      auto& item = *arr[i];
      if (updateEntities) {
        item.update();
      }
      item.draw();
      if (item.shouldRemove()) {
        item.onRemove();
        arr.erase(arr.begin() + i);
        i--;
      }
    }
  }

  if (state == GAME_STATE_GAME || state == GAME_STATE_READY_TO_START) {
    if (updateEntities) {
      player->update();
    }
    player->draw();
  }

  {
    auto& arr = asteroids;
    for (unsigned int i = 0; i < arr.size(); i++) {
      auto& item = *arr[i];
      if (updateEntities) {
        item.update();
      }
      item.draw();
      if (item.shouldRemove()) {
        item.onRemove();
        arr.erase(arr.begin() + i);
        i--;
      }
    }
  }

  {
    auto& arr = enemies;
    for (unsigned int i = 0; i < arr.size(); i++) {
      auto& item = *arr[i];
      if (updateEntities) {
        item.update();
      }
      item.draw();
      if (item.shouldRemove()) {
        item.onRemove();
        arr.erase(arr.begin() + i);
        i--;
      }
    }
  }

  {
    auto& arr = powerups;
    for (unsigned int i = 0; i < arr.size(); i++) {
      auto& item = *arr[i];
      if (updateEntities) {
        item.update();
      }
      item.draw();
      if (item.shouldRemove()) {
        item.onRemove();
        arr.erase(arr.begin() + i);
        i--;
      }
    }
  }

  {
    auto& arr = projectiles;
    for (unsigned int i = 0; i < arr.size(); i++) {
      auto& item = *arr[i];
      if (updateEntities) {
        item.update();
      }
      item.draw();
      if (item.shouldRemove()) {
        item.onRemove();
        arr.erase(arr.begin() + i);
        i--;
      }
    }
  }

  if (state == GAME_STATE_READY_TO_START || state == GAME_STATE_GAME) {
    drawUI();
  }

  {
    auto& arr = particles;
    for (unsigned int i = 0; i < arr.size(); i++) {
      auto& item = *arr[i];
      item.update();
      item.draw();
      if (item.shouldRemove()) {
        item.onRemove();
        arr.erase(arr.begin() + i);
        i--;
      }
    }
  }

  if (!isTransitioning && updateEntities) {
    checkCollisions();
  }

  return !shouldExit;
}

bool Game::otherLoop() {
  if (state == GAME_STATE_READY_TO_START) {
    int titleX = GameOptions::width / 2;
    int titleY = GameOptions::height / 2 - 64;
    window.setCurrentFont("default", 16);
    window.drawTextCentered("Prepare for wave " + std::to_string(wave - 1),
                            titleX,
                            titleY,
                            window.makeColor(255, 255, 255));
    {
      int startTextX = GameOptions::width / 2;
      int startTextY = titleY + 64 + 64;
      window.setCurrentFont("default", 16);
      window.drawTextCentered("Press button to start.",
                              startTextX,
                              startTextY,
                              window.makeColor(255, 255, 255));
    }
  }

  if (state == GAME_STATE_WAVE_COMPLETED) {
    int titleX = GameOptions::width / 2;
    int titleY = GameOptions::height / 2 - 96;
    window.setCurrentFont("default", 16);
    window.drawTextCentered("Wave " + std::to_string(wave - 1) + " completed!",
                            titleX,
                            titleY,
                            window.makeColor(255, 255, 255));

    {
      int startTextX = GameOptions::width / 2;
      int startTextY = GameOptions::height / 2 - 32;
      window.setCurrentFont("default", 16);
      window.drawTextCentered("Score: " + std::to_string(score),
                              startTextX,
                              startTextY,
                              window.makeColor(255, 255, 0));
    }
    {
      int startTextX = GameOptions::width / 2 - 96;
      int startTextY = GameOptions::height / 2;
      window.setCurrentFont("default", 16);
      window.drawText("Diamonds: 2500x" + std::to_string(diamonds),
                      startTextX,
                      startTextY,
                      diamonds > 0 ? window.makeColor(255, 0, 0)
                                   : window.makeColor(255, 255, 255));
    }
    {
      int startTextX = GameOptions::width / 2 - 96;
      int startTextY = GameOptions::height / 2 + 32;
      window.setCurrentFont("default", 16);
      window.drawText("Stars: Mult x" + std::to_string(1 + stars),
                      startTextX,
                      startTextY,
                      stars > 0 ? window.makeColor(255, 0, 0)
                                : window.makeColor(255, 255, 255));
    }
    {
      int startTextX = GameOptions::width / 2 - 96;
      int startTextY = GameOptions::height / 2 + 64;
      window.setCurrentFont("default", 16);
      window.drawText("Bonus: " + std::to_string(bonusAfterWaveCompleted),
                      startTextX,
                      startTextY,
                      bonus > 0 ? window.makeColor(255, 0, 0)
                                : window.makeColor(255, 255, 255));
    }
    if (!isTransitioning) {
      {
        int startTextX = GameOptions::width / 2;
        int startTextY = GameOptions::height / 2 + 128;
        window.setCurrentFont("default", 16);
        window.drawTextCentered("Press button to continue.",
                                startTextX,
                                startTextY,
                                window.makeColor(255, 255, 255));
      }
    }
  }

  if (state == GAME_STATE_GAME_OVER) {
    int titleX = GameOptions::width / 2;
    int titleY = GameOptions::height / 2 - 64;
    window.setCurrentFont("default", 36);
    window.drawTextCentered(
        "Game over.", titleX, titleY, window.makeColor(255, 255, 255));

    {
      int startTextX = GameOptions::width / 2;
      int startTextY = titleY + 64;
      window.setCurrentFont("default", 16);
      window.drawTextCentered("Score: " + std::to_string(score),
                              startTextX,
                              startTextY,
                              window.makeColor(255, 255, 0));
    }

    {
      int startTextX = GameOptions::width / 2;
      int startTextY = titleY + 128;
      window.setCurrentFont("default", 16);
      window.drawTextCentered("Press button to continue.",
                              startTextX,
                              startTextY,
                              window.makeColor(255, 255, 250));
    }
  }

  return !shouldExit;
}

bool Game::loop() {
  window.setBackgroundColor(window.makeColor(0, 0, 0));

  if (shouldClearTimers) {
    timers.clear();
  }

  for (unsigned int i = 0; i < timers.size(); i++) {
    SDL2Wrapper::Timer& timer = *timers[i];
    timer.update();
    if (timers.size() > 0 && timer.shouldRemove()) {
      timers.erase(timers.begin() + i);
      i--;
    }
  }

  if (clearEntitiesNextTick) {
    clearEntitiesNextTick = false;
    projectiles.clear();
    particles.clear();
    asteroids.clear();
    powerups.clear();
    enemies.clear();
    blackHoles.clear();
  }

  if (initWorldNextTick) {
    initWorldNextTick = false;
    initWorld();
  }

  // if (shouldPlayHiscoreSound) {
  //   shouldPlayHiscoreSound = false;
  // }

  bool ret = gameLoop();
  switch (state) {
  case GAME_STATE_GAME: {
    checkWaveCompleted();
    checkGameOver();
    if (!isTransitioning) {
      bonusGauge.fill();
    }
    break;
  }
  case GAME_STATE_MENU: {
    return menuLoop();
    break;
  }
  case GAME_STATE_READY_TO_START:
  case GAME_STATE_WAVE_COMPLETED:
  case GAME_STATE_GAME_OVER: {
    return otherLoop();
    break;
  }
  }
  // return gameLoop();
  return ret;
}
