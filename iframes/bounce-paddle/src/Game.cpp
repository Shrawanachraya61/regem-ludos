#include "Game.h"
#include "Actor.h"
#include "Ball.h"
#include "Brick.h"
#include "GameOptions.h"
#include "Player.h"

#include <algorithm>
#include <cctype>
#include <sstream>
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

std::pair<float, float> getNormalizedVec(const float x, const float y) {
  float d = sqrt(x * x + y * y);
  return std::make_pair(x / d, y / d);
};

Game::Game(SDL2Wrapper::Window& windowA)
    : shouldDrawMenu(true),
      shouldExit(false),
      shouldPlayHiscoreSound(false),
      score(0),
      lastScore(0),
      bricksXOffset(24 + 58 / 2),
      bricksYOffset(64),
      brickWidth(58),
      brickHeight(28),
      bgSpriteSize(24),
      window(windowA) {
  SDL2Wrapper::Store::createFont("default", "assets/monofonto.ttf");
  window.setCurrentFont("default", 18);

  SDL2Wrapper::loadAssetsFromFile("sprite", "assets/sprites.txt");
  SDL2Wrapper::loadAssetsFromFile("animation", "assets/anims.txt");
  SDL2Wrapper::loadAssetsFromFile("sound", "assets/sounds.txt");

  player = std::make_unique<Player>(*this);

  SDL2Wrapper::Events& events = window.getEvents();
  events.setKeyboardEvent(
      "keydown", std::bind(&Game::handleKeyDown, this, std::placeholders::_1));
  initPlayer();
  initWorld();
}

Game::~Game() {}

void Game::initPlayer() { player->set(256, 512 - 64); }

void Game::initWorld() {
  score = 0;
  // addBall(100, 50);
  // addBall(50, 53);
  // addBall(210, 110);
  addBall(50, 300);

  // std::vector<int> level1 = {1, 1, 1, 1, 1, 1, 1,
  //                            1, 1, 1, 1, 1, 1, 1,
  //                            1, 1, 1, 1, 1, 1, 1,
  //                            1, 1, 1, 1, 1, 1, 1,
  //                            1, 1, 1, 1, 1, 1, 1};

  // std::vector<std::vector<int>> level1 = {{1, 1, 1, 0, 1, 1, 1},
  //                                         {1, 1, 1, 0, 1, 1, 1},
  //                                         {3, 1, 1, 0, 1, 1, 3},
  //                                         {1, 5, 1, 0, 1, 5, 1},
  //                                         {5, 5, 5, 0, 5, 5, 5}};

  std::vector<std::vector<int>> level1 = {{2, 5, 2, 1, 1, 2, 5, 2},
                                          {2, 3, 2, 0, 0, 2, 3, 2},
                                          {2, 2, 2, 1, 1, 2, 2, 2},
                                          {1, 1, 1, 0, 0, 1, 1, 1},
                                          {2, 5, 2, 2, 2, 2, 5, 2}};

  unsigned int height = level1.size();
  unsigned int width = level1[0].size();

  for (unsigned int i = 0; i < height; i++) {
    for (unsigned int j = 0; j < width; j++) {
      int brickId = level1[i][j];
      if (brickId == 1) {
        bricks.push_back(std::make_unique<Brick>(*this, "normal"));
      } else if (brickId == 2) {
        bricks.push_back(std::make_unique<Brick>(*this, "metal"));
      } else if (brickId == 3) {
        bricks.push_back(std::make_unique<Brick>(*this, "powerup_good"));
      } else if (brickId == 4) {
        bricks.push_back(std::make_unique<Brick>(*this, "powerup_bad"));
      } else if (brickId == 5) {
        bricks.push_back(std::make_unique<Brick>(*this, "metalBomb"));
      }

      if (brickId > 0) {
        Brick& brick = *bricks[bricks.size() - 1];
        brick.set(bricksXOffset + j * brickWidth,
                  bricksYOffset + i * brickHeight);
      }
    }
  }

  unsigned int bgWidth = (GameOptions::width / bgSpriteSize) + 1;
  unsigned int numBgSprites = (GameOptions::width / bgSpriteSize + 1) *
                              (GameOptions::height / bgSpriteSize + 1);
  for (unsigned int i = 0; i < numBgSprites; i++) {
    unsigned int x = i % bgWidth;
    if (x < 5 || x > bgWidth - 5) {
      background.push_back(2 + rand() % 2);
    } else if (x < 8 || x > bgWidth - 8) {
      background.push_back(1 + rand() % 3);
    } else if (x < 11 || x > bgWidth - 11) {
      background.push_back(rand() % 3);
    } else {
      background.push_back(rand() % 2);
    }
  }
}

