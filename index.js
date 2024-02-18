const WIDTH = 1024;
const HEIGHT = 720;
const DELTA_TIME = 0.01;

var canvas;
var context;
var images;
var scenes;
var currentScene;
var mousePosition;
var mouseIsDown;

init();

function init() {
	document.body.style.margin = 0;
	document.body.style.display = "flex";
	document.body.style.justifyContent = "center";
	document.body.style.alignItems = "center";
	document.body.style.background = "black";
	canvas = document.createElement("canvas");
	canvas.style.width = "100%";
	canvas.style.backgroundColor = "lightblue";
	canvas.width = WIDTH;
	canvas.height = HEIGHT;
	document.body.appendChild(canvas);
	context = canvas.getContext("2d");
	context.textAlign = "center";
	context.textBaseline = "middle";
	mousePosition = new Vector(0, 0);
	mouseIsDown = false;
	canvas.addEventListener("mousemove", function(event) {
		const rect = canvas.getBoundingClientRect();
		const x = (event.clientX - rect.left) * canvas.width / rect.width;
		const y = (event.clientY - rect.top) * canvas.height / rect.height;
		if (mouseIsDown) {
			onTouchMove(new Vector(x, y), new Vector(x, y).subtract(mousePosition));
		}
		mousePosition.x = x;
		mousePosition.y = y;
	});
	canvas.addEventListener("mousedown", function(event) {
		mouseIsDown = true;
		onTouchDown(mousePosition);
	});
	canvas.addEventListener("mouseup", function(event) {
		mouseIsDown = false;
		onTouchUp(mousePosition);
	});
	images = {};
	scenes = {};
	loadImages();
	createScenes();
	changeScene(scenes.editor);
	setInterval(update, DELTA_TIME * 1000);
	requestAnimationFrame(render);
}

function changeScene(newScene) {
	if (currentScene) {
		currentScene.leave();
	}
	currentScene = newScene;
	if (currentScene) {
		currentScene.enter();
	}
}

function update() {
	currentScene.update();
}

function render() {
	context.clearRect(0, 0, canvas.width, canvas.height);
	currentScene.render();
	requestAnimationFrame(render);
}

function onTouchDown(position) {
	currentScene.onTouchDown(position);
}

function onTouchUp(position) {
	currentScene.onTouchUp(position);
}

function onTouchMove(position, delta) {
	currentScene.onTouchMove(position, delta);
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

function drawText(text, position, font) {
	context.font = font;
	context.fillText(text, position.x, position.y);
}

function loadImage(path, width, height) {
	const image = new Image();
	image.src = path;
	image.width = width;
	image.height = height;
	return image;
}

function loadImages() {
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

function createScenes() {
	scenes.editor = new EditorScene();
	scenes.adventure = new AdventureScene();
}
