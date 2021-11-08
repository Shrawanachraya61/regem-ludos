#include "Game.h"
#include "Actor.h"
#include "GameOptions.h"
#include "LibHTML.h"

#include "Particle.h"
#include "Physics.h"
#include "Player.h"

#include <algorithm>
#include <cctype>
#include <sstream>
#include <string>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/html5.h>
#endif

GameOptions::GameOptions() {}

GameWorld createGameWorld(Game &game) {
  GameWorld world;
  world.lives = 0;
  world.score = 0;
  world.player = std::make_unique<Player>(game);
  world.width = NUM_TILES_WIDE;
  world.height = NUM_TILES_TALL;
  for (int i = 0; i < NUM_TILES_WIDE * NUM_TILES_TALL; i++) {
    world.blockers[i] = 0;
  }
  return world;
}

Game::Game(SDL2Wrapper::Window &windowA)
    : shouldExit(false), shouldClearTimers(false), isTransitioning(false),
      world(createGameWorld(*this)), state(GAME_STATE_MENU), window(windowA) {

  // is this necessary?
  SDL2Wrapper::Events &events = window.getEvents();
  events.setKeyboardEvent(
      "keydown", std::bind(&Game::handleKeyDown, this, std::placeholders::_1));
  events.setKeyboardEvent(
      "keyup", std::bind(&Game::handleKeyUp, this, std::placeholders::_1));

  initWorld();
}

Game::~Game() {}

void Game::loadAssets(SDL2Wrapper::Window &windowA) {
  SDL2Wrapper::Store::createFont("default", "assets/monofonto.ttf");
  windowA.setCurrentFont("default", 18);
  SDL2Wrapper::loadAssetsFromFile("sprite", "assets/sprites.txt");
  SDL2Wrapper::loadAssetsFromFile("animation", "assets/anims.txt");
  SDL2Wrapper::loadAssetsFromFile("sound", "assets/sounds.txt");
}

void Game::setState(GameState stateA) {
  state = stateA;
  SDL2Wrapper::Events &events = window.getEvents();
  // events.popRouteNextTick();
  // events.pushRoute();
}

void Game::startNewGame() {
  world.lives = 3;
  world.score = 0;

  notifyGameStarted();
}

void Game::initWorld() {
  world.timers.clear();
  world.player->set(GameOptions::width / 2, GameOptions::height - 40);

  for (int i = 0; i < NUM_TILES_WIDE * NUM_TILES_TALL; i++) {
    int x = i % world.width;
    int y = i / world.height;

    if (y > 25 || y < 3 || x <= 0 ||
        x >= NUM_TILES_WIDE * TILE_WIDTH_PX - TILE_WIDTH_PX * 2) {
      world.blockers[i] = 0;
    } else {
      world.blockers[i] = rand() % 16 > 0 ? 0 : 1;
    }
  }
}

void Game::modifyScore(const int value) {
  world.score += value;
  if (world.score < 0) {
    world.score = 0;
  }
}

void Game::addBoolTimer(const int maxFrames, bool &ref) {
  world.timers.push_back(
      std::make_unique<SDL2Wrapper::BoolTimer>(window, maxFrames, ref));
}

void Game::addFuncTimer(const int maxFrames, std::function<void()> cb) {
  world.timers.push_back(
      std::make_unique<SDL2Wrapper::FuncTimer>(window, maxFrames, cb));
}

void Game::handleKeyDown(const std::string &key) {
  std::cout << "KEY: " << key << std::endl;

  if (key == "D") {
    initWorld();
  }
}

void Game::handleKeyUp(const std::string &key) {}

void Game::handleKeyUpdate() {
  const SDL2Wrapper::Events &events = window.getEvents();

  if (state != GAME_STATE_GAME) {
    return;
  }

  if (events.isKeyPressed("Left")) {

  } else if (events.isKeyPressed("Right")) {
  }
}

void Game::handleKeyMenu(const std::string &key) {
  if (!isTransitioning) {
    if (key == "Escape") {
      shouldExit = true;
    } else {
      window.stopMusic();
      startNewGame();
    }
  }
}

void Game::checkCollisions() {}

void Game::checkGameOver() {}

void Game::drawUI() {}

void Game::drawBlockers() {
  for (int i = 0; i < NUM_TILES_WIDE * NUM_TILES_TALL; i++) {
    int id = world.blockers[i];
    if (id) {
      int x = i % world.width;
      int y = i / world.height;
      window.drawSprite("blockers_0_" + std::to_string(id - 1),
                        x * TILE_WIDTH_PX - BLOCKER_PX_OFFSET,
                        y * TILE_HEIGHT_PX, false, 0,
                        std::make_pair(1, 1));
    }
  }
}

bool Game::menuLoop() { return !shouldExit; }

bool Game::gameLoop() {
  handleKeyUpdate();

  drawBlockers();

  // if (state == GAME_STATE_GAME || state == GAME_STATE_READY_TO_START) {
  //   if (updateEntities) {
  //     player->update();
  //   }
  //   player->draw();
  // }

  // {
  //   auto &arr = asteroids;
  //   for (unsigned int i = 0; i < arr.size(); i++) {
  //     auto &item = *arr[i];
  //     if (updateEntities) {
  //       item.update();
  //     }
  //     item.draw();
  //     if (item.shouldRemove()) {
  //       item.onRemove();
  //       arr.erase(arr.begin() + i);
  //       i--;
  //     }
  //   }
  // }

  // {
  //   auto &arr = particles;
  //   for (unsigned int i = 0; i < arr.size(); i++) {
  //     auto &item = *arr[i];
  //     item.update();
  //     item.draw();
  //     if (item.shouldRemove()) {
  //       item.onRemove();
  //       arr.erase(arr.begin() + i);
  //       i--;
  //     }
  //   }
  // }

  return !shouldExit;
}

bool Game::loop() {
  window.setBackgroundColor(window.makeColor(0, 0, 0));

  if (shouldClearTimers) {
    world.timers.clear();
  }

  for (unsigned int i = 0; i < world.timers.size(); i++) {
    SDL2Wrapper::Timer &timer = *(world.timers[i]);
    timer.update();
    if (world.timers.size() > 0 && timer.shouldRemove()) {
      world.timers.erase(world.timers.begin() + i);
      i--;
    }
  }

  bool ret = gameLoop();
  switch (state) {
  case GAME_STATE_GAME: {
    checkGameOver();
  }
  case GAME_STATE_MENU: {
    return menuLoop();
    break;
  } break;
  }
  return ret;
}
