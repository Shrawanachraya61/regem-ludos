import React from 'react';
import Text from 'elements/text';
import Button from 'elements/button';
import Dialog from 'elements/dialog';
import Input from 'elements/input';
import display from 'content/display';
import Animation from 'content/animation';
import { colors } from 'utils';

const RenameDialog = ({ open, setOpen, appInterface }) => {
  const animName = open;
  const [newAnimName, setNewAnimName] = React.useState(animName);
  const [errorText, setErrorText] = React.useState('');

  React.useEffect(() => {
    setNewAnimName(animName);
  }, [setNewAnimName, animName]);

  const validate = value => {
    const hasAnim = display.hasAnimation(value);
    if (hasAnim) {
      setErrorText('An animation with that name already exists.');
    } else {
      setErrorText('');
    }
    return hasAnim;
  };

  const onConfirm = async () => {
    setOpen(false);
    appInterface.setAnimation(null);
    const anim = display.getAnimation(animName);
    const imageName = display.getImageFromAnimName(animName);
    if (imageName) {
      const pic = display.pictures[imageName];
      const i = pic.animations.indexOf(animName);
      pic.animations.splice(i, 1, newAnimName);
    }
    delete display.animations[animName];
    anim.name = newAnimName;
    display.updateAnimation(anim, null, anim.loop, anim.sprites);
    appInterface.setAnimation(display.getAnimation(newAnimName));
  };

  return (
    <Dialog
      open={!!open}
      title="Rename Animation"
      onConfirm={onConfirm}
      onCancel={() => {
        setOpen(false);
      }}
      content={
        <>
          <div style={{ margin: '5px' }}>
            <Input
              focus={true}
              width="300"
              name="animationNameRename"
              label="Animation Name"
              errorText={errorText}
              value={newAnimName}
              onKeyDown={ev => {
                if (ev.which === 13) {
                  onConfirm();
                } else if (ev.which === 27) {
                  setOpen(false);
                }
              }}
              onChange={ev => {
                setNewAnimName(ev.target.value);
                validate(ev.target.value);
              }}
            />
          </div>
        </>
      }
    />
  );
};

const DeleteConfirm = ({ open, setOpen }) => {
  const animName = open;

  const onConfirm = async () => {
    setOpen(false);
    const imageName = display.getImageFromAnimName(animName);
    if (imageName) {
      const pic = display.pictures[imageName];
      const i = pic.animations.indexOf(animName);
      pic.animations.splice(i, 1);
    }
    display.animations[animName] = null;
  };

  return (
    <Dialog
      open={!!open}
      title="Delete Animation"
      onConfirm={onConfirm}
      onCancel={() => {
        setOpen(false);
      }}
      content={
        <>
          <div>Are you sure you wish to delete the animation '{animName}'?</div>
          <div style={{ margin: '5px' }}></div>
        </>
      }
    />
  );
};

const CreateAnimDialog = ({ open, setOpen, appInterface }) => {
  const [animName, setAnimName] = React.useState(appInterface.imageName || '');
  const [errorText, setErrorText] = React.useState('');

  React.useEffect(() => {
    setAnimName(appInterface.imageName);
  }, [setAnimName, appInterface.imageName]);

  const validate = value => {
    const hasAnim = display.hasAnimation(value);
    if (hasAnim) {
      setErrorText('An animation with that name already exists.');
    } else {
      setErrorText('');
    }
    return hasAnim;
  };

  const onConfirm = async () => {
    const isInvalid = validate(animName);
    if (isInvalid) {
      return;
    }
    setOpen(false);
    setAnimName(appInterface.imageName);
    display.createAnimation(animName, appInterface.imageName, () => {
      let a = new Animation(true, display);
      a.name = animName;
      return a;
    });
    appInterface.setAnimation(display.getAnimation(animName));
  };

  return (
    <Dialog
      open={open}
      title="Create New Animation"
      onConfirm={onConfirm}
      onCancel={() => {
        setOpen(false);
      }}
      content={
        <>
          <div>Specify a name for this animation.</div>
          <div style={{ margin: '5px' }}>
            <Input
              focus={true}
              width="140"
              name="animationName"
              label="Animation Name"
              errorText={errorText}
              value={animName}
              onKeyDown={ev => {
                if (ev.which === 13) {
                  onConfirm();
                } else if (ev.which === 27) {
                  setOpen(false);
                }
              }}
              onChange={ev => {
                setAnimName(ev.target.value);
                validate(ev.target.value);
              }}
            />
          </div>
        </>
      }
    />
  );
};

