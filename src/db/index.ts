import { init as initEnemies } from './enemies';
import { init as initEncounters } from './encounters';
import { init as initCharacters } from './characters';
import { init as initOverworlds } from './overworlds';
import { init as initTiles } from './tiles';
import { init as initOverworldAi } from './overworld-ai';

export default async () => {
  initEnemies();
  initEncounters();
  initCharacters();
  initTiles();
  initOverworldAi();
  await initOverworlds();
}