#include "Gauge.h"

namespace SDL2Wrapper {

Gauge::Gauge(const Window& windowA, int maxTimeMs)
    : window(windowA), aggTime(0.0), maxTime(static_cast<double>(maxTimeMs)) {}
double Gauge::getPctFull() const {
  double ret = aggTime / maxTime;
  if (aggTime >= maxTime) {
    return 1.0;
  } else {
    return ret;
  }
}
bool Gauge::isFull() const { return getPctFull() >= 1.0; }
void Gauge::fill() {
  aggTime += window.getDeltaTime();
  if (aggTime > maxTime) {
    aggTime = maxTime;
  }
}
void Gauge::empty() {
  aggTime = 0;
}

} // namespace SDL2Wrapper