#include "Game.h"
#include "GameOptions.h"
#include "SDL2Wrapper.h"
#include <ctime>
#include <functional>
#include <iostream>
#include <map>
#include <vector>

#include "Game.h"
#include "GameOptions.h"
#include "LibHTML.h"
#include "SDL2Wrapper.h"
#include <ctime>
#include <functional>
#include <iostream>
#include <map>
#include <vector>

#define PROGRAM_NAME "Invaderz"

void parseArgs(int argc, char* argv[], std::vector<std::string>& args) {
  for (int i = 0; i < argc; i++) {
    std::string arg = argv[i];
    if (arg.size() > 2 && arg.at(0) == '-' && arg.at(1) == '-') {
      arg = arg.substr(2);
      args.push_back(arg);
    }
  }
}

bool includes(const std::string& arg, const std::vector<std::string>& args) {
  if (std::find(args.begin(), args.end(), arg) != args.end()) {
    return true;
  } else {
    return false;
  }
}

class Intro {
public:
  bool isPlayingIntro;
  bool isBgMoving;
  bool isFgShowing;
  bool isFading;
  SDL2Wrapper::BoolTimer introTimer;
  SDL2Wrapper::BoolTimer introBgTimer;
  SDL2Wrapper::BoolTimer introFadeTimer;
  SDL2Wrapper::FuncTimer introFgTimer;
  Intro(SDL2Wrapper::Window& window)
      : isPlayingIntro(true),
        isBgMoving(true),
        isFgShowing(false),
        isFading(false),
        introTimer(SDL2Wrapper::BoolTimer(window, 3800, isPlayingIntro)),
        introBgTimer(SDL2Wrapper::BoolTimer(window, 900, isBgMoving)),
        introFadeTimer(SDL2Wrapper::BoolTimer(window, 900, isFading)),
        introFgTimer(SDL2Wrapper::FuncTimer(window, 1200, [&]() {
          isFgShowing = true;
          introFadeTimer.restart();
        })) {}
  ~Intro() {}
  void load() {
    SDL2Wrapper::loadAssetsFromFile("sprite", "assets/intro_sprites.txt");
    SDL2Wrapper::loadAssetsFromFile("sound", "assets/intro_sounds.txt");
  }
  void render(SDL2Wrapper::Window& window) {
    introTimer.update();
    introBgTimer.update();
    introFgTimer.update();
    double introOffset = (512.0 * introBgTimer.getPctComplete());
    window.drawSprite("cpp_splash_bg", 0, 0, false);
    if (isBgMoving) {
      window.drawSprite("cpp_splash_black", introOffset, 0, false);
    }
    if (isFgShowing) {
      window.globalAlpha =
          static_cast<int>(introFadeTimer.getPctComplete() * 255);
      window.drawSprite("cpp_splash_black", 0, 0, false);
      window.globalAlpha = 255;
      window.drawSprite("cpp_splash_fg", 0, 0, false);
      introFadeTimer.update();
    }

    if (introTimer.shouldRemove()) {
      introTimer.remove();
    }
    if (introBgTimer.shouldRemove()) {
      introBgTimer.remove();
    }
    if (introFgTimer.shouldRemove()) {
      introFgTimer.remove();
    }
  }
};

int main(int argc, char* argv[]) {
  SDL2Wrapper::Logger(PROGRAM_NAME) << " Program Begin." << std::endl;
  srand(time(NULL));

  std::vector<std::string> args;
  parseArgs(argc, argv, args);
  try {
    SDL2Wrapper::Window window(
        PROGRAM_NAME, GameOptions::width, GameOptions::height);
    Game game(window);
    Intro intro(window);

    intro.isPlayingIntro = includes("nointro", args) ? false : true;

    if (intro.isPlayingIntro) {
      intro.load();
      window.playSound("cpp_intro");
    }

    // SDL2Wrapper::Store::logFonts();
    // SDL2Wrapper::Store::logSprites();
    // SDL2Wrapper::Store::logAnimationDefinitions();

    bool firstRender = true;

    window.startRenderLoop([&]() {
      if (intro.isPlayingIntro) {
        intro.render(window);
        return true;
      } else {
        if (firstRender) {
          game.enableMenu();
          firstRender = false;
        }
        return game.loop();
      }
    });

    SDL2Wrapper::Logger(PROGRAM_NAME) << "Program End." << std::endl;
  } catch (const std::string& e) {
    std::cout << e;
  }
  return 0;
}
