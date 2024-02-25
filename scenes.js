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
		context.translate(this.anchor.x, this.anchor.y);
		context.scale(this.zoom, this.zoom);
		context.translate(this.origin.x, this.origin.y);
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
				if (!button.disabled) {
					if (button.toggled != undefined) {
						if (button.autoToggle) {
							button.toggled = !button.toggled;
						}
					}
					else {
						this.buttonPressed = button;
					}
					button.onPress?.();
				}
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
		if (this.buttonPressed && !testPointRect(position, Vector.subtract(this.buttonPressed.position, this.buttonPressed.halfSize), Vector.add(this.buttonPressed.position, this.buttonPressed.halfSize))) {
			this.buttonPressed = null;
		}
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
			if (button.hidden) {
				continue;
			}
			if (button.type != undefined) {
				if (button == this.buttonPressed) {
					drawImage(images.ui.buttons[button.type].pressed, button.position, 0);
				}
				else if (button.toggled) {
					drawImage(images.ui.buttons[button.type].selected, button.position, 0);
				}
				else if (button.disabled) {
					drawImage(images.ui.buttons[button.type].disabled, button.position, 0);
				}
				else {
					drawImage(images.ui.buttons[button.type].frame, button.position, 0);
				}
			}
			if (button.renderProc) {
				context.save();
				context.translate(button.position.x, button.position.y);
				button.renderProc();
				context.restore();
				continue;
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
		return Vector.subtract(position, this.anchor).divide(this.zoom).subtract(this.origin);
	}

	screenToWorldDelta(delta) {
		return Vector.divide(delta, this.zoom);
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
		this.draftLevelsOffset = 200;
		this.publishedLevelsOffset = 200;
		this.selectedDraftLevel = -1;
		this.selectedPublishedLevel = -1;
		this.draggingLevels = false;
		this.buttons = [
			{
				position: new Vector(90, 670),
				halfSize: new Vector(40, 40),
				onPress: () => {
					console.log("goto main");
				},
				type: 1,
				text: "BACK",
				font: "30px Arial"
			},
		];
	}
	
	render() {
		context.fillStyle = "lightgray";
		context.fillRect(0, 0, canvas.width, canvas.height);
		super.render();
	}
	
	renderWorld() {
		context.fillStyle = "black";
		context.strokeStyle = "black";
		context.lineWidth = 2;
		context.lineCap = "flat";
		context.save();
		context.translate(0, this.draftLevelsOffset);
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
		context.save();
		context.translate(0, this.publishedLevelsOffset);
		for (var i = 0; i < playerData.publishedLevels.length; i++) {
			if (i == this.selectedPublishedLevel) {
				context.fillStyle = "darkgray";
				context.fillRect(512, i * 100 + 1, 1024, 100 - 1);
				context.fillStyle = "black";
				drawImage(images.play_level, new Vector(966, i * 100 + 50), 0);
			}
			drawText(playerData.publishedLevels[i].name, new Vector(522, i * 100 + 50), "40px Arial", "left", 290);
			drawSegment(new Vector(512, (i + 1) * 100), new Vector(1024, (i + 1) * 100));
		}
		context.restore();
		context.lineWidth = 6;
	}
	
	renderUI() {
		context.fillStyle = "lightgray";
		context.fillRect(0, 620, 1024, 720);
		context.fillRect(0, 0, 1024, 200);
		context.lineWidth = 6;
		drawSegment(new Vector(0, 100), new Vector(1024, 100));
		drawSegment(new Vector(0, 200), new Vector(1024, 200));
		drawSegment(new Vector(0, 620), new Vector(1024, 620));
		drawSegment(new Vector(512, 100), new Vector(512, 620));
		context.fillStyle = "black";
		drawText("My Levels", new Vector(512, 50), "50px Arial");
		drawText("Drafts", new Vector(256, 150), "50px Arial");
		drawText("Published", new Vector(768, 150), "50px Arial");
		this.renderButtons();
	}
	
	onTouchDown(position) {
		super.onTouchDown(position);
		if (position.y >= 200 && position.y < 620) {
			this.draggingLevels = position.x < 512 ? "drafts" : "published";
		}
	}
	
	onTouchUp(position) {
		super.onTouchUp(position);
		this.draggingLevels = null;
	}
	
	onTouchMove(position, delta) {
		super.onTouchMove(position, delta);
		if (this.draggingLevels == "drafts") {
			this.draftLevelsOffset += delta.y;
			this.draftLevelsOffset = Math.max(this.draftLevelsOffset, 200 - playerData.draftLevels.length * 100);
			this.draftLevelsOffset = Math.min(this.draftLevelsOffset, 200);
		}
		if (this.draggingLevels == "published") {
			this.publishedLevelsOffset += delta.y;
			this.publishedLevelsOffset = Math.max(this.publishedLevelsOffset, 200 - (playerData.publishedLevels.length - 1) * 100);
			this.publishedLevelsOffset = Math.min(this.publishedLevelsOffset, 200);
		}
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
					objects: [],
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
				this.selectedPublishedLevel = -1;
			}
		}
		else {
			const touchedPublishedLevel = Math.floor((position.y - this.publishedLevelsOffset) / 100);
			if (touchedPublishedLevel == this.selectedPublishedLevel) {
				if (position.x < 918) {
					this.selectedPublishedLevel = -1;
				}
				if (position.x >= 918 && position.x < 1018) {
					gameData.onLevelExit = () => {
						changeScene(scenes.menu);
					}
					changeScene(scenes.play);
				}
			}
			else if (touchedPublishedLevel >= 0 && touchedPublishedLevel < playerData.publishedLevels.length) {
				this.selectedPublishedLevel = touchedPublishedLevel;
				this.selectedDraftLevel = -1;
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
	static terrainTypes = [
		{
			index: 0,
			deadly: false,
			color: "#FAD7A0",
			friction: 0.5,
			frictionStatic: 0,
			restitution: 0.0
		},
		{
			index: 1,
			deadly: true,
			color: "#D35400",
			friction: 0,
			restitution: 0.0
		}
	];

	constructor() {
		super();
	}
	
	enter() {
		super.enter();
		this.setAnchorToCenter();
		this.level = gameData.currentLevel;
		if (gameData.currentLevel.savedOrigin) {
			this.origin = gameData.currentLevel.savedOrigin;
			this.zoom = gameData.currentLevel.savedZoom;
		}
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
				position: new Vector(90, 670),
				halfSize: new Vector(80, 40),
				onRelease: () => {
					changeScene(scenes.menu);
				},
				type: 1,
				text: "EXIT",
				font: "30px Arial"
			},
			{
				position: new Vector(754, 670),
				halfSize: new Vector(80, 40),
				onRelease: () => {
					gameData.onLevelExit = () => {
						changeScene(scenes.editor);
					}
					changeScene(scenes.play);
				},
				type: 1,
				text: "VERIFY",
				font: "30px Arial"
			},
			{
				position: new Vector(934, 670),
				halfSize: new Vector(80, 40),
				onRelease: () => {
					playerData.draftLevels.splice(playerData.draftLevels.indexOf(this.level), 1);
					playerData.publishedLevels.push(this.level);
					changeScene(scenes.menu);
				},
				type: 1,
				text: "PUBLISH",
				font: "30px Arial"
			},
		];
		for (let i = 0; i < EditorScene.terrainTypes.length; i++) {
			this.buttons.push({
				position: new Vector(60 + 100 * i, 560),
				halfSize: new Vector(40, 40),
				toggled: false,
				hidden: true,
				onPress: () => {
					this.currentTerrainType = i;
				},
				type: 0,
				renderProc: () => {
					context.fillStyle = EditorScene.terrainTypes[i].color
					drawCircle(new Vector(0, 0), 20);
				},
				terrainType: i
			});
		}
		this.buttonPressed = null;
		this.currentMode = "navigate";
		this.currentTerrainType = 0;
		this.draggedObject = null;
		this.currentPolyline = null;
	}
	
	leave() {
		this.level.savedOrigin = this.origin;
		this.level.savedZoom = this.zoom;
	}

	update() {
		for (var i = 0; i < EditorScene.terrainTypes.length; i++) {
			const terrainSelectorButton = this.buttons.find((button) => button.terrainType == i);
			terrainSelectorButton.toggled = this.currentTerrainType == i;
			terrainSelectorButton.hidden = this.currentMode != "draw";
		}
		this.buttons.find((button) => button.text == "PUBLISH").disabled = !this.level.verified;
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
		for (const polyline of this.level.terrain) {
			polyline.color = polyline.erasing ? "darkred" : EditorScene.terrainTypes[polyline.index].color;
			drawPolyline(polyline);
		}
		if (this.currentPolyline) {
			drawPolyline(this.currentPolyline);
		}
		drawImage(images.ball_normal, this.level.player, 0);
		drawImage(images.goal, this.level.goal, 0);
	}

	renderUI() {
		context.fillStyle = "lightgray";
		context.fillRect(0, 620, 1024, 720);
		context.lineWidth = 6;
		drawSegment(new Vector(0, 620), new Vector(1024, 620));
		context.fillStyle = "black";
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
					this.currentPolyline.width = 25 / this.zoom;
					Object.assign(this.currentPolyline, EditorScene.terrainTypes[this.currentTerrainType]);
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
		switch (this.currentMode) {
			case "navigate": {
				if (this.draggedObject) {
					if (this.draggedObject != this.origin) {
						this.level.verified = false;
					}
					this.draggedObject = null;
				}
				break;
			}
			case "draw": {
				if (this.currentPolyline && this.currentPolyline.length >= 2) {
					this.currentPolyline.erasing = false;
					this.level.terrain.push(this.currentPolyline);
					this.level.verified = false;
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
				if (i != this.level.terrain.length) {
					this.level.verified = false;
				}
				this.level.terrain.length = i;
				break;
			}
		}
	}

	onTouchMove(position, delta) {
		super.onTouchMove(position, delta);
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
					if (this.currentPolyline.length == 0 || Vector.distance(worldPosition, this.currentPolyline.top()) >= this.currentPolyline.width / 2) {
						this.currentPolyline.push(worldPosition);
					}
				}
				break;
			}
			case "erase": {
				for (const polyline of this.level.terrain) {
					polyline.erasing = distanceFromPolyline(worldPosition, polyline) <= polyline.width;
				}
				break;
			}
		}
	}
}

