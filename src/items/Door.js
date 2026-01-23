class Door extends Item {
  constructor(name, position) {
    super(name);
    this.zIndex = 1;
    this.start = Vector.addXY(position, -100, 0);
    this.end = Vector.addXY(position, 100, 0);
    this.center = Vector.addXY(position, 0, -50);
    this.halfWidth = 25;
    this.halfHeight = 12;
    this.dragEnd = -1;
    this.color = '#fa8500';
    this.updateImages();
  }

  showOptions() {
    showForm([
      {
        label: 'Color',
        type: 'color',
        get: () => this.color,
        set: (value) => {
          this.color = value;
          this.updateImages();
        }
      }
    ]);
  }

  testPoint(point) {
    if (testPointRect(point, Vector.subtractXY(this.center, this.halfWidth, this.halfHeight), Vector.addXY(this.center, this.halfWidth, this.halfHeight))) {
      this.dragEnd = 0;
    }
    else if (distanceFromSegment(point, this.start, this.end) < 10) {
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
      this.center.add(delta);
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
      case 0: {
        this.center.copy(location);
        break;
      }
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

  updateImages() {
    this.door = colorizeImage(images.door, this.color);
    this.door_end = colorizeImage(images.door_end, this.color);
    this.key_hole = colorizeImage(images.key_hole, this.color);
    this.key = colorizeImage(images.key, this.color);
  }

  render() {
    drawImage(this.door, this.getCenter(), this.getAngle(), { x: this.getLength() / 200, y: 1 });
    drawImage(this.door_end, this.start, this.getAngle());
    drawImage(this.door_end, this.end, this.getAngle());
    drawImage(this.key_hole, this.getCenter(), this.getAngle());
    drawImage(this.key, this.center, 0);
  }

  createBodies(world) {
    this.updateImages();
    const center = this.getCenter();
    const length = this.getLength();
    const angle = this.getAngle();
    const [body, collider] = Physics.createRectangleBody(world, center.x, center.y, length, 24);
    body.type = PhysicsBodyType.STATIC;
    body.angle = angle;
    body.gadgetType = 2;
    body.zIndex = this.zIndex;
    body.renderProc = () => {
      drawImage(this.door, center, angle, { x: length / 200, y: 1 });
      drawImage(this.door_end, this.start, angle);
      drawImage(this.door_end, this.end, angle);
      drawImage(this.key_hole, center, angle);
      drawImage(this.key, this.center, 0);
    };
    const [keyBody, keyCollider] = Physics.createRectangleBody(world, this.center.x, this.center.y, this.halfWidth * 2, this.halfHeight * 2, { static: true });
    keyBody.gadgetType = 1;
    keyCollider.sensor = true;
    keyBody.onCollisionWithPlayer = () => {
      body.toBeDeleted = true;
      body.destroy();
      keyBody.toBeDeleted = true;
      keyBody.destroy();
    };
    super.extendBody(body);
    return [body, keyBody];
  }

  getLength() {
    return Vector.distance(this.start, this.end);
  }

  getCenter(point) {
    if (point != undefined) {
      this.testPoint(point);
      if (this.dragEnd == 0) {
        return this.center;
      }
      if (this.dragEnd == 1) {
        return this.start;
      }
      if (this.dragEnd == 2) {
        return this.end;
      }
    }
    return Vector.middle(this.start, this.end);
  }

  getAngle() {
    return Math.atan2(this.end.y - this.start.y, this.end.x - this.start.x);
  }
}
