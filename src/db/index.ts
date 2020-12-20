import { init as initEnemies } from './enemies';
import { init as initEncounters } from './encounters';

export default () => {
  initEnemies();
  initEncounters();
}