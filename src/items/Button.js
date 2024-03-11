class Button extends Item {
  constructor(name, position) {
    super(name);
    this.zIndex = 1;
    this.center = position;
    this.angle = 0;
    this.angleOffset = -Math.PI / 2;
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
    return [body, sensorBody];
  }
}
