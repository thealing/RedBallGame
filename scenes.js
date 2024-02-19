class Scene {
	enter() {
		this.anchor = new Vector(0, 0);
		this.origin = new Vector(0, 0);
		this.zoom = 1;
		this.buttons = [];
		this.buttonPressed = null;
	}

	leave() {
	}

	update() {
	}

	render() {
		context.save();
		context.translate(this.origin.x + this.anchor.x, this.origin.y + this.anchor.y);
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
		this.uiTouched = false;
		for (var button of this.buttons) {
			if (testPointRect(position, Vector.subtract(button.position, button.halfSize), Vector.add(button.position, button.halfSize))) {
				if (button.toggled != undefined) {
					if (button.autoToggle) {
						button.toggled = !button.toggled;
					}
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
	
	onClick(position) {
	}
	
	onLongClick(position) {
	}
	
	updateButtons() {
		if (this.buttonPressed) {
			this.buttonPressed.onHold?.();
		}
	}
	
	renderButtons() {
		for (var button of this.buttons) {
			if (button.type != undefined) {
				if (button == this.buttonPressed) {
					drawImage(images.ui.buttons[button.type].pressed, button.position, 0);
				}
				else if (button.toggled) {
					drawImage(images.ui.buttons[button.type].selected, button.position, 0);
				}
				else {
					drawImage(images.ui.buttons[button.type].frame, button.position, 0);
				}
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
		return Vector.subtract(position, this.origin).subtract(this.anchor).divide(this.zoom);
	}

	screenToWorldDelta(delta) {
		return delta;
	}
	
	setAnchorToCenter() {
		this.anchor.set(WIDTH / 2, HEIGHT / 2);
	}
	
	setAnchorToTopLeft() {
		this.anchor.set(0, 0);
	}
}

class MenuScene extends Scene {
	enter() {
		super.enter();
		this.setAnchorToTopLeft();
		this.draftLevelsOffset = 0;
		this.selectedDraftLevel = -1;
		this.selectedPublishedLevel = -1;
	}
	
	render() {
		context.fillStyle = "lightgray";
		context.fillRect(0, 0, canvas.width, canvas.height);
		super.render();
	}
	
	renderWorld() {
		context.save();
		context.translate(0, this.draftLevelsOffset);
		context.fillStyle = "black";
		context.strokeStyle = "black";
		context.lineWidth = 2;
		context.lineCap = "flat";
		for (var i = 0; i < playerData.draftLevels.length; i++) {
			if (i == this.selectedDraftLevel) {
				context.fillStyle = "darkgray";
				context.fillRect(0, i * 100 + 1, 512, 100 - 1);
				context.fillStyle = "black";
				drawImage(images.edit_level, new Vector(356, i * 100 + 50), 0);
				drawImage(images.delete_level, new Vector(456, i * 100 + 50), 0);
			}
			drawText(playerData.draftLevels[i].name, new Vector(10, i * 100 + 50), "40px Arial", "left", 290);
			drawSegment(new Vector(0, (i + 1) * 100), new Vector(512, (i + 1) * 100));
		}
		drawImage(images.new_level, new Vector(256, playerData.draftLevels.length * 100 + 50), 0);
		context.restore();
		context.lineWidth = 10;
		drawSegment(new Vector(512, 0), new Vector(512, 720));
	}
	
	onTouchMove(position, delta) {
		this.draftLevelsOffset += delta.y;
		this.draftLevelsOffset = Math.max(this.draftLevelsOffset, -playerData.draftLevels.length * 100);
		this.draftLevelsOffset = Math.min(this.draftLevelsOffset, 0);
	}
	
	onClick(position) {
		if (position.x < 512) {
			const touchedDraftLevel = Math.floor((position.y - this.draftLevelsOffset) / 100);
			if (touchedDraftLevel == playerData.draftLevels.length) {
				playerData.levelsCreated++;
				playerData.draftLevels.push({
					id: generateRandomId(),
					name: "Level " + playerData.levelsCreated,
					player: new Vector(-100, 0),
					goal: new Vector(100, 0),
					terrain: [],
					verified: false
				});
				this.selectedDraftLevel = playerData.draftLevels.length - 1;
			}
			else if (touchedDraftLevel == this.selectedDraftLevel) {
				if (position.x < 306) {
					this.selectedDraftLevel = -1;
				}
				if (position.x >= 306 && position.x < 406) {
					gameData.currentLevel = playerData.draftLevels[this.selectedDraftLevel];
					changeScene(scenes.editor);
				}
				if (position.x >= 406 && position.x < 506) {
					playerData.draftLevels.splice(this.selectedDraftLevel, 1);
					this.selectedDraftLevel = -1;
				}
			}
			else if (touchedDraftLevel >= 0 && touchedDraftLevel < playerData.draftLevels.length) {
				this.selectedDraftLevel = touchedDraftLevel;
			}
		}
	}
	
	onLongClick(position) {
		if (position.x < 512) {
			const touchedDraftLevel = Math.floor((position.y - this.draftLevelsOffset) / 100);
			if (touchedDraftLevel == this.selectedDraftLevel) {
				if (position.x < 306) {
					showInputPopup(playerData.draftLevels[this.selectedDraftLevel].name, (text) => {
						playerData.draftLevels[this.selectedDraftLevel].name = text;
					});
				}
			}
		}
	}
}

class EditorScene extends Scene {
	enter() {
		super.enter();
		this.setAnchorToCenter();
		this.level = gameData.currentLevel;
		this.buttons = [
			{
				position: new Vector(60, 60),
				halfSize: new Vector(40, 40), 
				toggled: false,
				autoToggle: true,
				mode: "navigate",
				onPress: () => {
					this.currentMode = "navigate";
				},
				type: 0,
				icon: images.ui.icon_cross
			},
			{
				position: new Vector(160, 60),
				halfSize: new Vector(40, 40),
				toggled: false,
				autoToggle: true,
				mode: "draw",
				onPress: () => {
					this.currentMode = "draw";
				},
				type: 0,
				icon: images.ui.icon_polyline
			},
			{
				position: new Vector(260, 60),
				halfSize: new Vector(40, 40),
				toggled: false,
				autoToggle: true,
				mode: "erase",
				onPress: () => {
					this.currentMode = "erase";
				},
				type: 0,
				icon: images.ui.icon_eraser
			},
			{
				position: new Vector(400, 60),
				halfSize: new Vector(40, 40),
				onHold: () => {
					this.zoom *= 1 + DELTA_TIME;
				},
				type: 0,
				icon: images.ui.icon_zoom_in
			},
			{
				position: new Vector(500, 60),
				halfSize: new Vector(40, 40),
				onHold: () => {
					this.zoom /= 1 + DELTA_TIME;
				},
				type: 0,
				icon: images.ui.icon_zoom_out
			},
			{
				position: new Vector(920, 60),
				halfSize: new Vector(80, 40),
				toggled: true,
				onPress: () => {
					changeScene(scenes.menu);
				},
				type: 1,
				text: "EXIT",
				font: "30px Arial"
			},
			{
				position: new Vector(920, 160),
				halfSize: new Vector(80, 40),
				toggled: !this.level.verified,
				onPress: () => {
					console.log("go play");
				},
				type: 1,
				text: "VERIFY",
				font: "30px Arial"
			},
			{
				position: new Vector(920, 260),
				halfSize: new Vector(80, 40),
				toggled: this.level.verified,
				onPress: () => {
					console.log("go publish");
				},
				type: 1,
				text: "PUBLISH",
				font: "30px Arial"
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
		const gradient = context.createLinearGradient(0, -10000, 0, 10000);
		gradient.addColorStop(0, 'lightblue');
		gradient.addColorStop(1, 'darkblue');
		context.fillStyle = gradient;
		context.fillRect(-1e9, -1e9, 2e9, 2e9);
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
	}

	enter() {
	}

	update() {
	}

	renderWorld() {
	}
	
	renderUI() {
	}
}