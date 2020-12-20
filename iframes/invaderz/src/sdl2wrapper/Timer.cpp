#include "Timer.h"

namespace SDL2Wrapper
{
	// bool removeFlag;
	// double maxTime;
	// double startTime;
	Timer::Timer(const Window &windowA, int maxFrames)
			: window(windowA), removeFlag(false), aggTime(0.0)
	{
		maxTime = Window::targetFrameMS * static_cast<double>(maxFrames);
	}
	const bool Timer::shouldRemove()
	{
		return removeFlag;
	}
	void Timer::remove()
	{
		removeFlag = true;
	}
	void Timer::update()
	{
		if (!removeFlag)
		{
			aggTime += window.getDeltaTime();
			if (aggTime > maxTime)
			{
				remove();
			}
		}
	}

	FuncTimer::FuncTimer(const Window &windowA, int maxFrames, std::function<void()> cbA)
			: Timer(windowA, maxFrames), cb(cbA)
	{
	}

	void FuncTimer::remove()
	{
		Timer::remove();
		cb();
	}

	BoolTimer::BoolTimer(const Window &windowA, int maxFrames, bool &refA)
			: Timer(windowA, maxFrames), ref(refA)
	{
	}

	void BoolTimer::remove()
	{
		Timer::remove();
		ref = !ref;
	}

} // namespace SDL2Wrapper