#pragma once

#include "Actor.h"

class Projectile : public Actor
{
	double speed;
	std::string type;

public:
	int allegiance;
	int damage;
	Projectile(Game &gameA, const std::string &spriteBaseA, const int allegianceA, const double speedA, const int damageA);
	const std::string &getType() const;
	void onCollision(Ship &ship);
	void update();
};
