#pragma once

#include <memory>
#include <string>

#include "SDL2Includes.h"

namespace SDL2Wrapper {

struct Sprite {
public:
  const std::string name;
  const int cx;
  const int cy;
  const int cw;
  const int ch;
  SDL_Texture* image;
  Sprite(const std::string& nameA,
         const int cxA,
         const int cyA,
         const int cwA,
         const int chA,
         SDL_Texture* imageA);
};

} // namespace SDL2Wrapper
