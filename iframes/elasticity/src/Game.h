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

class Circle {
public:
  double x;
  double y;
  double r;
  Circle(double xA, double yA, double rA) : x(xA), y(yA), r(rA) {}
  void print() {
    std::cout << "Circle: " << x << "," << y << "," << r << std::endl;
  }
};

class Rect {
public:
  double x;
  double y;
  double w;
  double h;
  Rect(double xA, double yA, double wA, double hA)
      : x(xA), y(yA), w(wA), h(hA) {}
  void print() {
    std::cout << "Rect: " << x << "," << y << "," << w << "," << h << std::endl;
  }
};

class Game {
  bool shouldDrawMenu;
  bool shouldDrawRetry;
  bool shouldExit;
  bool shouldPlayHiscoreSound;
  bool isGameOver;
  int bricksXOffset;
  int bricksYOffset;
  int bgSpriteSize;
  double bgOffset;

public:
  SDL2Wrapper::Window& window;
  std::vector<std::vector<int>> background;
  std::vector<std::unique_ptr<SDL2Wrapper::Timer>> timers;
  std::vector<std::unique_ptr<Ball>> balls;
  std::vector<std::unique_ptr<Brick>> bricks;
  std::vector<std::unique_ptr<Powerup>> powerups;
  std::vector<std::unique_ptr<Particle>> particles;

  std::unique_ptr<Player> player;

  int score;
  int lastScore;
  int combo;
  unsigned int brickWidth;
  unsigned int brickHeight;
  unsigned int bgWidth;
  unsigned int bgHeight;
  int levelIndex;
  int terrainIndex;
  std::string brickColor;
  bool isVictory;
  int retryIndex;

  Game(SDL2Wrapper::Window& windowA);
  ~Game();
  void initPlayer();
  void initWorld();
  void loadBricks(const std::vector<std::vector<int>>& newBricks);
  std::vector<int> generateBackgroundRow();
  void enableMenu();
  void disableMenu();
  void addBoolTimer(const int maxFrames, bool& ref);
  void addFuncTimer(const int maxFrames, std::function<void()> cb);
  void addBall(int x, int y, double vx, double vy);
  void addPowerup(int x, int y, const std::string& type);
  void addTextParticle(int x, int y, const std::string& text);
  void modifyScore(const int value);
  std::pair<double, double> getNormalizedVec(const double x, const double y);
  void handleKeyDown(const std::string& key);
  void handleKeyUp(const std::string& key);
  void handleKeyUpdate();
  void handleKeyMenu(const std::string& key);
  void handleKeyRetry(const std::string& key);
  void handleGameOver();
  std::string collidesCircleRect(const Circle& c, const Rect& r);
  bool collidesCircleCircle(const Circle& c1, const Circle& c2);
  void checkPlayerBallCollision(Ball& ball, Player& player);
  void checkBallBrickCollision(Ball& ball, Brick& brick);
  void checkPlayerPowerupCollision(Powerup& powerup, Player& player);
  void checkCollisions();
  void checkGameOver();
  void drawTerrain();
  void drawMenu();
  void drawRetry();
  void drawUI();
  bool menuLoop();
  bool gameLoop();
  bool loop();
};
