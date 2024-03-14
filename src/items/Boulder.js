class Boulder extends Item {
  constructor(name, position) {
    super(name);
    this.zIndex = 2;
    this.center = position;
    this.radius0 = 67.5;
    this.radius = this.radius0;
    this.deadly = false;
  }

  testPoint(point) {
    return Vector.distanceSquared(this.center, point) <= this.radius ** 2;
  }

  drag(position, delta) {
    this.center.add(delta);
  }

  render() {
    drawImage(this.deadly ? images.boulder_deadly : images.boulder, this.center, 0, this.radius / this.radius0);
  }

  showOptions() {
    showForm([
      {
        label: 'Size',
        type: 'range',
        min: 20.0,
        max: 200.0,
        get: () => this.radius,
        set: (value) => this.radius = value
      },
      {
        label: 'Deadly',
        type: 'check',
        get: () => this.deadly,
        set: (value) => this.deadly = value
      }
    ]);
  }

  createBodies(world) {
    const [body, collider] = Physics.createCircleBody(world, this.center.x, this.center.y, this.radius);
    collider.staticFriction = 0.6;
    collider.dynamicFriction = 0.6;
    collider.restitution = 0.2;
    body.zIndex = this.zIndex;
    body.gadgetType = 0;
    body.deadly = this.deadly;
    body.renderProc = () => {
      drawImage(this.deadly ? images.boulder_deadly : images.boulder, body.position, body.angle, this.radius / this.radius0);
    };
    super.extendBody(body);
    return [body];
  }
}
