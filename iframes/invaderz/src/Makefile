CODE=Invaderz.cpp Ship.cpp Projectile.cpp Actor.cpp Game.cpp
SDL2_WRAPPER_CODE=sdl2wrapper/Animation.cpp sdl2wrapper/AssetLoader.cpp sdl2wrapper/Events.cpp sdl2wrapper/SDL2Includes.cpp sdl2wrapper/Sprite.cpp sdl2wrapper/Store.cpp sdl2wrapper/Timer.cpp sdl2wrapper/Window.cpp
SRC=$(CODE:.cpp=.o)
SDL2_WRAPPER_SRC=$(SDL2_WRAPPER_CODE:.cpp=.o)
FLAGS=-g -Wall -std=c++17

EXE = Invaderz
ifeq ($(OS),Windows_NT)
  LIBS= -mconsole -lmingw32 -lSDL2main -lSDL2 -lSDL2_image -lSDL2_ttf -lSDL2_mixer
else
  LIBS= -lSDL2main -lSDL2 -lSDL2_image -lSDL2_ttf -lSDL2_mixer
endif

.PHONY: $(EXE)
$(EXE): dist $(SRC) $(SDL2_WRAPPER_SRC)
	g++ $(FLAGS) $(SRC) $(SDL2_WRAPPER_SRC) -o $(EXE) $(LIBS)

.cpp.o:
	g++ $(FLAGS) -c $(@:.o=.cpp) -o $@

dist:
	mkdir -p dist

js: dist
	emcc $(CODE) $(SDL2_WRAPPER_CODE) -s USE_SDL=2 -s USE_SDL_IMAGE=2 -s USE_SDL_MIXER=2 -s SDL2_IMAGE_FORMATS='["png"]' -s USE_SDL_TTF=2 --preload-file assets -o dist/$(EXE).js
	cp -r dist/* ../

run: $(EXE)
	./$(EXE)

clean_all: clean
	rm -f sdl2wrapper/*.o

clean:
	rm -f *.o
	rm -f $(EXE)
	rm -rf dist