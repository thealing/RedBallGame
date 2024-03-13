class ShapeType {
  static CIRCLE = 0;
  static POLYGON = 1;
  static COUNT = 2;
};

class PhysicsBodyType {
  static DYNAMIC = 0;
  static STATIC = 1;
  static KINEMATIC = 1;
};

class PhysicsJointType {
  static FIXED = 0;
  static PIN = 1;
};

class Circle {
  constructor(center, radius) {
    this.type = ShapeType.CIRCLE;
    this.set(center, radius);
  }

  clone() {
    return new Circle(this.center.clone(), this.radius);
  }

  set(center, radius) {
    this.center = center;
    this.radius = radius;
    return this;
  }

  transform(tf) {
    this.center = this.center.transform(tf);
    return this;
  }

  transformOf(that, tf) {
    this.center.transformOf(that.center, tf);
    this.radius = that.radius;
  }

  getBoundingRect(rect) {
    rect.min.copy(this.center).subtractScalar(this.radius);
    rect.max.copy(this.center).addScalar(this.radius);
  }

  getCentroid() {
    return this.center.clone();
  }

  getLinearMassFactor() {
    return this.radius ** 2 * Math.PI;
  }

  getAngularMassFactor() {
    return this.radius ** 2 / 2;
  }
}

class Polygon {
  constructor(points) {
    this.type = ShapeType.POLYGON;
    this.set(points);
  }

  clone() {
    return new Polygon(Util.cloneArray(this.points));
  }

  set(points) {
    this.points = points;
    if (this.getLinearMassFactor() < 0) {
      this.points.reverse();
    }
    return this;
  }

  transform(tf) {
    for (let i = 0; i < this.points.length; i++) {
      this.points[i].transform(tf);
    }
    return this;
  }

  transformOf(that, tf) {
    for (let i = 0; i < this.points.length; i++) {
      this.points[i].transformOf(that.points[i], tf);
    }
    return this;
  }

