class Physics {
  static collide(collider1, collider2) {
    const collision = Geometry.collideShapes(collider1.worldShape, collider2.worldShape);
    return collision == null ? null : {collider1, collider2, collision};
  }

  static createSegmentBody(world, x0, y0, x1, y1, options) {
    const body = world.createBody(options?.static ? PhysicsBodyType.STATIC : PhysicsBodyType.DYNAMIC);
    const collider = body.createCollider(Geometry.createSegment(new Vector(x0, y0), new Vector(x1, y1)), 1);
    return [body, collider];
  }

  static createCircleBody(world, x, y, r, options) {
    const body = world.createBody(options?.static ? PhysicsBodyType.STATIC : PhysicsBodyType.DYNAMIC);
    const collider = body.createCollider(new Circle(new Vector(0, 0), r), 1);
    body.position.x = x;
    body.position.y = y;
    return [body, collider];
  }

  static createRectangleBody(world, x, y, w, h, options) {
    return this.createRectangleBodyWithOffset(world, x, y, 0, 0, w, h, options);
  }

  static createRectangleBodyWithOffset(world, x, y, ox, oy, w, h, options) {
    return this.createTrapezoidBodyWithOffset(world, x, y, ox, oy, w, w, h, options);
  }

  static createTrapezoidBody(world, x, y, w0, w1, h, options) {
    return this.createTrapezoidBodyWithOffset(world, x, y, 0, 0, w0, w1, h, options);
  }

  static createTrapezoidBodyWithOffset(world, x, y, ox, oy, w0, w1, h, options) {
    const body = world.createBody(options?.static ? PhysicsBodyType.STATIC : PhysicsBodyType.DYNAMIC);
    const collider = body.createCollider(new Polygon([
      new Vector(ox - w0 / 2, oy - h / 2),
      new Vector(ox + w0 / 2, oy - h / 2),
      new Vector(ox + w1 / 2, oy + h / 2),
      new Vector(ox - w1 / 2, oy + h / 2),
    ]), 1);
    body.position.x = x;
    body.position.y = y;
    return [body, collider];
  }
}
