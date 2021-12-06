#include "Powerup.h"
#include "Game.h"
#include "GameOptions.h"
#include "Player.h"
#include <sstream>

std::vector<std::string> powerupTypes = {"good", "bad"};

Powerup::Powerup(Game& gameA, const std::string& powerupTypeA)
    : Actor(gameA, "invisible"), powerupType(powerupTypeA) {
  anims["powerup_good"] = SDL2Wrapper::Animation();
  game.window.setAnimationFromDefinition("powerup_good", anims["powerup_good"]);
  anims["powerup_bad"] = SDL2Wrapper::Animation();
  game.window.setAnimationFromDefinition("powerup_bad", anims["powerup_bad"]);

  if (std::find(powerupTypes.begin(), powerupTypes.end(), powerupTypeA) ==
      powerupTypes.end()) {
    powerupType = "good";
    SDL2Wrapper::Logger(GameOptions::programName)
        << "Cannot set powerup type to: " << powerupTypeA << std::endl;
  }

  powerupType = powerupTypeA;
  setAnimState("powerup_" + powerupType);
  r = 12;
  vy = 2.0;
}

Powerup::~Powerup() {}

void Powerup::handleCollision(const Player& player) {
  remove();
  if (powerupType == "good") {
    // play sound
  } else if (powerupType == "bad") {
    // play sound
  }
}

void Powerup::update() {
  Actor::update();
  if (y > GameOptions::height) {
    y = GameOptions::height;
    vy = -vy;
    remove();
  }
}

void Powerup::draw() { Actor::draw(); }