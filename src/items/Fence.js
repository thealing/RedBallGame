class Fence extends Item {
  constructor(name, position) {
    super(name);
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

  render() {
    drawImage(images.fence, this.center, this.angle);
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
      drawImage(images.fence, body.position, body.angle);
    };
    super.extendBody(body);
    return [body];
  }
}
