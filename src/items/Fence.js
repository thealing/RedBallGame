class Fence extends Item {
  constructor(name, position) {
    super(name);
    this.position = 'background';
    this.zIndex = -3;
    this.center = position;
    this.halfWidth = 200;
    this.halfHeight = 100;
    this.angle = 0;
  }

  testPoint(point) {
    point = this.unproject(point);
    return testPointRect(point, Vector.subtractXY(this.center, this.halfWidth, this.halfHeight), Vector.addXY(this.center, this.halfWidth, this.halfHeight));
  }

  drag(position, delta) {
    this.center.add(delta);
  }

  dragTo(location) {
    this.center.copy(location);
  }

  render() {
    drawImage(images.fence, this.center, this.angle);
  }

  showOptions() {
    showForm([
      {
        label: 'Position',
        type: 'list',
        values: [
          'foreground',
          'background'
        ],
        get: () => this.position,
        set: (value) => {
          this.position = value;
          this.zIndex = this.position == 'background' ? -3 : 103;
        }
      }
    ]);
  }

  createBodies(world) {
    const [body, collider] = Physics.createRectangleBody(world, this.center.x, this.center.y, this.halfWidth, this.halfHeight);
    collider.sensor = true;
    body.type = PhysicsBodyType.STATIC;
    body.zIndex = this.zIndex;
    body.angle = this.angle;
    body.gadgetType = 4;
    body.renderProc = () => {
      drawImage(images.fence, body.position, body.angle);
    };
    super.extendBody(body);
    return [body];
  }
}
