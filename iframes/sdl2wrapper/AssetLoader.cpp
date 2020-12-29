#include "AssetLoader.h"
#include "Animation.h"
#include "Logger.h"
#include "Sprite.h"
#include "Store.h"
#include <fstream>
#include <iostream>
#include <sstream>

namespace SDL2Wrapper {
std::string slice(const std::string& str, int a, int b) {
  if (a == b) {
    return std::string("");
  }

  if (b <= 0) {
    b = str.size() + b;
  } else if ((unsigned int)b > str.size()) {
    b = str.size();
  }

  if (a < 0) {
    a = str.size() + a;
  } else if ((unsigned int)a > str.size()) {
    a = str.size();
  }

  if (b <= a || a < 0) {
    return std::string("");
  }

  return str.substr(a, b - a);
}

std::string trim(const std::string& str) {
  if (!str.size()) {
    return std::string(str);
  }

  std::string ret(str);
  int firstNonspace = 0;
  int lastNonspace = str.size() - 1;

  for (unsigned int i = 0; i < str.size(); i++) {
    if (str[i] != ' ' && str[i] != '\n' && str[i] != '\r' && str[i] != '\t') {
      firstNonspace = i;
      break;
    }
  }

  for (int i = (int)str.size() - 1; i >= 0; i--) {
    if (str[i] != ' ' && str[i] != '\n' && str[i] != '\r' && str[i] != '\t') {
      lastNonspace = i;
      break;
    }
  }
  return slice(str, firstNonspace, lastNonspace + 1);
}

void split(const std::string& str,
           const std::string& token,
           std::vector<std::string>& out) {
  if (str.size() == 0) {
    unsigned int len = str.size();
    for (unsigned int i = 0; i < len; ++i) {
      std::string s = std::to_string(str.at(i));
      out.push_back(s);
    }
    return;
  }

  bool searching = true;
  std::size_t firstIndex = 0;
  std::size_t secondIndex = 0;
  while (searching) {
    secondIndex = str.find(token, firstIndex);
    if (secondIndex == std::string::npos || secondIndex < firstIndex) {
      searching = false;
    } else {
      out.push_back(slice(str, firstIndex, secondIndex));
      firstIndex = secondIndex + 1;
    }
  }
  if (secondIndex == 0) {
    out.push_back(str);
  } else {
    out.push_back(slice(str, firstIndex, str.size()));
  }
}

int getLineFromStream(std::istream& is) {
  int lineCount = 1;
  is.clear();
  auto originalPos = is.tellg();
  if (originalPos < 0) {
    return -1;
  }
  is.seekg(0);
  char c;
  while ((is.tellg() < originalPos) && is.get(c)) {
    if (c == '\n') {
      ++lineCount;
    }
  }
  return lineCount;
}

void loadSpriteAssetsFromFile(const std::string& path) {
  std::fstream ifs(path);
  if (!ifs) {
    Logger(ERROR) << "Cannot load image list: " + path << std::endl;
    return;
  }

  try {
    std::string lastPicture = "";
    int lastSpriteInd = 0;

    std::string line;
    while (std::getline(ifs, line)) {
      if (line.size()) {
        line = trim(line);
        std::vector<std::string> arr;
        split(line, ",", arr);
        if (arr[0] == "Picture") {
          lastPicture = arr[1];
          lastSpriteInd = 0;
          Store::createTexture(arr[1], arr[2]);
        } else if (arr[0] == "SpriteList") {
          Sprite& image = Store::getSprite(lastPicture);
          std::string name = arr[1];
          int n = std::stoi(arr[2]) + lastSpriteInd;
          int w = std::stoi(arr[3]);
          int h = std::stoi(arr[4]);
          int num_x = image.cw / w;
          int ctr = 0;
          for (int i = lastSpriteInd; i < n; i++) {
            std::string sprName = name + "_" + std::to_string(ctr);
            Store::createSprite(
                sprName, lastPicture, (i % num_x) * w, (i / num_x) * h, w, h);
            ctr++;
          }
          lastSpriteInd = n;
        } else if (arr[0] == "Sprite") {
          std::string name = arr[1];
          int x = std::stoi(arr[2]);
          int y = std::stoi(arr[3]);
          int w = std::stoi(arr[4]);
          int h = std::stoi(arr[5]);
          Store::createSprite(name, lastPicture, x, y, w, h);
        }
      }
    }
  } catch (std::exception& e) {
    Logger(ERROR) << "Failed to parse sprite list: " << e.what() << std::endl;
    Logger(ERROR) << " LINE: " << getLineFromStream(ifs) << std::endl;
  }
}

void loadAnimationAssetsFromFile(const std::string& path) {
  std::fstream ifs(path);
  if (!ifs) {
    Logger(ERROR) << "Cannot load Animation list: " + path << std::endl;
    return;
  }

  try {
    std::string animName = "";
    std::string line;
    while (std::getline(ifs, line)) {
      if (line == "#") {
        std::string loop;
        std::getline(ifs, animName);
        std::getline(ifs, loop);
        Store::createAnimationDefinition(animName,
                                         (loop == "loop" ? true : false));
      } else if (line.size()) {
        AnimationDefinition& anim = Store::getAnimationDefinition(animName);
        std::stringstream ss;
        ss << line;
        std::string strName;
        std::string strFrames;
        std::getline(ss, strName, ' ');
        std::getline(ss, strFrames, ' ');
        int frames = 0;

        try {
          frames = std::stoi(strFrames);
        } catch (std::exception& e) {
          Logger(ERROR) << "Failed to load anim sprite for: " << animName
                        << std::endl;
          Logger(ERROR) << " FROM: '" << line << "'" << std::endl;
          Logger(ERROR) << " LINE: " << getLineFromStream(ifs) << std::endl;
        }
        anim.addSprite(strName, frames);
      }
    }
  } catch (std::exception& e) {
    Logger(ERROR) << "Failed to parse anim list: " << e.what() << std::endl;
    Logger(ERROR) << " LINE: " << getLineFromStream(ifs) << std::endl;
  }
}

void loadSoundAssetsFromFile(const std::string& path) {
  std::fstream ifs(path);
  if (!ifs) {
    Logger(ERROR) << " ERROR Cannot load sound/music list: " + path
                  << std::endl;
    return;
  }

  try {
    std::string line;
    while (std::getline(ifs, line)) {
      if (line.size()) {
        line = trim(line);
        std::vector<std::string> arr;
        split(line, ",", arr);
        if (arr[0] == "Sound") {
          Store::createSound(arr[1], arr[2]);
        } else if (arr[0] == "Music") {
          Store::createMusic(arr[1], arr[2]);
        }
      }
    }
  } catch (std::exception& e) {
    Logger(ERROR) << "Failed to parse sound/music list: " << e.what()
                  << std::endl;
    Logger(ERROR) << " LINE: " << getLineFromStream(ifs) << std::endl;
  }
}

void loadAssetsFromFile(const std::string& type, const std::string& path) {
  if (type == "sprite") {
    loadSpriteAssetsFromFile(path);
  } else if (type == "animation") {
    loadAnimationAssetsFromFile(path);
  } else if (type == "sound") {
    loadSoundAssetsFromFile(path);
  }
}
} // namespace SDL2Wrapper
