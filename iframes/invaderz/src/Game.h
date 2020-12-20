#pragma once

#include "sdl2wrapper/SDL2Wrapper.h"

#include <string>
#include <vector>
#include <memory>

class Actor;
class Ship;
class Projectile;

enum Allegiances
{
	PLAYER = 0,
	ENEMY = 1
};

class Game
{
	bool shouldDrawMenu;
	bool shouldExit;
	bool shouldPlayHiscoreSound;
	int score;
	int lastScore;

public:
	SDL2Wrapper::Window &window;
	std::vector<int> background;

	std::unique_ptr<Ship> playerShip;
	std::vector<std::unique_ptr<Ship>> enemyShips;
	std::vector<std::unique_ptr<Projectile>> projectiles;
	std::vector<std::unique_ptr<SDL2Wrapper::Timer>> timers;

	int width;
	int height;
	bool playerMayFire;
	int enemyFireRate;

	Game(SDL2Wrapper::Window &windowA);
	~Game();
	void initPlayer();
	void initWorld();
	void enableMenu();
	void disableMenu();
	void spawnEnemyShips(const int amount);
	void addProjectile(const std::string &type, const int x, const int y);
	void addBoolTimer(const int maxFrames, bool &ref);
	void modifyScore(const int value);
	void handleKeyDown(const std::string &key);
	void handleKeyUp(const std::string &key);
	void handleKeyUpdate();
	void handleKeyMenu(const std::string &key);
	void handleGameOver();
	bool collidesWith(Actor &a, Actor &b);
	void checkCollisions(Ship &a);
	void checkGameOver();
	void drawMenu();
	void drawUI();
	void drawStars();
	void drawEnemyShips();
	void drawProjectiles();
	bool menuLoop();
	bool gameLoop();
	bool loop();
};
