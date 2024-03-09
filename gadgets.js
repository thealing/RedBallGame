class Gadget {
  constructor(name) {
    this.name = name;
    this.userCallback = '(event, data, callMethod) => {\n}\n';
  }

  testPoint(point) {
    return false;
  }

  drag(position, delta) {
  }

  render() {
  }

  createBody() {
  }

  addUserCallback(obj) {
    try {
      obj.callback = eval(this.userCallback);
      obj.callback.bind(obj);
    }
    catch (e) {
      console.warn('Instantiation Error:\n' + e);
    }
  }
}

class Box extends Gadget {
  constructor(name, position) {
    super(name);
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
    const body = Physics.createRectangleBody(world, this.center.x, this.center.y, this.halfSize * 2 - 14, this.halfSize * 2 - 14, ret);
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
    ret.coll.staticFriction = 0.6;
    ret.coll.dynamicFriction = 0.6;
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
    this.center = position;
  }

  testPoint(point) {
    return testPointRect(point, Vector.subtractXY(this.center, 40, 20), Vector.addXY(this.center, 40, 40));
  }

  drag(position, delta) {
    this.center.add(delta);
  }

  render() {
    drawImage(images.button, this.center, 0);
  }

  createBodies(world) {
    const body = Physics.createRectangleBody(world, this.center.x, this.center.y + 25, 80, 20, { static: true });
    body.gadgetType = 1;
    body.renderProc = () => {
      drawImage(body.pressed ? images.button_pressed : images.button, Vector.addXY(body.position, 0, -25), body.angle);
    };
    const ret = {};
    const sensorBody = Physics.createRectangleBody(world, 0, 0, 72, 15, ret);
    sensorBody.type = PhysicsBodyType.STATIC;
    ret.coll.sensor = true;
    sensorBody.onCollision = (otherBody, point) => {
      if (otherBody != body && otherBody.type != PhysicsBodyType.STATIC) {
        body.pressed = true;
      }
    };
    sensorBody.position.x = body.position.x;
    sensorBody.position.y = body.position.y - 25;
    super.addUserCallback(body);
    return [ body, sensorBody ];
  }
}

class Plank extends Gadget {
  constructor(name, position) {
    super(name);
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

class Star extends Gadget {
  constructor(name, position) {
    super(name);
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