  getBoundingRect(rect) {
    rect.min.set(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    rect.max.set(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    for (let i = 0; i < this.points.length; i++) {
      rect.min.x = Math.min(rect.min.x, this.points[i].x);
      rect.min.y = Math.min(rect.min.y, this.points[i].y);
      rect.max.x = Math.max(rect.max.x, this.points[i].x);
      rect.max.y = Math.max(rect.max.y, this.points[i].y);
    }
  }

  getCentroid() {
    let centroid = new Vector(0, 0);
    let weight = 0;
    for (let i = this.points.length - 1, j = 0; j < this.points.length; i = j, j++) {
      const a = this.points[i];
      const b = this.points[j];
      const d = Vector.distance(a, b);
      centroid.add(Vector.add(a, b).multiply(d));
      weight += d;
    }
    return centroid.divide(weight);
  }

  getLinearMassFactor() {
    if (this.points.length == 2) {
      return Vector.distance(this.points[0], this.points[1]);
    }
    let area = 0;
    for (let i = this.points.length - 1, j = 0; j < this.points.length; i = j, j++) {
      const a = this.points[i];
      const b = this.points[j];
      area += Vector.cross(a, b);
    }
    area /= 2;
    return area;
  }

  getAngularMassFactor() {
    if (this.points.length == 2) {
      return Vector.distanceSquared(this.points[0], this.points[1]) / 12;
    }
    let numer = 0;
    let denom = 0;
    for (let i = this.points.length - 1, j = 0; j < this.points.length; i = j, j++) {
      const a = this.points[i];
      const b = this.points[j];
      numer += Vector.cross(a, b) * (Vector.dot(a, a) + Vector.dot(a, b) + Vector.dot(b, b));
      denom += Vector.cross(a, b) * 6;
    }
    return numer / denom - this.getCentroid().length();
  }
}

class Rect {
  constructor(min, max) {
    this.set(min, max);
  }

  clone() {
    return new Rect(this.min.clone(), this.max.clone());
  }

  set(min, max) {
    this.min = min;
    this.max = max;
    return this;
  }

  testPoint(point) {
    return point.x >= this.min.x && point.y >= this.min.y && point.x <= this.max.x && point.y <= this.max.y;
  }
}

class CollisionFilter {
  constructor(category, mask, group) {
    this.category = category;
    this.mask = mask;
    this.group = group;
  }

  test(that) {
    if (this.group == that.group) {
      if (this.group > 0) {
        return true;
      }
      if (this.group < 0) {
        return false;
      }
    }
    return (this.category & that.mask) && (this.mask & that.category);
  }
}

class PhysicsCounters {
  constructor() {
    this.stepDurations = [];
    this.reset();
  }

  reset() {
    this.bodies = 0;
    this.colliders = 0;
    this.springs = 0;
    this.joints = 0;
    this.boundingRectsSkipped = 0;
    this.boundingRectsTested = 0;
    this.shapesTested = 0;
    this.collisionsDetected = 0;
    this.collisionsHandled = 0;
    this.stepDurationAverage = 0;
  }
}

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
        if (!collider1.filter.test(collider2.filter)) {
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
      let frictionInpulse = -tangentVelocity * combinedStaticFriction / (tangentInverseMass1 + tangentInverseMass2);
      if (Math.abs(frictionInpulse) > Math.abs(collisionImpulse) * combinedStaticFriction) {
        frictionInpulse = Math.sign(frictionInpulse) * Math.abs(collisionImpulse) * combinedDynamicFriction;
      }
      body1.linearVelocity.subtractScaled(collisionTangent, frictionInpulse * body1._inverseLinearMass);
      body2.linearVelocity.addScaled(collisionTangent, frictionInpulse * body2._inverseLinearMass);
      body1.angularVelocity -= Vector.dot(collisionTangent, tangent1) * frictionInpulse * body1._inverseAngularMass;
      body2.angularVelocity += Vector.dot(collisionTangent, tangent2) * frictionInpulse * body2._inverseAngularMass;
    }
    for (let i = 0; i < 1; i++) {
      for (const {collider1, collider2, collision} of collisions) {
        const body1 = collider1.body;
        const body2 = collider2.body;
        const tangent1 = Vector.subtract(collision.point, body1.position).rotateLeft();
        const tangent2 = Vector.subtract(collision.point, body2.position).rotateLeft();
        const contactVelocity1 = Vector.multiply(tangent1, body1.angularVelocity + body1.angularVelocityCorrection).add(body1.linearVelocity).add(body1.linearVelocityCorrection);
        const contactVelocity2 = Vector.multiply(tangent2, body2.angularVelocity + body2.angularVelocityCorrection).add(body2.linearVelocity).add(body2.linearVelocityCorrection);
        const relativeVelocity = Vector.subtract(contactVelocity2, contactVelocity1);
        const normalVelocity = Vector.dot(collision.normal, relativeVelocity);
        let correctionInpulse = collision.depth / deltaTime - normalVelocity;
        if (correctionInpulse <= 0) {
          continue;
        }
        const inverseMass1 = body1._inverseLinearMass + body1._inverseAngularMass * Vector.dot(collision.normal, tangent1) ** 2;
        const inverseMass2 = body2._inverseLinearMass + body2._inverseAngularMass * Vector.dot(collision.normal, tangent2) ** 2;
        correctionInpulse /= inverseMass1 + inverseMass2;
        body1._applyCorrectionImpulse(collision.point, Vector.multiply(collision.normal, -correctionInpulse));
        body2._applyCorrectionImpulse(collision.point, Vector.multiply(collision.normal, correctionInpulse));
      }
    }
    for (const body of this.bodies) {
      if (body.type == PhysicsBodyType.STATIC) {
        continue;
      }
      body.position.add(Vector.add(body.linearVelocity, body.linearVelocityCorrection).multiply(deltaTime));
      body.angle += (body.angularVelocity + body.angularVelocityCorrection) * deltaTime;
      body.linearVelocity.add(Vector.multiply(body.linearVelocityCorrection, Physics.correctionVelocityGain));
      body.angularVelocity += body.angularVelocityCorrection * Physics.correctionVelocityGain;
      body.linearVelocityCorrection.multiply(0);
      body.angularVelocityCorrection *= 0;
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
		if (this.counters.stepDurations.length == 120) {
			this.counters.stepDurations.shift();
		}
    this.counters.stepDurations.push(stepEndTime - stepStartTime);
    this.counters.stepDurationAverage = Util.averageOfArray(this.counters.stepDurations);
  }
}

class PhysicsBody {
  constructor(world, type) {
    this.world = world;
    this.nodeInWorld = world.bodies.insertLast(this);
    this.type = type;
    this.localCenterOfMass = new Vector(0, 0);
    this.worldCenterOfMass = new Vector(0, 0);
    this.inverseLinearMass = 0;
    this.inverseAngularMass = 0;
    this.position = new Vector(0, 0);
    this.angle = 0;
    this.linearVelocity = new Vector(0, 0);
    this.angularVelocity = 0;
    this.linearForce = new Vector(0, 0);
    this.angularForce = 0;
    this.linearVelocityCorrection = new Vector(0, 0);
    this.angularVelocityCorrection = 0;
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
    this.linearVelocityCorrection.add(impulse.clone().multiply(this._inverseLinearMass));
    this.angularVelocityCorrection += Vector.cross(point.clone().subtract(this.position), impulse) * this._inverseAngularMass;
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
    this.worldCenterOfMass.transformOf(this.localCenterOfMass, transform);
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
    const bodyCenterOfMass = this.localCenterOfMass.clone();
    const bodyLinearMass = this.inverseLinearMass == 0 ? 0 : 1 / this.inverseLinearMass;
    const bodyAngularMass = this.inverseAngularMass == 0 ? 0 : 1 / this.inverseAngularMass;
    const colliderCenterOfMass = collider.localShape.getCentroid();
    const colliderLinearMass = collider.localShape.getLinearMassFactor() * collider.density;
    const colliderAngularMass = collider.localShape.getAngularMassFactor() * colliderLinearMass;
    const newCenterOfMass = Vector.multiply(bodyCenterOfMass, bodyLinearMass).addScaled(colliderCenterOfMass, colliderLinearMass).divide(bodyLinearMass + colliderLinearMass);
    const newLinearMass = bodyLinearMass + colliderLinearMass;
    const newAngularMass = bodyAngularMass + bodyLinearMass * Vector.distanceSquared(bodyCenterOfMass, newCenterOfMass) + colliderAngularMass + colliderLinearMass * Vector.distanceSquared(colliderCenterOfMass, newCenterOfMass);
    this.localCenterOfMass = newCenterOfMass;
    this.inverseLinearMass = newLinearMass == 0 ? 0 : 1 / newLinearMass;
    this.inverseAngularMass = newAngularMass == 0 ? 0 : 1 / newAngularMass;
  }

