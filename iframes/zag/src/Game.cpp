#include "Game.h"
#include "Actor.h"
#include "GameOptions.h"
#include "LibHTML.h"

#include "Particle.h"
#include "Physics.h"
#include "Player.h"
#include "Projectile.h"
#include "Train.h"

#include <algorithm>
#include <cctype>
#include <cstdlib>
#include <sstream>
#include <string>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/html5.h>
#endif

GameOptions::GameOptions() {}

GameWorld::GameWorld(Game& game) : player(std::make_unique<Player>(game)) {
  lives = 0;
  score = 0;
  width = NUM_TILES_WIDE;
  height = NUM_TILES_TALL;
  for (int i = 0; i < NUM_TILES_WIDE * NUM_TILES_TALL; i++) {
    tiles[i] = 0;
  }
}

GameWorld::~GameWorld() {}

std::unique_ptr<GameWorld> createGameWorldPtr(Game& game) {
  GameWorld* worldPtr = new GameWorld(game);
  return std::unique_ptr<GameWorld>(worldPtr);
}

void printArr(const int* arr, int len, int width) {
  for (int i = 0; i < len; i++) {
    if (i % width == 0) {
      std::cout << std::endl;
    }
    int id = arr[i];
    std::cout << i << ":" << id << " ";
  }
  std::cout << std::endl;
  for (int i = 0; i < len; i++) {
    int id = arr[i];
    if (id > 0) {
      std::cout << i << ":" << id << " ";
    }
  }
  std::cout << std::endl;
}

Game::Game(SDL2Wrapper::Window& windowA)
    : shouldExit(false),
      shouldClearTimers(false),
      isTransitioning(false),
      worldPtr(createGameWorldPtr(*this)),
      state(GAME_STATE_GAME),
      window(windowA) {
  SDL2Wrapper::Events& events = window.getEvents();
  events.setKeyboardEvent(
      "keydown", std::bind(&Game::handleKeyDown, this, std::placeholders::_1));
  events.setKeyboardEvent(
      "keyup", std::bind(&Game::handleKeyUp, this, std::placeholders::_1));

  initWorld();
}

Game::~Game() {}

void Game::loadAssets(SDL2Wrapper::Window& windowA) {
  SDL2Wrapper::Store::createFont("default", "assets/monofonto.ttf");
  windowA.setCurrentFont("default", 18);
  SDL2Wrapper::loadAssetsFromFile("sprite", "assets/sprites.txt");
  SDL2Wrapper::loadAssetsFromFile("animation", "assets/anims.txt");
  SDL2Wrapper::loadAssetsFromFile("sound", "assets/sounds.txt");
}

void Game::setState(GameState stateA) {
  state = stateA;
  SDL2Wrapper::Events& events = window.getEvents();
  // events.popRouteNextTick();
  // events.pushRoute();
}

const std::pair<int, int> Game::tileIndexToPx(int i) const {
  GameWorld& world = *worldPtr;
  int x = i % world.width;
  int y = i / world.width;
  int px = x * TILE_WIDTH_PX + BLOCKER_PX_OFFSET;
  int py = y * TILE_HEIGHT_PX;
  return std::make_pair(px, py);
}
int Game::pxToTileIndex(int x, int y) const {
  int tileX = (x - BLOCKER_PX_OFFSET) / TILE_WIDTH_PX;
  int tileY = y / TILE_HEIGHT_PX;
  int i = tileY * NUM_TILES_WIDE + tileX;
  if (i >= 0 && i < NUM_TILES_WIDE * NUM_TILES_TALL) {
    return i;
  }
  return 0;
}

void Game::startNewGame() {
  GameWorld& world = *worldPtr;
  world.lives = 3;
  world.score = 0;

  notifyGameStarted();
}

