class Laser extends Platform {
  render() {
    drawImage(images.laser, this.getCenter(), this.getAngle(), { x: this.getLength() / 200, y: 1 });
    drawImage(images.laser_end, this.start, this.getAngle());
    drawImage(images.laser_end, this.end, this.getAngle());
  }

  createBodies(world) {
    const center = this.getCenter();
    const length = this.getLength();
    const angle = this.getAngle();
    const [body, collider] = Physics.createRectangleBody(world, center.x, center.y, length, 16, { static: true });
    body.angle = angle;
    body.gadgetType = 4;
    body.zIndex = this.zIndex;
    body.deadly = true;
    body.staticFriction = 0;
    body.dynamicFriction = 0;
    body.renderProc = () => {
      drawImage(images.laser, body.position, body.angle, { x: length / 200, y: 1 });
      drawImage(images.laser_end, { x: body.position.x - length / 2 * Math.cos(body.angle), y: body.position.y - length / 2 * Math.sin(body.angle) }, body.angle);
      drawImage(images.laser_end, { x: body.position.x + length / 2 * Math.cos(body.angle), y: body.position.y + length / 2 * Math.sin(body.angle) }, body.angle);
    };
    super.extendBody(body);
    return [body];
  }
}
