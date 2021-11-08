#include "Particle.h"
#include "Game.h"
#include "GameOptions.h"
#include "Player.h"
#include <sstream>

Particle::Particle(Game &gameA, ParticleType particleTypeA, const int ms)
    : Actor(gameA, "invisible"), particleType(particleTypeA), text(""),
      timer(addFuncTimer(ms, [=]() { remove(); })) {

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
    // case PARTICLE_TYPE_EXPLOSION: {
    //   setV(0, 0);
    //   setAnimState("explosion");
    //   break;
    // }
    // case PARTICLE_TYPE_EXPLOSION2: {
    //   setV(0, 0);
    //   setAnimState("explosion2");
    //   break;
    // }
  }
}

Particle::~Particle() {}

void Particle::spawnParticle(Game &game, const int x, const int y,
                             ParticleType type, const int ms) {
  game.world.particles.push_back(std::make_unique<Particle>(game, type, ms));
  game.world.particles.back()->set(x, y);
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
  } else {
    Actor::draw();
  }
}