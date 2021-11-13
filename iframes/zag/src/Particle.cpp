#include "Particle.h"
#include "Game.h"
#include "GameOptions.h"
#include "Player.h"
#include <sstream>

Particle::Particle(Game& gameA, ParticleType particleTypeA, const int ms)
    : Actor(gameA, "invisible"),
      particleType(particleTypeA),
      text(""),
      timer(addFuncTimer(ms, [=]() { remove(); })) {

  wrapEnabled = false;

  switch (particleType) {
  case PARTICLE_TYPE_FADE_IN: {
    setV(0, 0);
    set(0, 0);
    break;
  }
  case PARTICLE_TYPE_FADE_OUT: {
    setV(0, 0);
    set(0, 0);
    break;
  }
  case PARTICLE_TYPE_BLACK: {
    setV(0, 0);
    set(0, 0);
    break;
  }
  case PARTICLE_TYPE_TEXT: {
    setV(0, 0);
    set(0, 0);
    break;
  }
  case PARTICLE_TYPE_BOMB_EXPL: {
    game.playSound("bomb_expl");
    setV(0, 0);
    createAnimationDefinition("bomb_expl");
    setAnimState("bomb_expl");
    break;
  }
  case PARTICLE_TYPE_ENTITY_EXPL: {
    game.playSound("hit");
    setV(0, 0);
    createAnimationDefinition("entity_expl_" +
                              std::to_string(game.worldPtr->variant));
    setAnimState("entity_expl_" + std::to_string(game.worldPtr->variant));
    break;
  }
  }
}

Particle::~Particle() {}

void Particle::spawnParticle(
    Game& game, const int x, const int y, ParticleType type, const int ms) {
  GameWorld& world = *(game.worldPtr);
  world.particles.push_back(std::make_unique<Particle>(game, type, ms));
  world.particles.back()->set(x, y);
}
void Particle::update() { Actor::update(); }

void Particle::draw() {
  if (particleType == PARTICLE_TYPE_FADE_OUT) {
    game.window.globalAlpha = static_cast<int>(timer.getPctComplete() * 255);
    game.window.drawSprite("cpp_splash_black", 0, 0, false);
    game.window.globalAlpha = 255;
  } else if (particleType == PARTICLE_TYPE_FADE_IN) {
    game.window.globalAlpha =
        static_cast<int>((1 - timer.getPctComplete()) * 255);
    game.window.drawSprite("cpp_splash_black", 0, 0, false);
    game.window.globalAlpha = 255;
  } else if (particleType == PARTICLE_TYPE_BLACK) {
    game.window.drawSprite("cpp_splash_black", 0, 0, false);
  } else if (particleType == PARTICLE_TYPE_TEXT) {
    game.window.setCurrentFont("default", 16);
    game.window.drawTextCentered(
        text, x, y, game.window.makeColor(248, 248, 248));
  } else {
    Actor::draw();
  }
}