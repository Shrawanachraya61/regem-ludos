import { h } from 'preact';

import ArmorIcon from './Armor';
import ArrowIcon from './Arrow';
import BattleGearIcon from './BattleGear';
import BraceletIcon from './Bracelet';
import BracerIcon from './Bracer';
import CircleIcon from './Circle';
import CloakConsume from './CloakConsume';
import CloseIcon from './Close';
import ContractIcon from './Contract';
import CursorIcon from './Cursor';
import ExpandIcon from './Expand';
import FlaskIcon from './Flask';
import FlowerIcon from './Flower';
import GearIcon from './Gear';
import HammerIcon from './Hammer';
import HazardIcon from './Hazard';
import HelpIcon from './Help';
import MenuIcon from './Menu';
import MineralHeart from './MineralHeart';
import Muffin from './Muffin';
import NecklaceIcon from './Necklace';
import PotionIcon from './Potion';
import PurseIcon from './Purse';
import RangedMultiIcon from './RangedMulti';
import RangedNormalIcon from './RangedNormal';
import RingIcon from './Ring';
import ShieldIcon from './Shield';
import SignalIcon from './Signal';
import SpeakerIcon from './Speaker';
import SpearIcon from './Spear';
import StarIcon from './Star';
import SwingFinisherIcon from './SwingFinisher';
import SwingNormalIcon from './SwingNormal';
import SwingPierceIcon from './SwingPierce';
import SwordIcon from './Sword';
import TalkIcon from './Talk';
import TargetIcon from './Target';
import TargetMeleeIcon from './TargetMelee';
import TicTacToeIcon from './TicTacToe';
import WandIcon from './Wand';

const icons = {
  armor: ArmorIcon,
  arrow: ArrowIcon,
  battleGear: BattleGearIcon,
  bracelet: BraceletIcon,
  bracer: BracerIcon,
  circle: CircleIcon,
  cloakConsume: CloakConsume,
  close: CloseIcon,
  contract: ContractIcon,
  cursor: CursorIcon,
  expand: ExpandIcon,
  flask: FlaskIcon,
  flower: FlowerIcon,
  gear: GearIcon,
  hammer: HammerIcon,
  hazard: HazardIcon,
  help: HelpIcon,
  menu: MenuIcon,
  mineralHeart: MineralHeart,
  muffin: Muffin,
  necklace: NecklaceIcon,
  potion: PotionIcon,
  purse: PurseIcon,
  rangedMult: RangedMultiIcon,
  rangedNormal: RangedNormalIcon,
  ring: RingIcon,
  shield: ShieldIcon,
  signal: SignalIcon,
  speaker: SpeakerIcon,
  spear: SpearIcon,
  star: StarIcon,
  swingFinisher: SwingFinisherIcon,
  swingNormal: SwingNormalIcon,
  swingPierce: SwingPierceIcon,
  sword: SwordIcon,
  talk: TalkIcon,
  target: TargetIcon,
  targetMelee: TargetMeleeIcon,
  ticTacToe: TicTacToeIcon,
  wand: WandIcon,
};
export const getIcon = (
  iconName: string
): ((props: { color: string }) => h.JSX.Element) => {
  return icons[iconName] ?? HelpIcon;
};
