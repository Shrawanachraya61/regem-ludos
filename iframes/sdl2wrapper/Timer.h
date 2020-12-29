#pragma once

#include "Window.h"

namespace SDL2Wrapper {

class Timer {
protected:
  const Window& window;
  bool removeFlag;
  double aggTime;
  double maxTime;

public:
  Timer(const Window& windowA, int maxFrames);
  double getPctComplete() const;
  void restart();
  virtual bool shouldRemove() const;
  virtual void remove();
  virtual void update();
};

class FuncTimer : public Timer {
  std::function<void()> cb;

public:
  FuncTimer(const Window& windowA, int maxFrames, std::function<void()> cbA);
  void remove();
};

class BoolTimer : public Timer {
  bool& ref;

public:
  BoolTimer(const Window& windowA, int maxFrames, bool& refA);
  void remove();
};

} // namespace SDL2Wrapper
