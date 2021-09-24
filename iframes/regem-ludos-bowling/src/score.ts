export interface Frame {
  shot0: number;
  shot1: number;
  shot2: number;
  strike?: boolean;
  spare?: boolean;
}

export const calculateScoreForFrame = (index: number, frames: Frame[]) => {
  const frame = frames[index];
  if (frame && frame.shot0 > -1) {
    let score = 0;
    if (frame.shot0 >= 0) {
      score += frame.shot0;
    }
    if (frame.shot1 >= 0) {
      score += frame.shot1;
    }
    if (frame.shot2 >= 0) {
      score += frame.shot2;
    }

    if (frame.strike) {
      let scoreNextShot1 = -1;
      let scoreNextShot2 = -1;

      if (index === 10) {
        scoreNextShot1 = frame.shot1 ?? -1;
        scoreNextShot2 = frame.shot2 ?? -1;
        if (scoreNextShot1 === 10) {
          scoreNextShot2 += frame.shot2 ?? 0;
        }
      } else if (index === 9) {
        scoreNextShot1 = frames[index + 1]?.shot0 ?? -1;
        scoreNextShot1 = frames[index + 1]?.shot1 ?? -1;
      } else {
        scoreNextShot1 = frames[index + 1]?.shot0 ?? -1;
        if (frames[index + 1]?.strike) {
          scoreNextShot2 = frames[index + 2]?.shot0 ?? -1;
        }
      }

      if (scoreNextShot1 > -1) {
        score += scoreNextShot1;
      }
      if (scoreNextShot2 > -1) {
        score += scoreNextShot2;
      }
    }

    if (frame.spare) {
      let scoreNextShot1 = -1;
      if (scoreNextShot1 > -1) {
        score += scoreNextShot1;
      }

      if (index === 10) {
        scoreNextShot1 = frame.shot2 ?? -1;
      } else {
        scoreNextShot1 = frames[index + 1]?.shot0 ?? -1;
      }

      if (scoreNextShot1 > -1) {
        score += scoreNextShot1;
      }
    }

    return score;
  }
  return -1;
};

export const calculateScoreUpToFrame = (index: number, frames: Frame[]) => {
  return frames.reduce((prev, frame, i) => {
    if (i > index) {
      return prev;
    }

    const score = calculateScoreForFrame(i, frames);
    return prev + (score > -1 ? score : 0);
  }, 0);
};

export const calculateTotalScore = (frames: Frame[]) => {
  return frames.reduce((prev, frame, i) => {
    const score = calculateScoreForFrame(i, frames);
    return prev + (score > -1 ? score : 0);
  }, 0);
};
