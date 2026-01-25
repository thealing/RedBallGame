const MIN_WIDTH = 960;
const MIN_HEIGHT = 720;
const WIDTH = Math.max(Math.max(MIN_WIDTH, window.innerWidth), window.innerWidth / window.innerHeight * MIN_HEIGHT);
const HEIGHT = Math.max(Math.max(MIN_HEIGHT, window.innerHeight), window.innerHeight / window.innerWidth * MIN_WIDTH);
const DELTA_TIME = 0.01;
const TOUCH_RANGE = 20;
const SERVER_URL = 'https://classy-creponne-dc941b.netlify.app/.netlify/functions/api';

let canvas;
let context;
let popupDiv;
let popupInput;
let popupButton;
let canvasContainer;
let userDiv;
let usernameLabel;
let usernameInput;
let passwordLabel;
let passwordInput;
let userErrorLabel;
let userLoginButton;
let userSignupButton;
let guestButton;
let formDiv;
let images;
let scenes;
let currentScene;
let previousScene;
let mousePosition;
let mouseDownPosition;
let mouseIsDown;
let doubleClickPosition;
let doubleClickTimeout;
let clicksCanceled;
let pressedKeys;
let touchPositions;
let playerData;
let gameData;
let gameInput;
let ingameTimers;
let localErrors;
let serverDataMerged;
let playerScale;
let lastFrameTime;

init();

function init() {
  document.body.style.margin = 0;
  document.body.style.display = 'flex';
  document.body.style.justifyContent = 'center';
  document.body.style.alignItems = 'center';
  document.body.style.background = 'coral';
  canvas = document.createElement('canvas');
  canvas.style.backgroundColor = 'black';
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  canvasContainer = document.createElement('div');
  canvasContainer.appendChild(canvas);
  document.body.appendChild(canvasContainer);
  context = canvas.getContext('2d');
  context.textBaseline = 'middle';
  ingameTimers = new Set();
  mousePosition = new Vector(0, 0);
  mouseIsDown = false;
  pressedKeys = new Set();
  touchPositions = new Map();
  localErrors = {};
  function onMouseDown(e) {
    if (e?.button) {
      return;
    }
    mousePosition = screenToCanvasPosition(e.pageX, e.pageY);
    mouseDownPosition = mousePosition.clone();
    mouseIsDown = true;
    clicksCanceled = false;
    onTouchDown(mousePosition);
  };
  function onMouseUp(e) {
    if (e?.button) {
      return;
    }
    let doubleClicked = false;
    if (!clicksCanceled && mouseDownPosition && Vector.distance(mouseDownPosition, mousePosition) <= TOUCH_RANGE) {
      if (doubleClickPosition && performance.now() < doubleClickTimeout && Vector.distance(doubleClickPosition, mousePosition) <= TOUCH_RANGE) {
        onDoubleClick(doubleClickPosition);
        doubleClicked = true;
      }
      onClick(mouseDownPosition);
    }
    if (doubleClicked) {
      doubleClickPosition = null;
    }
    else {
      doubleClickTimeout = performance.now() + playerData.doubleClickTime;
      doubleClickPosition = mouseDownPosition;
    }
    mouseIsDown = false;
    onTouchUp(mousePosition);
  };
  function onMouseMove(pageX, pageY) {
    const position = screenToCanvasPosition(pageX, pageY);
    if (mouseIsDown) {
      if (Vector.distance(mouseDownPosition, mousePosition) > TOUCH_RANGE) {
        clicksCanceled = true;
      }
      onTouchMove(position, Vector.subtract(position, mousePosition));
    }
    mousePosition = position;
  };
  document.addEventListener('keydown', (e) => {
    if (pressedKeys.has(e.key)) {
      return;
    }
    pressedKeys.add(e.key);
  });
  document.addEventListener('keyup', (e) => {
    if (!pressedKeys.has(e.key)) {
      return;
    }
    pressedKeys.delete(e.key);
  });
  canvas.addEventListener('mousedown', (e) => onMouseDown(e));
  canvas.addEventListener('mouseup', (e) => onMouseUp(e));
  canvas.addEventListener('mouseout', (e) => onMouseUp(e));
  canvas.addEventListener('mousemove', (e) => onMouseMove(e.pageX, e.pageY));
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    onMouseMove(touch.pageX, touch.pageY);
    onMouseDown();
    for (const touch of e.changedTouches) {
      touchPositions.set(touch.identifier, screenToCanvasPosition(touch.pageX, touch.pageY));
    }
  });
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    onMouseUp();
    for (const touch of e.changedTouches) {
      touchPositions.delete(touch.identifier);
    }
    for (const touch of e.touches) {
      touchPositions.set(touch.identifier, screenToCanvasPosition(touch.pageX, touch.pageY));
    }
  });
  canvas.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    onMouseUp();
    for (const touch of e.changedTouches) {
      touchPositions.delete(touch.identifier);
    }
    for (const touch of e.touches) {
      touchPositions.set(touch.identifier, screenToCanvasPosition(touch.pageX, touch.pageY));
    }
  });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    onMouseMove(touch.pageX, touch.pageY);
    for (const touch of e.changedTouches) {
      touchPositions.set(touch.identifier, screenToCanvasPosition(touch.pageX, touch.pageY));
    }
  });
  createInputPopup();
  createUserPopup();
  loadImages();
  createScenes();
  initPlayerData();
  initGameData();
  initGameInput();
  loadLocalData();
  changeScene(scenes.main);
  setInterval(update, 1);
  requestAnimationFrame(render);
}

