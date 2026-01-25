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

  containsPoint(point) {
    return Vector.distanceSquared(this.center, point) <= this.radius ** 2;
  }
}