  _subtractColliderMass(collider) {
    const bodyCenterOfMass = this.localCenterOfMass.clone();
    const bodyLinearMass = this.inverseLinearMass == 0 ? 0 : 1 / this.inverseLinearMass;
    const bodyAngularMass = this.inverseAngularMass == 0 ? 0 : 1 / this.inverseAngularMass;
    const colliderCenterOfMass = collider.localShape.getCentroid();
    const colliderLinearMass = collider.localShape.getLinearMassFactor() * collider.density;
    const colliderAngularMass = collider.localShape.getAngularMassFactor() * colliderLinearMass;
    const newCenterOfMass = Vector.multiply(bodyCenterOfMass, bodyLinearMass).subtractScaled(colliderCenterOfMass, colliderLinearMass).divide(bodyLinearMass - colliderLinearMass);
    const newLinearMass = bodyLinearMass - colliderLinearMass;
    const newAngularMass = bodyAngularMass + bodyLinearMass * Vector.distanceSquared(bodyCenterOfMass, newCenterOfMass) - colliderAngularMass - colliderLinearMass * Vector.distanceSquared(colliderCenterOfMass, newCenterOfMass);
    this.localCenterOfMass = newCenterOfMass;
    this.inverseLinearMass = newLinearMass == 0 ? 0 : 1 / newLinearMass;
    this.inverseAngularMass = newAngularMass == 0 ? 0 : 1 / newAngularMass;
  }
}

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
    this.filter = new CollisionFilter(0xFFFFFFFF, 0xFFFFFFFF, 0);
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

class PhysicsSpring {
  
}

class PhysicsJoint {

}

class Geometry {
  static createSegment(a, b) {
    return new Polygon([a, b]);
  }

  static createCircle(a, b, c) {
    return new Circle(new Vector(a, b), c);
  }

