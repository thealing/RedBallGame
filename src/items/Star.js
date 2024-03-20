class Star extends Item {
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

  dragTo(location) {
    this.center.copy(location);
  }

  render() {
    drawImage(images.star, this.center, 0);
  }

  createBodies(world) {
    const ret = {};
    const [body, collider] = Physics.createRectangleBody(world, this.center.x, this.center.y, this.halfSize * 2 - 20, this.halfSize * 2 - 20, ret);
    collider.sensor = true;
    body.type = PhysicsBodyType.STATIC;
    body.zIndex = this.zIndex;
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
    super.extendBody(body);
    return [body];
  }
}
