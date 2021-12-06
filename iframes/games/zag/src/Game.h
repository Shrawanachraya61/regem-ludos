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
class Projectile;
class Bomber;
class Airplane;
class Train;
class DuoMissile;
class Game;

enum GameState { GAME_STATE_MENU, GAME_STATE_GAME };

#define NUM_TILES_WIDE (512 / 22)
#define NUM_TILES_TALL (512 / 16)
#define TILE_WIDTH_PX 22
#define TILE_HEIGHT_PX 16
#define BLOCKER_PX_OFFSET -8
#define BLOCKER_PY_OFFSET -4

class GameWorld {
public:
  int score = 0;
  int nextHighScore = 15000;
  int lastScore = 0;
  int lives = 3;
  int width = 0;
  int height = 0;
  int round = 0;
  int variant = 0;
  int tiles[NUM_TILES_WIDE * NUM_TILES_TALL];
  int poisonTiles[NUM_TILES_WIDE * NUM_TILES_TALL];
  std::unique_ptr<Player> player;
  std::vector<std::unique_ptr<SDL2Wrapper::Timer>> timers;
  std::vector<std::unique_ptr<Particle>> particles;
  std::vector<std::unique_ptr<Projectile>> projectiles;
  std::vector<std::unique_ptr<Train>> trains;
  std::vector<std::unique_ptr<Bomber>> bombers;
  std::vector<std::unique_ptr<Airplane>> airplanes;
  std::vector<std::unique_ptr<DuoMissile>> missiles;

  GameWorld(Game& game);
  ~GameWorld();
};

class Game {
  bool shouldExit;
  bool shouldClearTimers;
  bool isGameOver;

  bool isSpawningBomber = false;
  bool isSpawningFront = false;
  bool isSpawningAirplane = false;
  bool isSpawningMissile = false;

  bool isSettingNextState = false;
  GameState nextState = GAME_STATE_MENU;

  bool initWorldNextTick = false;

public:
  bool isTransitioning;
  std::unique_ptr<GameWorld> worldPtr;
  GameState state;
  SDL2Wrapper::Window& window;

  Game(SDL2Wrapper::Window& windowA);
  ~Game();

  static void loadAssets(SDL2Wrapper::Window& windowA);

  void initWorld();
  void initRound();

  void spawnBomber();
  void spawnAirplane();
  void spawnMissile();
  void spawnStartingFronts();
  void spawnExtraFront();
  void startNewGame();
  void spawnBlocker(int i);
  bool isPoisoned(int i);

  void playSound(const std::string& soundName);
  void setState(GameState stateA);
  void setNextState(GameState stateA);

  const std::pair<int, int> tileIndexToPx(int i) const;
  int pxToTileIndex(int x, int y) const;

  void addBoolTimer(const int maxFrames, bool& ref);
  void addFuncTimer(const int maxFrames, std::function<void()> cb);
  void modifyScore(const int value);
  void handleKeyDown(const std::string& key);
  void handleKeyUp(const std::string& key);
  void handleKeyUpdate();
  void handleKeyMenu(const std::string& key);
  void handleKeyGameOver(const std::string& key);
  void applyGameOver();
  void handleGameOver();
  void checkCollisions();
  void checkGameOver();
  void checkNextRound();
  void drawUI();
  bool menuLoop();
  bool gameLoop();
  bool otherLoop();
  bool loop();
};
