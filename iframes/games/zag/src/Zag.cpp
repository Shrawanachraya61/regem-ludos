#include "Game.h"
#include "GameOptions.h"
#include "SDL2Wrapper.h"
#include <ctime>
#include <functional>
#include <iostream>
#include <map>
#include <vector>

#include "LibHTML.h"

const std::string GameOptions::programName = "Zag";
const int GameOptions::width = 512;
const int GameOptions::height = 512;

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

int main(int argc, char* argv[]) {
  SDL2Wrapper::Logger(GameOptions::programName)
      << "Program Begin." << std::endl;
  srand(time(NULL));

  std::vector<std::string> args;
  parseArgs(argc, argv, args);
  try {
    SDL2Wrapper::Window window(
        GameOptions::programName, GameOptions::width, GameOptions::height);
    SDL2Wrapper::Store::createFont("default", "assets/monofonto.ttf");
    window.setCurrentFont("default", 18);

    Game::loadAssets(window);
    Game game(window);

    SDL2Wrapper::loadAssetsFromFile("sprite", "assets/intro/intro_sprites.txt");
    SDL2Wrapper::loadAssetsFromFile("sound", "assets/intro/intro_sounds.txt");

    bool isWaitingToStart = includes("wait", args) ? true : false;

    // SDL2Wrapper::Store::logFonts();
    // SDL2Wrapper::Store::logSprites();
    // SDL2Wrapper::Store::logAnimationDefinitions();

    bool firstRender = true;

    if (isWaitingToStart) {
      auto pressButton = [&](const std::string& key) {
        isWaitingToStart = false;
      };
      SDL2Wrapper::Events& events = window.getEvents();
      events.setKeyboardEvent("keydown", pressButton);
    }

    notifyGameReady();

    std::cout << "Is waiting to start " << isWaitingToStart << std::endl;

    window.startRenderLoop([&]() {
      if (isWaitingToStart) {
        window.setCurrentFont("default", 20);
        window.drawSprite("cpp_splash_bg", 0, 0, false);
        window.drawTextCentered(
            "Press button.", 256, 256, window.makeColor(255, 255, 255));
        return true;
      } else {
        if (firstRender) {
          game.setState(GAME_STATE_MENU);
          firstRender = false;
        }
        return game.loop();
      }
    });

    SDL2Wrapper::Logger(GameOptions::programName)
        << "Program End." << std::endl;
  } catch (const std::string& e) {
    std::cout << e;
  }
  return 0;
}
