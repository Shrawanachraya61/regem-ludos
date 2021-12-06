#include "BlackHole.h"
#include "Game.h"
#include "GameOptions.h"

BlackHole::BlackHole(Game& gameA, const double x, const double y)
    : Actor(gameA, "invisible"),
      position(BLACK_HOLE_POS_LEFT_DOWN),
      strengthGauge(SDL2Wrapper::Gauge(gameA.window, 10000)) {
  set(x, y);

  createAnimationDefinition("black_hole");
  setAnimState("black_hole");
  addBoolTimer(10000, removeFlag);

  if (x > GameOptions::width / 2 && y > GameOptions::height / 2) {
    position = BLACK_HOLE_POS_RIGHT_DOWN;
    bgSprite = "black_hole_right_down";
  } else if (x > GameOptions::width / 2 && y <= GameOptions::height / 2) {
    position = BLACK_HOLE_POS_RIGHT_UP;
    bgSprite = "black_hole_right_up";
  } else if (x < GameOptions::width / 2 && y > GameOptions::height / 2) {
    position = BLACK_HOLE_POS_LEFT_DOWN;
    bgSprite = "black_hole_left_down";
  } else if (x < GameOptions::width / 2 && y <= GameOptions::height / 2) {
    position = BLACK_HOLE_POS_LEFT_UP;
    bgSprite = "black_hole_left_up";
  }
}
BlackHole::~BlackHole() {}

void BlackHole::spawnBlackHole(Game& game, const double x, const double y) {
  game.blackHoles.push_back(std::make_unique<BlackHole>(game, x, y));
}

void BlackHole::handleCollision(const Player& player) {}
void BlackHole::handleCollision(const Projectile& projectile) {}

double BlackHole::getStrength() const { return strengthGauge.getPctFull(); }
void BlackHole::onRemove() {}
void BlackHole::update() { Actor::update(); }
void BlackHole::draw() {
  if (game.state == GAME_STATE_GAME) {
    strengthGauge.fill();
  }
  double pct = strengthGauge.getPctFull();

  game.window.globalAlpha = 128 * pct;
  game.window.drawSprite(bgSprite, 0, 0, false);
  game.window.globalAlpha = 255;

  game.window.globalAlpha = 128;
  Actor::draw();
  game.window.globalAlpha = 255;
}
