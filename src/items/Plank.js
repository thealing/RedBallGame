class Plank extends Platform {
  render() {
    drawImage(images.plank, this.getCenter(), this.getAngle(), { x: this.getLength() / 200, y: 1 });
    drawImage(images.plank_end, this.start, this.getAngle());
    drawImage(images.plank_end, this.end, this.getAngle());
  }

  createBodies(world) {
    const center = this.getCenter();
    const length = this.getLength();
    const angle = this.getAngle();
    const [body, collider] = Physics.createRectangleBody(world, center.x, center.y, length, 16);
    body.angle = angle;
    body.gadgetType = 2;
    body.zIndex = this.zIndex;
    body.renderProc = () => {
      drawImage(images.plank, body.position, body.angle, { x: length / 200, y: 1 });
      drawImage(images.plank_end, { x: body.position.x - length / 2 * Math.cos(body.angle), y: body.position.y - length / 2 * Math.sin(body.angle) }, body.angle);
      drawImage(images.plank_end, { x: body.position.x + length / 2 * Math.cos(body.angle), y: body.position.y + length / 2 * Math.sin(body.angle) }, body.angle);
    };
    super.extendBody(body);
    return [body];
  }
}
