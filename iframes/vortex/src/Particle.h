#pragma once

#include "Actor.h"

class Player;

enum ParticleType {
  PARTICLE_TYPE_FADE_IN,
  PARTICLE_TYPE_FADE_OUT,
  PARTICLE_TYPE_BLACK,
  PARTICLE_TYPE_TEXT,
  PARTICLE_TYPE_EXPLOSION,
  PARTICLE_TYPE_EXPLOSION2,
  PARTICLE_TYPE_CAPSULE_SHATTER,
  PARTICLE_TYPE_YES,
  PARTICLE_TYPE_NO
};

class Particle : public Actor {
public:
  ParticleType particleType;
  std::string text;
  // need this reference to get percent complete for fade particles
  SDL2Wrapper::Timer& timer;
  explicit Particle(Game& gameA, ParticleType particleType, const int ms);
  static void spawnParticle(
      Game& game, const int x, const int y, ParticleType type, const int ms = 1500);
  static void spawnTextParticle(Game& game,
                                const int x,
                                const int y,
                                const std::string& text,
                                const int ms = 1500);
  ~Particle();
  void update() override;
  void draw() override;
};
