class PhysicsBody {
  constructor(world, type) {
    this.world = world;
    this.nodeInWorld = world.bodies.insertLast(this);
    this.type = type;
    this.inverseLinearMass = 0;
    this.inverseAngularMass = 0;
    this.centerOfMass = new Vector(0, 0);
    this.position = new Vector(0, 0);
    this.angle = 0;
    this.linearVelocity = new Vector(0, 0);
    this.angularVelocity = 0;
    this.linearForce = new Vector(0, 0);
    this.angularForce = 0;
    this.worldTransformIsDirty = false;
    this.colliders = new List();
    this.springs = new List();
    this.joints = new List();
    this._prevPosition = new Vector(0, 0);
    this._prevAngle = 0;
    this._inverseLinearMass = 0;
    this._inverseAngularMass = 0;
  }

  destroy() {
    if (this.world._inStep) {
      this.world._bodiesToDestroy.push(this);
      return;
    }
    this.destroyAllColliders();
    this.destroyAllSprings();
    this.destroyAllJoints();
    this.nodeInWorld.remove();
    this.nodeInWorld = null;
    this.world = null;
  }

  createCollider(shape, density) {
    return new PhysicsCollider(this, shape, density);
  }

  destroyAllColliders() {
    for (const collider of this.colliders) {
      collider.destroy();
    }
  }

  destroyAllSprings() {
    for (const spring of this.springs) {
      spring.destroy();
    }
  }

  destroyAllJoints() {
    for (const joint of this.joints) {
      joint.destroy();
    }
  }

  getTransform() {
    return new Transform(this.position, this.angle);
  }

  getInverseTransform() {
    return new Transform(this.position, this.angle).invert();
  }

  applyImpulseAtLocalPoint(localPoint, impulse) {
    this.linearVelocity.add(impulse.clone().rotate(this.angle).multiply(this.inverseLinearMass));
    this.angularVelocity += Vector.cross(localPoint, impulse) * this.inverseAngularMass;
  }

  applyImpulseAtWorldPoint(worldPoint, impulse) {
    this.linearVelocity.add(impulse.clone().multiply(this.inverseLinearMass));
    this.angularVelocity += Vector.cross(worldPoint.clone().subtract(this.position), impulse) * this.inverseAngularMass;
  }

  applyForceAtCenter(force) {
    this.linearForce.add(force);
  }

  applyForceAtLocalPoint(localPoint, force) {
    this.linearForce.add(force.clone().rotate(this.angle));
    this.angularForce += Vector.cross(localPoint, force);
  }

  applyForceAtWorldPoint(worldPoint, force) {
    this.linearForce.add(force);
    this.angularForce += Vector.cross(worldPoint.clone().subtract(this.position), force);
  }

  _applyCorrectionImpulse(point, impulse) {
    this.linearVelocity.add(impulse.clone().multiply(this._inverseLinearMass));
    this.angularVelocity += Vector.cross(point.clone().subtract(this.position), impulse) * this._inverseAngularMass;
  }

  _updateWorldTransform() {
    if (!this.worldTransformIsDirty) {
      if (Vector.equal(this.position, this._prevPosition) && this.angle == this._prevAngle) {
        return;
      }
    }
    this._prevPosition.copy(this.position);
    this._prevAngle = this.angle;
    const transform = this.getTransform();
    for (const collider of this.colliders) {
      collider.worldShape.transformOf(collider.localShape, transform);
      collider.worldShape.getBoundingRect(collider.worldBoundingRect);
    }
    for (const spring of this.springs) {
      if (spring.body1 == this) {
        spring.worldAnchor1.transformOf(spring.localAnchor1, transform);
      }
      if (spring.body2 == this) {
        spring.worldAnchor2.transformOf(spring.localAnchor2, transform);
      }
    }
    for (const joint of this.joints) {
      if (joint.body1 == this) {
        joint.worldAnchor1.transformOf(joint.localAnchor1, transform);
      }
      if (joint.body2 == this) {
        joint.worldAnchor2.transformOf(joint.localAnchor2, transform);
      }
    }
    this.worldTransformIsDirty = false;
  }

  _addColliderMass(collider) {
    const bodyCenterOfMass = this.centerOfMass.clone();
    const bodyLinearMass = this.inverseLinearMass == 0 ? 0 : 1 / this.inverseLinearMass;
    const bodyAngularMass = this.inverseAngularMass == 0 ? 0 : 1 / this.inverseAngularMass;
    const colliderCenterOfMass = collider.localShape.getCentroid();
    const colliderLinearMass = collider.localShape.getLinearMassFactor() * collider.density;
    const colliderAngularMass = collider.localShape.getAngularMassFactor() * colliderLinearMass;
    const newCenterOfMass = Vector.multiply(bodyCenterOfMass, bodyLinearMass).addScaled(colliderCenterOfMass, colliderLinearMass).divide(bodyLinearMass + colliderLinearMass);
    const newLinearMass = bodyLinearMass + colliderLinearMass;
    const newAngularMass = bodyAngularMass + bodyLinearMass * Vector.distanceSquared(bodyCenterOfMass, newCenterOfMass) + colliderAngularMass + colliderLinearMass * Vector.distanceSquared(colliderCenterOfMass, newCenterOfMass);
    this.centerOfMass = newCenterOfMass;
    this.inverseLinearMass = newLinearMass == 0 ? 0 : 1 / newLinearMass;
    this.inverseAngularMass = newAngularMass == 0 ? 0 : 1 / newAngularMass;
  }

  _subtractColliderMass(collider) {
    const bodyCenterOfMass = this.centerOfMass.clone();
    const bodyLinearMass = this.inverseLinearMass == 0 ? 0 : 1 / this.inverseLinearMass;
    const bodyAngularMass = this.inverseAngularMass == 0 ? 0 : 1 / this.inverseAngularMass;
    const colliderCenterOfMass = collider.localShape.getCentroid();
    const colliderLinearMass = collider.localShape.getLinearMassFactor() * collider.density;
    const colliderAngularMass = collider.localShape.getAngularMassFactor() * colliderLinearMass;
    const newCenterOfMass = Vector.multiply(bodyCenterOfMass, bodyLinearMass).subtractScaled(colliderCenterOfMass, colliderLinearMass).divide(bodyLinearMass - colliderLinearMass);
    const newLinearMass = bodyLinearMass - colliderLinearMass;
    const newAngularMass = bodyAngularMass + bodyLinearMass * Vector.distanceSquared(bodyCenterOfMass, newCenterOfMass) - colliderAngularMass - colliderLinearMass * Vector.distanceSquared(colliderCenterOfMass, newCenterOfMass);
    this.centerOfMass = newCenterOfMass;
    this.inverseLinearMass = newLinearMass == 0 ? 0 : 1 / newLinearMass;
    this.inverseAngularMass = newAngularMass == 0 ? 0 : 1 / newAngularMass;
  }
}
