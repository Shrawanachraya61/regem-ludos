const init = async () => {
  connectSocket();
  registerPanZoomListeners();
};

window.addEventListener('load', init, false);
