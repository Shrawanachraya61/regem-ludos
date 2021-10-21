import { h } from 'preact';

import ArmorIcon from './Armor';
import ArrowIcon from './Arrow';
import BracerIcon from './Bracer';
import CircleIcon from './Circle';
import CloakConsume from './CloakConsume';
import CloseIcon from './Close';
import ContractIcon from './Contract';
import CursorIcon from './Cursor';
import ExpandIcon from './Expand';
import FlowerIcon from './Flower';
import GearIcon from './Gear';
import HammerIcon from './Hammer';
import HazardIcon from './Hazard';
import HelpIcon from './Help';
import MenuIcon from './Menu';
import MineralHeart from './MineralHeart';
import PotionIcon from './Potion';
import PurseIcon from './Purse';
import RangedMultiIcon from './RangedMulti';
import RangedNormalIcon from './RangedNormal';
import ShieldIcon from './Shield';
import SignalIcon from './Signal';
import SpeakerIcon from './Speaker';
import SpearIcon from './Spear';
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
  bracer: BracerIcon,
  circle: CircleIcon,
  cloakConsume: CloakConsume,
  close: CloseIcon,
  contract: ContractIcon,
  cursor: CursorIcon,
  expand: ExpandIcon,
  flower: FlowerIcon,
  gear: GearIcon,
  hammer: HammerIcon,
  hazard: HazardIcon,
  help: HelpIcon,
  menu: MenuIcon,
  mineralHeart: MineralHeart,
  potion: PotionIcon,
  purse: PurseIcon,
  rangedMult: RangedMultiIcon,
  rangedNormal: RangedNormalIcon,
  shield: ShieldIcon,
  signal: SignalIcon,
  speaker: SpeakerIcon,
  spear: SpearIcon,
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
