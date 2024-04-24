class EditorScene extends Scene {
  static terrainTypes = [
    {
      deadly: false,
      dynamicFriction: 0.5,
      staticFriction: 0.8,
      restitution: 0.0
    },
    {
      deadly: true,
      dynamicFriction: 0.4,
      staticFriction: 0.8,
      restitution: 0
    },
    {
      deadly: false,
      dynamicFriction: 0,
      staticFriction: 0,
      restitution: 0
    },
    {
      deadly: false,
      dynamicFriction: 0.4,
      staticFriction: 0.8,
      restitution: 0,
      invisible: true
    }
  ];

  static gadgetTypes = [
    {
      name: 'Star',
      class: Star
    },
    {
      name: 'Box',
      class: Box
    },
    {
      name: 'Boulder',
      class: Boulder
    },
    {
      name: 'Button',
      class: Button
    },
    {
      name: 'Switch',
      class: Switch
    },
    {
      name: 'Platform',
      class: Platform
    },
    {
      name: 'Vanisher',
      class: Vanisher
    },
    {
      name: 'Trampoline',
      class: Trampoline
    },
    {
      name: 'Plank',
      class: Plank
    },
    {
      name: 'Laser',
      class: Laser
    },
    {
      name: 'Saw',
      class: Saw
    },
    {
      name: 'Windmill',
      class: Windmill
    },
    {
      name: 'Sensor',
      class: Sensor
    },
    {
      name: 'Gravity Switch',
      class: GravitySwitch
    },
    {
      name: 'Booster',
      class: Booster
    },
    {
      name: 'Elevator',
      class: Elevator
    },
    {
      name: 'Teleport',
      class: Teleport
    },
    {
      name: 'Door',
      class: Door
    }
  ];

  static decorTypes = [
    {
      name: 'Sign',
      class: Sign
    },
    {
      name: 'Fence',
      class: Fence
    },
    {
      name: 'Text',
      class: Text
    }
  ]

  constructor() {
    super();
    for (let i = 0; i < EditorScene.terrainTypes.length; i++) {
      EditorScene.terrainTypes[i].index = i;
      EditorScene.terrainTypes[i].color = images.terrains[i];
    }
    for (let i = 0; i < EditorScene.gadgetTypes.length; i++) {
      EditorScene.gadgetTypes[i].index = i;
      EditorScene.gadgetTypes[i].icon = images.ui.gadgets[i];
    }
    for (let i = 0; i < EditorScene.decorTypes.length; i++) {
      EditorScene.decorTypes[i].index = i;
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
        position: new Vector(WIDTH - 260, 60),
        halfSize: new Vector(40, 40),
        onRelease: () => {
          showForm([
            {
              label: 'Cell Width',
              type: 'number',
              step: 10,
              get: () => this.gridWidth,
              set: (value) => this.gridWidth = value
            },
            {
              label: 'Cell Height',
              type: 'number',
              step: 10,
              get: () => this.gridHeight,
              set: (value) => this.gridHeight = value
            },
            {
              label: 'Color',
              type: 'color',
              get: () => this.gridColor,
              set: (value) => this.gridColor = value
            },
            {
              label: 'Opaqueness',
              type: 'range',
              min: 0,
              max: 1,
              step: 0.05,
              get: () => this.gridAlpha,
              set: (value) => this.gridAlpha = value
            },
            {
              label: 'Show',
              type: 'check',
              get: () => this.gridEnabled,
              set: (value) => this.gridEnabled = value
            },
            {
              label: 'Snap',
              type: 'check',
              get: () => this.gridSnap,
              set: (value) => this.gridSnap = value
            }
          ]);
        },
        type: 0,
        icon: images.ui.icon_grid
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
        position: new Vector(WIDTH - 60, 260),
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
        position: new Vector(WIDTH - 60, 360),
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
        position: new Vector(WIDTH - 60, 460),
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
        position: new Vector(WIDTH - 60, 460),
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
        position: new Vector(WIDTH - 60, 360),
        halfSize: new Vector(40, 40),
        toggled: false,
        hidden: true,
        onPress: () => {
          this.currentGadgetType = -3;
          this.currentDecorType = -3;
        },
        type: 0,
        icon: images.ui.icon_rotate,
        gadgetType: -3,
        decorType: -3,
        activeModes: [ 'gadgets', 'decor' ]
      },
      {
        position: new Vector(WIDTH - 60, 260),
        halfSize: new Vector(40, 40),
        toggled: false,
        hidden: true,
        onPress: () => {
          this.currentGadgetType = -4;
          this.currentDecorType = -4;
        },
        type: 0,
        icon: images.ui.icon_editor,
        gadgetType: -4,
        decorType: -4,
        activeModes: [ 'gadgets', 'decor' ]
      }
    ];
    this.leftArrowButton = {
      position: new Vector(40, 560),
      halfSize: new Vector(20, 40),
      hidden: true,
      onRelease: () => {
        if (this.currentMode == 'gadgets') {
          this.gadgetsScroll--;
        }
        if (this.currentMode == 'decor') {
          this.decorScroll--;
        }
      },
      type: 3,
      activeModes: [ 'gadgets', 'decor' ]
    };
    this.rightArrowButton = {
      position: new Vector(600, 560),
      halfSize: new Vector(20, 40),
      hidden: true,
      onRelease: () => {
        if (this.currentMode == 'gadgets') {
          this.gadgetsScroll++;
        }
        if (this.currentMode == 'decor') {
          this.decorScroll++;
        }
      },
      type: 4,
      activeModes: [ 'gadgets', 'decor' ]
    };
    this.buttons.push(this.leftArrowButton, this.rightArrowButton);
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
        position: new Vector(120 + 100 * (i % 5), 560),
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
        position: new Vector(120 + 100 * (i % 5), 560),
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
    for (const gadget of this.level.gadgets) {
      gadget.updateImages?.();
    }
    this.buttonPressed = null;
    this.ballImage = colorizeImage(images.ball_background, playerData.ballColor);
    if (previousScene != scenes.play) {
      this.currentMode = 'navigate';
      this.currentTerrainType = 0;
      this.currentGadgetType = 0;
      this.currentDecorType = 0;
      this.currentPolylineMode = 0;
      this.gadgetsScroll = 0;
      this.decorScroll = 0;
      this.polylineTopLeft = null;
      this.draggedObject = null;
      this.dragAngleOffset = null;
      this.currentPolyline = null;
      this.gridWidth = 100;
      this.gridHeight = 100;
      this.gridEnabled = false;
      this.gridSnap = false;
      this.gridThickness = 1;
      this.gridColor = '#000000';
      this.gridAlpha = 0.2;
    }
  }
  
  leave() {
    this.level.savedOrigin = this.origin;
    this.level.savedZoom = this.zoom;
  }

  update() {
    for (let button of this.buttons) {
      button.hidden = false;
    }
    for (let i = 0; i < EditorScene.terrainTypes.length; i++) {
      const terrainSelectorButton = this.buttons.find((button) => button.terrainType == i);
      terrainSelectorButton.toggled = this.currentTerrainType == i;
      terrainSelectorButton.hidden = this.currentMode != 'draw';
    }
    for (let i = -4; i < EditorScene.gadgetTypes.length; i++) {
      const gadgetSelectorButton = this.buttons.find((button) => button.gadgetType == i);
      if (this.currentMode == 'gadgets') {
        gadgetSelectorButton.toggled = this.currentGadgetType == i;
      }
    }
    for (let i = -4; i < EditorScene.decorTypes.length; i++) {
      const decorSelectorButton = this.buttons.find((button) => button.decorType == i);
      if (this.currentMode == 'decor') {
        decorSelectorButton.toggled = this.currentDecorType == i;
      }
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
    for (let i = 0; i < EditorScene.gadgetTypes.length; i++) {
      const gadgetSelectorButton = this.buttons.find((button) => button.gadgetType == i);
      gadgetSelectorButton.hidden = !(Math.floor(i / 5) == this.gadgetsScroll);
    }
    for (let i = 0; i < EditorScene.decorTypes.length; i++) {
      const decorSelectorButton = this.buttons.find((button) => button.decorType == i);
      decorSelectorButton.hidden = !(Math.floor(i / 5) == this.decorScroll);
    }
    if (this.currentMode == 'gadgets') {
      this.leftArrowButton.disabled = this.gadgetsScroll == 0;
      this.rightArrowButton.disabled = this.gadgetsScroll == Math.floor((EditorScene.gadgetTypes.length - 1) / 5);
    }
    if (this.currentMode == 'decor') {
      this.leftArrowButton.disabled = this.decorScroll == 0;
      this.rightArrowButton.disabled = this.decorScroll == Math.floor((EditorScene.decorTypes.length - 1) / 5);
    }
    for (let button of this.buttons) {
      if (button.activeModes && !button.activeModes.includes(this.currentMode)) {
        button.hidden = true;
      }
    }
  }

  updateEraser(point) {
    let polylineToBeErased = null;
    for (const polyline of this.level.terrain) {
      polyline.erasing = false;
      if (distanceFromPolyline(point, polyline) <= polyline.width / 2) {
        polylineToBeErased = polyline;
      }
      if (polyline.filled && testPointPolygon(point, polyline)) {
        polylineToBeErased = polyline;
      }
    }
    if (polylineToBeErased) {
      polylineToBeErased.erasing = true;
    }
  }

  renderWorld() {
    const gradient = context.createLinearGradient(0, -10000, 0, 10000);
    gradient.addColorStop(0, this.level.upperColor || 'lightblue');
    gradient.addColorStop(1, this.level.lowerColor || 'darkblue');
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
    const zMap = [];
    for (const gadget of this.level.gadgets) {
      gadget.zIndex ??= 0;
      zMap[gadget.zIndex] ??= [];
      zMap[gadget.zIndex].push(gadget);
    }
    for (let i = -100; i <= 100; i++) {
      if (zMap[i]) {
        for (const gadget of zMap[i]) {
          gadget.render();
        }
      }
    }
    drawImage(this.ballImage, this.level.player, 0);
    drawImage(images.ball_foreground, this.level.player, 0);
    drawImage(images.goal, this.level.goal, 0);
    for (let i = 101; i <= 200; i++) {
      if (zMap[i]) {
        for (const gadget of zMap[i]) {
          gadget.render();
        }
      }
    }
    if (this.gridEnabled && this.gridWidth > Math.max(0, 1 / this.zoom) && this.gridHeight > Math.max(0, 1 / this.zoom)) {
      context.save();
      context.lineCap = 'butt';
      context.lineJoin = 'miter';
      context.lineWidth = this.gridThickness;
      context.strokeStyle = this.gridColor;
      context.globalAlpha = this.gridAlpha;
      const minCoords = this.screenToWorldPosition({ x: 0, y: 0 });
      const maxCoords = this.screenToWorldPosition({ x: WIDTH, y: HEIGHT });
      for (let x = minCoords.x - minCoords.x % this.gridWidth; x <= maxCoords.x; x += this.gridWidth) {
        drawSegment(new Vector(x, minCoords.y), new Vector(x, maxCoords.y));
      }
      for (let y = minCoords.y - minCoords.y % this.gridHeight; y <= maxCoords.y; y += this.gridHeight) {
        drawSegment(new Vector(minCoords.x, y), new Vector(maxCoords.x, y));
      }
      context.restore();
    }
  }

  renderUI() {
    context.fillStyle = 'lightgray';
    context.strokeStyle = 'black';
    context.lineWidth = 6;
    context.lineCap = 'round';
    if (this.currentMode == 'gadgets' || this.currentMode == 'decor') {
      context.fillRect(0, 500, 640, 620);
      drawSegment(new Vector(0, 500), new Vector(640, 500));
      drawSegment(new Vector(640, 500), new Vector(640, 620));
    }
    context.fillRect(0, 620, WIDTH, 720);
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
            const draggedGadget = this.getSelectedGadget(worldPosition);
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
          this.currentPolyline.width = 18;
          Object.assign(this.currentPolyline, EditorScene.terrainTypes[this.currentTerrainType]);
          this.currentPolyline.push(worldPosition);
          this.currentPolyline.push(Vector.addXY(worldPosition, 0.1, 0.1));
          this.polylineTopLeft = worldPosition;
          if (this.currentPolylineMode >= 2) {
            this.currentPolyline.filled = true;
          }
          break;
        }
        case 'erase': {
          this.updateEraser(worldPosition);
          break;
        }
        case 'gadgets':
        case 'decor': {
          const draggedGadget = this.getSelectedGadget(worldPosition);
          if (draggedGadget) {
            this.draggedObject = draggedGadget;
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
    this.draggedObject = null;
    this.dragAngleOffset = null;
  }

  onTouchMove(position, delta) {
    super.onTouchMove(position, delta);
    const worldPosition = this.screenToWorldPosition(position);
    const worldDelta = this.screenToWorldDelta(delta);
    switch (this.currentMode) {
      case 'navigate': {
        if (this.draggedObject) {
          if (this.gridSnap && this.draggedObject != this.origin) {
            const snappedPosition = this.snapPosition(worldPosition);
            if (this.draggedObject instanceof Item) {
              this.draggedObject.dragTo(snappedPosition);
            }
            else {
              this.draggedObject.copy(snappedPosition);
            }
          }
          else {
            if (this.draggedObject instanceof Item) {
              this.draggedObject.drag(Vector.subtract(worldPosition, worldDelta), worldDelta);
            }
            else {
              this.draggedObject.add(worldDelta);
            }
          }
          if (this.draggedObject != this.origin) {
            this.level.verified = false;
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
        this.updateEraser(worldPosition);
        break;
      }
    }
    if (this.currentMode == 'gadgets' && this.currentGadgetType == -3 || this.currentMode == 'decor' && this.currentDecorType == -3) {
      if (this.draggedObject) {
        const gadget = this.draggedObject;
        if (gadget.angle != undefined && gadget.center != undefined && (gadget.dragEnd == undefined || gadget.dragEnd == 0)) {
          const center = gadget.center;
          const dragAngle = Math.atan2(worldPosition.y - center.y, worldPosition.x - center.x);
          if (this.dragAngleOffset == null) {
            this.dragAngleOffset = gadget.angle - dragAngle;
          }
          else {
            gadget.angle = dragAngle + this.dragAngleOffset;
          }
        }
      }
    }
  }

  onClick(position) {
    super.onClick(position);
    const worldPosition = this.screenToWorldPosition(position);
    const coverTouched = position.y >= 620 || (this.currentMode == 'gadgets' || this.currentMode == 'decor') && position.y >= 500 && position.x <= 640;
    if (!this.uiTouched && !coverTouched) {
      let type;
      if (this.currentMode == 'gadgets' && (type = this.currentGadgetType) < 0 || this.currentMode == 'decor' && (type = this.currentDecorType) < 0) {
        const i = this.getSelectedGadgetIndex(worldPosition);
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
              clonedGadget.drag(null, new Vector(100 + 25 - 50 * Math.random(), 25 - 50 * Math.random()));
              this.level.gadgets.push(clonedGadget);
              break;
            }
            case -3: {
              this.level.gadgets[i].click(worldPosition);
              break;
            }
            case -4: {
              this.level.gadgets[i].showOptions();
              break;
            }
          }
          this.level.verified = false;
        }
        else {
          switch (type) {
            case -1: {
              break;
            }
            case -2: {
              break;
            }
            case -3: {
              break;
            }
            case -4: {
              if (Vector.distance(worldPosition, this.level.player) < 50) {
                // player settings
              }
              else if (Vector.distance(worldPosition, this.level.goal) < 50) {
                // goal settings
              }
              else {
                showForm([
                  {
                    label: 'Upper Color',
                    type: 'color',
                    get: () => this.level.upperColor,
                    set: (value) => this.level.upperColor = value
                  },
                  {
                    label: 'Lower Color',
                    type: 'color',
                    get: () => this.level.lowerColor,
                    set: (value) => this.level.lowerColor = value
                  }
                ]);
              }
              break;
            }
          }
        }
      }
      else if (this.currentMode == 'gadgets') {
        const typeName = EditorScene.gadgetTypes[this.currentGadgetType].name;
        const name = typeName + ' ' + ++this.level.gadgetsCreated[this.currentGadgetType];
        const gadget = new EditorScene.gadgetTypes[this.currentGadgetType].class(name, worldPosition);
        gadget.type = this.currentGadgetType;
        gadget.typeName = typeName;
        this.level.gadgets.push(gadget);
        this.level.verified = false;
      }
      else if (this.currentMode == 'decor') {
        const typeName = EditorScene.decorTypes[this.currentDecorType].name;
        const name = typeName + ' ' + ++this.level.gadgetsCreated[EditorScene.gadgetTypes.length + this.currentDecorType];
        const gadget = new EditorScene.decorTypes[this.currentDecorType].class(name, worldPosition);
        gadget.type = EditorScene.gadgetTypes.length + this.currentDecorType;
        gadget.typeName = typeName;
        this.level.gadgets.push(gadget);
        this.level.verified = false;
      }
    }
  }

  onLongClick(position) {
    super.onLongClick(position);
    const worldPosition = this.screenToWorldPosition(position);
    if (!this.uiTouched) {
      if (this.currentMode == 'navigate' && this.draggedObject) {
        let x = worldPosition.x;
        let y = worldPosition.y;
        showForm([
          {
            label: 'X',
            type: 'number',
            get: () => x,
            set: (value) => x = value
          },
          {
            label: 'Y',
            type: 'number',
            get: () => y,
            set: (value) => y = value
          }
        ], () => {
          if (!isNaN(x) && !isNaN(y)) {
            if (this.draggedObject == this.origin) {
              this.origin.set(x, y);
            }
            else {
              const worldDelta = new Vector(x, y).subtract(worldPosition);
              if (this.draggedObject instanceof Item) {
                this.draggedObject.drag(Vector.subtract(worldPosition, worldDelta), worldDelta);
              }
              else {
                this.draggedObject.add(worldDelta);
              }
              this.level.verified = false;
            }
          }
        });
      }
      if (this.currentMode == 'gadgets' && this.currentGadgetType == -4 || this.currentMode == 'decor' && this.currentDecorType == -4) {
        const i = this.getSelectedGadgetIndex(worldPosition);
        if (i >= 0) {
          showInputPopup(this.level.gadgets[i].name, (text) => {
            this.level.gadgets[i].name = text;
          });
        }
      }
    }
  }

  snapPosition(position) {
    let result = new Vector(position.x, position.y);
    if (this.gridSnap && this.gridWidth > 0 && this.gridHeight > 0) {
      const cellX = (result.x < 0 ? this.gridWidth : 0) + result.x % this.gridWidth;
      const cellY = (result.y < 0 ? this.gridHeight : 0) + result.y % this.gridHeight;
      result.x = cellX >= this.gridWidth / 2 ? result.x - cellX + this.gridWidth : result.x - cellX;
      result.y = cellY >= this.gridHeight / 2 ? result.y - cellY + this.gridHeight : result.y - cellY;
    }
    return result;
  }

  screenToWorldDelta(delta) {
    return Vector.divide(delta, this.zoom);
  }
  
  getSelectedGadget(position) {
    let selectedIndex = this.getSelectedGadgetIndex(position);
    return selectedIndex == -1 ? null : this.level.gadgets[selectedIndex];
  }
  
  getSelectedGadgetIndex(position) {
    let selectedIndex = -1;
    for (let i = 0; i < this.level.gadgets.length; i++) {
      if (this.level.gadgets[i].testPoint(position) && (selectedIndex == -1 || this.level.gadgets[i].zIndex >= this.level.gadgets[selectedIndex].zIndex)) {
        selectedIndex = i;
      }
    }
    return selectedIndex;
  }
}
