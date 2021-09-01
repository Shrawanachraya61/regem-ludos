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
const getColor = (color, dark) => {
    if (!dark) {
        return ({
            blue: '#bbf',
            red: '#fbb',
            green: '#bfb',
            purple: '#b52db5',
        }[color] ?? color);
    }
    return ({
        blue: '#005',
        red: '#500',
        grey: 'black',
        orange: '#563903',
        yellow: 'brown',
        purple: '#340667',
        green: '#020',
    }[color] ?? color);
};
const getColorStyles = (color) => {
    return `color: ${getColor(color, true)}; background: ${getColor(color)}`;
};
const createExplosionEffect = (x, y) => {
    const { x: px, y: py } = worldToPx(x, y);
    const elem = getGameInner();
    if (elem) {
        playSound('expl');
        const div = createElement('div');
        div.className = 'expl';
        div.style.position = 'absolute';
        div.style.left = px - 50 + 'px';
        div.style.top = py - 50 + 'px';
        elem.appendChild(div);
        setTimeout(() => {
            div.remove();
        }, 4000);
    }
};
const showErrorMessage = (msg) => {
    const errorPane = getErrorPane();
    errorPane.innerHTML = 'ERROR: ' + msg;
    showError();
};
const POWER_MULTIPLIERS = [0.75, 1, 1.25, 1.5, 1.75, 2];
const getCurrentShotArgs = () => {
    return {
        angleDeg: getLocalPlayerAngle(),
        power: getLocalPlayerPower(),
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
const sendRequestToGoToPrev = async () => {
    await sendRestRequest(getShared().G_R_GAME_PREV);
    renderUi();
};
const centerOnPlayer = () => {
    const gameData = getGameData();
    if (gameData) {
        const myEntity = getMyPlayerEntity(gameData);
        const { x: px, y: py } = worldToPx(myEntity.x, myEntity.y);
        const canvas = getCanvas();
        const width = canvas.width;
        const height = canvas.height;
        setPanZoomPosition(px - width / 2, -(py - height / 2), 0.5);
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
            applyGameState(gameData);
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
        setUiState({
            activePane: 'menu',
        });
        renderUi();
    });
    registerSocketListener(shared.G_S_LOBBIES_UPDATED, (payload) => {
        console.log('lobbies updated', payload);
        setLobbyListState(payload.lobbies);
    });
    registerSocketListener(shared.G_S_GAME_STARTED, (payload) => {
        console.log('game started', payload);
        const gameData = payload.game;
        setGameData(gameData);
        const canvas = getCanvas();
        canvas.width = gameData.width * getShared().G_SCALE * 2;
        canvas.height = gameData.height * getShared().G_SCALE * 2;
        setUiState({
            lobbyId: '',
            activePane: 'game',
        });
        playSound('start');
        setLocalPlayerAngle(0, true);
        setLocalPlayerPowerIndex(1, true);
        centerOnPlayer();
        renderUi();
        startRenderLoop();
    });
    registerSocketListener(shared.G_S_GAME_UPDATED, (payload) => {
        const gameData = getGameData();
        if (gameData) {
            pushGameState(payload.game);
        }
    });
    registerSocketListener(shared.G_S_GAME_ROUND_COMPLETED, (payload) => {
        console.log('Round completed', payload.game);
        const gameData = getGameData();
        if (gameData) {
            gameData.scorecard = payload.game.scorecard;
            const myEntity = getMyPlayerEntity(gameData);
            setUiState({
                entityActive: false,
                roundCompleted: true,
            });
            renderUi();
        }
    });
    registerSocketListener(shared.G_S_GAME_ROUND_STARTED, (payload) => {
        console.log('Round started', payload.game);
        const gameData = payload.game;
        setGameData(gameData);
        const canvas = getCanvas();
        canvas.width = gameData.width * getShared().G_SCALE * 2;
        canvas.height = gameData.height * getShared().G_SCALE * 2;
        setUiState({
            entityActive: false,
            roundCompleted: false,
        });
        setLocalPlayerAngle(0, true);
        setLocalPlayerPowerIndex(1, true);
        renderUi();
        centerOnPlayer();
    });
    registerSocketListener(shared.G_S_GAME_COMPLETED, (payload) => {
        console.log('game completed', payload);
        const gameData = getGameData();
        if (gameData) {
            gameData.scorecard = payload.game.scorecard;
        }
        playSound('end');
        setUiState({
            activePane: 'summary',
        });
        renderUi();
    });
    registerSocketListener(shared.G_S_GAME_PLAYER_DISCONNECTED, (payload) => {
        console.log('player disconnected', payload);
        const gameData = getGameData();
        if (gameData) {
            const discPlayerId = payload.playerId;
            const entity = getShared().getEntity(gameData, discPlayerId);
            if (entity) {
                entity.disconnected = true;
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
const setPanZoomPosition = async (x, y, scale) => {
    panZoomState.x = x;
    panZoomState.y = y;
    panZoomState.scale = 1;
    panZoom();
    await new Promise(resolve => setTimeout(resolve, 200));
    panZoomState.mx = window.innerWidth / 2;
    panZoomState.my = window.innerHeight / 2;
    panZoomToFocalWithScale(scale);
};
const panZoomToFocalWithScale = (scale) => {
    const [focalX, focalY] = clientToPanZoomCoords(panZoomState.mx, panZoomState.my);
    panZoomState.scale = scale;
    const [postClientX, postClientY] = panZoomToClientCoords(focalX, focalY);
    const clientXDiff = panZoomState.mx - postClientX;
    const clientYDiff = panZoomState.my - postClientY;
    panZoomState.x -= clientXDiff;
    panZoomState.y += clientYDiff;
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
    game.style.transition = panZoomTransition;
    game.addEventListener('mousedown', e => {
        if (e.button === 0) {
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
                    panZoomToFocalWithScale(nextScale);
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
        panZoomToFocalWithScale(nextScale);
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
const generateShotPreview = (originalGameData, args) => {
    const gameData = copyGameData(originalGameData);
    const playerEntity = getMyPlayerEntity(gameData);
    playerEntity.active = true;
    playerEntity.vx =
        55000 * args.power * Math.sin(getShared().toRadians(args.angleDeg));
    playerEntity.vy =
        55000 * args.power * Math.cos(getShared().toRadians(args.angleDeg));
    playerEntity.angle = args.angleDeg;
    const nowDt = 75;
    let numIterations = 12;
    if (args.power > 1) {
        numIterations = 11;
    }
    if (args.power > 1.5) {
        numIterations = 10;
    }
    const ret = [];
    for (let i = 0; i < numIterations; i++) {
        getShared().simulate(gameData, { nowDt });
        const { x: px, y: py } = worldToPx(playerEntity.x, playerEntity.y);
        ret.push([px, py]);
        if (gameData.collisions.length) {
            break;
        }
    }
    return ret;
};
const previousGameStates = [];
const pushGameState = (state) => {
    const gameData = getGameData();
    if (gameData) {
        state.collisions.forEach(([entityAId, entityBId]) => {
            const entityA = getShared().getEntity(gameData, entityAId);
            const entityB = getShared().getEntity(gameData, entityBId);
            if (entityA) {
                if (entityB?.type === 'flag') {
                    if (entityA.shotCt === 1) {
                        playSound('holeInOne');
                    }
                    else {
                        playSound('completed');
                    }
                }
                else {
                    createExplosionEffect(entityA.x, entityA.y);
                }
            }
        });
        for (const i in state.entityMap) {
            gameData.entityMap[i] = state.entityMap[i];
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
};
let lastAppliedState = null;
const applyGameState = (gameData) => {
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
    hideElement(getSummaryPane());
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
const showSummary = () => {
    hideEverything();
    showElement(getSummaryPane());
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
let zzfx, zzfxV, zzfxX;
zzfxV = 0.3;
zzfx = (p = 1, k = 0.05, b = 220, e = 0, r = 0, t = 0.1, q = 0, D = 1, u = 0, y = 0, v = 0, z = 0, l = 0, E = 0, A = 0, F = 0, c = 0, w = 1, m = 0, B = 0) => {
    let M = Math, R = 44100, d = 2 * M.PI, G = (u *= (500 * d) / R / R), C = (b *= ((1 - k + 2 * k * M.random((k = []))) * d) / R), g = 0, H = 0, a = 0, n = 1, I = 0, J = 0, f = 0, x, h;
    e = R * e + 9;
    m *= R;
    r *= R;
    t *= R;
    c *= R;
    y *= (500 * d) / R ** 3;
    A *= d / R;
    v *= d / R;
    z *= R;
    l = (R * l) | 0;
    for (h = (e + m + r + t + c) | 0; a < h; k[a++] = f)
        ++J % ((100 * F) | 0) ||
            ((f = q
                ? 1 < q
                    ? 2 < q
                        ? 3 < q
                            ? M.sin((g % d) ** 3)
                            : M.max(M.min(M.tan(g), 1), -1)
                        : 1 - (((((2 * g) / d) % 2) + 2) % 2)
                    : 1 - 4 * M.abs(M.round(g / d) - g / d)
                : M.sin(g)),
                (f =
                    (l ? 1 - B + B * M.sin((d * a) / l) : 1) *
                        (0 < f ? 1 : -1) *
                        M.abs(f) ** D *
                        p *
                        zzfxV *
                        (a < e
                            ? a / e
                            : a < e + m
                                ? 1 - ((a - e) / m) * (1 - w)
                                : a < e + m + r
                                    ? w
                                    : a < h - c
                                        ? ((h - a - c) / t) * w
                                        : 0)),
                (f = c
                    ? f / 2 +
                        (c > a ? 0 : ((a < h - c ? 1 : (h - a) / c) * k[(a - c) | 0]) / 2)
                    : f)),
            (x = (b += u += y) * M.cos(A * H++)),
            (g += x - x * E * (1 - ((1e9 * (M.sin(a) + 1)) % 2))),
            n && ++n > z && ((b += v), (C += v), (n = 0)),
            !l || ++I % l || ((b = C), (u = G), (n = n || 1));
    p = zzfxX.createBuffer(1, h, R);
    p.getChannelData(0).set(k);
    b = zzfxX.createBufferSource();
    b.buffer = p;
    b.connect(zzfxX.destination);
    b.start();
    return b;
};
zzfxX = new (window.AudioContext || webkitAudioContext)();
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
const setLocalPlayerAngle = (a, updateInput) => {
    localPlayerAngle = a;
    if (updateInput) {
        const elem = getAngleInput();
        elem.value = a;
    }
};
let localPlayerPowerIndex = 0;
const getLocalPlayerPower = () => POWER_MULTIPLIERS[localPlayerPowerIndex] ?? 1;
const setLocalPlayerPowerIndex = (v, updateInput) => {
    localPlayerPowerIndex = v;
    if (updateInput) {
        const elem = getPowerInput();
        elem.value = v;
    }
};
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
    roundCompleted: false,
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
        const { x, y, r, color, finished, disconnected } = playerEntity;
        if (finished || disconnected) {
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
        drawRectangle(px - sz2, py - sz2, sz, sz, getColor(color, true));
        drawRectangle(px - 5, py - 30, 10, 60, 'white', getShared().getHeadingTowards(px, py, px + Math.sin(getShared().toRadians(angleDeg)), py - Math.cos(getShared().toRadians(angleDeg))));
        drawCircle(px, py, sz2 / 1.5, getColor(color));
        drawText(playerEntity.name, px, py - sz - 32, { size: 32 });
    }
};
let lastFlagTimestamp = +new Date();
let flagMode = 0;
const drawFlags = (flags) => {
    const timestamp = +new Date();
    if (timestamp - lastFlagTimestamp > 500) {
        flagMode = (flagMode + 1) % 2;
        lastFlagTimestamp = timestamp;
    }
    const G_SCALE = getShared().G_SCALE;
    for (let i = 0; i < flags.length; i++) {
        const flagEntity = flags[i];
        const { x, y, r } = flagEntity;
        const { x: px, y: py } = worldToPx(x, y);
        const radius = r * G_SCALE;
        drawCircle(px, py, radius, 'orange');
        drawCircle(px, py, radius - 4, 'white');
        drawRectangle(px - radius / 6 - 10, py - radius, radius / 3, radius * 2, 'black');
        {
            const x = px - radius / 6 - 10;
            const y = py - radius;
            const w = 40;
            const h = 30;
            if (flagMode === 1) {
                drawRectangle(x, y, w, h, 'black');
                drawRectangle(x + 2, y + 2, w - 4, h - 4, 'orange');
            }
            else {
                drawRectangle(x, y, w, h, 'black', 359);
                drawRectangle(x + 2, y + 2, w - 4, h - 4, 'orange', 359);
            }
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
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
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
const getPrevButton = () => {
    return getElement('game-prev');
};
const getSummaryContinueButton = () => {
    return getElement('summary-next');
};
const getPlayerNameInput = () => {
    return getElement('menu-name');
};
const getAngleInput = () => {
    return getElement('game-angle');
};
const getPowerInput = () => {
    return getElement('game-power');
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
const getSummaryPane = () => {
    return getElement('summary');
};
const getSummaryScorePane = () => {
    return getElement('summary-score');
};
const getGame = () => {
    return getElement('game');
};
const getGameInner = () => {
    return getElement('game-inner');
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
const LobbyListItem = (lobby) => {
    const div = document.createElement('div');
    div.className = 'pane flex-hz pane-secondary';
    const button = document.createElement('button');
    button.style.width = '80%';
    button.className = 'secondary';
    button.innerText = `${lobby.name} (${lobby.players.length})`;
    button.onclick = () => {
        playSound('click');
        joinLobby(lobby.id, uiState.name);
    };
    div.appendChild(button);
    return div;
};
const renderLobbyList = (lobbies) => {
    const lobbyList = getLobbyListPane();
    setHTML(lobbyList, '');
    if (lobbies.length) {
        lobbies.forEach(lobby => {
            lobbyList.appendChild(LobbyListItem(lobby));
        });
    }
    else {
        setHTML(lobbyList, '<div style="text-align: center">There are no lobbies right now.</div>');
    }
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
        playSound('click');
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
        playSound('click');
        startLobby();
    };
    const leaveGameButton = getLobbyLeaveButton();
    leaveGameButton.onclick = () => {
        playSound('click');
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
        playSound('click');
        sendRequestToShoot();
        renderUi();
    };
    const prevButton = getPrevButton();
    prevButton.onclick = () => {
        playSound('click');
        sendRequestToGoToPrev();
        renderUi();
    };
    prevButton.disabled = myEntity.posHistoryI === 0;
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
    const powerInput = getPowerInput();
    powerInput.max = POWER_MULTIPLIERS.length - 1;
    powerInput.oninput = ev => {
        const value = Number(ev.target.value);
        setLocalPlayerPowerIndex(value);
        setShotPreview(generateShotPreview(gameData, getCurrentShotArgs()));
    };
    setShotPreview(generateShotPreview(gameData, getCurrentShotArgs()));
    const gameUiTop = getGameUiTopPane();
    setHTML(gameUiTop, '');
    const colorInfoLabel = createElement('div');
    setHTML(colorInfoLabel, `You are the <span style="${getColorStyles(myEntity.color)}">${myEntity.color.toUpperCase()}</span> Player.`);
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
    if (uiState.roundCompleted) {
        renderScoreCard(gameUiMid);
        const div = createElement('div');
        setHTML(div, 'Next round starting soon...');
        gameUiMid.appendChild(div);
    }
    else {
        const shotResultLabel = createElement('div');
        setHTML(shotResultLabel, `You shot a ${myEntity.shotCt}.`);
        shotResultLabel.style['font-size'] = '42px';
        gameUiMid.appendChild(shotResultLabel);
    }
};
const renderScoreCard = (parent) => {
    const gameData = getGameData();
    if (!gameData) {
        return;
    }
    const table = createElement('table');
    const head = createElement('thead');
    const row = createElement('tr');
    for (let i = 0; i < gameData.numRounds + 2; i++) {
        const column = createElement('th');
        setHTML(column, i === gameData.numRounds + 1 ? 'Total' : i === 0 ? 'Name' : 'Rd ' + i);
        row.appendChild(column);
    }
    head.appendChild(row);
    table.appendChild(head);
    gameData.players
        .map(playerId => getShared().getEntity(gameData, playerId))
        .forEach((playerEntity) => {
        if (playerEntity.disconnected) {
            return;
        }
        const row = createElement('tr');
        const scores = gameData.scorecard[playerEntity.id];
        const label = createElement('td');
        setHTML(label, `<div style="${getColorStyles(playerEntity.color)}">${playerEntity.name}</div>`);
        row.appendChild(label);
        let total = 0;
        for (let i = 0; i < gameData.numRounds; i++) {
            const column = createElement('td');
            total += scores[i] ?? 0;
            setHTML(column, String(scores[i] ?? '_'));
            row.appendChild(column);
        }
        const totalColumn = createElement('td');
        setHTML(totalColumn, String(total));
        row.appendChild(totalColumn);
        table.appendChild(row);
    });
    parent.appendChild(table);
};
const renderSummary = () => {
    const summaryScore = getSummaryScorePane();
    setHTML(summaryScore, '');
    renderScoreCard(summaryScore);
    const continueButton = getSummaryContinueButton();
    continueButton.onclick = () => {
        playSound('click');
        setUiState({
            activePane: 'menu',
        });
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
        case 'summary': {
            showSummary();
            renderSummary();
            break;
        }
        case 'game': {
            showGame();
            renderGameUi();
            panZoom();
        }
    }
};
let soundEnabled = true;
const isSoundEnabled = () => soundEnabled;
const setSoundEnabled = (v) => (soundEnabled = v);
const setVolume = (v) => (zzfxV = v);
const soundStorage = {
    click: [
        1.42,
        0,
        136,
        0.01,
        0.04,
        0,
        1,
        1.15,
        ,
        ,
        -520,
        ,
        0.02,
        ,
        10,
        ,
        0.01,
        ,
        0.01,
        0.15,
    ],
    cancel: [
        [
            2.32,
            0,
            188,
            0.03,
            0.03,
            0,
            1,
            1.11,
            ,
            -0.1,
            ,
            ,
            ,
            ,
            ,
            0.4,
            0.19,
            0.59,
            0.02,
        ],
    ],
    start: [
        2.06,
        0,
        280,
        0.03,
        0.21,
        0.04,
        1,
        2.02,
        ,
        ,
        -820,
        0.07,
        0.23,
        0.1,
        ,
        0.1,
        0.33,
        ,
        ,
        0.36,
    ],
    end: [
        1.99,
        0,
        734,
        0.08,
        0.06,
        0.02,
        1,
        0.03,
        ,
        ,
        -287,
        ,
        0.04,
        ,
        ,
        ,
        0.24,
        ,
        0.1,
    ],
    expl: [
        ,
        0,
        499,
        ,
        0.22,
        0.36,
        3,
        2.17,
        0.5,
        ,
        ,
        ,
        ,
        0.3,
        ,
        0.7,
        ,
        0.9,
        0.02,
        0.25,
    ],
    completed: [
        ,
        0,
        1732,
        0.08,
        ,
        0.02,
        ,
        0.26,
        ,
        20,
        -402,
        0.08,
        ,
        ,
        ,
        ,
        ,
        0.49,
        0.03,
    ],
    holeInOne: [
        1.25,
        0,
        355,
        0.18,
        0.01,
        0.15,
        2,
        0.01,
        ,
        53,
        -79,
        0.18,
        ,
        0.7,
        -2.1,
        ,
        0.12,
        ,
        0.12,
        0.02,
    ],
};
const playSound = (soundName) => {
    if (!isSoundEnabled()) {
        console.log('sound not enabled');
        return;
    }
    const soundObj = soundStorage[soundName];
    if (!soundObj) {
        console.error('No sound exists with name: ' + soundName);
        return;
    }
    const soundVolume = 0.3;
    setVolume(soundVolume);
    zzfx(...soundObj);
};
//# sourceMappingURL=client.js.map