#include "Brick.h"
#include "Ball.h"
#include "Game.h"
#include "GameOptions.h"
#include <sstream>

Brick::Brick(Game& gameA, const std::string& brickTypeA)
    : Actor(gameA, "invisible"), brickType(brickTypeA), isExploding(false) {

  auto addAnimation = [&](const std::string& animName) {
    anims[animName] = SDL2Wrapper::Animation();
    game.window.setAnimationFromDefinition(animName, anims[animName]);
  };

  addAnimation("brick_normal");
  addAnimation("brick_normal_destroyed");
  addAnimation("brick_normal_green");
  addAnimation("brick_normal_green_destroyed");
  addAnimation("brick_normal_pink");
  addAnimation("brick_normal_pink_destroyed");
  addAnimation("brick_normal_blue");
  addAnimation("brick_normal_blue_destroyed");
  addAnimation("brick_normal");
  addAnimation("brick_normal_destroyed");
  addAnimation("brick_powerup");
  addAnimation("brick_powerup_destroyed");
  addAnimation("brick_powerup_bad");
  addAnimation("brick_powerup_bad_destroyed");
  addAnimation("brick_metal");
  addAnimation("brick_metal_destroyed");
  addAnimation("brick_metalBomb");
  addAnimation("brick_metalBomb_destroyed");
  addAnimation("brick_powerup_metal");
  addAnimation("brick_powerup_metal_destroyed");

  setAnimState(getBaseAnimString());
}

Brick::~Brick() {}

void Brick::handleCollision(const Ball& ball) {
  if (isExploding) {
    return;
  }

  if (brickType == "normal") {
    game.modifyScore(100);
    game.window.playSound("brick_hit1");
    if (ball.ballType == "armored") {
      game.window.playSound("brick_hit2");
    } else {
      game.window.playSound("brick_hit1");
    }
    destroy();
  } else if (brickType == "metal") {
    if (ball.ballType == "armored") {
      game.window.playSound("brick_hit2");
      addFuncTimer(33, [&]() { game.window.playSound("explosion"); });
      game.modifyScore(150);
      destroy();
    } else {
      game.window.playSound("metal_hit2");
    }
  } else if (brickType == "powerup_good") {
    game.window.playSound("extra_balls");
    game.addTextParticle(x, y, "Extra Balls!");
    for (unsigned int i = 0; i < 2; i++) {
      int otherVx = 5 - rand() % 10;
      int otherVy = 5 - rand() % 10;
      if (otherVx == 0) {
        otherVx = 1;
      }
      game.addBall(ball.x, ball.y, otherVx, otherVy);
      game.balls.back()->setSpeed(4);
      game.balls.back()->ballType = "extra";
      game.balls.back()->setAnimState("ball_extra");
    }
    destroy();
  } else if (brickType == "powerup_bad") {
    game.window.playSound("powerup_bad");
    game.addPowerup(x, y, "bad");
    destroy();
  } else if (brickType == "powerup_metal") {
    game.addTextParticle(x, y, "Powerup: Metalize");
    game.window.playSound("powerup_good");
    for (unsigned int i = 0; i < game.balls.size(); i++) {
      (*game.balls[i]).setType("armored");
    }
    destroy();
  } else if (brickType == "metalBomb") {
    game.window.playSound("explosion");
    game.modifyScore(150);
    destroy();
  }
}

void Brick::destroy() {
  if (!isExploding) {
    setAnimState(getBaseAnimString() + "_destroyed");
    isExploding = true;
    game.combo++;
    addFuncTimer(6 * 100, [&]() { remove(); });
  }

  if (brickType == "metalBomb") {
    addFuncTimer(250, [&]() {
      for (auto it = game.bricks.begin(); it != game.bricks.end(); ++it) {
        Brick& brick = **it;
        if (brick.brickType == "normal" || brick.brickType == "powerup_good" ||
            brick.brickType == "powerup_bad") {
          continue;
        }

        if (!brick.isExploding) {
          Circle top(x, y - game.brickHeight, 1);
          Circle bot(x, y + game.brickHeight, 1);
          Circle left(x - game.brickWidth, y, 1);
          Circle right(x + game.brickWidth, y, 1);
          Rect brickRect(brick.x - game.brickWidth / 2,
                         brick.y - game.brickHeight / 2,
                         game.brickWidth,
                         game.brickHeight);
          if (game.collidesCircleRect(top, brickRect) != "none") {
            game.combo++;
            game.modifyScore(150);
            game.window.playSound("explosion");
            brick.brickType = "metalBomb";
            brick.destroy();
          }
          if (game.collidesCircleRect(bot, brickRect) != "none") {
            game.combo++;
            game.modifyScore(150);
            game.window.playSound("explosion");
            brick.brickType = "metalBomb";
            brick.destroy();
          }
          if (game.collidesCircleRect(left, brickRect) != "none") {
            game.combo++;
            game.modifyScore(150);
            game.window.playSound("explosion");
            brick.brickType = "metalBomb";
            brick.destroy();
          }
          if (game.collidesCircleRect(right, brickRect) != "none") {
            game.combo++;
            game.modifyScore(150);
            game.window.playSound("explosion");
            brick.brickType = "metalBomb";
            brick.destroy();
          }
        }
      }
    });
  }
}

int Brick::indexOfBrickOnSide(const std::string& side) {
  for (unsigned int i = 0; i < game.bricks.size(); i++) {
    Brick& brick = *game.bricks[i];
    Circle top(x, y - game.brickHeight, 1);
    Circle bot(x, y + game.brickHeight, 1);
    Circle left(x - game.brickWidth, y, 1);
    Circle right(x + game.brickWidth, y, 1);
    Rect brickRect(brick.x - game.brickWidth / 2,
                   brick.y - game.brickHeight / 2,
                   game.brickWidth,
                   game.brickHeight);
    if (side == "top" && game.collidesCircleRect(top, brickRect) != "none") {
      return i;
    } else if (side == "bottom" &&
               game.collidesCircleRect(bot, brickRect) != "none") {
      return i;
    } else if (side == "left" &&
               game.collidesCircleRect(left, brickRect) != "none") {
      return i;
    } else if (side == "right" &&
               game.collidesCircleRect(right, brickRect) != "none") {
      return i;
    }
  }
  return -1;
}

std::string Brick::getBaseAnimString() {
  std::stringstream ss;

  if (brickType == "powerup_good") {
    ss << "brick_powerup";
  } else if (brickType == "powerup_bad") {
    ss << "brick_powerup_bad";
  } else {
    ss << "brick_" << brickType;
  }

  if (brickType == "normal" && game.brickColor != "") {
    ss << "_" << game.brickColor;
  }

  return ss.str();
}

void Brick::update() { Actor::update(); }

void Brick::draw() { Actor::draw(); }