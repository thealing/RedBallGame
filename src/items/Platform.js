class Platform extends Item {
  constructor(name, position) {
    super(name);
    this.zIndex = 1;
    this.start = Vector.addXY(position, -100, 0);
    this.end = Vector.addXY(position, 100, 0);
    this.dragEnd = -1;
  }

  testPoint(point) {
    if (distanceFromSegment(point, this.start, this.end) < 10) {
      const distanceFromStart = Vector.distance(point, this.start);
      const distanceFromEnd = Vector.distance(point, this.end);
      const endTouchRange = Math.min(TOUCH_RANGE, this.getLength() / 3);
      if (distanceFromStart < endTouchRange && distanceFromEnd >= endTouchRange) {
        this.dragEnd = 1;
      }
      else if (distanceFromEnd < endTouchRange && distanceFromStart >= endTouchRange) {
        this.dragEnd = 2;
      }
      else {
        this.dragEnd = 3;
      }
    }
    else {
      this.dragEnd = -1;
      return false;
    }
    return true;
  }

  drag(position, delta) {
    if (!position) {
      this.start.add(delta);
      this.end.add(delta);
    }
    else if (this.dragEnd == 3) {
      this.dragTo(Vector.add(this.getCenter(), delta));
    }
    else {
      this.dragTo(Vector.add(position, delta));
    }
  }

  dragTo(location) {
    const minLength = 60;
    switch (this.dragEnd) {
      case 1: {
        if (!Vector.equal(location, this.end)) {
          this.start.copy(location);
          if (this.getLength() < minLength) {
            this.start.copy(Vector.subtract(this.start, this.end).normalize().multiply(minLength).add(this.end));
          }
        }
        break;
      }
      case 2: {
        if (!Vector.equal(location, this.start)) {
          this.end.copy(location);
          if (this.getLength() < minLength) {
            this.end.copy(Vector.subtract(this.end, this.start).normalize().multiply(minLength).add(this.start));
          }
        }
        break;
      }
      case 3: {
        const center = this.getCenter();
        this.start.add(location).subtract(center);
        this.end.add(location).subtract(center);
        break;
      }
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
