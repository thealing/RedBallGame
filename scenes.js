class Scene {
	constructor() {
		this.origin = new Vector(0, 0);
		this.zoom = 1;
		this.buttons = [];
		this.buttonPressed = null;
	}

	enter() {
	}

	leave() {
	}

	update() {
	}

	render() {
		context.save();
		context.translate(this.origin.x + WIDTH / 2, this.origin.y + HEIGHT / 2);
		context.scale(this.zoom, this.zoom);
		this.renderWorld();
		context.restore();
		this.renderUI();
	}

	renderWorld() {
	}

	renderUI() {
	}

	onTouchDown(position) {
		for (var button of this.buttons) {
			if (testPointRect(position, Vector.subtract(button.position, button.halfSize), Vector.add(button.position, button.halfSize))) {
				if (button.toggled != undefined) {
					button.toggled = !button.toggled;
				}
				else {
					this.buttonPressed = button;
				}
				button.onPress?.();
				this.uiTouched = true;
			}
		}
	}

	onTouchUp(position) {
		if (this.buttonPressed) {
			this.buttonPressed.onRelease?.();
			this.buttonPressed = null;
		}
	}

	onTouchMove(position, delta) {
	}
	
	updateButtons() {
		if (this.buttonPressed) {
			this.buttonPressed.onHold?.();
		}
	}
	
	renderButtons() {
		for (var button of this.buttons) {
			if (button == this.buttonPressed) {
				drawImage(images.ui.buttons[button.frame].pressed, button.position, 0);
			}
			else if (button.toggled) {
				drawImage(images.ui.buttons[button.frame].selected, button.position, 0);
			}
			else {
				drawImage(images.ui.buttons[button.frame].frame, button.position, 0);
			}
			if (button.icon) {
				drawImage(button.icon, button.position, 0);
			}
			if (button.text) {
				drawText(button.text, button.position, button.font);
			}
		}
	}

	screenToWorldPosition(position) {
		return Vector.subtract(position, this.origin).subtractXY(WIDTH / 2, HEIGHT / 2).divide(this.zoom);
	}

	screenToWorldDelta(delta) {
		return Vector.divide(delta, this.zoom);
	}
}

class EditorScene extends Scene {
	enter() {
		this.level = {
			player: new Vector(-100, 0),
			goal: new Vector(100, 0),
			terrain: [],
		};
		this.buttons = [
			{
				position: new Vector(60, 60),
				halfSize: new Vector(40, 40), 
				toggled: false,
				mode: "navigate",
				onPress: () => {
					this.currentMode = "navigate";
				},
				frame: 0,
				icon: images.ui.icon_cross
			},
			{
				position: new Vector(160, 60),
				halfSize: new Vector(40, 40),
				toggled: false,
				mode: "draw",
				onPress: () => {
					this.currentMode = "draw";
				},
				frame: 0,
				icon: images.ui.icon_polyline
			},
			{
				position: new Vector(260, 60),
				halfSize: new Vector(40, 40),
				toggled: false,
				mode: "erase",
				onPress: () => {
					this.currentMode = "erase";
				},
				frame: 0,
				icon: images.ui.icon_eraser
			},
			{
				position: new Vector(400, 60),
				halfSize: new Vector(40, 40),
				onHold: () => {
					this.zoom *= 1 + DELTA_TIME;
				},
				frame: 0,
				icon: images.ui.icon_zoom_in
			},
			{
				position: new Vector(500, 60),
				halfSize: new Vector(40, 40),
				onHold: () => {
					this.zoom /= 1 + DELTA_TIME;
				},
				frame: 0,
				icon: images.ui.icon_zoom_out
			},
			{
				position: new Vector(920, 60),
				halfSize: new Vector(80, 40),
				onPress: () => {
					console.log("go play");
				},
				frame: 1,
				text: "PLAY",
				font: "40px Arial"
			},
		];
		this.buttonPressed = null;
		this.currentMode = "navigate";
		this.draggedObject = null;
		this.currentPolyline = null;
	}

