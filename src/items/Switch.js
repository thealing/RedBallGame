class Switch extends Item {
  constructor(name, position) {
    super(name);
    this.zIndex = 1;
    this.center = position;
    this.angle = 0;
    this.onByDefault = false;
    this.weight = 10;
  }

  testPoint(point) {
    point = this.unproject(point);
    return testPointRect(point, Vector.subtractXY(this.center, 40, 54), Vector.addXY(this.center, 40, 40));
  }

  drag(position, delta) {
    this.center.add(delta);
  }

  render() {
    drawImage(this.onByDefault ? images.switch_right : images.switch_left, this.center, this.angle);
  }

  showOptions() {
    showForm([
      {
        label: 'Toggled By Default',
        type: 'check',
        get: () => this.onByDefault,
        set: (value) => this.onByDefault = value
      }
    ]);
  }

  createBodies(world) {
    const baseBody = Physics.createRectangleBodyWithOffset(world, this.center.x, this.center.y, 0, 25, 80, 20, { static: true });
    baseBody.angle = this.angle;
    baseBody.zIndex = this.zIndex;
    const handleBody = world.createBody(PhysicsBodyType.STATIC);
    handleBody.position.copy(this.center);
    handleBody.angle = this.angle;
    handleBody.zIndex = this.zIndex;
    handleBody.toggleState = this.onByDefault;
    let handleCollider = null;
    handleBody.updateProc = () => {
      handleCollider?.destroy();
      if (handleBody.toggleState) {
        handleCollider = handleBody.createCollider(Geometry.createSegment(new Vector(0, 20), new Vector(30, -45)), 1);
      }
      else {
        handleCollider = handleBody.createCollider(Geometry.createSegment(new Vector(0, 20), new Vector(-30, -45)), 1);
      }
    };
    handleBody.renderProc = () => {
      drawImage(handleBody.toggleState ? images.switch_right : images.switch_left, this.center, this.angle);
    };
    handleBody.onCollision = (otherBody, point, normal) => {
      if (otherBody.type != PhysicsBodyType.STATIC) {
        const direction = new Vector(Math.cos(this.angle), Math.sin(this.angle));
        const handleSegment = handleCollider.worldShape.points;
        if (!handleBody.toggleState) {
          if (Vector.dot(direction, otherBody.linearVelocity) >= this.weight && Vector.dot(direction, normal) < 0) {
            handleBody.toggleState = true;
            return true;
          }
        }
        else {
          if (Vector.dot(direction, otherBody.linearVelocity) <= -this.weight && Vector.dot(direction, normal) > 0) {
            handleBody.toggleState = false;
            return true;
          }
        }
      }
    };
    handleBody.gadgetType = 0;
    super.extendBody(handleBody);
    return [baseBody, handleBody];
  }
}