class PlayScene extends Scene {
	constructor() {
		super();
		this.physics = Matter.Engine.create();
		this.physics.gravity.scale = 1;
		this.physics.gravity.y = 500;
	}

	enter() {
		super.enter();
		this.setAnchorToCenter();
		this.zoom = 0.75;
		this.backwardButton = {
			position: new Vector(80, 520),
			halfSize: new Vector(60, 60),
			renderProc: () => {
				drawImage(gameInput.backward ? images.ui.arrow.left_pressed : images.ui.arrow.left, new Vector(0, 0), 0);
			}
		}
		this.forwardButton = {
			position: new Vector(200, 520),
			halfSize: new Vector(60, 60),
			renderProc: () => {
				drawImage(gameInput.forward ? images.ui.arrow.right_pressed : images.ui.arrow.right, new Vector(0, 0), 0);
			}
		}
		this.jumpButton = {
			position: new Vector(944, 520),
			halfSize: new Vector(60, 60),
			renderProc: () => {
				drawImage(gameInput.jump ? images.ui.arrow.up_pressed : images.ui.arrow.up, new Vector(0, 0), 0);
			}
		}
		this.buttons = [
			{
				position: new Vector(90, 670),
				halfSize: new Vector(80, 40),
				onRelease: gameData.onLevelExit,
				type: 1,
				text: "EXIT",
				font: "30px Arial"
			},
			{
				position: new Vector(934, 670),
				halfSize: new Vector(80, 40),
				onRelease: () => {
					this.initLevel();
				},
				type: 1,
				text: "RESTART",
				font: "30px Arial"
			},
			this.backwardButton,
			this.forwardButton,
			this.jumpButton
		];
		initGameInput();
		this.initLevel();
	}
	
