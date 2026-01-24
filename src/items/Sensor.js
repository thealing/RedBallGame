class Sensor extends Item {
  constructor(name, position) {
    super(name);
    this.zIndex = 1;
    this.lower = Vector.subtractXY(position, 50, 100);
    this.upper = Vector.addXY(position, 50, 100);
    this.buttonType = 'temporary';
    this.dragEnd = -1;
  }

  testPoint(point) {
    if (!testPointRect(point, this.lower, this.upper)) {
      this.dragEnd = -1;
      return;
    }
    this.dragEnd = 0;
    if (Math.abs(point.x - this.lower.x) < TOUCH_RANGE) {
      this.dragEnd |= 1;
    }
    if (Math.abs(point.y - this.lower.y) < TOUCH_RANGE) {
      this.dragEnd |= 2;
    }
    if (Math.abs(point.x - this.upper.x) < TOUCH_RANGE) {
      this.dragEnd |= 4;
    }
    if (Math.abs(point.y - this.upper.y) < TOUCH_RANGE) {
      this.dragEnd |= 8;
    }
    return true;
  }

  drag(position, delta) {
    if (!position || this.dragEnd == 0) {
      this.lower.add(delta);
      this.upper.add(delta);
    }
    else {
      this.dragTo(Vector.add(position, delta));
    }
  }

  dragTo(location) {
    if (this.dragEnd & 1) {
      this.lower.x = location.x;
      this.lower.x = Math.min(this.lower.x, this.upper.x - 80);
    }
    if (this.dragEnd & 2) {
      this.lower.y = location.y;
      this.lower.y = Math.min(this.lower.y, this.upper.y - 80);
    }
    if (this.dragEnd & 4) {
      this.upper.x = location.x;
      this.upper.x = Math.max(this.upper.x, this.lower.x + 80);
    }
    if (this.dragEnd & 8) {
      this.upper.y = location.y;
      this.upper.y = Math.max(this.upper.y, this.lower.y + 80);
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
        label: 'Name',
        type: 'text',
        get: () => this.name,
        set: (value) => this.name = value
      },
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

  getCenter() {
    const center = Vector.middle(this.lower, this.upper);
    this.testPoint(center);
    return center;
  }
}
