#include "Game.h"
#include "Actor.h"
#include "GameOptions.h"
#include "Projectile.h"
#include "Ship.h"

#include <algorithm>
#include <cctype>
#include <string>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/html5.h>
#endif

const int GameOptions::width = 512;
const int GameOptions::height = 512;
const int GameOptions::spriteSize = 32;
const int GameOptions::playerSpeed = 3;
const int GameOptions::playerProjDamage = 1;
const int GameOptions::playerProjSpeed = 5;
const int GameOptions::playerFireCooldown = 20;
const int GameOptions::playerShipHP = 20;
const int GameOptions::enemyShipHP = 2;
const int GameOptions::enemyFireRate = 3000;
const int GameOptions::enemyShipMaxSpeed = 4;
const int GameOptions::enemyProjDamage = 1;
const int GameOptions::enemyProjSpeed = 3;
const int GameOptions::enemyProjDamage2 = 2;
const int GameOptions::enemyProjSpeed2 = 5;
const int GameOptions::shipCollideDamage = 3;
const int GameOptions::pointsPerDestroyedShip = 100;
const int GameOptions::pointsPerDestroyedShip2 = 1000;
const int GameOptions::pointsLostPerShot = 1;
GameOptions::GameOptions() {}

float distance(const int x1, const int y1, const int x2, const int y2) {
  return sqrt(pow(x2 - x1, 2) + pow(y2 - y1, 2));
}

Game::Game(SDL2Wrapper::Window& windowA)
    : shouldDrawMenu(true),
      shouldExit(false),
      shouldPlayHiscoreSound(false),
      score(0),
      lastScore(0),
      window(windowA),
      playerMayFire(true),
      enemyFireRate(GameOptions::enemyFireRate) {
  SDL2Wrapper::Store::createFont("default", "assets/monofonto.ttf");
  window.setCurrentFont("default", 18);

  this->width = floor(GameOptions::width / GameOptions::spriteSize);
  this->height = floor(GameOptions::height / GameOptions::spriteSize);

  SDL2Wrapper::loadAssetsFromFile("sprite", "assets/invaderzSpriteAssets.txt");
  SDL2Wrapper::loadAssetsFromFile("animation", "assets/invaderzAnimAssets.txt");
  SDL2Wrapper::loadAssetsFromFile("sound", "assets/invaderzSoundAssets.txt");

  SDL2Wrapper::Events& events = window.getEvents();
  events.setKeyboardEvent(
      "keydown", std::bind(&Game::handleKeyDown, this, std::placeholders::_1));

  playerShip = std::make_unique<Ship>(*this, "goodShip", 0, 20);
  initPlayer();
  initWorld();
}

Game::~Game() {}

void Game::initPlayer() {
  playerShip->set(GameOptions::width / 2,
                  GameOptions::height - GameOptions::spriteSize * 2);
  playerShip->hp = GameOptions::playerShipHP;
  playerShip->setAnimState("default");
  playerMayFire = true;
}

void Game::initWorld() {
  score = 0;
  if (!background.size()) {
    for (int i = 0; i < height; i++) {
      for (int j = 0; j < width; j++) {
        const int id = rand() % 3;
        background.push_back(id);
      }
    }
  }

  enemyShips.clear();
  spawnEnemyShips(2);
  projectiles.clear();
}

void Game::enableMenu() {
  shouldDrawMenu = true;
  SDL2Wrapper::Events& events = window.getEvents();
  events.pushRoute();
  events.setKeyboardEvent(
      "keydown", std::bind(&Game::handleKeyMenu, this, std::placeholders::_1));
  projectiles.clear();
  window.playMusic("menu");
}

void Game::disableMenu() {
  shouldDrawMenu = false;
  SDL2Wrapper::Events& events = window.getEvents();
  events.popRouteNextTick();
  window.stopMusic();
  window.playSound("begin");
}

