class Gadget {
  constructor(name) {
    this.name = name;
    this.userCallback = '(event, data, env) => {\n}\n';
  }

  testPoint(point) {
    return false;
  }

  drag(position, delta) {
  }

  rotate(angle) {
  }

  click(position) {
  }

  render() {
  }

  createBody() {
  }

  addUserCallback(obj) {
    obj.name = this.name;
    obj.typeName = this.typeName;
    try {
      obj.callback = eval(this.userCallback);
      obj.callback.bind(obj);
    }
    catch (e) {
      console.warn('Instantiation Error:\n' + e);
    }
  }

  unproject(point) {
    return Vector.subtract(point, this.center).rotate(-this.angle).add(this.center);
  }
}

class Box extends Gadget {
  constructor(name, position) {
    super(name);
    this.zIndex = 2;
    this.center = position;
    this.halfSize = 50;
  }

  testPoint(point) {
    return testPointRect(point, Vector.subtractXY(this.center, this.halfSize, this.halfSize), Vector.addXY(this.center, this.halfSize, this.halfSize));
  }

  drag(position, delta) {
    this.center.add(delta);
  }

  render() {
    drawImage(images.box, this.center, 0);
  }

  createBodies(world) {
    const ret = {};
    const body = Physics.createRectangleBody(world, this.center.x, this.center.y, this.halfSize * 2 - 12, this.halfSize * 2 - 12, ret);
    body.zIndex = this.zIndex;
    ret.coll.staticFriction = 0.1;
    ret.coll.dynamicFriction = 0.5;
    body.gadgetType = 0;
    body.renderProc = () => {
      drawImage(images.box, body.position, body.angle);
    };
    super.addUserCallback(body);
    return [ body ];
  }
}

class Boulder extends Gadget {
  constructor(name, position) {
    super(name);
    this.zIndex = 2;
    this.center = position;
    this.radius = 67.5;
  }

  testPoint(point) {
    return Vector.distanceSquared(this.center, point) <= this.radius ** 2;
  }

  drag(position, delta) {
    this.center.add(delta);
  }

  render() {
    drawImage(images.boulder, this.center, 0);
  }

  createBodies(world) {
    const ret = {};
    const body = Physics.createCircleBody(world, this.center.x, this.center.y, this.radius, ret);
    body.zIndex = this.zIndex;
    ret.coll.staticFriction = 0.6;
    ret.coll.dynamicFriction = 0.6;
    ret.coll.restitution = 0.2;
    body.gadgetType = 0;
    body.renderProc = () => {
      drawImage(images.boulder, body.position, body.angle);
    };
    super.addUserCallback(body);
    return [ body ];
  }
}

class Button extends Gadget {
  constructor(name, position) {
    super(name);
    this.zIndex = 1;
    this.center = position;
    this.angle = 0;
  }

  testPoint(point) {
    point = this.unproject(point);
    return testPointRect(point, Vector.subtractXY(this.center, 40, 20), Vector.addXY(this.center, 40, 40));
  }

  drag(position, delta) {
    this.center.add(delta);
  }

  render() {
    drawImage(images.button, this.center, this.angle);
  }

  createBodies(world) {
    const body = Physics.createRectangleBody(world, this.center.x, this.center.y + 25, 80, 20, { static: true });
    body.angle = this.angle;
    body.zIndex = this.zIndex;
    const ret = {};
    const sensorBody = Physics.createRectangleBody(world, 0, 0, 72, 15, ret);
    sensorBody.type = PhysicsBodyType.STATIC;
    sensorBody.angle = this.angle;
    ret.coll.sensor = true;
    body.renderProc = () => {
      drawImage(sensorBody.pressed ? images.button_pressed : images.button, Vector.add(body.position, Vector.rotate(new Vector(0, -25), this.angle)), body.angle);
    };
    sensorBody.onCollision = (otherBody, point) => {
      if (otherBody != body && otherBody.type != PhysicsBodyType.STATIC) {
        sensorBody.pressed = true;
      }
    };
    sensorBody.zIndex = this.zIndex;
    sensorBody.position = Vector.add(body.position, Vector.rotate(new Vector(0, -25), this.angle));
    sensorBody.gadgetType = 1;
    super.addUserCallback(sensorBody);
    return [ body, sensorBody ];
  }
}

class Plank extends Gadget {
  constructor(name, position) {
    super(name);
    this.zIndex = 1;
    this.start = Vector.addXY(position, -100, 0);
    this.end = Vector.addXY(position, 100, 0);
  }

  testPoint(point) {
    return distanceFromSegment(point, this.start, this.end) < 10;
  }

  drag(position, delta) {
    if (!position) {
      this.start.add(delta);
      this.end.add(delta);
    }
    else {
      const distanceFromStart = Vector.distance(position, this.start);
      const distanceFromEnd = Vector.distance(position, this.end);
      if (distanceFromStart < 40 && distanceFromEnd >= 40) {
        this.start.add(delta);
      }
      else if (distanceFromEnd < 40 && distanceFromStart >= 40) {
        this.end.add(delta);
      }
      else {
        this.start.add(delta);
        this.end.add(delta);
      }
    }
    const length = this.getLength();
    const minLength = 60;
    if (length > 0 && length < minLength) {
      const offset = Vector.subtract(this.end, this.start).multiply(80 / minLength);
      this.start.add(offset);
      this.end.subtract(offset);
    }
  }

