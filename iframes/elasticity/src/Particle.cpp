#include "Particle.h"
#include "Game.h"
#include "GameOptions.h"
#include "Player.h"
#include <sstream>

Particle::Particle(Game& gameA, const std::string& particleTypeA, int ms)
    : Actor(gameA, "invisible"),
      particleType("text"),
      timer(addFuncTimer(ms, [&]() { remove(); })),
      text("") {
  setParticleType(particleTypeA);
}

Particle::~Particle() {}

void Particle::setParticleType(const std::string& particleTypeA) {
  particleType = particleTypeA;
  if (particleType == "fade_in") {
    setV(0, 0);
    set(0, 0);
  } else if (particleType == "fade_out") {
    setV(0, 0);
    set(0, 0);
  } else if (particleType == "black") {
    setV(0, 0);
    set(0, 0);
  } else if (particleType == "text") {
    setV(0, -1.0);
  }
}

void Particle::update() {
  Actor::update();
  if (y > GameOptions::height) {
    y = GameOptions::height;
    remove();
  }
}

void Particle::draw() {
  if (particleType == "text") {
    game.window.setCurrentFont("default", 18);
    game.window.drawTextCentered(
        text, x, y, game.window.makeColor(255, 255, 255));
  } else if (particleType == "fade_out") {
    game.window.globalAlpha = static_cast<int>(timer.getPctComplete() * 255);
    game.window.drawSprite("cpp_splash_black", 0, 0, false);
    game.window.globalAlpha = 255;
  } else if (particleType == "fade_in") {
    game.window.globalAlpha =
        static_cast<int>((1 - timer.getPctComplete()) * 255);
    game.window.drawSprite("cpp_splash_black", 0, 0, false);
    game.window.globalAlpha = 255;
  } else if (particleType == "black") {
    game.window.drawSprite("cpp_splash_black", 0, 0, false);
  }
}