#include "Game.h"
#include "GameOptions.h"
#include "SDL2Wrapper.h"
#include <ctime>
#include <functional>
#include <iostream>
#include <map>
#include <vector>

int main(int argc, char* argv[]) {
  std::cout << "[BouncePaddle] Program Begin." << std::endl;
  srand(time(NULL));

  try {
    SDL2Wrapper::Window window(
        "Bounce Paddle", GameOptions::width, GameOptions::height);
    Game game(window);

    // SDL2Wrapper::Store::logFonts();
    // SDL2Wrapper::Store::logSprites();
    // SDL2Wrapper::Store::logAnimationDefinitions();
    window.startRenderLoop([&]() { return game.loop(); });

    std::cout << "[BouncePaddle] Program End." << std::endl;
  } catch (const std::string& e) {
    std::cout << e;
  }
  return 0;
}
