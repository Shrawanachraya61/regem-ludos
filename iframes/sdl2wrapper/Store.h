#pragma once

#include <iostream>
#include <memory>
#include <unordered_map>

#include "SDL2Includes.h"

#include "Animation.h"
#include "Sprite.h"

namespace SDL2Wrapper {

class Store {
  static unsigned int numSoundChunks;

  Store();
  ~Store();
  static SDL_Renderer* rendererPtr;
  static std::unordered_map<std::string,
                            std::unique_ptr<SDL_Texture, SDL_Deleter>>
      textures;
  static std::unordered_map<std::string,
                            std::unique_ptr<SDL_Texture, SDL_Deleter>>
      textTextures;
  static std::unordered_map<std::string, std::unique_ptr<Sprite>> sprites;
  static std::unordered_map<std::string, std::unique_ptr<AnimationDefinition>>
      anims;
  static std::unordered_map<std::string, std::unique_ptr<TTF_Font, SDL_Deleter>>
      fonts;
  static std::unordered_map<std::string,
                            std::unique_ptr<Mix_Chunk, SDL_Deleter>>
      sounds;
  static std::unordered_map<std::string, unsigned int> soundInds;
  static std::unordered_map<std::string,
                            std::unique_ptr<Mix_Music, SDL_Deleter>>
      musics;

  static void createSprite(const std::string& name, SDL_Texture* tex);

public:
  static void
  setRenderer(std::unique_ptr<SDL_Renderer, SDL_Deleter>& rendererA);

  static void createTexture(const std::string& name, const std::string& path);
  static void createFont(const std::string& name, const std::string& path);
  static void createSprite(const std::string& name,
                           const std::string& textureName,
                           const int x,
                           const int y,
                           const int w,
                           const int h);
  static AnimationDefinition& createAnimationDefinition(const std::string& name,
                                                        const bool loop);
  static void createSound(const std::string& name, const std::string& path);
  static void createMusic(const std::string& name, const std::string& path);

  static void storeTextTexture(const std::string& name, SDL_Texture* tex);

  static void logSprites();
  static void logAnimationDefinitions();
  static void logFonts();

  static SDL_Texture* getTexture(const std::string& name);
  static SDL_Texture* getTextTexture(const std::string& name);
  static Sprite& getSprite(const std::string& name);
  static bool spriteExists(const std::string& name);
  static AnimationDefinition& getAnimationDefinition(const std::string& name);
  static TTF_Font*
  getFont(const std::string& name, const int sz, const bool isOutline = false);
  static Mix_Chunk* getSound(const std::string& name);
  static Mix_Music* getMusic(const std::string& name);

  static void clear();
};

} // namespace SDL2Wrapper
