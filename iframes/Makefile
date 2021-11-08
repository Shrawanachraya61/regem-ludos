install:
	sudo apt-get update
	sudo apt install build-essential
	sudo apt install make
	sudo apt install libsdl2-dev libsdl2-2.0-0 -y
	sudo apt-get install libsdl2-ttf-dev -y
	sudo apt install libsdl2-image-dev -y
	sudo apt install libsdl2-mixer-dev -y
	sudo apt install libsdl2-gfx-dev -y

install_msys2:
	pacman -S base-devel gcc vim cmake
	pacman -S mingw64/mingw-w64-x86_64-SDL2  mingw64/mingw-w64-x86_64-SDL2_image mingw64/mingw-w64-x86_64-SDL2_mixer mingw64/mingw-w64-x86_64-SDL2_ttf
	pacman -S mingw64/mingw-w64-x86_64-freeglut mingw64/mingw-w64-x86_64-glew mingw64/mingw-w64-x86_64-devil