  render() {
    drawImage(images.plank, this.getCenter(), this.getAngle(), { x: this.getLength() / 200, y: 1 });
    drawImage(images.plank_end, this.start, this.getAngle());
    drawImage(images.plank_end, this.end, this.getAngle());
  }

  createBodies(world) {
    const center = this.getCenter();
    const length = this.getLength();
    const angle = this.getAngle();
    const body = Physics.createRectangleBody(world, center.x, center.y, length, 16);
    body.type = PhysicsBodyType.STATIC;
    body.angle = angle;
    body.gadgetType = 2;
    body.zIndex = this.zIndex;
    body.renderProc = () => {
      drawImage(images.plank, body.position, body.angle, { x: length / 200, y: 1 });
      drawImage(images.plank_end, { x: body.position.x - length / 2 * Math.cos(body.angle), y: body.position.y - length / 2 * Math.sin(body.angle) }, body.angle);
      drawImage(images.plank_end, { x: body.position.x + length / 2 * Math.cos(body.angle), y: body.position.y + length / 2 * Math.sin(body.angle) }, body.angle);
    };
    super.addUserCallback(body);
    return [ body ];
  }

  getLength() {
    return Vector.distance(this.start, this.end);
  }

  getCenter() {
    return Vector.middle(this.start, this.end);
  }

  getAngle() {
    return Math.atan2(this.end.y - this.start.y, this.end.x - this.start.x);
  }
}

class Saw extends Gadget {
  constructor(name, position) {
    super(name);
    this.zIndex = -1;
    this.center = position;
    this.center2 = Vector.addXY(position, 100, 0);
    this.radius = 60;
    this.dragEnd = -1;
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
    const ret = {};
    const body = Physics.createCircleBody(world, this.center.x, this.center.y, this.radius, ret);
    body.type = PhysicsBodyType.KINEMATIC;
    body.zIndex = this.zIndex;
    ret.coll.staticFriction = 1.0;
    ret.coll.dynamicFriction = 1.0;
    ret.coll.restitution = 0.0;
    body.gadgetType = 0;
    body.movementDirection = 1;
    const movementVector = Vector.subtract(this.center2, this.center);
    const movementDistance = movementVector.length();
    body.updateProc = () => {
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
      if (other.typeName == 'Box') {
        body.env.destroyObject(other);
      }
    };
    body.onCollisionWithPlayer = (point) => {
      body.env.killPlayer();
    };
    super.addUserCallback(body);
    return [ body ];
  }
}

class Star extends Gadget {
  constructor(name, position) {
    super(name);
    this.zIndex = -1;
    this.center = position;
    this.halfSize = 25;
  }

  testPoint(point) {
    return testPointRect(point, Vector.subtractXY(this.center, this.halfSize, this.halfSize), Vector.addXY(this.center, this.halfSize, this.halfSize));
  }

  drag(position, delta) {
    this.center.add(delta);
  }

  render() {
    drawImage(images.star, this.center, 0);
  }

  createBodies(world) {
    const ret = {};
    const body = Physics.createRectangleBody(world, this.center.x, this.center.y, this.halfSize * 2 - 20, this.halfSize * 2 - 20, ret);
    body.type = PhysicsBodyType.STATIC;
    body.zIndex = this.zIndex;
    ret.coll.sensor = true;
    body.gadgetType = 3;
    body.renderProc = () => {
      if (!body.collected) {
        drawImage(images.star, body.position, body.angle);
      }
    };
    body.onCollisionWithPlayer = (point) => {
      if (!body.collected) {
        body.collected = true;
      }
    };
    super.addUserCallback(body);
    return [ body ];
  }
}

class Signs extends Gadget {
  constructor(name, position) {
    super(name);
    this.zIndex = -2;
    this.center = position;
    this.halfWidth = 20;
    this.halfHeight = 50;
    this.angle = 0;
    this.skin = 0;
  }

  testPoint(point) {
    point = this.unproject(point);
    return testPointRect(point, Vector.subtractXY(this.center, this.halfWidth, this.halfHeight), Vector.addXY(this.center, this.halfWidth, this.halfHeight));
  }

  drag(position, delta) {
    this.center.add(delta);
  }

  click(position) {
    this.skin++;
    this.skin %= images.signs.length;
  }

  render() {
    drawImage(images.signs[this.skin], this.center, this.angle);
  }

  createBodies(world) {
    const ret = {};
    const body = Physics.createRectangleBody(world, this.center.x, this.center.y, this.halfWidth, this.halfHeight, ret);
    body.type = PhysicsBodyType.STATIC;
    body.zIndex = this.zIndex;
    body.angle = this.angle;
    ret.coll.sensor = true;
    body.gadgetType = 4;
    body.renderProc = () => {
      drawImage(images.signs[this.skin], body.position, body.angle);
    };
    super.addUserCallback(body);
    return [ body ];
  }
}