  static createSquare(x, y, a) {
    return new Polygon([
      new Vector(x - a, y - a), 
      new Vector(x + a, y - a), 
      new Vector(x + a, y + a), 
      new Vector(x - a, y + a)
    ]);
  }

  static createRectangle(x, y, w, h) {
    return new Polygon([
      new Vector(x - w / 2, y - h / 2),
      new Vector(x + w / 2, y - h / 2),
      new Vector(x + w / 2, y + h / 2),
      new Vector(x - w / 2, y + h / 2),
    ]);
  }

  static createRotatedRectangle(x, y, w, h, a) {
    return new Polygon([
      new Vector(0 - w / 2, 0 - h / 2).rotate(a).add(new Vector(x, y)),
      new Vector(0 + w / 2, 0 - h / 2).rotate(a).add(new Vector(x, y)),
      new Vector(0 + w / 2, 0 + h / 2).rotate(a).add(new Vector(x, y)),
      new Vector(0 - w / 2, 0 + h / 2).rotate(a).add(new Vector(x, y)),
    ]);
  }

  static projectOntoLine(a, b, p) {
    const ab = Vector.subtract(b, a);
    const t = Vector.dot(ab, Vector.subtract(p, a)) / ab.lengthSquared();
    return ab.multiply(t).add(a);
  }

  static projectOntoSegment(a, b, p) {
    const ab = Vector.subtract(b, a);
    const t = Util.clamp(Vector.dot(ab, Vector.subtract(p, a)) / ab.lengthSquared(), 0, 1);
    return ab.multiply(t).add(a);
  }

  static collideShapes(shape1, shape2) {
    switch (shape1.type * ShapeType.COUNT + shape2.type) {
      case ShapeType.CIRCLE * ShapeType.COUNT + ShapeType.CIRCLE: {
        return Geometry.collideCircles(shape1, shape2);
      }
      case ShapeType.POLYGON * ShapeType.COUNT + ShapeType.POLYGON: {
        return Geometry.collidePolygons(shape1, shape2);
      }
      case ShapeType.CIRCLE * ShapeType.COUNT + ShapeType.POLYGON: {
        return Geometry.collideCirclePolygon(shape1, shape2);
      }
      case ShapeType.POLYGON * ShapeType.COUNT + ShapeType.CIRCLE: {
        const collision = Geometry.collideCirclePolygon(shape2, shape1);
        if (collision != null) {
          collision.normal.negate();
        }
        return collision;
      }
    }
  }

  static collideCircles(circle1, circle2) {
    const centerDistanceSquared = Vector.distanceSquared(circle1.center, circle2.center);
    const sumOfRadii = circle1.radius + circle2.radius;
    if (centerDistanceSquared > sumOfRadii ** 2) {
      return null;
    }
    if (centerDistanceSquared == 0) {
      return null;
    }
    return { 
      point: Vector.middle(circle1.center, circle2.center), 
      normal: Vector.subtract(circle2.center, circle1.center).normalize(),
      depth: sumOfRadii - Math.sqrt(centerDistanceSquared),
    };
  }

  static collidePolygons(polygon1, polygon2) {
    let collisionDepth = Number.POSITIVE_INFINITY;
    let collisionPoint = null;
    let collisionNormal = null;
    for (let i = polygon1.points.length - 1, j = 0; j < polygon1.points.length; i = j, j++) {
      const a = polygon1.points[i];
      const b = polygon1.points[j];
      if (Vector.equal(a, b)) {
        continue;
      }
      const axis = Vector.subtract(b, a).rotateRight().normalize();
      let depthMax = Number.NEGATIVE_INFINITY;
      let deepestPoint = new Vector();
      for (const point of polygon2.points) {
        const depth = Vector.dot(a, axis) - Vector.dot(point, axis);
        if (depth > depthMax) {
          depthMax = depth;
          deepestPoint.copy(point);
        }
        else if (depth == depthMax) {
          deepestPoint = deepestPoint.add(point).divide(2);
        }
      }
      if (depthMax < 0) {
        return null;
      }
      if (depthMax < collisionDepth) {
        collisionDepth = depthMax;
        collisionPoint = deepestPoint;
        collisionNormal = axis;
      }
    }
    for (let i = polygon2.points.length - 1, j = 0; j < polygon2.points.length; i = j, j++) {
      const a = polygon2.points[i];
      const b = polygon2.points[j];
      if (Vector.equal(a, b)) {
        continue;
      }
      const axis = Vector.subtract(b, a).rotateLeft().normalize();
      let depthMax = Number.NEGATIVE_INFINITY;
      let deepestPoint = new Vector();
      for (const point of polygon1.points) {
        const depth = Vector.dot(point, axis) - Vector.dot(a, axis);
        if (depth > depthMax) {
          depthMax = depth;
          deepestPoint.copy(point);
        }
        else if (depth == depthMax) {
          deepestPoint = deepestPoint.add(point).divide(2);
        }
      }
      if (depthMax < 0) {
        return null;
      }
      if (depthMax < collisionDepth) {
        collisionDepth = depthMax;
        collisionPoint = deepestPoint;
        collisionNormal = axis;
      }
    }
    return {
      point: collisionPoint,
      normal: collisionNormal,
      depth: collisionDepth,
    };
  }

