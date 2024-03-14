class Booster extends PowerItem {
  constructor(name, position) {
    super(name);
    this.zIndex = -2;
    this.center = position;
    this.angle = 0;
    this.halfWidth = 180;
    this.halfHeight = 75;
    this.length = 3;
    this.force = 4000000;
  }

  testPoint(point) {
    point = this.unproject(point);
    return testPointRect(point, Vector.subtractXY(this.center, this.halfWidth, this.halfHeight), Vector.addXY(this.center, this.halfWidth, this.halfHeight));
  }

  drag(position, delta) {
    this.center.add(delta);
  }

  render() {
    drawImage(images.boosters[this.length], this.center, this.angle);
  }

  showOptions() {
    showForm([
      {
        label: 'Length',
        type: 'range',
        min: 0,
        max: 3,
        get: () => this.length,
        set: (value) => {
          this.length = value;
          this.halfWidth = images.boosters[this.length].width / 2;
        }
      },
      {
        label: 'Force',
        type: 'range',
        min: 10,
        max: 500,
        get: () => this.force / 1e5,
        set: (value) => this.force = value * 1e5
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

  createBodies(world) {
    const [body, collider] = Physics.createRectangleBody(world, this.center.x, this.center.y, this.halfWidth * 2, this.halfHeight * 2);
    collider.sensor = true;
    body.type = PhysicsBodyType.STATIC;
    body.zIndex = this.zIndex;
    body.angle = this.angle;
    body.gadgetType = 1;
    body.renderProc = () => {
      drawImage(body.status ? images.boosters[this.length] : images.boosters_inactive[this.length], this.center, this.angle);
    };
    body.onCollision = (otherBody) => {
      if (body.status) {
        otherBody.applyForceAtCenter(Vector.polar(this.angle).multiply(this.force));
      }
    }
    super.extendBody(body);
    return [body];
  }
}
