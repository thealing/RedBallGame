class Text extends Item {
  constructor(name, position) {
    super(name);
    this.zIndex = -1;
    this.center = position;
    this.text = 'ABC';
    this.size = 30;
    this.angle = 0;
    this.color = 'black';
    this.updateDimensions();
  }
  
  updateDimensions() {
    const textSize = measureText(this.text, this.size + 'px Arial', 'center');
    this.halfWidth = textSize.x / 2;
    this.halfHeight = textSize.y / 2;
  }

  testPoint(point) {
    point = this.unproject(point);
    return testPointRect(point, Vector.subtractXY(this.center, this.halfWidth, this.halfHeight), Vector.addXY(this.center, this.halfWidth, this.halfHeight));
  }

  drag(position, delta) {
    this.center.add(delta);
  }

  dragTo(location) {
    this.center.copy(location);
  }

  render() {
    context.save();
    context.fillStyle = this.color;
    drawRotatedText(this.text, this.center, this.angle, this.size + 'px Arial', 'center');
    context.restore();
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
        label: 'Text',
        type: 'text',
        get: () => this.text,
        set: (value) => {
          this.text = value || 'ABC';
          this.updateDimensions();
        }
      },
      {
        label: 'Size',
        type: 'range',
        min: 30,
        max: 500,
        get: () => this.size,
        set: (value) => {
          this.size = Math.floor(value);
          this.updateDimensions();
        }
      },
      {
        label: 'Color',
        type: 'color',
        get: () => this.color,
        set: (value) => this.color = value
      }
    ]);
  }

  createBodies(world) {
    const [body, collider] = Physics.createRectangleBody(world, this.center.x, this.center.y, this.halfWidth * 2, this.halfHeight * 2);
    collider.sensor = true;
    body.type = PhysicsBodyType.STATIC;
    body.zIndex = this.zIndex;
    body.angle = this.angle;
    body.gadgetType = 4;
    body.renderProc = () => {
      context.save();
      context.fillStyle = this.color;
      drawRotatedText(this.text, body.position, body.angle, this.size + 'px Arial', 'center');
      context.restore();
    };
    super.extendBody(body);
    return [body];
  }
}
