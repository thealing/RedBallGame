const WIDTH = 1024;
const HEIGHT = 720;
const DELTA_TIME = 0.01;

var canvas;
var context;
var popupDiv;
var popupInput;
var popupButton;
var images;
var scenes;
var currentScene;
var mousePosition;
var mouseDownPosition;
var mouseIsDown;
var mouseLongPressTimeout;
var playerData;
var gameData;

init();

function init() {
	document.body.style.margin = 0;
	document.body.style.display = "flex";
	document.body.style.justifyContent = "center";
	document.body.style.alignItems = "center";
	document.body.style.background = "coral";
	canvas = document.createElement("canvas");
	canvas.style.width = "100%";
	canvas.style.backgroundColor = "coral";
	canvas.width = WIDTH;
	canvas.height = HEIGHT;
	document.body.appendChild(canvas);
	context = canvas.getContext("2d");
	context.textBaseline = "middle";
	mousePosition = new Vector(0, 0);
	mouseIsDown = false;
	function onMouseDown() {
		mouseDownPosition = mousePosition.clone();
		mouseIsDown = true;
		mouseLongPressTimeout = setTimeout(onLongClick, 500, mousePosition);
		onTouchDown(mousePosition);
	};
	function onMouseUp() {
		if (Vector.distance(mouseDownPosition, mousePosition) <= 20) {
			onClick(mouseDownPosition);
		}
		clearTimeout(mouseLongPressTimeout);
		mouseIsDown = false;
		onTouchUp(mousePosition);
	};
	function onMouseMove(screenX, screenY) {
		const rect = canvas.getBoundingClientRect();
		const x = (screenX - rect.left) * canvas.width / rect.width;
		const y = (screenY - rect.top) * canvas.height / rect.height;
		if (mouseIsDown) {
			if (Vector.distance(mouseDownPosition, mousePosition) > 20) {
				clearTimeout(mouseLongPressTimeout);
			}
			onTouchMove(new Vector(x, y), new Vector(x, y).subtract(mousePosition));
		}
		mousePosition.x = x;
		mousePosition.y = y;
	};
	// canvas.addEventListener("mousedown", (e) => onMouseDown());
	// canvas.addEventListener("mouseup", (e) => onMouseUp());
	// canvas.addEventListener("mouseout", (e) => onMouseUp());
	// canvas.addEventListener("mousemove", (e) => onMouseMove(e.clientX, e.clientY));
	canvas.addEventListener("touchstart", (e) => {
		const touch = e.touches[0];
		onMouseMove(touch.pageX, touch.pageY);
		onMouseDown();
	});
	canvas.addEventListener("touchend", (e) => {
		onMouseUp();
	});
	canvas.addEventListener("touchcancel", (e) => {
		onMouseUp();
	});
	canvas.addEventListener("touchmove", (e) => {
		e.preventDefault();
		const touch = e.touches[0];
		onMouseMove(touch.pageX, touch.pageY);
	});
	createInputPopup();
	images = {};
	scenes = {};
	loadImages();
	createScenes();
	initPlayerData();
	initGameData();
	changeScene(scenes.menu);
	setInterval(update, DELTA_TIME * 1000);
	requestAnimationFrame(render);
}

function changeScene(newScene) {
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
	if (gameData.paused) {
		requestAnimationFrame(render);
		return;
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

function initPlayerData() {
	playerData = {
		draftLevels: [],
		publishedLevels: [],
		levelsCreated: 0,
	};
}

function initGameData() {
	gameData = {
		paused: false,
		currentLevel: playerData.draftLevels[0],
	};
}

function createScenes() {
	scenes.menu = new MenuScene();
	scenes.editor = new EditorScene();
	scenes.adventure = new AdventureScene();
}

function generateRandomId() {
	return generateRandomString(32);
}

function generateRandomString(length) {
	const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	const randomValues = new Uint32Array(length);
	crypto.getRandomValues(randomValues);
	let result = "";
	for (let i = 0; i < length; i++) {
		result += characters[randomValues[i] % characters.length];
	}
	return result;
}

function createInputPopup() {
	popupDiv = document.createElement("div");
	popupDiv.style.position = "absolute";
	popupDiv.style.width = "400px";
	popupDiv.style.height = "200px";
	popupDiv.style.display = "none";
	popupDiv.style.flexDirection = "column";
	popupInput = document.createElement("input");
	popupInput.type = "text";
	popupInput.style.position = "relative";
	popupInput.style.width = "100%";
	popupInput.style.height = "50%";
	popupInput.style.fontSize = "40px";
	popupDiv.appendChild(popupInput);
	popupButton = document.createElement("button");
	popupButton.style.position = "relative";
	popupButton.style.width = "100%";
	popupButton.style.height = "50%";
	popupButton.style.fontSize = "40px";
	popupButton.innerHTML = "OK";
	popupDiv.appendChild(popupButton);
	document.body.appendChild(popupDiv);
}

function showInputPopup(text, callback) {
	gameData.paused = true;
	popupDiv.style.display = "flex";
	popupInput.value = text;
	popupButton.onclick = () => {
		gameData.paused = false;
		popupDiv.style.display = "none";
		callback(popupInput.value);
	};
}

function drawSegment(start, end) {
	context.beginPath();
	context.moveTo(start.x, start.y);
	context.lineTo(end.x, end.y);
	context.stroke();
}

function drawPolyline(polyline) {
	if (polyline.length < 2) {
		return;
	}
	context.beginPath();
	context.moveTo(polyline[0].x, polyline[0].y);
	for (var i = 1; i < polyline.length; i++) {
		context.lineTo(polyline[i].x, polyline[i].y);
	}
	context.stroke();
}

function drawImage(image, position, angle) {
	context.save();
	context.translate(position.x, position.y);
	context.rotate(angle);
	context.drawImage(image, -image.width / 2, -image.height / 2, image.width, image.height);
	context.restore();
}

function drawText(text, position, font, alignment, maxWidth) {
	context.font = font;
	context.textAlign = alignment || "center";
	context.fillText(text, position.x, position.y, maxWidth);
}

function loadImage(path, width, height) {
	const image = new Image();
	image.src = path;
	image.width = width;
	image.height = height;
	return image;
}

function loadImages() {
	images.new_level = loadImage("images/new_level.png", 300, 100);
	images.delete_level = loadImage("images/delete_level.png", 100, 100);
	images.edit_level = loadImage("images/edit_level.png", 100, 100);
	images.ball_normal = loadImage("images/ball_normal.png", 64, 64);
	images.goal = loadImage("images/goal.png", 64, 64);
	images.ui = {};
	images.ui.buttons = [
		{
			frame: loadImage("images/ui/button_0_frame.png", 80, 80),
			selected: loadImage("images/ui/button_0_selected.png", 80, 80),
			pressed: loadImage("images/ui/button_0_pressed.png", 80, 80),
		}, 
		{
			frame: loadImage("images/ui/button_1_frame.png", 160, 80),
			selected: loadImage("images/ui/button_1_selected.png", 160, 80),
			pressed: loadImage("images/ui/button_1_pressed.png", 160, 80),
		}
	];
	images.ui.icon_cross = loadImage("images/ui/icon_cross.png", 70, 70);
	images.ui.icon_polyline = loadImage("images/ui/icon_polyline.png", 70, 70);
	images.ui.icon_eraser = loadImage("images/ui/icon_eraser.png", 70, 70);
	images.ui.icon_zoom_in = loadImage("images/ui/icon_zoom_in.png", 70, 70);
	images.ui.icon_zoom_out = loadImage("images/ui/icon_zoom_out.png", 70, 70);
}
