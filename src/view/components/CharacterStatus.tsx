/* @jsx h */
import { h, Fragment } from 'preact';
import { colors, style } from 'view/style';
import CharacterNameLabel from 'view/elements/CharacterNameLabel';
import {
  Character,
  characterGetExperiencePct,
  characterGetHpPct,
  characterGetLevel,
  characterGetResvPct,
  characterGetStat,
} from 'model/character';
import ProgressBar from 'view/elements/ProgressBar';
import StaticAnimDiv from 'view/elements/StaticAnimDiv';
import { WeaponType } from 'db/items';

import SwordIcon from 'view/icons/Sword';
import BowIcon from 'view/icons/RangedNormal';
import SpearIcon from 'view/icons/Spear';
import HammerIcon from 'view/icons/Hammer';
import WandIcon from 'view/icons/Wand';
import GunIcon from 'view/icons/Gun';

const Root = style('div', () => {
  return {
    width: '528px',
  };
});

const PrimaryRoot = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'flex-start',
    '& > div': {
      marginRight: '8px',
    },
  };
});

const PortraitContainer = style('div', () => {
  return {
    background: colors.DARKGREY,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    // borderRight: '2px solid ' + colors.BLACK,
    border: `2px solid ${colors.WHITE}`,
    width: '93',
    height: '93',
    cursor: 'pointer',
    overflow: 'hidden',
  };
});

const ChWeaponsContainer = style('div', () => {
  return {
    width: '24px',
    height: '95px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  };
});

const ChInfoContainer = style('div', () => {
  return {
    width: '40%',
    display: 'flex',
    justifyContent: 'flex-end',
    flexDirection: 'column',
    alignItems: 'flex-start',
  };
});

const ChNameLabelContainer = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'flex-start',
    // alignItems: 'baseline',
    '& > div': {
      marginRight: '8px',
    },
  };
});

const PercentBarWrapper = style(
  'div',
  (props: { short: boolean; borderColor?: string }) => {
    return {
      // width: ,
      marginTop: props.short ? '2px' : 'unset',
      width: '100%',
      border: props.short
        ? 'unset'
        : `2px solid ${props.borderColor ?? colors.WHITE}`,
      borderBottom: props.short ? 'unset' : '0px',
    };
  }
);

const ChStatsContainer = style('div', () => {
  return {
    // display: 'fl
  };
});

const Stat = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'flex-start',
    fontSize: '16px',
    pointerEvents: 'none',
    '& > label': {
      width: '50px',
    },
  };
});

const ChCurrenciesContainer = style('div', () => {
  return {
    marginBottom: '2px',
  };
});

const Currency = style('div', () => {
  return {
    display: 'flex',
    justifyContent: 'flex-start',
    fontSize: '12px',
    pointerEvents: 'none',
    color: colors.YELLOW,
    '& > label': {
      marginRight: '12px',
      textAlign: 'left',
    },
  };
});

const weaponEquipTypeToIcon = (wType: WeaponType) => {
  const icons = {
    [WeaponType.SWORD]: SwordIcon,
    [WeaponType.BOW]: BowIcon,
    [WeaponType.SPEAR]: SpearIcon,
    [WeaponType.HAMMER]: HammerIcon,
    [WeaponType.GUN]: GunIcon,
    [WeaponType.WAND]: WandIcon,
  };
  return icons[wType] ?? SwordIcon;
};

interface ICharacterStatusProps {
  ch?: Character;
  usePortrait?: boolean;
  hideHp?: boolean;
  hideStats?: boolean;
  hideExp?: boolean;
  hideWeapons?: boolean;
  hideCurrencies?: boolean;
}

const CharacterStatus = (props: ICharacterStatusProps) => {
  const ch = props.ch;

  if (!ch) {
    return <div></div>;
  }

  const leftStats = [
    {
      label: 'POW',
      value: 'POW',
    },
    {
      label: 'ACC',
      value: 'ACC',
    },
    {
      label: 'FOR',
      value: 'FOR',
    },
    {
      label: 'CON',
      value: 'CON',
    },
    {
      label: 'RES',
      value: 'RES',
    },
  ];

  const rightStats = [
    {
      label: 'SPD',
      value: 'SPD',
    },
    {
      label: 'EVA',
      value: 'EVA',
    },
    {
      label: '',
      value: '',
    },
    {
      label: 'MHP',
      value: 'HP',
    },
    {
      label: 'RESV',
      value: 'RESV',
    },
  ];

  return (
    <Root>
      <PrimaryRoot>
        <PortraitContainer>
          {props.usePortrait ? (
            <StaticAnimDiv
              style={{
                width: '128',
              }}
              animName={`${ch.name.toLowerCase()}_portrait_f`}
            ></StaticAnimDiv>
          ) : (
            <StaticAnimDiv
              style={{
                width: '64',
              }}
              animName={`${ch.spriteBase.toLowerCase()}_idle_down`}
            ></StaticAnimDiv>
          )}
        </PortraitContainer>
        {!props.hideWeapons ? (
          <ChWeaponsContainer>
            {ch.weaponEquipTypes.map(wType => {
              const Icon: any = weaponEquipTypeToIcon(wType);
              return <Icon color="white" />;
            })}
          </ChWeaponsContainer>
        ) : null}
        <ChInfoContainer>
          <ChNameLabelContainer>
            <CharacterNameLabel id={'name-label-' + ch.name}>
              {ch.name}
            </CharacterNameLabel>
            <div style={{ whiteSpace: 'pre' }}>
              Level {characterGetLevel(ch)}
              <Currency>
                <label>LVL Pts</label>
                {ch?.experienceCurrency}
              </Currency>
            </div>
          </ChNameLabelContainer>
          {!props.hideHp ? (
            <>
              <PercentBarWrapper short={false} borderColor={colors.WHITE}>
                <ProgressBar
                  pct={characterGetResvPct(ch)}
                  backgroundColor={colors.BLACK}
                  color={colors.PURPLE}
                  height={8}
                  label=""
                />
              </PercentBarWrapper>
              <PercentBarWrapper short={false}>
                <ProgressBar
                  pct={characterGetHpPct(ch)}
                  backgroundColor={colors.BLACK}
                  color={colors.GREEN}
                  height={20}
                  label={`HP: ${ch.hp}`}
                />
              </PercentBarWrapper>
            </>
          ) : null}
        </ChInfoContainer>
        {!props.hideStats ? (
          <>
            <ChStatsContainer>
              {leftStats.map(({ label, value }) => {
                return (
                  <Stat>
                    <label>{label}</label>{' '}
                    {value ? characterGetStat(ch, value) : ''}
                  </Stat>
                );
              })}
            </ChStatsContainer>
            <ChStatsContainer>
              {rightStats.map(({ label, value }) => {
                return (
                  <Stat>
                    <label>{label}</label>{' '}
                    {value ? characterGetStat(ch, value) : ''}
                  </Stat>
                );
              })}
            </ChStatsContainer>
          </>
        ) : null}
      </PrimaryRoot>
      {!props.hideExp ? (
        <PercentBarWrapper short={true} borderColor={colors.DARKBLUE}>
          <ProgressBar
            pct={characterGetExperiencePct(ch)}
            backgroundColor={colors.DARKBLUE}
            color={colors.YELLOW}
            height={6}
            label={``}
          />
        </PercentBarWrapper>
      ) : null}
    </Root>
  );
};

export default CharacterStatus;