const AnimationItem = ({
  anim,
  appInterface,
  setDeleteConfirmOpen,
  setRenameAnimDialogOpen,
}) => {
  const ref = React.useRef(null);
  const spriteName = anim.getFirstSpriteName();
  const isSelected = appInterface.animation
    ? appInterface.animation.name === anim.name
    : false;
  React.useEffect(() => {
    if (spriteName) {
      display.setCanvas(ref.current);
      display.drawSprite(spriteName, 32, 32, {
        centered: true,
        width: 64,
        height: 64,
      });
      display.restoreCanvas();
    }
  }, [spriteName]);
  return (
    <div
      className="button"
      onClick={() =>
        isSelected
          ? appInterface.setAnimation(null)
          : appInterface.setAnimation(anim)
      }
      style={{
        height: 64,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: '5px',
        backgroundColor: isSelected
          ? anim.isCadence
            ? colors.darkPurple
            : colors.darkGreen
          : anim.isCadence
          ? colors.darkerPurple
          : null,
        borderColor: isSelected ? colors.green : null,
      }}
    >
      <div
        style={{
          width: '90%',
          overflow: 'hidden',
          whiteSpace: 'pre-wrap',
          textOverflow: 'ellipsis',
          textAlign: 'left',
        }}
      >
        <Text
          type="body"
          noSelect={true}
          ownLine={true}
          lineHeight={5}
          style={{ padding: '5px' }}
        >
          {anim.name}
        </Text>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100px',
          }}
        >
          <Button
            style={{ margin: '2px', fontSize: '10px', padding: '2px' }}
            type="cancel"
            onClick={() => {
              setDeleteConfirmOpen(anim.name);
            }}
          >
            Delete
          </Button>
          <Button
            style={{ margin: '2px', fontSize: '10px', padding: '2px' }}
            type="secondary"
            onClick={() => {
              setRenameAnimDialogOpen(anim.name);
            }}
          >
            Rename
          </Button>
        </div>
        <Button
          style={{
            margin: '2px',
            fontSize: '10px',
            padding: '2px',
            width: '80px',
            float: 'left',
          }}
          type={anim.isCadence ? 'secondary' : 'cadence'}
          onClick={() => {
            if (anim.sprites.length !== 3) {
            } else {
              anim.isCadence = !anim.isCadence;
              display.updateAnimation(anim, null, anim.loop, anim.sprites);
              appInterface.setAnimation(display.getAnimation(anim.name));
            }
          }}
        >
          {anim.isCadence ? 'To Anim' : 'To Cadence'}
        </Button>
      </div>
      <canvas
        style={{ margin: '5px' }}
        ref={ref}
        width={64}
        height={64}
      ></canvas>
    </div>
  );
};

const AnimationSelect = ({ appInterface }) => {
  const [createAnimDialogOpen, setCreateAnimDialogOpen] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [renameAnimDialogOpen, setRenameAnimDialogOpen] = React.useState(false);
  const { imageName } = appInterface;
  const { animations } = display.pictures[imageName] || { animations: [] };
  const anims = animations.map(animName => display.getAnimation(animName));

  return (
    <div>
      <div
        style={{
          borderBottom: '1px solid ' + colors.grey,
          paddingTop: '5px',
          paddingBottom: '6px',
        }}
      >
        <Text type="title" ownLine={true} centered={true}>
          Animations
        </Text>
      </div>
      {imageName ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            padding: '5px',
            borderBottom: '1px solid ' + colors.grey,
          }}
        >
          <Button type="primary" onClick={() => setCreateAnimDialogOpen(true)}>
            + Anim
          </Button>
        </div>
      ) : null}
      <div
        style={{
          height: 'calc(100% - 99px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          margin: !imageName ? '5px' : null,
        }}
      >
        {!imageName ? (
          <Text type="body" ownLine={true} color={colors.grey}>
            Select a spritesheet to see a list of animations.
          </Text>
        ) : null}
        {anims.map(anim => (
          <AnimationItem
            key={anim.name}
            anim={anim}
            appInterface={appInterface}
            setDeleteConfirmOpen={setDeleteConfirmOpen}
            setRenameAnimDialogOpen={setRenameAnimDialogOpen}
          />
        ))}
      </div>
      <CreateAnimDialog
        open={createAnimDialogOpen}
        setOpen={setCreateAnimDialogOpen}
        appInterface={appInterface}
      />
      <DeleteConfirm open={deleteConfirmOpen} setOpen={setDeleteConfirmOpen} />
      <RenameDialog
        open={renameAnimDialogOpen}
        setOpen={setRenameAnimDialogOpen}
        appInterface={appInterface}
      />
    </div>
  );
};

export default AnimationSelect;
