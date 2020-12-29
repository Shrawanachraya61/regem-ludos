#pragma once

#include "SDL2/SDL.h"
#include "SDL2/SDL_image.h"
#include "SDL2/SDL_mixer.h"
#include "SDL2/SDL_ttf.h"

namespace SDL2Wrapper {
struct SDL_Deleter {
  void operator()(SDL_Window* p) const;
  void operator()(SDL_Renderer* p) const;
  void operator()(SDL_Texture* p) const;
  void operator()(TTF_Font* p) const;
  void operator()(Mix_Chunk* p) const;
  void operator()(Mix_Music* p) const;
};
} // namespace SDL2Wrapper
