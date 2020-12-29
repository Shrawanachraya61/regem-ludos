#include "Game.h"
#include "GameOptions.h"
#include "SDL2Wrapper.h"
#include <ctime>
#include <functional>
#include <iostream>
#include <map>
#include <vector>

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

void loadIntro() {
  SDL2Wrapper::loadAssetsFromFile("sprite", "assets/intro_sprites.txt");
  SDL2Wrapper::loadAssetsFromFile("sound", "assets/intro_sounds.txt");
}

int main(int argc, char* argv[]) {
  std::cout << "[BouncePaddle] Program Begin." << std::endl;
  srand(time(NULL));

  std::vector<std::string> args;
  parseArgs(argc, argv, args);
  bool isPlayingIntro = includes("nointro", args) ? false : true;
  try {
    SDL2Wrapper::Window window(
        "Bounce Paddle", GameOptions::width, GameOptions::height);
    Game game(window);
    bool isBgMoving = true;
    bool isFgShowing = false;
    bool isFading = false;
    SDL2Wrapper::BoolTimer introTimer(window, 3800, isPlayingIntro);
    SDL2Wrapper::BoolTimer introBgTimer(window, 900, isBgMoving);
    SDL2Wrapper::BoolTimer introFadeTimer(window, 1500, isFading);
    SDL2Wrapper::FuncTimer introFgTimer(window, 1200, [&]() {
      isFgShowing = true;
      introFadeTimer.restart();
    });

    auto intro = [&]() {
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
    };

    if (isPlayingIntro) {
      loadIntro();
      window.playSound("cpp_intro");
    }

    // SDL2Wrapper::Store::logFonts();
    // SDL2Wrapper::Store::logSprites();
    // SDL2Wrapper::Store::logAnimationDefinitions();

    window.startRenderLoop([&]() {
      if (isPlayingIntro) {
        intro();
        return true;
      } else {
        return game.loop();
      }
    });

    std::cout << "[BouncePaddle] Program End." << std::endl;
  } catch (const std::string& e) {
    std::cout << e;
  }
  return 0;
}
