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
    for (let button of this.buttons) {
      if (testPointRect(position, Vector.subtract(button.position, button.halfSize), Vector.add(button.position, button.halfSize))) {
        if (!button.disabled && !button.hidden) {
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
    else {
      this.uiTouched = false;
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
    for (let button of this.buttons) {
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
          console.log('goto main');
        },
        type: 1,
        text: 'BACK',
        font: '30px Arial'
      },
    ];
  }
  
  render() {
    context.fillStyle = 'lightgray';
    context.fillRect(0, 0, canvas.width, canvas.height);
    super.render();
  }
  
  renderWorld() {
    context.fillStyle = 'black';
    context.strokeStyle = 'black';
    context.lineWidth = 2;
    context.lineCap = 'flat';
    context.save();
    context.translate(0, this.draftLevelsOffset);
    for (let i = 0; i < playerData.draftLevels.length; i++) {
      if (i == this.selectedDraftLevel) {
        context.fillStyle = 'darkgray';
        context.fillRect(0, i * 100 + 1, WIDTH / 2, 100 - 1);
        context.fillStyle = 'black';
        drawImage(images.edit_level, new Vector(WIDTH / 2 - 156, i * 100 + 50), 0);
        drawImage(images.delete_level, new Vector(WIDTH / 2 - 56, i * 100 + 50), 0);
      }
      drawText(playerData.draftLevels[i].name, new Vector(10, i * 100 + 50), '40px Arial', 'left', WIDTH / 2 - 222);
      drawSegment(new Vector(0, (i + 1) * 100), new Vector(WIDTH / 2, (i + 1) * 100));
    }
    drawImage(images.new_level, new Vector(WIDTH / 4, playerData.draftLevels.length * 100 + 50), 0);
    context.restore();
    context.save();
    context.translate(0, this.publishedLevelsOffset);
    for (let i = 0; i < playerData.publishedLevels.length; i++) {
      if (i == this.selectedPublishedLevel) {
        context.fillStyle = 'darkgray';
        context.fillRect(WIDTH / 2, i * 100 + 1, WIDTH, 100 - 1);
        context.fillStyle = 'black';
        drawImage(images.play_level, new Vector(WIDTH - 58, i * 100 + 50), 0);
      }
      drawText(playerData.publishedLevels[i].name, new Vector(WIDTH / 2 + 10, i * 100 + 50), '40px Arial', 'left', WIDTH / 2 - 222);
      drawSegment(new Vector(WIDTH / 2, (i + 1) * 100), new Vector(WIDTH, (i + 1) * 100));
    }
    context.restore();
    context.lineWidth = 6;
  }
  
  renderUI() {
    context.fillStyle = 'lightgray';
    context.fillRect(0, 620, WIDTH, 720);
    context.fillRect(0, 0, WIDTH, 200);
    context.lineWidth = 6;
    drawSegment(new Vector(0, 100), new Vector(WIDTH, 100));
    drawSegment(new Vector(0, 200), new Vector(WIDTH, 200));
    drawSegment(new Vector(0, 620), new Vector(WIDTH, 620));
    drawSegment(new Vector(WIDTH / 2, 100), new Vector(WIDTH / 2, 620));
    context.fillStyle = 'black';
    drawText('My Levels', new Vector(WIDTH / 2, 50), '50px Arial');
    drawText('Drafts', new Vector(WIDTH / 4, 150), '50px Arial');
    drawText('Published', new Vector(WIDTH / 2 + WIDTH / 4, 150), '50px Arial');
    this.renderButtons();
  }
  
  onTouchDown(position) {
    super.onTouchDown(position);
    if (position.y >= 200 && position.y < 620) {
      this.draggingLevels = position.x < WIDTH / 2 ? 'drafts' : 'published';
    }
  }
  
  onTouchUp(position) {
    super.onTouchUp(position);
    this.draggingLevels = null;
  }
  
  onTouchMove(position, delta) {
    super.onTouchMove(position, delta);
    if (this.draggingLevels == 'drafts') {
      this.draftLevelsOffset += delta.y;
      this.draftLevelsOffset = Math.max(this.draftLevelsOffset, 200 - playerData.draftLevels.length * 100);
      this.draftLevelsOffset = Math.min(this.draftLevelsOffset, 200);
    }
    if (this.draggingLevels == 'published') {
      this.publishedLevelsOffset += delta.y;
      this.publishedLevelsOffset = Math.max(this.publishedLevelsOffset, 200 - (playerData.publishedLevels.length - 1) * 100);
      this.publishedLevelsOffset = Math.min(this.publishedLevelsOffset, 200);
    }
  }
  
  onClick(position) {
    if (position.x < WIDTH / 2) {
      const touchedDraftLevel = Math.floor((position.y - this.draftLevelsOffset) / 100);
      if (touchedDraftLevel == playerData.draftLevels.length) {
        playerData.levelsCreated++;
        playerData.draftLevels.push({
          id: generateRandomId(),
          name: 'Level ' + playerData.levelsCreated,
          player: new Vector(-100, 0),
          goal: new Vector(100, 0),
          terrain: [],
          gadgets: [],
          verified: false,
          gadgetsCreated: new Array(EditorScene.gadgetTypes.length + EditorScene.decorTypes.length).fill(0)
        });
        this.selectedDraftLevel = playerData.draftLevels.length - 1;
      }
      else if (touchedDraftLevel == this.selectedDraftLevel) {
        if (position.x < WIDTH / 2 - 206) {
          this.selectedDraftLevel = -1;
        }
        if (position.x >= WIDTH / 2 - 206 && position.x < WIDTH / 2 - 106) {
          gameData.currentLevel = playerData.draftLevels[this.selectedDraftLevel];
          changeScene(scenes.editor);
        }
        if (position.x >= WIDTH / 2 - 106 && position.x < WIDTH / 2 - 6) {
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
        if (position.x < WIDTH - 106) {
          this.selectedPublishedLevel = -1;
        }
        if (position.x >= WIDTH - 106 && position.x < WIDTH - 6) {
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
    if (position.x < WIDTH / 2) {
      const touchedDraftLevel = Math.floor((position.y - this.draftLevelsOffset) / 100);
      if (touchedDraftLevel == this.selectedDraftLevel) {
        if (position.x < WIDTH / 2 - 206) {
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
      friction: 50,
      frictionStatic: 50,
      restitution: 0.0
    },
    {
      index: 1,
      deadly: true,
      friction: 50,
      frictionStatic: 50,
      restitution: 0
    },
    {
      index: 2,
      deadly: false,
      friction: 0,
      frictionStatic: 0,
      restitution: 0
    },
    {
      index: 3,
      deadly: false,
      friction: 50,
      frictionStatic: 50,
      restitution: 0,
      invisible: true
    }
  ];

  static gadgetTypes = [
    {
      index: 0,
      name: 'Box',
      class: Box
    },
    {
      index: 1,
      name: 'Button',
      class: Button
    },
    {
      index: 2,
      name: 'Plank',
      class: Plank
    }
  ];

  static decorTypes = [
    {
      index: 0,
      name: 'Star',
      class: Star
    }
  ]

  constructor() {
    super();
    for (let i = 0; i < EditorScene.terrainTypes.length; i++) {
      EditorScene.terrainTypes[i].color = images.terrains[i];
    }
    for (let i = 0; i < EditorScene.gadgetTypes.length; i++) {
      EditorScene.gadgetTypes[i].icon = images.ui.gadgets[i];
    }
    for (let i = 0; i < EditorScene.decorTypes.length; i++) {
      EditorScene.decorTypes[i].icon = images.ui.decors[i];
    }
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
        mode: 'navigate',
        onPress: () => {
          this.currentMode = 'navigate';
        },
        type: 0,
        icon: images.ui.icon_cross
      },
      {
        position: new Vector(160, 60),
        halfSize: new Vector(40, 40),
        toggled: false,
        autoToggle: true,
        mode: 'draw',
        onPress: () => {
          this.currentMode = 'draw';
        },
        type: 0,
        icon: images.ui.icon_polyline
      },
      {
        position: new Vector(260, 60),
        halfSize: new Vector(40, 40),
        toggled: false,
        autoToggle: true,
        mode: 'erase',
        onPress: () => {
          this.currentMode = 'erase';
        },
        type: 0,
        icon: images.ui.icon_eraser
      },
      {
        position: new Vector(360, 60),
        halfSize: new Vector(40, 40),
        toggled: false,
        autoToggle: true,
        mode: 'gadgets',
        onPress: () => {
          this.currentMode = 'gadgets';
        },
        type: 0,
        icon: images.ui.icon_gadgets
      },
      {
        position: new Vector(460, 60),
        halfSize: new Vector(40, 40),
        toggled: false,
        autoToggle: true,
        mode: 'decor',
        onPress: () => {
          this.currentMode = 'decor';
        },
        type: 0,
        icon: images.ui.icon_decorations
      },
      {
        position: new Vector(WIDTH - 160, 60),
        halfSize: new Vector(40, 40),
        onHold: () => {
          this.zoom *= 1 + DELTA_TIME;
        },
        type: 0,
        icon: images.ui.icon_zoom_in
      },
      {
        position: new Vector(WIDTH - 60, 60),
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
        text: 'EXIT',
        font: '30px Arial'
      },
      {
        position: new Vector(WIDTH - 270, 670),
        halfSize: new Vector(80, 40),
        onRelease: () => {
          gameData.onLevelExit = () => {
            changeScene(scenes.editor);
          }
          changeScene(scenes.play);
        },
        type: 1,
        text: 'VERIFY',
        font: '30px Arial'
      },
      {
        position: new Vector(WIDTH - 90, 670),
        halfSize: new Vector(80, 40),
        onRelease: () => {
          playerData.draftLevels.splice(playerData.draftLevels.indexOf(this.level), 1);
          playerData.publishedLevels.push(this.level);
          changeScene(scenes.menu);
        },
        type: 1,
        text: 'PUBLISH',
        font: '30px Arial'
      },
      {
        position: new Vector(WIDTH - 60, 560),
        halfSize: new Vector(40, 40),
        toggled: false,
        hidden: true,
        onPress: () => {
          this.currentGadgetType = -1;
          this.currentDecorType = -1;
        },
        type: 0,
        icon: images.ui.icon_trash,
        gadgetType: -1,
        decorType: -1,
        activeModes: [ 'gadgets', 'decor' ]
      },
      {
        position: new Vector(WIDTH - 160, 560),
        halfSize: new Vector(40, 40),
        toggled: false,
        hidden: true,
        onPress: () => {
          this.currentGadgetType = -2;
          this.currentDecorType = -2;
        },
        type: 0,
        icon: images.ui.icon_duplicate,
        gadgetType: -2,
        decorType: -2,
        activeModes: [ 'gadgets', 'decor' ]
      },
      {
        position: new Vector(WIDTH - 260, 560),
        halfSize: new Vector(40, 40),
        toggled: false,
        hidden: true,
        onPress: () => {
          this.currentGadgetType = -3;
          this.currentDecorType = -3;
        },
        type: 0,
        icon: images.ui.icon_editor,
        gadgetType: -3,
        decorType: -3,
        activeModes: [ 'gadgets', 'decor' ]
      },
      {
        position: new Vector(WIDTH - 360, 560),
        halfSize: new Vector(40, 40),
        toggled: false,
        hidden: true,
        onPress: () => {
          this.currentPolylineMode = 0;
        },
        type: 0,
        icon: images.ui.icon_polyline_freehand,
        polylineMode: 0
      },
      {
        position: new Vector(WIDTH - 260, 560),
        halfSize: new Vector(40, 40),
        toggled: false,
        hidden: true,
        onPress: () => {
          this.currentPolylineMode = 1;
        },
        type: 0,
        icon: images.ui.icon_polyline_segment,
        polylineMode: 1
      },
      {
        position: new Vector(WIDTH - 160, 560),
        halfSize: new Vector(40, 40),
        toggled: false,
        hidden: true,
        onPress: () => {
          this.currentPolylineMode = 2;
        },
        type: 0,
        icon: images.ui.icon_polyline_rectangle,
        polylineMode: 2
      },
      {
        position: new Vector(WIDTH - 60, 560),
        halfSize: new Vector(40, 40),
        toggled: false,
        hidden: true,
        onPress: () => {
          this.currentPolylineMode = 3;
        },
        type: 0,
        icon: images.ui.icon_polyline_ellipse,
        polylineMode: 3
      }
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
          context.fillStyle = context.createPattern(EditorScene.terrainTypes[i].color, 'repeat');
          drawCircle(new Vector(0, 0), 20);
        },
        terrainType: i
      });
    }
    for (let i = 0; i < EditorScene.gadgetTypes.length; i++) {
      this.buttons.push({
        position: new Vector(60 + 100 * i, 560),
        halfSize: new Vector(40, 40),
        toggled: false,
        hidden: true,
        onPress: () => {
          this.currentGadgetType = i;
        },
        type: 0,
        icon: EditorScene.gadgetTypes[i].icon,
        gadgetType: i,
        activeModes: [ 'gadgets' ]
      });
    }
    for (let i = 0; i < EditorScene.decorTypes.length; i++) {
      this.buttons.push({
        position: new Vector(60 + 100 * i, 560),
        halfSize: new Vector(40, 40),
        toggled: false,
        hidden: true,
        onPress: () => {
          this.currentDecorType = i;
        },
        type: 0,
        icon: EditorScene.decorTypes[i].icon,
        decorType: i,
        activeModes: [ 'decor' ]
      });
    }
    this.buttonPressed = null;
    this.currentMode = 'navigate';
    this.currentTerrainType = 0;
    this.currentGadgetType = 0;
    this.currentDecorType = 0;
    this.currentPolylineMode = 0;
    this.polylineTopLeft = null;
    this.draggedObject = null;
    this.currentPolyline = null;
  }
  
  leave() {
    this.level.savedOrigin = this.origin;
    this.level.savedZoom = this.zoom;
  }

  update() {
    for (let i = 0; i < EditorScene.terrainTypes.length; i++) {
      const terrainSelectorButton = this.buttons.find((button) => button.terrainType == i);
      terrainSelectorButton.toggled = this.currentTerrainType == i;
      terrainSelectorButton.hidden = this.currentMode != 'draw';
    }
    for (let i = -3; i < EditorScene.gadgetTypes.length; i++) {
      const gadgetSelectorButton = this.buttons.find((button) => button.gadgetType == i);
      if (this.currentMode == 'gadgets') {
        gadgetSelectorButton.toggled = this.currentGadgetType == i;
      }
      gadgetSelectorButton.hidden = !gadgetSelectorButton.activeModes.includes(this.currentMode);
    }
    for (let i = -3; i < EditorScene.decorTypes.length; i++) {
      const decorSelectorButton = this.buttons.find((button) => button.decorType == i);
      if (this.currentMode == 'decor') {
        decorSelectorButton.toggled = this.currentDecorType == i;
      }
      decorSelectorButton.hidden = !decorSelectorButton.activeModes.includes(this.currentMode);
    }
    for (let i = 0;; i++) {
      const polylineModeSelectorButton = this.buttons.find((button) => button.polylineMode == i);
      if (!polylineModeSelectorButton) {
        break;
      }
      polylineModeSelectorButton.toggled = this.currentPolylineMode == i;
      polylineModeSelectorButton.hidden = this.currentMode != 'draw';
    }
    this.buttons.find((button) => button.text == 'PUBLISH').disabled = !this.level.verified;
    this.updateButtons();
    for (let button of this.buttons) {
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
      polyline.color = polyline.erasing ? 'darkred' : EditorScene.terrainTypes[polyline.index].color;
      drawPolyline(polyline);
    }
    if (this.currentPolyline) {
      drawPolyline(this.currentPolyline);
    }
    for (const gadget of this.level.gadgets) {
      gadget.render();
    }
    drawImage(images.ball_normal, this.level.player, 0);
    drawImage(images.goal, this.level.goal, 0);
  }

  renderUI() {
    context.fillStyle = 'lightgray';
    context.fillRect(0, 620, WIDTH, 720);
    context.lineWidth = 6;
    drawSegment(new Vector(0, 620), new Vector(WIDTH, 620));
    context.fillStyle = 'black';
    this.renderButtons();
  }

  onTouchDown(position) {
    super.onTouchDown(position);
    if (!this.uiTouched) {
      const worldPosition = this.screenToWorldPosition(position);
      switch (this.currentMode) {
        case 'navigate': {
          if (Vector.distance(worldPosition, this.level.player) < 50) {
            this.draggedObject = this.level.player;
          }
          else if (Vector.distance(worldPosition, this.level.goal) < 50) {
            this.draggedObject = this.level.goal;
          }
          else {
            let draggedGadget = null;
            for (const gadget of this.level.gadgets) {
              if (gadget.testPoint(worldPosition)) {
                draggedGadget = gadget;
              }
            }
            if (draggedGadget) {
              this.draggedObject = draggedGadget;
            }
            else {
              this.draggedObject = this.origin;
            }
          }
          break;
        }
        case 'draw': {
          this.currentPolyline = [];
          this.currentPolyline.width = 25 / this.zoom;
          Object.assign(this.currentPolyline, EditorScene.terrainTypes[this.currentTerrainType]);
          this.currentPolyline.push(worldPosition);
          this.currentPolyline.push(Vector.addXY(worldPosition, 0.1, 0.1));
          this.polylineTopLeft = worldPosition;
          break;
        }
        case 'erase': {
          for (const polyline of this.level.terrain) {
            polyline.erasing = distanceFromPolyline(worldPosition, polyline) <= polyline.width / 2;
          }
          break;
        }
      }
    }
  }

  onTouchUp(position) {
    super.onTouchUp(position);
    const worldPosition = this.screenToWorldPosition(position);
    switch (this.currentMode) {
      case 'navigate': {
        if (this.draggedObject) {
          if (this.draggedObject != this.origin) {
            this.level.verified = false;
          }
          this.draggedObject = null;
        }
        break;
      }
      case 'draw': {
        if (this.currentPolyline && this.currentPolyline.length >= 2) {
          this.currentPolyline.erasing = false;
          this.level.terrain.push(this.currentPolyline);
          this.level.verified = false;
        }
        this.currentPolyline = null;
        break;
      }
      case 'erase': {
        let i = 0;
        for (let polygon of this.level.terrain) {
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
      case 'navigate': {
        if (this.draggedObject) {
          if (this.draggedObject instanceof Gadget) {
            this.draggedObject.drag(Vector.subtract(worldPosition, worldDelta), worldDelta);
          }
          else {
            this.draggedObject.add(worldDelta);
          }
        }
        break;
      }
      case 'draw': {
        if (this.currentPolyline) {
          switch (this.currentPolylineMode) {
            case 0: {
              if (this.currentPolyline.length == 0 || Vector.distance(worldPosition, this.currentPolyline.top()) >= this.currentPolyline.width / 2) {
                this.currentPolyline.push(worldPosition);
              }
              break;
            }
            case 1: {
              this.currentPolyline.length = 2;
              this.currentPolyline[0] = new Vector(this.polylineTopLeft.x, this.polylineTopLeft.y);
              this.currentPolyline[1] = new Vector(worldPosition.x, worldPosition.y);
              break;
            }
            case 2: {
              this.currentPolyline.length = 5;
              this.currentPolyline[0] =  new Vector(this.polylineTopLeft.x, this.polylineTopLeft.y);
              this.currentPolyline[1] =  new Vector(worldPosition.x, this.polylineTopLeft.y);
              this.currentPolyline[2] =  new Vector(worldPosition.x, worldPosition.y);
              this.currentPolyline[3] =  new Vector(this.polylineTopLeft.x, worldPosition.y);
              this.currentPolyline[4] =  new Vector(this.polylineTopLeft.x, this.polylineTopLeft.y);
              break;
            }
            case 3: {
              const topLeft = new Vector(Math.min(this.polylineTopLeft.x, worldPosition.x), Math.min(this.polylineTopLeft.y, worldPosition.y));
              const bottomRight = new Vector(Math.max(this.polylineTopLeft.x, worldPosition.x), Math.max(this.polylineTopLeft.y, worldPosition.y));
              const ellipse = generateEllipse(topLeft, bottomRight);
              this.currentPolyline.splice(0, this.currentPolyline.length, ...ellipse);
              break;
            }
          }
        }
        break;
      }
      case 'erase': {
        for (const polyline of this.level.terrain) {
          polyline.erasing = distanceFromPolyline(worldPosition, polyline) <= polyline.width / 2;
        }
        break;
      }
    }
  }

  onClick(position) {
    super.onClick(position);
    const worldPosition = this.screenToWorldPosition(position);
    if (!this.uiTouched) {
      let type;
      if (this.currentMode == 'gadgets' && (type = this.currentGadgetType) < 0 || this.currentMode == 'decor' && (type = this.currentDecorType) < 0) {
        let i = this.level.gadgets.length;
        while (--i >= 0) {
          if (this.level.gadgets[i].testPoint(worldPosition)) {
            break;
          }
        }
        if (i >= 0) {
          switch (type) {
            case -1: {
              this.level.gadgets.splice(i, 1);
              break;
            }
            case -2: {
              const clonedGadget = Object.clone(this.level.gadgets[i]);
              const nameWords = clonedGadget.name.split(' ');
              clonedGadget.name = nameWords[nameWords.length - 2] + ' ' + (++this.level.gadgetsCreated[clonedGadget.type]);
              clonedGadget.drag(null, new Vector(100, 25 - 50 * Math.random()));
              this.level.gadgets.push(clonedGadget);
              break;
            }
            case -3: {
              showEditor(this.level.gadgets[i].userCallback, (text) => {
                this.level.gadgets[i].userCallback = text;
              });
              break;
            }
          }
          this.level.verified = false;
        }
      }
      else if (this.currentMode == 'gadgets') {
        const name = EditorScene.gadgetTypes[this.currentGadgetType].name + ' ' + ++this.level.gadgetsCreated[this.currentGadgetType];
        const gadget = new EditorScene.gadgetTypes[this.currentGadgetType].class(name, worldPosition);
        gadget.type = this.currentGadgetType;
        this.level.gadgets.push(gadget);
        this.level.verified = false;
      }
      else if (this.currentMode == 'decor') {
        const name = EditorScene.decorTypes[this.currentDecorType].name + ' ' + ++this.level.gadgetsCreated[EditorScene.gadgetTypes.length + this.currentDecorType];
        const gadget = new EditorScene.decorTypes[this.currentDecorType].class(name, worldPosition);
        gadget.type = EditorScene.gadgetTypes.length + this.currentDecorType;
        this.level.gadgets.push(gadget);
        this.level.verified = false;
      }
    }
  }

  onLongClick(position) {
    super.onLongClick(position);
    const worldPosition = this.screenToWorldPosition(position);
    if (!this.uiTouched) {
      if (this.currentMode == 'gadgets' || this.currentMode == 'decor') {
        let i = this.level.gadgets.length;
        while (--i >= 0) {
          if (this.level.gadgets[i].testPoint(worldPosition)) {
            break;
          }
        }
        if (i >= 0) {
          showInputPopup(this.level.gadgets[i].name, (text) => {
            this.level.gadgets[i].name = text;
          });
        }
      }
    }
  }
}

class PlayScene extends Scene {
  constructor() {
    super();
    this.physics = Matter.Engine.create();
    this.physics.gravity.y = 700000;
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
      position: new Vector(WIDTH - 80, 520),
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
        text: 'EXIT',
        font: '30px Arial'
      },
      {
        position: new Vector(WIDTH - 90, 670),
        halfSize: new Vector(80, 40),
        onRelease: () => {
          this.initLevel();
        },
        type: 1,
        text: 'RESTART',
        font: '30px Arial'
      },
      this.backwardButton,
      this.forwardButton,
      this.jumpButton
    ];
    this.levelInitialized = false;
    this.initLevel();
    initGameInput();
  }
  
  initLevel() {
    this.uninitLevel();
    this.levelInitialized = true;
    Matter.Composite.clear(this.physics.world);
    const lvl = gameData.currentLevel;
    this.terrain = lvl.terrain;
    this.playerBody = Matter.Bodies.circle(lvl.player.x, lvl.player.y, 30);
    this.playerBody.friction = 0;
    this.playerBody.frictionStatic = 0;
    this.playerBody.restitution = 0;
    this.goalBody = Matter.Bodies.rectangle(lvl.goal.x, lvl.goal.y, 10, 64);
    this.goalBody.isStatic = true;
    this.goalBody.isSensor = true;
    this.terrainBodies = MatterUtil.createTerrainBodies(lvl.terrain);
    this.gadgetBodies = lvl.gadgets.flatMap((gadget) => gadget.createBodies());
    this.onSurface = false;
    this.onSurfaceTimeout = null;
    this.canJump = true;
    this.started = false;
    this.ended = false;
    this.goalReached = false;
    Matter.World.add(this.physics.world, [this.playerBody, this.goalBody]);
    Matter.World.add(this.physics.world, this.terrainBodies);
    Matter.World.add(this.physics.world, this.gadgetBodies);
    const userWorld = {};
    for (const gadgetBody of this.gadgetBodies) {
      gadgetBody.world = userWorld;
    }
    for (const gadgetBody of this.gadgetBodies) {
      this.callUserCallback(gadgetBody, 'enter', {});
    }
  }

  uninitLevel() {
    if (!this.levelInitialized) {
      return;
    }
    this.levelInitialized = false;
    for (const gadgetBody of this.gadgetBodies) {
      this.callUserCallback(gadgetBody, 'leave', {});
    }
  }
  
  leave() {
    this.uninitLevel();
  }

  update() {
    this.updateGameInput();
    if (gameInput.forward || gameInput.backward || gameInput.jump) {
      this.started = true;
    }
    if (gameInput.forward && gameInput.backward) {
      this.playerBody.frictionAir = 5;
    }
    else {
      this.playerBody.frictionAir = 0;
      if (gameInput.forward) {
        if (this.playerBody.velocity.x < 8000) {
          Matter.Body.applyForce(this.playerBody, this.playerBody.position, { x: 7000, y: 0 });
        }
      }
      else if (gameInput.backward) {
        if (this.playerBody.velocity.x > -8000) {
          Matter.Body.applyForce(this.playerBody, this.playerBody.position, { x: -7000, y: 0 });
        }
      }
    }
    if (this.started && !this.ended) {
      Matter.Engine.update(this.physics, DELTA_TIME);
    }
    const target = Vector.negate(this.playerBody.position);
    this.origin.add(target.subtract(this.origin).multiply(10 * DELTA_TIME));
    if (this.started && !this.ended) {
      for (const terrainBody of this.terrainBodies) {
        const touching = MatterUtil.overlap(this.playerBody, terrainBody);
        if (touching && terrainBody.deadly) {
          this.ended = true;
          clicksCanceled = true;
        }
      }
      for (const gadgetBody of this.gadgetBodies) {
        switch (gadgetBody.gadgetType) {
          case 0: {
            break;
          }
          case 1: {
            if (gadgetBody.pressed) {
              gadgetBody.pressed = false;
              this.callUserCallback(gadgetBody, 'pressed', {});
            }
            break;
          }
          case 2: {
            break;
          }
          case 3: {
            if (gadgetBody.collected) {
              this.callUserCallback(gadgetBody, 'collected', {});
              gadgetBody.toBeDeleted = true;
            }
            break;
          }
        }
        gadgetBody.updateProc?.();
        this.callUserCallback(gadgetBody, 'update', {});
      }
      this.gadgetBodies = this.gadgetBodies.filter((gadgetBody) => !gadgetBody.toBeDeleted);
      let handleCollision = (body1, body2, point) => {
        if (!body2.isStatic) {
          body1.onCollision?.(body2, point);
          if (body2 == this.playerBody) {
            body1.onCollisionWithPlayer?.(point);
          }
          if (body1.callback) {
            this.callUserCallback(body1, 'overlap', { other: body2, point: point });
          }
        }
      }
      const contacts = Matter.Detector.collisions({ bodies: this.gadgetBodies.concat(this.playerBody) });
      for (const contact of contacts) {
        for (const support of contact.supports) {
          handleCollision(contact.bodyA, contact.bodyB, support);
          handleCollision(contact.bodyB, contact.bodyA, support);
        }
      }
      let onSurfaceNow = false;
      for (const terrainBody of this.terrainBodies) {
        onSurfaceNow |= MatterUtil.isOnTop(this.playerBody, terrainBody);
      }
      for (const gadgetBody of this.gadgetBodies) {
        if (gadgetBody.gadgetType == 3) {
          continue;
        }
        onSurfaceNow |= MatterUtil.isOnTop(this.playerBody, gadgetBody);
      }
      if (onSurfaceNow) {
        this.onSurface = true;
        clearTimeout(this.onSurfaceTimeout);
        this.onSurfaceTimeout = setTimeout(() => {
          this.onSurface = false;
        }, 200);
      }
      if (this.onSurface) {
        const radius = this.playerBody.circleRadius;
        const velocity = this.playerBody.velocity;
        const angularVelocity = this.playerBody.angularVelocity;
        let difference = velocity.x - angularVelocity * radius;
        Matter.Body.setVelocity(this.playerBody, { x: velocity.x - difference * 0.3, y: velocity.y });
        Matter.Body.setAngularVelocity(this.playerBody, angularVelocity + difference / radius);
      }
      if (gameInput.jump && this.canJump && this.onSurface) {
        Matter.Body.setVelocity(this.playerBody, { x: this.playerBody.velocity.x, y: this.playerBody.velocity.y - 7000 });
        this.canJump = false;
        setTimeout(() => {
          this.canJump = true;
        }, 600);
      }
      if (MatterUtil.overlap(this.playerBody, this.goalBody)) {
        this.ended = true;
        this.goalReached = true;
        clicksCanceled = true;
        gameData.currentLevel.verified = true;
      }
    }
  }

  callUserCallback(gadgetBody, event, data) {
    if (gadgetBody.callback) {
      // if (event != 'update') {
      //   console.log(gadgetBody.name + ' - ' + event);
      // }
      try {
        gadgetBody.callback(event, data, this.callMethod.bind(this));
      }
      catch (e) {
        console.warn('Execution Error:\n' + e);
      }
    }
  }

  callMethod(method, data) {
    try {
      const getBodyByName = (name) => {
        if (name.toLowerCase() == 'player') {
          return this.playerBody;
        }
        return this.gadgetBodies.find((gadget) => gadget.name == name);
      }
      switch (method.toLowerCase()) {
        case 'killplayer': {
          this.ended = true;
          clicksCanceled = true;
          break;
        }
        case 'setvelocity': {
          Matter.Body.setVelocity(getBodyByName(data.name), { x: data.x, y: data.y });
          break;
        }
        case 'addvelocity': {
          const body = getBodyByName(data.name);
          Matter.Body.setVelocity(body, { x: body.velocity.x + data.x, y: body.velocity.y + data.y });
          break;
        }
        case 'setposition': {
          Matter.Body.setPosition(getBodyByName(data.name), { x: data.x, y: data.y });
          break;
        }
        case 'addposition': {
          const body = getBodyByName(data.name);
          Matter.Body.setPosition(body, { x: body.position.x + data.x, y: body.position.y + data.y });
          break;
        }
      }
    }
    catch (e) {
      console.warn('Method Error:\n' + e);
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
      if (!polyline.invisible) {
        drawPolyline(polyline);
      }
    }
    for (const gadgetBody of this.gadgetBodies) {
      gadgetBody.renderProc?.();
    }
    drawImage(images.ball_normal, this.playerBody.position, this.playerBody.angle);
    drawImage(images.goal, this.goalBody.position, 0);
  }
  
  renderUI() {
    context.fillStyle = 'lightgray';
    context.fillRect(0, 620, WIDTH, 720);
    context.strokeStyle = 'black';
    context.lineWidth = 6;
    drawSegment(new Vector(0, 620), new Vector(WIDTH, 620));
    context.fillStyle = 'black';
    this.renderButtons();
    if (!this.started) {
      drawText('Tap to Start', new Vector(WIDTH / 2, 500), '30px Arial');
    }
    if (this.ended) {
      drawText(this.goalReached ? 'Level Completed' : 'Game Over', new Vector(WIDTH / 2, 500), '30px Arial');
    }
  }
  
  onClick(position) {
    super.onClick(position);
    this.started = true;
    if (this.ended) {
      if (this.goalReached) {
        gameData.onLevelExit();
      }
      else {
        this.initLevel();
      }
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
      for (let i = 0; i + 1 < polyline.length; i++) {
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
    for (let i = 0; i < bodiesList.length; i++) {
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
        if (support.y > center1Y + 20) {
          return true;
        }
      }
    }
    return false;
  } 
}
