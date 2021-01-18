import { h, Fragment } from 'preact';
import { style } from 'view/style';
import Button, { ButtonType } from 'view/elements/Button';
import { pause, unpause } from 'controller/loop';

const TopBarWrapper = style('div', {
  position: 'absolute',
  top: '0px',
  // width: '100%',
});

const ArcadeUISection = () => {
  return (
    <>
      <TopBarWrapper>
        <Button type={ButtonType.PRIMARY}>Menu</Button>
      </TopBarWrapper>
    </>
  );
};

export default ArcadeUISection;
