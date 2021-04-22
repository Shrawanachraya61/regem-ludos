import { init as initEnemies } from './enemies';
import { init as initEncounters } from './encounters';
import { init as initCharacters } from './characters';
import { init as initOverworlds } from './overworlds';
import { init as initTiles } from './tiles';
import { init as initOverworldAi } from './overworld-ai';
import { init as initAnimMetadata } from './animation-metadata';
import { init as initParticles } from './particles';

export default async () => {
  initParticles();
  initEnemies();
  initEncounters();
  initCharacters();
  initTiles();
  initOverworldAi();
  initAnimMetadata();
  await initOverworlds();
};
