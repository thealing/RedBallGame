const WIDTH = Math.max(720 / 3 * 4, window.innerWidth / window.innerHeight * 720);
const HEIGHT = 720;
const DELTA_TIME = 0.01;
const TOUCH_RANGE = 20;
const LONG_PRESS_DELAY = 1000;
const SERVER_URL = 'https://classy-creponne-dc941b.netlify.app/.netlify/functions/api';

let canvas;
let context;
let popupDiv;
let popupInput;
let popupButton;
let userDiv;
let usernameLabel;
let usernameInput;
let passwordLabel;
let passwordInput;
let userErrorLabel;
let userLoginButton;
let userSignupButton;
let editorDiv;
let editorTextArea;
let editorButton;
let images;
let scenes;
let currentScene;
let previousScene;
let mousePosition;
let mouseDownPosition;
let mouseIsDown;
let mouseLongPressTimeout;
let clicksCanceled;
let pressedKeys;
let touchPositions;
let playerData;
let gameData;
let gameInput;

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
  document.body.appendChild(canvas);
  context = canvas.getContext('2d');
  context.textBaseline = 'middle';
  mousePosition = new Vector(0, 0);
  mouseIsDown = false;
  pressedKeys = new Set();
  touchPositions = new Map();
  function onMouseDown() {
    mouseDownPosition = mousePosition.clone();
    mouseIsDown = true;
    mouseLongPressTimeout = setTimeout(onLongClick, LONG_PRESS_DELAY, mousePosition);
    clicksCanceled = false;
    onTouchDown(mousePosition);
  };
  function onMouseUp() {
    if (!clicksCanceled && mouseDownPosition && Vector.distance(mouseDownPosition, mousePosition) <= TOUCH_RANGE) {
      onClick(mouseDownPosition);
    }
    clearTimeout(mouseLongPressTimeout);
    mouseIsDown = false;
    onTouchUp(mousePosition);
  };
  function onMouseMove(pageX, pageY) {
    const position = screenToCanvasPosition(pageX, pageY);
    if (mouseIsDown) {
      if (Vector.distance(mouseDownPosition, mousePosition) > TOUCH_RANGE) {
        clearTimeout(mouseLongPressTimeout);
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
  canvas.addEventListener('mousedown', (e) => onMouseDown());
  canvas.addEventListener('mouseup', (e) => onMouseUp());
  canvas.addEventListener('mouseout', (e) => onMouseUp());
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
  changeScene(scenes.main);
  setInterval(update, DELTA_TIME * 1000);
  requestAnimationFrame(render);
  if (typeof debugPlayerData !== 'undefined') {
    setTimeout(() => {
      usernameInput.value = debugPlayerData.username;
      passwordInput.value = debugPlayerData.password;
      uiLogin(() => {
        gameData.currentLevel = playerData.draftLevels.top();
        if (gameData.currentLevel) {
          changeScene(scenes.editor);
        }
      });
    }, 100);
  }
}

function changeScene(newScene) {
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
  if (gameData.paused) {
    return;
  }
  currentScene.update();
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

function onLongClick(position) {
  if (gameData.paused) {
    return;
  }
  currentScene.onLongClick(position);
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
    ballColor: '#ffff00',
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
  const playerDataJson = JSON.stringify({ playerData });
  compressJson(playerDataJson).then((compressedPayload) => {
    console.log("syncing playerData with size: " + compressedPayload.byteLength);
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
      extendRecursively(playerData, data.playerData);
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
      setRecursively(playerData, data.playerData);
      extendRecursively(playerData, createPlayerData());
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
  .then((text) => JSON.parse(text))
  .then((data) => {
    console.log(`Got ${data.levels.length} public levels!`);
    callback(data.levels);
  })
  .catch(console.warn);
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
  usernameLabel.style.height = '20%';
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
  usernameInput.style.height = '20%';
  usernameInput.style.fontSize = '40px';
  passwordLabel = document.createElement('label');
  passwordLabel.innerHTML = 'Password:';
  passwordLabel.style.position = 'absolute';
  passwordLabel.style.left = '5%';
  passwordLabel.style.top = '20%';
  passwordLabel.style.width = '50%';
  passwordLabel.style.height = '20%';
  passwordLabel.style.fontSize = '40px';
  passwordLabel.style.fontFamily = 'Arial';
  passwordLabel.style.display = 'flex';
  passwordLabel.style.alignItems = 'center';
  passwordLabel.style.justifyContent = 'left';
  passwordInput = document.createElement('input');
  passwordInput.style.position = 'absolute';
  passwordInput.type = 'text';
  passwordInput.style.left = '50%';
  passwordInput.style.top = '20%';
  passwordInput.style.width = '50%';
  passwordInput.style.height = '20%';
  passwordInput.style.fontSize = '40px';
  userErrorLabel = document.createElement('label');
  userErrorLabel.innerHTML = '';
  userErrorLabel.style.position = 'absolute';
  userErrorLabel.style.left = '0%';
  userErrorLabel.style.top = '40%';
  userErrorLabel.style.width = '100%';
  userErrorLabel.style.height = '20%';
  userErrorLabel.style.fontSize = '30px';
  userErrorLabel.style.fontFamily = 'Arial';
  userErrorLabel.style.display = 'flex';
  userErrorLabel.style.alignItems = 'center';
  userErrorLabel.style.justifyContent = 'center';
  userErrorLabel.style.color = 'red';
  userLoginButton = document.createElement('button');
  userLoginButton.style.position = 'absolute';
  userLoginButton.style.left = '0%';
  userLoginButton.style.top = '60%';
  userLoginButton.style.width = '100%';
  userLoginButton.style.height = '20%';
  userLoginButton.style.fontSize = '40px';
  userLoginButton.innerHTML = 'LOG IN';
  userSignupButton = document.createElement('button');
  userSignupButton.style.position = 'absolute';
  userSignupButton.style.left = '0%';
  userSignupButton.style.top = '80%';
  userSignupButton.style.width = '100%';
  userSignupButton.style.height = '20%';
  userSignupButton.style.fontSize = '40px';
  userSignupButton.innerHTML = 'SIGN UP';
  userDiv.appendChild(usernameLabel);
  userDiv.appendChild(usernameInput);
  userDiv.appendChild(passwordLabel);
  userDiv.appendChild(passwordInput);
  userDiv.appendChild(userErrorLabel);
  userDiv.appendChild(userLoginButton);
  userDiv.appendChild(userSignupButton);
  document.body.appendChild(userDiv);
}

function showInputPopup(text, callback) {
  gameData.paused = true;
  popupDiv.style.display = 'flex';
  popupInput.value = text;
  popupInput.focus();
  popupButton.onclick = () => {
    if (popupInput.value) {
      gameData.paused = false;
      popupDiv.style.display = 'none';
      callback(popupInput.value);
    }
  };
}

function showUserPopup() {
  gameData.paused = true;
  userDiv.style.display = 'flex';
  usernameInput.value = '';
  passwordInput.value = '';
  userErrorLabel.innerHTML = '';
  userLoginButton.onclick = () => uiLogin();
  userSignupButton.onclick = () => uiSignup();
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
    document.body.removeChild(form);
    gameData.paused = false;
    if (callback) {
      callback();
    }
  }
  form.appendChild(button);
  document.body.appendChild(form);
  gameData.paused = true;
}

function uiLogin(callback) {
  tryLogin(usernameInput.value, passwordInput.value, (response) => {
    if (!response) {
      userErrorLabel.innerHTML = 'Connection failed!';
      return;
    }
    if (response.error != 'ok') {
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
  trySignup(usernameInput.value, passwordInput.value, (response) => {
    if (!response) {
      userErrorLabel.innerHTML = 'Connection failed!';
      return;
    }
    if (response.error != 'ok') {
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
  const canvas = new OffscreenCanvas(w, h);
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
  }
  else {
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
  images.level_dirty = loadImage('images/level_dirty.png', 100, 100);
  images.level_synced = loadImage('images/level_synced.png', 100, 100);
  images.terrains = [
    loadImage('images/ground.png', 50, 50),
    loadImage('images/lava.png', 50, 50),
    loadImage('images/ice.png', 50, 50),
    loadImage('images/invisible.png', 50, 50)
  ]
  images.ball_background = loadImage('images/ball_background.png', 64, 64);
  images.ball_foreground = loadImage('images/ball_foreground.png', 64, 64);
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
  images.ui.icon_gadgets = loadImage('images/ui/icon_gadgets.png', 70, 70);
  images.ui.icon_decorations = loadImage('images/ui/icon_decorations.png', 70, 70);
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
    loadImage('images/star.png', 50, 50),
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
