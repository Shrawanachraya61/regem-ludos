#include "Store.h"
#include <algorithm>

namespace SDL2Wrapper {
SDL_Renderer* Store::rendererPtr = nullptr;
std::unordered_map<std::string, std::unique_ptr<SDL_Texture, SDL_Deleter>>
    Store::textures;
std::unordered_map<std::string, std::unique_ptr<SDL_Texture, SDL_Deleter>>
    Store::textTextures;
std::unordered_map<std::string, std::unique_ptr<Sprite>> Store::sprites;
std::unordered_map<std::string, std::unique_ptr<AnimationDefinition>>
    Store::anims;
std::unordered_map<std::string, std::unique_ptr<TTF_Font, SDL_Deleter>>
    Store::fonts;
std::unordered_map<std::string, std::unique_ptr<Mix_Chunk, SDL_Deleter>>
    Store::sounds;
std::unordered_map<std::string, std::unique_ptr<Mix_Music, SDL_Deleter>>
    Store::musics;

void throwError(const std::string& errorMessage) {
  std::cout << errorMessage << std::endl;
  throw std::string(errorMessage);
}

Store::Store() {}

Store::~Store() {}

void Store::setRenderer(std::unique_ptr<SDL_Renderer, SDL_Deleter>& rendererA) {
  Store::rendererPtr = rendererA.get();
}

void Store::storeTextTexture(const std::string& name, SDL_Texture* tex) {
  textTextures[name] =
      std::unique_ptr<SDL_Texture, SDL_Deleter>(tex, SDL_Deleter());
}

void Store::createTexture(const std::string& name, const std::string& path) {
  if (Store::rendererPtr == nullptr) {
    return throwError("[SDL2Wrapper] ERROR Cannot create textures without a "
                      "renderer (initialized in Window class).");
  }

  SDL_Texture* tex = nullptr;
  SDL_Surface* loadedImage = nullptr;

  loadedImage = IMG_Load(path.c_str());

  if (loadedImage != nullptr) {
    tex = SDL_CreateTextureFromSurface(Store::rendererPtr, loadedImage);
    if (tex == nullptr) {
      std::cout << "[SDL2Wrapper] WARNING Tried to create texture image "
                   "without creating a screen."
                << std::endl;
      return;
    }
    textures[name] =
        std::unique_ptr<SDL_Texture, SDL_Deleter>(tex, SDL_Deleter());
    createSprite(name, textures[name].get());
    SDL_FreeSurface(loadedImage);
  } else {
    return throwError("[SDL2Wrapper] ERROR Failed to load image '" + path +
                      "' (" + name + ")");
  }
}

void Store::createFont(const std::string& name, const std::string& path) {
  if (!TTF_WasInit() && TTF_Init() == -1) {
    return throwError(
        std::string("[SDL2Wrapper] ERROR Failed to initialize TTF : " +
                    std::string(SDL_GetError())));
  }

  static const std::vector<int> sizes = {
      10, 12, 14, 16, 18, 20, 24, 36, 48, 60, 72};
  for (const int& size : sizes) {
    const std::string key = name + std::to_string(size);
    fonts[key] = std::unique_ptr<TTF_Font, SDL_Deleter>(
        TTF_OpenFont(path.c_str(), size));

    if (!fonts[key]) {
      return throwError("[SDL2Wrapper] ERROR Failed to load font '" + path +
                        "': reason= " + std::string(SDL_GetError()));
    }

    fonts[key + "o"] = std::unique_ptr<TTF_Font, SDL_Deleter>(
        TTF_OpenFont(path.c_str(), size));
    TTF_SetFontOutline(fonts[key + "o"].get(), 1);
  }
}

void Store::createSprite(const std::string& name, SDL_Texture* tex) {
  int width, height;
  SDL_QueryTexture(tex, nullptr, nullptr, &width, &height);
  if (sprites.find(name) == sprites.end()) {
    sprites[name] = std::make_unique<Sprite>(name, 0, 0, width, height, tex);
  } else {
    std::cout << "[SDL2Wrapper] WARNING Sprite with name '" << name
              << "' already exists. '" << name << "'" << std::endl;
  }
}

void Store::createSprite(const std::string& name,
                         const std::string& textureName,
                         const int x,
                         const int y,
                         const int w,
                         const int h) {
  if (sprites.find(name) == sprites.end()) {
    SDL_Texture* tex = getTexture(textureName);
    SDL_SetTextureBlendMode(tex, SDL_BLENDMODE_BLEND);
    sprites[name] = std::make_unique<Sprite>(name, x, y, w, h, tex);
  } else {
    std::cout << "[SDL2Wrapper] WARNING Sprite with name '" << name
              << "' already exists. '" << name << "'" << std::endl;
  }
}

AnimationDefinition& Store::createAnimationDefinition(const std::string& name,
                                                      const bool loop) {
  if (anims.find(name) == anims.end()) {
    anims[name] = std::make_unique<AnimationDefinition>(name, loop);
  } else {
    std::cout << "[SDL2Wrapper] WARNING Cannot create new anim, it already "
                 "exists: '" +
                     name + "'"
              << std::endl;
  }
  return *anims[name];
}
void Store::createSound(const std::string& name, const std::string& path) {
  if (sounds.find(name) == sounds.end()) {
    sounds[name] = std::unique_ptr<Mix_Chunk, SDL_Deleter>(
        Mix_LoadWAV(path.c_str()), SDL_Deleter());
    if (!sounds[name]) {
      throw std::string("[SDL2Wrapper] ERROR Failed to load sound '" + path +
                        "': reason= " + std::string(Mix_GetError()));
    }
  } else {
    std::cout << "[SDL2Wrapper] WARNING Sound with name '" << name
              << "' already exists. '" << name << "'" << std::endl;
  }
}
void Store::createMusic(const std::string& name, const std::string& path) {
  if (musics.find(name) == musics.end()) {
    musics[name] = std::unique_ptr<Mix_Music, SDL_Deleter>(
        Mix_LoadMUS(path.c_str()), SDL_Deleter());
    if (!musics[name]) {
      throw std::string("[SDL2Wrapper] ERROR Failed to load music '" + path +
                        "': reason= " + std::string(Mix_GetError()));
    }
  } else {
    std::cout << "[SDL2Wrapper] WARNING Music with name '" << name
              << "' already exists. '" << name << "'" << std::endl;
  }
}

void Store::logSprites() {
  std::cout << "[SDL2Wrapper] Sprites:" << std::endl;
  std::vector<std::string> localSprites;
  localSprites.reserve(sprites.size());
  std::transform(sprites.begin(),
                 sprites.end(),
                 std::back_inserter(localSprites),
                 [](const auto& p) -> std::string { return p.first; });
  std::sort(localSprites.begin(), localSprites.end());
  for (auto& it : localSprites) {
    std::cout << " " << it << std::endl;
  }
}
void Store::logAnimationDefinitions() {
  std::cout << "[SDL2Wrapper] AnimationDefinitions:" << std::endl;
  std::vector<std::string> localAnims;
  localAnims.reserve(anims.size());
  std::transform(anims.begin(),
                 anims.end(),
                 std::back_inserter(localAnims),
                 [](const auto& p) -> std::string { return p.first; });
  std::sort(localAnims.begin(), localAnims.end());
  for (auto& it : localAnims) {
    std::cout << " " << it << std::endl;
  }
}

void Store::logFonts() {
  std::cout << "[SDL2Wrapper] Fonts:" << std::endl;
  for (auto& it : fonts) {
    std::cout << " " << it.first << std::endl;
  }
}

SDL_Texture* Store::getTexture(const std::string& name) {
  auto pair = textures.find(name);
  if (pair != textures.end()) {
    return pair->second.get();
  } else {
    throwError(std::string("[SDL2Wrapper] ERROR Cannot get Image '" + name +
                           "' because it has not been loaded."));
    throw std::runtime_error("fail");
  }
}

SDL_Texture* Store::getTextTexture(const std::string& key) {
  auto pair = textTextures.find(key);
  if (pair != textTextures.end()) {
    return pair->second.get();
  } else {
    return nullptr;
  }
}

Sprite& Store::getSprite(const std::string& name) {
  auto pair = sprites.find(name);
  if (pair != sprites.end()) {
    return *pair->second;
  } else {
    logSprites();
    throwError(std::string("[SDL2Wrapper] ERROR Cannot get Sprite '" + name +
                           "' because it has not been created."));
    throw std::runtime_error("fail");
  }
}

AnimationDefinition& Store::getAnimationDefinition(const std::string& name) {
  auto pair = anims.find(name);
  if (pair != anims.end()) {
    return *pair->second;
  } else {
    throwError(
        std::string("[SDL2Wrapper] ERROR Cannot get AnimationDefinition '" +
                    name + "' because it has not been created."));
    throw std::runtime_error("fail");
  }
}

TTF_Font*
Store::getFont(const std::string& name, const int sz, const bool isOutline) {
  const std::string key = name + std::to_string(sz) + (isOutline ? "o" : "");
  auto pair = fonts.find(key);
  if (pair != fonts.end()) {
    return pair->second.get();
  } else {
    throwError(std::string("[SDL2Wrapper] ERROR Cannot get Font '" + key +
                           "' because it has not been created."));
    throw std::runtime_error("fail");
  }
}

Mix_Chunk* Store::getSound(const std::string& name) {
  auto pair = sounds.find(name);
  if (pair != sounds.end()) {
    return pair->second.get();
  } else {
    throwError(std::string("[SDL2Wrapper] ERROR Cannot get Sound '" + name +
                           "' because it has not been loaded."));
    throw std::runtime_error("fail");
  }
}
Mix_Music* Store::getMusic(const std::string& name) {
  auto pair = musics.find(name);
  if (pair != musics.end()) {
    return pair->second.get();
  } else {
    throwError(std::string("[SDL2Wrapper] ERROR Cannot get Music '" + name +
                           "' because it has not been loaded."));
    throw std::runtime_error("fail");
  }
}

void Store::clear() {
  textures.clear();
  textTextures.clear();
  sprites.clear();
  anims.clear();
  fonts.clear();
  sounds.clear();
  musics.clear();
}

} // namespace SDL2Wrapper
