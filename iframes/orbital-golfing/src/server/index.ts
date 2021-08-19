interface Socket {
  id: string;
  emit: (ev: string, payload: any) => void;
  on: (
    ev: string,
    cb: (socket: Socket, meta: SocketMeta, payload: any) => void
  ) => void;
}

interface SocketMeta {
  socketId?: string;
  player?: Player;
}

interface RestMeta {
  req: any;
  res: any;
  player?: Player;
}

interface RestResponse<T = any> {
  data?: T;
  error?: string;
}

const sendIoMessage = function <T>(socket: Socket, ev: string, payload: T) {
  socket.emit(ev, JSON.stringify(payload));
};

const sendIoMessageAll = function <T>(ev: string, payload: T) {
  playerStorage.forEach(player => {
    if (player.socket) {
      sendIoMessage(player.socket, ev, payload);
    }
  });
};

const assertPlayer = (meta: SocketMeta | RestMeta) => {
  if (!meta.player) {
    throw new Error('Player is not authorized.');
  }
  return meta.player;
};

//@ts-ignore
function getShared() {
  return (console as any).shared;
}
