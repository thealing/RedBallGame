class Transform {
  constructor(v, a) {
    this.set(v, a);
  }

  clone() {
    return new Transform(this.x, this.y, this.c, this.s);
  }

  set(v, a) {
    this.x = v.x;
    this.y = v.y;
    this.c = Math.cos(a);
    this.s = Math.sin(a);
    return this;
  }

  copy(t) {
    this.x = t.x;
    this.y = t.y;
    this.c = t.c;
    this.s = t.s;
    return this;
  }

  invert() {
    return this.set(-this.c * this.x - this.s * this.y, this.s * this.x - this.c * this.y, this.c, -this.s);
  }
}