	update() {
		this.updateButtons();
		for (var button of this.buttons) {
			if (button.mode) {
				button.toggled = this.currentMode == button.mode;
			}
		} 
	}

	renderWorld() {
		context.lineWidth = 5;
		context.lineCap = "round";
		for (const polyline of this.level.terrain) {
			context.strokeStyle = polyline.erasing ? "darkred" : "darkgreen";
			drawPolyline(polyline);
		}
		context.strokeStyle = "lime";
		if (this.currentPolyline) {
			drawPolyline(this.currentPolyline);
		}
		drawImage(images.ball_normal, this.level.player, 0);
		drawImage(images.goal, this.level.goal, 0);
	}

	renderUI() {
		this.renderButtons();
	}

	onTouchDown(position) {
		this.uiTouched = false;
		super.onTouchDown(position);
		if (!this.uiTouched) {
			const worldPosition = this.screenToWorldPosition(position);
			switch (this.currentMode) {
				case "navigate": {
					if (Vector.distance(worldPosition, this.level.player) < 50) {
						this.draggedObject = this.level.player;
					}
					else if (Vector.distance(worldPosition, this.level.goal) < 50) {
						this.draggedObject = this.level.goal;
					}
					else {
						this.draggedObject = this.origin;
					}
					break;
				}
				case "draw": {
					this.currentPolyline = [];
					break;
				}
				case "erase": {
					break;
				}
			}
		}
	}

	onTouchUp(position) {
		super.onTouchUp(position);
		const worldPosition = this.screenToWorldPosition(position);
		switch (this.currentMode) {
			case "navigate": {
				if (this.draggedObject) {
					this.draggedObject = null;
				}
				break;
			}
			case "draw": {
				if (this.currentPolyline && this.currentPolyline.length >= 2) {
					this.currentPolyline.erasing = false;
					this.level.terrain.push(this.currentPolyline);
				}
				this.currentPolyline = null;
				break;
			}
			case "erase": {
				var i = 0;
				for (var polygon of this.level.terrain) {
					if (!polygon.erasing) {
						this.level.terrain[i] = polygon;
						i++;
					}
				}
				this.level.terrain.length = i;
				break;
			}
		}
	}

	onTouchMove(position, delta) {
		const worldPosition = this.screenToWorldPosition(position);
		const worldDelta = this.screenToWorldDelta(delta);
		switch (this.currentMode) {
			case "navigate": {
				if (this.draggedObject) {
					this.draggedObject.add(worldDelta);
				}
				break;
			}
			case "draw": {
				if (this.currentPolyline) {
					if (this.currentPolyline.length == 0 || Vector.distance(worldPosition, this.currentPolyline.top()) >= 10) {
						this.currentPolyline.push(worldPosition);
					}
				}
				break;
			}
			case "erase": {
				for (const polyline of this.level.terrain) {
					polyline.erasing = distanceFromPolyline(worldPosition, polyline) <= 10;
				}
				break;
			}
		}
	}
}

class AdventureScene extends Scene {
	constructor() {
		super();
		this.level = {};
		this.physics = Matter.Engine.create();
		this.origin = Matter.Vector.create(0, 0);
	}

	enter() {
		Matter.Composite.clear(this.physics.world);
		this.physics.gravity.scale = 1;
		this.physics.gravity.y = 100;
		this.level.player = Matter.Bodies.circle(0, 0, 10);
		Matter.World.add(this.physics.world, this.level.player);
	}

	update() {
		Matter.Engine.update(this.physics, DELTA_TIME);
	}

	render() {
		context.save();
		context.translate(-this.origin.x + WIDTH / 2, -this.origin.y + HEIGHT / 2);
		drawImage(images.ball_normal, this.level.player.position, this.level.player.angle);
		context.restore();
	}
}