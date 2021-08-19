function init() {
    connectSocket();
}
window.addEventListener('load', init, false);
const getElement = (id) => {
    return document.getElementById(id);
};
const showElement = (elem, flex) => {
    elem.style.display = flex ? 'flex' : 'block';
};
const hideElement = (elem) => {
    elem.style.display = 'none';
};
const setHTML = (elem, html) => {
    elem.innerHTML = html;
};
const showErrorMessage = (msg) => {
    const errorPane = getErrorPane();
    errorPane.innerHTML = 'ERROR: ' + msg;
    showError();
};
const createLobby = async (lobbyName, playerName) => {
    showLoading();
    const resp = await sendRestRequest(getShared().G_R_LOBBY_CREATE, {
        lobbyName,
        playerName,
    });
    const lobby = resp.data?.lobby;
    if (lobby) {
        setUiState({
            activePane: 'lobby',
            lobbyId: lobby.id,
        });
    }
    renderUi();
};
const joinLobby = async (lobbyId, playerName) => {
    showLoading();
    const resp = await sendRestRequest(getShared().G_R_LOBBY_JOIN, {
        lobbyId,
        playerName,
    });
    const lobby = resp.data?.lobby;
    if (lobby) {
        setUiState({
            activePane: 'lobby',
            lobbyId: lobby.id,
        });
    }
    renderUi();
};
const leaveLobby = async () => {
    showLoading();
    const resp = await sendRestRequest(getShared().G_R_LOBBY_LEAVE);
    if (!resp.error) {
        setUiState({
            activePane: 'menu',
            lobbyId: '',
        });
    }
    renderUi();
};
const changePlayerName = async (name) => {
    if (name.length <= 12) {
        setUiState({
            ...uiState,
            name: name,
        });
    }
};
const registerSocketListener = function (event, cb) {
    const socket = getSocket();
    if (socket) {
        socket.on(event, (payload) => {
            const payloadParsed = JSON.parse(payload);
            console.log('socket event', event, payloadParsed);
            cb(payloadParsed);
        });
    }
};
const connectSocket = () => {
    const shared = console.shared;
    const socket = window.io({
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
    registerSocketListener(shared.G_S_CONNECTED, async (payload) => {
        console.log('connected', payload);
        setSocketId(payload.socketId);
        setPlayerId(payload.id);
        setUiState({
            activePane: 'menu',
        });
        renderUi();
    });
    registerSocketListener(shared.G_S_LOBBIES_UPDATED, (payload) => {
        console.log('lobbies updated', payload);
        setLobbyListState(payload.lobbies);
    });
};
const sendRestRequest = async function (url, params) {
    const queryParams = Object.keys(params ?? {})
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params?.[key] ?? ''))
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
    }
    else {
        console.log('fetch resp', url, json);
    }
    return json;
};
const hideEverything = () => {
    hideElement(getLoadingPane());
    hideElement(getErrorPane());
    hideElement(getMenuPane());
    hideElement(getLobbyPane());
};
const showLoading = () => {
    hideEverything();
    showElement(getLoadingPane());
};
const showMenu = () => {
    hideEverything();
    showElement(getMenuPane());
};
const showLobby = (lobby) => {
    hideEverything();
    showElement(getLobbyPane());
};
const showError = () => {
    hideEverything();
    showElement(getErrorPane());
};
const getShared = () => console.shared;
let genericSocket = null;
const getSocket = () => genericSocket;
const setSocket = (s) => (genericSocket = s);
let genericSocketId = '';
const getSocketId = () => genericSocketId;
const setSocketId = (s) => (genericSocketId = s);
let genericPlayerId = '';
const getPlayerId = () => genericPlayerId;
const setPlayerId = id => (genericPlayerId = id);
const isPlayerMe = (player) => {
    return player.id === getPlayerId();
};
const STORAGE_NAME_KEY = 'js13k2020_orbital_golfing_name';
const uiState = {
    lobbies: [],
    name: localStorage.getItem(STORAGE_NAME_KEY) || 'Player',
    activePane: 'loading',
    lobbyId: '',
};
const getUiState = () => uiState;
const setUiState = (nextState) => {
    Object.assign(uiState, nextState);
};
const setLobbyListState = (lobbies) => {
    setUiState({
        lobbies,
    });
    if (['menu', 'lobby'].includes(uiState.activePane)) {
        renderUi();
    }
};
const getCreateGameButton = () => {
    return getElement('menu-create');
};
const getLobbyStartButton = () => {
    return getElement('lobby-start');
};
const getLobbyLeaveButton = () => {
    return getElement('lobby-leave');
};
const getPlayerNameInput = () => {
    return getElement('menu-name');
};
const getLoadingPane = () => {
    return getElement('loading');
};
const getErrorPane = () => {
    return getElement('error');
};
const getMenuPane = () => {
    return getElement('menu');
};
const getLobbyPane = () => {
    return getElement('lobby');
};
const getLobbyListPane = () => {
    return getElement('menu-lobbies');
};
const getLobbyPlayerListPane = () => {
    return getElement('lobby-players');
};
const getLobbyName = () => {
    return getElement('lobby-name');
};
const LobbyListItem = (lobby) => {
    const div = document.createElement('div');
    div.className = 'pane flex-hz pane-secondary';
    const button = document.createElement('button');
    button.style.width = '80%';
    button.className = 'secondary';
    button.innerText = `${lobby.name} (${lobby.players.length})`;
    button.onclick = () => {
        joinLobby(lobby.id, uiState.name);
    };
    div.appendChild(button);
    return div;
};
const renderLobbyList = (lobbies) => {
    const lobbyList = getLobbyListPane();
    setHTML(lobbyList, '');
    lobbies.forEach(lobby => {
        lobbyList.appendChild(LobbyListItem(lobby));
    });
};
const renderMenu = () => {
    const uiState = getUiState();
    renderLobbyList(uiState.lobbies);
    const playerName = getPlayerNameInput();
    playerName.value = uiState.name;
    playerName.onblur = (ev) => {
        setUiState({
            name: ev.target.value,
        });
    };
    const createGameButton = getCreateGameButton();
    createGameButton.onclick = () => {
        createLobby(getUiState().name + "'s Game", getUiState().name);
    };
};
const LobbyPlayer = (player, i) => {
    return `<div class="pane pane-secondary">${i + 1}. <span class="${isPlayerMe(player) ? 'underlined' : ''}">${player.name}</span></div>`;
};
const renderLobby = (lobby) => {
    const lobbyName = getLobbyName();
    lobbyName.innerHTML = lobby.name;
    const html = lobby.players.reduce((html, player, i) => {
        return html + LobbyPlayer(player, i);
    }, '');
    const lobbyPlayersPane = getLobbyPlayerListPane();
    setHTML(lobbyPlayersPane, html);
    const startGameButton = getLobbyStartButton();
    startGameButton.disabled = !isPlayerMe(lobby.players[0]);
    startGameButton.onclick = () => {
    };
    const leaveGameButton = getLobbyLeaveButton();
    leaveGameButton.onclick = () => {
        leaveLobby();
    };
};
const renderUi = () => {
    const uiState = getUiState();
    console.log('RENDER UI', uiState);
    switch (uiState.activePane) {
        case 'loading': {
            showLoading();
            break;
        }
        case 'menu': {
            showMenu();
            renderMenu();
            break;
        }
        case 'lobby': {
            const lobby = uiState.lobbies.find(lobby => lobby.id === uiState.lobbyId);
            if (lobby) {
                showLobby(lobby);
                renderLobby(lobby);
            }
            break;
        }
    }
};
//# sourceMappingURL=client.js.map