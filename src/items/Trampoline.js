class Trampoline extends Platform {
  render() {
    drawImage(images.trampoline, this.getCenter(), this.getAngle(), { x: this.getLength() / 200, y: 1 });
    drawImage(images.trampoline_end, this.start, this.getAngle());
    drawImage(images.trampoline_end, this.end, this.getAngle());
  }

  createBodies(world) {
    const center = this.getCenter();
    const length = this.getLength();
    const angle = this.getAngle();
    const body = Physics.createRectangleBody(world, center.x, center.y, length, 16);
    body.type = PhysicsBodyType.STATIC;
    body.angle = angle;
    body.gadgetType = 2;
    body.zIndex = this.zIndex;
    body.renderProc = () => {
      drawImage(images.trampoline, body.position, body.angle, { x: length / 200, y: 1 });
      drawImage(images.trampoline_end, { x: body.position.x - length / 2 * Math.cos(body.angle), y: body.position.y - length / 2 * Math.sin(body.angle) }, body.angle);
      drawImage(images.trampoline_end, { x: body.position.x + length / 2 * Math.cos(body.angle), y: body.position.y + length / 2 * Math.sin(body.angle) }, body.angle);
    };
    body.colliders.first.item.restitution = 1.1;
    super.extendBody(body);
    return [body];
  }
}