	initLevel() {
		Matter.Composite.clear(this.physics.world);
		const lvl = gameData.currentLevel;
		this.terrain = lvl.terrain;
		this.playerBody = Matter.Bodies.circle(lvl.player.x, lvl.player.y, 30);
		this.playerBody.friction = 1000000;
		this.playerBody.frictionStatic = 1000000;
		this.playerBody.restitution = 0;
		this.goalBody = Matter.Bodies.rectangle(lvl.goal.x, lvl.goal.y, 10, 64);
		this.goalBody.isStatic = true;
		this.terrainBodies = MatterUtil.createTerrainBodies(this.terrain);
		this.canJump = true;
		this.started = false;
		this.ended = false;
		Matter.World.add(this.physics.world, [this.playerBody, this.goalBody]);
		Matter.World.add(this.physics.world, this.terrainBodies);
	}
	
	leave() {
	}

	update() {
		this.updateGameInput();
		if (gameInput.forward || gameInput.backward || gameInput.jump) {
			this.started = true;
		}
		if (gameInput.forward && gameInput.backward) {
			this.playerBody.frictionAir = 3;
		}
		else {
			this.playerBody.frictionAir = 0;
			if (gameInput.forward) {
				if (this.playerBody.velocity.x < 10000) {
					Matter.Body.applyForce(this.playerBody, this.playerBody.position, { x: 7000, y: 0 });
				}
			}
			else if (gameInput.backward) {
				if (this.playerBody.velocity.x > -10000) {
					Matter.Body.applyForce(this.playerBody, this.playerBody.position, { x: -7000, y: 0 });
				}
			}
		}
		if (this.started && !this.ended) {
			Matter.Engine.update(this.physics, DELTA_TIME);
		}
		this.origin.copy(this.playerBody.position).negate();
		for (const terrainBody of this.terrainBodies) {
			const touching = MatterUtil.overlap(this.playerBody, terrainBody);
			if (touching && terrainBody.deadly && !this.ended) {
				this.ended = true;
				clicksCanceled = true;
			}
		}
		var onSurface = false;
		for (const terrainBody of this.terrainBodies) {
			onSurface |= MatterUtil.isOnTop(this.playerBody, terrainBody);
		}
		if (gameInput.jump && this.canJump && onSurface) {
			Matter.Body.setVelocity(this.playerBody, { x: this.playerBody.velocity.x, y: this.playerBody.velocity.y - 7000 });
			this.canJump = false;
			setTimeout(() => {
				this.canJump = true;
			}, 1000);
		}
		if (MatterUtil.overlap(this.playerBody, this.goalBody)) {
			gameData.currentLevel.verified = true;
			gameData.onLevelExit();
		}
	}

