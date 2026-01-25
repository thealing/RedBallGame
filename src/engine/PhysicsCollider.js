class PhysicsCollider {
  constructor(body, shape, density) {
    this.body = body;
    this.nodeInBody = body.colliders.insertLast(this);
    this.nodeInWorld = body.world.colliders.insertLast(this);
    this.density = density;
    this.restitution = 0;
    this.staticFriction = 0.2;
    this.dynamicFriction = 0.2;
    this.localShape = shape.clone();
    this.worldShape = shape.clone();
    this.worldBoundingRect = new Rect(new Vector(0, 0), new Vector(0, 0));
    this.enabled = true;
    this.sensor = false;
    this.body.worldTransformIsDirty = true;
    this.body._addColliderMass(this);
  }

  destroy() {
    if (this.body.world._inStep) {
      this.body.world._collidersToDestroy.push(this);
      return;
    }
    this.body.worldTransformIsDirty = true;
    this.body._subtractColliderMass(this);
    this.nodeInWorld.remove();
    this.nodeInBody.remove();
    this.nodeInWorld = null;
    this.nodeInBody = null;
    this.body = null;
  }
}
