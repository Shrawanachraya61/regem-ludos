#pragma once

#include "Actor.h"

class Player;

class Particle : public Actor {
public:
  std::string particleType;
  SDL2Wrapper::Timer& timer;
  std::string text;
  explicit Particle(Game& gameA, const std::string& particleType, int ms);
  ~Particle();
  void setParticleType(const std::string& particleTypeA);
  void update() override;
  void draw() override;
};
