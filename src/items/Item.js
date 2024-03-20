class Item {
  constructor(name) {
    this.name = name;
  }

  testPoint(point) {
    return false;
  }

  drag(position, delta) {
  }

  dragTo(location) {
  }

  rotate(angle) {
  }

  click(position) {
  }

  render() {
  }

  createBody() {
  }

  showOptions() {
  }

  extendBody(obj) {
    obj.name = this.name;
    obj.typeName = this.typeName;
  }

  unproject(point, centerOfProjection) {
    centerOfProjection |= this.center;
    return Vector.subtract(point, this.center).rotate(-this.angle).add(this.center);
  }
}


