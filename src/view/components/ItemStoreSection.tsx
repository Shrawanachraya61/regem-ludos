/* @jsx h */
import { h, Fragment } from 'preact';
import { getCancelKeyLabel } from 'controller/events';
import { getUiInterface } from 'view/ui';
import { playSoundName } from 'model/sound';
import MenuBox from 'view/elements/MenuBox';
import { colors, keyframes, style } from 'view/style';
import VerticalMenu from 'view/elements/VerticalMenu';
import { get as getStore } from 'db/stores';
import { get as getItem } from 'db/items';
import { getCurrentPlayer, getItemStores, setItemStores } from 'model/generics';
import { IItemStoreSave } from 'controller/save-management';
import { getIcon } from 'view/icons';
import { useEffect, useState } from 'preact/hooks';
import ItemDescription from './ItemDescription';
import { CardSize, sizes as cardSizes } from 'view/elements/Card';
import {
  playerAddItem,
  playerGetItemCount,
  playerModifyTickets,
} from 'model/player';
import { useReRender } from 'view/hooks';

const MAX_HEIGHT = '628px';

const InnerRoot = style('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  width: '100%',
  zIndex: '1',
  // height: '100%',
});

const LeftDiv = style('div', {
  width: '60%',
  maxHeight: MAX_HEIGHT,
});

const RightDiv = style('div', {
  width: '40%',
});

const DescriptionWrapper = style('div', {
  width: '100%',
  height: '400px',
  border: '1px solid ' + colors.WHITE,
  background: colors.DARKGREY_ALT,
});

const buyAnim = keyframes({
  '0%': {
    opacity: '1',
    transform: 'translateY(0px)',
  },
  '100%': {
    opacity: '0',
    transform: 'translateY(-28px)',
  },
});

const BuyNotification = style('div', {
  position: 'absolute',
  left: '222px',
  top: '12px',
  fontSize: '32px',
  color: colors.YELLOW,
  opacity: '0',
});

const itemBuyNotificationTimeouts: Record<string, any> = {};

