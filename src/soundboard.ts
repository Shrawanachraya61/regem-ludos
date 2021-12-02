import { loadRes } from 'controller/res-loader';
import { playSoundName, sounds, loadSoundSpritesheet } from 'model/sound';

export const soundboard = async (): Promise<void> => {
  console.log('load res');
  document.body.innerHTML = '';
  document.body.style['overflow-y'] = 'auto';
  await loadSoundSpritesheet('foley/foley.mp3');
  await loadRes();

  const s = Object.keys(sounds)
    .sort()
    .filter(soundName => !soundName.includes('music_'));

  for (let i = 0; i < s.length; i++) {
    const soundName = s[i];
    const elem = document.createElement('button');
    elem.onclick = () => {
      playSoundName(soundName);
    };
    elem.innerHTML = soundName;
    document.body.appendChild(elem);
    document.body.appendChild(document.createElement('div'));
  }
};
