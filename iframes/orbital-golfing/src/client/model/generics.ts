//eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
const getShared = () => (console as any).shared;

let genericSocket: any = null;
const getSocket = () => genericSocket;
const setSocket = (s: any) => (genericSocket = s);

let genericSocketId = '';
const getSocketId = () => genericSocketId;
const setSocketId = (s: string) => (genericSocketId = s);

let genericPlayerId = '';
const getPlayerId = () => genericPlayerId;
const setPlayerId = (id: string) => (genericPlayerId = id);

let localPlayerAngle = 0;
const getLocalPlayerAngle = () => localPlayerAngle;
const setLocalPlayerAngle = (a: number, updateInput?: boolean) => {
  localPlayerAngle = a;
  if (updateInput) {
    const elem: any = getAngleInput();
    elem.value = a;
  }
};

let localPlayerPowerIndex = 0;
const getLocalPlayerPower = () => POWER_MULTIPLIERS[localPlayerPowerIndex] ?? 1;
const setLocalPlayerPowerIndex = (v: number, updateInput?: boolean) => {
  localPlayerPowerIndex = v;
  if (updateInput) {
    const elem: any = getPowerInput();
    elem.value = v;
  }
};

let shotPreview: Point[] = [];
const getShotPreview = () => shotPreview;
const setShotPreview = (s: Point[]) => (shotPreview = s);
