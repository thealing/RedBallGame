class PlayScene extends Scene {
  constructor() {
    super();
  }

  enter() {
    super.enter();
    this.setAnchorToCenter();
    this.zoom = gameData.currentLevel?.savedZoom ?? 0.075;
    this.levelPaused = false;
    this.pauseButton = {
      position: new Vector(WIDTH - 270, HEIGHT - 50),
      halfSize: new Vector(80, 40),
      onRelease: () => {
        this.levelPaused = !this.levelPaused;
      },
      type: 1,
      text: 'PAUSE',
      font: '30px Arial'
    };
    this.backwardButton = {
      position: new Vector(80, HEIGHT - 200),
      halfSize: new Vector(60, 60),
      renderProc: () => {
        drawImage(gameInput.backward ? images.ui.arrow.left_pressed : images.ui.arrow.left, new Vector(0, 0), 0);
      }
    }
    this.forwardButton = {
      position: new Vector(200, HEIGHT - 200),
      halfSize: new Vector(60, 60),
      renderProc: () => {
        drawImage(gameInput.forward ? images.ui.arrow.right_pressed : images.ui.arrow.right, new Vector(0, 0), 0);
      }
    }
    this.jumpButton = {
      position: new Vector(WIDTH - 80, HEIGHT - 200),
      halfSize: new Vector(60, 60),
      renderProc: () => {
        drawImage(gameInput.jump ? images.ui.arrow.up_pressed : images.ui.arrow.up, new Vector(0, 0), 0);
      }
    }
    this.buttons = [
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
        position: new Vector(90, HEIGHT - 50),
        halfSize: new Vector(80, 40),
        onRelease: gameData.onLevelExit,
        type: 1,
        text: 'BACK',
        font: '30px Arial'
      },
      {
        position: new Vector(WIDTH - 90, HEIGHT - 50),
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
      this.jumpButton,
      this.pauseButton
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
    this.level = gameData.currentLevel;
    this.terrain = this.level.terrain;
    this.playerBody = Physics.createCircleBody(this.physics, this.level.player.x, this.level.player.y, 30)[0];
    this.playerBody.staticFriction = 0;
    this.playerBody.dynamicFriction = 0;
    this.playerBody.restitution = 0;
    this.goalBody = Physics.createRectangleBody(this.physics, this.level.goal.x, this.level.goal.y, 10, 64)[0];
    this.goalBody.type = PhysicsBodyType.STATIC;
    this.goalBody.colliders.first.item.sensor = true;
    this.terrainBodies = PhysicsUtil.createTerrainBodies(this.physics, this.level.terrain);
    this.gadgetBodies = this.level.gadgets.flatMap((gadget) => gadget.createBodies(this.physics));
    this.onSurfaceNow = false;
    this.onSurfaceDirection = 0;
    this.onSurface = false;
    this.onSurfaceTimeout = null;
    this.canJump = true;
    this.started = false;
    this.ended = false;
    this.levelPaused = false;
    this.goalReached = false;
    this.starsLeft = false;
    this.ballImage = colorizeImage(images.ball_background, playerData.ballColor);
    this.playerBody.onPhysicsCollision = (otherBody, collision) => {
      if (otherBody.deadly) {
        playerData.deathCount++;
        this.ended = true;
        clicksCanceled = true;
      }
      if (otherBody.gadgetType == 3 || otherBody.gadgetType == 4 || otherBody.gadgetType == 1) {
        return;
      }
      this.onSurfaceNow ||= this.physics.gravity.y > 0 ? collision.point.y >= this.playerBody.position.y + 10 : collision.point.y <= this.playerBody.position.y - 10;
      this.onSurfaceDirection = Math.sign(collision.point.y - this.playerBody.position.y);
      if (this.onSurfaceDirection != Math.sign(this.physics.gravity.y)) {
        this.onSurfaceDirection = 0;
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
    this.updateButtons();
    if (gameInput.forward || gameInput.backward || gameInput.jump) {
      if (!this.levelPaused) {
        this.started = true;
      }
    }
    if (this.started && !this.ended && !this.levelPaused) {
      this.playerBody.staticFriction = 0.5;
      this.playerBody.dynamicFriction = 0.5;
      if (gameInput.forward && gameInput.backward) {
        if (this.playerBody.linearVelocity.x < 0) {
          this.playerBody.applyForceAtCenter({ x: 2000000, y: 0 });
        }
        if (this.playerBody.linearVelocity.x > 0) {
          this.playerBody.applyForceAtCenter({ x: -2000000, y: 0 });
        }
      }
      else {
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
      if (playerData.debugSlowMotion) {
        this.physics.step(DELTA_TIME / playerData.debugSlowMotion);
      }
      else {
        this.physics.step(DELTA_TIME);
      }
    }
    if (!this.levelPaused) {
      const target = Vector.negate(this.playerBody.position);
      this.origin.add(target.subtract(this.origin).multiply(10 * DELTA_TIME));
    }
    if (this.started && !this.ended && !this.levelPaused) {
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
      if (this.onSurfaceNow) {
        this.onSurfaceNow = false;
        this.onSurface = true;
        clearTimeoutIngame(this.onSurfaceTimeout);
        this.onSurfaceTimeout = setTimeoutIngame(() => {
          this.onSurface = false;
        }, 200);
      }
      if (this.onSurface) {
        const radius = this.playerBody.colliders.first.item.worldShape.radius;
        const velocity = this.playerBody.linearVelocity;
        const angularVelocity = this.playerBody.angularVelocity;
        const sign = this.onSurfaceDirection;
        if (sign != 0) {
          const difference = velocity.x - angularVelocity * radius * sign;
          this.playerBody.angularVelocity = angularVelocity + difference / radius * sign * 10 * DELTA_TIME;
        }
      }
      if (gameInput.jump && this.canJump && this.onSurface) {
        this.playerBody.linearVelocity.copy({ x: this.playerBody.linearVelocity.x, y: this.physics.gravity.y > 0 ? Math.min(this.playerBody.linearVelocity.y, -440) : Math.max(this.playerBody.linearVelocity.y, 440) });
        this.canJump = false;
        setTimeoutIngame(() => {
          this.canJump = true;
        }, 600);
      }
      if (PhysicsUtil.testBodies(this.playerBody, this.goalBody)) {
        this.ended = true;
        this.starsLeft = this.gadgetBodies.find((gadget) => gadget.typeName == 'Star');
        this.goalReached = !this.starsLeft;
        clicksCanceled = true;
        if (!this.starsLeft) {
          if (!playerData.finishedLevelIds.includes(gameData.currentLevel.id)) {
            playerData.finishedLevelIds.push(gameData.currentLevel.id);
          }
          gameData.currentLevel.verified = true;
        }
      }
    }
  }

  renderWorld() {
    const gradient = context.createLinearGradient(0, -10000, 0, 10000);
    gradient.addColorStop(0, this.level.upperColor || 'lightblue');
    gradient.addColorStop(1, this.level.lowerColor || 'darkblue');
    context.fillStyle = gradient;
    context.fillRect(-1e9, -1e9, 2e9, 2e9);
    context.lineWidth = 5;
    const zMap = [];
    for (const gadgetBody of this.gadgetBodies) {
      gadgetBody.zIndex ??= 0;
      zMap[gadgetBody.zIndex] ??= [];
      zMap[gadgetBody.zIndex].push(gadgetBody);
    }
    for (let i = -100; i <= -1; i++) {
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
    for (let i = 1; i <= 100; i++) {
      if (zMap[i]) {
        for (const gadgetBody of zMap[i]) {
          gadgetBody.renderProc?.();
        }
      }
    }
    drawImage(this.ballImage, this.playerBody.position, this.playerBody.angle, playerScale);
    drawImage(images.ball_foreground, this.playerBody.position, this.playerBody.angle, playerScale);
    drawImage(images.goal, this.goalBody.position, 0);
    for (let i = 101; i <= 200; i++) {
      if (zMap[i]) {
        for (const gadgetBody of zMap[i]) {
          gadgetBody.renderProc?.();
        }
      }
    }
    if (playerData.debugDrawColliders) {
      context.save();
      context.strokeStyle = 'red';
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.lineWidth = 1;
      for (let node = currentScene.physics.colliders.first; node != null; node = node.next) {
        let s = node.item.worldShape;
        if (s.points) {
          context.beginPath();
          context.moveTo(s.points[s.points.length - 1].x, s.points[s.points.length - 1].y);
          for (let i = 0; i < s.points.length; i++) {
            context.lineTo(s.points[i].x, s.points[i].y);
          }
          context.stroke();
        }
        if (s.center) {
          context.beginPath();
          context.arc(s.center.x, s.center.y, s.radius, 0, Math.PI * 2);
          context.stroke();
        }
      }
      context.restore();
    }
  }
  
  renderUI() {
    context.fillStyle = 'lightgray';
    context.fillRect(0, HEIGHT - 100, WIDTH, HEIGHT);
    context.strokeStyle = 'black';
    context.lineWidth = 6;
    drawSegment(new Vector(0, HEIGHT - 100), new Vector(WIDTH, HEIGHT - 100));
    context.fillStyle = 'black';
    this.pauseButton.text = this.levelPaused ? 'RESUME' : 'PAUSE';
    this.renderButtons();
    if (!this.started) {
      drawText(('Tap to Start').toUpperCase(), new Vector(WIDTH / 2, HEIGHT - 220), '30px Arial');
    }
    if (this.ended) {
      drawText((this.goalReached ? 'Level Completed' : this.starsLeft ? 'There Are Stars Left' : 'Game Over').toUpperCase(), new Vector(WIDTH / 2, HEIGHT - 220), '30px Arial');
    }
  }

  onTouchMove(position, delta) {
    super.onTouchMove(position, delta);
    const worldDelta = this.screenToWorldDelta(delta);
    if (this.levelPaused) {
      this.origin.add(worldDelta);
    }
  }
  
  onClick(position) {
    super.onClick(position);
    if (!this.levelPaused && !this.uiTouched) {
      this.started = true;
    }
    if (this.ended && !this.uiTouched) {
      if (this.goalReached) {
        gameData.onLevelExit();
      }
      else {
        this.initLevel();
      }
    }
  }

  updateGameInput() {
    initGameInput();
    const processTouch = (position) => {
      if (testPointRect(position, Vector.subtract(this.backwardButton.position, this.backwardButton.halfSize), Vector.add(this.backwardButton.position, this.backwardButton.halfSize))) {
        gameInput.backward = true;
      }
      if (testPointRect(position, Vector.subtract(this.forwardButton.position, this.forwardButton.halfSize), Vector.add(this.forwardButton.position, this.forwardButton.halfSize))) {
        gameInput.forward = true;
      }
      if (testPointRect(position, Vector.subtract(this.jumpButton.position, this.jumpButton.halfSize), Vector.add(this.jumpButton.position, this.jumpButton.halfSize))) {
        gameInput.jump = true;
      }
    };
    if (mouseIsDown) {
      processTouch(mousePosition);
    }
    for (const [touchId, position] of touchPositions) {
      processTouch(position);
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
        const points = [];
        const half = polyline.width / 2;
        let orderedPolyline = [];
        for (let i = 0; i < polyline.length; i++) {
          orderedPolyline[i] = polyline[i].clone();
        }
        const polygon = new Polygon(orderedPolyline);
        if (polygon.getLinearMassFactor() > 0) {
          orderedPolyline.reverse();
        }
        for (let i = 0; i + 1 < orderedPolyline.length; i++) {
          const a = orderedPolyline[i];
          const b = orderedPolyline[i + 1];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy);
          if (len == 0) {
            continue;
          }
          const nx = -dy / len;
          const ny =  dx / len;
          points.push(new Vector(a.x + nx * half, a.y + ny * half), new Vector(b.x + nx * half, b.y + ny * half));
        }
        bodies[polyline.index].createCollider(new Polygon(points), 1);
      }
      else {
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
        const circles = [];
        circles.push(Geometry.createCircle(polyline[0].x, polyline[0].y, polyline.width / 2));
        circles.push(Geometry.createCircle(polyline[polyline.length - 1].x, polyline[polyline.length - 1].y, polyline.width / 2));
        for (const circle of circles) {
          const collider = bodies[polyline.index].createCollider(circle, 1);
          Object.assign(collider, EditorScene.terrainTypes[polyline.index]);
        }
      }
      if (polyline.filled && polyline.length == 5) {
        const circles = [];
        for (let i = 0; i < polyline.length - 1; i++) {
          circles.push(Geometry.createCircle(polyline[i].x, polyline[i].y, polyline.width / 2));
        }
        for (const circle of circles) {
          const collider = bodies[polyline.index].createCollider(circle, 1);
          Object.assign(collider, EditorScene.terrainTypes[polyline.index]);
        }
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
}