void Game::spawnEnemyShips(const int amount) {
  for (int i = 0; i < amount; i++) {
    int x;
    int y;
    double vx;
    double vy;
    double r =
        static_cast<double>(1 + rand() % (GameOptions::enemyShipMaxSpeed * 2)) /
        2.0;
    if (i % 2) {
      x = width;
      vx = -r;
    } else {
      x = 0;
      vx = r;
    }
    y = rand() % (GameOptions::height / 2);
    vy = GameOptions::enemyShipMaxSpeed -
         rand() % (2 * GameOptions::enemyShipMaxSpeed);
    enemyShips.push_back(
        std::make_unique<Ship>(*this, "badShip", 1, GameOptions::enemyShipHP));
    std::unique_ptr<Ship>& ship = enemyShips.back();
    ship->set(static_cast<double>(x), static_cast<double>(y));
    ship->setV(static_cast<double>(vx), static_cast<double>(vy));
  }
}

void Game::addProjectile(const std::string& type, const int x, const int y) {
  if (type == "good") {
    projectiles.push_back(
        std::make_unique<Projectile>(*this,
                                     "goodLazer",
                                     0,
                                     GameOptions::playerProjSpeed,
                                     GameOptions::playerProjDamage));
    projectiles.back()->set(x, y);
    window.playSound("lazer");
  } else if (type == "bad") {
    projectiles.push_back(
        std::make_unique<Projectile>(*this,
                                     "badLazer",
                                     1,
                                     GameOptions::enemyProjSpeed,
                                     GameOptions::enemyProjDamage));
    projectiles.back()->set(x, y);
    window.playSound("lazer2");
  } else if (type == "bad2") {
    projectiles.push_back(
        std::make_unique<Projectile>(*this,
                                     "badLazer2",
                                     1,
                                     GameOptions::enemyProjSpeed2,
                                     GameOptions::enemyProjDamage2));
    projectiles.back()->set(x, y);
  }
}

void Game::modifyScore(const int value) {
  if (shouldDrawMenu) {
    return;
  }
  score += value;
  if (score < 0) {
    score = 0;
  }
}

void Game::handleKeyDown(const std::string& key) {}

void Game::handleKeyUp(const std::string& key) {}

void Game::handleKeyUpdate() {
  const SDL2Wrapper::Events& events = window.getEvents();
  if (events.isKeyPressed("Left")) {
    playerShip->setVx(-GameOptions::playerSpeed);
  } else if (events.isKeyPressed("Right")) {
    playerShip->setVx(GameOptions::playerSpeed);
  } else {
    playerShip->setVx(0.0);
  }

  if (events.isKeyPressed("Space")) {
    if (playerMayFire) {
      playerMayFire = false;
      addProjectile(
          "good", playerShip->x, playerShip->y - GameOptions::spriteSize / 2);
      playerShip->addBoolTimer(GameOptions::playerFireCooldown, playerMayFire);
      modifyScore(-GameOptions::pointsLostPerShot);
    }
  }
}

void Game::handleKeyMenu(const std::string& key) {
  if (key == "Return") {
    initPlayer();
    initWorld();
    disableMenu();
  }
  if (key == "Escape") {
    shouldExit = true;
  }
}

bool Game::collidesWith(Actor& a, Actor& b) {
  float d = distance(a.x, a.y, b.x, b.y);
  if (d < a.r + b.r) {
    return true;
  }
  return false;
}

void Game::checkCollisions(Ship& a) {
  if (&a == playerShip.get()) {
    for (auto it = enemyShips.begin(); it != enemyShips.end(); ++it) {
      Ship& ship = **it;
      if (ship.isExploding()) {
        continue;
      }
      if (collidesWith(a, ship)) {
        a.onCollision(ship);
        ship.onCollision(a);
        break;
      }
    }
  }

  for (auto it = projectiles.begin(); it != projectiles.end(); ++it) {
    Projectile& proj = **it;
    if (collidesWith(a, proj)) {
      a.onCollision(proj);
      proj.onCollision(a);
    }
  }
}

void Game::checkGameOver() {
  if (playerShip->isExploding()) {
    window.playSound("end");
    addBoolTimer(60, shouldPlayHiscoreSound);
    enableMenu();
  }
}

