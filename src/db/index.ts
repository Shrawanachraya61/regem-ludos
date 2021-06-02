import { init as initEnemies } from './enemies';
import { init as initEncounters } from './encounters';
import { init as initCharacters } from './characters';
import { init as initOverworlds } from './overworlds';
import { init as initTiles } from './tiles';
import { init as initOverworldAi } from './overworld-ai';
import { init as initAnimMetadata } from './animation-metadata';
import { init as initParticles } from './particles';
import { init as initQuests } from './quests';
import { init as initItems } from './items';

export default async () => {
  initQuests();
  initParticles();
  initEnemies();
  initEncounters();
  initCharacters();
  initTiles();
  initOverworldAi();
  initAnimMetadata();
  initItems();
  await initOverworlds();
};
