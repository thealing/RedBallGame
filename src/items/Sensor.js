class Sensor extends Item {
  constructor(name, position) {
    super(name);
    this.zIndex = 1;
    this.lower = Vector.subtractXY(position, 50, 100);
    this.upper = Vector.addXY(position, 50, 100);
    this.buttonType = 'temporary';
  }

  testPoint(point) {
    return testPointRect(point, this.lower, this.upper);
  }

  drag(position, delta) {
    if (!position) {
      this.lower.add(delta);
      this.upper.add(delta);
      return;
    }
    let resized = false;
    if (Math.abs(position.x - this.lower.x) < TOUCH_RANGE) {
      this.lower.x += delta.x;
      this.lower.x = Math.min(this.lower.x, this.upper.x - 80);
      resized = true;
    }
    if (Math.abs(position.y - this.lower.y) < TOUCH_RANGE) {
      this.lower.y += delta.y;
      this.lower.y = Math.min(this.lower.y, this.upper.y - 80);
      resized = true;
    }
    if (Math.abs(position.x - this.upper.x) < TOUCH_RANGE) {
      this.upper.x += delta.x;
      this.upper.x = Math.max(this.upper.x, this.lower.x + 80);
      resized = true;
    }
    if (Math.abs(position.y - this.upper.y) < TOUCH_RANGE) {
      this.upper.y += delta.y;
      this.upper.y = Math.max(this.upper.y, this.lower.y + 80);
      resized = true;
    }
    if (!resized) {
      this.lower.add(delta);
      this.upper.add(delta);
    }
  }

  render() {
    context.save();
    context.globalAlpha = 0.5;
    context.fillStyle = 'white';
    drawRect(this.lower, this.upper);
    context.restore();
  }

  showOptions() {
    showForm([
      {
        label: 'Type',
        type: 'list',
        values: [
          'temporary',
          'permanent'
        ],
        get: () => this.buttonType,
        set: (value) => this.buttonType = value
      }
    ]);
  }

  createBodies(world) {
    const centerX = (this.lower.x + this.upper.x) / 2;
    const centerY = (this.lower.y + this.upper.y) / 2;
    const width = this.upper.x - this.lower.x;
    const height = this.upper.y - this.lower.y;
    const [body, collider] = Physics.createRectangleBody(world, centerX, centerY, width, height);
    collider.sensor = true;
    body.zIndex = this.zIndex;
    body.type = PhysicsBodyType.STATIC;
    body.toggleState = 0;
    body.updateProc = () => {
      if (body.wasPressed) {
        body.pressed = true;
      }
      body.toggleState = body.pressed ? 1 : 0;
    };
    body.onCollisionWithPlayer = (point) => {
      body.pressed = true;
      if (this.buttonType == 'permanent') {
        body.wasPressed = true;
      }
    };
    body.gadgetType = 1;
    super.extendBody(body);
    return [body];
  }
}
