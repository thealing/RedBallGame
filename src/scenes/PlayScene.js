class PlayScene extends Scene {
  constructor() {
    super();
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
    this.physics?.destroy();
    this.physics = new PhysicsWorld();
    this.physics.gravity.y = 700;
    const lvl = gameData.currentLevel;
    this.terrain = lvl.terrain;
    this.playerBody = Physics.createCircleBody(this.physics, lvl.player.x, lvl.player.y, 30);
    this.playerBody.staticFriction = 0;
    this.playerBody.dynamicFriction = 0;
    this.playerBody.restitution = 0;
    this.goalBody = Physics.createRectangleBody(this.physics, lvl.goal.x, lvl.goal.y, 10, 64);
    this.goalBody.type = PhysicsBodyType.STATIC;
    this.goalBody.colliders.first.item.sensor = true;
    this.terrainBodies = PhysicsUtil.createTerrainBodies(this.physics, lvl.terrain);
    this.gadgetBodies = lvl.gadgets.flatMap((gadget) => gadget.createBodies(this.physics));
    this.onSurface = false;
    this.onSurfaceTimeout = null;
    this.canJump = true;
    this.started = false;
    this.ended = false;
    this.goalReached = false;
    this.starsLeft = false;
    this.playerBody.onPhysicsCollision = (otherBody, point) => {
      if (otherBody.deadly) {
        this.ended = true;
        clicksCanceled = true;
      }
    };
    for (const gadgetBody of this.gadgetBodies) {
      gadgetBody.onPhysicsCollision = (otherBody, collision) => {
        let result = gadgetBody.onCollision?.(otherBody, collision.point, collision.normal);
        if (otherBody == this.playerBody) {
          result ||= gadgetBody.onCollisionWithPlayer?.(collision.point, collision.normal);
        }
        return result;
      };
    }
  }

  uninitLevel() {
    if (!this.levelInitialized) {
      return;
    }
    this.levelInitialized = false;
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
      this.playerBody.staticFriction = 0.99;
      this.playerBody.dynamicFriction = 0.99;
    }
    else {
      this.playerBody.staticFriction = 0.5;
      this.playerBody.dynamicFriction = 0.5;
      if (gameInput.forward) {
        if (this.playerBody.linearVelocity.x < 400) {
          this.playerBody.applyForceAtCenter({ x: 4000000, y: 0 });
        }
      }
      else if (gameInput.backward) {
        if (this.playerBody.linearVelocity.x > -400) {
          this.playerBody.applyForceAtCenter({ x: -4000000, y: 0 });
        }
      }
    }
    if (this.started && !this.ended) {
      this.physics.step(DELTA_TIME);
    }
    const target = Vector.negate(this.playerBody.position);
    this.origin.add(target.subtract(this.origin).multiply(10 * DELTA_TIME));
    if (this.started && !this.ended) {
      for (const gadgetBody of this.gadgetBodies) {
        switch (gadgetBody.gadgetType) {
          case 0: {
            break;
          }
          case 1: {
            if (gadgetBody.pressed) {
              gadgetBody.pressed = gadgetBody.pressed === true ? 2 : false;
            }
            break;
          }
          case 2: {
            break;
          }
          case 3: {
            if (gadgetBody.collected) {
              gadgetBody.toBeDeleted = true;
            }
            break;
          }
        }
        gadgetBody.updateProc?.(this.gadgetBodies);
      }
      this.gadgetBodies = this.gadgetBodies.filter((gadgetBody) => !gadgetBody.toBeDeleted);
      let onSurfaceNow = false;
      for (const terrainBody of this.terrainBodies) {
        onSurfaceNow |= PhysicsUtil.isOnTop(this.playerBody, terrainBody);
      }
      for (const gadgetBody of this.gadgetBodies) {
        if (gadgetBody.gadgetType == 3 || gadgetBody.gadgetType == 4 || gadgetBody.gadgetType == 1) {
          continue;
        }
        onSurfaceNow |= PhysicsUtil.isOnTop(this.playerBody, gadgetBody);
      }
      if (onSurfaceNow) {
        this.onSurface = true;
        clearTimeout(this.onSurfaceTimeout);
        this.onSurfaceTimeout = setTimeout(() => {
          this.onSurface = false;
        }, 200);
      }
      if (this.onSurface) {
        const radius = this.playerBody.colliders.first.item.worldShape.radius;
        const velocity = this.playerBody.linearVelocity;
        const angularVelocity = this.playerBody.angularVelocity;
        let difference = velocity.x - angularVelocity * radius;
        this.playerBody.linearVelocity.copy({ x: velocity.x - difference * 0.3, y: velocity.y });
        this.playerBody.angularVelocity = angularVelocity + difference / radius;
      }
      if (gameInput.jump && this.canJump && this.onSurface) {
        this.playerBody.linearVelocity.copy({ x: this.playerBody.linearVelocity.x, y: Math.min(this.playerBody.linearVelocity.y, -440) });
        this.canJump = false;
        setTimeout(() => {
          this.canJump = true;
        }, 600);
      }
      if (PhysicsUtil.testBodies(this.playerBody, this.goalBody)) {
        this.ended = true;
        this.starsLeft = this.gadgetBodies.find((gadget) => gadget.typeName == 'Star');
        this.goalReached = !this.starsLeft;
        clicksCanceled = true;
        gameData.currentLevel.verified = true;
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
    const zMap = [];
    for (const gadgetBody of this.gadgetBodies) {
      gadgetBody.zIndex ??= 0;
      zMap[gadgetBody.zIndex] ??= [];
      zMap[gadgetBody.zIndex].push(gadgetBody);
    }
    for (let i = -100; i < 0; i++) {
      if (zMap[i]) {
        for (const gadgetBody of zMap[i]) {
          gadgetBody.renderProc?.();
        }
      }
    }
    for (const polyline of this.terrain) {
      if (!polyline.invisible) {
        drawPolyline(polyline);
      }
    }
    for (let i = 0; i <= 100; i++) {
      if (zMap[i]) {
        for (const gadgetBody of zMap[i]) {
          gadgetBody.renderProc?.();
        }
      }
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
      drawText(('Tap to Start').toUpperCase(), new Vector(WIDTH / 2, 500), '30px Arial');
    }
    if (this.ended) {
      drawText((this.goalReached ? 'Level Completed' : this.starsLeft ? 'There Are Stars Left' : 'Game Over').toUpperCase(), new Vector(WIDTH / 2, 500), '30px Arial');
    }
  }
  
  onClick(position) {
    super.onClick(position);
    this.started = true;
    if (this.ended && !this.uiTouched) {
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

class PhysicsUtil {
  static createTerrainBodies(world, terrain) {
    const bodies = [];
    for (const polyline of terrain) {
      if (!bodies[polyline.index]) {
        bodies[polyline.index] = world.createBody(PhysicsBodyType.STATIC);
        Object.assign(bodies[polyline.index], EditorScene.terrainTypes[polyline.index]);
      }
      if (polyline.filled) {
        const center = new Vector(0, 0);
        let weight = 0;
        for (let i = 0; i + 1 < polyline.length; i++) {
          const a = polyline[i];
          const b = polyline[i + 1];
          center.add(Vector.middle(a, b));
          weight += Vector.distance(a, b);
        }
        center.divide(weight);
        bodies[polyline.index].createCollider(new Polygon(Util.cloneArray(polyline)), 1);
      }
      for (let i = 0; i + 1 < polyline.length; i++) {
        const a = polyline[i];
        const b = polyline[i + 1];
        const middle = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const distance = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        const rectangle = Geometry.createRotatedRectangle(middle.x, middle.y, distance, polyline.width, angle);
        const collider = bodies[polyline.index].createCollider(rectangle, 1);
        Object.assign(collider, EditorScene.terrainTypes[polyline.index]);
      }
      for (const circle of [
        Geometry.createCircle(polyline[0].x, polyline[0].y, polyline.width / 2),
        Geometry.createCircle(polyline[polyline.length - 1].x, polyline[polyline.length - 1].y, polyline.width / 2)
      ]) {
        const collider = bodies[polyline.index].createCollider(circle, 1);
        Object.assign(collider, EditorScene.terrainTypes[polyline.index]);
      }
    }
    const result = [];
    for (const body of bodies) {
      if (body) {
        result.push(body);
      }
    }
    return result;
  }
  
  static testBodies(body1, body2) {
    for (const collider1 of body1.colliders) {
      for (const collider2 of body2.colliders) {
        if (Physics.collide(collider1, collider2)) {
          return true;
        }
      }
    }
    return false;
  }
  
  static isOnTop(body1, body2) {
    for (const collider1 of body1.colliders) {
      for (const collider2 of body2.colliders) {
        const collision = Physics.collide(collider1, collider2);
        if (collision && collision.collision.point.y > body1.position.y + 10) {
          return true;
        }
      }
    }
    return false;
  } 
}
