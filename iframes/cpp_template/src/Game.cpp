#include "Game.h"
#include "Actor.h"
#include "GameOptions.h"

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
      window(windowA) {
  SDL2Wrapper::Store::createFont("default", "assets/monofonto.ttf");
  window.setCurrentFont("default", 18);

  this->width = floor(GameOptions::width / GameOptions::spriteSize);
  this->height = floor(GameOptions::height / GameOptions::spriteSize);

  SDL2Wrapper::loadAssetsFromFile("sprite", "assets/sprites.txt");
  SDL2Wrapper::loadAssetsFromFile("animation", "assets/anims.txt");
  SDL2Wrapper::loadAssetsFromFile("sound", "assets/sounds.txt");

  SDL2Wrapper::Events& events = window.getEvents();
  events.setKeyboardEvent(
      "keydown", std::bind(&Game::handleKeyDown, this, std::placeholders::_1));

  // playerShip = std::make_unique<Ship>(*this, "goodShip", 0, 20);
  initPlayer();
  initWorld();
  enableMenu();
}

Game::~Game() {}

void Game::initPlayer() {}

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
}

void Game::enableMenu() {
  shouldDrawMenu = true;
  SDL2Wrapper::Events& events = window.getEvents();
  events.pushRoute();
  events.setKeyboardEvent(
      "keydown", std::bind(&Game::handleKeyMenu, this, std::placeholders::_1));
  // window.playMusic("menu");
}

void Game::disableMenu() {
  shouldDrawMenu = false;
  SDL2Wrapper::Events& events = window.getEvents();
  events.popRouteNextTick();
  window.stopMusic();
  // window.playSound("begin");
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
  } else if (events.isKeyPressed("Right")) {
  } else {
  }

  if (events.isKeyPressed("Space")) {
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

bool Game::collidesWith(Actor& a, const Actor& b) {
  float d = distance(a.x, a.y, b.x, b.y);
  if (d < a.r + b.r) {
    return true;
  }
  return false;
}

void Game::checkCollisions() {
  // for (auto it = projectiles.begin(); it != projectiles.end(); ++it)
  // {
  // 	Projectile &proj = **it;
  // 	if (collidesWith(a, proj))
  // 	{
  // 		a.onCollision(proj);
  // 		proj.onCollision(a);
  // 	}
  // }
}

void Game::checkGameOver() {
  // if (isGameOver)
  // {
  // 	window.playSound("end");
  // 	addBoolTimer(60, shouldPlayHiscoreSound);
  // 	enableMenu();
  // }
}

void Game::addBoolTimer(const int maxFrames, bool& ref) {
  timers.push_back(
      std::make_unique<SDL2Wrapper::BoolTimer>(window, maxFrames, ref));
}

void Game::drawMenu() {
  int titleX = GameOptions::width / 2;
  int titleY = GameOptions::height / 2;
  window.setCurrentFont("default", 72);
  window.drawTextCentered(
      "Bounce Paddle", titleX, titleY, window.makeColor(255, 255, 255));

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
  window.drawText("Score: " + std::to_string(score),
                  hpX - 24,
                  32,
                  window.makeColor(255, 255, 255));
}

bool Game::menuLoop() {
  drawMenu();
  return !shouldExit;
}

bool Game::gameLoop() {
  handleKeyUpdate();

  // checkCollisions(*playerShip);
  drawUI();
  checkGameOver();

  return !shouldExit;
}

bool Game::loop() {
  for (unsigned int i = 0; i < timers.size(); i++) {
    SDL2Wrapper::Timer& timer = *timers[i];
    timer.update();
    if (timer.shouldRemove()) {
      timers.erase(timers.begin() + i);
      i--;
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
