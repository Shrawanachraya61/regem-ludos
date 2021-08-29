const init = async () => {
    connectSocket();
    registerPanZoomListeners();
};
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
const createElement = (name) => {
    return document.createElement(name);
};
const setHTML = (elem, html) => {
    elem.innerHTML = html;
};
const showErrorMessage = (msg) => {
    const errorPane = getErrorPane();
    errorPane.innerHTML = 'ERROR: ' + msg;
    showError();
};
const getCurrentShotArgs = () => {
    return {
        angleDeg: getLocalPlayerAngle(),
        power: 1,
        ms: 4000,
    };
};
const sendRequestToShoot = async () => {
    setUiState({
        entityActive: true,
    });
    const resp = await sendRestRequest(getShared().G_R_GAME_SHOOT, getCurrentShotArgs());
    if (resp.error) {
        setUiState({
            entityActive: false,
        });
    }
    renderUi();
};
const sendRequestToSetAngle = async () => {
    await sendRestRequest(getShared().G_R_GAME_SET_ANGLE, {
        angleDeg: getCurrentShotArgs().angleDeg,
    });
};
const centerOnPlayer = () => {
    const gameData = getGameData();
    if (gameData) {
        const myEntity = getMyPlayerEntity(gameData);
        const { x: px, y: py } = worldToPx(myEntity.x, myEntity.y);
        const canvas = getCanvas();
        const width = canvas.width;
        const height = canvas.height;
        setPanZoomPosition(px - width / 2, -(py - height / 2), 1);
    }
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
const startLobby = async () => {
    showLoading();
    await sendRestRequest(getShared().G_R_LOBBY_START);
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
let nowMs = 0;
let nowDt = 0;
let loopCb = null;
let looping = false;
let frameTime = +new Date();
const FRAME_TIME_MAX = 1000;
const PI = Math.PI;
const updateGlobalFrameTime = () => {
    const dt = nowMs - frameTime;
    if (dt > FRAME_TIME_MAX) {
        frameTime = +new Date();
    }
};
const getFrameTimePercentage = () => {
    return Math.min(Math.max(getShared().normalize(nowMs, frameTime, frameTime + FRAME_TIME_MAX, 0, 1), 0), 1);
};
const startRenderLoop = () => {
    let now = +new Date();
    let prevNow = now;
    loop(() => {
        const gameData = getGameData();
        if (gameData) {
            now = +new Date();
            const nowDt = now - prevNow;
            prevNow = now;
            getShared().simulate(gameData, { nowDt });
            drawSimulation(gameData);
        }
    });
};
const stopRenderLoop = () => {
    looping = false;
};
const loop = cb => {
    nowMs = +new Date();
    nowDt = 0;
    loopCb = cb;
    looping = true;
    const _loop = () => {
        const now = +new Date();
        nowDt = now - nowMs;
        nowMs = now;
        if (loopCb) {
            loopCb();
        }
        if (looping) {
            requestAnimationFrame(_loop);
        }
    };
    requestAnimationFrame(_loop);
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
        await createLobby("Player's Game", 'Player');
    });
    registerSocketListener(shared.G_S_LOBBIES_UPDATED, (payload) => {
        console.log('lobbies updated', payload);
        setLobbyListState(payload.lobbies);
    });
    registerSocketListener(shared.G_S_GAME_STARTED, (payload) => {
        console.log('game started', payload);
        const gameData = payload.game;
        setGameData(gameData);
        setUiState({
            lobbyId: '',
        });
        const canvas = getCanvas();
        canvas.width = gameData.width * getShared().G_SCALE * 2;
        canvas.height = gameData.height * getShared().G_SCALE * 2;
        console.log('set canvas size', canvas.width, canvas.height);
        setUiState({
            activePane: 'game',
        });
        centerOnPlayer();
        renderUi();
        startRenderLoop();
    });
    registerSocketListener(shared.G_S_GAME_UPDATED, (payload) => {
        console.log('Update game data', payload.game);
        const gameData = getGameData();
        if (gameData) {
            for (const i in payload.game.entityMap) {
                gameData.entityMap[i] = payload.game.entityMap[i];
            }
            const myEntity = getMyPlayerEntity(gameData);
            if (!myEntity.active && getUiState().entityActive) {
                console.log('reset entity active');
                setUiState({
                    entityActive: false,
                });
                renderUi();
            }
        }
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
const generateShotPreview = (originalGameData, args) => {
    const gameData = copyGameData(originalGameData);
    const playerEntity = getMyPlayerEntity(gameData);
    playerEntity.active = true;
    playerEntity.vx = 55000 * Math.sin(getShared().toRadians(args.angleDeg));
    playerEntity.vy = 55000 * Math.cos(getShared().toRadians(args.angleDeg));
    playerEntity.angle = args.angleDeg;
    const ret = [];
    for (let i = 0; i < 12; i++) {
        getShared().simulate(gameData, { nowDt: 100 });
        const { x: px, y: py } = worldToPx(playerEntity.x, playerEntity.y);
        ret.push([px, py]);
    }
    return ret;
};
const hideEverything = () => {
    hideElement(getLoadingPane());
    hideElement(getErrorPane());
    hideElement(getMenuPane());
    hideElement(getLobbyPane());
    hideElement(getGameUiPane());
    hideElement(getGame());
    hideElement(getGameUiTopPane());
    hideElement(getGameUiMidPane());
    getCenter().style.height = 'unset';
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
const showGame = () => {
    hideEverything();
    showElement(getGameUiPane());
    showElement(getGameUiTopPane());
    showElement(getGame(), true);
    getCenter().style.height = '100%';
};
let currentGameData = null;
const getGameData = () => currentGameData;
const setGameData = (data) => (currentGameData = data);
const getMyPlayerEntity = (gameData) => {
    return getShared().getEntity(gameData, getPlayerId());
};
const copyGameData = (gameData) => JSON.parse(JSON.stringify(gameData));
const getShared = () => console.shared;
let genericSocket = null;
const getSocket = () => genericSocket;
const setSocket = (s) => (genericSocket = s);
let genericSocketId = '';
const getSocketId = () => genericSocketId;
const setSocketId = (s) => (genericSocketId = s);
let genericPlayerId = '';
const getPlayerId = () => genericPlayerId;
const setPlayerId = (id) => (genericPlayerId = id);
let localPlayerAngle = 0;
const getLocalPlayerAngle = () => localPlayerAngle;
const setLocalPlayerAngle = (a) => (localPlayerAngle = a);
let shotPreview = [];
const getShotPreview = () => shotPreview;
const setShotPreview = (s) => (shotPreview = s);
const isPlayerMe = (player) => {
    return player.id === getPlayerId();
};
const isPlayerEntityMe = (player) => {
    return player.id === getPlayerId();
};
const STORAGE_NAME_KEY = 'js13k2020_orbital_golfing_name';
const uiState = {
    lobbies: [],
    name: localStorage.getItem(STORAGE_NAME_KEY) || 'Player',
    activePane: 'loading',
    lobbyId: '',
    entityActive: false,
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
const getCanvasDimensions = (omitPosition) => {
    const ctx = getCtx();
    const canvas = ctx.canvas;
    if (omitPosition) {
        const { left, top } = canvas.getBoundingClientRect();
        return { left, top, width: canvas.width, height: canvas.height };
    }
    else {
        return { left: 0, top: 0, width: canvas.width, height: canvas.height };
    }
};
const pxToWorld = (x, y) => {
    const { width, height } = getCanvasDimensions(true);
    return {
        x: (x - width / 2) / getShared().G_SCALE,
        y: -(y - height / 2) / getShared().G_SCALE,
    };
};
const worldToPx = (x, y) => {
    const { width, height } = getCanvasDimensions(true);
    return {
        x: Math.round(x * getShared().G_SCALE + width / 2),
        y: Math.round(-y * getShared().G_SCALE + height / 2),
    };
};
const clientToWorld = (x, y) => {
    const { left, top, width, height } = getCanvasDimensions();
    return {
        x: (x - left - width / 2) / getShared().G_SCALE,
        y: -(y - top - height / 2) / getShared().G_SCALE,
    };
};
const drawCircle = (x, y, r, color) => {
    const ctx = getCtx();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * PI, false);
    ctx.fillStyle = color;
    ctx.fill();
};
const drawCircleOutline = (x, y, r, color) => {
    const ctx = getCtx();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * PI, false);
    ctx.strokeStyle = color;
    ctx.stroke();
};
const DEFAULT_TEXT_PARAMS = {
    font: 'monospace',
    color: '#fff',
    size: 16,
    align: 'center',
    strokeColor: '',
};
const drawText = (text, x, y, textParams) => {
    const { font, size, color, align, strokeColor } = {
        ...DEFAULT_TEXT_PARAMS,
        ...(textParams || {}),
    };
    const ctx = getCtx();
    ctx.font = `${size}px ${font}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 0.5;
        ctx.strokeText(text, x, y);
    }
};
const drawPoly = (pos, points, color) => {
    const ctx = getCtx();
    ctx.save();
    ctx.beginPath();
    ctx.translate(pos.x, pos.y);
    ctx.fillStyle = color;
    const firstPoint = points[0];
    ctx.moveTo(firstPoint.x, firstPoint.y);
    for (let i = 1; i < points.length; i++) {
        const point = points[i];
        ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
};
const drawRectangle = (x, y, w, h, color, deg) => {
    const ctx = getCtx();
    ctx.save();
    ctx.beginPath();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    if (deg !== undefined) {
        const w2 = w / 2;
        const h2 = h / 2;
        ctx.translate(w2, h2);
        ctx.rotate((deg * PI) / 180);
        ctx.fillRect(-w2, -h / 1.5, w, h);
    }
    else {
        ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
};
const drawPlanets = (planets) => {
    const G_SCALE = getShared().G_SCALE;
    for (let i = 0; i < planets.length; i++) {
        const { x, y, r, color } = planets[i];
        const { x: px, y: py } = worldToPx(x, y);
        drawCircle(px, py, r * G_SCALE, color);
    }
};
const drawPlayers = (players) => {
    const G_SCALE = getShared().G_SCALE;
    for (let i = 0; i < players.length; i++) {
        const playerEntity = players[i];
        const { x, y, r, color, finished } = playerEntity;
        if (finished) {
            continue;
        }
        let angleDeg = playerEntity.angle;
        if (isPlayerEntityMe(playerEntity)) {
            angleDeg = getLocalPlayerAngle();
        }
        const { x: px, y: py } = worldToPx(x, y);
        const sz = r * 2 * G_SCALE - 10;
        const sz2 = sz / 2;
        drawCircle(px, py, r * G_SCALE, color);
        drawRectangle(px - sz2, py - sz2, sz, sz, 'blue');
        drawRectangle(px - 5, py - 30, 10, 60, 'white', getShared().getHeadingTowards(px, py, px + Math.sin(getShared().toRadians(angleDeg)), py - Math.cos(getShared().toRadians(angleDeg))));
        drawCircle(px, py, sz2 / 1.5, 'lightblue');
        drawText(playerEntity.name, px, py - sz - 32, { size: 32 });
    }
};
const drawFlags = (flags) => {
    const G_SCALE = getShared().G_SCALE;
    for (let i = 0; i < flags.length; i++) {
        const flagEntity = flags[i];
        const { x, y, r } = flagEntity;
        const { x: px, y: py } = worldToPx(x, y);
        const radius = r * G_SCALE;
        drawCircle(px, py, radius, 'lightblue');
        drawCircle(px, py, radius - 4, 'white');
        drawRectangle(px - radius / 6 - 10, py - radius, radius / 3, radius * 2, 'black');
        {
            const x = px - radius / 6 - 10;
            const y = py - radius;
            const w = 40;
            const h = 30;
            drawRectangle(x, y, w, h, 'black');
            drawRectangle(x + 2, y + 2, w - 4, h - 4, 'lightblue');
        }
        drawText('Shoot here!', px, py - radius - 32, { size: 32 });
    }
};
const drawShotPreview = (preview) => {
    for (let i = 0; i < preview.length; i++) {
        const [x, y] = preview[i];
        drawCircle(x, y, 5, 'rgba(255,255,255,0.25)');
    }
};
const drawSimulation = (gameData) => {
    const { players, planets, flags } = gameData;
    const ctx = getCtx();
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    updateGlobalFrameTime();
    drawPlanets(planets.map(id => getShared().getEntity(gameData, id)));
    drawPlayers(players.map(id => getShared().getEntity(gameData, id)));
    drawFlags(flags.map(id => getShared().getEntity(gameData, id)));
    const myEntity = getMyPlayerEntity(gameData);
    if (!myEntity.active && !myEntity.finished) {
        drawShotPreview(getShotPreview());
    }
};
const getAngleLabel = () => {
    return getElement('game-angle-label');
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
const getShootButton = () => {
    return getElement('game-shoot');
};
const getPlayerNameInput = () => {
    return getElement('menu-name');
};
const getAngleInput = () => {
    return getElement('game-angle');
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
const getGameUiPane = () => {
    return getElement('game-ui');
};
const getGameUiTopPane = () => {
    return getElement('game-ui-top');
};
const getGameUiMidPane = () => {
    return getElement('game-ui-mid');
};
const getGame = () => {
    return getElement('game');
};
const getCanvas = () => {
    return getElement('canv');
};
const getCtx = () => {
    return getCanvas().getContext('2d');
};
const getCenter = () => {
    return getElement('center');
};
const panZoomState = {
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    mx: 0,
    my: 0,
    scale: 1,
    panning: false,
    zooming: false,
    touchStartX: 0,
    touchStartY: 0,
    touchDist: 0,
};
const gameWidth = 8000;
const gameHeight = 8000;
const panZoomTransition = 'transform 200ms ease-out';
const setPanZoomPosition = (x, y, scale) => {
    panZoomState.x = x;
    panZoomState.y = y;
    panZoomState.scale = scale;
    panZoom();
};
const clientToPanZoomCoords = (clientX, clientY) => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    return [
        Math.round((panZoomState.x + clientX - screenWidth / 2) / panZoomState.scale),
        Math.round((panZoomState.y + screenHeight / 2 - clientY) / panZoomState.scale),
    ];
};
const panZoomToClientCoords = (x, y) => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    return [
        Math.round(screenWidth / 2 + panZoomState.scale * x - panZoomState.x),
        Math.round(screenHeight / 2 - panZoomState.scale * y + panZoomState.y),
    ];
};
const getTouchCenterAndDistance = touches => {
    const getDistance = (x1, y1, x2, y2) => {
        return Math.round(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
    };
    const getCenter = (x1, y1, x2, y2) => {
        return {
            x: Math.min(x1, x2) + Math.abs(x2 - x1) / 2,
            y: Math.min(y1, y2) + Math.abs(y2 - y1) / 2,
        };
    };
    const { clientX: x1, clientY: y1 } = touches[1];
    const { clientX: x2, clientY: y2 } = touches[0];
    return {
        center: getCenter(x1, y1, x2, y2),
        d: getDistance(x1, y1, x2, y2),
    };
};
const registerPanZoomListeners = () => {
    console.log('register panzoom listeners');
    const game = getGame();
    game.addEventListener('mousedown', e => {
        if (e.button === 0) {
            console.log('set panning true');
            getGame().style.transition = 'unset';
            e.preventDefault();
            panZoomState.panning = true;
            panZoomState.touchStartX = e.clientX;
            panZoomState.touchStartY = e.clientY;
            panZoomState.prevX = panZoomState.x;
            panZoomState.prevY = panZoomState.y;
            panZoom();
        }
    });
    game.addEventListener('mouseup', e => {
        if (e.button === 0) {
            console.log('set panning false');
            getGame().style.transition = panZoomTransition;
            panZoomState.panning = false;
            panZoomState.zooming = false;
        }
    });
    game.addEventListener('mouseleave', () => {
        panZoomState.zooming = false;
        panZoomState.panning = false;
    });
    game.addEventListener('mousemove', e => {
        panZoomState.mx = e.clientX;
        panZoomState.my = e.clientY;
        if (panZoomState.panning) {
            const deltaX = e.clientX - panZoomState.touchStartX;
            const deltaY = e.clientY - panZoomState.touchStartY;
            panZoomState.x = panZoomState.prevX - deltaX;
            panZoomState.y = panZoomState.prevY + deltaY;
            panZoom();
        }
    });
    game.addEventListener('touchstart', e => {
        e.preventDefault();
        const touches = e.touches;
        const numTouches = touches.length;
        if (numTouches) {
            getGame().style.transition = 'unset';
            panZoomState.panning = true;
            if (numTouches >= 2) {
                panZoomState.zooming = true;
                const { center: { x, y }, d, } = getTouchCenterAndDistance(touches);
                panZoomState.touchDist = d;
                panZoomState.touchStartX = x;
                panZoomState.touchStartY = y;
            }
            else {
                panZoomState.touchStartX = touches[0].clientX;
                panZoomState.touchStartY = touches[0].clientY;
            }
            panZoomState.prevX = panZoomState.x;
            panZoomState.prevY = panZoomState.y;
            panZoom();
        }
    });
    game.addEventListener('touchend', ev => {
        if (ev.touches.length === 0) {
            getGame().style.transition = panZoomTransition;
            panZoomState.panning = false;
            panZoomState.zooming = false;
        }
    });
    game.addEventListener('touchmove', e => {
        const touches = e.touches;
        const numTouches = touches.length;
        if (panZoomState.panning || panZoomState.zooming) {
            let deltaX = 0;
            let deltaY = 0;
            if (numTouches >= 2) {
                const { center: { x, y }, d, } = getTouchCenterAndDistance(touches);
                if (Math.abs(d - panZoomState.touchDist) > 2) {
                    const increment = 0.042;
                    let nextScale = panZoomState.scale +
                        (d < panZoomState.touchDist ? -increment : increment);
                    if (nextScale < 0.25) {
                        nextScale = 0.25;
                    }
                    else if (nextScale > 1.5) {
                        nextScale = 1.5;
                    }
                    panZoomState.mx = x;
                    panZoomState.my = y;
                    const [focalX, focalY] = clientToPanZoomCoords(panZoomState.mx, panZoomState.my);
                    panZoomState.scale = nextScale;
                    const [postClientX, postClientY] = panZoomToClientCoords(focalX, focalY);
                    const clientXDiff = panZoomState.mx - postClientX;
                    const clientYDiff = panZoomState.my - postClientY;
                    panZoomState.x -= clientXDiff;
                    panZoomState.y += clientYDiff;
                    panZoom();
                    panZoomState.touchDist = d;
                }
            }
            else {
                if (!panZoomState.zooming) {
                    const touch = e.touches[0];
                    deltaX = touch.clientX - panZoomState.touchStartX;
                    deltaY = touch.clientY - panZoomState.touchStartY;
                    panZoomState.x = panZoomState.prevX - deltaX;
                    panZoomState.y = panZoomState.prevY + deltaY;
                    panZoom();
                }
            }
        }
    });
    const getScrollDirection = e => {
        const increment = 0.15;
        const delta = Math.max(-1, Math.min(1, e.wheelDelta || -e.detail));
        let nextScale = panZoomState.scale + (delta < 0 ? -increment : increment);
        if (nextScale < 0.5) {
            nextScale = 0.5;
        }
        else if (nextScale > 1.5) {
            nextScale = 1.5;
        }
        const [focalX, focalY] = clientToPanZoomCoords(panZoomState.mx, panZoomState.my);
        panZoomState.scale = nextScale;
        const [postClientX, postClientY] = panZoomToClientCoords(focalX, focalY);
        const clientXDiff = panZoomState.mx - postClientX;
        const clientYDiff = panZoomState.my - postClientY;
        panZoomState.x -= clientXDiff;
        panZoomState.y += clientYDiff;
        panZoom();
    };
    game.addEventListener('DOMMouseScroll', getScrollDirection, false);
    game.addEventListener('mousewheel', getScrollDirection, false);
};
const panZoom = () => {
    const game = getGame();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const transform = `translate(${-gameWidth / 2 + screenWidth / 2 - panZoomState.x}px, ${-gameHeight / 2 + screenHeight / 2 + panZoomState.y}px) scale(${panZoomState.scale})`;
    game.style.transform = transform;
};
document.addEventListener('touchmove', function (event) {
    event = event.originalEvent || event;
    if (event.scale !== undefined && event.scale !== 1) {
        event.preventDefault();
    }
}, false);
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
        startLobby();
    };
    const leaveGameButton = getLobbyLeaveButton();
    leaveGameButton.onclick = () => {
        leaveLobby();
    };
};
const renderGameUi = () => {
    const gameData = getGameData();
    if (!gameData) {
        return;
    }
    const myEntity = getMyPlayerEntity(gameData);
    if (uiState.entityActive || myEntity.finished) {
        getGameUiPane().style.display = 'none';
    }
    else {
        getGameUiPane().style.display = 'block';
    }
    const shootButton = getShootButton();
    shootButton.onclick = () => {
        sendRequestToShoot();
        renderUi();
    };
    const angleInput = getAngleInput();
    angleInput.oninput = ev => {
        const value = Number(ev.target.value);
        setLocalPlayerAngle(value);
        getAngleLabel().innerHTML = 'Angle ' + value;
        setShotPreview(generateShotPreview(gameData, getCurrentShotArgs()));
    };
    angleInput.onchange = () => {
        sendRequestToSetAngle();
    };
    setShotPreview(generateShotPreview(gameData, getCurrentShotArgs()));
    const gameUiTop = getGameUiTopPane();
    setHTML(gameUiTop, '');
    const colorInfoLabel = createElement('div');
    setHTML(colorInfoLabel, `You are the <span style="color: light${myEntity.color}">${myEntity.color.toUpperCase()}</span> Player.`);
    colorInfoLabel.className = 'game-line';
    gameUiTop.appendChild(colorInfoLabel);
    const shotInfoLabel = createElement('div');
    setHTML(shotInfoLabel, myEntity.finished
        ? 'Finished!'
        : `You are on shot number ${myEntity.shotCt + 1}.`);
    gameUiTop.appendChild(shotInfoLabel);
    const centerLink = createElement('div');
    setHTML(centerLink, 'Center on player.');
    centerLink.className = 'link game-line';
    centerLink.onclick = () => {
        centerOnPlayer();
    };
    gameUiTop.appendChild(centerLink);
    const gameUiMid = getGameUiMidPane();
    setHTML(gameUiMid, '');
    if (myEntity.finished) {
        showElement(gameUiMid, true);
    }
    else {
        hideElement(gameUiMid);
    }
    const shotResultLabel = createElement('div');
    setHTML(shotResultLabel, `You shot a ${myEntity.shotCt}.`);
    shotResultLabel.style['font-size'] = '42px';
    gameUiMid.appendChild(shotResultLabel);
    console.log('RENDER GAME UI', gameData);
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
        case 'game': {
            showGame();
            renderGameUi();
            panZoom();
        }
    }
};
//# sourceMappingURL=client.js.map