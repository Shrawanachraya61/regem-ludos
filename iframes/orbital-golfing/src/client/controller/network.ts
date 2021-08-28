interface SocketConnectedResponse {
  socketId: string;
  id: string;
}

interface LobbiesUpdatedResponse {
  lobbies: LobbyState[];
}

interface GameStartedResponse {
  game: GameData;
}

const registerSocketListener = function <T>(
  event: string,
  cb: (payload: T) => void
) {
  const socket = getSocket();
  if (socket) {
    socket.on(event, (payload: any) => {
      const payloadParsed = JSON.parse(payload);
      console.log('socket event', event, payloadParsed);
      cb(payloadParsed);
    });
  }
};

const connectSocket = () => {
  const shared = (console as any).shared;

  const socket = (window as any).io({
    upgrade: false,
    transports: ['websocket'],
  });
  setSocket(socket);

  socket.on('disconnect', () => {
    console.error('disconnected');
    showErrorMessage('Disconnected!');
  });
  socket.on('error', e => {
    console.error('socket error', e);
    showErrorMessage('Socket error.');
  });

  registerSocketListener(
    shared.G_S_CONNECTED,
    async (payload: SocketConnectedResponse) => {
      console.log('connected', payload);
      setSocketId(payload.socketId);
      setPlayerId(payload.id);

      await createLobby("Player's Game", 'Player');

      // setUiState({
      //   activePane: 'menu',
      // });
      // renderUi();
    }
  );

  registerSocketListener(
    shared.G_S_LOBBIES_UPDATED,
    (payload: LobbiesUpdatedResponse) => {
      console.log('lobbies updated', payload);
      setLobbyListState(payload.lobbies);
    }
  );

  registerSocketListener(
    shared.G_S_GAME_STARTED,
    (payload: GameStartedResponse) => {
      console.log('game started', payload);
      const gameData = payload.game;
      setGameData(gameData);
      setUiState({
        lobbyId: '',
      });
      const canvas: any = getCanvas();
      canvas.width = gameData.width * getShared().G_SCALE * 2;
      canvas.height = gameData.height * getShared().G_SCALE * 2;
      console.log('set canvas size', canvas.width, canvas.height);
      setUiState({
        activePane: 'game',
      });
      renderUi();
    }
  );
};

interface FetchResponse<T> {
  data?: T;
  error?: string;
}

const sendRestRequest = async function <RESP = any>(
  url: string,
  params?: Record<string, string>
): Promise<FetchResponse<RESP>> {
  const queryParams = Object.keys(params ?? {})
    .map(
      key =>
        encodeURIComponent(key) + '=' + encodeURIComponent(params?.[key] ?? '')
    )
    .join('&');
  const finalUrl = url + '?' + queryParams;
  const headers = {
    'Content-Type': 'application/json',
    socketid: getSocketId(),
  };
  console.log('fetch', finalUrl, headers);
  const json = await fetch(finalUrl, {
    headers,
  })
    .then(function (response) {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(result => result.json())
    .catch(e => {
      return {
        error: e.message,
      };
    });

  if (json.error) {
    console.error('error on fetch:', json.error);
  } else {
    console.log('fetch resp', url, json);
  }
  return json;
};