void Game::addBall(int x, int y) {
  balls.push_back(std::make_unique<Ball>(*this));
  Ball& ball = *balls[balls.size() - 1];
  ball.set(x, y);
  ball.setV(0, -3.5);
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
    player->setDirection("left");
    player->setVx(-4);
  } else if (events.isKeyPressed("Right")) {
    player->setDirection("right");
    player->setVx(4);
  } else {
    player->setDirection("up");
    player->setVx(0);
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

std::string Game::collidesCircleRect(const Circle& c, const Rect& r2) {
  Rect r1(c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
  double dx = (r1.x + r1.w / 2) - (r2.x + r2.w / 2);
  double dy = (r1.y + r1.h / 2) - (r2.y + r2.h / 2);
  double width = (r1.w + r2.w) / 2;
  double height = (r1.h + r2.h) / 2;
  double crossWidth = width * dy;
  double crossHeight = height * dx;
  std::string collision = "none";
  if (abs(dx) <= width && abs(dy) <= height) {
    if (crossWidth > crossHeight) {
      collision = (crossWidth > (-crossHeight)) ? "bottom" : "left";
    } else {
      collision = (crossWidth > -(crossHeight)) ? "right" : "top";
    }
  }
  return collision;
}
bool Game::collidesCircleCircle(const Circle& c1, const Circle& c2) {
  float d = distance(c1.x, c1.y, c2.x, c2.y);
  if (d < c1.r + c2.r) {
    return true;
  }
  return false;
}

void Game::handlePlayerBallCollision(Ball& ball, Player& player) {
  Circle ballCircle(ball.x, ball.y, ball.r);
  Circle playerCircleLeft(player.x - player.paddleCollisionXOffset,
                          player.y + player.paddleCollisionYOffset,
                          player.paddleCollisionRadius);
  Circle playerCircleRight(player.x + player.paddleCollisionXOffset,
                           player.y + player.paddleCollisionYOffset,
                           player.paddleCollisionRadius);
  Rect playerRectTop(player.x - player.paddleCollisionTopWidth / 2,
                     player.y + player.paddleCollisionTopYOffset -
                         player.paddleCollisionTopHeight / 2,
                     player.paddleCollisionTopWidth,
                     player.paddleCollisionTopHeight);

  Circle playerCircle(player.x, player.y + 50, 50);

  if (ball.y > playerCircleLeft.y || ball.vy < 0) {
    return;
  }

  if (collidesCircleCircle(ballCircle, playerCircle)) {
    double normX = ball.x - playerCircle.x;
    double normY = ball.y - playerCircle.y;
    double nn = normX * normX + normY * normY;
    double vn = normX * ball.vx + normY * ball.vy;
    if (vn > 0) {
      return;
    }
    ball.set(ball.x - ball.vx, ball.y - ball.vy);
    ball.vx -= (2 * (vn / nn)) * normX;
    ball.vy -= (2 * (vn / nn)) * normY;
    player.setBouncing();
  }

  // if (collidesCircleCircle(ballCircle, playerCircleLeft)) {
  //   double normX = ball.x - playerCircleLeft.x;
  //   double normY = ball.y - playerCircleLeft.y;
  //   double nn = normX * normX + normY * normY;
  //   double vn = normX * ball.vx + normY * ball.vy;
  //   if (vn > 0) {
  //     return;
  //   }
  //   ball.set(ball.x - ball.vx, ball.y - ball.vy);
  //   ball.vx -= (2 * (vn / nn)) * normX;
  //   ball.vy -= (2 * (vn / nn)) * normY;
  //   player.setBouncing();
  // } else if (collidesCircleCircle(ballCircle, playerCircleRight)) {
  //   double normX = ball.x - playerCircleRight.x;
  //   double normY = ball.y - playerCircleRight.y;
  //   double nn = normX * normX + normY * normY;
  //   double vn = normX * ball.vx + normY * ball.vy;
  //   if (vn > 0) {
  //     return;
  //   }
  //   ball.set(ball.x - ball.vx, ball.y - ball.vy);
  //   ball.vx -= (2 * (vn / nn)) * normX;
  //   ball.vy -= (2 * (vn / nn)) * normY;
  //   player.setBouncing();
  // } else if (collidesCircleRect(ballCircle, playerRectTop) != "none") {
  //   ball.setV(ball.vx, -ball.vy);
  //   player.setBouncing();
  // }
}

void Game::handleBallBrickCollision(Ball& ball, Brick& brick) {
  Circle ballCircle(ball.x, ball.y, ball.r);
  Rect brickRect(brick.x - brickWidth / 2,
                 brick.y - brickHeight / 2,
                 brickWidth,
                 brickHeight);

  std::string side = collidesCircleRect(ballCircle, brickRect);

  if (side != "none") {
    brick.handleCollision(ball);
    ball.set(ball.x - ball.vx * window.getFrameRatio(),
             ball.y - ball.vy * window.getFrameRatio());
    if (side == "left" || side == "right") {
      ball.setVx(-ball.vx);
    } else {
      ball.setVy(-ball.vy);
    }
  }
}

void Game::checkCollisions() {
  for (auto it = balls.begin(); it != balls.end(); ++it) {
    handlePlayerBallCollision(**it, *player);
    for (auto it2 = bricks.begin(); it2 != bricks.end(); ++it2) {
      Brick& brick = **it2;
      if (!brick.isExploding) {
        handleBallBrickCollision(**it, **it2);
      }
    }
  }
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

void Game::addFuncTimer(const int maxFrames, std::function<void()> cb) {
  timers.push_back(
      std::make_unique<SDL2Wrapper::FuncTimer>(window, maxFrames, cb));
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

  unsigned int bgWidth = (GameOptions::width / bgSpriteSize) + 1;
  unsigned int bgHeight = (GameOptions::height / bgSpriteSize) + 1;
  for (unsigned int i = 0; i < background.size(); i++) {
    int x = (i % bgWidth) * bgSpriteSize - bgSpriteSize / 2;
    int y = (i / bgHeight) * bgSpriteSize - bgSpriteSize / 2;
    std::stringstream ss;
    ss << "terrain_" << background[i];
    window.drawSprite(ss.str(), x, y, false);
  }

  player->update();
  player->draw();

  for (unsigned int i = 0; i < bricks.size(); i++) {
    Brick& brick = *bricks[i];
    brick.update();
    brick.draw();
    if (brick.shouldRemove()) {
      bricks.erase(bricks.begin() + i);
      i--;
    }
  }

  for (unsigned int i = 0; i < balls.size(); i++) {
    Ball& ball = *balls[i];
    ball.update();
    ball.draw();
    if (ball.shouldRemove()) {
      balls.erase(balls.begin() + i);
      i--;
    }
  }

  checkCollisions();
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
