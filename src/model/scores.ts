import { getCurrentPlayer } from './generics';
import { get as getGames } from 'db/games';

export interface IHighScore {
  gameName: string;
  gameLabel: string;
  icon?: string;
  leaderboard: ILeaderboardEntry[];
  payout: IPayout;
}

interface IPayout {
  max: IPayoutItem;
  med: IPayoutItem;
  min: IPayoutItem;
}
interface IPayoutItem {
  threshold: number;
  tickets: number;
}

export interface ILeaderboardEntry {
  playerName?: string;
  playerLabel: string;
  score: number;
}

export const getScores = () => {
  return getGames();
};

// Add entry for game, if this returns true, you have set a new high score.
export const addScoreEntry = (gameName: string, score: number) => {
  const game = getGames()[gameName];
  if (!game) {
    console.error(
      'Cannot set high score, game: "' + gameName + '" does not exist.'
    );
    return;
  }

  const player = getCurrentPlayer();
  const playerName = player.leader.name;

  const entry = {
    playerName,
    playerLabel: player.leader.nameLabel,
    score,
  };
  game.leaderboard.push(entry);

  game.leaderboard.sort((a, b) => {
    if (a.score > b.score) {
      return -1;
    } else {
      return 1;
    }
  });

  return game.leaderboard[0] === entry;
};

export const getLeaderboard = (gameName: string) => {
  const game = getGames()[gameName];
  if (!game) {
    throw new Error(
      'Cannot get leaderboard, game: "' + gameName + '" does not exist.'
    );
  }

  return game.leaderboard;
};

export const setLeaderboard = (gameName: string, arr: ILeaderboardEntry[]) => {
  const game = getGames()[gameName];
  if (!game) {
    console.error(
      'Cannot set leaderboard, game: "' + gameName + '" does not exist.'
    );
    return;
  }

  game.leaderboard = [...arr];
};
