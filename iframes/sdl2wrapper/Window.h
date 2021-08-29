#pragma once

#include <functional>
#include <memory>

#include "SDL2Includes.h"

#include "Animation.h"
#include "Events.h"
#include "Sprite.h"

namespace SDL2Wrapper {

class Window {
  std::unique_ptr<SDL_Window, SDL_Deleter> window;
  std::unique_ptr<SDL_Renderer, SDL_Deleter> renderer;
  std::function<bool(void)> renderCb;
  void (*onresize)(void);
  Events events;

  SDL_Texture* getTextTexture(const std::string& text,
                              const int x,
                              const int y,
                              const int sz,
                              const SDL_Color& color);
  SDL_Texture* getEmptyTexture(int w, int h);
  void onResize(int w, int h);
  void clear();
  void swap();
  void createWindow(const std::string& title, const int w, const int h);

  std::string currentFontName;
  int currentFontSize;
  double deltaTime;
  bool isLooping = false;
  bool firstLoop;
  Uint64 lastFrameTime = 0;
  bool shouldRender = true;
  std::deque<double> pastFrameRatios;

  static int instanceCount;

public:
  int width;
  int height;
  int countedFrames;
  int fps;
  int globalAlpha;
  Uint32 colorkey;
  bool soundForcedDisabled;
  bool isInputEnabled = true;
  std::map<std::string, int> soundChannels;

  static Uint64 now;
  static const double targetFrameMS;
  static bool soundEnabled;
  static int soundPercent;
  static bool soundCanBeLoaded;
  static Window* globalWindow;
  static Window& getGlobalWindow();

  Window();
  Window(const std::string& title, int widthA, int heightA);
  ~Window();

  Events& getEvents();
  void setCurrentFont(const std::string& fontName, const int sz);
  const std::string& getCurrentFontName() const;
  const int getCurrentFontSize() const;
  static Uint64 staticGetNow();
  const double getNow() const;
  const double getDeltaTime() const;
  const double getFrameRatio() const;

  void setAnimationFromDefinition(const std::string& name,
                                  Animation& anim) const;

  const SDL_Color makeColor(Uint8 r, Uint8 g, Uint8 b) const;

  void disableSound();
  void enableSound();
  void playSound(const std::string& name);
  void stopSound(const std::string& name);
  void playMusic(const std::string& name);
  void stopMusic();

  void setBackgroundColor(const SDL_Color& color);

  void drawSprite(const std::string& name,
                  const int x,
                  const int y,
                  const bool centered = true,
                  const double angleDeg = 0,
                  const std::pair<double, double> scale = std::make_pair(1.0,
                                                                         1.0));
  void drawAnimation(
      Animation& anim,
      const int x,
      const int y,
      const bool centered = true,
      const bool updateAnim = true,
      const double angleDeg = 0,
      const std::pair<double, double> scale = std::make_pair(1.0, 1.0));
  void drawText(const std::string& text,
                const int x,
                const int y,
                const SDL_Color& color);
  void drawTextCentered(const std::string& text,
                        const int x,
                        const int y,
                        const SDL_Color& color);
  void renderLoop();
  void startRenderLoop(std::function<bool(void)> cb);
};

} // namespace SDL2Wrapper