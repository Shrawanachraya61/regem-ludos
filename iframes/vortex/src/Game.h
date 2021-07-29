#pragma once

#include "SDL2Wrapper.h"

#include <memory>
#include <string>
#include <vector>

class Actor;
class Player;
class Ball;
class Brick;
class Powerup;
class Particle;
class Projectile;
class Asteroid;
class Powerup;
class BlackHole;
class Enemy;
class Circle;
class Rect;

enum GameState {
  GAME_STATE_MENU,
  GAME_STATE_GAME,
  GAME_STATE_READY_TO_START,
  GAME_STATE_WAVE_COMPLETED,
  GAME_STATE_GAME_OVER
};

class Game {
  bool shouldExit;
  bool shouldPlayHiscoreSound;
  bool shouldClearTimers;

public:
  bool isTransitioning;
  GameState state;
  SDL2Wrapper::Window& window;
  std::unique_ptr<Player> player;
  std::vector<std::unique_ptr<SDL2Wrapper::Timer>> timers;
  std::vector<std::unique_ptr<Particle>> particles;

  std::vector<std::unique_ptr<Projectile>> projectiles;
  std::vector<std::unique_ptr<Asteroid>> asteroids;
  std::vector<std::unique_ptr<Powerup>> powerups;
  std::vector<std::unique_ptr<Enemy>> enemies;
  std::vector<std::unique_ptr<BlackHole>> blackHoles;

  std::vector<unsigned int> background;
  std::vector<unsigned int> heartSpawns;

  int score;
  int bonus;
  int stars;
  int diamonds;
  int scoreLevelStart;
  int lastScore;
  int bonusAfterWaveCompleted;
  bool updateEntities;
  bool initWorldNextTick;
  bool clearEntitiesNextTick;
  SDL2Wrapper::Gauge bonusGauge;

  unsigned int wave;
  SDL2Wrapper::Animation titleAnimation;

  Game(SDL2Wrapper::Window& windowA);
  ~Game();
  void initWorld();
  void addWorldSpawnTimers();

  void startNewGame();
  std::vector<int> generateBackgroundRow();

  void setState(GameState stateA);

  void addBoolTimer(const int maxFrames, bool& ref);
  void addFuncTimer(const int maxFrames, std::function<void()> cb);
  void addPowerup(int x, int y, const std::string& type);
  void modifyScore(const int value);
  void handleKeyDown(const std::string& key);
  void handleKeyUp(const std::string& key);
  void handleKeyUpdate();
  void handleKeyMenu(const std::string& key);
  void handleKeyWaveCompleted(const std::string& key);
  void handleKeyGameOver(const std::string& key);
  void handleKeyReadyToStart(const std::string& key);
  void handleGameOver();
  std::pair<double,double> getGravitationalPull(const double x, const double y);
  void checkCollisions();
  void checkGameOver();
  void checkWaveCompleted();
  void drawUI();
  bool menuLoop();
  bool gameLoop();
  bool otherLoop();
  bool loop();
};
