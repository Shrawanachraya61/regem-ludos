export interface IPersistentEffectTemplate {
  name: string;
  description: string;
}

const exp = {} as Record<string, IPersistentEffectTemplate>;

export const get = (key: string): IPersistentEffectTemplate => {
  const result = exp[key];
  if (!result) {
    throw new Error(`No IPersistentEffectTemplate exists with name: ${key}`);
  }
  return {
    ...result,
  };
};

export const getIfExists = (key: string): IPersistentEffectTemplate | null => {
  const result = exp[key];
  if (!result) {
    return null;
  }
  return {
    ...result,
  };
};

export const init = () => {
  exp.CLOAKED = {
    name: 'CLOAKED',
    description: 'Enemies will not see you while walking around.',
  };

  exp.HASTE = {
    name: 'HASTE',
    description: 'Cooldowns in battle are reduced by 50% (10s).',
  };
};
