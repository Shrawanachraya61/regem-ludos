#pragma once

#include <iostream>
#include <string>

namespace SDL2Wrapper {

enum typelog { DEBUG, INFO, WARN, ERROR };

class Logger {
public:
  Logger() {}
  Logger(typelog type) { operator<<("[" + getLabel(type) + "] "); }
  Logger(const std::string& type) { operator<<("[" + type + "] "); }
  ~Logger() {}

  template <class T> Logger operator<<(const T& msg) {
    std::cout << msg;
    return *this;
  }
  typedef Logger& (*StreamManipulator)(Logger&);
  typedef std::basic_ostream<char, std::char_traits<char>> CoutType;
  typedef CoutType& (*StandardEndLine)(CoutType&);
  Logger& operator<<(const StandardEndLine manipulate) {
    manipulate(std::cout);
    return *this;
  }

private:
  inline std::string getLabel(typelog type) {
    std::string label;
    switch (type) {
    case DEBUG:
      label = "SDL2Wrapper:DEBUG";
      break;
    case INFO:
      label = "SDL2Wrapper:INFO";
      break;
    case WARN:
      label = "SDL2Wrapper:WARN";
      break;
    case ERROR:
      label = "SDL2Wrapper:ERROR";
      break;
    }
    return label;
  }
};
} // namespace SDL2Wrapper
