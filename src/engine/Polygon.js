class Polygon {
  constructor(points) {
    this.type = ShapeType.POLYGON;
    this.set(points);
  }

  clone() {
    return new Polygon(this.points.map((item) => item.clone()));
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
      centroid.add(Vector.middle(a, b).multiply(d));
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
    let centroid = this.getCentroid();
    let numer = 0;
    let denom = 0;
    for (let i = this.points.length - 1, j = 0; j < this.points.length; i = j, j++) {
      const a = Vector.subtract(this.points[i], centroid);
      const b = Vector.subtract(this.points[j], centroid);
      numer += Vector.cross(a, b) * (Vector.dot(a, a) + Vector.dot(a, b) + Vector.dot(b, b));
      denom += Vector.cross(a, b);
    }
    denom *= 12;
    return numer / denom;
  }

  containsPoint(point) {
    for (let i = this.points.length - 1, j = 0; j < this.points.length; i = j, j++) {
      const edge = Vector.subtract(this.points[j], this.points[i]);
      const d = Vector.subtract(point, this.points[i]);
      if (Vector.cross(edge, d) < 0) {
        return false;
      }
    }
    return true;
  }
}
