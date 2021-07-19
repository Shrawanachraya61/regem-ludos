#include "Sound.h"

namespace SDL2Wrapper {

ContinuousSound::ContinuousSound(Window& windowA,
                                 const std::string& soundNameA,
                                 const int msA)
    : window(windowA),
      shouldPlaySound(false),
      soundName(soundNameA),
      ms(msA),
      playing(false),
      timer(BoolTimer(window, msA, shouldPlaySound)) {}

void ContinuousSound::play() {
  if (!playing) {
    window.playSound(soundName);
    playing = true;
    timer.restart();
  }
}

void ContinuousSound::pause() {
  playing = false;
  window.stopSound(soundName);
}

void ContinuousSound::update() {
  if (playing) {
    timer.update();
    if (shouldPlaySound) {
      window.playSound(soundName);
      shouldPlaySound = false;
      timer.restart();
    }
  }
}

}