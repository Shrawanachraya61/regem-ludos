#include "Window.h"
#include "Logger.h"
#include "Store.h"
#include "Timer.h"
#include <algorithm>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/html5.h>

extern "C" {
EMSCRIPTEN_KEEPALIVE
void enableSound() {
  SDL2Wrapper::Window::soundEnabled = true;
  int volumePct = SDL2Wrapper::Window::soundPercent;
  if (Mix_PlayingMusic()) {
    Mix_VolumeMusic(double(volumePct / 100) * double(MIX_MAX_VOLUME));
  }
  Mix_Volume(-1, double(volumePct / 100) * double(MIX_MAX_VOLUME));
  SDL2Wrapper::Logger(SDL2Wrapper::DEBUG) << "Enable sound" << std::endl;
}
EMSCRIPTEN_KEEPALIVE
void disableSound() {
  SDL2Wrapper::Window::soundEnabled = false;
  if (Mix_PlayingMusic()) {
    Mix_VolumeMusic(0);
  }
  Mix_Volume(-1, 0);
  SDL2Wrapper::Logger(SDL2Wrapper::DEBUG) << "Disable sound" << std::endl;
}
EMSCRIPTEN_KEEPALIVE
void setVolume(int volumePct) {
  SDL2Wrapper::Window::soundPercent = volumePct;
  if (Mix_PlayingMusic()) {
    Mix_VolumeMusic(double(volumePct / 100) * double(MIX_MAX_VOLUME));
  }
  Mix_Volume(-1, double(volumePct / 100) * double(MIX_MAX_VOLUME));
  SDL2Wrapper::Logger(SDL2Wrapper::DEBUG)
      << "Set volume:" << volumePct << "%" << std::endl;
}
EMSCRIPTEN_KEEPALIVE
void setKeyDown(int key) {
  SDL2Wrapper::Window& window = SDL2Wrapper::Window::getGlobalWindow();
  SDL2Wrapper::Events& events = window.getEvents();
  events.keydown(key);
  SDL2Wrapper::Logger(SDL2Wrapper::DEBUG)
      << "External set key down: " << key << std::endl;
}
EMSCRIPTEN_KEEPALIVE
void setKeyUp(int key) {
  SDL2Wrapper::Window& window = SDL2Wrapper::Window::getGlobalWindow();
  SDL2Wrapper::Events& events = window.getEvents();
  events.keyup(key);
  SDL2Wrapper::Logger(SDL2Wrapper::DEBUG)
      << "External set key up: " << key << std::endl;
}

EMSCRIPTEN_KEEPALIVE
void setKeyStatus(int status) {
  SDL2Wrapper::Window& window = SDL2Wrapper::Window::getGlobalWindow();
  window.isInputEnabled = !!status;
  SDL2Wrapper::Logger(SDL2Wrapper::DEBUG)
      << "External set key status: " << window.isInputEnabled << std::endl;
}
}
#endif

