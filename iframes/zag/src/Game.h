#pragma once

#include "SDL2Wrapper.h"

#include <memory>
#include <string>
#include <vector>

class Actor;
class Player;
class Circle;
class Rect;
class Particle;

enum GameState {
  GAME_STATE_MENU,
  GAME_STATE_GAME,
  GAME_STATE_DIED,
  GAME_STATE_GAME_OVER
};

#define NUM_TILES_WIDE (512 / 22)
#define NUM_TILES_TALL (512 / 16)
#define TILE_WIDTH_PX 22
#define TILE_HEIGHT_PX 16
#define BLOCKER_PX_OFFSET -4

struct GameWorld {
  int score;
  int lives;
  int width;
  int height;
  int blockers[NUM_TILES_WIDE * NUM_TILES_TALL];
  std::unique_ptr<Player> player;
  std::vector<std::unique_ptr<SDL2Wrapper::Timer>> timers;
  std::vector<std::unique_ptr<Particle>> particles;
};

class Game {
  bool shouldExit;
  bool shouldClearTimers;

public:
  bool isTransitioning;
  GameWorld world;
  GameState state;
  SDL2Wrapper::Window &window;

  Game(SDL2Wrapper::Window &windowA);
  ~Game();

  static void loadAssets(SDL2Wrapper::Window &windowA);

  void initWorld();

  void startNewGame();
  std::vector<int> generateBackgroundRow();

  void setState(GameState stateA);

  void addBoolTimer(const int maxFrames, bool &ref);
  void addFuncTimer(const int maxFrames, std::function<void()> cb);
  void addPowerup(int x, int y, const std::string &type);
  void modifyScore(const int value);
  void handleKeyDown(const std::string &key);
  void handleKeyUp(const std::string &key);
  void handleKeyUpdate();
  void handleKeyMenu(const std::string &key);
  void handleKeyGameOver(const std::string &key);
  void handleGameOver();
  void checkCollisions();
  void checkGameOver();
  void drawUI();
  void drawBlockers();
  bool menuLoop();
  bool gameLoop();
  bool otherLoop();
  bool loop();
};
