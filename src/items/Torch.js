class Torch extends Item {
  constructor(name, position) {
    super(name);
    this.zIndex = -2;
    this.center = position;
    this.halfWidth = 30;
    this.halfHeight = 85;
    this.angle = 0;
    this.angleOffset = Math.PI / 2;
    this.skin = 0;
  }

  testPoint(point) {
    point = this.unproject(point);
    return testPointRect(point, Vector.subtractXY(this.center, this.halfWidth, this.halfHeight), Vector.addXY(this.center, this.halfWidth, this.halfHeight));
  }

  drag(position, delta) {
    this.center.add(delta);
  }

  click(position) {
    this.skin++;
    this.skin %= images.lamps.length;
  }

  render() {
    drawImage(images.lamps[this.skin], this.center, this.angle);
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
      drawImage(images.lamps[this.skin], body.position, body.angle);
    };
    super.addUserCallback(body);
    return [body];
  }
}
