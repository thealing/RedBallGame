class Platform extends Item {
  constructor(name, position) {
    super(name);
    this.zIndex = 1;
    this.start = Vector.addXY(position, -100, 0);
    this.end = Vector.addXY(position, 100, 0);
  }

  testPoint(point) {
    return distanceFromSegment(point, this.start, this.end) < 10;
  }

  drag(position, delta) {
    if (!position) {
      this.start.add(delta);
      this.end.add(delta);
    }
    else {
      const distanceFromStart = Vector.distance(position, this.start);
      const distanceFromEnd = Vector.distance(position, this.end);
      if (distanceFromStart < 40 && distanceFromEnd >= 40) {
        this.start.add(delta);
      }
      else if (distanceFromEnd < 40 && distanceFromStart >= 40) {
        this.end.add(delta);
      }
      else {
        this.start.add(delta);
        this.end.add(delta);
      }
    }
    const length = this.getLength();
    const minLength = 60;
    if (length > 0 && length < minLength) {
      const offset = Vector.subtract(this.end, this.start).multiply(80 / minLength);
      this.start.add(offset);
      this.end.subtract(offset);
    }
  }

  render() {
    drawImage(images.platform, this.getCenter(), this.getAngle(), { x: this.getLength() / 200, y: 1 });
    drawImage(images.platform_end, this.start, this.getAngle());
    drawImage(images.platform_end, this.end, this.getAngle());
  }

  createBodies(world) {
    const center = this.getCenter();
    const length = this.getLength();
    const angle = this.getAngle();
    const [body, collider] = Physics.createRectangleBody(world, center.x, center.y, length, 16);
    body.type = PhysicsBodyType.STATIC;
    body.angle = angle;
    body.gadgetType = 2;
    body.zIndex = this.zIndex;
    body.renderProc = () => {
      drawImage(images.platform, body.position, body.angle, { x: length / 200, y: 1 });
      drawImage(images.platform_end, { x: body.position.x - length / 2 * Math.cos(body.angle), y: body.position.y - length / 2 * Math.sin(body.angle) }, body.angle);
      drawImage(images.platform_end, { x: body.position.x + length / 2 * Math.cos(body.angle), y: body.position.y + length / 2 * Math.sin(body.angle) }, body.angle);
    };
    super.extendBody(body);
    return [body];
  }

  getLength() {
    return Vector.distance(this.start, this.end);
  }

  getCenter() {
    return Vector.middle(this.start, this.end);
  }

  getAngle() {
    return Math.atan2(this.end.y - this.start.y, this.end.x - this.start.x);
  }
}
