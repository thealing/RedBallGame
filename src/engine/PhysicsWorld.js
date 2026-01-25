class PhysicsWorld {
  constructor() {
    this.gravity = new Vector(0, 0);
    this.bodies = new List();
    this.colliders = new List();
    this.springs = new List();
    this.joints = new List();
    this.counters = new PhysicsCounters();
    this._inStep = false;
    this._bodiesToDestroy = [];
    this._collidersToDestroy = [];
  }

  destroy() {
    for (const body of this.bodies) {
      body.destroy();
    }
    for (const collider of this.colliders) {
      collider.destroy();
    }
    for (const spring of this.springs) {
      spring.destroy();
    }
    for (const joint of this.joints) {
      joint.destroy();
    }
  }

  createBody(type) {
    return new PhysicsBody(this, type);
  }

  step(deltaTime) {
    this.counters.reset();
    this.counters.bodies = this.bodies.size;
    this.counters.colliders = this.colliders.size;
    this.counters.springs = this.springs.size;
    this.counters.joints = this.joints.size;
    const stepStartTime = performance.now();
    this._inStep = true;
    for (const body of this.bodies) {
      body._updateWorldTransform();
    }
    for (const body of this.bodies) {
      switch (body.type) {
        case PhysicsBodyType.DYNAMIC: {
          body.linearVelocity.addScaled(this.gravity, deltaTime);
          body.linearVelocity.addScaled(body.linearForce, body.inverseLinearMass * deltaTime);
          body.angularVelocity += body.angularForce * body.inverseAngularMass * deltaTime;
          body._inverseLinearMass = body.inverseLinearMass;
          body._inverseAngularMass = body.inverseAngularMass;
          break;
        }
        case PhysicsBodyType.STATIC: {
          body.linearVelocity.set(0, 0);
          body.angularVelocity = 0;
          body._inverseLinearMass = 0;
          body._inverseAngularMass = 0;
          break;
        }
        case PhysicsBodyType.KINEMATIC: {
          body._inverseLinearMass = 0;
          body._inverseAngularMass = 0;
          break;
        }
      }
      body.linearForce.set(0, 0);
      body.angularForce = 0;
    }
    let collisions = [];
    for (let colliderNode = this.colliders.first, next; colliderNode != null; colliderNode = next) {
      next = colliderNode.next;
      while (colliderNode.prev != null && colliderNode.item.worldBoundingRect.min.x < colliderNode.prev.item.worldBoundingRect.min.x) {
        colliderNode.swapWithPrev();
      }
    }
    for (let colliderNode1 = this.colliders.first; colliderNode1 != null; colliderNode1 = colliderNode1.next) {
      let collider1 = colliderNode1.item;
      if (!collider1.enabled) {
        continue;
      }
      for (let colliderNode2 = colliderNode1.next; colliderNode2 != null; colliderNode2 = colliderNode2.next) {
        let collider2 = colliderNode2.item;
        if (collider2.worldBoundingRect.min.x > collider1.worldBoundingRect.max.x) {
          this.counters.boundingRectsSkipped++;
          break;
        }
        if (!collider2.enabled) {
          continue;
        }
        this.counters.boundingRectsTested++;
        if (collider2.worldBoundingRect.min.y > collider1.worldBoundingRect.max.y || collider2.worldBoundingRect.max.y < collider1.worldBoundingRect.min.y) {
          continue;
        }
        if (collider1.body == collider2.body) {
          continue;
        }
        if (collider1.body.type != PhysicsBodyType.DYNAMIC && collider2.body.type != PhysicsBodyType.DYNAMIC) {
          continue;
        }
        this.counters.shapesTested++;
        const collision = Physics.collide(collider1, collider2);
        if (collision == null) {
          continue;
        }
        this.counters.collisionsDetected++;
        let skip = false;
        skip ||= collider1.body?.onPhysicsCollision?.(collider2.body, collision.collision);
        collision.collision.normal.negate();
        skip ||= collider2.body?.onPhysicsCollision?.(collider1.body, collision.collision);
        collision.collision.normal.negate();
        if (!collider1.sensor && !collider2.sensor && !skip) {
          this.counters.collisionsHandled++;
          collisions.push(collision);
        }
      }
    }
    for (const {collider1, collider2, collision} of collisions) {
      const body1 = collider1.body;
      const body2 = collider2.body;
      const tangent1 = Vector.subtract(collision.point, body1.position).rotateLeft();
      const tangent2 = Vector.subtract(collision.point, body2.position).rotateLeft();
      const contactVelocity1 = Vector.multiply(tangent1, body1.angularVelocity).add(body1.linearVelocity);
      const contactVelocity2 = Vector.multiply(tangent2, body2.angularVelocity).add(body2.linearVelocity);
      const relativeVelocity = Vector.subtract(contactVelocity2, contactVelocity1);
      const normalVelocity = Vector.dot(collision.normal, relativeVelocity);
      if (normalVelocity >= 0) {
        continue;
      }
      const combinedRestitution = Math.max(collider1.restitution, collider2.restitution);
      const normalInverseMass1 = body1._inverseLinearMass + body1._inverseAngularMass * Vector.dot(collision.normal, tangent1) ** 2;
      const normalInverseMass2 = body2._inverseLinearMass + body2._inverseAngularMass * Vector.dot(collision.normal, tangent2) ** 2;
      const collisionImpulse = -normalVelocity * (1 + combinedRestitution) / (normalInverseMass1 + normalInverseMass2);
      body1.linearVelocity.subtractScaled(collision.normal, collisionImpulse * body1._inverseLinearMass);
      body2.linearVelocity.addScaled(collision.normal, collisionImpulse * body2._inverseLinearMass);
      body1.angularVelocity -= Vector.dot(collision.normal, tangent1) * collisionImpulse * body1._inverseAngularMass;
      body2.angularVelocity += Vector.dot(collision.normal, tangent2) * collisionImpulse * body2._inverseAngularMass;
      const collisionTangent = collision.normal.clone().rotateRight();
      const tangentVelocity = Vector.dot(collisionTangent, relativeVelocity);
      const combinedStaticFriction = Math.sqrt(collider1.staticFriction * collider2.staticFriction);
      const combinedDynamicFriction = Math.sqrt(collider1.dynamicFriction * collider2.dynamicFriction);
      const tangentInverseMass1 = body1._inverseLinearMass + body1._inverseAngularMass * Vector.dot(collisionTangent, tangent1) ** 2;
      const tangentInverseMass2 = body2._inverseLinearMass + body2._inverseAngularMass * Vector.dot(collisionTangent, tangent2) ** 2;
      let frictionImpulse = -tangentVelocity / (tangentInverseMass1 + tangentInverseMass2);
      if (Math.abs(frictionImpulse) > Math.abs(collisionImpulse) * combinedStaticFriction) {
        const maxImpulseMagnitude = Math.abs(collisionImpulse) * combinedDynamicFriction;
        frictionImpulse = Math.clamp(frictionImpulse, -maxImpulseMagnitude, maxImpulseMagnitude);
      }
      body1.linearVelocity.subtractScaled(collisionTangent, frictionImpulse * body1._inverseLinearMass);
      body2.linearVelocity.addScaled(collisionTangent, frictionImpulse * body2._inverseLinearMass);
      body1.angularVelocity -= Vector.dot(collisionTangent, tangent1) * frictionImpulse * body1._inverseAngularMass;
      body2.angularVelocity += Vector.dot(collisionTangent, tangent2) * frictionImpulse * body2._inverseAngularMass;
    }
    for (const {collider1, collider2, collision} of collisions) {
      const body1 = collider1.body;
      const body2 = collider2.body;
      const tangent1 = Vector.subtract(collision.point, body1.position).rotateLeft();
      const tangent2 = Vector.subtract(collision.point, body2.position).rotateLeft();
      const contactVelocity1 = Vector.multiply(tangent1, body1.angularVelocity).add(body1.linearVelocity);
      const contactVelocity2 = Vector.multiply(tangent2, body2.angularVelocity).add(body2.linearVelocity);
      const relativeVelocity = Vector.subtract(contactVelocity2, contactVelocity1);
      const normalVelocity = Vector.dot(collision.normal, relativeVelocity);
      let correctionInpulse = collision.depth / deltaTime * 0.3 - normalVelocity;
      if (correctionInpulse <= 0) {
        continue;
      }
      const inverseMass1 = body1._inverseLinearMass + body1._inverseAngularMass * Vector.dot(collision.normal, tangent1) ** 2;
      const inverseMass2 = body2._inverseLinearMass + body2._inverseAngularMass * Vector.dot(collision.normal, tangent2) ** 2;
      correctionInpulse /= inverseMass1 + inverseMass2;
      body1._applyCorrectionImpulse(collision.point, Vector.multiply(collision.normal, -correctionInpulse));
      body2._applyCorrectionImpulse(collision.point, Vector.multiply(collision.normal, correctionInpulse));
    }
    for (const body of this.bodies) {
      if (body.type == PhysicsBodyType.STATIC) {
        continue;
      }
      body.position.add(Vector.multiply(body.linearVelocity, deltaTime));
      body.angle += body.angularVelocity * deltaTime;
      body.worldTransformIsDirty = true;
      body._updateWorldTransform();
    }
    this._inStep = false;
    for (const body of this._bodiesToDestroy) {
      body.destroy();
    }
    this._bodiesToDestroy.length = 0;
    for (const collider of this._collidersToDestroy) {
      collider.destroy();
    }
    this._collidersToDestroy.length = 0;
    const stepEndTime = performance.now();
    this.counters.stepDuration = stepEndTime - stepStartTime;
  }
}
