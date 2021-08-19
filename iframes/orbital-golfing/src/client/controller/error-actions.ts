const showErrorMessage = (msg: string) => {
  const errorPane = getErrorPane();
  errorPane.innerHTML = 'ERROR: ' + msg;
  showError();
};
