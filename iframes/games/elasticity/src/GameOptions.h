#pragma once

#include <string>

class GameOptions {
public:
  static const std::string programName;
  static const int width;
  static const int height;
  static const int spriteSize;
  static const int playerSpeed;

private:
  GameOptions();
};