void Game::initWorld() {
  GameWorld& world = *worldPtr;
  world.timers.clear();
  world.trains.clear();
  world.player->set(GameOptions::width / 2, GameOptions::height - 40);

  for (int i = 0; i < NUM_TILES_WIDE * NUM_TILES_TALL; i++) {
    int x = i % world.width;
    int y = i / world.width;

    world.tiles[i] = 0;
    if (x == 10 && y == 20) {
      world.tiles[i] = 1;
    }

    if (y > 23 || y < 3 || x <= 0 ||
        x >= NUM_TILES_WIDE * TILE_WIDTH_PX - TILE_WIDTH_PX * 2) {
      world.tiles[i] = 0;
    } else {
      world.tiles[i] = rand() % 13 > 0 ? 0 : 1;
    }
  }

  // world.trains.push_back(
  //     std::make_unique<Train>(*this, 100, 8, true, RIGHT, 0, 3));

  {
    int startX = 210;
    int startY = TILE_HEIGHT_PX * 2 - TILE_HEIGHT_PX / 2;

    world.trains.push_back(std::make_unique<Train>(
        *this, startX, TILE_HEIGHT_PX * 2 - TILE_HEIGHT_PX / 2));
    Train& frontTrain = *(world.trains.back());
    frontTrain.setSpeed(1.0);
    frontTrain.setDirection(RIGHT);
    frontTrain.setVariant(0);
    frontTrain.setIsHead(true);

    Train* prevTrain = &frontTrain;

    for (int i = 1; i <= 2; i++) {
      world.trains.push_back(
          std::make_unique<Train>(*this,
                                  startX - TILE_WIDTH_PX * i,
                                  TILE_HEIGHT_PX * 2 - TILE_HEIGHT_PX / 2));
      Train& train = *(world.trains.back());
      train.setSpeed(1.0);
      train.setDirection(RIGHT);
      train.setVariant(0);
      train.setIsHead(false);

      prevTrain->child = &train;
      train.parent = prevTrain;
      prevTrain = &train;
    }
  }

  {
    int startX = 450;
    int startY = TILE_HEIGHT_PX * 2 - TILE_HEIGHT_PX / 2;

    world.trains.push_back(std::make_unique<Train>(
        *this, startX, TILE_HEIGHT_PX * 2 - TILE_HEIGHT_PX / 2));
    Train& frontTrain = *(world.trains.back());
    frontTrain.setSpeed(1.0);
    frontTrain.setDirection(LEFT);
    frontTrain.setVariant(0);
    frontTrain.setIsHead(true);

    //   Train* prevTrain = &frontTrain;

    //   for (int i = 1; i <= 1; i++) {
    //     world.trains.push_back(
    //         std::make_unique<Train>(*this,
    //                                 startX + TILE_WIDTH_PX * i,
    //                                 TILE_HEIGHT_PX * 2 - TILE_HEIGHT_PX /
    //                                 2));
    //     Train& train = *(world.trains.back());
    //     train.setSpeed(1.0);
    //     train.setDirection(LEFT);
    //     train.setVariant(0);
    //     train.setIsHead(false);

    //     prevTrain->child = &train;
    //     train.parent = prevTrain;
    //     prevTrain = &train;
    //   }
  }

  // Train* t = new Train(*this, 100, 8, true, RIGHT, 0, 3);
  // std::cout << "TRAIN?" << t->x << std::endl;
  // world.trains.push_back(std::unique_ptr<Train>(t));

  // printArr(world.tiles, NUM_TILES_WIDE * NUM_TILES_TALL, NUM_TILES_WIDE);
}

void Game::modifyScore(const int value) {
  GameWorld& world = *worldPtr;
  world.score += value;
  if (world.score < 0) {
    world.score = 0;
  }
}

void Game::addBoolTimer(const int maxFrames, bool& ref) {
  GameWorld& world = *worldPtr;
  world.timers.push_back(
      std::make_unique<SDL2Wrapper::BoolTimer>(window, maxFrames, ref));
}

void Game::addFuncTimer(const int maxFrames, std::function<void()> cb) {
  GameWorld& world = *worldPtr;
  world.timers.push_back(
      std::make_unique<SDL2Wrapper::FuncTimer>(window, maxFrames, cb));
}

