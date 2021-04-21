/* @jsx h */
import { getVolume, setVolume } from 'model/generics';
import { playSound, playSoundName, SoundType } from 'model/sound';
import { h } from 'preact';
import Card, { CardSize } from 'view/elements/Card';
import Button, { ButtonType } from 'view/elements/Button';
import { useReRender } from 'view/hooks';
import { colors, style } from 'view/style';

const VolumeArea = style('div', () => {
  return {
    color: colors.WHITE,
    fontSize: '16px',
    margin: '8px',
    width: '100%',
    '& > h2': {
      fontSize: '24px',
      textDecoration: 'underline',
      margin: '0px',
      textAlign: 'center',
      width: '100%',
    },
    '& > div': {
      margin: '8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      width: 'calc(100% - 32px)',
    },
  };
});

const AppSettings = () => {
  const render = useReRender();

  const handleVolumeSliderChange = (value: number, soundType: SoundType) => {
    setVolume(soundType, value);
    render();
  };
  const handleVolumeSliderClick = (soundType: SoundType) => {
    setTimeout(() => playSoundName('aggro_alert', getVolume(soundType)), 25);
  };

  const volumeNormal = getVolume(SoundType.NORMAL);
  const volumeMusic = getVolume(SoundType.MUSIC);

  return (
    <Card
      size={CardSize.MEDIUM}
      style={{
        borderTopWidth: '0px',
      }}
    >
      <VolumeArea>
        <h2>Volume Settings</h2>
        <div>
          <label name="generic-volume">
            Effects Volume - {Math.floor(volumeNormal * 100)}%
          </label>
          <input
            style={{
              width: '100%',
            }}
            value={volumeNormal}
            type="range"
            step={0.05}
            min={0}
            max={1.0}
            onChange={(ev: any) =>
              handleVolumeSliderChange(ev?.target?.value ?? 1, SoundType.NORMAL)
            }
            onMouseUp={() => handleVolumeSliderClick(SoundType.NORMAL)}
          ></input>
        </div>
        <div>
          <label name="music-volume">
            Music Volume - {Math.floor(volumeMusic * 100)}%
          </label>
          <input
            style={{
              width: '100%',
            }}
            value={volumeMusic}
            type="range"
            step={0.05}
            min={0}
            max={1.0}
            onChange={(ev: any) =>
              handleVolumeSliderChange(ev?.target?.value ?? 1, SoundType.MUSIC)
            }
            onMouseUp={() => handleVolumeSliderClick(SoundType.MUSIC)}
          ></input>
        </div>
      </VolumeArea>
    </Card>
  );
};

export default AppSettings;
