class PhysicsUtil {
  static createTerrainBodies(world, terrain) {
    const bodies = [];
    for (const polyline of terrain) {
      if (!bodies[polyline.index]) {
        bodies[polyline.index] = world.createBody(PhysicsBodyType.STATIC);
        Object.assign(bodies[polyline.index], EditorScene.terrainTypes[polyline.index]);
      }
      if (polyline.filled) {
        const points = [];
        const half = polyline.width / 2;
        let orderedPolyline = [];
        for (let i = 0; i < polyline.length; i++) {
          orderedPolyline[i] = polyline[i].clone();
        }
        const polygon = new Polygon(orderedPolyline);
        if (polygon.getLinearMassFactor() > 0) {
          orderedPolyline.reverse();
        }
        for (let i = 0; i + 1 < orderedPolyline.length; i++) {
          const a = orderedPolyline[i];
          const b = orderedPolyline[i + 1];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy);
          if (len == 0) {
            continue;
          }
          const nx = -dy / len;
          const ny =  dx / len;
          points.push(new Vector(a.x + nx * half, a.y + ny * half), new Vector(b.x + nx * half, b.y + ny * half));
        }
        const collider = bodies[polyline.index].createCollider(new Polygon(points), 1);
        Object.assign(collider, EditorScene.terrainTypes[polyline.index]);
      }
      else {
        for (let i = 0; i + 1 < polyline.length; i++) {
          const a = polyline[i];
          const b = polyline[i + 1];
          const middle = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
          const distance = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
          const angle = Math.atan2(b.y - a.y, b.x - a.x);
          const rectangle = Geometry.createRotatedRectangle(middle.x, middle.y, distance, polyline.width, angle);
          const collider = bodies[polyline.index].createCollider(rectangle, 1);
          Object.assign(collider, EditorScene.terrainTypes[polyline.index]);
        }
        const circles = [];
        circles.push(Geometry.createCircle(polyline[0].x, polyline[0].y, polyline.width / 2));
        circles.push(Geometry.createCircle(polyline[polyline.length - 1].x, polyline[polyline.length - 1].y, polyline.width / 2));
        for (const circle of circles) {
          const collider = bodies[polyline.index].createCollider(circle, 1);
          Object.assign(collider, EditorScene.terrainTypes[polyline.index]);
        }
      }
    }
    const result = [];
    for (const body of bodies) {
      if (body) {
        result.push(body);
      }
    }
    return result;
  }
  
  static testBodies(body1, body2) {
    for (const collider1 of body1.colliders) {
      for (const collider2 of body2.colliders) {
        if (Physics.collide(collider1, collider2)) {
          return true;
        }
      }
    }
    return false;
  }
}
