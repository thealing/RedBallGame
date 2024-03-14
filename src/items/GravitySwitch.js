class GravitySwitch extends Item {
  constructor(name, position) {
    super(name);
    this.zIndex = -2;
    this.center = position;
    this.radius = 55;
  }

  testPoint(point) {
    return Vector.distance(this.center, point) <= this.radius;
  }

  drag(position, delta) {
    this.center.add(delta);
  }

  render() {
    drawImage(images.gravity_down, this.center);
  }

  createBodies(world) {
    const [body, collider] = Physics.createCircleBody(world, this.center.x, this.center.y, this.radius);
    collider.sensor = true;
    body.zIndex = this.zIndex;
    body.type = PhysicsBodyType.STATIC;
    body.updateProc = () => {
      if (body.isTouchingPlayer && !body.wasTouchingPlayer) {
        world.gravity.negate();
      }
      body.wasTouchingPlayer = body.isTouchingPlayer;
      body.isTouchingPlayer = false;
    };
    body.renderProc = () => {
      drawImage(world.gravity.y > 0 ? images.gravity_down : images.gravity_up, body.position);
    };
    body.onCollisionWithPlayer = () => {
      body.isTouchingPlayer = true;
    };
    body.gadgetType = 1;
    super.extendBody(body);
    return [body];
  }
}
