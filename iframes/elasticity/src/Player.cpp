#include "Player.h"
#include "Ball.h"
#include "Game.h"
#include "GameOptions.h"
#include "Powerup.h"
#include <sstream>

std::vector<std::string> playerDirections = {"up", "left", "right"};
std::vector<std::string> playerPaddleStates = {"normal", "short", "sticky"};

Player::Player(Game& gameA)
    : Actor(gameA, "player"),
      isBouncing(false),
      direction("up"),
      paddleCollisionRadius(50),
      paddleShortCollisionRadius(25),
      paddleState("normal"),
      mana(0),
      isPlayingIntro(false) {
  for (unsigned int i = 0; i < playerPaddleStates.size(); i++) {
    for (unsigned int j = 0; j < playerDirections.size(); j++) {
      std::stringstream ss;
      ss << "player_" << playerPaddleStates[i];
      ss << "_" << playerDirections[j];
      anims[ss.str()] = SDL2Wrapper::Animation();
      game.window.setAnimationFromDefinition(ss.str(), anims[ss.str()]);

      ss << "_bounce";
      anims[ss.str()] = SDL2Wrapper::Animation();
      game.window.setAnimationFromDefinition(ss.str(), anims[ss.str()]);
    }
  }

  anims["player_intro"] = SDL2Wrapper::Animation();
  game.window.setAnimationFromDefinition("player_intro", anims["player_intro"]);
}

Player::~Player() {}

const std::string Player::getAnimationStr() {
  if (isPlayingIntro) {
    return "player_intro";
  }
  return "player_" + paddleState + "_" + direction +
         (isBouncing ? "_bounce" : "");
}

void Player::setDirection(const std::string& directionA) {
  if (std::find(playerDirections.begin(), playerDirections.end(), directionA) ==
      playerDirections.end()) {
    SDL2Wrapper::Logger(GameOptions::programName)
        << "Cannot set player direction to: " << directionA << std::endl;
    return;
  }
  direction = directionA;
}

void Player::setPaddleState(const std::string& paddleStateA) {
  if (std::find(playerPaddleStates.begin(),
                playerPaddleStates.end(),
                paddleStateA) == playerPaddleStates.end()) {
    SDL2Wrapper::Logger(GameOptions::programName)
        << "Cannot set player paddleState to: " << paddleStateA << std::endl;
    return;
  }
  paddleState = paddleStateA;
}

void Player::setBouncing() {
  if (!isBouncing) {
    isBouncing = true;
    game.addBoolTimer(100, isBouncing);
  }
}

void Player::startIntro() {
  if (!isPlayingIntro) {
    isPlayingIntro = true;
    game.window.playSound("ship_intro");
    addFuncTimer(2000, [&]() { isPlayingIntro = false; });
  }
}

bool Player::isPaddleShort() const { return paddleState == "short"; }

void Player::handleCollision(const Ball& ball) {
  game.modifyScore(-10);

  game.window.playSound("paddle_hit");
  setBouncing();
  if (game.combo > 2) {
    std::stringstream ss;
    ss << game.combo << " Combo!";
    if (game.combo > 4) {
      ss << "!";
    }
    if (game.combo > 9) {
      ss << "!!!";
    }
    game.addTextParticle(game.window.width / 2, y - 32, ss.str());
  }
  game.combo = 0;
}

void Player::handleCollision(const Powerup& powerup) {
  if (powerup.powerupType == "good") {
    game.addTextParticle(
        static_cast<double>(x), static_cast<double>(y), "+ Mana");
  } else if (powerup.powerupType == "bad") {
    game.addTextParticle(
        static_cast<double>(x), static_cast<double>(y), "Shield Reduced!");

    if (paddleState != "short") {
      game.window.playSound("paddle_small");
      paddleState = "short";
      addFuncTimer(8000, [&]() {
        if (paddleState == "short") {
          game.window.playSound("paddle_normal");
          paddleState = "normal";
        }
      });
    }
  }
}

void Player::update() {
  Actor::update();
  setAnimState(getAnimationStr());

  if (x > GameOptions::width) {
    x = GameOptions::width;
  } else if (x < 0) {
    x = 0;
  }
  if (y > GameOptions::height) {
    y = GameOptions::height;
  } else if (y < 0) {
    y = 0;
  }
}

void Player::draw() { Actor::draw(); }