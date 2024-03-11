class EditorScene extends Scene {
  static terrainTypes = [
    {
      index: 0,
      deadly: false,
      dynamicFriction: 0.5,
      staticFriction: 0.8,
      restitution: 0.0
    },
    {
      index: 1,
      deadly: true,
      dynamicFriction: 0.4,
      staticFriction: 0.8,
      restitution: 0
    },
    {
      index: 2,
      deadly: false,
      dynamicFriction: 0,
      staticFriction: 0,
      restitution: 0
    },
    {
      index: 3,
      deadly: false,
      dynamicFriction: 0.4,
      staticFriction: 0.8,
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
      name: 'Boulder',
      class: Boulder
    },
    {
      index: 2,
      name: 'Button',
      class: Button
    },
    {
      index: 3,
      name: 'Plank',
      class: Plank
    },
    {
      index: 4,
      name: 'Saw',
      class: Saw
    },
    {
      index: 5,
      name: 'Saw',
      class: Saw
    },
    {
      index: 6,
      name: 'Saw',
      class: Saw
    },
    {
      index: 7,
      name: 'Saw',
      class: Saw
    },
    {
      index: 8,
      name: 'Saw',
      class: Saw
    }
  ];

  static decorTypes = [
    {
      index: 0,
      name: 'Star',
      class: Star
    },
    {
      index: 1,
      name: 'Signs',
      class: Signs
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
        icon: images.ui.icon_rotate,
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
          this.currentGadgetType = -4;
          this.currentDecorType = -4;
        },
        type: 0,
        icon: images.ui.icon_editor,
        gadgetType: -4,
        decorType: -4,
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
    for (let i = -4; i < EditorScene.gadgetTypes.length; i++) {
      const gadgetSelectorButton = this.buttons.find((button) => button.gadgetType == i);
      if (this.currentMode == 'gadgets') {
        gadgetSelectorButton.toggled = this.currentGadgetType == i;
      }
      gadgetSelectorButton.hidden = !gadgetSelectorButton.activeModes.includes(this.currentMode);
    }
    for (let i = -4; i < EditorScene.decorTypes.length; i++) {
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
              console.log("GRAB OBJETC!");
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
          // this.currentPolyline.width = 25 / this.zoom;
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
          let draggedGadget = null;
          for (const gadget of this.level.gadgets) {
            if (gadget.testPoint(worldPosition)) {
              draggedGadget = gadget;
            }
          }
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
        this.updateEraser(worldPosition);
        break;
      }
      case 'gadgets': {
        if (this.currentGadgetType == -3) {
          if (this.draggedObject) {
            const gadget = this.draggedObject;
            if (gadget.angle != undefined && gadget.center != undefined) {
              const center = gadget.center;
              gadget.angle = Math.atan2(worldPosition.y - center.y, worldPosition.x - center.x) + Math.PI / 2;
            }
          }
        }
        break;
      }
      case 'decor': {
        if (this.currentDecorType == -3) {
          if (this.draggedObject) {
            const gadget = this.draggedObject;
            if (gadget.angle != undefined && gadget.center != undefined) {
              const center = gadget.center;
              gadget.angle = Math.atan2(worldPosition.y - center.y, worldPosition.x - center.x) + Math.PI / 2;
            }
          }
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
              clonedGadget.drag(null, new Vector(100 + 25 - 50 * Math.random(), 25 - 50 * Math.random()));
              this.level.gadgets.push(clonedGadget);
              break;
            }
            case -3: {
              this.level.gadgets[i].click(worldPosition);
              break;
            }
            case -4: {
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
      if (this.currentMode == 'gadgets' && this.currentGadgetType == -4 || this.currentMode == 'decor' && this.currentDecorType == -4) {
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