  static collideCirclePolygon(circle, polygon) {
    let collisionDepth = Number.POSITIVE_INFINITY;
    let collisionPoint = null;
    let collisionNormal = null;
    for (let i = polygon.points.length - 1, j = 0; j < polygon.points.length; i = j, j++) {
      const a = polygon.points[i];
      const b = polygon.points[j];
      if (Vector.equal(a, b)) {
        continue;
      }
      const axis = Vector.subtract(b, a).rotateLeft();
      const centerProjected = Geometry.projectOntoSegment(a, b, circle.center);
      if (!Vector.equal(centerProjected, circle.center)) {
        if (Vector.dot(circle.center, axis) >= Vector.dot(centerProjected, axis)) {
          axis.copy(circle.center).subtract(centerProjected);
        }
        else {
          axis.copy(centerProjected).subtract(circle.center);
        }
        axis.normalize();
      }
      const depth = circle.radius + Vector.dot(circle.center, axis) - Vector.dot(centerProjected, axis);
      if (depth < 0) {
        return null;
      }
      if (depth < collisionDepth) {
        collisionDepth = depth;
        collisionPoint = centerProjected;
        collisionNormal = axis;
      }
    }
    return {
      point: collisionPoint,
      normal: collisionNormal,
      depth: collisionDepth,
    };
  }
}

class Physics {
  static velocityIterations = 10;
  static correctionVelocityGain = 0.2;

  static collide(collider1, collider2) {
    const collision = Geometry.collideShapes(collider1.worldShape, collider2.worldShape);
    return collision == null ? null : {collider1, collider2, collision};
  }

  static createSegmentBody(world, x0, y0, x1, y1, ret) {
    const body = world.createBody(ret?.static ? PhysicsBodyType.STATIC : PhysicsBodyType.DYNAMIC);
    const collider = body.createCollider(Geometry.createSegment(new Vector(x0, y0), new Vector(x1, y1)), 1);
    if (ret) {
      ret.coll = collider;
    }
    return body;
  }

  static createCircleBody(world, x, y, r, ret) {
    const body = world.createBody(PhysicsBodyType.DYNAMIC);
    const collider = body.createCollider(new Circle(new Vector(0, 0), r), 1);
    body.position.x = x;
    body.position.y = y;
    if (ret) {
      ret.coll = collider;
    }
    return body;
  }

  static createRectangleBody(world, x, y, w, h, ret) {
    return this.createRectangleBodyWithOffset(world, x, y, 0, 0, w, h, ret);
  }

  static createRectangleBodyWithOffset(world, x, y, ox, oy, w, h, ret) {
    const body = world.createBody(ret?.static ? PhysicsBodyType.STATIC : PhysicsBodyType.DYNAMIC);
    const collider = body.createCollider(new Polygon([
      new Vector(ox - w / 2, oy - h / 2),
      new Vector(ox + w / 2, oy - h / 2),
      new Vector(ox + w / 2, oy + h / 2),
      new Vector(ox - w / 2, oy + h / 2),
    ]), 1);
    body.position.x = x;
    body.position.y = y;
    if (ret) {
      ret.coll = collider;
    }
    return body;
  }
}
