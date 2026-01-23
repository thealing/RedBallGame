class Elevator extends PowerItem {
  constructor(name, position) {
    super(name);
    this.zIndex = -3;
    this.center = position;
    this.center2 = Vector.subtractXY(position, 0, 100);
    this.angle = 0;
    this.halfWidth = 150;
    this.halfHeight = 8;
    this.dragEnd = -1;
    this.speed = 100;
    this.delay = 0.5;
  }

  showOptions() {
    showForm([
      {
        label: 'Length',
        type: 'range',
        min: 50,
        max: 2000,
        get: () => this.halfWidth,
        set: (value) => this.halfWidth = value
      },
      {
        label: 'Speed',
        type: 'range',
        min: Math.log(10),
        max: Math.log(1000),
        step: 'any',
        get: () => Math.log(this.speed),
        set: (value) => this.speed = Math.exp(value)
      },
      {
        label: 'Delay',
        type: 'number',
        step: 100,
        get: () => Math.round(this.delay * 1000),
        set: (value) => this.delay = value / 1000
      },
      {
        label: 'On By Default',
        type: 'check',
        get: () => this.onByDefault,
        set: (value) => this.onByDefault = value
      },
      {
        label: 'Controller',
        type: 'text',
        get: () => this.controllerName,
        set: (value) => this.controllerName = value
      }
    ]);
  }

  testPoint(point) {
    if (testPointRect(this.unproject(point, this.center2), Vector.subtractXY(this.center2, this.halfWidth + this.halfHeight, this.halfHeight), Vector.addXY(this.center2, this.halfWidth + this.halfHeight, this.halfHeight))) {
      this.dragEnd = 1;
      return true;
    }
    if (testPointRect(this.unproject(point, this.center), Vector.subtractXY(this.center, this.halfWidth + this.halfHeight, this.halfHeight), Vector.addXY(this.center, this.halfWidth + this.halfHeight, this.halfHeight))) {
      this.dragEnd = 0;
      return true;
    }
    this.dragEnd = -1;
    return false;
  }

  drag(position, delta) {
    if (!position) {
      this.center.add(delta);
      this.center2.add(delta);
    }
    else if (this.dragEnd == 0) {
      this.center.add(delta);
      this.center2.add(delta);
    }
    else if (this.dragEnd == 1) {
      this.center2.add(delta);
    }
  }

  dragTo(location) {
    if (this.dragEnd == 0) {
      this.center.copy(location);
    }
    else if (this.dragEnd == 1) {
      this.center2.copy(location);
    }
  }

  render() {
    context.globalAlpha = 0.7;
    context.strokeStyle = 'rgb(93, 93, 93)';
    context.lineWidth = 2;
    drawSegment(this.center, this.center2);
    context.globalAlpha = 1.0;
    drawImage(images.elevator, this.center, this.angle, new Vector(this.halfWidth / 100, 1));
    drawImage(images.elevator_end, Vector.add(this.center, Vector.polar(this.angle).multiply(this.halfWidth)), this.angle);
    drawImage(images.elevator_end, Vector.add(this.center, Vector.polar(this.angle).multiply(-this.halfWidth)), this.angle, new Vector(-1, 1));
    context.globalAlpha = 0.7;
    drawImage(images.elevator, this.center2, this.angle, new Vector(this.halfWidth / 100, 1));
    drawImage(images.elevator_end, Vector.add(this.center2, Vector.polar(this.angle).multiply(this.halfWidth)), this.angle);
    drawImage(images.elevator_end, Vector.add(this.center2, Vector.polar(this.angle).multiply(-this.halfWidth)), this.angle, new Vector(-1, 1));
    context.globalAlpha = 1.0;
  }

  createBodies(world) {
    const [body, collider] = Physics.createTrapezoidBody(world, this.center.x, this.center.y, this.halfWidth * 2, (this.halfWidth + this.halfHeight) * 2, this.halfHeight * 2);
    collider.staticFriction = 0.6;
    collider.dynamicFriction = 0.6;
    collider.restitution = 0.2;
    body.type = PhysicsBodyType.KINEMATIC;
    body.angle = this.angle;
    body.zIndex = this.zIndex;
    body.gadgetType = 0;
    body.movementDirection = 1;
    body.powerProc = () => {
      const movementVector = Vector.subtract(this.center2, this.center);
      const movementVectorNormalized = movementVector.clone().normalize();
      switch (body.movementDirection) {
        case 1: {
          body.linearVelocity = Vector.multiply(movementVectorNormalized, this.speed);
          if (Vector.dot(body.position, movementVector) >= Vector.dot(this.center2, movementVector)) {
            body.movementDirection = -2;
            body.delayRemaining = this.delay;
          }
          break;
        }
        case 2: {
          body.linearVelocity = Vector.multiply(movementVectorNormalized, -this.speed);
          if (Vector.dot(body.position, movementVector) <= Vector.dot(this.center, movementVector)) {
            body.movementDirection = -1;
            body.delayRemaining = this.delay;
          }
          break;
        }
        default: {
          body.linearVelocity = new Vector(0, 0);
          body.delayRemaining -= DELTA_TIME;
          if (body.delayRemaining <= 0) {
            body.movementDirection *= -1;
          }
          break;
        }
      }
    };
    body.standbyProc = () => {
      body.linearVelocity = new Vector(0, 0);
    }
    body.renderProc = () => {
      drawImage(images.elevator, body.position, body.angle, new Vector(this.halfWidth / 100, 1));
      drawImage(images.elevator_end, Vector.add(body.position, Vector.polar(body.angle).multiply(this.halfWidth)), body.angle);
      drawImage(images.elevator_end, Vector.add(body.position, Vector.polar(body.angle).multiply(-this.halfWidth)), body.angle, new Vector(-1, 1));
    };
    super.extendBody(body);
    return [body];
  }

  getCenter(point) {
    if (point != undefined) {
      this.testPoint(point);
      if (this.dragEnd == 1) {
        return this.center2;
      }
    }
    return this.center;
  }
}
