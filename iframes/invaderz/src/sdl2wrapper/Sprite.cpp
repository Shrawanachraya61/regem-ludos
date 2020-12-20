#include "Sprite.h"

namespace SDL2Wrapper
{

	Sprite::Sprite(const std::string &nameA, const int cxA, const int cyA, const int cwA, const int chA, SDL_Texture *imageA)
			: name(nameA), cx(cxA), cy(cyA), cw(cwA), ch(chA), image(imageA)
	{
	}
} // namespace SDL2Wrapper