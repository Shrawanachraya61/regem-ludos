#include "Physics.h"
#include "Game.h"

Circle::Circle(double xA, double yA, double rA) : x(xA), y(yA), r(rA) {}
void Circle::print() {
  std::cout << "Circle: " << x << "," << y << "," << r << std::endl;
}

Rect::Rect(double xA, double yA, double wA, double hA)
    : x(xA), y(yA), w(wA), h(hA) {}
void Rect::print() {
  std::cout << "Rect: " << x << "," << y << "," << w << "," << h << std::endl;
}

float distance(const int x1, const int y1, const int x2, const int y2) {
  return sqrt(pow(x2 - x1, 2) + pow(y2 - y1, 2));
}

std::string collidesCircleRect(const Circle& c, const Rect& r2) {
  Rect r1(c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
  double dx = (r1.x + r1.w / 2) - (r2.x + r2.w / 2);
  double dy = (r1.y + r1.h / 2) - (r2.y + r2.h / 2);
  double width = (r1.w + r2.w) / 2;
  double height = (r1.h + r2.h) / 2;
  double crossWidth = width * dy;
  double crossHeight = height * dx;
  std::string collision = "none";

  if (abs(dx) <= width && abs(dy) <= height) {
    if (crossWidth > crossHeight) {
      collision = (crossWidth > (-crossHeight)) ? "bottom" : "left";
    } else {
      collision = (crossWidth > -(crossHeight)) ? "right" : "top";
    }

    if (c.x <= r2.x && c.y <= r2.y) {
      collision = "top-left";
    } else if (c.x >= r2.x + r2.w && c.y <= r2.y) {
      collision = "top-right";
    } else if (c.x <= r2.x && c.y >= r2.y + r2.h) {
      collision = "bottom-left";
    } else if (c.x >= r2.x + r2.w && c.y >= r2.y + r2.h) {
      collision = "bottom-right";
    }
  }

  return collision;
}
bool collidesCircleCircle(const Circle& c1, const Circle& c2) {
  float d = distance(c1.x, c1.y, c2.x, c2.y);
  if (d < c1.r + c2.r) {
    return true;
  }
  return false;
}

std::pair<double, double> getNormalizedVec(const double x, const double y) {
  double d = sqrt(x * x + y * y);
  return std::make_pair(x / d, y / d);
};

double getAngleDegTowards(std::pair<double, double> point1,
                          std::pair<double, double> point2) {
  const double x1 = point1.first;
  const double y1 = point1.second;

  const double x2 = point2.first;
  const double y2 = point2.second;
  const double lenY = y2 - y1;
  const double lenX = x2 - x1;
  const double hyp = sqrt(lenX * lenX + lenY * lenY);
  double ret = 0.0;
  if (y2 >= y1 && x2 >= x1) {
    ret = (asin(lenY / hyp) * 180.0) / GLOBAL_PI + 90.0;
  } else if (y2 >= y1 && x2 < x1) {
    ret = (asin(lenY / -hyp) * 180.0) / GLOBAL_PI - 90.0;
  } else if (y2 < y1 && x2 > x1) {
    ret = (asin(lenY / hyp) * 180.0) / GLOBAL_PI + 90.0;
  } else {
    ret = (asin(-lenY / hyp) * 180.0) / GLOBAL_PI - 90.0;
  }
  if (ret >= 360.0) {
    ret = 360.0 - ret;
  }
  if (ret < 0) {
    ret = 360.0 + ret;
  }
  return ret;
}

double degreesToRadians(const double degrees) {
  return (degrees * GLOBAL_PI) / 180.0;
}
double radiansToDegrees(const double radians) {
  return (radians * 180) / GLOBAL_PI;
}

double sgn(double x) { return (x > 0) ? 1 : ((x < 0) ? -1 : 0); }
