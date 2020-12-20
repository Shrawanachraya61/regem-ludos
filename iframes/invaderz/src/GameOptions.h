#pragma once

class GameOptions
{
public:
	static const int width;
	static const int height;
	static const int spriteSize;
	static const int playerSpeed;
	static const int playerProjDamage;
	static const int playerProjSpeed;
	static const int playerFireCooldown;
	static const int playerShipHP;
	static const int enemyShipHP;
	static const int enemyFireRate;
	static const int enemyShipMaxSpeed;
	static const int enemyProjDamage;
	static const int enemyProjSpeed;
	static const int enemyProjDamage2;
	static const int enemyProjSpeed2;
	static const int shipCollideDamage;
	static const int pointsPerDestroyedShip;
	static const int pointsPerDestroyedShip2;
	static const int pointsLostPerShot;

private:
	GameOptions();
};
