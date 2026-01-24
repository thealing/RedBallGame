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
    showForm([
      {
        label: 'Name',
        type: 'text',
        get: () => this.name,
        set: (value) => this.name = value
      }
    ]);
  }

  extendBody(obj) {
    obj.name = this.name;
    obj.typeName = this.typeName;
  }

  unproject(point, centerOfProjection) {
    centerOfProjection ??= this.center;
    return Vector.subtract(point, centerOfProjection).rotate(-this.angle).add(centerOfProjection);
  }
}