function setTimeoutIngame(callback, delay, ...args) {
  const timer = { callback, delay, args };
  ingameTimers.add(timer);
  return timer;
}

function clearTimeoutIngame(timer) {
  ingameTimers.delete(timer);
}

function updateIngameTimers() {
  for (const timer of ingameTimers) {
    timer.delay -= DELTA_TIME * 1000;
    if (timer.delay <= 0 && timer.callback) {
      timer.callback(...timer.args);
    }
  }
  for (const timer of ingameTimers) {
    if (timer.delay <= 0) {
      ingameTimers.delete(timer);
    }
  }
}

function changeScene(newScene) {
  doubleClickPosition = null;
  if (playerData.username) {
    syncPlayer();
  }
  if (gameData.paused) {
    return;
  }
  if (currentScene) {
    currentScene.leave();
  }
  previousScene = currentScene;
  currentScene = newScene;
  if (currentScene) {
    currentScene.enter();
  }
}

function update() {
  const frameTime = performance.now() / 1000;
  if (!lastFrameTime || gameData.paused) {
    lastFrameTime = frameTime;
    return;
  }
  const maxSkipCount = 5;
  lastFrameTime = Math.max(lastFrameTime, frameTime - maxSkipCount * DELTA_TIME);
  while (lastFrameTime < frameTime) {
    updateIngameTimers();
    currentScene.update();
    lastFrameTime += DELTA_TIME;
  }
}

function render() {
  const bodyWidth = window.innerWidth;
  const bodyHeight = window.innerHeight;
  if (bodyWidth / bodyHeight <= WIDTH / HEIGHT) {
    canvas.style.width = bodyWidth;
    canvas.style.height = bodyWidth / WIDTH * HEIGHT;
  }
  else {
    canvas.style.height = bodyHeight;
    canvas.style.width = bodyHeight / HEIGHT * WIDTH;
  }
  context.save();
  context.clearRect(0, 0, canvas.width, canvas.height);
  currentScene.render();
  context.restore();
  scaleMenus();
  requestAnimationFrame(render);
}

function onTouchDown(position) {
  if (gameData.paused) {
    return;
  }
  currentScene.onTouchDown(position);
}

function onTouchUp(position) {
  if (gameData.paused) {
    return;
  }
  currentScene.onTouchUp(position);
}

function onTouchMove(position, delta) {
  if (gameData.paused) {
    return;
  }
  currentScene.onTouchMove(position, delta, mouseDownPosition);
}

function onClick(position) {
  if (gameData.paused) {
    return;
  }
  currentScene.onClick(position);
}

function onDoubleClick(position) {
  if (gameData.paused) {
    return;
  }
  currentScene.onDoubleClick(position);
}

function screenToCanvasPosition(x, y) {
  const rect = canvas.getBoundingClientRect();
  x = (x - rect.left) * canvas.width / rect.width;
  y = (y - rect.top) * canvas.height / rect.height;
  return new Vector(x, y);
}

function createPlayerData() {
  return {
    username: '',
    password: '',
    draftLevels: [],
    publishedLevels: [],
    levelsCreated: 0,
    deathCount: 0,
    finishedLevelIds: [],
    doubleClickTime: 800,
    ballColor: '#ff2222',
  };
}

function initPlayerData() {
  playerData = createPlayerData();
}

function initGameData() {
  gameData = {
    paused: false,
    currentLevel: null,
    onLevelExit: null
  };
}

function initGameInput() {
  gameInput = {
    forward: 0,
    backward: 0,
    jump: 0
  };
}

function createScenes() {
  scenes = {};
  scenes.main = new MainScene();
  scenes.menu = new MenuScene();
  scenes.gallery = new GalleryScene();
  scenes.editor = new EditorScene();
  scenes.play = new PlayScene();
}

function generateRandomId() {
  return generateRandomString(32);
}

function generateRandomString(length) {
  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters[randomValues[i] % characters.length];
  }
  return result;
}

function compressJson(json) {
  const stream = new Blob([ json ], {
    type: 'application/json',
  }).stream();
  const compressionStream = new CompressionStream('gzip');
  return new Response(stream.pipeThrough(compressionStream)).arrayBuffer();
}

function tryLogin(username, password, callback) {
  const playerDataJson = JSON.stringify({ username, password });
  compressJson(playerDataJson).then((compressedPayload) => {
    fetch(`${SERVER_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Encoding': 'gzip'
      },
      body: compressedPayload
    })
    .then((response) => response.text())
    .then((text) => JSON.parse(text))
    .then((data) => callback(data))
    .catch((error) => callback(null));
  });
}

function trySignup(username, password, callback) {
  const playerDataJson = JSON.stringify({ username, password });
  compressJson(playerDataJson).then((compressedPayload) => {
    fetch(`${SERVER_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Encoding': 'gzip'
      },
      body: compressedPayload
    })
    .then((response) => response.text())
    .then((text) => JSON.parse(text))
    .then((data) => callback(data))
    .catch((error) => callback(null));
  });
}

