#pragma once

#include "Window.h"
#include "Timer.h"

namespace SDL2Wrapper {

class ContinuousSound {
  Window& window;
  bool shouldPlaySound;

public:
  std::string soundName;
  int ms;
  bool playing;
  BoolTimer timer;
  ContinuousSound(Window& windowA,
                  const std::string& soundNameA,
                  const int msA);
  void play();
  void pause();
  void update();
};

}