const ItemStoreSection = (props: { onClose?: () => void }) => {
  const render = useReRender();

  const handleCloseClick = () => {
    const onClose = props.onClose ?? getUiInterface().appState.store.onClose;

    // sound handle in ui-actions
    // if (!props.onClose) {
    //   playSoundName('menu_choice_close');
    // }
    onClose();
  };

  const storeName = getUiInterface().appState.store.storeName;
  const store = getStore(storeName);
  const itemStores = getItemStores();

  // If the store is not saved, setup an entry for it
  if (!itemStores[storeName]) {
    itemStores[storeName] = {
      name: storeName,
      items: store.items.map(itemStore => {
        return {
          itemName: itemStore.itemName,
          quantity: itemStore.quantity,
        };
      }),
    } as IItemStoreSave;
  }

  const savedStore = itemStores[storeName];

  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const selectedItem = getItem(savedStore.items[selectedItemIndex].itemName);
  const player = getCurrentPlayer();
  const count = playerGetItemCount(player, selectedItem.name as string);

  const handleItemClick = (i: number) => {
    const storeItem = savedStore.items[i];
    const item = getItem(storeItem.itemName);
    const quantity = storeItem.quantity;
    const cost = store.items[i].price;
    const canPurchase = quantity > 0 && player.tickets >= cost;

    if (canPurchase) {
      playSoundName('make_purchase');
      savedStore.items[i].quantity--;
      playerAddItem(player, item.name as string);
      playerModifyTickets(player, -cost);

      const buyNotificationId = storeItem.itemName + '_' + i + '_buy';
      if (itemBuyNotificationTimeouts[buyNotificationId] !== undefined) {
        clearTimeout(itemBuyNotificationTimeouts[buyNotificationId]);
        delete itemBuyNotificationTimeouts[buyNotificationId];
      }

      const elem = document.getElementById(buyNotificationId);
      if (elem) {
        const duration = 300;
        elem.style.opacity = '';
        elem.style.animation = 'unset';
        itemBuyNotificationTimeouts[buyNotificationId] = setTimeout(() => {
          elem.style.animation = buyAnim + ` ${duration}ms ease-out 1`;
          itemBuyNotificationTimeouts[buyNotificationId] = setTimeout(() => {
            if (elem) {
              elem.style.animation = 'unset';
              elem.style.opacity = '0';
            }
            delete itemBuyNotificationTimeouts[buyNotificationId];
          }, duration);
        }, 100);
      }

      render();
    } else {
      playSoundName('terminal_cancel');
    }
  };

  const Icon = getIcon(store.icon ?? 'talk');

  return (
    <MenuBox
      title={store.label}
      onClose={() => {
        handleCloseClick();
      }}
      disableCloseSound={true}
      dark={true}
      maxWidth={cardSizes[CardSize.XLARGE].width}
      closeButtonLabel={'Back ' + getCancelKeyLabel()}
    >
      <div>
        <div
          style={{
            marginTop: '16px',
            fontSize: '20px',
            maxWidth: '85%',
          }}
        >
          {store.description}
        </div>
        <div
          style={{
            margin: '24px 0px 16px 0px',
            color: colors.LIGHTGREY,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div>Select an item to purchase.</div>
            <div style={{ color: colors.WHITE, marginTop: '8px' }}>
              You have{' '}
              <span style={{ color: colors.BLUE }}>{player.tickets}</span>{' '}
              Tickets.
            </div>
          </div>
          <div
            style={{
              height: '8px',
            }}
          >
            <div
              style={{
                transform: 'translateY(-64px)',
                width: '96px',
              }}
            >
              <Icon color={colors.WHITE} />
            </div>
          </div>
        </div>
        <InnerRoot>
          <LeftDiv>
            <VerticalMenu
              width="100%"
              maxHeight={'357px'}
              open={true}
              isInactive={false}
              hideTitle={false}
              startingIndex={0}
              itemHeight={48}
              title={'Purchase'}
              items={savedStore.items.map((storeItem, i) => {
                const item = getItem(storeItem.itemName);
                const quantity = storeItem.quantity;
                const cost = store.items[i].price;
                const Icon = getIcon(item.icon ?? 'help');
                const canPurchase = quantity > 0 && player.tickets >= cost;
                return {
                  label: (
                    <>
                      <div
                        style={{
                          color: !canPurchase ? colors.LIGHTGREY : 'unset',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '4px',
                          filter: !canPurchase
                            ? 'grayscale(1) brightness(75%)'
                            : 'unset',
                          cursor: !canPurchase ? 'default' : 'pointer',
                          background:
                            i === selectedItemIndex
                              ? colors.DARKGREEN
                              : 'unset',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <div
                            style={{
                              width: '24px',
                              marginRight: '16px',
                              marginLeft: '32px',
                            }}
                          >
                            <Icon color={colors.WHITE} />
                          </div>
                          {item.label} {`(${quantity})`}
                        </div>
                        <div style={{ color: colors.BLUE, width: '100px' }}>
                          Cost: {cost}
                        </div>
                      </div>
                      <BuyNotification
                        id={storeItem.itemName + '_' + i + '_buy'}
                      >
                        Buy!
                      </BuyNotification>
                    </>
                  ),
                  value: i,
                };
              })}
              onItemClickSound="menu_select"
              onItemClick={val => {
                handleItemClick(val);
              }}
              onItemHover={(val: number) => {
                setSelectedItemIndex(val);
              }}
            />
          </LeftDiv>
          <RightDiv>
            <DescriptionWrapper>
              <ItemDescription
                item={selectedItem}
                showName={true}
                disableUse={true}
              />
            </DescriptionWrapper>
          </RightDiv>
        </InnerRoot>
        <div
          style={{
            textAlign: 'center',
            margin: '8px',
          }}
        >
          You currently have{' '}
          <span
            style={{ color: count > 0 ? colors.LIGHTGREEN : colors.LIGHTRED }}
          >
            {count}
          </span>{' '}
          of this item.
        </div>
      </div>
    </MenuBox>
  );
};

export default ItemStoreSection;
