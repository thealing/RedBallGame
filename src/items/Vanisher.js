class Vanisher extends Platform {
  constructor(name, position) {
    super(name, position);
    this.delay = 1000;
  }
  
  showOptions() {
    showForm([
      {
        label: 'Delay',
        type: 'number',
        step: 100,
        get: () => this.delay,
        set: (value) => this.delay = value
      }
    ]);
  }
  
  render() {
    drawImage(images.vanisher, this.getCenter(), this.getAngle(), { x: this.getLength() / 200, y: 1 });
    drawImage(images.vanisher_end, this.start, this.getAngle());
    drawImage(images.vanisher_end, this.end, this.getAngle());
  }

  createBodies(world) {
    const center = this.getCenter();
    const length = this.getLength();
    const angle = this.getAngle();
    const [body] = Physics.createRectangleBody(world, center.x, center.y, length, 16);
    body.type = PhysicsBodyType.STATIC;
    body.angle = angle;
    body.gadgetType = 2;
    body.zIndex = this.zIndex;
    body.renderProc = () => {
      drawImage(body.vanishTimeout ? images.vanisher_2 : images.vanisher, body.position, body.angle, { x: length / 200, y: 1 });
      drawImage(body.vanishTimeout ? images.vanisher_end_2 : images.vanisher_end, { x: body.position.x - length / 2 * Math.cos(body.angle), y: body.position.y - length / 2 * Math.sin(body.angle) }, body.angle);
      drawImage(body.vanishTimeout ? images.vanisher_end_2 : images.vanisher_end, { x: body.position.x + length / 2 * Math.cos(body.angle), y: body.position.y + length / 2 * Math.sin(body.angle) }, body.angle);
    };
    body.onCollisionWithPlayer = (point) => {
      if (!body.vanishTimeout) {
        body.vanishTimeout = setTimeoutIngame(() => {
          if (body.world) {
            body.toBeDeleted = true;
            body.destroy();
          }
        }, this.delay);
      }
    };
    super.extendBody(body);
    return [body];
  }
}
