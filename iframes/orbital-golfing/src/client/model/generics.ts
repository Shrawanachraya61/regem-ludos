const getShared = () => (console as any).shared;

let genericSocket: any = null;
const getSocket = () => genericSocket;
const setSocket = (s: any) => (genericSocket = s);

let genericSocketId = '';
const getSocketId = () => genericSocketId;
const setSocketId = (s: string) => (genericSocketId = s);

let genericPlayerId = '';
const getPlayerId = () => genericPlayerId;
const setPlayerId = id => (genericPlayerId = id);
