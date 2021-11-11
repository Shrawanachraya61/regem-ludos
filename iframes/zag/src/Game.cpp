#include "Game.h"
#include "Actor.h"
#include "GameOptions.h"
#include "LibHTML.h"

#include "Bomber.h"
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
      isGameOver(false),
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
  initRound();
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

  std::cout << "SET GAME STATE: " << state << std::endl;

  if (state == GAME_STATE_MENU) {
    events.pushRoute();
    events.setKeyboardEvent(
        "keydown",
        std::bind(&Game::handleKeyMenu, this, std::placeholders::_1));
  } else if (state == GAME_STATE_GAME) {
    events.popRouteNextTick();
  }

  // events.popRouteNextTick();
  // events.pushRoute();
}

const std::pair<int, int> Game::tileIndexToPx(int i) const {
  GameWorld& world = *worldPtr;
  int x = i % world.width;
  int y = i / world.width;
  int px = x * TILE_WIDTH_PX + BLOCKER_PX_OFFSET;
  int py = y * TILE_HEIGHT_PX + BLOCKER_PY_OFFSET;
  return std::make_pair(px, py);
}
int Game::pxToTileIndex(int x, int y) const {
  int tileX = (x - BLOCKER_PX_OFFSET) / TILE_WIDTH_PX;
  int tileY = (y - BLOCKER_PY_OFFSET) / TILE_HEIGHT_PX;
  int i = tileY * NUM_TILES_WIDE + tileX;
  if (i >= 0 && i < NUM_TILES_WIDE * NUM_TILES_TALL) {
    return i;
  }
  return 0;
}

void Game::startNewGame() {
  GameWorld& world = *worldPtr;
  world.lives = 2;
  world.score = 0;
  world.round = 0;
  world.player->isDead = false;

  initWorld();
  initRound();

  notifyGameStarted();
}

void Game::initWorld() {
  GameWorld& world = *worldPtr;
  world.timers.clear();
  world.trains.clear();
  world.projectiles.clear();
  world.player->set(GameOptions::width / 2, GameOptions::height - 40);

  for (int i = 0; i < NUM_TILES_WIDE * NUM_TILES_TALL; i++) {
    int x = i % world.width;
    int y = i / world.width;

    world.tiles[i] = 0;
    if (x == 10 && y == 20) {
      world.tiles[i] = 1;
    }

    // if (x == 15 && y == 1) {
    //   world.tiles[i] = 1;
    // }

    if (y > 23 || y < 3 || x <= 0 ||
        x >= NUM_TILES_WIDE * TILE_WIDTH_PX - TILE_WIDTH_PX * 2) {
      world.tiles[i] = 0;
    } else {
      world.tiles[i] = rand() % 11 > 0 ? 0 : 1;
    }
  }

  // world.trains.push_back(
  //     std::make_unique<Train>(*this, 100, 8, true, RIGHT, 0, 3));
}

void Game::initRound() {
  GameWorld& world = *worldPtr;
  world.trains.clear();
  world.player->isDead = false;
  isSpawningBomber = false;
  isSpawningFront = false;
  int speed = 3.5 + world.round * 0.25;

  world.tiles[17] = 1;

  {
    int startX = 300;
    int startY = TILE_HEIGHT_PX * 0 - TILE_HEIGHT_PX / 2 + BLOCKER_PY_OFFSET;

    world.trains.push_back(std::make_unique<Train>(*this, startX, startY));
    Train& frontTrain = *(world.trains.back());
    frontTrain.setSpeed(speed);
    frontTrain.setDirection(RIGHT);
    frontTrain.setVariant(0);
    frontTrain.setIsHead(true);

    Train* prevTrain = &frontTrain;

    int numTrainsSolo = world.round % 12;
    int trainLength = 12 - numTrainsSolo;

    for (int i = 1; i <= trainLength; i++) {
      world.trains.push_back(
          std::make_unique<Train>(*this, startX - TILE_WIDTH_PX * i, startY));
      Train& train = *(world.trains.back());
      train.setSpeed(speed);
      train.setDirection(RIGHT);
      train.setVariant(0);
      train.setIsHead(false);

      prevTrain->child = &train;
      train.parent = prevTrain;
      prevTrain = &train;
    }
    for (int i = 0; i < numTrainsSolo; i++) {
      // world.trains.push_back(std::make_unique<Train>(
      //     *this,
      //     32 + rand() % 450,
      //     (rand() % 3) * TILE_HEIGHT_PX - BLOCKER_PY_OFFSET));
      // Train& frontTrain = *(world.trains.back());
      // frontTrain.setSpeed(speed);
      // frontTrain.setDirection(rand() % 2 ? LEFT : RIGHT);
      // frontTrain.setVariant(0);
      // frontTrain.setIsHead(true);
      spawnFront(true);
    }
  }

  // world.bombers.push_back(std::make_unique<Bomber>(*this, 0, 512 - 114));

  // {
  //   int startX = 450;
  //   int startY = TILE_HEIGHT_PX * 3 - TILE_HEIGHT_PX / 2;

  //   world.trains.push_back(std::make_unique<Train>(*this, startX, startY));
  //   Train& frontTrain = *(world.trains.back());
  //   frontTrain.setSpeed(speed);
  //   frontTrain.setDirection(LEFT);
  //   frontTrain.setVariant(0);
  //   frontTrain.setIsHead(true);

  //   Train* prevTrain = &frontTrain;

  //   for (int i = 1; i <= 2; i++) {
  //     world.trains.push_back(
  //         std::make_unique<Train>(*this, startX + TILE_WIDTH_PX * i,
  //         startY));
  //     Train& train = *(world.trains.back());
  //     train.setSpeed(speed);
  //     train.setDirection(LEFT);
  //     train.setVariant(0);
  //     train.setIsHead(false);

  //     prevTrain->child = &train;
  //     train.parent = prevTrain;
  //     prevTrain = &train;
  //   }
  // }
}

