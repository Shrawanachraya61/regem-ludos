#pragma once

#include "Window.h"

namespace SDL2Wrapper {

class Gauge {
protected:
  const Window& window;
  double aggTime;
  double maxTime;

public:
  Gauge(const Window& windowA, int maxFrames);
  double getPctFull() const;
  bool isFull() const;
  void setMs(int ms);
  void empty();
  void fill();
};

} // namespace SDL2Wrapper
