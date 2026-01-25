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
    const t = Math.clamp(Vector.dot(ab, Vector.subtract(p, a)) / ab.lengthSquared(), 0, 1);
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
    for (let t = 0; t < 2; t++) {
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
      [polygon1, polygon2] = [polygon2, polygon1];
      collisionNormal?.negate();
    }
    if (collisionPoint == null) {
      return null;
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
    let onClosestEdge = false;
    for (let i = polygon.points.length - 1, j = 0; j < polygon.points.length; i = j, j++) {
      const a = polygon.points[i];
      const b = polygon.points[j];
      if (Vector.equal(a, b)) {
        continue;
      }
      const ab = Vector.subtract(b, a);
      const t = Vector.dot(ab, Vector.subtract(circle.center, a)) / ab.lengthSquared();
      const centerProjected = ab.multiply(t).add(a);
      const axis = Vector.subtract(b, a).rotateLeft().normalize();
      const depth = circle.radius + Vector.dot(circle.center, axis) - Vector.dot(centerProjected, axis);
      if (depth < collisionDepth) {
        if (depth < 0) {
          return null;
        }
        collisionDepth = depth;
        collisionPoint = centerProjected;
        collisionNormal = axis;
        onClosestEdge = t >= 0 && t <= 1;
      }
    }
    if (!onClosestEdge) {
      collisionDepth = Number.NEGATIVE_INFINITY;
      collisionPoint = null;
      collisionNormal = null;
      for (let i = polygon.points.length - 1, j = 0; j < polygon.points.length; i = j, j++) {
        const a = polygon.points[i];
        const b = polygon.points[j];
        if (Vector.equal(a, b)) {
          continue;
        }
        const centerProjected = Geometry.projectOntoSegment(a, b, circle.center);
        const axis = Vector.subtract(centerProjected, circle.center);
        axis.normalize();
        const depth = circle.radius + Vector.dot(circle.center, axis) - Vector.dot(centerProjected, axis);
        if (depth > collisionDepth) {
          collisionDepth = depth;
          collisionPoint = centerProjected;
          collisionNormal = axis;
        }
      }
      if (collisionDepth < 0) {
        return null;
      }
    }
    if (collisionPoint == null) {
      return null;
    }
    return {
      point: collisionPoint,
      normal: collisionNormal,
      depth: collisionDepth,
    };
  }
}
