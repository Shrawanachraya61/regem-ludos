#pragma once

#include <string>

#define GLOBAL_PI 3.14159

class Circle {
public:
  double x;
  double y;
  double r;
  Circle(double xA, double yA, double rA);
  void print();
};

class Rect {
public:
  double x;
  double y;
  double w;
  double h;
  Rect(double xA, double yA, double wA, double hA);
  void print();
};

float distance(const int x1, const int y1, const int x2, const int y2);
std::string collidesCircleRect(const Circle& c, const Rect& r);
bool collidesCircleCircle(const Circle& c1, const Circle& c2);
bool collidesRectRect(const Rect& r1, const Rect& r2);
std::pair<double, double> getNormalizedVec(const double x, const double y);
double getAngleDegTowards(std::pair<double, double> point1,
                          std::pair<double, double> point2);
double degreesToRadians(const double degrees);
double radiansToDegrees(const double radians);

double sgn(double val);

double normalize(double x, double a, double b, double c, double d);