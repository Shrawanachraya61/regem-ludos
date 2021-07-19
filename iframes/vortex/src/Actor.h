#pragma once

#include "SDL2Wrapper.h"

#include <unordered_map>

class Game;
class Circle;

class Actor {
protected:
  Game& game;
  bool removeFlag;
  std::vector<std::unique_ptr<SDL2Wrapper::Timer>> timers;

public:
  std::string animState;
  std::string spriteBase;
  double x;
  double y;
  double vx;
  double vy;
  double ax;
  double ay;
  double accelerationRate;
  double maxSpeed;
  double headingDeg;
  bool accelerating;
  bool frictionEnabled;
  bool wrapEnabled;
  float r;
  bool dying;
  std::unordered_map<std::string, SDL2Wrapper::Animation> anims;
  Actor(Game& gameA, const std::string& spriteBaseA);
  virtual ~Actor();
  void set(const double xA, const double yA);
  void setV(const double vxA, const double vyA);
  void setA(const double axA, const double vyA);
  void setVx(const double vxA);
  void setVy(const double vyA);
  void setAx(const double axA);
  void setAy(const double ayA);
  void setHeading(const double heading);
  void decelerateX(double rate);
  void decelerateY(double rate);
  Circle getCollisionCircle();
  virtual void setAnimState(const std::string& state);
  SDL2Wrapper::Timer& addBoolTimer(const int maxTimeMs, bool& ref);
  SDL2Wrapper::Timer& addFuncTimer(const int maxTimeMs,
                                   std::function<void()> cb);
  void remove();
  bool shouldRemove() const;
  virtual void onRemove();

  virtual void update();
  virtual void draw();
};
