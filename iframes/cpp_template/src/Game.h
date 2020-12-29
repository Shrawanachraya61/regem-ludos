#pragma once

#include "SDL2Wrapper.h"

#include <string>
#include <vector>
#include <memory>

class Actor;

class Game
{
	bool shouldDrawMenu;
	bool shouldExit;
	bool shouldPlayHiscoreSound;
	int score;
	int lastScore;

	Actor* test;

public:
	SDL2Wrapper::Window &window;
	std::vector<int> background;
	std::vector<std::unique_ptr<SDL2Wrapper::Timer>> timers;

	int width;
	int height;

	Game(SDL2Wrapper::Window &windowA);
	~Game();
	void initPlayer();
	void initWorld();
	void enableMenu();
	void disableMenu();
	void addBoolTimer(const int maxFrames, bool &ref);
	void modifyScore(const int value);
	void handleKeyDown(const std::string &key);
	void handleKeyUp(const std::string &key);
	void handleKeyUpdate();
	void handleKeyMenu(const std::string &key);
	void handleGameOver();
	bool collidesWith(Actor &a, const Actor &b);
	void checkCollisions();
	void checkGameOver();
	void drawMenu();
	void drawUI();
	bool menuLoop();
	bool gameLoop();
	bool loop();
};
