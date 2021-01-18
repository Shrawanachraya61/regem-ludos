import { init as initEnemies } from './enemies';
import { init as initEncounters } from './encounters';
import { init as initCharacters } from './characters';
import { init as initOverworlds } from './overworlds';

export default () => {
  initEnemies();
  initEncounters();
  initCharacters();
  initOverworlds();
}