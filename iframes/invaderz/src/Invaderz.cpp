#include <iostream>
#include "Game.h"
#include "GameOptions.h"
#include "sdl2wrapper/SDL2Wrapper.h"
#include <ctime>
#include <functional>
#include <map>
#include <vector>

int main(int argc, char *argv[])
{
	std::cout << "[Invaderz] Program Start." << std::endl;
	srand(time(NULL));

	try
	{
		SDL2Wrapper::Window window("Invaderz", GameOptions::width, GameOptions::height);
		Game game(window);

		// SDL2Wrapper::Store::logFonts();
		// SDL2Wrapper::Store::logSprites();
		// SDL2Wrapper::Store::logAnimationDefinitions();
		window.startRenderLoop([&]() { return game.loop(); });

		std::cout << "[Invaderz] Program End." << std::endl;
	}
	catch (const std::string &e)
	{
		std::cout << e;
	}

	std::cout << "end." << std::endl;
	return 0;
}