void Game::handleKeyDown(const std::string& key) {
  std::cout << "KEY: " << key << std::endl;

  if (key == "D") {
    initWorld();
  }
}

void Game::handleKeyUp(const std::string& key) {}

void Game::handleKeyUpdate() {
  GameWorld& world = *worldPtr;
  const SDL2Wrapper::Events& events = window.getEvents();

  if (state != GAME_STATE_GAME) {
    return;
  }

  int ax = 0;
  int ay = 0;
  if (events.isKeyPressed("Left")) {
    ax = -world.player->accelerationRate;
  }
  if (events.isKeyPressed("Right")) {
    ax = world.player->accelerationRate;
  }
  if (events.isKeyPressed("Up")) {
    ay = -world.player->accelerationRate;
  }
  if (events.isKeyPressed("Down")) {
    ay = world.player->accelerationRate;
  }
  if (events.isKeyPressed("Space") && world.player->canFire) {
    world.projectiles.push_back(
        std::make_unique<Projectile>(*this, world.player->x, world.player->y));
    world.player->canFire = false;
  }

  world.player->ax = ax;
  world.player->ay = ay;
}

void Game::handleKeyMenu(const std::string& key) {
  if (!isTransitioning) {
    if (key == "Escape") {
      shouldExit = true;
    } else {
      window.stopMusic();
      startNewGame();
    }
  }
}

void Game::checkCollisions() {
  GameWorld& world = *worldPtr;

  // Projectile Train collision
  for (unsigned int i = 0; i < world.projectiles.size(); i++) {
    Projectile& projectile = *world.projectiles[i];
    const Rect projectileRect = Rect(projectile.x - 4, projectile.y - 6, 6, 12);
    for (unsigned int j = 0; j < world.trains.size(); j++) {
      Train& train = *world.trains[j];
      const Circle trainCircle = train.getCollisionCircle();
      if (collidesCircleRect(trainCircle, projectileRect) != "none") {
        train.handleCollision(projectile);
        projectile.handleCollision(train);
        break;
      }
    }
  }

  const Circle playerCircle = world.player->getCollisionCircle();

  for (int i = 0; i < NUM_TILES_WIDE * NUM_TILES_TALL; i++) {
    int tileVal = world.tiles[i];
    auto pair = tileIndexToPx(i);
    int x = pair.first;
    int y = pair.second;
    int width = TILE_WIDTH_PX;
    int height = TILE_HEIGHT_PX;
    const Rect rect = Rect(x, y, width, height);

    if (tileVal > 0 && tileVal < 5) {

      // Player Tile collision
      const std::string result = collidesCircleRect(playerCircle, rect);
      if (result != "none") {
        world.player->handleCollision(rect, result);
      }

      // Projectile Tile collision
      for (unsigned int j = 0; j < world.projectiles.size(); j++) {
        Projectile& projectile = *world.projectiles[j];
        if (projectile.shouldRemove()) {
          continue;
        }

        const Rect projectileRect =
            Rect(projectile.x - 1, projectile.y - 6, 2, 12);
        if (collidesRectRect(projectileRect, rect)) {
          projectile.handleCollision(rect);
        }
      }

      // Train Tile collision
      for (unsigned int j = 0; j < world.trains.size(); j++) {
        Train& train = *world.trains[j];
        if (train.shouldRemove()) {
          continue;
        }

        // ignore certain tiles
        if (std::find(train.turnIgnoreIds.begin(),
                      train.turnIgnoreIds.end(),
                      i) != train.turnIgnoreIds.end()) {
          continue;
        }

        Circle trainCircle = train.getCollisionCircle();
        trainCircle.r = 0.5;
        if (train.facing == LEFT) {
          trainCircle.x -= 8;
        } else {
          trainCircle.x += 8;
        }

        if (collidesCircleRect(trainCircle, rect) != "none") {
          train.handleCollision(rect);
        }
      }
    }

    // Train turnIds tile collision
    for (unsigned int j = 0; j < world.trains.size(); j++) {
      Train& train = *world.trains[j];
      if (train.shouldRemove()) {
        continue;
      }

      if (std::find(train.turnIds.begin(), train.turnIds.end(), i) !=
          train.turnIds.end()) {
        Circle trainCircle = train.getCollisionCircle();
        trainCircle.r = 0.5;
        if (train.facing == LEFT) {
          trainCircle.x -= 8;
        } else {
          trainCircle.x += 8;
        }

        if (collidesCircleRect(trainCircle, rect) != "none") {
          train.handleCollision(rect);
        }
        continue;
      }
    }
  }

  std::vector<Train*> usedTrains;

  for (unsigned int i = 0; i < world.trains.size(); i++) {
    Train& train1 = *world.trains[i];

    if (train1.shouldRemove() || !train1.isHead) {
      continue;
    }

    if (std::find(usedTrains.begin(), usedTrains.end(), &train1) !=
        usedTrains.end()) {
      continue;
    }

    Circle train1Circle = train1.getCollisionCircle();

    for (unsigned int j = 0; j < world.trains.size(); j++) {
      Train& train2 = *world.trains[j];
      if (i == j || train2.shouldRemove() || train1.isPartOfTrain(&train2)) {
        continue;
      }
      if (std::find(usedTrains.begin(), usedTrains.end(), &train2) !=
          usedTrains.end()) {
        continue;
      }

      Circle train2Circle = train2.getCollisionCircle();
      train2Circle.r = 0.5;
      if (train2.facing == LEFT) {
        train2Circle.x -= 16;
      } else {
        train2Circle.x += 16;
      }

      if (collidesCircleCircle(train2Circle, train1Circle)) {
        train1.handleCollision(train2);
        // usedTrains.push_back(&train1);
        // usedTrains.push_back(&train2);
      }
    }
  }

  for (unsigned int i = 0; i < world.trains.size(); i++) {
    Train& train = *world.trains[i];
    if (train.parent != nullptr && !train.isMovingDownOrUp()) {
      int dx = abs(train.x - train.parent->x);
      if (abs(dx - TILE_WIDTH_PX) > 1) {
        std::cout << "Correct train! " << dx << std::endl;
        train.x = train.parent->x - TILE_WIDTH_PX;
        if (train.facing == LEFT) {
          train.x = train.parent->x + TILE_WIDTH_PX;
        }
      }
    }
  }
}

