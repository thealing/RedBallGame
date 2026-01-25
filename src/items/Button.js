class Button extends Item {
  constructor(name, position) {
    super(name);
    this.zIndex = 1;
    this.center = position;
    this.angle = 0;
    this.buttonType = 'push';
  }

  testPoint(point) {
    point = this.unproject(point);
    return testPointRect(point, Vector.subtractXY(this.center, 40, 20), Vector.addXY(this.center, 40, 40));
  }

  drag(position, delta) {
    this.center.add(delta);
  }

  dragTo(location) {
    this.center.set(0, -24).rotate(this.angle).add(location);
  }

  render() {
    drawImage(images.button, this.center, this.angle);
  }

  showOptions() {
    showForm([
      {
        label: 'Name',
        type: 'text',
        get: () => this.name,
        set: (value) => this.name = value
      },
      {
        label: 'Type',
        type: 'list',
        values: [
          'push',
          'permanent',
          'toggle'
        ],
        get: () => this.buttonType,
        set: (value) => this.buttonType = value
      }
    ]);
  }

  createBodies(world) {
    const bodyCenter = Vector.subtract(this.center, Vector.rotate(new Vector(0, -25), this.angle));
    const [body, collider] = Physics.createRectangleBody(world, bodyCenter.x, bodyCenter.y, 75, 16, { static: true });
    body.angle = this.angle;
    body.zIndex = this.zIndex;
    const [sensorBody, sensorCollider] = Physics.createRectangleBody(world, 0, 0, 72, 15);
    sensorCollider.sensor = true;
    sensorBody.type = PhysicsBodyType.STATIC;
    sensorBody.angle = this.angle;
    sensorBody.toggleState = 0;
    sensorBody.renderProc = () => {
      drawImage(sensorBody.pressed ? images.button_presseds[sensorBody.toggleState] : images.buttons[sensorBody.toggleState], Vector.add(body.position, Vector.rotate(new Vector(0, -25), this.angle)), body.angle);
    };
    sensorBody.updateProc = () => {
      if (sensorBody.wasPressed) {
        sensorBody.pressed = true;
      }
      if (this.buttonType != 'toggle') {
        sensorBody.toggleState = sensorBody.pressed ? 1 : 0;
      }
    };
    sensorBody.onCollision = (otherBody, point) => {
      if (otherBody != body && otherBody.type != PhysicsBodyType.STATIC) {
        if (!sensorBody.pressed) {
          if (this.buttonType == 'toggle') {
            sensorBody.toggleState ^= 1;
          }
        }
        sensorBody.pressed = true;
        if (this.buttonType == 'permanent') {
          sensorBody.wasPressed = true;
        }
      }
    };
    sensorBody.zIndex = this.zIndex;
    sensorBody.position = Vector.add(body.position, Vector.rotate(new Vector(0, -25), this.angle));
    sensorBody.gadgetType = 1;
    super.extendBody(sensorBody);
    return [body, sensorBody];
  }
}
