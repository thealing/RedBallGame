class Item {
  constructor(name) {
    this.name = name;
    this.userCallback = '(event, data, env) => {\n}\n';
  }

  testPoint(point) {
    return false;
  }

  drag(position, delta) {
  }

  rotate(angle) {
  }

  click(position) {
  }

  render() {
  }

  createBody() {
  }

  addUserCallback(obj) {
    obj.name = this.name;
    obj.typeName = this.typeName;
    try {
      obj.callback = eval(this.userCallback);
      obj.callback.bind(obj);
    }
    catch (e) {
      console.warn('Instantiation Error:\n' + e);
    }
  }

  unproject(point) {
    return Vector.subtract(point, this.center).rotate(-this.angle).add(this.center);
  }
}