function syncPlayer(callback) {
  saveLocalData();
  if (playerData.guestMode) {
    if (callback) {
      callback();
    }
    return;
  }
  if (!serverDataMerged) {
    if (serverDataMerged == null) {
      serverDataMerged = 0;
      loadPlayer(syncPlayer);
    }
    return;
  }
  const playerDataJson = JSON.stringify({ playerData });
  compressJson(playerDataJson).then((compressedPayload) => {
    console.log("Compressed player size: " + compressedPayload.byteLength + " bytes");
    fetch(`${SERVER_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Encoding': 'gzip'
      },
      body: compressedPayload
    })
    .then((response) => response.text())
    .then((text) => JSON.parse(text))
    .then((data) => {
      if (!data.error) {
        for (const level of playerData.publishedLevels) {
          level.sentToServer = true;
        }
      }
      if (callback) {
        callback();
      }
    })
    .catch(console.warn);
  });
}

function loadPlayer(callback) {
  const playerDataJson = JSON.stringify({ playerData });
  compressJson(playerDataJson).then((compressedPayload) => {
    fetch(`${SERVER_URL}/load`, {
      method: 'POST',
      headers: {
        'Content-Encoding': 'gzip'
      },
      body: compressedPayload
    })
    .then((response) => response.text())
    .then((text) => JSON.parse(text))
    .then((data) => {
      const serverData = data.playerData;
      if (!serverDataMerged) {
        serverDataMerged = true;
        if (playerData.username == serverData.username) {
          for (let level of serverData.draftLevels) {
            if (!playerData.draftLevels.some(l => l.id == level.id)) {
              playerData.draftLevels.push(level);
              scenes.menu.addedLevels = true;
            }
          }
          for (let level of serverData.publishedLevels) {
            if (!playerData.publishedLevels.some(l => l.id == level.id)) {
              playerData.publishedLevels.push(level);
            }
          }
          for (let id of serverData.finishedLevelIds) {
            if (!playerData.finishedLevelIds.includes(id)) {
              playerData.finishedLevelIds.push(id);
            }
          }
          playerData.levelsCreated = Math.max(playerData.levelsCreated, serverData.levelsCreated);
          playerData.deathCount = Math.max(playerData.deathCount, serverData.deathCount);
        }
      }
      else {
        setRecursively(playerData, serverData);
      }
      extendRecursively(playerData, createPlayerData());
      saveLocalData();
      if (callback) {
        callback();
      }
    })
    .catch(console.warn);
  });
}

function getPublicLevels(callback) {
  fetch(`${SERVER_URL}/getLevels`, {
    method: 'POST'
  })
  .then((response) => response.text())
  .then((text) => {
    if (currentScene != scenes.gallery) {
      return null;
    }
    console.log(`Public level storage size: ${text.length} characters`);
    return JSON.parse(text);
  })
  .then((data) => {
    if (data == null) {
      return;
    }
    console.log(`Got ${data.levels.length} public levels!`);
    callback(data.levels);
  })
  .catch(console.warn);
}

function saveLocalData() {
  try {
    const playerDataJson = JSON.stringify(playerData);
    localStorage.setItem("player", playerDataJson);
    return true;
  }
  catch (e) {
    if (!localErrors.saveError) {
      localErrors.saveError = e;
      alert("Failed to save local data: " + e);
    }
  }
}

function loadLocalData() {
  try {
    const playerDataJson = localStorage.getItem("player");
    if (playerDataJson) {
      playerData = JSON.parse(playerDataJson);
    }
  }
  catch (e) {
    if (!localErrors.loadError) {
      localErrors.loadError = e;
      alert("Failed to load local data: " + e);
    }
  }
}

function downloadLevel(level) {
  const clonedLevel = JSON.parse(JSON.stringify(level));
  clonedLevel.authors ??= [];
  clonedLevel.authors.push(clonedLevel.author);
  clonedLevel.author = playerData.username;
  if (hasLevelWithName(clonedLevel.name + " (copy)")) {
    for (let i = 2;; i++) {
      const name = clonedLevel.name + " (copy " + i + ")";
      if (!hasLevelWithName(name)) {
        clonedLevel.name = name;
        break;
      }
    }
  }
  else {
    clonedLevel.name += " (copy)";
  }
  clonedLevel.verified = false;
  clonedLevel.sentToServer = false;
  clonedLevel.id = generateRandomId();
  playerData.draftLevels.push(clonedLevel);
  saveLocalData();
}

function hasLevelWithName(name) {
  if (playerData.draftLevels.some(l => l.name == name)) {
    return true;
  }
  if (playerData.publishedLevels.some(l => l.name == name)) {
    return true;
  }
  return false;
}

function createInputPopup() {
  popupDiv = document.createElement('div');
  popupDiv.style.background = 'lightgray';
  popupDiv.style.border = '1px solid black';
  popupDiv.style.position = 'absolute';
  popupDiv.style.width = '400px';
  popupDiv.style.height = '200px';
  popupDiv.style.display = 'none';
  popupDiv.style.flexDirection = 'column';
  popupInput = document.createElement('input');
  popupInput.type = 'text';
  popupInput.style.position = 'relative';
  popupInput.style.width = '100%';
  popupInput.style.height = '50%';
  popupInput.style.fontSize = '40px';
  popupDiv.appendChild(popupInput);
  popupButton = document.createElement('button');
  popupButton.style.position = 'relative';
  popupButton.style.width = '100%';
  popupButton.style.height = '50%';
  popupButton.style.fontSize = '40px';
  popupButton.innerHTML = 'ENTER';
  popupDiv.appendChild(popupButton);
  document.body.appendChild(popupDiv);
}

function createUserPopup() {
  userDiv = document.createElement('div');
  userDiv.style.background = 'lightgray';
  userDiv.style.border = '1px solid black';
  userDiv.style.position = 'absolute';
  userDiv.style.width = '600px';
  userDiv.style.height = '300px';
  userDiv.style.display = 'none';
  userDiv.style.flexDirection = 'column';
  usernameLabel = document.createElement('label');
  usernameLabel.innerHTML = 'Username:';
  usernameLabel.style.position = 'absolute';
  usernameLabel.style.left = '5%';
  usernameLabel.style.top = '0%';
  usernameLabel.style.width = '50%';
  usernameLabel.style.height = '60px';
  usernameLabel.style.fontSize = '40px';
  usernameLabel.style.fontFamily = 'Arial';
  usernameLabel.style.display = 'flex';
  usernameLabel.style.alignItems = 'center';
  usernameLabel.style.justifyContent = 'left';
  usernameInput = document.createElement('input');
  usernameInput.style.position = 'absolute';
  usernameInput.type = 'text';
  usernameInput.style.left = '50%';
  usernameInput.style.top = '0%';
  usernameInput.style.width = '50%';
  usernameInput.style.height = '60px';
  usernameInput.style.fontSize = '40px';
  passwordLabel = document.createElement('label');
  passwordLabel.innerHTML = 'Password:';
  passwordLabel.style.position = 'absolute';
  passwordLabel.style.left = '5%';
  passwordLabel.style.top = '60px';
  passwordLabel.style.width = '50%';
  passwordLabel.style.height = '60px';
  passwordLabel.style.fontSize = '40px';
  passwordLabel.style.fontFamily = 'Arial';
  passwordLabel.style.display = 'flex';
  passwordLabel.style.alignItems = 'center';
  passwordLabel.style.justifyContent = 'left';
  passwordInput = document.createElement('input');
  passwordInput.style.position = 'absolute';
  passwordInput.type = 'text';
  passwordInput.style.left = '50%';
  passwordInput.style.top = '60px';
  passwordInput.style.width = '50%';
  passwordInput.style.height = '60px';
  passwordInput.style.fontSize = '40px';
  userErrorLabel = document.createElement('label');
  userErrorLabel.innerHTML = '';
  userErrorLabel.style.position = 'absolute';
  userErrorLabel.style.left = '0%';
  userErrorLabel.style.top = '120px';
  userErrorLabel.style.width = '100%';
  userErrorLabel.style.height = '60px';
  userErrorLabel.style.fontSize = '30px';
  userErrorLabel.style.fontFamily = 'Arial';
  userErrorLabel.style.display = 'flex';
  userErrorLabel.style.alignItems = 'center';
  userErrorLabel.style.justifyContent = 'center';
  userLoginButton = document.createElement('button');
  userLoginButton.style.position = 'absolute';
  userLoginButton.style.left = '0%';
  userLoginButton.style.top = '180px';
  userLoginButton.style.width = '50%';
  userLoginButton.style.height = '60px';
  userLoginButton.style.fontSize = '40px';
  userLoginButton.innerHTML = 'LOG IN';
  userSignupButton = document.createElement('button');
  userSignupButton.style.position = 'absolute';
  userSignupButton.style.left = '50%';
  userSignupButton.style.top = '180px';
  userSignupButton.style.width = '50%';
  userSignupButton.style.height = '60px';
  userSignupButton.style.fontSize = '40px';
  userSignupButton.innerHTML = 'SIGN UP';
  guestButton = document.createElement('button');
  guestButton.style.position = 'absolute';
  guestButton.style.left = '0%';
  guestButton.style.top = '240px';
  guestButton.style.width = '100%';
  guestButton.style.height = '60px';
  guestButton.style.fontSize = '40px';
  guestButton.innerHTML = 'Play as Guest';
  canvasContainer.style.position = 'relative';
  userDiv.appendChild(usernameLabel);
  userDiv.appendChild(usernameInput);
  userDiv.appendChild(passwordLabel);
  userDiv.appendChild(passwordInput);
  userDiv.appendChild(userErrorLabel);
  userDiv.appendChild(userLoginButton);
  userDiv.appendChild(userSignupButton);
  userDiv.appendChild(guestButton);
  userDiv.style.transform = 'scale(0)';
  document.body.appendChild(userDiv);
}

function scaleMenus() {
  if (userDiv) {
    scalePopup(userDiv);
  }
  if (popupDiv) {
    scalePopup(popupDiv);
  }
  if (formDiv) {
    scalePopup(formDiv);
  }
}

function scalePopup(element) {
  const canvasHeight = canvas.offsetHeight;
  const canvasWidth = canvas.offsetWidth;
  const scale = Math.min(1, Math.min(0.9 * canvasHeight / parseFloat(element.style.height), 0.9 * canvasWidth / parseFloat(element.style.width)));
  element.style.transform = `scale(${scale})`;
  element.style.transformOrigin = 'center';
}

function showInputPopup(text, callback) {
  gameData.paused = true;
  popupDiv.style.display = 'flex';
  popupDiv.style.transform = 'scale(0)';
  popupInput.value = text;
  popupInput.focus();
  popupButton.onclick = () => {
    if (popupInput.value) {
      gameData.paused = false;
      popupDiv.style.display = 'none';
      callback(popupInput.value);
      doubleClickPosition = null;
    }
  };
  setTimeout(scaleMenus, 0);
}

function showUserPopup() {
  gameData.paused = true;
  userDiv.style.display = 'flex';
  usernameInput.value = '';
  passwordInput.value = '';
  userErrorLabel.innerHTML = '';
  userLoginButton.onclick = () => uiLogin();
  userSignupButton.onclick = () => uiSignup();
  guestButton.onclick = () => loginGuest();
}

function showForm(items, callback) {
  const form = document.createElement('div');
  form.style.background = 'lightgray';
  form.style.border = '1px solid black';
  form.style.position = 'absolute';
  form.style.width = '600px';
  form.style.height = (items.length + 1) * 60 + 'px';
  form.style.display = 'flex';
  form.style.flexDirection = 'column';
  for (let i = 0; i < items.length; i++) {
    const label = document.createElement('label');
    label.innerHTML = items[i].label;
    label.style.position = 'absolute';
    label.style.left = '5%';
    label.style.top = i * 60 + 'px';
    label.style.width = '50%';
    label.style.height = '60px';
    label.style.fontSize = '30px';
    label.style.fontFamily = 'Arial';
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.justifyContent = 'left';
    if (items[i].type == 'title') {
      label.style.width = '90%';
      label.style.justifyContent = 'center';
    }
    form.appendChild(label);
    function setAttributes(element) {
      element.style.position = 'absolute';
      element.style.left = '55%';
      element.style.top = i * 60 + 5 + 'px';
      element.style.width = '40%';
      element.style.height = '50px';
      element.style.fontSize = '30px';
      element.style.fontFamily = 'Arial';
      element.style.display = 'flex';
      element.style.alignItems = 'center';
      element.style.justifyContent = 'left';
    }
    switch (items[i].type) {
      case 'span': {
        const span = document.createElement('span');
        setAttributes(span);
        span.textContent = items[i].get();
        form.appendChild(span);
        break;
      }
      case 'check': {
        const input = document.createElement('input');
        setAttributes(input);
        input.type = 'checkbox';
        input.style.width = '50px';
        input.checked = items[i].get();
        input.addEventListener('change', (event) => {
          items[i].set(input.checked);
        });
        form.appendChild(input);
        break;
      }
      case 'text': {
        const input = document.createElement('input');
        setAttributes(input);
        input.type = 'text';
        input.value = items[i].get();
        input.addEventListener('input', (event) => {
          items[i].set(input.value);
        });
        form.appendChild(input);
        break;
      }
      case 'number': {
        const input = document.createElement('input');
        setAttributes(input);
        input.type = 'number';
        input.step = items[i].step;
        input.value = items[i].get();
        input.addEventListener('input', (event) => {
          items[i].set(Number(input.value));
        });
        form.appendChild(input);
        break;
      }
      case 'color': {
        const input = document.createElement('input');
        setAttributes(input);
        input.type = 'color';
        input.value = items[i].get();
        input.addEventListener('input', (event) => {
          items[i].set(input.value);
        });
        form.appendChild(input);
        break;
      }
      case 'range': {
        const input = document.createElement('input');
        setAttributes(input);
        input.type = 'range';
        input.min = items[i].min;
        input.max = items[i].max;
        input.step = items[i].step;
        input.value = items[i].get();
        input.addEventListener('input', (event) => {
          items[i].set(Number(input.value));
        });
        form.appendChild(input);
        break;
      }
      case 'list': {
        const selector = document.createElement('select');
        setAttributes(selector);
        for (const value of items[i].values) {
          const option = document.createElement('option');
          option.textContent = value;
          option.value = value;
          option.selected = value == items[i].get();
          selector.appendChild(option);
        }
        selector.addEventListener('change', (event) => {
          items[i].set(event.target.value);
        });
        form.appendChild(selector);
        break;
      }
    }
  }
  const button = document.createElement('button');
  button.style.position = 'absolute';
  button.style.left = '0%';
  button.style.bottom = '0%';
  button.style.width = '100%';
  button.style.height = '60px';
  button.style.fontSize = '40px';
  button.innerHTML = 'OK';
  button.onclick = () => {
    formDiv = null;
    document.body.removeChild(form);
    gameData.paused = false;
    if (callback) {
      callback();
    }
    doubleClickPosition = null;
  }
  form.appendChild(button);
  formDiv = form;
  formDiv.style.transform = 'scale(0)';
  setTimeout(scaleMenus, 0);
  document.body.appendChild(form);
  gameData.paused = true;
}

function uiLogin(callback) {
  if (!usernameInput.value) {
    userErrorLabel.style.color = 'red';
    userErrorLabel.innerHTML = 'Username is empty!';
    return;
  }
  userErrorLabel.style.color = 'black';
  userErrorLabel.innerHTML = 'Connecting...';
  tryLogin(usernameInput.value, passwordInput.value, (response) => {
    if (!response) {
      userErrorLabel.style.color = 'red';
      userErrorLabel.innerHTML = 'Connection failed!';
      return;
    }
    if (response.error) {
      userErrorLabel.style.color = 'red';
      userErrorLabel.innerHTML = response.error;
      return;
    }
    playerData.username = usernameInput.value;
    playerData.password = passwordInput.value;
    loadPlayer(callback);
    gameData.paused = false;
    userDiv.style.display = 'none';
  });
}

function uiSignup(callback) {
  if (!usernameInput.value) {
    userErrorLabel.style.color = 'red';
    userErrorLabel.innerHTML = 'Username is empty!';
    return;
  }
  userErrorLabel.style.color = 'black';
  userErrorLabel.innerHTML = 'Connecting...';
  trySignup(usernameInput.value, passwordInput.value, (response) => {
    if (!response) {
      userErrorLabel.style.color = 'red';
      userErrorLabel.innerHTML = 'Connection failed!';
      return;
    }
    if (response.error) {
      userErrorLabel.style.color = 'red';
      userErrorLabel.innerHTML = response.error;
      return;
    }
    initPlayerData();
    playerData.username = usernameInput.value;
    playerData.password = passwordInput.value;
    syncPlayer(callback);
    gameData.paused = false;
    userDiv.style.display = 'none';
  });
}

function loginGuest() {
  initPlayerData();
  playerData.username = "Guest";
  playerData.password = "Guest";
  playerData.guestMode = true;
  gameData.paused = false;
  userDiv.style.display = 'none';
  saveLocalData();
}

function drawCircle(position, radius) {
  context.beginPath();
  context.arc(position.x, position.y, radius, 0, Math.PI * 2);
  context.fill();
  context.closePath();
}

function drawSegment(start, end) {
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
  context.closePath();
}

function drawRect(lower, upper) {
  context.beginPath();
  context.moveTo(lower.x, lower.y);
  context.lineTo(lower.x, upper.y);
  context.lineTo(upper.x, upper.y);
  context.lineTo(upper.x, lower.y);
  context.fill();
}

function drawPolyline(polyline) {
  if (polyline.length < 2) {
    return;
  }
  if (polyline.color == null) {
    polyline.color = EditorScene.terrainTypes[polyline.index].color;
  }
  const style = polyline.color instanceof Image ? context.createPattern(polyline.color, 'repeat') : polyline.color;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = polyline.width;
  context.strokeStyle = style;
  context.beginPath();
  context.moveTo(polyline[0].x, polyline[0].y);
  for (let i = 1; i < polyline.length; i++) {
    context.lineTo(polyline[i].x, polyline[i].y);
  }
  if (polyline.filled) {
    context.lineTo(polyline[0].x, polyline[0].y);
    context.fillStyle = style;
    context.fill();
  }
  context.stroke();
}

function drawImage(image, position, angle, scale) {
  if (!image) {
    return;
  }
  context.save();
  context.translate(position.x, position.y);
  if (angle != undefined) {
    context.rotate(angle);
  }
  if (scale != undefined) {
    if (typeof scale == 'number') {
      context.scale(scale, scale);
    }
    else {
      context.scale(scale.x, scale.y);
    }
  }
  context.drawImage(image, -image.width / 2, -image.height / 2, image.width, image.height);
  context.restore();
}

function drawOpaqueLevelImage(image, position, angle, scale) {
  if (!image) {
    return;
  }
  context.fillRect(position.x - image.width / 2 + 6, position.y - image.width / 2 + 6, image.width - 12, image.height - 12);
  drawImage(image, position, angle, scale);
}

function drawText(text, position, font, alignment, maxWidth) {
  context.font = font;
  context.textAlign = alignment || 'center';
  context.fillText(text, position.x, position.y, maxWidth);
}

function drawRotatedText(text, position, angle, font, alignment, maxWidth) {
  context.save();
  context.translate(position.x, position.y);
  context.rotate(angle);
  context.font = font;
  context.textAlign = alignment || 'center';
  context.fillText(text, 0, 0, maxWidth);
  context.restore();
}

function measureText(text, font, alignment, maxWidth) {
  context.font = font;
  context.textAlign = alignment || 'center';
  const textMetrics = context.measureText(text);
  return new Vector(textMetrics.width, textMetrics.actualBoundingBoxDescent + textMetrics.actualBoundingBoxAscent);
}

function colorizeImage(image, color) {
  const w = image.width;
  const h = image.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext('2d');
  function colorize() {
    context.globalCompositeOperation = 'copy';
    context.drawImage(image, 0, 0, w, h);
    context.globalCompositeOperation = 'source-in';
    context.fillStyle = color;
    context.fillRect(0, 0, w, h);
    context.globalCompositeOperation = 'multiply';
    context.drawImage(image, 0, 0, w, h);
  }
  if (!image.complete) {
    image.onload = colorize;
  } else {
    colorize();
  }
  return canvas;
}

function loadImage(path, width, height) {
  const image = new Image();
  image.src = path;
  image.width = width;
  image.height = height;
  return image;
}

function loadImages() {
  images = {};
  images.new_level = loadImage('images/new_level.png', 300, 100);
  images.delete_level = loadImage('images/delete_level.png', 100, 100);
  images.edit_level = loadImage('images/edit_level.png', 100, 100);
  images.play_level = loadImage('images/play_level.png', 100, 100);
  images.download_level = loadImage('images/download_level.png', 100, 100);
  images.level_dirty = loadImage('images/level_dirty.png', 100, 100);
  images.level_synced = loadImage('images/level_synced.png', 100, 100);
  images.terrains = [
    loadImage('images/ground.png', 50, 50),
    loadImage('images/lava.png', 50, 50),
    loadImage('images/ice.png', 50, 50),
    loadImage('images/invisible.png', 50, 50)
  ]
  playerScale = 64 / 100;
  images.ball_background = loadImage('images/ball_background.png', 100, 100);
  images.ball_foreground = loadImage('images/ball_foreground.png', 100, 100);
  images.goal = loadImage('images/goal.png', 64, 64);
  images.box = loadImage('images/box.png', 100, 100);
  images.boulder = loadImage('images/boulder.png', 150, 150);
  images.boulder_deadly = loadImage('images/boulder_deadly.png', 150, 150);
  images.button = loadImage('images/button.png', 100, 100);
  images.buttons = [
    loadImage('images/button.png', 100, 100),
    loadImage('images/button_toggled.png', 100, 100),
  ];
  images.button_presseds = [
    loadImage('images/button_pressed.png', 100, 100),
    loadImage('images/button_pressed_toggled.png', 100, 100),
  ]
  images.switch_left = loadImage('images/switch_left.png', 100, 100);
  images.switch_right = loadImage('images/switch_right.png', 100, 100);
  images.platform = loadImage('images/platform.png', 200, 200);
  images.platform_end = loadImage('images/platform_end.png', 200, 200);
  images.vanisher = loadImage('images/vanisher.png', 200, 200);
  images.vanisher_end = loadImage('images/vanisher_end.png', 200, 200);
  images.vanisher_2 = loadImage('images/vanisher_2.png', 200, 200);
  images.vanisher_end_2 = loadImage('images/vanisher_end_2.png', 200, 200);
  images.trampoline = loadImage('images/trampoline.png', 200, 200);
  images.trampoline_end = loadImage('images/trampoline_end.png', 200, 200);
  images.plank = loadImage('images/plank.png', 200, 200);
  images.plank_end = loadImage('images/plank_end.png', 200, 200);
  images.laser = loadImage('images/laser.png', 200, 200);
  images.laser_end = loadImage('images/laser_end.png', 200, 200);
  images.saw = loadImage('images/saw.png', 130, 130);
  images.windmill_blade = loadImage('images/windmill_blade.png', 300, 300);
  images.windmill_blade_reverse = loadImage('images/windmill_blade_reverse.png', 300, 300);
  images.windmill_center = loadImage('images/windmill_center.png', 300, 300);
  images.gravity_down = loadImage('images/gravity_down.png', 80, 80);
  images.gravity_up = loadImage('images/gravity_up.png', 80, 80);
  images.booster = loadImage('images/booster.png', 400, 200);
  images.booster_inactive = loadImage('images/booster_inactive.png', 400, 200);
  images.boosters = [
    loadImage('images/booster_2.png', 120, 200),
    loadImage('images/booster_4.png', 210, 200),
    loadImage('images/booster_6.png', 300, 200),
    loadImage('images/booster.png', 400, 200),
  ];
  images.boosters_inactive = [
    loadImage('images/booster_inactive_2.png', 120, 200),
    loadImage('images/booster_inactive_4.png', 210, 200),
    loadImage('images/booster_inactive_6.png', 300, 200),
    loadImage('images/booster_inactive.png', 400, 200),
  ];
  images.elevator = loadImage('images/elevator.png', 200, 200);
  images.elevator_end = loadImage('images/elevator_end.png', 200, 200);
  images.teleport = loadImage('images/teleport.png', 100, 100);
  images.door = loadImage('images/door.png', 200, 200);
  images.door_end = loadImage('images/door_end.png', 200, 200);
  images.key_hole = loadImage('images/key_hole.png', 200, 200);
  images.key = loadImage('images/key.png', 60, 60);
  images.star = loadImage('images/star.png', 40, 40);
  images.signs = [
    loadImage('images/sign_arrow.png', 120, 120),
    loadImage('images/sign_arrow_back.png', 120, 120),
    loadImage('images/sign_danger.png', 120, 120),
    loadImage('images/sign_stop.png', 120, 120)
  ];
  images.fence = loadImage('images/fence.png', 400, 200);
  images.ui = {};
  images.ui.buttons = [
    {
      frame: loadImage('images/ui/button_0_frame.png', 80, 80),
      disabled: loadImage('images/ui/button_0_disabled.png', 80, 80),
      selected: loadImage('images/ui/button_0_selected.png', 80, 80),
      pressed: loadImage('images/ui/button_0_pressed.png', 80, 80),
    }, 
    {
      frame: loadImage('images/ui/button_1_frame.png', 160, 80),
      disabled: loadImage('images/ui/button_1_disabled.png', 160, 80),
      selected: loadImage('images/ui/button_1_selected.png', 160, 80),
      pressed: loadImage('images/ui/button_1_pressed.png', 160, 80),
    }, 
    {
      frame: loadImage('images/ui/button_2_frame.png', 420, 100),
      disabled: loadImage('images/ui/button_2_disabled.png', 420, 100),
      selected: loadImage('images/ui/button_2_selected.png', 420, 100),
      pressed: loadImage('images/ui/button_2_pressed.png', 420, 100),
    }, 
    {
      frame: loadImage('images/ui/button_3_frame.png', 100, 100),
      disabled: loadImage('images/ui/button_3_disabled.png', 100, 100),
      pressed: loadImage('images/ui/button_3_pressed.png', 100, 100),
    }, 
    {
      frame: loadImage('images/ui/button_4_frame.png', 100, 100),
      disabled: loadImage('images/ui/button_4_disabled.png', 100, 100),
      pressed: loadImage('images/ui/button_4_pressed.png', 100, 100),
    }
  ];
  images.ui.icon_cross = loadImage('images/ui/icon_cross.png', 70, 70);
  images.ui.icon_polyline = loadImage('images/ui/icon_polyline.png', 70, 70);
  images.ui.icon_eraser = loadImage('images/ui/icon_eraser.png', 70, 70);
  images.ui.icon_gadgets = loadImage('images/ui/icon_gadgets.png', 62, 62);
  images.ui.icon_decorations = loadImage('images/ui/icon_decorations.png', 62, 62);
  images.ui.icon_grid = loadImage('images/ui/icon_grid.png', 50, 50);
  images.ui.icon_zoom_in = loadImage('images/ui/icon_zoom_in.png', 70, 70);
  images.ui.icon_zoom_out = loadImage('images/ui/icon_zoom_out.png', 70, 70);
  images.ui.icon_trash = loadImage('images/ui/icon_trash.png', 70, 70);
  images.ui.icon_duplicate = loadImage('images/ui/icon_duplicate.png', 70, 70);
  images.ui.icon_rotate = loadImage('images/ui/icon_rotate.png', 70, 70);
  images.ui.icon_editor = loadImage('images/ui/icon_editor.png', 70, 70);
  images.ui.icon_polyline_freehand = loadImage('images/ui/icon_polyline_freehand.png', 70, 70);
  images.ui.icon_polyline_segment = loadImage('images/ui/icon_polyline_segment.png', 70, 70);
  images.ui.icon_polyline_rectangle = loadImage('images/ui/icon_polyline_rectangle.png', 70, 70);
  images.ui.icon_polyline_ellipse = loadImage('images/ui/icon_polyline_ellipse.png', 70, 70);
  images.ui.gadgets = [
    loadImage('images/box.png', 50, 50),
    loadImage('images/boulder.png', 50, 50),
    loadImage('images/button.png', 50, 50),
    loadImage('images/switch_left.png', 50, 50),
    loadImage('images/platform.png', 50, 50),
    loadImage('images/vanisher.png', 50, 50),
    loadImage('images/trampoline.png', 50, 50),
    loadImage('images/plank.png', 50, 50),
    loadImage('images/laser.png', 50, 50),
    loadImage('images/saw.png', 50, 50),
    loadImage('images/windmill.png', 50, 50),
    loadImage('images/sensor.png', 50, 50),
    loadImage('images/gravity_down.png', 50, 50),
    loadImage('images/booster.png', 60, 30),
    loadImage('images/elevator_icon.png', 50, 50),
    colorizeImage(loadImage('images/teleport.png', 50, 50), 'orange'),
    colorizeImage(loadImage('images/key.png', 50, 50), 'orange'),
  ];
  images.ui.decors = [
    loadImage('images/star.png', 50, 50),
    loadImage('images/sign_icon.png', 50, 50),
    loadImage('images/fence.png', 70, 35),
    loadImage('images/text.png', 50, 50),
  ];
  images.ui.arrow = {};
  images.ui.arrow.left = loadImage('images/ui/arrow_left.png', 120, 120);
  images.ui.arrow.left_pressed = loadImage('images/ui/arrow_left_pressed.png', 120, 120);
  images.ui.arrow.right = loadImage('images/ui/arrow_right.png', 120, 120);
  images.ui.arrow.right_pressed = loadImage('images/ui/arrow_right_pressed.png', 120, 120);
  images.ui.arrow.up = loadImage('images/ui/arrow_up.png', 120, 120);
  images.ui.arrow.up_pressed = loadImage('images/ui/arrow_up_pressed.png', 120, 120);
}
