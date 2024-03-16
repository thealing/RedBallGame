class Windmill extends PowerItem {
  constructor(name, position) {
    super(name);
    this.zIndex = -1;
    this.center = position;
    this.angle = 0;
    this.size = 400;
    this.blades = 4;
    this.speed = Math.PI * 0.5;
    this.reversed = false;
  }

  testPoint(point) {
    let result = false;
    for (let i = 0; i < this.blades; i++) {
      const angle = this.angle + Math.PI * 2 / this.blades * i;
      result ||= distanceFromSegment(point, this.center, Vector.add(this.center, Vector.polar(angle).multiply(this.size * 0.8))) <= this.size / 10;
    }
    return result;
  }

  drag(position, delta) {
    this.center.add(delta);
  }

  showOptions() {
    showForm([
      {
        label: 'Size',
        type: 'range',
        min: 1,
        max: 10,
        get: () => this.size / 100,
        set: (value) => this.size = value * 100
      },
      {
        label: 'Blades',
        type: 'range',
        min: 1,
        max: 12,
        step: 1,
        get: () => this.blades,
        set: (value) => this.blades = value
      },
      {
        label: 'Speed',
        type: 'range',
        min: Math.PI * 0.1,
        max: Math.PI * 2,
        step: 0.01,
        get: () => this.speed,
        set: (value) => this.speed = value
      },
      {
        label: 'Reversed',
        type: 'check',
        get: () => this.reversed,
        set: (value) => this.reversed = value
      },
      {
        label: 'On By Default',
        type: 'check',
        get: () => this.onByDefault,
        set: (value) => this.onByDefault = value
      },
      {
        label: 'Controller',
        type: 'text',
        get: () => this.controllerName,
        set: (value) => this.controllerName = value
      }
    ]);
  }

  render() {
    for (let i = 0; i < this.blades; i++) {
      drawImage(this.reversed ? images.windmill_blade_reverse : images.windmill_blade, this.center, this.angle + Math.PI * 2 / this.blades * i, this.size / 150);
    }
    drawImage(images.windmill_center, this.center);
  }

  createBodies(world) {
    const body = world.createBody(PhysicsBodyType.KINEMATIC);
    body.createCollider(new Circle(new Vector(0, 0), 20), 1);
    for (let i = 0; i < this.blades; i++) {
      const angle = Math.PI * 2 / this.blades * i;
      const points = [
        new Vector(0, 0),
        new Vector(0, -0.01),
        new Vector(0.448, -0.01),
        new Vector(0.437, 0.036),
      ];
      for (let point of points) {
        point.rotate(angle).multiply(2 * this.size);
        if (this.reversed) {
          point.y *= -1;
        }
      }
      body.createCollider(new Polygon(points), 1);
    }
    body.position.copy(this.center);
    body.angle = this.angle;
    body.zIndex = this.zIndex;
    body.gadgetType = 0;
    body.powerProc = () => {
      body.angularVelocity = this.speed * (this.reversed ? 1 : -1);
    };
    body.standbyProc = () => {
      body.angularVelocity = 0;
    };
    body.renderProc = () => {
      for (let i = 0; i < this.blades; i++) {
        drawImage(this.reversed ? images.windmill_blade_reverse : images.windmill_blade, body.position, body.angle + Math.PI * 2 / this.blades * i, this.size / 150);
      }
      drawImage(images.windmill_center, body.position);
    };
    super.extendBody(body);
    return [body];
  }
}
