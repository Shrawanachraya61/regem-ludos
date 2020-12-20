#include "SDL2Includes.h"

#include <iostream>

namespace SDL2Wrapper
{
	void SDL_Deleter::operator()(SDL_Window *p) const
	{
		if (p != nullptr)
			SDL_DestroyWindow(p);
	}
	void SDL_Deleter::operator()(SDL_Renderer *p) const
	{
		if (p != nullptr)
			SDL_DestroyRenderer(p);
	}
	void SDL_Deleter::operator()(SDL_Texture *p) const
	{
		if (p != nullptr)
			SDL_DestroyTexture(p);
	}
	void SDL_Deleter::operator()(TTF_Font *p) const
	{
		if (p != nullptr)
			TTF_CloseFont(p);
	}
	void SDL_Deleter::operator()(Mix_Chunk *p) const
	{
		if (p != nullptr)
			Mix_FreeChunk(p);
	}
	void SDL_Deleter::operator()(Mix_Music *p) const
	{
		if (p != nullptr)
			Mix_FreeMusic(p);
	}
} // namespace SDL2Wrapper