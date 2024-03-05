const WIDTH = Math.max(720 / 3 * 4, window.innerWidth / window.innerHeight * 720);
const HEIGHT = 720;
const DELTA_TIME = 0.01;
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

async function init() {
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
    mouseLongPressTimeout = setTimeout(onLongClick, 500, mousePosition);
    clicksCanceled = false;
    onTouchDown(mousePosition);
  };
  function onMouseUp() {
    if (!clicksCanceled && mouseDownPosition && Vector.distance(mouseDownPosition, mousePosition) <= 20) {
      onClick(mouseDownPosition);
    }
    clearTimeout(mouseLongPressTimeout);
    mouseIsDown = false;
    onTouchUp(mousePosition);
  };
  function onMouseMove(pageX, pageY) {
    const position = screenToCanvasPosition(pageX, pageY);
    if (mouseIsDown) {
      if (Vector.distance(mouseDownPosition, mousePosition) > 20) {
        clearTimeout(mouseLongPressTimeout);
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
  createEditor();
  loadImages();
  createScenes();
  initPlayerData();
  initGameData();
  initGameInput();
  changeScene(scenes.main);
  setInterval(update, DELTA_TIME * 1000);
  requestAnimationFrame(render);
}

function changeScene(newScene) {
  syncPlayer();
  if (gameData.paused) {
    return;
  }
  if (currentScene) {
    currentScene.leave();
  }
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
  currentScene.onTouchMove(position, delta);
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

function initPlayerData() {
  playerData = {
    username: '',
    password: '',
    draftLevels: [],
    publishedLevels: [],
    levelsCreated: 0,
  };
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

function tryLogin(username, password, callback) {
  fetch(`${SERVER_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  })
  .then((response) => response.text())
  .then((text) => JSON.parse(text))
  .then((data) => callback(data))
  .catch((error) => callback(null));
}

function trySignup(username, password, callback) {
  fetch(`${SERVER_URL}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  })
  .then((response) => response.text())
  .then((text) => JSON.parse(text))
  .then((data) => callback(data))
  .catch((error) => callback(null));
}

function syncPlayer() {
  const playerDataJson = JSON.stringify({ playerData });
  console.log("syncing playerData with length: " + playerDataJson.length);
  fetch(`${SERVER_URL}/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: playerDataJson
  })
  .then((response) => response.text())
  .then((text) => JSON.parse(text))
  .then((data) => {
    setRecursively(playerData, data.playerData);
  })
  .catch(console.warn);
}

function loadPlayer() {
  fetch(`${SERVER_URL}/load`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ playerData })
  })
  .then((response) => response.text())
  .then((text) => JSON.parse(text))
  .then((data) => {
    setRecursively(playerData, data.playerData);
  })
  .catch(console.warn);
}

function getPublicLevels(callback) {
  fetch(`${SERVER_URL}/getLevels`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ playerData })
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

function createEditor() {
  editorDiv = document.createElement('div');
  editorDiv.style.background = 'lightgray';
  editorDiv.style.border = '1px solid black';
  editorDiv.style.position = 'absolute';
  editorDiv.style.width = '100%';
  editorDiv.style.height = '100%';
  editorDiv.style.display = 'none';
  editorDiv.style.flexDirection = 'column';
  editorTextArea = document.createElement('textarea');
  editorTextArea.style.resize = 'none';
  editorTextArea.style.position = 'relative';
  editorTextArea.style.width = '100%';
  editorTextArea.style.height = 'calc(100% - 100px)';
  editorTextArea.style.fontFamily = 'consolas';
  editorTextArea.style.fontSize = '34px';
  editorTextArea.style.tabSize = '2';
  editorTextArea.addEventListener('keydown', function(e) {
    if (e.key == 'Tab') {
      e.preventDefault();
      const cursorPos = this.selectionStart;
      this.value = this.value.substring(0, cursorPos) + '\t' + this.value.substring(cursorPos);
      this.selectionStart = cursorPos + 1;
      this.selectionEnd = cursorPos + 1;
    }
    else if (e.key == 'Enter') {
      e.preventDefault();
      const cursorPos = this.selectionStart;
      const currentLine = this.value.substring(this.value.lastIndexOf('\n', cursorPos - 1) + 1, cursorPos);
      const currentIdentation = currentLine.substring(0, currentLine.lastIndexOf('\t') + 1);
      const extraIdent = cursorPos > 0 && this.value[cursorPos - 1] == '{';
      const closeBrace = this.value.count('{') > this.value.count('}');
      const stringBeforeCursor = extraIdent ? '\n' + currentIdentation + '\t' : '\n' + currentIdentation;
      const stringAfterCursor = closeBrace ? '\n' + currentIdentation + '}' : '';
      this.value = this.value.substring(0, cursorPos) + stringBeforeCursor + stringAfterCursor + this.value.substring(cursorPos);
      this.selectionStart = cursorPos + stringBeforeCursor.length;
      this.selectionEnd = cursorPos + stringBeforeCursor.length;
    }
  });
  editorDiv.appendChild(editorTextArea);
  editorButton = document.createElement('button');
  editorButton.style.position = 'relative';
  editorButton.style.width = '100%';
  editorButton.style.height = '100px';
  editorButton.style.fontSize = '40px';
  editorButton.innerHTML = 'DONE';
  editorDiv.appendChild(editorButton);
  document.body.appendChild(editorDiv);
}

function showInputPopup(text, callback) {
  gameData.paused = true;
  popupDiv.style.display = 'flex';
  popupInput.value = text;
  popupInput.focus();
  popupButton.onclick = () => {
    gameData.paused = false;
    popupDiv.style.display = 'none';
    callback(popupInput.value);
  };
}

function showUserPopup() {
  gameData.paused = true;
  userDiv.style.display = 'flex';
  usernameInput.value = '';
  passwordInput.value = '';
  userErrorLabel.innerHTML = '';
  userLoginButton.onclick = () => {
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
      loadPlayer();
      gameData.paused = false;
      userDiv.style.display = 'none';
    });
  };
  userSignupButton.onclick = () => {
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
      syncPlayer();
      gameData.paused = false;
      userDiv.style.display = 'none';
    });
  };
}

function showEditor(text, callback) {
  gameData.paused = true;
  editorDiv.style.display = 'flex';
  editorTextArea.value = text;
  editorTextArea.focus();
  editorButton.onclick = () => {
    gameData.paused = false;
    editorDiv.style.display = 'none';
    callback(editorTextArea.value);
  };
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
  context.stroke();
}

function drawImage(image, position, angle, scale) {
  context.save();
  context.translate(position.x, position.y);
  if (angle != undefined) {
    context.rotate(angle);
  }
  if (scale != undefined) {
    context.scale(scale.x, scale.y);
  }
  context.drawImage(image, -image.width / 2, -image.height / 2, image.width, image.height);
  context.restore();
}

function drawText(text, position, font, alignment, maxWidth) {
  context.font = font;
  context.textAlign = alignment || 'center';
  context.fillText(text, position.x, position.y, maxWidth);
}

function measureText(text, font, alignment, maxWidth) {
  context.font = font;
  context.textAlign = alignment || 'center';
  const textMetrics = context.measureText(text);
  return new Vector(textMetrics.width, textMetrics.fontBoundingBoxDescent + textMetrics.fontBoundingBoxAscent);
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
  images.ball_normal = loadImage('images/ball_normal.png', 64, 64);
  images.goal = loadImage('images/goal.png', 64, 64);
  images.box = loadImage('images/box.png', 100, 100);
  images.button = loadImage('images/button.png', 100, 100);
  images.button_pressed = loadImage('images/button_pressed.png', 100, 100);
  images.plank = loadImage('images/plank.png', 200, 200);
  images.plank_end = loadImage('images/plank_end.png', 200, 200);
  images.star = loadImage('images/star.png', 40, 40);
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
    }
  ];
  images.ui.icon_cross = loadImage('images/ui/icon_cross.png', 70, 70);
  images.ui.icon_polyline = loadImage('images/ui/icon_polyline.png', 70, 70);
  images.ui.icon_eraser = loadImage('images/ui/icon_eraser.png', 70, 70);
  images.ui.icon_gadgets = loadImage('images/ui/icon_gadgets.png', 70, 70);
  images.ui.icon_decorations = loadImage('images/ui/icon_decorations.png', 70, 70);
  images.ui.icon_zoom_in = loadImage('images/ui/icon_zoom_in.png', 70, 70);
  images.ui.icon_zoom_out = loadImage('images/ui/icon_zoom_out.png', 70, 70);
  images.ui.icon_trash = loadImage('images/ui/icon_trash.png', 70, 70);
  images.ui.icon_duplicate = loadImage('images/ui/icon_duplicate.png', 70, 70);
  images.ui.icon_editor = loadImage('images/ui/icon_editor.png', 70, 70);
  images.ui.icon_polyline_freehand = loadImage('images/ui/icon_polyline_freehand.png', 70, 70);
  images.ui.icon_polyline_segment = loadImage('images/ui/icon_polyline_segment.png', 70, 70);
  images.ui.icon_polyline_rectangle = loadImage('images/ui/icon_polyline_rectangle.png', 70, 70);
  images.ui.icon_polyline_ellipse = loadImage('images/ui/icon_polyline_ellipse.png', 70, 70);
  images.ui.gadgets = [
    loadImage('images/box.png', 50, 50),
    loadImage('images/button.png', 50, 50),
    loadImage('images/plank.png', 50, 50)
  ];
  images.ui.decors = [
    loadImage('images/star.png', 50, 50)
  ];
  images.ui.arrow = {};
  images.ui.arrow.left = loadImage('images/ui/arrow_left.png', 120, 120);
  images.ui.arrow.left_pressed = loadImage('images/ui/arrow_left_pressed.png', 120, 120);
  images.ui.arrow.right = loadImage('images/ui/arrow_right.png', 120, 120);
  images.ui.arrow.right_pressed = loadImage('images/ui/arrow_right_pressed.png', 120, 120);
  images.ui.arrow.up = loadImage('images/ui/arrow_up.png', 120, 120);
  images.ui.arrow.up_pressed = loadImage('images/ui/arrow_up_pressed.png', 120, 120);
}
