class Saw extends PowerItem {
  constructor(name, position) {
    super(name);
    this.zIndex = -1;
    this.center = position;
    this.center2 = Vector.addXY(position, 100, 0);
    this.radius = 60;
    this.dragEnd = -1;
  }
  
  showOptions() {
    showForm([
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
    if (Vector.distance(this.center2, point) <= this.radius) {
      this.dragEnd = 1;
      return true;
    }
    if (Vector.distance(this.center, point) <= this.radius) {
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

  render() {
    context.globalAlpha = 0.7;
    context.strokeStyle = 'rgb(93, 93, 93)';
    context.lineWidth = 2;
    drawSegment(this.center, this.center2);
    context.globalAlpha = 1.0;
    drawImage(images.saw, this.center, 0);
    context.globalAlpha = 0.7;
    drawImage(images.saw, this.center2, 0);
    context.globalAlpha = 1.0;
  }

  createBodies(world) {
    const [body, collider] = Physics.createCircleBody(world, this.center.x, this.center.y, this.radius);
    collider.staticFriction = 1.0;
    collider.dynamicFriction = 1.0;
    collider.restitution = 0.0;
    body.type = PhysicsBodyType.KINEMATIC;
    body.zIndex = this.zIndex;
    body.deadly = true;
    body.gadgetType = 0;
    body.movementDirection = 1;
    const movementVector = Vector.subtract(this.center2, this.center);
    const movementDistance = movementVector.length();
    body.powerProc = () => {
      body.angle += 5 * DELTA_TIME;
      const distance = Vector.distance(body.position, this.center);
      const distance2 = Vector.distance(body.position, this.center2);
      const minDistance = Math.min(distance, distance2);
      const speed = Math.clamp(minDistance, 20, 100) * 3 * DELTA_TIME;
      if (body.movementDirection == 1) {
        if (Vector.dot(body.position, movementVector) >= Vector.dot(this.center2, movementVector)) {
          body.movementDirection = 0;
        }
        else {
          body.position.add(Vector.subtract(this.center2, this.center).normalize().multiply(speed));
        }
      }
      else {
        if (Vector.dot(body.position, movementVector) <= Vector.dot(this.center, movementVector)) {
          body.movementDirection = 1;
        }
        else {
          body.position.add(Vector.subtract(this.center, this.center2).normalize().multiply(speed));
        }
      }
    };
    body.renderProc = () => {
      drawImage(images.saw, body.position, body.angle);
    };
    body.onCollision = (other, point) => {
      if (other.typeName == 'Box' && !other.toBeDeleted) {
        other.toBeDeleted = true;
        other.destroy();
      }
    };
    super.extendBody(body);
    return [body];
  }
}
