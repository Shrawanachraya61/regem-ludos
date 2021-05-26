/* @jsx h */
import { h, Fragment } from 'preact';
import { style } from 'view/style';
import Button, { ButtonType } from 'view/elements/Button';
import AppSettings from 'view/components/AppSettings';
import { showSection } from 'controller/ui-actions';
import { AppSection } from 'model/store';
import Card, { CardSize } from 'view/elements/Card';
import { unpause } from 'controller/loop';
import { popKeyHandler } from 'controller/events';
import { useEffect } from 'lib/preact-hooks';
import {
  getCurrentSettings,
  saveSettingsToLS,
} from 'controller/save-management';
import { getUiInterface } from 'view/ui';
import { playSoundName } from 'model/sound';

const Root = style('div', {
  position: 'absolute',
  top: '0px',
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'rgba(0, 0, 0, 0.5)',
});

const ContentSpacer = style('div', {
  display: 'flex',
  justifyContent: 'space-between',
  flexDirection: 'column',
  alignItems: 'center',
  height: '100%',
});

const ConfirmButtonArea = style('div', {
  display: 'flex',
  justifyContent: 'center',
  padding: '8px',
});

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
    playSoundName('menu_select');
    onClose();
  };
  return (
    <>
      <Root>
        <Card size={CardSize.LARGE}>
          <ContentSpacer id="settings-spacer">
            <AppSettings />
            <ConfirmButtonArea>
              <Button type={ButtonType.PRIMARY} onClick={handleCloseClick}>
                Close
              </Button>
            </ConfirmButtonArea>
          </ContentSpacer>
        </Card>
      </Root>
    </>
  );
};

export default SettingsSection;
