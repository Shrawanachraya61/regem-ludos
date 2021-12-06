const globalWindow = window as any;

const getLib = () => {
  return globalWindow.Lib;
};

// Obligatory Lib boilerplate for regem-ludos
globalWindow.init = async (config: { params: URLSearchParams }) => {
  console.log('Init from Lib', config);
};
