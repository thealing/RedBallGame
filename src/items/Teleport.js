class Teleport extends Item {
  constructor(name, position) {
    super(name);
    this.zIndex = -3;
    this.center = position;
    this.center2 = Vector.addXY(position, 100, 0);
    this.radius = 50;
    this.dragEnd = -1;
    this.color = '#fa8500';
    this.updateImages();
  }

  testPoint(point) {
    if (Vector.distance(this.center2, point) <= this.radius) {
      this.dragEnd = 1;
      return true;
    }
    if (Vector.distance(this.center, point) <= this.radius) {
      this.dragEnd = 0;
      return true;
    }
    this.dragEnd = -1;
    return false;
  }

  drag(position, delta) {
    if (!position) {
      this.center.add(delta);
      this.center2.add(delta);
    }
    else if (this.dragEnd == 0) {
      this.center.add(delta);
    }
    else if (this.dragEnd == 1) {
      this.center2.add(delta);
    }
  }

  dragTo(location) {
    if (this.dragEnd == 0) {
      this.center.copy(location);
    }
    else if (this.dragEnd == 1) {
      this.center2.copy(location);
    }
  }

  updateImages() {
    this.teleport = colorizeImage(images.teleport, this.color);
  }

  render() {
    drawImage(this.teleport, this.center, 0);
    drawImage(this.teleport, this.center2, 0);
  }

  showOptions() {
    showForm([
      {
        label: 'Name',
        type: 'text',
        get: () => this.name,
        set: (value) => this.name = value
      },
      {
        label: 'Color',
        type: 'color',
        get: () => this.color,
        set: (value) => {
          this.color = value;
          this.updateImages();
        }
      }
    ]);
  }

  createBodies(world) {
    this.updateImages();
    const [body, collider] = Physics.createCircleBody(world, this.center.x, this.center.y, this.radius - 15, { static: true });
    const [body2, collider2] = Physics.createCircleBody(world, this.center2.x, this.center2.y, this.radius - 15, { static: true });
    collider.sensor = true;
    collider2.sensor = true;
    body.zIndex = this.zIndex;
    let currentContacts = new Set();
    let previousContacts = new Set();
    body.updateProc = () => {
      previousContacts = currentContacts;
      currentContacts = new Set();
    };
    body.renderProc = () => {
      drawImage(this.teleport, body.position, 0);
      drawImage(this.teleport, body2.position, 0);
    };
    body.onCollision = (other) => {
      if (!currentContacts.has(other) && !previousContacts.has(other)) {
        other.position.copy(body2.position);
      }
      currentContacts.add(other);
    };
    body2.onCollision = (other) => {
      if (!currentContacts.has(other) && !previousContacts.has(other)) {
        other.position.copy(body.position);
      }
      currentContacts.add(other);
    };
    super.extendBody(body);
    body.gadgetType = 1;
    body2.gadgetType = 1;
    return [body, body2];
  }

  getCenter(point) {
    if (point != undefined) {
      this.testPoint(point);
      if (this.dragEnd == 1) {
        return this.center2;
      }
    }
    return this.center;
  }
}
