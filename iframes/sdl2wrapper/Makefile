SDL2_WRAPPER_CODE=Animation.cpp AssetLoader.cpp Events.cpp SDL2Includes.cpp Sprite.cpp Store.cpp Timer.cpp Window.cpp
SDL2_WRAPPER_SRC=$(SDL2_WRAPPER_CODE:.cpp=.o)
FLAGS=-g -Wall -std=c++17

ifeq ($(OS),Windows_NT)
  LIBS= -mconsole -lmingw32 -lSDL2main -lSDL2 -lSDL2_image -lSDL2_ttf -lSDL2_mixer
else
  LIBS= -lSDL2main -lSDL2 -lSDL2_image -lSDL2_ttf -lSDL2_mixer
endif

all: $(SDL2_WRAPPER_SRC)

.cpp.o:
	g++ $(FLAGS) -c $(@:.o=.cpp) -o $@

clean:
	rm -f *.o