namespace SDL2Wrapper {

int Window::instanceCount = 0;
Uint64 Window::now = 0;
bool Window::soundEnabled = true;
int Window::soundPercent = 100;
const double Window::targetFrameMS = 16.0;
Window* Window::globalWindow = nullptr;

void windowThrowError(const std::string& errorMessage) {
  Logger(ERROR) << errorMessage;
  throw std::string(errorMessage);
}

Window::Window() : events(*this) {
  Window::globalWindow = this;
  globalAlpha = 255;
  fps = 60;
  countedFrames = 0;
  height = 512;
  width = 512;
  firstLoop = true;
  deltaTime = 0;
  currentFontSize = 20;
  onresize = nullptr;
  soundForcedDisabled = false;
}
Window::Window(const std::string& title, int widthA, int heightA)
    : events(*this), currentFontSize(18), deltaTime(0), globalAlpha(255) {
  Window::instanceCount++;
  firstLoop = true;
  Window::soundEnabled = true;
  createWindow(title, widthA, heightA);
  Window::globalWindow = this;
  fps = 60;
  countedFrames = 0;
  height = 512;
  width = 512;
  firstLoop = true;
  onresize = nullptr;
  soundEnabled = true;
  soundForcedDisabled = false;
}

Window::~Window() {
  Window::instanceCount--;
  if (Window::instanceCount == 0) {
    Store::clear();
    Mix_Quit();
    IMG_Quit();
    TTF_Quit();
    SDL_Quit();
  }
}

Window& Window::getGlobalWindow() { return *Window::globalWindow; }

void Window::createWindow(const std::string& title, const int w, const int h) {
  SDL_Init(SDL_INIT_EVERYTHING);
  SDL_SetHint(SDL_HINT_RENDER_DRIVER, "opengl");
  colorkey = 0x00FFFFFF;
  width = w;
  height = h;

  window = std::unique_ptr<SDL_Window, SDL_Deleter>(
      SDL_CreateWindow(title.c_str(),
                       SDL_WINDOWPOS_UNDEFINED,
                       SDL_WINDOWPOS_UNDEFINED,
                       width,
                       height,
                       SDL_WINDOW_SHOWN),
      SDL_Deleter());
  if (window == NULL) {
    windowThrowError("Window could not be created! SDL Error: " +
                     std::string(SDL_GetError()));
    throw new std::runtime_error("");
  }
  if (Mix_OpenAudio(44100, MIX_DEFAULT_FORMAT, 8, 2048) < 0) {
    Logger(ERROR) << "SDL_mixer could not initialize! "
                  << std::string(Mix_GetError()) << std::endl;
    soundForcedDisabled = true;
  }

#ifdef __EMSCRIPTEN__
  renderer = std::unique_ptr<SDL_Renderer, SDL_Deleter>(
      SDL_CreateRenderer(window.get(),
                         -1,
                         SDL_RENDERER_ACCELERATED | SDL_RENDERER_PRESENTVSYNC |
                             SDL_RENDERER_TARGETTEXTURE),
      SDL_Deleter());
#else
  renderer = std::unique_ptr<SDL_Renderer, SDL_Deleter>(
      SDL_CreateRenderer(window.get(), -1, SDL_RENDERER_ACCELERATED),
      SDL_Deleter());
#endif
  SDL_SetRenderDrawColor(renderer.get(), 0x55, 0x55, 0x55, 0xFF);

  Store::setRenderer(renderer);
}

Events& Window::getEvents() { return events; }

void Window::setBackgroundColor(const SDL_Color& color) {
  SDL_SetRenderDrawColor(renderer.get(), color.r, color.g, color.b, color.a);
}

void Window::setCurrentFont(const std::string& fontName, const int sz) {
  currentFontName = fontName;
  currentFontSize = sz;
}
const std::string& Window::getCurrentFontName() const {
  return currentFontName;
}
const int Window::getCurrentFontSize() const { return currentFontSize; }
Uint64 Window::staticGetNow() { return Window::now; }
const double Window::getNow() const { return SDL_GetPerformanceCounter(); }
const double Window::getDeltaTime() const { return deltaTime; }
const double Window::getFrameRatio() const {
  double sum = 0;
  for (double r : pastFrameRatios) {
    sum += r;
  }
  return sum / pastFrameRatios.size();
}
void Window::setAnimationFromDefinition(const std::string& name,
                                        Animation& anim) const {
  anim = Animation(Store::getAnimationDefinition(name));
}

const SDL_Color Window::makeColor(Uint8 r, Uint8 g, Uint8 b) const {
  SDL_Color c = {r, g, b};
  return c;
}

void Window::disableSound() { Window::soundEnabled = false; }
void Window::enableSound() { Window::soundEnabled = true; }
void Window::playSound(const std::string& name) {
  if (soundForcedDisabled) {
    return;
  }

  Mix_Chunk* sound = Store::getSound(name);
  int channel = Mix_PlayChannel(-1, sound, 0);
  if (channel == -1) {
    Logger(WARN) << "Unable to play sound in channel.  sound=" << name
                 << " err=" << SDL_GetError() << std::endl;
    return;
  }
  Mix_Volume(channel,
             double(Window::soundPercent) / 100.0 * double(MIX_MAX_VOLUME));
  soundChannels[name] = channel;
}
void Window::stopSound(const std::string& name) {
  if (soundChannels.find(name) != soundChannels.end()) {
    int channel = soundChannels[name];
    Mix_HaltChannel(channel);
  }
}
void Window::playMusic(const std::string& name) {
  if (soundForcedDisabled) {
    return;
  }

  Mix_Music* music = Store::getMusic(name);
  if (Mix_PlayingMusic()) {
    stopMusic();
  }
  Mix_PlayMusic(music, -1);
}
void Window::stopMusic() {
  if (!Window::soundEnabled) {
    return;
  }

  if (Mix_PlayingMusic()) {
    Mix_HaltMusic();
  }
}

SDL_Texture* Window::getTextTexture(const std::string& text,
                                    const int x,
                                    const int y,
                                    const int sz,
                                    const SDL_Color& color) {
  if (!currentFontName.size()) {
    windowThrowError("No font has been set.");
    throw new std::runtime_error("");
  }

  const std::string key = text + std::to_string(sz) + std::to_string(color.r) +
                          std::to_string(color.g) + std::to_string(color.b);
  SDL_Texture* tex = Store::getTextTexture(key);
  if (tex) {
    return tex;
  } else {
    TTF_Font* font = Store::getFont(currentFontName, sz);
    SDL_Surface* surf = TTF_RenderText_Solid(font, text.c_str(), color);
    SDL_Texture* texPtr = SDL_CreateTextureFromSurface(renderer.get(), surf);
    SDL_FreeSurface(surf);
    Store::storeTextTexture(key, texPtr);
    return Store::getTextTexture(key);
  }
}

void Window::drawSprite(const std::string& name,
                        const int x,
                        const int y,
                        const bool centered,
                        const double angleDeg,
                        const std::pair<double, double> scale) {
  const Sprite& sprite = Store::getSprite(name);
  SDL_Texture* tex = sprite.image;
  SDL_SetTextureBlendMode(tex, SDL_BLENDMODE_BLEND);
  SDL_SetTextureAlphaMod(tex, globalAlpha);

  double scaledX = double(sprite.cw) * scale.first;
  double scaledY = double(sprite.ch) * scale.second;
  SDL_Rect pos = {x + (centered ? -sprite.cw / 2 : 0),
                  y + (centered ? -sprite.ch / 2 : 0),
                  static_cast<int>(floor(scaledX)),
                  static_cast<int>(floor(scaledY))};
  SDL_Rect clip = {sprite.cx, sprite.cy, sprite.cw, sprite.ch};
  SDL_SetRenderDrawBlendMode(renderer.get(), SDL_BLENDMODE_BLEND);
  SDL_RenderCopyEx(
      renderer.get(), tex, &clip, &pos, angleDeg, NULL, SDL_FLIP_NONE);
}

void Window::drawAnimation(Animation& anim,
                           const int x,
                           const int y,
                           const bool centered,
                           const bool updateAnim,
                           const double angle,
                           const std::pair<double, double> scale) {
  if (anim.isInitialized()) {
    drawSprite(anim.getCurrentSpriteName(), x, y, centered);
    if (updateAnim) {
      anim.update();
    }
  } else {
    windowThrowError("Anim has not been initialized: '" + anim.toString() +
                     "'");
    throw new std::runtime_error("");
  }
}

void Window::drawText(const std::string& text,
                      const int x,
                      const int y,
                      const SDL_Color& color) {
  SDL_Texture* tex = getTextTexture(text, x, y, currentFontSize, color);

  int w, h;
  SDL_QueryTexture(tex, NULL, NULL, &(w), &(h));
  SDL_SetTextureAlphaMod(tex, globalAlpha);
  SDL_Rect pos = {x, y, w, h};
  SDL_SetRenderDrawBlendMode(renderer.get(), SDL_BLENDMODE_BLEND);
  SDL_RenderCopy(renderer.get(), tex, NULL, &pos);
}

void Window::drawTextCentered(const std::string& text,
                              const int x,
                              const int y,
                              const SDL_Color& color) {
  SDL_Texture* tex = getTextTexture(text, x, y, currentFontSize, color);

  int w, h;
  SDL_QueryTexture(tex, NULL, NULL, &(w), &(h));
  SDL_SetTextureAlphaMod(tex, globalAlpha);
  SDL_Rect pos = {x - w / 2, y - h / 2, w, h};
  SDL_SetRenderDrawBlendMode(renderer.get(), SDL_BLENDMODE_BLEND);
  SDL_RenderCopy(renderer.get(), tex, NULL, &pos);
}

void Window::renderLoop() {
  Uint64 nowMicroSeconds = SDL_GetPerformanceCounter();
  double freq = (double)SDL_GetPerformanceFrequency();
  now = (nowMicroSeconds * 1000) / freq;

  if (!freq) {
    freq = 1;
  }
  if (firstLoop) {
    deltaTime = 16.6666;
    firstLoop = false;
    pastFrameRatios.push_back(1.0);
  } else {
    deltaTime = (nowMicroSeconds - lastFrameTime) * 1000 / freq;
  }
  lastFrameTime = nowMicroSeconds;
  double d = deltaTime / Window::targetFrameMS;
  pastFrameRatios.push_back(std::min(d, 2.0));
  if (pastFrameRatios.size() > 10) {
    pastFrameRatios.pop_front();
  }

  SDL_Event e;
  while (SDL_PollEvent(&e) != 0) {
#ifdef __EMSCRIPTEN__
    if (e.type == SDL_QUIT) {
      Logger(WARN) << "QUIT is overridden in EMSCRIPTEN" << std::endl;
      break;
    }
#else
    if (e.type == SDL_QUIT) {
      isLooping = false;
      break;
    }
#endif
    else if (e.window.event == SDL_WINDOWEVENT_FOCUS_GAINED) {
      break;
    } else if (e.window.event == SDL_WINDOWEVENT_FOCUS_LOST) {
      break;
    } else if (e.type == SDL_KEYDOWN) {
      if (isInputEnabled) {
        events.keydown(e.key.keysym.sym);
      }
    } else if (e.type == SDL_KEYUP) {
      if (isInputEnabled) {
        events.keyup(e.key.keysym.sym);
      }
    } else if (e.type == SDL_MOUSEMOTION) {
      if (isInputEnabled) {
        int x, y;
        SDL_GetMouseState(&x, &y);
        events.mousemove(x, y);
      }
    } else if (e.type == SDL_MOUSEBUTTONDOWN) {
      if (isInputEnabled) {
        int x, y;
        SDL_GetMouseState(&x, &y);
        events.mousedown(x, y, (int)e.button.button);
      }
    } else if (e.type == SDL_MOUSEBUTTONUP) {
      if (isInputEnabled) {
        int x, y;
        SDL_GetMouseState(&x, &y);
        events.mouseup(x, y, (int)e.button.button);
      }
    }
  }
  if (!isLooping) {
    return;
  }

  SDL_RenderClear(renderer.get());
  isLooping = renderCb();
  events.update();
  SDL_RenderPresent(renderer.get());
  firstLoop = false;
}

#ifdef __EMSCRIPTEN__
void RenderLoopCallback(void* arg) { static_cast<Window*>(arg)->renderLoop(); }
#endif
void Window::startRenderLoop(std::function<bool(void)> cb) {
  firstLoop = true;
  renderCb = cb;
  isLooping = true;
  Window::now = SDL_GetPerformanceCounter();

#ifdef __EMSCRIPTEN__
  // Receives a function to call and some user data to provide it.
  emscripten_set_main_loop_arg(&RenderLoopCallback, this, -1, 1);
#else
  while (isLooping) {
    if (shouldRender) {
      renderLoop();
    } else {
      SDL_Delay(33);
    }
  }
#endif
}

} // namespace SDL2Wrapper
