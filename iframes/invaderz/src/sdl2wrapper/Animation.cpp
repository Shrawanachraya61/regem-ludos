#include "Animation.h"
#include "Window.h"
#include "Logger.h"

#include <iostream>
#include <cmath>

namespace SDL2Wrapper
{

  Animation::Animation()
      : name(""), totalDuration(0), timestampStart(Window::now), spriteIndex(0), loop(true)
  {
  }

  Animation::Animation(const std::string &nameA, const bool loopA)
      : name(nameA), totalDuration(0), timestampStart(Window::now), spriteIndex(0), loop(loopA)
  {
  }

  Animation::Animation(const Animation &a)
      : name(a.name), totalDuration(0), timestampStart(a.timestampStart), spriteIndex(a.spriteIndex), loop(a.loop)
  {
    for (auto &pair : a.sprites)
    {
      addSprite(pair.first, pair.second);
    }
  }

  Animation &Animation::operator=(const Animation &a)
  {
    if (this != &a)
    {
      sprites.clear();
      for (auto &pair : a.sprites)
      {
        addSprite(pair.first, pair.second);
      }
      name = a.name;
      totalDuration = a.totalDuration;
      loop = a.loop;
    }
    return *this;
  }

  bool Animation::isInitialized() const
  {
    return sprites.size() > 0;
  }

  const std::string &Animation::getCurrentSpriteName() const
  {
    if (spriteIndex >= 0 && spriteIndex < sprites.size())
    {
      return sprites[spriteIndex].first;
    }
    else
    {
      Logger(WARN) << "Cannot get current sprite name because spriteIndex is out of bounds: " << spriteIndex << " (animation=" << name << ")" << std::endl;
      return sprites[0].first;
    }
  }

  std::string Animation::toString() const
  {
    const std::string spriteName = getCurrentSpriteName();
    return name + " " + spriteName;
  }

  void Animation::addSprite(const std::string &spriteName, const unsigned int ms)
  {
    totalDuration += ms;
    sprites.push_back(std::make_pair(spriteName, ms));
  }

  unsigned int Animation::getAnimIndex() const
  {
    const unsigned int numSprites = sprites.size();
    if (numSprites > 0)
    {
      const Uint64 now = Window::now;
      Uint64 offsetDuration = (now - timestampStart);
      unsigned int currentDuration = 0;
      for (unsigned int i = 0; i < numSprites; i++)
      {
        currentDuration += sprites[i].second;
        if (offsetDuration < currentDuration)
        {
          return i;
        }
      }
      return numSprites - 1;
    }
    else
    {
      return 0;
    }
  }

  void Animation::start()
  {
    timestampStart = Window::now;
  }

  void Animation::update()
  {
    if (sprites.size())
    {
      const Uint64 now = Window::now;
      if (loop && now - timestampStart > totalDuration)
      {
        const Uint64 newStart = timestampStart + totalDuration;
        spriteIndex = 0;
        start();
        if (now - newStart < totalDuration)
        {
          timestampStart = newStart;
        }
      }
      spriteIndex = getAnimIndex();
    }
  }

  AnimationDefinition::AnimationDefinition(const std::string &nameA, const bool loopA) : Animation(nameA, loopA)
  {
  }

} // namespace SDL2Wrapper
