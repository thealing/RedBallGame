class Boulder extends Item {
  constructor(name, position) {
    super(name);
    this.zIndex = 2;
    this.center = position;
    this.radius = 67.5;
  }

  testPoint(point) {
    return Vector.distanceSquared(this.center, point) <= this.radius ** 2;
  }

  drag(position, delta) {
    this.center.add(delta);
  }

  render() {
    drawImage(images.boulder, this.center, 0);
  }

  createBodies(world) {
    const ret = {};
    const body = Physics.createCircleBody(world, this.center.x, this.center.y, this.radius, ret);
    body.zIndex = this.zIndex;
    ret.coll.staticFriction = 0.6;
    ret.coll.dynamicFriction = 0.6;
    ret.coll.restitution = 0.2;
    body.gadgetType = 0;
    body.renderProc = () => {
      drawImage(images.boulder, body.position, body.angle);
    };
    super.addUserCallback(body);
    return [body];
  }
}