void Game::spawnBomber() {
  if (rand() % 10 <= 4) {
    worldPtr->bombers.push_back(
        std::make_unique<Bomber>(*this, 512, 512 - 114 + (rand() % 50)));
  } else {
    worldPtr->bombers.push_back(
        std::make_unique<Bomber>(*this, 0, 512 - 114 + (rand() % 50)));
  }
}

void Game::spawnFront(bool init) {
  GameWorld& world = *worldPtr;
  int speed = 3.5 + world.round * 0.25 + 0.75;

  int y =
      (init ? ((rand() % 3) * TILE_HEIGHT_PX + BLOCKER_PY_OFFSET) : 512 - 114) +
      8;

  if (rand() % 10 <= 4) {
    world.trains.push_back(std::make_unique<Train>(*this, 512, y));
    Train& frontTrain = *(world.trains.back());
    frontTrain.setSpeed(speed);
    frontTrain.setDirection(LEFT);
    frontTrain.setVariant(0);
    frontTrain.setIsHead(true);
  } else {
    world.trains.push_back(std::make_unique<Train>(*this, 0, y));
    Train& frontTrain = *(world.trains.back());
    frontTrain.setSpeed(speed);
    frontTrain.setDirection(RIGHT);
    frontTrain.setVariant(0);
    frontTrain.setIsHead(true);
  }
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
  // std::cout << "KEY: " << key << std::endl;
}

void Game::handleKeyUp(const std::string& key) {}

void Game::handleKeyUpdate() {
  GameWorld& world = *worldPtr;
  const SDL2Wrapper::Events& events = window.getEvents();

  if (state != GAME_STATE_GAME) {
    return;
  }

  if (world.player->isDead) {
    return;
  }

  double ax = 0;
  double ay = 0;
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
    world.projectiles.push_back(std::make_unique<Projectile>(
        *this, world.player->x, world.player->y, PLAYER));
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
      setState(GAME_STATE_GAME);
      startNewGame();
    }
  }
}

