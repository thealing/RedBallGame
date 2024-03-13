class Box extends Item {
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
    super.extendBody(body);
    return [body];
  }
}