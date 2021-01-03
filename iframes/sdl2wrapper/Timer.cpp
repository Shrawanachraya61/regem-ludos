#include "Timer.h"

namespace SDL2Wrapper {
Timer::Timer(const Window& windowA, int maxTimeMs)
    : window(windowA), removeFlag(false), aggTime(0.0) {
  maxTime = static_cast<double>(maxTimeMs);
}
double Timer::getPctComplete() const {
  double ret = aggTime / maxTime;
  if (aggTime >= maxTime) {
    return 1.0;
  } else {
    return ret;
  }
}
bool Timer::shouldRemove() const { return removeFlag; }
void Timer::restart() {
  aggTime = 0.0;
  removeFlag = false;
}
void Timer::remove() { removeFlag = true; }
void Timer::update() {
  if (!removeFlag) {
    aggTime += window.getDeltaTime();
    if (aggTime > maxTime) {
      remove();
    }
  }
}
FuncTimer::FuncTimer(const Window& windowA,
                     int maxFrames,
                     std::function<void()> cbA)
    : Timer(windowA, maxFrames), cb(cbA) {}
void FuncTimer::remove() {
  if (!removeFlag) {
    cb();
  }
  Timer::remove();
}
BoolTimer::BoolTimer(const Window& windowA, int maxFrames, bool& refA)
    : Timer(windowA, maxFrames), ref(refA) {}
void BoolTimer::remove() {
  if (!removeFlag) {
    ref = !ref;
  }
  Timer::remove();
}

} // namespace SDL2Wrapper