	renderWorld() {
		const gradient = context.createLinearGradient(0, -10000, 0, 10000);
		gradient.addColorStop(0, 'lightblue');
		gradient.addColorStop(1, 'darkblue');
		context.fillStyle = gradient;
		context.fillRect(-1e9, -1e9, 2e9, 2e9);
		context.lineWidth = 5;
		for (const polyline of this.terrain) {
			drawPolyline(polyline);
		}
		drawImage(images.ball_normal, this.playerBody.position, this.playerBody.angle);
		drawImage(images.goal, this.goalBody.position, 0);
	}
	
	renderUI() {
		context.fillStyle = "lightgray";
		context.fillRect(0, 620, 1024, 720);
		context.strokeStyle = "black";
		context.lineWidth = 6;
		drawSegment(new Vector(0, 620), new Vector(1024, 620));
		context.fillStyle = "black";
		this.renderButtons();
		if (!this.started) {
			drawText("Tap to Start", new Vector(512, 500), "30px Arial");
		}
		if (this.ended) {
			drawText("Tap to Retry", new Vector(512, 500), "30px Arial");
		}
	}
	
	onClick(position) {
		super.onClick(position);
		this.started = true;
		if (this.ended) {
			this.initLevel();
		}
	}

	updateGameInput(position, add) {
		initGameInput();
		for (const [touchId, position] of touchPositions) {
			if (testPointRect(position, Vector.subtract(this.backwardButton.position, this.backwardButton.halfSize), Vector.add(this.backwardButton.position, this.backwardButton.halfSize))) {
				gameInput.backward = true;
			}
			if (testPointRect(position, Vector.subtract(this.forwardButton.position, this.forwardButton.halfSize), Vector.add(this.forwardButton.position, this.forwardButton.halfSize))) {
				gameInput.forward = true;
			}
			if (testPointRect(position, Vector.subtract(this.jumpButton.position, this.jumpButton.halfSize), Vector.add(this.jumpButton.position, this.jumpButton.halfSize))) {
				gameInput.jump = true;
			}
		}
		if (pressedKeys.has('a')) {
			gameInput.backward = true;
		}
		if (pressedKeys.has('d')) {
			gameInput.forward = true;
		}
		if (pressedKeys.has('w')) {
			gameInput.jump = true;
		}
	}
}

class MatterUtil {
	static createTerrainBodies(terrain) {
		const bodiesList = [];
		for (const polyline of terrain) {
			if (!bodiesList[polyline.index]) {
				bodiesList[polyline.index] = [];
			}
			for (var i = 0; i + 1 < polyline.length; i++) {
				const a = polyline[i];
				const b = polyline[i + 1];
				const middle = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
				const distance = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
				const angle = Math.atan2(b.y - a.y, b.x - a.x);
				const rectangle = Matter.Bodies.rectangle(middle.x, middle.y, distance, polyline.width, {
					angle: angle
				});
				bodiesList[polyline.index].push(rectangle);
			}
			bodiesList[polyline.index].push(Matter.Bodies.circle(polyline[0].x, polyline[0].y, polyline.width / 2));
			bodiesList[polyline.index].push(Matter.Bodies.circle(polyline[polyline.length - 1].x, polyline[polyline.length - 1].y, polyline.width / 2));
		}
		const result = [];
		for (var i = 0; i < bodiesList.length; i++) {
			if (bodiesList[i] == undefined) {
				continue;
			}
			const body = Matter.Body.create({ parts: bodiesList[i], isStatic: true});
			Object.assign(body, EditorScene.terrainTypes[i]);
			result.push(body);
		}
		return result;
	}
	
	static overlap(body1, body2) {
		const contacts = Matter.Detector.collisions({ bodies: [ body1, body2 ] });
		return contacts.length > 0;
	}
	
	static isOnTop(body1, body2) {
		const contacts = Matter.Detector.collisions({ bodies: [ body1, body2 ] });
		const center1Y = body1.position.y;
		for (const contact of contacts) {
			for (const support of contact.supports) {
				if (support.y > center1Y + 10) {
					return true;
				}
			}
		}
		return false;
	} 
}
