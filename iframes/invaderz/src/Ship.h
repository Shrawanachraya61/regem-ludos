#pragma once

#include "Actor.h"

class Ship : public Actor
{
	double speed;
	bool shouldSwitchToDefaultState;

public:
	int allegiance;
	int hp;
	Ship(Game &gameA, const std::string &spriteBaseA, const int allegianceA, const int hp);
	~Ship();
	bool isExploding() const;
	void onCollision(Projectile &proj);
	void onCollision(Ship &ship);
	void update();
};