void Game::checkCollisions() {
  GameWorld& world = *worldPtr;

  // Projectile Train/Bomber/Player collision
  for (unsigned int i = 0; i < world.projectiles.size(); i++) {
    Projectile& projectile = *world.projectiles[i];
    const Rect projectileRect = Rect(projectile.x - 4, projectile.y - 6, 6, 12);

    if (!projectile.collisionEnabled) {
      continue;
    }

    for (unsigned int j = 0; j < world.trains.size(); j++) {
      Train& train = *world.trains[j];
      const Circle trainCircle = train.getCollisionCircle();
      if (collidesCircleRect(trainCircle, projectileRect) != "none") {
        train.handleCollision(projectile);
        projectile.handleCollision(train);
        break;
      }
    }
    if (projectile.shouldRemove()) {
      continue;
    }

    for (unsigned int j = 0; j < world.bombers.size(); j++) {
      Bomber& bomber = *world.bombers[j];
      const Circle bomberCircle = bomber.getCollisionCircle();
      if (collidesCircleRect(bomberCircle, projectileRect) != "none") {
        bomber.handleCollision(projectile);
        projectile.handleCollision(bomber);
        break;
      }
    }

    Player& player = *world.player;
    const Circle projectileCircle = projectile.getCollisionCircle();
    const Circle playerCircle = player.getCollisionCircle();
    if (collidesCircleCircle(playerCircle, projectileCircle)) {
      player.handleCollision(projectile);
      projectile.handleCollision(player);
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

        if (projectile.type == PLAYER) {
          const Rect projectileRect =
              Rect(projectile.x - 1, projectile.y - 6, 2, 12);
          if (collidesRectRect(projectileRect, rect)) {
            projectile.handleCollision(rect);
          }
        } else {
          const Circle projectileCircle = projectile.getCollisionCircle();
          if (collidesCircleRect(projectileCircle, rect) != "none") {
            projectile.handleCollision(rect);
          }
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

      // Bomber tile+player collision
      for (unsigned int j = 0; j < world.bombers.size(); j++) {
        Bomber& bomber = *world.bombers[j];
        if (bomber.shouldRemove()) {
          continue;
        }

        Circle bomberCircle = bomber.getCollisionCircle();

        if (collidesCircleRect(bomberCircle, rect) != "none") {
          bomber.handleCollision(rect);
        }

        Player& player = *world.player;
        const Circle playerCircle = player.getCollisionCircle();
        if (collidesCircleCircle(playerCircle, bomberCircle)) {
          player.handleCollision(bomber);
          bomber.handleCollision(player);
          continue;
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

  // trains colliding with other trains and Player
  for (unsigned int i = 0; i < world.trains.size(); i++) {
    Train& train1 = *world.trains[i];
    Circle train1Circle = train1.getCollisionCircle();

    Player& player = *world.player;
    const Circle playerCircle = player.getCollisionCircle();
    if (collidesCircleCircle(playerCircle, train1Circle)) {
      player.handleCollision(train1);
      train1.handleCollision(player);
      continue;
    }

    if (train1.shouldRemove() || !train1.isHead) {
      continue;
    }

    if (std::find(usedTrains.begin(), usedTrains.end(), &train1) !=
        usedTrains.end()) {
      continue;
    }

    for (unsigned int j = 0; j < world.trains.size(); j++) {
      Train& train2 = *world.trains[j];
      if (i == j || train2.shouldRemove() || train1.isPartOfTrain(&train2)) {
        continue;
      }
      if (std::find(usedTrains.begin(), usedTrains.end(), &train2) !=
          usedTrains.end()) {
        continue;
      }
      if (train1.isHead && train2.isHead && train1.facing == train2.facing) {
        continue;
      }

      Circle train2Circle = train2.getCollisionCircle();
      train2Circle.r = 0.5;
      if (train2.facing == LEFT) {
        train2Circle.x -= 8;
      } else {
        train2Circle.x += 8;
      }

      if (collidesCircleCircle(train2Circle, train1Circle)) {
        train1.handleCollision(train2);
        train2.handleCollision(train1);
        usedTrains.push_back(&train1);
        usedTrains.push_back(&train2);
      }
    }
  }

  // trains with segments that are too far away should be corrected if they are
  // traveling on the same plane.
  for (unsigned int i = 0; i < world.trains.size(); i++) {
    Train& train = *world.trains[i];
    if (train.child == nullptr) {
      continue;
    }
    Train& trainChild = *train.child;

    if (train.isMovingDownOrUp() || trainChild.isMovingDownOrUp() ||
        train.facing != trainChild.facing) {
      continue;
    }

    int dx = abs(train.x - train.child->x);
    if (abs(dx - TILE_WIDTH_PX) > 1) {
      trainChild.x = trainChild.prevX = train.x - TILE_WIDTH_PX;
      if (train.facing == LEFT) {
        trainChild.x = trainChild.prevX = train.x + TILE_WIDTH_PX;
      }
      if (trainChild.x < TILE_WIDTH_PX / 2) {
        trainChild.x = TILE_WIDTH_PX / 2;
      } else if (trainChild.x > 512 - TILE_WIDTH_PX / 2) {
        trainChild.x = 512 - TILE_WIDTH_PX / 2;
      }
    }
  }
}

// find first non-full blocker, fix it, wait some time, call this again, when
// done, stop transitioning
void Game::applyGameOver() {
  GameWorld& world = *worldPtr;
  bool foundSomething = false;
  for (int i = 0; i < NUM_TILES_WIDE * NUM_TILES_TALL; i++) {
    if (world.tiles[i] > 1 && world.tiles[i] < 5) {
      foundSomething = true;
      world.tiles[i] = 1;
      auto pair = tileIndexToPx(i);
      Particle::spawnParticle(*this,
                              pair.first + 11,
                              pair.second + 8,
                              PARTICLE_TYPE_ENTITY_EXPL,
                              50 * 4);
      break;
    }
  }

  if (foundSomething) {
    modifyScore(5);
    addFuncTimer(150, [=]() { applyGameOver(); });
  } else {
    if (world.lives > 0) {
      std::cout << "GAME NOT OVER LIVES: " << world.lives << std::endl;
      world.lives--;

      addFuncTimer(1000, [=]() {
        worldPtr->bombers.clear();
        worldPtr->projectiles.clear();
        initRound();
        isTransitioning = false;
      });
    } else {
      isGameOver = true;
      std::cout << "GAME OVER " << world.lives << std::endl;

      addFuncTimer(1000, [=]() {
        worldPtr->bombers.clear();
        worldPtr->projectiles.clear();
        isGameOver = false;
        isTransitioning = false;
        worldPtr->lastScore = worldPtr->score;
        setState(GAME_STATE_MENU);
      });
    }
  }
}

void Game::checkGameOver() {
  if (isTransitioning) {
    return;
  }

  if (worldPtr->player->isDead) {
    isTransitioning = true;
    worldPtr->timers.clear();
    applyGameOver();
  }
}

void Game::checkNextRound() {
  GameWorld& world = *worldPtr;
  if (isTransitioning) {
    return;
  }

  if (world.trains.size() == 0) {
    std::cout << "------------------NEXT ROUND" << std::endl;
    worldPtr->timers.clear();
    isTransitioning = true;
    addFuncTimer(1000, [=] {
      GameWorld& world = *worldPtr;
      world.round++;
      initRound();
      isTransitioning = false;
    });
  }
}

void Game::drawUI() {
  window.drawSprite("score_area_0", 0, 0, false);

  window.setCurrentFont("default", 16);
  window.drawTextCentered(std::to_string(worldPtr->score),
                          512 / 2,
                          8,
                          window.makeColor(248, 248, 248));

  window.setCurrentFont("default", 16);
  window.drawText("Lives:", 4, 0, window.makeColor(248, 248, 248));

  for (int i = 0; i < worldPtr->lives; i++) {
    window.drawSprite("player_wait_0", 60 + i * 24, 2, false);
  }

  window.setCurrentFont("default", 16);
  window.drawText("Round: " + std::to_string(worldPtr->round + 1),
                  512 - 100,
                  0,
                  window.makeColor(248, 248, 248));
}

bool Game::menuLoop() {
  window.setCurrentFont("default", 72);
  window.drawTextCentered(
      "Zag", 512 / 2, 512 / 2, window.makeColor(248, 248, 248));

  window.setCurrentFont("default", 18);
  window.drawTextCentered("Press button to start.",
                          512 / 2,
                          512 / 2 + 512 / 4,
                          window.makeColor(248, 248, 248));

  if (worldPtr->lastScore > 0) {
    window.setCurrentFont("default", 18);
    window.drawTextCentered("Last score: " +
                                std::to_string(worldPtr->lastScore),
                            512 / 2,
                            512 / 2 - 512 / 4,
                            window.makeColor(182, 213, 60));
  }
  return !shouldExit;
}

bool Game::gameLoop() {
  GameWorld& world = *worldPtr;
  handleKeyUpdate();

  window.drawSprite("player_area_0", 0, 512 - 114, false);

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
      if (!isTransitioning) {
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
    auto& arr = world.trains;
    for (unsigned int i = 0; i < arr.size(); i++) {
      auto& item = *arr[i];
      if (!isTransitioning) {
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
    auto& arr = world.bombers;
    for (unsigned int i = 0; i < arr.size(); i++) {
      auto& item = *arr[i];
      if (!isTransitioning) {
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
    auto& arr = world.particles;
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

  drawUI();

  if (isGameOver && isTransitioning) {
    window.setCurrentFont("default", 36);
    window.drawTextCentered(
        "Game over.", 512 / 2, 512 / 2, window.makeColor(248, 248, 248));
  }

  if (!isTransitioning && !isSpawningBomber &&
      world.bombers.size() < (3 + world.round) / 3) {
    isSpawningBomber = true;
    addFuncTimer(100 + rand() % 8000, [=] {
      isSpawningBomber = false;
      spawnBomber();
    });
  }

  bool isFrontLowEnough = false;
  for (unsigned int i = 0; i < world.trains.size(); i++) {
    Train& train = *world.trains[i];
    if (train.y >= 512 - 114) {
      isFrontLowEnough = true;
      break;
    }
  }

  if (!isTransitioning && !isSpawningFront && world.trains.size() < 12 &&
      isFrontLowEnough) {
    isSpawningFront = true;
    addFuncTimer(5000, [=] {
      isSpawningFront = false;
      spawnFront();
    });
  }

  checkCollisions();
  checkNextRound();
  checkGameOver();

  return !shouldExit;
}

bool Game::loop() {
  GameWorld& world = *worldPtr;
  window.setBackgroundColor(window.makeColor(16, 30, 41));

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

  if (state == GAME_STATE_GAME) {
    return gameLoop();
  } else if (state == GAME_STATE_MENU) {
    return menuLoop();
  }
  return false;
}
