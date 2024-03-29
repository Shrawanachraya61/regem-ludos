/* @jsx h */
import { h, Fragment } from 'preact';
import AppSettings from 'view/components/AppSettings';
import { getCancelKeyLabel } from 'controller/events';
import { useEffect } from 'preact/hooks';
import {
  getCurrentSettings,
  saveSettingsToLS,
} from 'controller/save-management';
import { getUiInterface } from 'view/ui';
import { playSoundName } from 'model/sound';
import MenuBox from 'view/elements/MenuBox';

const SettingsSection = (props: { onClose?: () => void }) => {
  useEffect(() => {
    return () => {
      const currentSettings = getCurrentSettings();
      saveSettingsToLS(currentSettings);
    };
  }, []);

  const handleCloseClick = () => {
    const onClose = props.onClose ?? getUiInterface().appState.settings.onClose;
    if (!props.onClose) {
      playSoundName('menu_choice_close');
    }
    onClose();
  };
  return (
    <>
      <MenuBox
        title="Settings"
        onClose={() => {
          handleCloseClick();
        }}
        disableCloseSound={Boolean(props.onClose)}
        dark={true}
        // maxWidth={'600px'}
        closeButtonLabel={'Back ' + getCancelKeyLabel()}
      >
        <AppSettings />
      </MenuBox>
    </>
  );
};

export default SettingsSection;