void Game::checkGameOver() {}

void Game::drawUI() {}

bool Game::menuLoop() { return !shouldExit; }

bool Game::gameLoop() {
  GameWorld& world = *worldPtr;
  handleKeyUpdate();

  for (int i = 0; i < NUM_TILES_WIDE * NUM_TILES_TALL; i++) {
    int id = world.tiles[i];
    if (id > 0 && id < 5) {
      auto pair = tileIndexToPx(i);
      window.drawSprite("blockers_0_" + std::to_string(id - 1),
                        pair.first,
                        pair.second,
                        false,
                        0,
                        std::make_pair(1, 1));
    }
  }

  world.player->update();
  world.player->draw();

  {
    auto& arr = world.projectiles;
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
  {
    auto& arr = world.trains;
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

  checkCollisions();

  return !shouldExit;
}

bool Game::loop() {
  GameWorld& world = *worldPtr;
  window.setBackgroundColor(window.makeColor(0, 0, 0));

  if (shouldClearTimers) {
    world.timers.clear();
  }

  for (unsigned int i = 0; i < world.timers.size(); i++) {
    SDL2Wrapper::Timer& timer = *(world.timers[i]);
    timer.update();
    if (world.timers.size() > 0 && timer.shouldRemove()) {
      world.timers.erase(world.timers.begin() + i);
      i--;
    }
  }

  bool ret = gameLoop();
  switch (state) {
  case GAME_STATE_GAME: {
    handleKeyUpdate();
    checkGameOver();
  }
  case GAME_STATE_MENU: {
    return menuLoop();
    break;
  } break;
  }
  return ret;
}
