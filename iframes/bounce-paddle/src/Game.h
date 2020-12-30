#pragma once

#include "SDL2Wrapper.h"

#include <memory>
#include <string>
#include <vector>

class Actor;
class Player;
class Ball;
class Brick;

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
  bool shouldExit;
  bool shouldPlayHiscoreSound;
  int score;
  int lastScore;
  int bricksXOffset;
  int bricksYOffset;
  int bgSpriteSize;

public:
  SDL2Wrapper::Window& window;
  std::vector<unsigned int> background;
  std::vector<std::unique_ptr<SDL2Wrapper::Timer>> timers;
  std::vector<std::unique_ptr<Ball>> balls;
  std::vector<std::unique_ptr<Brick>> bricks;

  std::unique_ptr<Player> player;

  int brickWidth;
  int brickHeight;

  Game(SDL2Wrapper::Window& windowA);
  ~Game();
  void initPlayer();
  void initWorld();
  void addBall(int x, int y);
  void enableMenu();
  void disableMenu();
  void addBoolTimer(const int maxFrames, bool& ref);
  void addFuncTimer(const int maxFrames, std::function<void()> cb);
  void modifyScore(const int value);
  void handleKeyDown(const std::string& key);
  void handleKeyUp(const std::string& key);
  void handleKeyUpdate();
  void handleKeyMenu(const std::string& key);
  void handleGameOver();
  std::string collidesCircleRect(const Circle& c, const Rect& r);
  bool collidesCircleCircle(const Circle& c1, const Circle& c2);
  void handlePlayerBallCollision(Ball& ball, Player& player);
  void handleBallBrickCollision(Ball& ball, Brick& brick);
  void checkCollisions();
  void checkGameOver();
  void drawMenu();
  void drawUI();
  bool menuLoop();
  bool gameLoop();
  bool loop();
};
