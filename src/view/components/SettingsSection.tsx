/* @jsx h */
import { h, Fragment } from 'preact';
import AppSettings from 'view/components/AppSettings';
import { getCancelKeyLabel } from 'controller/events';
import { useEffect } from 'lib/preact-hooks';
import {
  getCurrentSettings,
  saveSettingsToLS,
} from 'controller/save-management';
import { getUiInterface } from 'view/ui';
import { playSoundName } from 'model/sound';
import MenuBox from 'view/elements/MenuBox';

const SettingsSection = () => {
  useEffect(() => {
    return () => {
      const currentSettings = getCurrentSettings();
      saveSettingsToLS(currentSettings);
    };
  }, []);

  const handleCloseClick = () => {
    // showSection(AppSection.Debug, true);
    const onClose = getUiInterface().appState.settings.onClose;
    playSoundName('menu_choice_close');
    onClose();
  };
  return (
    <>
      <MenuBox
        title="Settings"
        onClose={() => {
          handleCloseClick();
        }}
        // maxWidth={'600px'}
        closeButtonLabel={'Back ' + getCancelKeyLabel()}
      >
        <AppSettings />
      </MenuBox>
    </>
  );
};

export default SettingsSection;
