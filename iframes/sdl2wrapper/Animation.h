#pragma once

#include "SDL2Includes.h"

#include <memory>
#include <string>
#include <vector>

namespace SDL2Wrapper {
class AnimationDefinition;

class Animation {
public:
  std::string name;
  unsigned int totalDuration;
  Uint64 timestampStart;
  unsigned int spriteIndex;
  bool loop;
  std::vector<std::pair<std::string, int>> sprites;

  Animation();
  Animation(const std::string& nameA, const bool loopA);
  Animation(const Animation& a);
  ~Animation();

  Animation& operator=(const Animation& a);

  bool isInitialized() const;
  const std::string getCurrentSpriteName() const;
  std::string toString() const;
  unsigned int getAnimIndex() const;

  void addSprite(const std::string& spriteName, const unsigned int ms);
  void start();
  void update();
};

class AnimationDefinition : public Animation {
public:
  AnimationDefinition(const std::string& nameA, const bool loopA);
  ~AnimationDefinition();
};
} // namespace SDL2Wrapper