void Game::addBoolTimer(const int maxFrames, bool& ref) {
  timers.push_back(std::make_unique<SDL2Wrapper::BoolTimer>(
      window, maxFrames * 13.333, ref));
}

void Game::drawMenu() {
  int titleX = GameOptions::width / 2;
  int titleY = GameOptions::height / 2;
  window.setCurrentFont("default", 72);
  window.drawTextCentered(
      "Invaderz", titleX, titleY, window.makeColor(255, 255, 255));

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
}

void Game::drawUI() {
  int hpX = GameOptions::spriteSize;
  int hpY = GameOptions::height - GameOptions::spriteSize;
  window.setCurrentFont("default", 20);
  window.drawText("HP ", hpX - 24, hpY, window.makeColor(255, 255, 255));
  for (int i = 0; i < playerShip->hp; i++) {
    window.drawSprite("healthBar_0", hpX + i * 12, hpY, false);
  }

  window.drawText("Score: " + std::to_string(score),
                  hpX - 24,
                  32,
                  window.makeColor(255, 255, 255));
}

void Game::drawStars() {
  if (background.size()) {
    const int numSpritesY = width;
    const int numSpritesX = height;
    for (int i = 0; i < numSpritesY; i++) {
      for (int j = 0; j < numSpritesX; j++) {
        int ind = i * numSpritesX + j;
        int x = j * GameOptions::spriteSize;
        int y = i * GameOptions::spriteSize;
        window.drawSprite(
            "starsBg_" + std::to_string(background[ind]), x, y, false);
      }
    }
  }
}

void Game::drawEnemyShips() {
  unsigned int sz = enemyShips.size();
  for (unsigned int i = 0; i < sz; i++) {
    Ship& ship = *enemyShips[i];
    ship.update();
    ship.draw();
    checkCollisions(ship);
    if (!shouldDrawMenu) {
      if (rand() % enemyFireRate == 1) {
        addProjectile("bad", ship.x, ship.y);
      }
    }

    if (ship.x <= 0.0 || ship.x >= static_cast<double>(GameOptions::width)) {
      ship.setVx(-ship.vx);
    }
    if (ship.y <= 0.0 || ship.y >= static_cast<double>(GameOptions::height)) {
      ship.setVy(-ship.vy);
    }
  }

  enemyShips.erase(std::remove_if(enemyShips.begin(),
                                  enemyShips.end(),
                                  [](const std::unique_ptr<Ship>& ship) {
                                    return ship->shouldRemove();
                                  }),
                   enemyShips.end());
}

void Game::drawProjectiles() {
  for (auto it = projectiles.begin(); it != projectiles.end(); ++it) {
    Projectile& proj = **it;
    proj.update();
    if (proj.shouldRemove()) {
      projectiles.erase(it--);
    } else {
      proj.draw();
    }
  }
}

bool Game::menuLoop() {
  drawStars();
  drawEnemyShips();
  drawMenu();
  return !shouldExit;
}

bool Game::gameLoop() {
  handleKeyUpdate();

  drawStars();

  playerShip->update();
  checkCollisions(*playerShip);
  playerShip->draw();

  drawEnemyShips();
  drawProjectiles();
  drawUI();

  checkGameOver();

  return !shouldExit;
}

bool Game::loop() {
  for (auto it = timers.begin(); it != timers.end(); ++it) {
    SDL2Wrapper::Timer& timer = **it;
    timer.update();
    if (timer.shouldRemove()) {
      timers.erase(it--);
    }
  }

  if (shouldPlayHiscoreSound) {
    shouldPlayHiscoreSound = false;
    window.playSound("hiscore");
#ifdef __EMSCRIPTEN__
    const std::string script = std::string("window.notifyHighScore(\"" +
                                           std::to_string(score) + "\")");
    emscripten_run_script(script.c_str());
#endif
  }

  if (shouldDrawMenu) {
    return menuLoop();
  } else {
    return gameLoop();
  }
}
