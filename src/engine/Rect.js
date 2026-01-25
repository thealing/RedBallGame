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
