SDL2_WRAPPER_DIR=../../sdl2wrapper
CODE=Elasticity.cpp Actor.cpp Player.cpp Ball.cpp Brick.cpp Powerup.cpp Particle.cpp Game.cpp
SDL2_WRAPPER_CODE=$(SDL2_WRAPPER_DIR)/Animation.cpp $(SDL2_WRAPPER_DIR)/AssetLoader.cpp $(SDL2_WRAPPER_DIR)/Events.cpp $(SDL2_WRAPPER_DIR)/SDL2Includes.cpp $(SDL2_WRAPPER_DIR)/Sprite.cpp $(SDL2_WRAPPER_DIR)/Store.cpp $(SDL2_WRAPPER_DIR)/Timer.cpp $(SDL2_WRAPPER_DIR)/Gauge.cpp $(SDL2_WRAPPER_DIR)/Window.cpp
SRC=$(CODE:.cpp=.o)
SDL2_WRAPPER_SRC=$(SDL2_WRAPPER_CODE:.cpp=.o)
FLAGS=-g -Wall -std=c++17
EMCC_LIBS=-O3 -s USE_SDL=2 -s USE_SDL_IMAGE=2 -s USE_SDL_MIXER=2 -s SDL2_IMAGE_FORMATS='["png"]' -s USE_SDL_TTF=2 -s ALLOW_MEMORY_GROWTH=1
EMCC_EXPORTED=-s EXPORTED_FUNCTIONS='["_main", "_enableSound", "_disableSound","_setKeyDown", "_setKeyUp"]' -s EXPORTED_RUNTIME_METHODS=['ccall']  

EXE=elasticity
ifeq ($(OS),Windows_NT)
  LIBS=-mconsole -lmingw32 -lSDL2main -lSDL2 -lSDL2_image -lSDL2_ttf -lSDL2_mixer
else
  LIBS=-lSDL2main -lSDL2 -lSDL2_image -lSDL2_ttf -lSDL2_mixer
endif

.PHONY: $(EXE)
$(EXE): temp $(SRC) sdl2wrapper
	g++ $(FLAGS) $(SRC) $(SDL2_WRAPPER_SRC) -o $(EXE) $(LIBS)

.cpp.o:
	g++ $(FLAGS) -c $(@:.o=.cpp) -o $@

sdl2wrapper:
	cd $(SDL2_WRAPPER_DIR) && make

temp:
	mkdir -p .build

js: temp
	em++ $(CODE) $(SDL2_WRAPPER_CODE) $(EMCC_LIBS) $(EMCC_EXPORTED) --preload-file assets -o .build/$(EXE).js
	mkdir -p ../dist
	mv -v .build/* ../dist
	rm -fd .build

run: $(EXE)
	./$(EXE) --nointro

clean_all: clean
	rm -f $(SDL2_WRAPPER_DIR)/*.o

clean:
	rm -f *.o
	rm -f $(EXE)
	rm -f $(EXE).exe
	rm -fd .build