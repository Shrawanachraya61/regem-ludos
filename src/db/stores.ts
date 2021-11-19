export interface IItemStoreTemplate {
  name?: string;
  label: string;
  description: string;
  icon?: string;
  openSound?: string;
  closeSound?: string;
  items: {
    itemName: string;
    price: number;
    quantity: number;
  }[];
}

const exp = {} as Record<string, IItemStoreTemplate>;

export const get = (key: string): IItemStoreTemplate => {
  const result = exp[key];
  if (!result) {
    throw new Error(`No IItemStoreTemplate exists with name: ${key}`);
  }
  return {
    ...result,
  };
};

export const getIfExists = (key: string): IItemStoreTemplate | null => {
  const result = exp[key];
  if (!result) {
    return null;
  }
  return {
    ...result,
  };
};

export const init = () => {
  exp.SODA_VENDING_MACHINE = {
    label: 'Soda Vending Machine',
    description: 'This vending machine sells a variety of tasty sodas.',
    openSound: 'vending_machine',
    icon: 'vending',
    items: [
      {
        itemName: 'FennelSoda',
        price: 5,
        quantity: 5,
      },
      {
        itemName: 'CarrotSoda',
        price: 5,
        quantity: 5,
      },
      {
        itemName: 'DurianSoda',
        price: 5,
        quantity: 5,
      },
      {
        itemName: 'OysterSoda',
        price: 5,
        quantity: 5,
      },
    ],
  };

  exp.SNACK_VENDING_MACHINE = {
    label: 'Snack Vending Machine',
    description: 'This vending machine sells a variety of tasty snacks.',
    openSound: 'vending_machine',
    icon: 'vending',
    items: [
      {
        itemName: 'GrilledTortillaChipettes',
        price: 5,
        quantity: 5,
      },
      {
        itemName: 'GarlicSticks',
        price: 5,
        quantity: 5,
      },
      {
        itemName: 'EspressoTart',
        price: 5,
        quantity: 5,
      },
    ],
  };

  for (const i in exp) {
    exp[i].name = i;
  }
};
